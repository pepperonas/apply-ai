import { Project } from '../models/Project';
import { UserProfile } from '../models/UserProfile';

/**
 * Abstrakte Basisklasse für AI-Provider (Strategy Pattern)
 */
export abstract class AIService {
  protected apiKey: string;
  protected model: string;

  constructor(apiKey: string, model: string) {
    this.apiKey = apiKey;
    this.model = model;
  }

  /**
   * Generiert ein Bewerbungsanschreiben
   * @param project Projektdaten
   * @param userProfile Benutzerprofil
   * @returns Promise mit generiertem Anschreiben
   */
  abstract generateCoverLetter(
    project: Project,
    userProfile: UserProfile
  ): Promise<string>;

  /**
   * Validiert die API-Verbindung
   */
  abstract validateApiKey(): Promise<boolean>;

  /**
   * Baut den Prompt für die AI-Generierung
   */
  protected buildPrompt(project: Project, userProfile: UserProfile): string {
    // Finde übereinstimmende Skills zwischen Projekt und Bewerber
    const projectSkillsLower = project.skills.map(s => s.toLowerCase());
    const matchingSkills = userProfile.skills.filter(skill => 
      projectSkillsLower.some(ps => ps.includes(skill.toLowerCase()) || skill.toLowerCase().includes(ps))
    );
    
    return `
Du bist ein erfahrener Freelancer, der überzeugende Bewerbungsanschreiben schreibt.

=== PROJEKTAUSSCHREIBUNG ===
Titel: ${project.title}
Unternehmen: ${project.company}
Beschreibung: ${project.description}
Gesuchte Skills: ${project.skills.join(', ')}
Arbeitsort: ${project.location}${project.remote ? ' (Remote möglich)' : ''}
Projektstart: ${project.startDate}
Projektdauer: ${project.duration}

=== FREELANCER-PROFIL ===
Name: ${userProfile.name}
Berufserfahrung: ${userProfile.experience}
Kernkompetenzen: ${userProfile.skills.join(', ')}
${matchingSkills.length > 0 ? `Passende Skills für dieses Projekt: ${matchingSkills.join(', ')}` : ''}
${userProfile.customIntro ? `Persönlicher Stil: ${userProfile.customIntro}` : ''}

=== AUFGABE ===
Schreibe ein Bewerbungsanschreiben für dieses Projekt.

STIL & TON:
- Selbstbewusst, aber nicht arrogant
- Professionell, aber persönlich und authentisch
- Direkt und auf den Punkt – keine Floskeln
- Wie ein erfahrener Freelancer, der weiß was er kann

STRUKTUR (ca. 250-300 Wörter):
1. BEGRÜSSUNG (1 Satz): Professionelle, aber persönliche Anrede
   - Beispiel: "Hallo [Firmenname-Team] / Guten Tag,"
   - Oder: "Hallo,"
   - NICHT zu formell ("Sehr geehrte Damen und Herren" vermeiden)

2. HOOK & EINSTIEG (2-3 Sätze): Zeige, dass du das Projekt verstanden hast und warum es dich interessiert
   - Direkter Bezug zur Projektbeschreibung
   - Warum passt dieses Projekt zu dir?

3. RELEVANTE ERFAHRUNG (4-5 Sätze): Konkrete Beispiele, die zu den Projektanforderungen passen
   - Erwähne passende Projekte/Erfahrungen
   - Konkrete Technologien/Tools aus der Projektbeschreibung
   - Wenn Remote-Arbeit möglich ist, erwähne deine Erfahrung damit

4. MEHRWERT (2-3 Sätze): Was du dem Projekt/Team bringst, das andere nicht haben
   - Besondere Stärken oder Erfahrungen
   - Wie du zum Projekterfolg beiträgst

5. VERFÜGBARKEIT & ABSCHLUSS (2 Sätze): Zeitliche Verfügbarkeit und Interesse an Gespräch

6. VERABSCHIEDUNG (1 Satz): Professionelle Grußformel
   - Beispiel: "Viele Grüße" oder "Beste Grüße"
   - Dann: Name in neuer Zeile

WICHTIGE REGELN:
- Professionelle, aber nicht zu formelle Anrede
- KEINE generischen Phrasen wie "Ich habe mit großem Interesse...", "Ich bin überzeugt...", "Ich freue mich auf Ihre Rückmeldung..."
- KEINE Aufzählung aller Skills – nur die relevanten für DIESES Projekt
- VERMEIDE passive Formulierungen – schreibe aktiv und selbstbewusst
- Erwähne konkrete Technologien/Tools aus der Projektbeschreibung
- Wenn Remote-Arbeit möglich ist, erwähne deine Erfahrung damit

Schreibe NUR das Anschreiben, keine zusätzlichen Kommentare.
    `.trim();
  }
}

