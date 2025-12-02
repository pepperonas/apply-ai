import { KleinanzeigenProduct, KleinanzeigenDiscount } from '../models/KleinanzeigenProduct';

/**
 * Generiert Kaufanfrage-Nachrichten für Kleinanzeigen
 */
export class MessageGenerator {
  /**
   * Generiert eine Kaufanfrage mit Preisvorschlag
   */
  static generatePurchaseMessage(
    product: KleinanzeigenProduct,
    discount: KleinanzeigenDiscount,
    customTemplate?: string
  ): string {
    const discountedPrice = this.calculateDiscountedPrice(product.price, discount);

    if (customTemplate) {
      return this.fillTemplate(customTemplate, product, discountedPrice);
    }

    return this.generateDefaultMessage(product, discountedPrice);
  }

  /**
   * Berechnet den Preis nach Rabatt
   */
  private static calculateDiscountedPrice(originalPrice: number, discount: KleinanzeigenDiscount): number {
    if (discount.type === 'percentage') {
      return Math.round(originalPrice * (1 - discount.value / 100));
    } else {
      return Math.max(0, originalPrice - discount.value);
    }
  }

  /**
   * Generiert Standard-Nachricht
   */
  private static generateDefaultMessage(product: KleinanzeigenProduct, discountedPrice: number): string {
    return `Hallo,

ich interessiere mich für "${product.title}".

Würden Sie ${discountedPrice}€ akzeptieren?

Ich könnte das Produkt zeitnah abholen bzw. würde es direkt bezahlen.

Viele Grüße`;
  }

  /**
   * Füllt Custom Template mit Daten
   */
  private static fillTemplate(
    template: string,
    product: KleinanzeigenProduct,
    discountedPrice: number
  ): string {
    return template
      .replace(/\{title\}/g, product.title)
      .replace(/\{price\}/g, product.price.toString())
      .replace(/\{discounted_price\}/g, discountedPrice.toString())
      .replace(/\{seller\}/g, product.seller)
      .replace(/\{location\}/g, product.location);
  }

  /**
   * Formatiert Rabatt für Anzeige
   */
  static formatDiscount(discount: KleinanzeigenDiscount): string {
    if (discount.type === 'percentage') {
      return `${discount.value}%`;
    } else {
      return `${discount.value}€`;
    }
  }
}

