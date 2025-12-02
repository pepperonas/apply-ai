import { KleinanzeigenProduct } from '../models/KleinanzeigenProduct';
import { AdData } from '../models/SellerSettings';
import { Logger } from '../../../shared/utils/logger';

/**
 * DOM Service für Kleinanzeigen.de
 */
export class KleinanzeigenDOMService {
  /**
   * Prüft ob wir auf einer Kleinanzeigen Produktseite sind
   */
  static isProductPage(): boolean {
    return window.location.hostname.includes('kleinanzeigen.de') &&
           window.location.pathname.includes('/s-anzeige/');
  }

  /**
   * Prüft ob wir auf der Inserat-Erstellen-Seite sind
   */
  static isPostAdPage(): boolean {
    return window.location.hostname.includes('kleinanzeigen.de') &&
           (window.location.pathname.includes('/p-anzeige-aufgeben') ||
            window.location.pathname.includes('/m-meine-anzeigen-aufgeben'));
  }

  /**
   * Extrahiert Produktdaten von der Seite
   */
  static extractProductData(): KleinanzeigenProduct | null {
    try {
      // Titel
      const titleElement = document.querySelector('#viewad-title, h1.boxedarticle--title');
      const title = titleElement?.textContent?.trim() || '';

      // Preis
      const priceElement = document.querySelector('#viewad-price, h2.boxedarticle--price');
      const priceText = priceElement?.textContent?.trim() || '';
      const priceMatch = priceText.match(/(\d+(?:\.\d+)?)/);
      const price = priceMatch ? parseInt(priceMatch[1].replace('.', '')) : 0;

      // Beschreibung
      const descriptionElement = document.querySelector('#viewad-description-text');
      const description = descriptionElement?.textContent?.trim() || '';

      // Verkäufer
      const sellerElement = document.querySelector('.userprofile-vip, #viewad-contact .text-body-regular-strong');
      const seller = sellerElement?.textContent?.trim() || '';

      // Standort
      const locationElement = document.querySelector('#viewad-locality, #street-address');
      const location = locationElement?.textContent?.trim() || '';

      // Anzeigen-ID
      const adIdElement = document.querySelector('input[name="adId"]');
      const adId = adIdElement?.getAttribute('value') || '';

      if (!title || !price || !adId) {
        Logger.warn('[Kleinanzeigen] Unvollständige Produktdaten');
        return null;
      }

      Logger.info('[Kleinanzeigen] Produktdaten extrahiert:', {
        title,
        price,
        seller,
        location,
        adId
      });

      return {
        id: `product-${adId}`,
        title,
        description,
        price,
        seller,
        location,
        adId
      };
    } catch (error) {
      Logger.error('[Kleinanzeigen] Error extracting product data:', error);
      return null;
    }
  }

  /**
   * Findet das Nachrichtenfeld im Modal
   */
  static getMessageField(): HTMLTextAreaElement | null {
    // Warte kurz, falls Modal gerade geöffnet wird
    const modal = document.querySelector('#viewad-contact-modal-form');
    if (!modal) return null;

    return modal.querySelector('#viewad-contact-message') as HTMLTextAreaElement;
  }

  /**
   * Findet den "Nachricht schreiben" Button
   */
  static getContactButton(): HTMLElement | null {
    return document.querySelector('#viewad-contact-button') as HTMLElement;
  }

  /**
   * Fügt Nachricht in das Textfeld ein
   */
  static insertMessage(message: string): boolean {
    const textarea = this.getMessageField();
    if (!textarea) {
      Logger.error('[Kleinanzeigen] Message field not found');
      return false;
    }

    try {
      // React-kompatible Einfügung
      const nativeInputValueSetter = Object.getOwnPropertyDescriptor(
        window.HTMLTextAreaElement.prototype,
        'value'
      )?.set;

      if (nativeInputValueSetter) {
        nativeInputValueSetter.call(textarea, message);
      } else {
        textarea.value = message;
      }

      // Events triggern
      textarea.dispatchEvent(new Event('input', { bubbles: true }));
      textarea.dispatchEvent(new Event('change', { bubbles: true }));
      textarea.dispatchEvent(new InputEvent('input', { 
        data: message,
        bubbles: true,
        cancelable: true
      }));

      textarea.focus();
      textarea.setSelectionRange(message.length, message.length);

      Logger.info('[Kleinanzeigen] Message inserted successfully');
      return true;
    } catch (error) {
      Logger.error('[Kleinanzeigen] Error inserting message:', error);
      return false;
    }
  }

  /**
   * Wartet bis Modal geöffnet ist
   */
  static async waitForModal(maxAttempts: number = 50): Promise<boolean> {
    return new Promise((resolve) => {
      let attempts = 0;
      const checkInterval = setInterval(() => {
        attempts++;
        const modal = document.querySelector('#viewad-contact-modal-form');
        const messageField = this.getMessageField();

        if (modal && messageField) {
          clearInterval(checkInterval);
          Logger.info('[Kleinanzeigen] Modal opened');
          resolve(true);
        } else if (attempts >= maxAttempts) {
          clearInterval(checkInterval);
          Logger.warn('[Kleinanzeigen] Modal timeout');
          resolve(false);
        }
      }, 100);
    });
  }

  /**
   * Öffnet das Kontaktformular
   */
  static async openContactForm(): Promise<boolean> {
    const contactButton = this.getContactButton();
    if (!contactButton) {
      Logger.error('[Kleinanzeigen] Contact button not found');
      return false;
    }

    contactButton.click();
    Logger.info('[Kleinanzeigen] Contact button clicked');

    return await this.waitForModal();
  }

