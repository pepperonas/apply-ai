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

    // Baue Attribut-Informationen auf
    const attributesInfo = this.buildAttributesInfo(adData);
    const priceInfo = this.buildPriceInfo(adData);
    const adTypeText = adData.adType === 'WANTED' ? 'SUCHE' : 'BIETE';

    return `# AUFGABE: Optimiere diese Kleinanzeigen-Beschreibung

## KONTEXT
Du bist ein Experte für erfolgreiche Kleinanzeigen auf kleinanzeigen.de.
Deine Aufgabe ist es, die Beschreibung zu optimieren, um mehr Interessenten anzuziehen und schneller zu verkaufen.

## ORIGINAL-INSERAT
**Anzeigentyp:** ${adTypeText} (${adData.adType === 'WANTED' ? 'Ich suche' : 'Ich biete'})
**Titel:** ${adData.title}
${priceInfo}
**Kategorie:** ${adData.category}
${attributesInfo}
${adData.buyNowEnabled ? '**"Direkt kaufen" aktiviert:** Festpreis ohne Verhandlung' : ''}

**Aktuelle Beschreibung:**
${adData.description || '(Noch keine Beschreibung vorhanden)'}

## VERKÄUFER-INFORMATIONEN
**Name:** ${sellerSettings.name}
**Standort:** ${sellerSettings.postalCode} ${sellerSettings.city}
${shippingInfo}

## OPTIMIERUNGS-REGELN

### Struktur (WICHTIG):
1. **Einleitung** (1-2 Sätze): ${adData.adType === 'WANTED' ? 'Was du suchst und wofür' : 'Kurze, ansprechende Beschreibung des Artikels'}
2. **Details** (3-5 Bulletpoints): 
   - Konkrete Eigenschaften${attributesInfo ? ' (nutze die Attribut-Infos!)' : ''}
   - Zustand (${adData.attributes?.zustand || 'falls bekannt'})
   - Besonderheiten, Marke, Modell
   - ${adData.adType === 'WANTED' ? 'Gewünschte Eigenschaften' : 'Technische Details'}
3. **Versand & Abholung** (1-2 Sätze): ${shippingInfo || 'Nur Abholung'}
4. **Kontakt & Hinweise** (1-2 Sätze): 
   - ${adData.buyNowEnabled ? 'Hinweis auf "Direkt kaufen" (schnell & sicher)' : 'Freundliche Aufforderung zur Kontaktaufnahme'}
   - ${adData.adType === 'WANTED' ? 'Preisvorstellung oder VB' : 'Verfügbarkeit'}
${warrantyDisclaimer ? '5. **Rechtlicher Hinweis**: ' + warrantyDisclaimer : ''}

### Ton & Stil:
- Freundlich und authentisch (kein Marketing-Sprech)
- Konkret statt allgemein ("wie neu" statt "guter Zustand")
- Ehrlich über Mängel (wenn vorhanden)
- Keine Übertreibungen
- ${adData.adType === 'WANTED' ? 'Klar formulieren was du suchst' : 'Verkaufsfördernde Sprache'}

### Was MUSS enthalten sein:
- Alle wichtigen Details aus der Original-Beschreibung
- **Alle Attribut-Informationen** (${Object.keys(adData.attributes || {}).join(', ') || 'falls vorhanden'})
- Zustand (${adData.attributes?.zustand || 'neu/gebraucht/defekt'})
- Versand-Info (${adData.attributes?.versand || 'Abholung/Versand'})
${warrantyDisclaimer ? '- Gewährleistungsausschluss' : ''}
${adData.buyNowEnabled ? '- Hinweis auf "Direkt kaufen" Funktion' : ''}

### Was VERMEIDEN:
- Rechtschreibfehler
- Zu lange Sätze
- Wiederholungen
- Unnötige Füllwörter
- Caps Lock (außer für Marken)
- Erfundene Details (nur nutzen was vorhanden ist!)

## BEISPIEL-STRUKTUR:

${adData.adType === 'WANTED' ? 'Suche' : 'Verkaufe'} [Artikel]${adData.attributes?.zustand ? ` in ${adData.attributes.zustand}` : ''}. [1-2 Sätze Highlights].

Details:
${attributesInfo ? attributesInfo.split('\n').map(line => `• ${line.replace('**', '').replace(':', '')}`).join('\n') : '• [Eigenschaft 1]\n• [Eigenschaft 2]\n• [Eigenschaft 3]'}
• [Weitere Details aus Beschreibung]

${shippingInfo}
${adData.buyNowEnabled ? '\n✓ Sicherer Kauf mit "Direkt kaufen" - ohne Verhandlung zum Festpreis!' : ''}

Bei Interesse einfach melden!

${warrantyDisclaimer}

## AUSGABE
Gib NUR die optimierte Beschreibung aus, ohne Kommentare oder Erklärungen.
Maximal 4000 Zeichen.
Nutze ALLE verfügbaren Informationen (Attribute, Zustand, Versand, etc.).`;
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
   * Baut Preis-Information auf
   */
  private static buildPriceInfo(adData: AdData): string {
    if (adData.price === 0) {
      return '**Preis:** Zu verschenken';
    }

    const priceTypeMap: Record<string, string> = {
      'FIXED': 'Festpreis',
      'NEGOTIABLE': 'VB (Verhandlungsbasis)',
      'GIVE_AWAY': 'Zu verschenken'
    };

    const priceType = priceTypeMap[adData.priceType || 'FIXED'] || 'Festpreis';
    return `**Preis:** ${adData.price}€ (${priceType})`;
  }

  /**
   * Baut Attribut-Informationen auf
   */
  private static buildAttributesInfo(adData: AdData): string {
    if (!adData.attributes || Object.keys(adData.attributes).length === 0) {
      return '';
    }

    const lines: string[] = [];
    
    if (adData.attributes.art) {
      lines.push(`**Art:** ${adData.attributes.art}`);
    }
    if (adData.attributes.typ) {
      lines.push(`**Typ:** ${adData.attributes.typ}`);
    }
    if (adData.attributes.zustand) {
      lines.push(`**Zustand:** ${adData.attributes.zustand}`);
    }
    if (adData.attributes.versand) {
      lines.push(`**Versand:** ${adData.attributes.versand}`);
    }

    // Weitere Attribute
    Object.entries(adData.attributes).forEach(([key, value]) => {
      if (!['art', 'typ', 'zustand', 'versand'].includes(key) && value) {
        const capitalizedKey = key.charAt(0).toUpperCase() + key.slice(1);
        lines.push(`**${capitalizedKey}:** ${value}`);
      }
    });

    return lines.join('\n');
  }

}

