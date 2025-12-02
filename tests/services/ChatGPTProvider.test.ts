import { ChatGPTProvider } from '../../src/services/ChatGPTProvider';
import { Project } from '../../src/models/Project';
import { UserProfile } from '../../src/models/UserProfile';

describe('ChatGPTProvider', () => {
  let provider: ChatGPTProvider;
  const mockApiKey = 'sk-test-key';

  beforeEach(() => {
    provider = new ChatGPTProvider(mockApiKey, 'gpt-4');
    jest.clearAllMocks();
  });

  describe('generateCoverLetter', () => {
    it('should generate a cover letter successfully', async () => {
      const mockProject: Project = {
        id: '123',
        title: 'Senior Java Developer',
        description: 'We need a Java expert',
        company: 'Test GmbH',
        location: 'Berlin',
        remote: true,
        skills: ['Java', 'Spring Boot'],
        startDate: '01.01.2025',
        duration: '12 Monate',
        workload: '100%'
      };

      const mockProfile: UserProfile = {
        name: 'Max Mustermann',
        email: 'max@example.com',
        phone: '+49123456789',
        skills: ['Java', 'Spring Boot', 'React'],
        experience: '10 Jahre Java-Entwicklung',
        portfolio: 'https://github.com/max'
      };

      (global.fetch as jest.Mock).mockResolvedValue({
        ok: true,
        json: async () => ({
          choices: [{
            message: {
              content: 'Sehr geehrte Damen und Herren, hiermit bewerbe ich mich...'
            }
          }]
        })
      });

      const result = await provider.generateCoverLetter(mockProject, mockProfile);

      expect(result).toContain('bewerbe');
      expect(fetch).toHaveBeenCalledWith(
        expect.stringContaining('openai.com'),
        expect.objectContaining({
          method: 'POST',
          headers: expect.objectContaining({
            'Authorization': `Bearer ${mockApiKey}`
          })
        })
      );
    });

    it('should throw error on API failure', async () => {
      (global.fetch as jest.Mock).mockResolvedValue({
        ok: false,
        status: 401,
        statusText: 'Unauthorized',
        text: async () => 'Unauthorized'
      });

      const mockProject = {} as Project;
      const mockProfile = {} as UserProfile;

      await expect(
        provider.generateCoverLetter(mockProject, mockProfile)
      ).rejects.toThrow('Fehler bei der Generierung');
    });
  });

  describe('validateApiKey', () => {
    it('should return true for valid API key', async () => {
      (global.fetch as jest.Mock).mockResolvedValue({ ok: true });

      const result = await provider.validateApiKey();

      expect(result).toBe(true);
    });

    it('should return false for invalid API key', async () => {
      (global.fetch as jest.Mock).mockResolvedValue({ ok: false });

      const result = await provider.validateApiKey();

      expect(result).toBe(false);
    });

    it('should return false on network error', async () => {
      (global.fetch as jest.Mock).mockRejectedValue(new Error('Network error'));

      const result = await provider.validateApiKey();

      expect(result).toBe(false);
    });
  });
});

