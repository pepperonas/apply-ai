import { AIService } from './AIService';
import { Project } from '../models/Project';
import { UserProfile } from '../models/UserProfile';
import { Logger } from '../utils/logger';
import { CONSTANTS } from '../utils/constants';

export class ChatGPTProvider extends AIService {
  private readonly baseUrl = CONSTANTS.API_ENDPOINTS.CHATGPT;

  async generateCoverLetter(
    project: Project,
    userProfile: UserProfile
  ): Promise<string> {
    const prompt = this.buildPrompt(project, userProfile);

    try {
      const response = await fetch(this.baseUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.apiKey}`
        },
        body: JSON.stringify({
          model: this.model || CONSTANTS.DEFAULT_MODELS.CHATGPT,
          messages: [
            {
              role: 'system',
              content: 'Du bist ein Experte für professionelle Bewerbungsanschreiben im IT-Bereich.'
            },
            {
              role: 'user',
              content: prompt
            }
          ],
          temperature: 0.7,
          max_tokens: 1000
        })
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`API Error: ${response.status} ${response.statusText} - ${errorText}`);
      }

      const data = await response.json();
      
      if (!data.choices || !data.choices[0] || !data.choices[0].message) {
        throw new Error('Ungültige API-Antwort: Keine Nachricht gefunden');
      }

      return data.choices[0].message.content;

    } catch (error) {
      Logger.error('ChatGPT API Error:', error);
      throw new Error('Fehler bei der Generierung des Anschreibens mit ChatGPT');
    }
  }

  async validateApiKey(): Promise<boolean> {
    try {
      const response = await fetch('https://api.openai.com/v1/models', {
        headers: { 'Authorization': `Bearer ${this.apiKey}` }
      });
      return response.ok;
    } catch {
      return false;
    }
  }
}

