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
    if (!KleinanzeigenDOMService.isProductPage()) {
      Logger.info('[Kleinanzeigen] Not a product page');
      return;
    }

    Logger.info('[Kleinanzeigen] Product page detected');
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
      Logger.warn('[Kleinanzeigen] Contact button not found, retrying...');
      setTimeout(() => this.createButton(), 1000);
      return;
    }

    // Prüfe ob Button bereits existiert
    if (document.getElementById('kleinanzeigen-ai-btn')) {
      return;
    }

    // Erstelle Button
    const button = document.createElement('button');
    button.id = 'kleinanzeigen-ai-btn';
    button.className = 'button-tertiary full-width taller';
    button.style.marginTop = '8px';
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

    // Füge Button nach dem "Nachricht schreiben" Button ein
    contactButton.parentElement?.insertBefore(button, contactButton.nextSibling);
    this.button = button;

    Logger.info('[Kleinanzeigen] Button created');
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

