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
   * Erstellt den "Anfrage generieren" Button im Modal
   */
  private createButton(): void {
    // Warte bis Seite geladen ist
    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', () => this.createButton());
      return;
    }

    // Prüfe ob Button bereits existiert
    if (document.getElementById('kleinanzeigen-ai-btn')) {
      Logger.info('[Kleinanzeigen] Button already exists');
      return;
    }

    // Warte auf Modal (wird beim Klick auf "Nachricht schreiben" geöffnet)
    this.observeModalOpening();
    
    // Versuche auch direkt, falls Modal schon offen ist
    this.tryCreateButtonInModal();
  }

  /**
   * Beobachtet das Öffnen des Modals
   */
  private observeModalOpening(): void {
    const observer = new MutationObserver(() => {
      this.tryCreateButtonInModal();
    });

    observer.observe(document.body, {
      childList: true,
      subtree: true,
      attributes: true,
      attributeFilter: ['class', 'style']
    });
  }

  /**
   * Versucht Button im Modal zu erstellen
   */
  private tryCreateButtonInModal(): void {
    // Prüfe ob Button bereits existiert
    if (document.getElementById('kleinanzeigen-ai-btn')) {
      return;
    }

    // Finde das Modal
    const modal = document.querySelector('#viewad-contact-modal-form, .modal-dialog') as HTMLElement;
    if (!modal) {
      return;
    }

    // Finde den "Nachricht senden" Button im Modal
    const submitButton = modal.querySelector('.viewad-contact-submit, button[type="submit"]') as HTMLElement;
    if (!submitButton) {
      Logger.warn('[Kleinanzeigen] Submit button not found in modal');
      return;
    }

    Logger.info('[Kleinanzeigen] Modal and submit button found!');

    // Erstelle unseren Button
    const button = document.createElement('button');
    button.id = 'kleinanzeigen-ai-btn';
    button.type = 'button'; // Wichtig: nicht submit!
    button.className = 'button button-secondary taller';
    button.style.marginRight = '8px';
    button.innerHTML = `
      <i class="button-icon icon-gem"></i>
      <span>Anfrage generieren</span>
    `;
    button.title = 'Automatische Kaufanfrage mit Preisvorschlag';

    button.addEventListener('click', async (e) => {
      e.preventDefault();
      e.stopPropagation();
      await this.handleClick();
    });

    // Füge Button VOR dem "Nachricht senden" Button ein
    submitButton.parentElement?.insertBefore(button, submitButton);
    this.button = button;

    Logger.info('[Kleinanzeigen] Button created in modal next to submit button');
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
        <span>Generiere...</span>
      `;
      this.button.style.pointerEvents = 'none';

      // Extrahiere Produktdaten
      const product = KleinanzeigenDOMService.extractProductData();
      if (!product) {
        throw new Error('Produktdaten konnten nicht extrahiert werden');
      }

      Logger.info('[Kleinanzeigen] Product data extracted:', {
        title: product.title,
        price: product.price,
        adId: product.adId
      });

      // Lade Einstellungen
      const settings = await StorageService.load<KleinanzeigenSettings>('kleinanzeigen_settings');
      if (!settings || !settings.discount) {
        throw new Error('Bitte konfiguriere zuerst den Rabatt in den Einstellungen (Extension-Icon klicken)');
      }

      Logger.info('[Kleinanzeigen] Settings loaded:', {
        discountType: settings.discount.type,
        discountValue: settings.discount.value
      });

      // Generiere Nachricht
      const message = MessageGenerator.generatePurchaseMessage(
        product,
        settings.discount,
        settings.messageTemplate
      );

      Logger.info('[Kleinanzeigen] Message generated:', message);

      // Füge Nachricht ein (Modal ist bereits offen)
      this.button.innerHTML = `
        <i class="button-icon icon-spinner fa-spin"></i>
        <span>Füge ein...</span>
      `;

      const inserted = KleinanzeigenDOMService.insertMessage(message);
      if (!inserted) {
        throw new Error('Nachricht konnte nicht eingefügt werden');
      }

      // Success State
      this.button.innerHTML = `
        <i class="button-icon icon-check"></i>
        <span>Fertig!</span>
      `;
      this.button.style.backgroundColor = '#4caf50';

      Logger.info('[Kleinanzeigen] ✅ Message inserted successfully');

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

