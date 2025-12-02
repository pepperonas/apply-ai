/**
 * Validation utilities
 */
export class Validators {
  /**
   * Validiert eine E-Mail-Adresse
   */
  static isValidEmail(email: string): boolean {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  }

  /**
   * Validiert einen API Key (basic check)
   */
  static isValidApiKey(key: string, provider: 'chatgpt' | 'claude'): boolean {
    if (!key || key.length < 10) {
      return false;
    }

    if (provider === 'chatgpt') {
      return key.startsWith('sk-');
    }

    if (provider === 'claude') {
      return key.startsWith('sk-ant-') || key.length > 20;
    }

    return false;
  }

  /**
   * Validiert eine Telefonnummer (basic check)
   */
  static isValidPhone(phone: string): boolean {
    if (!phone) return true; // Optional field
    const phoneRegex = /^[\d\s\+\-\(\)]+$/;
    return phoneRegex.test(phone) && phone.length >= 8;
  }
}

