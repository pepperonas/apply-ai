import { DOMService } from '../../src/services/DOMService';

describe('DOMService', () => {
  beforeEach(() => {
    document.body.innerHTML = '';
  });

  describe('isProjectPage', () => {
    it('should return true for project page', () => {
      Object.defineProperty(window, 'location', {
        value: { href: 'https://www.freelancermap.de/projekt/test-project', pathname: '/projekt/test-project' },
        writable: true
      });

      expect(DOMService.isProjectPage()).toBe(true);
    });

    it('should return false for non-project page', () => {
      Object.defineProperty(window, 'location', {
        value: { href: 'https://www.freelancermap.de/projekte', pathname: '/projekte' },
        writable: true
      });

      expect(DOMService.isProjectPage()).toBe(false);
    });
  });

  describe('extractProjectData', () => {
    it('should extract project data correctly', () => {
      Object.defineProperty(window, 'location', {
        value: { pathname: '/projekt/test-123' },
        writable: true
      });

      document.body.innerHTML = `
        <div class="project-header">
          <h1>Senior Java Developer</h1>
        </div>
        <div class="project-body-description">
          Great project description
        </div>
        <div class="project-body-info">
          <div class="info-item">
            <div>Eingestellt von</div>
            <div>Test Company</div>
          </div>
        </div>
        <div class="project-body-badges">
          <span class="badge">Java</span>
          <span class="badge">Spring Boot</span>
        </div>
      `;

      const project = DOMService.extractProjectData();

      expect(project).not.toBeNull();
      expect(project?.title).toBe('Senior Java Developer');
      expect(project?.description).toBe('Great project description');
      expect(project?.company).toBe('Test Company');
      expect(project?.skills).toContain('Java');
      expect(project?.skills).toContain('Spring Boot');
    });

    it('should return null if required elements are missing', () => {
      document.body.innerHTML = '<div></div>';

      const project = DOMService.extractProjectData();

      expect(project).toBeNull();
    });
  });

  describe('insertCoverLetter', () => {
    it('should insert text into textarea', () => {
      document.body.innerHTML = '<textarea id="cover-letter"></textarea>';

      const success = DOMService.insertCoverLetter('Test cover letter');

      expect(success).toBe(true);
      const textarea = document.getElementById('cover-letter') as HTMLTextAreaElement;
      expect(textarea.value).toBe('Test cover letter');
    });

    it('should return false if textarea is not found', () => {
      document.body.innerHTML = '<div></div>';

      const success = DOMService.insertCoverLetter('Test');

      expect(success).toBe(false);
    });
  });
});