  /**
   * Extrahiert Inserat-Daten vom Formular (Post-Ad-Seite)
   */
  static extractAdDataFromForm(): AdData | null {
    try {
      const titleInput = document.querySelector('#postad-title') as HTMLInputElement;
      const descriptionTextarea = document.querySelector('#pstad-descrptn') as HTMLTextAreaElement;
      const priceInput = document.querySelector('#micro-frontend-price, #pstad-price') as HTMLInputElement;
      const priceTypeSelect = document.querySelector('#micro-frontend-price-type, #priceType') as HTMLSelectElement;
      const categoryPath = document.querySelector('#postad-category-path')?.textContent?.trim();

      if (!titleInput || !descriptionTextarea) {
        Logger.warn('[Kleinanzeigen] Formular-Felder nicht gefunden');
        return null;
      }

      const title = titleInput.value.trim();
      const description = descriptionTextarea.value.trim();
      const priceText = priceInput?.value || '0';
      const price = parseFloat(priceText.replace(',', '.')) || 0;
      const priceType = priceTypeSelect?.value || 'FIXED';

      // Extrahiere Attribute (Art, Typ, Zustand, etc.)
      const attributes: Record<string, string> = {};
      
      // Art (z.B. Damen, Herren, Kinder)
      const artSelect = document.querySelector('select[name*="art_s"]') as HTMLSelectElement;
      if (artSelect && artSelect.value) {
        attributes.art = artSelect.options[artSelect.selectedIndex]?.text || artSelect.value;
      }

      // Typ (z.B. Mountainbike, Rennrad, etc.)
      const typeSelect = document.querySelector('select[name*="type_s"]') as HTMLSelectElement;
      if (typeSelect && typeSelect.value) {
        attributes.typ = typeSelect.options[typeSelect.selectedIndex]?.text || typeSelect.value;
      }

      // Zustand (Neu, Sehr Gut, Gut, etc.)
      const conditionSelect = document.querySelector('select[name*="condition_s"]') as HTMLSelectElement;
      const conditionRadio = document.querySelector('input[name="condition"]:checked') as HTMLInputElement;
      if (conditionRadio && conditionRadio.value) {
        const conditionMap: Record<string, string> = {
          'new': 'Neu',
          'like_new': 'Sehr Gut',
          'ok': 'Gut',
          'alright': 'In Ordnung',
          'defect': 'Defekt'
        };
        attributes.zustand = conditionMap[conditionRadio.value] || conditionRadio.value;
      } else if (conditionSelect && conditionSelect.value) {
        attributes.zustand = conditionSelect.options[conditionSelect.selectedIndex]?.text || conditionSelect.value;
      }

      // Versand
      const shippingRadio = document.querySelector('input[name="shipping-pickup"]:checked') as HTMLInputElement;
      if (shippingRadio && shippingRadio.value) {
        attributes.versand = shippingRadio.value === 'shipping' ? 'Versand möglich' : 'Nur Abholung';
      }

      // Anzeigentyp (Ich biete / Ich suche)
      const adTypeRadio = document.querySelector('input[name="adType"]:checked') as HTMLInputElement;
      const adType = adTypeRadio?.value === 'WANTED' ? 'WANTED' : 'OFFER';

      // Direkt kaufen
      const buyNowRadio = document.querySelector('input[name="buy-now"]:checked') as HTMLInputElement;
      const buyNowEnabled = buyNowRadio?.value === 'yes';

      Logger.info('[Kleinanzeigen] Inserat-Daten extrahiert:', {
        title,
        descriptionLength: description.length,
        price,
        priceType,
        category: categoryPath,
        attributes,
        adType,
        buyNowEnabled
      });

      return {
        title,
        description,
        price,
        priceType,
        category: categoryPath || 'Unbekannt',
        attributes,
        adType,
        buyNowEnabled
      };
    } catch (error) {
      Logger.error('[Kleinanzeigen] Error extracting ad data:', error);
      return null;
    }
  }

  /**
   * Fügt optimierte Beschreibung ins Formular ein
   */
  static insertOptimizedDescription(description: string): boolean {
    const textarea = document.querySelector('#pstad-descrptn') as HTMLTextAreaElement;
    if (!textarea) {
      Logger.error('[Kleinanzeigen] Description textarea not found');
      return false;
    }

    try {
      // React-kompatible Einfügung
      const nativeInputValueSetter = Object.getOwnPropertyDescriptor(
        window.HTMLTextAreaElement.prototype,
        'value'
      )?.set;

      if (nativeInputValueSetter) {
        nativeInputValueSetter.call(textarea, description);
      } else {
        textarea.value = description;
      }

      // Events triggern
      textarea.dispatchEvent(new Event('input', { bubbles: true }));
      textarea.dispatchEvent(new Event('change', { bubbles: true }));
      textarea.focus();

      Logger.info('[Kleinanzeigen] Optimized description inserted');
      return true;
    } catch (error) {
      Logger.error('[Kleinanzeigen] Error inserting description:', error);
      return false;
    }
  }

  /**
   * Findet den Container für den Optimierungs-Button
   */
  static getDescriptionOptimizeButtonContainer(): HTMLElement | null {
    const descriptionGroup = document.querySelector('#pstad-descrptn')?.closest('.formgroup');
    return descriptionGroup?.querySelector('.formgroup-label--unpadded') as HTMLElement;
  }
}

