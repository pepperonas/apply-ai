import { AdData, SellerSettings, WARRANTY_DISCLAIMERS } from '../models/SellerSettings';
import { Logger } from '../../../shared/utils/logger';
import { AIService } from '../../../shared/services/AIService';
import { ChatGPTProvider } from '../../../shared/services/ChatGPTProvider';
import { ClaudeProvider } from '../../../shared/services/ClaudeProvider';
import { StorageService } from '../../../shared/services/StorageService';
import { ApiConfig } from '../../../shared/models/ApiConfig';

/**
 * Service zur Optimierung von Kleinanzeigen-Beschreibungen
 */
export class DescriptionOptimizer {
  
  /**
   * Optimiert eine Inserat-Beschreibung mit AI
   */
  static async optimizeDescription(adData: AdData, sellerSettings: SellerSettings): Promise<string> {
    Logger.info('[DescriptionOptimizer] Starting optimization...', { adData, sellerSettings });

    const apiConfig = await StorageService.load<ApiConfig>('apiConfig');
    if (!apiConfig || !apiConfig.apiKey) {
      throw new Error('API-Konfiguration fehlt. Bitte im Popup konfigurieren.');
    }

    const aiService = this.createAIService(apiConfig);
    const prompt = this.buildPrompt(adData, sellerSettings);

    Logger.info('[DescriptionOptimizer] Sending to AI...', { provider: apiConfig.provider });

    const optimizedDescription = await aiService.generateText(prompt);

    Logger.info('[DescriptionOptimizer] Optimization complete', { 
      originalLength: adData.description.length,
      optimizedLength: optimizedDescription.length 
    });

    return optimizedDescription;
  }

  /**
   * Erstellt AI-Service basierend auf Konfiguration
   */
  private static createAIService(apiConfig: ApiConfig): AIService {
    if (apiConfig.provider === 'chatgpt') {
      return new ChatGPTProvider(
        apiConfig.chatgptApiKey || apiConfig.apiKey,
        apiConfig.chatgptModel || apiConfig.model || 'gpt-4o-mini',
        2000,  // maxTokens
        0.7    // temperature
      );
    } else {
      return new ClaudeProvider(
        apiConfig.claudeApiKey || apiConfig.apiKey,
        apiConfig.claudeModel || apiConfig.model || 'claude-3-haiku-20240307',
        2000,  // maxTokens
        0.7    // temperature
      );
    }
  }

  /**
   * Erstellt den Optimierungs-Prompt
   */
  private static buildPrompt(adData: AdData, sellerSettings: SellerSettings): string {
    const shippingInfo = this.buildShippingInfo(sellerSettings);
    const warrantyDisclaimer = sellerSettings.includeWarrantyDisclaimer 
      ? WARRANTY_DISCLAIMERS.friendly 
      : '';

    return `# AUFGABE: Optimiere diese Kleinanzeigen-Beschreibung

## KONTEXT
Du bist ein Experte für erfolgreiche Kleinanzeigen auf kleinanzeigen.de.
Deine Aufgabe ist es, die Beschreibung zu optimieren, um mehr Interessenten anzuziehen und schneller zu verkaufen.

## ORIGINAL-INSERAT
**Titel:** ${adData.title}
**Preis:** ${adData.price}€ ${this.getPriceType(adData.price)}
**Kategorie:** ${adData.category}
${adData.condition ? `**Zustand:** ${this.getConditionText(adData.condition)}` : ''}

**Aktuelle Beschreibung:**
${adData.description}

## VERKÄUFER-INFORMATIONEN
**Name:** ${sellerSettings.name}
**Standort:** ${sellerSettings.postalCode} ${sellerSettings.city}
${shippingInfo}

## OPTIMIERUNGS-REGELN

### Struktur (WICHTIG):
1. **Einleitung** (1-2 Sätze): Kurze, ansprechende Beschreibung
2. **Details** (3-5 Bulletpoints): Konkrete Eigenschaften, Zustand, Besonderheiten
3. **Versand & Abholung** (1-2 Sätze): ${shippingInfo || 'Nur Abholung'}
4. **Kontakt & Hinweise** (1-2 Sätze): Freundliche Aufforderung zur Kontaktaufnahme
${warrantyDisclaimer ? '5. **Rechtlicher Hinweis**: ' + warrantyDisclaimer : ''}

### Ton & Stil:
- Freundlich und authentisch (kein Marketing-Sprech)
- Konkret statt allgemein ("wie neu" statt "guter Zustand")
- Ehrlich über Mängel (wenn vorhanden)
- Keine Übertreibungen

### Was MUSS enthalten sein:
- Alle wichtigen Details aus der Original-Beschreibung
- Zustand (neu/gebraucht/defekt)
- Abholung/Versand-Optionen
${warrantyDisclaimer ? '- Gewährleistungsausschluss' : ''}

### Was VERMEIDEN:
- Rechtschreibfehler
- Zu lange Sätze
- Wiederholungen
- Unnötige Füllwörter
- Caps Lock (außer für Marken)

## BEISPIEL-STRUKTUR:

Verkaufe [Artikel] in [Zustand]. [1-2 Sätze Highlights].

Details:
• [Eigenschaft 1]
• [Eigenschaft 2]
• [Eigenschaft 3]
• [Zustand/Mängel wenn vorhanden]

${shippingInfo}

Bei Interesse einfach melden!

${warrantyDisclaimer}

## AUSGABE
Gib NUR die optimierte Beschreibung aus, ohne Kommentare oder Erklärungen.
Maximal 4000 Zeichen.`;
  }

  /**
   * Erstellt Versand-Information
   */
  private static buildShippingInfo(settings: SellerSettings): string {
    if (!settings.shippingOptions || settings.shippingOptions.length === 0) {
      return 'Nur Abholung möglich.';
    }

    const options = settings.shippingOptions.map(opt => {
      switch (opt.type) {
        case 'pickup':
          return `Abholung in ${settings.postalCode} ${settings.city}`;
        case 'shipping':
          return opt.price 
            ? `Versand möglich (${opt.price}€ ${opt.description || ''})`.trim()
            : 'Versand möglich';
        case 'both':
          return opt.price
            ? `Abholung oder Versand (${opt.price}€)`
            : 'Abholung oder Versand möglich';
        default:
          return '';
      }
    });

    return options.filter(o => o).join(' | ');
  }

  /**
   * Ermittelt Preistyp-Text
   */
  private static getPriceType(price: number): string {
    if (price === 0) return '(Zu verschenken)';
    return '(VB)';
  }

  /**
   * Ermittelt Zustands-Text
   */
  private static getConditionText(condition: string): string {
    switch (condition) {
      case 'new': return 'Neu';
      case 'used': return 'Gebraucht';
      case 'defective': return 'Defekt';
      default: return condition;
    }
  }
}

