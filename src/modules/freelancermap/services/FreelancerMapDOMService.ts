import { FreelancerProject } from '../models/FreelancerProject';
import { Logger } from '../../../shared/utils/logger';

/**
 * DOM Service für FreelancerMap.de
 */
export class FreelancerMapDOMService {
  /**
   * Prüft ob wir auf einer FreelancerMap Seite sind
   */
  static isFreelancerMapPage(): boolean {
    return window.location.hostname.includes('freelancermap.de');
  }

  /**
   * Extrahiert Projektdaten von der Seite oder aus dem Modal
   */
  static extractProjectData(): FreelancerProject | null {
    const modalData = this.extractProjectDataFromModal();
    if (modalData) {
      Logger.info('[FreelancerMap] Projektdaten aus Modal extrahiert');
      return modalData;
    }

    const pageData = this.extractProjectDataFromPage();
    if (pageData) {
      Logger.info('[FreelancerMap] Projektdaten von Seite extrahiert');
      return pageData;
    }

    Logger.warn('[FreelancerMap] Keine Projektdaten gefunden');
    return null;
  }

  /**
   * Extrahiert Projektdaten aus dem Bewerbungsmodal
   */
  private static extractProjectDataFromModal(): FreelancerProject | null {
    try {
      const modal = document.querySelector('.modal.search-result-modal.show');
      if (!modal) return null;

      const titleElement = modal.querySelector('.modal-header h5') ||
        modal.querySelector('.modal-title') ||
        modal.querySelector('h5, h4, h3');
      
      let descriptionElement = modal.querySelector('.project-description') ||
        modal.querySelector('.description') ||
        modal.querySelector('[class*="description"]');

      const companyElement = modal.querySelector('.company-name') ||
        modal.querySelector('[class*="company"]');

      const badgeElements = modal.querySelectorAll('.badge, .skill-badge');
      const locationElement = modal.querySelector('[class*="location"]');
      const modalText = modal.textContent || '';
      const remote = modalText.toLowerCase().includes('remote');

      const title = titleElement?.textContent?.trim() || '';
      let description = descriptionElement?.textContent?.trim() || '';
      
      if (!description || description.length < 50) {
        const modalBody = modal.querySelector('.modal-body');
        if (modalBody) {
          const paragraphs: string[] = [];
          modalBody.querySelectorAll('p, div[class*="description"]').forEach(el => {
            const text = el.textContent?.trim();
            if (text && text.length > 30) {
              paragraphs.push(text);
            }
          });
          description = paragraphs.join('\n\n');
        }
      }

      const company = companyElement?.textContent?.trim() || '';
      const skills = Array.from(badgeElements)
        .map(badge => badge.textContent?.trim() || '')
        .filter(skill => skill && !skill.includes('Top-Projekt'));

      const location = locationElement?.textContent?.trim() || '';
      const projectId = `modal-project-${Date.now()}`;

      return {
        id: projectId,
        title,
        description,
        company,
        location,
        remote,
        skills
      };
    } catch (error) {
      Logger.error('[FreelancerMap] Error extracting modal data:', error);
      return null;
    }
  }

  /**
   * Extrahiert Projektdaten von der Projektdetailseite
   */
  private static extractProjectDataFromPage(): FreelancerProject | null {
    try {
      const titleElement = document.querySelector('h1.project-title') ||
        document.querySelector('h1');
      const descriptionElement = document.querySelector('.project-description') ||
        document.querySelector('[class*="description"]');
      const companyElement = document.querySelector('.company-name');
      const badgeElements = document.querySelectorAll('.badge, .skill-badge');
      const locationElement = document.querySelector('[class*="location"]');

      if (!titleElement || !descriptionElement) {
        return null;
      }

      const title = titleElement.textContent?.trim() || '';
      const description = descriptionElement.textContent?.trim() || '';
      const company = companyElement?.textContent?.trim() || '';
      const location = locationElement?.textContent?.trim() || '';
      const skills = Array.from(badgeElements)
        .map(badge => badge.textContent?.trim() || '')
        .filter(skill => skill);

      const pageText = document.body.textContent || '';
      const remote = pageText.toLowerCase().includes('remote');

      const urlMatch = window.location.pathname.match(/\/projekt\/(\d+)/);
      const projectId = urlMatch ? `project-${urlMatch[1]}` : `page-project-${Date.now()}`;

      return {
        id: projectId,
        title,
        description,
        company,
        location,
        remote,
        skills
      };
    } catch (error) {
      Logger.error('[FreelancerMap] Error extracting page data:', error);
      return null;
    }
  }

  /**
   * Findet das Anschreiben-Textfeld
   */
  static getCoverLetterField(): HTMLTextAreaElement | null {
    return document.getElementById('cover-letter') as HTMLTextAreaElement ||
           document.querySelector('textarea[name="coverLetter"]') as HTMLTextAreaElement ||
           document.querySelector('textarea[placeholder*="Anschreiben"]') as HTMLTextAreaElement;
  }

  /**
   * Fügt Text in das Anschreiben-Feld ein (React-kompatibel)
   */
  static insertCoverLetter(text: string): boolean {
    const textarea = this.getCoverLetterField();
    if (!textarea) {
      Logger.error('[FreelancerMap] Cover letter field not found');
      return false;
    }

    try {
      const cleanedText = this.cleanGeneratedText(text);
      
      const nativeInputValueSetter = Object.getOwnPropertyDescriptor(
        window.HTMLTextAreaElement.prototype,
        'value'
      )?.set;

      if (nativeInputValueSetter) {
        nativeInputValueSetter.call(textarea, cleanedText);
      } else {
        textarea.value = cleanedText;
      }

      textarea.dispatchEvent(new Event('input', { bubbles: true }));
      textarea.dispatchEvent(new Event('change', { bubbles: true }));
      textarea.dispatchEvent(new InputEvent('input', { 
        data: cleanedText,
        bubbles: true,
        cancelable: true
      }));

      textarea.focus();
      textarea.blur();
      textarea.setSelectionRange(cleanedText.length, cleanedText.length);

      Logger.info('[FreelancerMap] Cover letter inserted successfully');
      return true;
    } catch (error) {
      Logger.error('[FreelancerMap] Error inserting cover letter:', error);
      return false;
    }
  }

  /**
   * Bereinigt generierten Text
   */
  private static cleanGeneratedText(text: string): string {
    let cleaned = text.trim();
    
    cleaned = cleaned.replace(/\*\*/g, '');
    cleaned = cleaned.replace(/\*/g, '');
    cleaned = cleaned.replace(/^#+\s+/gm, '');
    cleaned = cleaned.replace(/^- /gm, '');
    cleaned = cleaned.replace(/^(Hier ist dein Anschreiben|OUTPUT:|Hier ist das generierte Anschreiben):?\s*/i, '');
    cleaned = cleaned.replace(/(\n\s*){2,}/g, '\n\n');
    cleaned = cleaned.trim();

    if (cleaned.startsWith('Guten Tag, Guten Tag,')) {
      cleaned = cleaned.replace('Guten Tag, Guten Tag,', 'Guten Tag,');
    }
    
    return cleaned;
  }
}

