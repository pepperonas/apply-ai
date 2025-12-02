/**
 * Erweiterte Popup-Funktionalität für Kleinanzeigen
 * Diese Datei wird in popup.ts importiert
 */

import { StorageService } from '../shared/services/StorageService';
import { KleinanzeigenSettings } from '../modules/kleinanzeigen/models/KleinanzeigenProduct';
import { SellerSettings, ShippingOption } from '../modules/kleinanzeigen/models/SellerSettings';
import { Logger } from '../shared/utils/logger';

export class KleinanzeigenPopupExtension {
  /**
   * Lädt Kleinanzeigen-Einstellungen
   */
  static async loadKleinanzeigenSettings(): Promise<void> {
    try {
      const settings = await StorageService.load<KleinanzeigenSettings>('kleinanzeigen_settings');
      
      const discountTypeSelect = document.getElementById('discount-type') as HTMLSelectElement;
      const discountValueInput = document.getElementById('discount-value') as HTMLInputElement;
      const messageTemplateTextarea = document.getElementById('message-template') as HTMLTextAreaElement;

      if (settings) {
        if (discountTypeSelect) {
          discountTypeSelect.value = settings.discount?.type || 'percentage';
        }
        if (discountValueInput) {
          discountValueInput.value = settings.discount?.value?.toString() || '15';
        }
        if (messageTemplateTextarea) {
          messageTemplateTextarea.value = settings.messageTemplate || '';
        }
      } else {
        // Default-Werte setzen wenn keine Settings vorhanden
        if (discountTypeSelect) {
          discountTypeSelect.value = 'percentage';
        }
        if (discountValueInput) {
          discountValueInput.value = '15';
        }
      }

      // Update hint basierend auf Typ
      this.updateDiscountHint();

    } catch (error) {
      Logger.error('[Kleinanzeigen] Error loading settings:', error);
    }
  }

  /**
   * Lädt Verkäufer-Einstellungen
   */
  static async loadSellerSettings(): Promise<void> {
    try {
      const settings = await StorageService.load<SellerSettings>('seller_settings');

      if (settings) {
        (document.getElementById('seller-name') as HTMLInputElement).value = settings.name || '';
        (document.getElementById('seller-street') as HTMLInputElement).value = settings.street || '';
        (document.getElementById('seller-postal') as HTMLInputElement).value = settings.postalCode || '';
        (document.getElementById('seller-city') as HTMLInputElement).value = settings.city || '';
        (document.getElementById('seller-phone') as HTMLInputElement).value = settings.phone || '';
        (document.getElementById('warranty-disclaimer') as HTMLInputElement).checked = settings.includeWarrantyDisclaimer !== false;

        // Versandoptionen
        const hasPickup = settings.shippingOptions?.some(opt => opt.type === 'pickup' || opt.type === 'both');
        const hasShipping = settings.shippingOptions?.some(opt => opt.type === 'shipping' || opt.type === 'both');
        const shippingOption = settings.shippingOptions?.find(opt => opt.type === 'shipping' || opt.type === 'both');

        (document.getElementById('shipping-pickup') as HTMLInputElement).checked = hasPickup || false;
        (document.getElementById('shipping-delivery') as HTMLInputElement).checked = hasShipping || false;
        
        if (shippingOption?.price) {
          (document.getElementById('shipping-cost') as HTMLInputElement).value = shippingOption.price.toString();
        }

        // Zeige Versandkosten-Feld wenn Versand aktiviert
        this.toggleShippingCost();
      }

    } catch (error) {
      Logger.error('[Kleinanzeigen] Error loading seller settings:', error);
    }
  }

  /**
   * Speichert Kleinanzeigen-Einstellungen
   */
  static async saveKleinanzeigenSettings(): Promise<void> {
    try {
      const discountTypeSelect = document.getElementById('discount-type') as HTMLSelectElement;
      const discountValueInput = document.getElementById('discount-value') as HTMLInputElement;
      const messageTemplateTextarea = document.getElementById('message-template') as HTMLTextAreaElement;

      const settings: KleinanzeigenSettings = {
        discount: {
          type: discountTypeSelect?.value as 'percentage' | 'fixed' || 'percentage',
          value: parseInt(discountValueInput?.value || '10')
        },
        messageTemplate: messageTemplateTextarea?.value || undefined,
        autoSend: false
      };

      await StorageService.save('kleinanzeigen_settings', settings);
      Logger.info('[Kleinanzeigen] Settings saved:', settings);

    } catch (error) {
      Logger.error('[Kleinanzeigen] Error saving settings:', error);
      throw error;
    }
  }

