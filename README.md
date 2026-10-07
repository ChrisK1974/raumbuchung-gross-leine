# Raumbuchung – Gemeinde Märkische Heide, Groß Leine

Diese Projektvorlage enthält eine komplette kleine Webanwendung für die Raumbuchung mit:

- Landingpage für Bürger
- Online-Buchung mit Preisberechnung
- PDF-Download des Antrags
- Admin-Login mit Benutzername/Passwort
- Verwaltung, Bearbeitung und Löschung von Buchungen
- CSV-Export
- SQLite-Datenbank

## Schnellstart

1. Node.js installieren
2. Im Projektordner ausführen:

```bash
npm install
npm start
```

3. Öffne im Browser:
   - Startseite: http://localhost:3000/
   - Adminbereich: http://localhost:3000/admin

## Standard-Admin-Zugang

- Benutzername: `admin`
- Passwort: `admin123`

Du kannst diese Werte über Umgebungsvariablen setzen:

```bash
export ADMIN_USERNAME=admin
export ADMIN_PASSWORD=deinPasswort
export JWT_SECRET=deinGeheimerKey
npm start
```

## Funktionen der Seite

- Raumbuchungsantrag mit automatischer Preisberechnung
- Freie und belegte Tage im Kalender
- Raumwahl: Sitzungsraum oder Großer Raum
- Küche kann optional mitgebucht werden
- Formular erzeugt direkt ein PDF
- Admin kann Buchungen bearbeiten und exportieren

## Wichtige Hinweise

- Die App ist für den lokalen Betrieb optimiert.
- Für den echten Live-Betrieb sollte sie mit einem Webserver/Reverse Proxy und dauerhaftem Hosting ergänzt werden.
