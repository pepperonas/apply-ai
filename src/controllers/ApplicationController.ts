import { AIService } from '../services/AIService';
import { ChatGPTProvider } from '../services/ChatGPTProvider';
import { ClaudeProvider } from '../services/ClaudeProvider';
import { StorageService } from '../services/StorageService';
import { DOMService } from '../services/DOMService';
import { Logger } from '../utils/logger';
import { ApiConfig, AIProvider } from '../models/ApiConfig';
import { UserProfile } from '../models/UserProfile';
import { CONSTANTS } from '../utils/constants';

/**
 * Controller für den Bewerbungsprozess (MVC Pattern)
 */
export class ApplicationController {
  private aiService: AIService | null = null;

  /**
   * Initialisiert den AI-Provider basierend auf Konfiguration
   */
  async initialize(): Promise<void> {
    const config = await StorageService.load<ApiConfig>(CONSTANTS.STORAGE_KEYS.API_CONFIG);

    if (!config) {
      throw new Error('Keine API-Konfiguration gefunden. Bitte konfiguriere zuerst deine API-Einstellungen.');
    }

    // Hole den API Key für den konfigurierten Provider
    const apiKey = config.provider === AIProvider.CHATGPT
      ? (config.chatgptApiKey || config.apiKey)
      : (config.claudeApiKey || config.apiKey);

    if (!apiKey) {
      throw new Error(`Kein API Key für ${config.provider} gefunden. Bitte konfiguriere zuerst deine API-Einstellungen.`);
    }

    // Erstelle Config mit dem richtigen API Key
    const providerConfig: ApiConfig = {
      ...config,
      apiKey: apiKey,
      model: config.provider === AIProvider.CHATGPT
        ? (config.chatgptModel || config.model)
        : (config.claudeModel || config.model)
    };

    // Factory Pattern für Provider-Auswahl
    this.aiService = this.createAIService(providerConfig);
  }

  private createAIService(config: ApiConfig): AIService {
    switch (config.provider) {
      case AIProvider.CHATGPT:
        return new ChatGPTProvider(config.apiKey, config.model || CONSTANTS.DEFAULT_MODELS.CHATGPT);
      case AIProvider.CLAUDE:
        return new ClaudeProvider(config.apiKey, config.model || CONSTANTS.DEFAULT_MODELS.CLAUDE);
      default:
        throw new Error(`Unbekannter AI-Provider: ${config.provider}`);
    }
  }

  /**
   * Generiert und fügt Bewerbungsanschreiben ein
   */
  async generateAndInsertApplication(): Promise<void> {
    try {
      // 1. Projektdaten extrahieren
      const project = DOMService.extractProjectData();
      if (!project) {
        throw new Error('Keine Projektdaten gefunden. Bist du auf einer Projektseite?');
      }

      // 2. Benutzerprofil laden
      const userProfile = await StorageService.load<UserProfile>(CONSTANTS.STORAGE_KEYS.USER_PROFILE);
      if (!userProfile) {
        throw new Error('Kein Benutzerprofil konfiguriert. Bitte fülle dein Profil in den Einstellungen aus.');
      }

      // 3. AI-Service initialisieren
      if (!this.aiService) {
        await this.initialize();
      }

      // 4. Anschreiben generieren
      const coverLetter = await this.aiService!.generateCoverLetter(project, userProfile);

      // 5. In Textfeld einfügen
      const success = DOMService.insertCoverLetter(coverLetter);

      if (!success) {
        throw new Error('Fehler beim Einfügen des Anschreibens');
      }

      Logger.info('Anschreiben erfolgreich generiert und eingefügt');

    } catch (error) {
      Logger.error('Application generation failed:', error);
      throw error;
    }
  }
}

