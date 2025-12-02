import { Logger } from '../utils/logger';

/**
 * Service für Chrome Storage API
 */
export class StorageService {
  /**
   * Prüft ob Extension Context noch gültig ist
   */
  private static isContextValid(): boolean {
    try {
      return !!chrome?.runtime?.id;
    } catch {
      return false;
    }
  }

  /**
   * Speichert Daten im Chrome Storage
   */
  static async save<T>(key: string, value: T): Promise<void> {
    if (!this.isContextValid()) {
      const error = new Error('Extension context invalidated. Bitte lade die Seite neu.');
      Logger.error('StorageService.save: Extension context invalidated');
      throw error;
    }

    return new Promise((resolve, reject) => {
      try {
        chrome.storage.sync.set({ [key]: value }, () => {
          if (chrome.runtime.lastError) {
            const error = chrome.runtime.lastError.message || 'Unknown error';
            if (error.includes('Extension context invalidated')) {
              Logger.error('Extension context invalidated during save');
              reject(new Error('Extension wurde neu geladen. Bitte lade die Seite neu.'));
            } else {
              reject(chrome.runtime.lastError);
            }
          } else {
            resolve();
          }
        });
      } catch (error) {
        Logger.error('StorageService.save error:', error);
        reject(error);
      }
    });
  }

  /**
   * Lädt Daten aus Chrome Storage
   */
  static async load<T>(key: string): Promise<T | null> {
    if (!this.isContextValid()) {
      const error = new Error('Extension context invalidated. Bitte lade die Seite neu.');
      Logger.error('StorageService.load: Extension context invalidated');
      throw error;
    }

    return new Promise((resolve, reject) => {
      try {
        chrome.storage.sync.get([key], (result) => {
          if (chrome.runtime.lastError) {
            const error = chrome.runtime.lastError.message || 'Unknown error';
            if (error.includes('Extension context invalidated')) {
              Logger.error('Extension context invalidated during load');
              reject(new Error('Extension wurde neu geladen. Bitte lade die Seite neu.'));
            } else {
              reject(chrome.runtime.lastError);
            }
          } else {
            resolve(result[key] || null);
          }
        });
      } catch (error) {
        Logger.error('StorageService.load error:', error);
        reject(error);
      }
    });
  }

  /**
   * Löscht Daten aus Chrome Storage
   */
  static async remove(key: string): Promise<void> {
    if (!this.isContextValid()) {
      const error = new Error('Extension context invalidated. Bitte lade die Seite neu.');
      Logger.error('StorageService.remove: Extension context invalidated');
      throw error;
    }

    return new Promise((resolve, reject) => {
      try {
        chrome.storage.sync.remove(key, () => {
          if (chrome.runtime.lastError) {
            const error = chrome.runtime.lastError.message || 'Unknown error';
            if (error.includes('Extension context invalidated')) {
              Logger.error('Extension context invalidated during remove');
              reject(new Error('Extension wurde neu geladen. Bitte lade die Seite neu.'));
            } else {
              reject(chrome.runtime.lastError);
            }
          } else {
            resolve();
          }
        });
      } catch (error) {
        Logger.error('StorageService.remove error:', error);
        reject(error);
      }
    });
  }
}

