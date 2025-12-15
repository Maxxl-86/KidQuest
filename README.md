# KidQuest v5.2 (Stabilitäts-Fix)

**Neu / Fixes:**
- Zuverlässiges **Intro schließen** ("Verstanden") mit `.hidden`-Klasse und Event-Bindings nach DOM-Load.
- **Profil +** im Header erstellt sofort ein neues Profil (Prompt) und wechselt dorthin.
- Service Worker Cache-Bump (`kidquest-v5.2`) → alte Dateien werden nicht mehr aus dem Cache geladen.
- Volle v5-Funktionalität bleibt: Freigabe-Flow, Limits (Tag/Woche), Badges, Erfolge, virtuelles Haustier, Dark Mode, Profile.

## Nutzung
1. ZIP entpacken.
2. Im Repo **alle Dateien ersetzen**: `index.html`, `styles.css`, `app.js`, `manifest.json`, `sw.js`, `assets/`.
3. **Hard Reload** im Browser (Strg+Shift+R / Cmd+Shift+R), damit der neue Cache gilt.

## Hinweis
- Falls weiterhin veraltete Dateien geladen werden: Browser-Cache und App-Daten für die GitHub-Pages-URL leeren.

## Lizenz
MIT
