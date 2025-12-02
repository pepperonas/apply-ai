/**
 * Kleinanzeigen Produkt-Modell
 */
export interface KleinanzeigenProduct {
  id: string;
  title: string;
  description: string;
  price: number;
  seller: string;
  location: string;
  adId: string;
}

export class KleinanzeigenProductModel implements KleinanzeigenProduct {
  id: string;
  title: string;
  description: string;
  price: number;
  seller: string;
  location: string;
  adId: string;

  constructor(data: Partial<KleinanzeigenProduct>) {
    this.id = data.id || '';
    this.title = data.title || '';
    this.description = data.description || '';
    this.price = data.price || 0;
    this.seller = data.seller || '';
    this.location = data.location || '';
    this.adId = data.adId || '';
  }

  validate(): boolean {
    return !!(this.title && this.price && this.adId);
  }

  /**
   * Berechnet den Preis nach Rabatt
   */
  calculateDiscountedPrice(discount: KleinanzeigenDiscount): number {
    if (discount.type === 'percentage') {
      return Math.round(this.price * (1 - discount.value / 100));
    } else {
      return Math.max(0, this.price - discount.value);
    }
  }
}

/**
 * Rabatt-Konfiguration
 */
export interface KleinanzeigenDiscount {
  type: 'percentage' | 'fixed';
  value: number;
}

/**
 * Kleinanzeigen Einstellungen
 */
export interface KleinanzeigenSettings {
  discount: KleinanzeigenDiscount;
  messageTemplate?: string;
  autoSend: boolean;
}

