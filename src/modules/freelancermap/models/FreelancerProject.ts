/**
 * FreelancerMap spezifisches Projekt-Modell
 */
export interface FreelancerProject {
  id: string;
  title: string;
  description: string;
  company: string;
  location: string;
  remote: boolean;
  skills: string[];
  startDate?: string;
  duration?: string;
  workload?: string;
}

export class FreelancerProjectModel implements FreelancerProject {
  id: string;
  title: string;
  description: string;
  company: string;
  location: string;
  remote: boolean;
  skills: string[];
  startDate?: string;
  duration?: string;
  workload?: string;

  constructor(data: Partial<FreelancerProject>) {
    this.id = data.id || '';
    this.title = data.title || '';
    this.description = data.description || '';
    this.company = data.company || '';
    this.location = data.location || '';
    this.remote = data.remote || false;
    this.skills = data.skills || [];
    this.startDate = data.startDate;
    this.duration = data.duration;
    this.workload = data.workload;
  }

  validate(): boolean {
    return !!(this.title && this.description);
  }
}

