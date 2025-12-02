import { StorageService } from '../services/StorageService';
import { ChatGPTProvider } from '../services/ChatGPTProvider';
import { ClaudeProvider } from '../services/ClaudeProvider';
import { ApiConfig, AIProvider } from '../models/ApiConfig';
import { UserProfile } from '../models/UserProfile';
import { CONSTANTS } from '../utils/constants';
import { Logger } from '../utils/logger';

/**
 * Popup Controller für Einstellungen
 */
class PopupController {
  private currentProvider: AIProvider = AIProvider.CHATGPT;

  constructor() {
    this.initialize();
  }

  private async initialize(): Promise<void> {
    await this.loadSettings();
    this.attachEventListeners();
  }

  private async loadSettings(): Promise<void> {
    try {
      // API Config laden
      const apiConfig = await StorageService.load<ApiConfig>(CONSTANTS.STORAGE_KEYS.API_CONFIG);
      if (apiConfig) {
        this.currentProvider = apiConfig.provider || AIProvider.CHATGPT;
        this.setActiveProvider(this.currentProvider);
        this.updateActiveBadge(this.currentProvider);
        
        // Lade den API Key für den aktuellen Provider
        const apiKey = this.getApiKeyForProvider(apiConfig, this.currentProvider);
        const apiKeyInput = document.getElementById('api-key') as HTMLInputElement;
        if (apiKeyInput) {
          apiKeyInput.value = apiKey || '';
        }
        
        this.updateModelOptions(this.currentProvider);
        
        // Lade das Modell für den aktuellen Provider
        const model = this.getModelForProvider(apiConfig, this.currentProvider);
        const modelSelect = document.getElementById('model-select') as HTMLSelectElement;
        if (modelSelect && model) {
          // Prüfe ob das Modell in den Optionen existiert
          const optionExists = Array.from(modelSelect.options).some(opt => opt.value === model);
          if (optionExists) {
            modelSelect.value = model;
          }
        }
      } else {
        // Keine Config vorhanden - zeige Standard
        this.updateActiveBadge(AIProvider.CHATGPT);
      }

      // User Profile laden
      const userProfile = await StorageService.load<UserProfile>(CONSTANTS.STORAGE_KEYS.USER_PROFILE);
      if (userProfile) {
        (document.getElementById('user-name') as HTMLInputElement).value = userProfile.name || '';
        (document.getElementById('user-email') as HTMLInputElement).value = userProfile.email || '';
        (document.getElementById('user-phone') as HTMLInputElement).value = userProfile.phone || '';
        (document.getElementById('user-skills') as HTMLTextAreaElement).value = userProfile.skills?.join(', ') || '';
        (document.getElementById('user-experience') as HTMLTextAreaElement).value = userProfile.experience || '';
        (document.getElementById('user-intro') as HTMLTextAreaElement).value = userProfile.customIntro || '';
      }
    } catch (error) {
      this.showStatus('Fehler beim Laden der Einstellungen', 'error');
    }
  }

  private attachEventListeners(): void {
    // Provider Tabs
    document.querySelectorAll('.tab-btn').forEach(btn => {
      btn.addEventListener('click', (e) => {
        const provider = (e.target as HTMLElement).dataset.provider as AIProvider;
        this.switchProvider(provider);
      });
    });

    // Validate Button
    document.getElementById('validate-key')?.addEventListener('click', async () => {
      await this.validateApiKey();
    });

    // Save Button
    document.getElementById('save-btn')?.addEventListener('click', async () => {
      await this.saveSettings();
    });

    // Reset Button
    document.getElementById('reset-btn')?.addEventListener('click', async () => {
      await this.resetSettings();
    });
  }

  private switchProvider(provider: AIProvider): void {
    this.currentProvider = provider;
    this.setActiveProvider(provider);
    this.updateModelOptions(provider);
    
    // Lade den API Key für den neuen Provider (async, aber nicht await - läuft im Hintergrund)
    this.loadApiKeyForProvider(provider).catch((error) => {
      Logger.error('Fehler beim Laden des API Keys:', error);
    });
  }

  private async loadApiKeyForProvider(provider: AIProvider): Promise<void> {
    try {
      const apiConfig = await StorageService.load<ApiConfig>(CONSTANTS.STORAGE_KEYS.API_CONFIG);
      if (!apiConfig) {
        // Keine Config vorhanden - setze leere Werte
        const apiKeyInput = document.getElementById('api-key') as HTMLInputElement;
        if (apiKeyInput) {
          apiKeyInput.value = '';
        }
        return;
      }

      const apiKey = this.getApiKeyForProvider(apiConfig, provider);
      const apiKeyInput = document.getElementById('api-key') as HTMLInputElement;
      if (apiKeyInput) {
        apiKeyInput.value = apiKey || '';
      }
      
      const model = this.getModelForProvider(apiConfig, provider);
      const modelSelect = document.getElementById('model-select') as HTMLSelectElement;
      if (modelSelect) {
        if (model) {
          // Prüfe ob das Modell in den Optionen existiert
          const optionExists = Array.from(modelSelect.options).some(opt => opt.value === model);
          if (optionExists) {
            modelSelect.value = model;
          }
        }
      }
    } catch (error) {
      Logger.error('Fehler beim Laden des API Keys:', error);
      // Fehler nicht weiterwerfen, da dies im Hintergrund läuft
    }
  }

