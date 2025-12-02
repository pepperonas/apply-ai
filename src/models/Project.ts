/**
 * Repräsentiert ein Projekt von freelancermap.de
 */
export interface Project {
  id: string;
  title: string;
  description: string;
  company: string;
  location: string;
  remote: boolean;
  skills: string[];
  startDate: string;
  duration: string;
  workload: string;
}

export class ProjectModel implements Project {
  id: string;
  title: string;
  description: string;
  company: string;
  location: string;
  remote: boolean;
  skills: string[];
  startDate: string;
  duration: string;
  workload: string;

  constructor(data: Partial<Project>) {
    this.id = data.id || '';
    this.title = data.title || '';
    this.description = data.description || '';
    this.company = data.company || '';
    this.location = data.location || '';
    this.remote = data.remote || false;
    this.skills = data.skills || [];
    this.startDate = data.startDate || '';
    this.duration = data.duration || '';
    this.workload = data.workload || '';
  }

  /**
   * Validiert die Projektdaten
   */
  validate(): boolean {
    return !!(
      this.id &&
      this.title &&
      this.description &&
      this.company
    );
  }
}

