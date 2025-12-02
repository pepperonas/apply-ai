/**
 * Benutzer-Profildaten für Anschreiben
 */
export interface UserProfile {
  name: string;
  email: string;
  phone: string;
  skills: string[];
  experience: string;
  portfolio: string;
  customIntro?: string;
}

export class UserProfileModel implements UserProfile {
  name: string;
  email: string;
  phone: string;
  skills: string[];
  experience: string;
  portfolio: string;
  customIntro?: string;

  constructor(data: Partial<UserProfile>) {
    this.name = data.name || '';
    this.email = data.email || '';
    this.phone = data.phone || '';
    this.skills = data.skills || [];
    this.experience = data.experience || '';
    this.portfolio = data.portfolio || '';
    this.customIntro = data.customIntro;
  }

  /**
   * Validiert die Profildaten
   */
  validate(): boolean {
    return !!(
      this.name &&
      this.email &&
      this.skills.length > 0 &&
      this.experience
    );
  }
}