  private getApiKeyForProvider(config: ApiConfig | null, provider: AIProvider): string {
    if (!config) return '';
    
    let apiKey = '';
    if (provider === AIProvider.CHATGPT) {
      apiKey = config.chatgptApiKey || config.apiKey || '';
    } else {
      apiKey = config.claudeApiKey || config.apiKey || '';
    }
    
    // Stelle sicher, dass der API Key ein String ist
    if (typeof apiKey === 'object') {
      Logger.warn('API Key is an object, converting to string:', apiKey);
      apiKey = String(apiKey);
    }
    
    return String(apiKey || '');
  }

  private getModelForProvider(config: ApiConfig | null, provider: AIProvider): string | undefined {
    if (!config) return undefined;
    
    if (provider === AIProvider.CHATGPT) {
      return config.chatgptModel || config.model;
    } else {
      return config.claudeModel || config.model;
    }
  }

  private setActiveProvider(provider: AIProvider): void {
    document.querySelectorAll('.tab-btn').forEach(btn => {
      btn.classList.remove('active');
      if (btn.getAttribute('data-provider') === provider) {
        btn.classList.add('active');
      }
    });
  }

  private updateActiveBadge(provider: AIProvider): void {
    const badge = document.getElementById('active-provider-badge');
    if (badge) {
      const providerName = provider === AIProvider.CHATGPT ? 'ChatGPT' : 'Claude';
      badge.textContent = `Aktiv: ${providerName}`;
    }
  }

  private updateModelOptions(provider: AIProvider): void {
    const select = document.getElementById('model-select') as HTMLSelectElement;
    select.innerHTML = '';

    const models = provider === AIProvider.CHATGPT
      ? ['gpt-4', 'gpt-4-turbo', 'gpt-3.5-turbo']
      : [
          // Funktionierende Claude Modelle (getestet Dezember 2025)
          'claude-3-haiku-20240307',    // ⭐ Empfohlen - schnell & zuverlässig
          'claude-3-opus-20240229'      // Opus - höchste Qualität
        ];

    models.forEach(model => {
      const option = document.createElement('option');
      option.value = model;
      option.textContent = model;
      select.appendChild(option);
    });
  }

