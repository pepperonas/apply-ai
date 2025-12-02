import { AIService } from '../../../shared/services/AIService';
import { ChatGPTProvider } from '../../../shared/services/ChatGPTProvider';
import { ClaudeProvider } from '../../../shared/services/ClaudeProvider';
import { StorageService } from '../../../shared/services/StorageService';
import { LoggingService } from '../../../shared/services/LoggingService';
import { FreelancerMapDOMService } from '../services/FreelancerMapDOMService';
import { Logger } from '../../../shared/utils/logger';
import { ApiConfig, AIProvider } from '../../../shared/models/ApiConfig';
import { UserProfile } from '../../../shared/models/UserProfile';
import { CONSTANTS } from '../../../shared/utils/constants';

/**
 * Controller für FreelancerMap Bewerbungsprozess
 */
export class FreelancerMapController {
  private aiService: AIService | null = null;

  async initialize(): Promise<void> {
    const config = await StorageService.load<ApiConfig>(CONSTANTS.STORAGE_KEYS.API_CONFIG);

    if (!config) {
      throw new Error('Keine API-Konfiguration gefunden. Bitte konfiguriere zuerst deine API-Einstellungen.');
    }

    const apiKey = config.provider === AIProvider.CHATGPT
      ? (config.chatgptApiKey || config.apiKey)
      : (config.claudeApiKey || config.apiKey);

    if (!apiKey) {
      throw new Error(`Kein API Key für ${config.provider} gefunden.`);
    }

    const providerConfig: ApiConfig = {
      ...config,
      apiKey: apiKey,
      model: config.provider === AIProvider.CHATGPT
        ? (config.chatgptModel || config.model)
        : (config.claudeModel || config.model)
    };

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

  async generateAndInsertApplication(): Promise<void> {
    const startTime = Date.now();

    try {
      Logger.info('[FreelancerMap] Extrahiere Projektdaten...');
      const project = FreelancerMapDOMService.extractProjectData();
      if (!project) {
        throw new Error('Keine Projektdaten gefunden. Öffne das Bewerbungsmodal auf einer Projektseite.');
      }

      Logger.info('[FreelancerMap] Lade Benutzerprofil...');
      const userProfile = await StorageService.load<UserProfile>(CONSTANTS.STORAGE_KEYS.USER_PROFILE);
      if (!userProfile) {
        throw new Error('Kein Benutzerprofil gefunden. Bitte öffne die Extension und fülle dein Profil aus.');
      }

      if (!userProfile.name || !userProfile.skills || userProfile.skills.length === 0) {
        throw new Error('Benutzerprofil unvollständig. Bitte fülle Name und Skills aus.');
      }

      Logger.info('[FreelancerMap] Initialisiere AI-Service...');
      await this.initialize();

      if (!this.aiService) {
        throw new Error('AI-Service konnte nicht initialisiert werden.');
      }

      Logger.info('[FreelancerMap] Generiere Anschreiben...');
      // Konvertiere FreelancerProject zu Project für AIService
      const projectForAI = {
        ...project,
        startDate: project.startDate || '',
        duration: project.duration || '',
        workload: project.workload || ''
      };
      const coverLetter = await this.aiService.generateCoverLetter(projectForAI, userProfile);

      if (!coverLetter || coverLetter.trim().length === 0) {
        throw new Error('AI hat ein leeres Anschreiben generiert.');
      }

      Logger.info('[FreelancerMap] Füge Anschreiben ein...');
      const success = FreelancerMapDOMService.insertCoverLetter(coverLetter);

      if (!success) {
        throw new Error('Fehler beim Einfügen des Anschreibens.');
      }

      const generationTimeMs = Date.now() - startTime;
      Logger.info('[FreelancerMap] ✅ Anschreiben erfolgreich generiert', {
        time: `${generationTimeMs}ms`,
        length: coverLetter.length
      });

      // Logging
      try {
        await LoggingService.saveLog({
          timestamp: new Date().toISOString(),
          provider: (await StorageService.load<ApiConfig>(CONSTANTS.STORAGE_KEYS.API_CONFIG))?.provider || 'unknown',
          performance: {
            generationTimeMs,
            success: true,
            modelUsed: this.aiService.constructor.name
          }
        });
      } catch (logError) {
        Logger.warn('[FreelancerMap] Logging failed:', logError);
      }

    } catch (error) {
      Logger.error('[FreelancerMap] Application generation failed:', error);
      throw error;
    }
  }
}

