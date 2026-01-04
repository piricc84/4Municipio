# Bari Loseto Segnalazioni (PWA)

Portale PWA per segnalazioni civiche del Municipio Bari - Loseto.
Le segnalazioni vengono salvate a database e poi inviate via WhatsApp con un
messaggio precompilato (click to chat).

## Funzionalita
- Segnalazioni con foto, categoria, descrizione, indirizzo e geotag
- Mappa OpenStreetMap con scelta punto e geolocalizzazione
- WhatsApp click to chat con testo automatico
- Dashboard consigliere con filtri e cambio stato
- PWA installabile da smartphone

## Struttura
- client/: React + Vite
- server/: Node/Express + SQLite

## Avvio sviluppo
1) Server
   cd server
   npm install
   npm run dev

2) Client
   cd client
   npm install
   npm run dev

Apri http://localhost:5173

## Configurazione
- API base url: VITE_API_URL (default http://localhost:3001)
- Origine client per CORS: CLIENT_ORIGIN (default http://localhost:5173)

## Note WhatsApp
Se il numero non e compilato, il link apre WhatsApp e ti fa scegliere il
contatto. Se inserisci un numero (es. +393331234567), il link apre la chat
diretta.

## Database
SQLite: server/data/reports.sqlite

## Build produzione
1) Client
   cd client
   npm run build

2) Server
   cd server
   npm start

Il server serve client/dist se presente.

## Roadmap breve
- Aggiungere autenticazione consigliere
- Notifiche push
- Export CSV e reportistica
