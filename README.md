# KidQuest v5 (Erfolge & Virtuelles Haustier)

**Neu in v5:**
- **Erfolge & Trophäen**: „Erster Streak“, „1000 Punkte insgesamt“, „10 Belohnungen eingelöst“ – eigener Bereich mit Icons & kleiner Animation.
- **Virtuelles Haustier/Pflanze**: wächst mit deinen Punkten; bei Streak-Verlust **verwelkt** (temporär) → motiviert dranzubleiben.
- Voll kompatibel mit v4: Branding, Dark Mode, Intro, Profile, Freigabe-Flow, Limits, Badges & Streak-Bonus.

## Nutzung
1. ZIP entpacken.
2. `index.html` doppelklicken (lokal ohne Service Worker).
3. Für GitHub Pages: alle Dateien hochladen (auch `manifest.json`, `sw.js`, `assets/`).

## Dateien
- `index.html`, `styles.css`, `app.js`, `manifest.json`, `sw.js`, `assets/`

## Anpassung
- Erfolge in `app.js` (Liste `ACHIEVEMENTS`).
- Haustier-Logik in `app.js` (`computePetStage`, `updateStreakOnAction`).

## Lizenz
MIT
