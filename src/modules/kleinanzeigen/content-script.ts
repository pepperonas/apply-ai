import { KleinanzeigenDOMService } from './services/KleinanzeigenDOMService';
import { MessageGenerator } from './services/MessageGenerator';
import { StorageService } from '../../shared/services/StorageService';
import { Logger } from '../../shared/utils/logger';
import { KleinanzeigenSettings } from './models/KleinanzeigenProduct';

/**
 * Content Script für Kleinanzeigen.de
 */
class KleinanzeigenContentScript {
  private button: HTMLElement | null = null;
  private isProcessing = false;

  constructor() {
    Logger.info('[Kleinanzeigen] Content Script initialized');
    this.init();
  }

  private init(): void {
    // Prüfe zuerst ob wir überhaupt auf Kleinanzeigen sind
    if (!window.location.hostname.includes('kleinanzeigen.de')) {
      return; // Kein Log, da wir auf FreelancerMap sein könnten
    }

    Logger.info('[Kleinanzeigen] Checking if product page...', {
      hostname: window.location.hostname,
      pathname: window.location.pathname
    });
    
    if (!KleinanzeigenDOMService.isProductPage()) {
      Logger.info('[Kleinanzeigen] Not a product page');
      return;
    }

    Logger.info('[Kleinanzeigen] Product page detected! Creating button...');
    this.createButton();
  }

  /**
   * Erstellt den "ApplyAI Kaufanfrage" Button
   */
  private createButton(): void {
    // Warte bis Seite geladen ist
    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', () => this.createButton());
      return;
    }

    const contactButton = KleinanzeigenDOMService.getContactButton();
    if (!contactButton) {
      Logger.warn('[Kleinanzeigen] Contact button not found, retrying in 1s...', {
        selector: '#viewad-contact-button',
        found: !!document.querySelector('#viewad-contact-button')
      });
      setTimeout(() => this.createButton(), 1000);
      return;
    }

    Logger.info('[Kleinanzeigen] Contact button found!', {
      id: contactButton.id,
      className: contactButton.className
    });

    // Prüfe ob Button bereits existiert
    if (document.getElementById('kleinanzeigen-ai-btn')) {
      Logger.info('[Kleinanzeigen] Button already exists');
      return;
    }

    // Erstelle Button in einem <li> Element (wie die anderen Buttons)
    const li = document.createElement('li');
    li.id = 'kleinanzeigen-ai-btn-container';
    
    const button = document.createElement('button');
    button.id = 'kleinanzeigen-ai-btn';
    button.className = 'button-tertiary full-width taller';
    button.innerHTML = `
      <i class="button-icon icon-gem"></i>
      <span>ApplyAI Kaufanfrage</span>
    `;
    button.title = 'Automatische Kaufanfrage mit Preisvorschlag';

    button.addEventListener('click', async (e) => {
      e.preventDefault();
      e.stopPropagation();
      await this.handleClick();
    });

    li.appendChild(button);

    // Finde die Liste (ul.iconlist) und füge Button hinzu
    const iconList = contactButton.closest('ul.iconlist');
    if (iconList) {
      // Füge nach dem "Nachricht schreiben" li ein
      const contactLi = contactButton.closest('li');
      if (contactLi && contactLi.nextSibling) {
        iconList.insertBefore(li, contactLi.nextSibling);
      } else {
        iconList.appendChild(li);
      }
      this.button = button;
      Logger.info('[Kleinanzeigen] Button created in iconlist');
    } else {
      // Fallback: Direkt nach dem Button einfügen
      contactButton.parentElement?.insertBefore(li, contactButton.nextSibling);
      this.button = button;
      Logger.info('[Kleinanzeigen] Button created (fallback)');
    }
  }

  /**
   * Behandelt Button-Klick
   */
  private async handleClick(): Promise<void> {
    if (this.isProcessing || !this.button) return;

    this.isProcessing = true;
    const originalHTML = this.button.innerHTML;

    try {
      // Loading State
      this.button.innerHTML = `
        <i class="button-icon icon-spinner fa-spin"></i>
        <span>Verarbeite...</span>
      `;
      this.button.style.pointerEvents = 'none';

      // Extrahiere Produktdaten
      const product = KleinanzeigenDOMService.extractProductData();
      if (!product) {
        throw new Error('Produktdaten konnten nicht extrahiert werden');
      }

      // Lade Einstellungen
      const settings = await StorageService.load<KleinanzeigenSettings>('kleinanzeigen_settings');
      if (!settings || !settings.discount) {
        throw new Error('Bitte konfiguriere zuerst den Rabatt in den Einstellungen');
      }

      // Generiere Nachricht
      const message = MessageGenerator.generatePurchaseMessage(
        product,
        settings.discount,
        settings.messageTemplate
      );

      Logger.info('[Kleinanzeigen] Message generated:', message);

      // Öffne Kontaktformular
      this.button.innerHTML = `
        <i class="button-icon icon-spinner fa-spin"></i>
        <span>Öffne Formular...</span>
      `;

      const modalOpened = await KleinanzeigenDOMService.openContactForm();
      if (!modalOpened) {
        throw new Error('Kontaktformular konnte nicht geöffnet werden');
      }

      // Warte kurz für Modal-Animation
      await new Promise(resolve => setTimeout(resolve, 500));

      // Füge Nachricht ein
      this.button.innerHTML = `
        <i class="button-icon icon-spinner fa-spin"></i>
        <span>Füge Nachricht ein...</span>
      `;

      const inserted = KleinanzeigenDOMService.insertMessage(message);
      if (!inserted) {
        throw new Error('Nachricht konnte nicht eingefügt werden');
      }

      // Success State
      this.button.innerHTML = `
        <i class="button-icon icon-check"></i>
        <span>Nachricht eingefügt!</span>
      `;
      this.button.style.backgroundColor = '#4caf50';

      Logger.info('[Kleinanzeigen] Message inserted successfully');

      // Reset nach 3 Sekunden
      setTimeout(() => {
        if (this.button) {
          this.button.innerHTML = originalHTML;
          this.button.style.pointerEvents = 'auto';
          this.button.style.backgroundColor = '';
        }
        this.isProcessing = false;
      }, 3000);

    } catch (error) {
      Logger.error('[Kleinanzeigen] Error:', error);

      // Error State
      if (this.button) {
        this.button.innerHTML = `
          <i class="button-icon icon-exclamation-triangle"></i>
          <span>Fehler</span>
        `;
        this.button.style.backgroundColor = '#f44336';
        this.button.title = error instanceof Error ? error.message : 'Unbekannter Fehler';

        setTimeout(() => {
          if (this.button) {
            this.button.innerHTML = originalHTML;
            this.button.style.pointerEvents = 'auto';
            this.button.style.backgroundColor = '';
            this.button.title = 'Automatische Kaufanfrage mit Preisvorschlag';
          }
          this.isProcessing = false;
        }, 3000);
      }
    }
  }
}

// Initialisiere Content Script
new KleinanzeigenContentScript();

