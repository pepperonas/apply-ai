# ApplyAI - AI Bewerbungsassistent

Chrome Extension für automatische Generierung von Bewerbungsanschreiben auf freelancermap.de

## Features

- ✅ Automatische Erkennung von Projektseiten und Modal-Dialogen
- ✅ KI-gestützte Anschreiben-Generierung (ChatGPT & Claude)
- ✅ Intelligenter Button im Bewerbungsmodal (neben "Text generieren")
- ✅ Automatisches Skill-Matching zwischen Projekt und Profil
- ✅ Optimierte Prompts für überzeugende Freelancer-Bewerbungen
- ✅ Automatisches Modell-Fallback bei API-Fehlern
- ✅ Separate API Keys für ChatGPT und Claude
- ✅ TypeScript mit SOLID-Prinzipien

## Installation

### Entwicklung

1. Repository klonen:

```bash
git clone https://github.com/pepperonas/apply-ai.git
cd apply-ai
```

2. Dependencies installieren:

```bash
npm install
```

3. Extension bauen:

```bash
npm run build
```

4. In Chrome laden:

   - Öffne `chrome://extensions/`
   - Aktiviere "Entwicklermodus"
   - Klicke "Entpackte Erweiterung laden"
   - Wähle den `dist` Ordner

### Produktion

```bash
npm run build
```

Die Extension ist dann im `dist` Ordner bereit für die Distribution.

## Verwendung

### 1. Konfiguration

#### AI-Provider einrichten:
1. Klicke auf das Extension-Icon in der Chrome-Toolbar
2. **Wähle den Provider-Tab** (ChatGPT oder Claude)
3. Gib deinen API Key ein
4. Klicke auf **"Validieren"** um den Key zu testen
5. Wähle das gewünschte **Modell** aus der Dropdown-Liste
6. Klicke auf **"Speichern"**

**Wichtig:** Der **aktive Provider** (oben rechts angezeigt als "Aktiv: ...") wird erst nach dem **Speichern** gewechselt!

#### Profil einrichten:
1. Fülle dein Profil aus:
   - Name (Pflicht)
   - E-Mail (Pflicht)
   - Telefon (optional)
   - Skills - kommagetrennt (Pflicht)
   - Berufserfahrung (Pflicht)
   - Persönliche Intro (optional)
2. Klicke auf **"Speichern"**

#### Provider wechseln:
1. Klicke auf den **anderen Provider-Tab** (z.B. Claude statt ChatGPT)
2. Gib den API Key für diesen Provider ein (falls noch nicht vorhanden)
3. Wähle das gewünschte Modell
4. **Klicke auf "Speichern"** - erst jetzt wird der Provider aktiviert!
5. Der Badge oben rechts zeigt nun den neuen Provider an

### 2. Bewerbung generieren

1. Navigiere zu einer Projektseite auf freelancermap.de
2. Klicke auf **"Bewerben"** um den Bewerbungsdialog zu öffnen
3. Der **"ApplyAI"** Button (mit Diamant-Icon 💎) erscheint automatisch neben dem "Text generieren" Button
4. Klicke auf **"ApplyAI"** um das Anschreiben zu generieren
5. Das generierte Anschreiben wird automatisch in das Textfeld eingefügt

## AI-Provider & Modelle

### ChatGPT (OpenAI)
- **gpt-4** - Empfohlen für beste Qualität
- **gpt-4-turbo** - Schneller, kostengünstiger
- **gpt-3.5-turbo** - Am günstigsten

API Key Format: `sk-proj-...` oder `sk-...`  
Weitere Infos: https://platform.openai.com/api-keys

### Claude (Anthropic)

#### Funktionierende Modelle (getestet Dezember 2025) ⭐
- **claude-3-haiku-20240307** - ⭐ Standard, schnell & zuverlässig
- **claude-3-opus-20240229** - Höchste Qualität (Fallback)

API Key Format: `sk-ant-api03-...` oder `sk-ant-...`  
API Key erstellen: https://console.anthropic.com/

**Wichtig:** 
- Die Extension verwendet den `anthropic-dangerous-direct-browser-access` Header für Browser-Anfragen
- Automatisches Modell-Fallback: Falls ein Modell nicht verfügbar ist, wird automatisch das nächste probiert
- Bei 404-Fehlern (Modell nicht gefunden) wird automatisch ein alternatives Modell verwendet

## Entwicklung

### Befehle

- `npm run dev` - Entwicklungsmodus mit Watch
- `npm run build` - Production Build
- `npm test` - Tests ausführen
- `npm run test:watch` - Tests im Watch-Modus
- `npm run test:coverage` - Test Coverage Report
- `npm run lint` - Code linting
- `npm run type-check` - TypeScript Type Checking
- `npm run install-extension` - Extension automatisch in Chrome installieren/updaten

### Projektstruktur

```
apply-ai/
├── src/
│   ├── background/      # Service Worker
│   ├── content/         # Content Scripts
│   ├── popup/           # Extension Popup
│   ├── overlay/         # Overlay UI
│   ├── models/          # Data Models
│   ├── services/        # Business Logic
│   ├── controllers/     # MVC Controllers
│   └── utils/           # Utilities
├── tests/               # Test Files
└── dist/                # Build Output
```

## API Keys

### ChatGPT

Erstelle einen API Key auf [platform.openai.com](https://platform.openai.com/api-keys)

**Format:** `sk-...` (beginnt mit `sk-`)

### Claude

Erstelle einen API Key auf [console.anthropic.com](https://console.anthropic.com/)

**Format:** `sk-ant-...` oder `sk-ant-api03-...` (beginnt mit `sk-ant-`)

**Wichtig:** 
- Der API Key muss vollständig kopiert werden (keine Leerzeichen am Anfang/Ende)
- Die Extension verwendet direkte Browser-Anfragen mit dem `anthropic-dangerous-direct-browser-access` Header
- Automatisches Modell-Fallback bei 404-Fehlern
- Falls die Validierung fehlschlägt, prüfe die Browser-Konsole (F12 → Console) für detaillierte Fehlermeldungen

## Troubleshooting

### Claude API Key wird als ungültig erkannt

1. **Prüfe das Format:**
   - Der Key sollte mit `sk-ant-` oder `sk-ant-api03-` beginnen
   - Stelle sicher, dass der Key vollständig kopiert wurde (keine Leerzeichen)

2. **Prüfe die Browser-Konsole:**
   - Öffne die Browser-Konsole (F12 → Console)
   - Suche nach Fehlermeldungen mit `[ApplyAI]`
   - Die Fehlermeldungen zeigen das genaue Problem

3. **Häufige Fehler:**
   - **401 Unauthorized**: API Key ist ungültig oder falsch kopiert
   - **403 Forbidden**: API Key hat keine Berechtigung für die API
   - **400 Bad Request**: Request-Format ist falsch (sollte automatisch funktionieren)
   - **CORS Error**: Wird automatisch über Background Service Worker umgangen

4. **API Key neu generieren:**
   - Falls der Key nicht funktioniert, generiere einen neuen auf [console.anthropic.com](https://console.anthropic.com/)
   - Stelle sicher, dass der Key die richtigen Berechtigungen hat

5. **Extension neu laden:**
   - Gehe zu `chrome://extensions/`
   - Klicke auf "Aktualisieren" (🔄) bei der ApplyAI Extension
   - Versuche die Validierung erneut

## Lizenz

MIT License - siehe LICENSE Datei

## Author

© 2025 Martin Pfeffer | [celox.io](https://celox.io)

---

Entwickelt mit ❤️ in Berlin