  /**
   * Speichert Verkäufer-Einstellungen
   */
  static async saveSellerSettings(): Promise<void> {
    try {
      const name = (document.getElementById('seller-name') as HTMLInputElement).value.trim();
      const street = (document.getElementById('seller-street') as HTMLInputElement).value.trim();
      const postalCode = (document.getElementById('seller-postal') as HTMLInputElement).value.trim();
      const city = (document.getElementById('seller-city') as HTMLInputElement).value.trim();
      const phone = (document.getElementById('seller-phone') as HTMLInputElement).value.trim();
      const includeWarrantyDisclaimer = (document.getElementById('warranty-disclaimer') as HTMLInputElement).checked;

      const hasPickup = (document.getElementById('shipping-pickup') as HTMLInputElement).checked;
      const hasShipping = (document.getElementById('shipping-delivery') as HTMLInputElement).checked;
      const shippingCost = parseFloat((document.getElementById('shipping-cost') as HTMLInputElement).value) || undefined;

      // Validierung
      if (!name || !postalCode || !city) {
        throw new Error('Name, PLZ und Stadt sind Pflichtfelder.');
      }

      // Versandoptionen
      const shippingOptions: ShippingOption[] = [];
      if (hasPickup && hasShipping) {
        shippingOptions.push({ type: 'both', price: shippingCost });
      } else if (hasPickup) {
        shippingOptions.push({ type: 'pickup' });
      } else if (hasShipping) {
        shippingOptions.push({ type: 'shipping', price: shippingCost });
      }

      const settings: SellerSettings = {
        name,
        street,
        postalCode,
        city,
        phone,
        shippingOptions,
        includeWarrantyDisclaimer
      };

      await StorageService.save('seller_settings', settings);
      Logger.info('[Kleinanzeigen] Seller settings saved:', settings);

    } catch (error) {
      Logger.error('[Kleinanzeigen] Error saving seller settings:', error);
      throw error;
    }
  }

  /**
   * Aktualisiert den Hinweistext basierend auf Rabatt-Typ
   */
  static updateDiscountHint(): void {
    const discountTypeSelect = document.getElementById('discount-type') as HTMLSelectElement;
    const discountHint = document.getElementById('discount-hint');

    if (!discountTypeSelect || !discountHint) return;

    if (discountTypeSelect.value === 'percentage') {
      discountHint.textContent = 'Gib 15 ein für 15% Rabatt (Standard)';
    } else {
      discountHint.textContent = 'Gib 50 ein für 50€ Rabatt';
    }
  }

  /**
   * Zeigt/Versteckt Versandkosten-Feld
   */
  static toggleShippingCost(): void {
    const shippingDelivery = document.getElementById('shipping-delivery') as HTMLInputElement;
    const shippingCostGroup = document.getElementById('shipping-cost-group');

    if (shippingCostGroup) {
      shippingCostGroup.style.display = shippingDelivery?.checked ? 'block' : 'none';
    }
  }

  /**
   * Fügt Event Listener hinzu
   */
  static attachEventListeners(): void {
    // Discount Type Change
    const discountTypeSelect = document.getElementById('discount-type');
    if (discountTypeSelect) {
      discountTypeSelect.addEventListener('change', () => {
        this.updateDiscountHint();
      });
    }

    // Shipping Delivery Toggle
    const shippingDelivery = document.getElementById('shipping-delivery');
    if (shippingDelivery) {
      shippingDelivery.addEventListener('change', () => {
        this.toggleShippingCost();
      });
    }
  }

  /**
   * Setzt Kleinanzeigen-Einstellungen zurück
   */
  static async resetKleinanzeigenSettings(): Promise<void> {
    const discountTypeSelect = document.getElementById('discount-type') as HTMLSelectElement;
    const discountValueInput = document.getElementById('discount-value') as HTMLInputElement;
    const messageTemplateTextarea = document.getElementById('message-template') as HTMLTextAreaElement;

    if (discountTypeSelect) discountTypeSelect.value = 'percentage';
    if (discountValueInput) discountValueInput.value = '15';
    if (messageTemplateTextarea) messageTemplateTextarea.value = '';

    this.updateDiscountHint();

    await StorageService.save('kleinanzeigen_settings', {
      discount: { type: 'percentage', value: 15 },
      messageTemplate: undefined,
      autoSend: false
    });
  }

  /**
   * Setzt Verkäufer-Einstellungen zurück
   */
  static async resetSellerSettings(): Promise<void> {
    (document.getElementById('seller-name') as HTMLInputElement).value = '';
    (document.getElementById('seller-street') as HTMLInputElement).value = '';
    (document.getElementById('seller-postal') as HTMLInputElement).value = '';
    (document.getElementById('seller-city') as HTMLInputElement).value = '';
    (document.getElementById('seller-phone') as HTMLInputElement).value = '';
    (document.getElementById('shipping-pickup') as HTMLInputElement).checked = true;
    (document.getElementById('shipping-delivery') as HTMLInputElement).checked = false;
    (document.getElementById('shipping-cost') as HTMLInputElement).value = '';
    (document.getElementById('warranty-disclaimer') as HTMLInputElement).checked = true;

    this.toggleShippingCost();

    await StorageService.remove('seller_settings');
  }
}

