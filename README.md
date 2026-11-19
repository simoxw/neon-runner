# Neon Runner: Cyber City

Endless runner cyberpunk ad alta velocità sviluppato con **Phaser 3**, **React 19**, **TypeScript** e **Tailwind CSS**, progettato per funzionare in modo fluido sia da desktop che da smartphone come **Progressive Web App (PWA)** installabile e giocabile anche offline.

---

## Caratteristiche Principali

- **Salto Variabile, Doppio Salto, Planata & Fast-Fall**:
  - **Tap breve** (touch, click o `Spazio` / `Freccia Su`): salto rapido e basso per superare singole barriere.
  - **Doppio Salto**: premendo una seconda volta a mezz'aria si attiva un boost propulsivo con scia di particelle.
  - **Pressione prolungata & Planata (Glide)**: tenendo premuto in salita si raggiunge la quota massima; continuando in discesa si attivano i propulsori per planare.
  - **Picchiata rapida (Fast-Fall)**: scorrendo verso il basso su mobile (`swipe down`) o premendo `↓` / `S` si interrompe il volo scendendo rapidamente a terra.
  - **Coyote Time & Jump Buffering**: tolleranza all'uscita dalle piattaforme e pre-caricamento del salto prima dell'atterraggio.
- **Piattaforme Aeree, Ostacoli, Cyber Drones & Missili**:
  - **Piattaforme Aeree One-Way**: passerelle neon sopraelevate attraversabili saltando dal basso, con scie di crediti bonus in cima.
  - **Barriere laser** (basse e alte) indistruttibili da evitare o scavalcare.
  - **Cyber Drones** volanti abbattuti dal blaster automatico rilasciando esplosioni e **crediti bonus**.
  - **Missili in arrivo** con segnalatore di pericolo sul bordo destro (`tracking` -> `lock-on` -> lancio ad alta velocità).
- **Hyper Overdrive & Power-Up**:
  - **Barra Overdrive**: si carica gradualmente (~450–550m) raccogliendo crediti e abbattendo droni; al 100% attiva 5,5 secondi di **corsa invincibile ad alta velocità** che sfonda barriere, droni e missili generando crediti extra.
  - **Energy Shield**: assorbe un impatto fatale attivando brevi frame di invulnerabilità.
  - **Credit Magnet**: attira automaticamente tutti i crediti nel raggio d'azione.
- **Mini-Missioni, Settori Dinamici & Officina (Upgrades & Skins)**:
  - **3 Mini-Missioni attive** a rotazione automatica (distanza, droni, crediti, doppi salti, fast-fall, Overdrive) che assegnano **Credits bonus** al completamento.
  - Ogni **300 metri** l'ambiente cambia settore (`Cyber Cyan`, `Crimson Grid`, `Solar Amber`, `Ultraviolet Core`) con transizione cromatica fluida di cielo, città e pavimento.
  - Record personale (`highScore`), portafoglio **Credits**, 4 upgrade (**Energy Shield**, **Credit Magnet**, **Pulse Blaster**, **Credit Boost**) e **5 Skin cromatiche** sbloccabili sono salvati automaticamente in `localStorage`.
- **Audio Sintetico Zero-Dipendenze**:
  - Effetti sonori generati in tempo reale tramite **Web Audio API** (salto, doppio salto, planata, fast-fall, atterraggio, sparo, avviso e lancio missile, overdrive smash, cambio settore, completamento missione, game over) con tasto **Mute** nell'HUD e nel menu.
- **Responsive Mobile, Orientamento & PWA Offline**:
  - Supporto sia verticale che **Orizzontale (Landscape)** dal menu con Fullscreen nativo su Android e guida rapida su iOS, ricalibrazione dinamica del canvas Phaser e aggiornamento automatico Service Worker con banner nel menu.

---

## Controlli

| Azione | Mobile (Touch) | Desktop (Mouse / Tastiera) |
| :--- | :--- | :--- |
| **Salto / Doppio Salto** | Tap rapido (e secondo tap in volo) | Click / `Spazio` / `↑` (e seconda pressione in volo) |
| **Salto alto & Planata** | Tieni premuto in salita/discesa | Tieni premuto Click / `Spazio` / `↑` in salita/discesa |
| **Picchiata rapida (Fast-Fall)** | Swipe verso il basso | `↓` oppure `S` in volo |
| **Pausa / Riprendi** | Tasto Pausa in alto a destra | Tasto Pausa oppure `Esc` / `P` |

---

## Come Pubblicare su GitHub e Giocare da Mobile come PWA

Il progetto include già il workflow automatico **GitHub Actions** per compilare l'app Vite e pubblicarla gratuitamente su **GitHub Pages** con supporto automatico al sottopath del repository (`/<nome-repo>/`).

### 1. Carica il progetto su GitHub
1. Esporta o salva il progetto sul tuo repository GitHub usando l'integrazione GitHub di AI Studio (oppure facendo `git push` verso il branch `main` del tuo repository).
2. Verifica che nel repository sia presente la cartella `.github/workflows/deploy.yml`.

### 2. Attiva GitHub Pages
1. Apri il tuo repository su GitHub e vai su **Settings -> Pages**.
2. Nella sezione **Build and deployment -> Source**, seleziona **GitHub Actions**.
3. Al primo push su `main` (o avviando manualmente il workflow dalla scheda **Actions -> Deploy PWA to GitHub Pages -> Run workflow**), GitHub compilerà il gioco e pubblicherà il link pubblico nel formato:
   `https://<tuo-username>.github.io/<nome-repository>/`

### 3. Installa il gioco sullo Smartphone (PWA)
1. Apri il link pubblicato su **GitHub Pages** dal browser dello smartphone:
   - **Android (Chrome / Edge / Brave)**: premi il pulsante **Install App** direttamente nel menu principale del gioco (oppure dal menu del browser seleziona *Installa app* / *Aggiungi a schermata Home*).
   - **iPhone / iPad (Safari)**: premi il pulsante **Install on iOS** nel menu principale per aprire la guida rapida, oppure tocca **Condividi** nella barra di Safari e scegli **Aggiungi alla schermata Home**.
2. Una volta installato, il gioco si avvierà a schermo intero in modalità standalone e funzionerà anche **offline**.

---

## Sviluppo Locale

Requisiti: **Node.js 20+** (consigliato Node 22) e `npm`.

```bash
# 1. Installa le dipendenze
npm install

# 2. Avvia il server di sviluppo sulla porta 3000
npm run dev

# 3. Controllo tipi TypeScript
npm run lint

# 4. Build di produzione (su root '/')
npm run build

# 5. Build di produzione per test con sottopath (es. GitHub Pages)
VITE_BASE_PATH=/neon-runner/ npm run build
```

---

## Stack Tecnologico

- **Engine di Gioco**: Phaser `3.87.0` (Arcade Physics + Canvas procedural textures)
- **Interfaccia Utente**: React `19` + TypeScript `5.8` + Lucide Icons
- **Stili**: Tailwind CSS `v4` (`@tailwindcss/vite`)
- **Build & PWA**: Vite `6` + `vite-plugin-pwa` (Workbox)
- **Audio**: Web Audio API procedurale

Per l'elenco completo delle cartelle e la descrizione dettagliata di ogni file consulta [`STRUCTURE.md`](./STRUCTURE.md).
