import { Logger } from '../shared/utils/logger';

/**
 * Content Script Router
 * Entscheidet basierend auf der URL, welches Modul geladen wird
 */
class ContentRouter {
  constructor() {
    Logger.info('[ContentRouter] Initializing...');
    this.route();
  }

  private route(): void {
    const hostname = window.location.hostname;
    const pathname = window.location.pathname;

    Logger.info('[ContentRouter] Current URL:', {
      hostname,
      pathname
    });

    // FreelancerMap
    if (hostname.includes('freelancermap.de')) {
      Logger.info('[ContentRouter] Loading FreelancerMap module');
      this.loadFreelancerMapModule();
      return;
    }

    // Kleinanzeigen
    if (hostname.includes('kleinanzeigen.de') && pathname.includes('/s-anzeige/')) {
      Logger.info('[ContentRouter] Loading Kleinanzeigen module');
      this.loadKleinanzeigenModule();
      return;
    }

    Logger.info('[ContentRouter] No matching module for this page');
  }

  /**
   * Lädt das FreelancerMap Modul
   */
  private async loadFreelancerMapModule(): Promise<void> {
    try {
      await import('../modules/freelancermap/content-script');
      Logger.info('[ContentRouter] FreelancerMap module loaded');
    } catch (error) {
      Logger.error('[ContentRouter] Error loading FreelancerMap module:', error);
    }
  }

  /**
   * Lädt das Kleinanzeigen Modul
   */
  private async loadKleinanzeigenModule(): Promise<void> {
    try {
      await import('../modules/kleinanzeigen/content-script');
      Logger.info('[ContentRouter] Kleinanzeigen module loaded');
    } catch (error) {
      Logger.error('[ContentRouter] Error loading Kleinanzeigen module:', error);
    }
  }
}

// Initialisiere Router
new ContentRouter();

