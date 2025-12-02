/**
 * Verkäufer-Einstellungen für Kleinanzeigen
 */
export interface SellerSettings {
  name: string;
  street: string;
  postalCode: string;
  city: string;
  phone: string;
  shippingOptions: ShippingOption[];
  includeWarrantyDisclaimer: boolean;
}

export interface ShippingOption {
  type: 'pickup' | 'shipping' | 'both';
  price?: number;
  description?: string;
}

/**
 * Inserat-Daten für Optimierung
 */
export interface AdData {
  title: string;
  description: string;
  price: number;
  category: string;
  condition?: 'new' | 'used' | 'defective';
  shippingAvailable?: boolean;
}

/**
 * Standard-Gewährleistungsausschluss
 */
export const WARRANTY_DISCLAIMER = `
Da dies ein Privatverkauf ist, sind Gewährleistung, Garantie und Rücknahme ausgeschlossen.
`.trim();

/**
 * Erweiterte Gewährleistungsausschluss-Varianten
 */
export const WARRANTY_DISCLAIMERS = {
  short: 'Privatverkauf - Keine Gewährleistung, keine Rücknahme.',
  
  standard: 'Da dies ein Privatverkauf ist, sind Gewährleistung, Garantie und Rücknahme ausgeschlossen.',
  
  detailed: `Dies ist ein Privatverkauf nach §474 BGB. 
Gewährleistung, Garantie und Rücknahme sind ausgeschlossen. 
Der Verkauf erfolgt unter Ausschluss jeglicher Gewährleistung.`,
  
  friendly: `Da ich privat verkaufe, kann ich leider keine Garantie oder Rücknahme anbieten. 
Der Artikel wird wie beschrieben verkauft.`
};

