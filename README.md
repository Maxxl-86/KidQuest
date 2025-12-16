
# FamilyPoints (Expo React Native)

Eine kinderfreundliche Punkte-App für gutes Zusammenleben, Hausaufgaben und Haushaltshilfe.

## Schnellstart

Voraussetzungen:
- Node.js (LTS) & npm: https://nodejs.org/
- Expo Go App auf dem Smartphone (Android/iOS)

Schritte:
1. Im Terminal ins Projekt wechseln:
   ```bash
   cd family-points-app-expo-starter
   ```
2. Abhängigkeiten installieren:
   ```bash
   npm install
   ```
3. Starten:
   ```bash
   npx expo start
   ```
4. Im Expo-Entwicklerserver den QR-Code mit **Expo Go** scannen.

## Funktionen (MVP)
- Kind-Ansicht: Punkte, Aufgabenliste, Belohnungen (nur ansehen).
- Eltern-Ansicht (Admin): Punkte vergeben, Aufgaben/Belohnungen verwalten, PIN-Schutz.
- Offline-first Speicherung via AsyncStorage.
- Verlauf (wer, was, wann) zur Nachvollziehbarkeit.

## Geplante Erweiterungen
- Aufgaben-Freigaben (Kind markiert, Eltern bestätigen).
- Badges/Level, Wochenziele, Streaks.
- Cloud-Sync (Firebase/EAS) und echte App-Builds (APK/IPA) via EAS Build.
- Mehrsprachigkeit.

## Entwicklung
- Navigationsstruktur: Bottom Tabs (Home, Aufgaben, Belohnungen, Verlauf, Admin)
- State-Management: React Context (DataContext) + AsyncStorage Persistenz

## Lizenz
MIT