  private async validateApiKey(): Promise<void> {
    const apiKeyInput = document.getElementById('api-key') as HTMLInputElement;
    if (!apiKeyInput) {
      this.showValidateStatus('API Key Feld nicht gefunden', 'error');
      return;
    }

    // Hole den rohen Wert und trimme ihn
    const rawApiKey = apiKeyInput.value || '';
    const apiKey = String(rawApiKey).trim();

    Logger.info('Popup: Starting validation', {
      rawLength: rawApiKey.length,
      trimmedLength: apiKey.length,
      firstChars: apiKey.substring(0, 20),
      provider: this.currentProvider
    });

    if (!apiKey) {
      this.showValidateStatus('Bitte API Key eingeben', 'error');
      return;
    }

    try {
      this.showValidateStatus('Prüfe...', 'loading');
      
      Logger.info('Creating provider for validation', {
        provider: this.currentProvider,
        apiKeyType: typeof apiKey,
        apiKeyLength: apiKey.length,
        apiKeyStart: apiKey.substring(0, 20)
      });
      
      const service = this.currentProvider === AIProvider.CHATGPT
        ? new ChatGPTProvider(apiKey, CONSTANTS.DEFAULT_MODELS.CHATGPT)
        : new ClaudeProvider(apiKey, CONSTANTS.DEFAULT_MODELS.CLAUDE);

      const isValid = await service.validateApiKey();

      if (isValid) {
        this.showValidateStatus('✓ Gültig', 'success');
      } else {
        this.showValidateStatus('✗ Ungültig', 'error');
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unbekannter Fehler';
      
      Logger.error('API Key Validation Error:', {
        error: errorMessage,
        errorType: error instanceof Error ? error.constructor.name : typeof error,
        provider: this.currentProvider,
        stack: error instanceof Error ? error.stack : undefined
      });
      
      // Zeige die vollständige Fehlermeldung (maximal 60 Zeichen für bessere Lesbarkeit)
      const displayMessage = errorMessage.length > 60 
        ? errorMessage.substring(0, 57) + '...' 
        : errorMessage;
      this.showValidateStatus(`✗ ${displayMessage}`, 'error');
    }
  }

  private showValidateStatus(message: string, type: 'success' | 'error' | 'loading'): void {
    const statusElement = document.getElementById('validate-status') as HTMLElement;
    if (!statusElement) return;

    statusElement.textContent = message;
    statusElement.className = `validate-status ${type}`;
    statusElement.classList.remove('hidden');

    // Auto-hide nach 5 Sekunden für success/error
    if (type !== 'loading') {
      setTimeout(() => {
        statusElement.classList.add('hidden');
      }, 5000);
    }
  }

  private async saveSettings(): Promise<void> {
    try {
      // Validierung
      const apiKey = String((document.getElementById('api-key') as HTMLInputElement).value || '').trim();
      const name = (document.getElementById('user-name') as HTMLInputElement).value;
      const email = (document.getElementById('user-email') as HTMLInputElement).value;
      const skillsText = (document.getElementById('user-skills') as HTMLTextAreaElement).value;
      const experience = (document.getElementById('user-experience') as HTMLTextAreaElement).value;

      if (!apiKey || !name || !email || !skillsText || !experience) {
        this.showStatus('Bitte alle Pflichtfelder ausfüllen', 'error');
        return;
      }

      // Lade bestehende Config
      const existingConfig = await StorageService.load<ApiConfig>(CONSTANTS.STORAGE_KEYS.API_CONFIG) || {} as ApiConfig;
      
      Logger.info('Saving API Config', {
        provider: this.currentProvider,
        apiKeyType: typeof apiKey,
        apiKeyLength: apiKey.length,
        apiKeyStart: apiKey.substring(0, 10)
      });
      
      // API Config speichern - beide Provider-Keys separat (als Strings!)
      const apiConfig: ApiConfig = {
        provider: this.currentProvider,
        apiKey: String(apiKey), // Fallback für Kompatibilität
        model: (document.getElementById('model-select') as HTMLSelectElement).value,
        // Separate Keys für jeden Provider (explizit als Strings)
        chatgptApiKey: this.currentProvider === AIProvider.CHATGPT 
          ? String(apiKey) 
          : String(existingConfig.chatgptApiKey || existingConfig.apiKey || ''),
        claudeApiKey: this.currentProvider === AIProvider.CLAUDE 
          ? String(apiKey) 
          : String(existingConfig.claudeApiKey || existingConfig.apiKey || ''),
        chatgptModel: this.currentProvider === AIProvider.CHATGPT ? (document.getElementById('model-select') as HTMLSelectElement).value : existingConfig.chatgptModel,
        claudeModel: this.currentProvider === AIProvider.CLAUDE ? (document.getElementById('model-select') as HTMLSelectElement).value : existingConfig.claudeModel
      };
      await StorageService.save(CONSTANTS.STORAGE_KEYS.API_CONFIG, apiConfig);

      // User Profile speichern
      const userProfile: UserProfile = {
        name,
        email,
        phone: (document.getElementById('user-phone') as HTMLInputElement).value,
        skills: skillsText
          .split(',')
          .map(s => s.trim())
          .filter(s => s),
        experience,
        portfolio: '',
        customIntro: (document.getElementById('user-intro') as HTMLTextAreaElement).value
      };
      await StorageService.save(CONSTANTS.STORAGE_KEYS.USER_PROFILE, userProfile);

      // Aktualisiere den Active-Badge
      this.updateActiveBadge(this.currentProvider);

      this.showStatus('Einstellungen gespeichert ✓', 'success');
      Logger.info('Settings saved successfully', {
        provider: this.currentProvider,
        savedChatGPTKey: !!apiConfig.chatgptApiKey,
        savedClaudeKey: !!apiConfig.claudeApiKey
      });

    } catch (error) {
      this.showStatus('Fehler beim Speichern', 'error');
      Logger.error('Error saving settings:', error);
    }
  }

  private async resetSettings(): Promise<void> {
    if (confirm('Alle Einstellungen zurücksetzen?')) {
      await StorageService.remove(CONSTANTS.STORAGE_KEYS.API_CONFIG);
      await StorageService.remove(CONSTANTS.STORAGE_KEYS.USER_PROFILE);

      // Felder leeren
      (document.getElementById('api-key') as HTMLInputElement).value = '';
      (document.getElementById('user-name') as HTMLInputElement).value = '';
      (document.getElementById('user-email') as HTMLInputElement).value = '';
      (document.getElementById('user-phone') as HTMLInputElement).value = '';
      (document.getElementById('user-skills') as HTMLTextAreaElement).value = '';
      (document.getElementById('user-experience') as HTMLTextAreaElement).value = '';
      (document.getElementById('user-intro') as HTMLTextAreaElement).value = '';

      this.showStatus('Einstellungen zurückgesetzt', 'success');
    }
  }

  private showStatus(message: string, type: 'success' | 'error'): void {
    const statusDiv = document.getElementById('status-message');
    if (!statusDiv) return;

    statusDiv.textContent = message;
    statusDiv.className = `status-message ${type}`;
    statusDiv.classList.remove('hidden');

    setTimeout(() => {
      statusDiv.classList.add('hidden');
    }, 3000);
  }
}

// Initialisiere Popup
new PopupController();

