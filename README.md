# Neon Runner: Cyber City

Endless runner cyberpunk ad alta velocità sviluppato con **Phaser 3**, **React 19**, **TypeScript** e **Tailwind CSS**, progettato per funzionare in modo fluido sia da desktop che da smartphone come **Progressive Web App (PWA)** installabile e giocabile anche offline.

---

## Caratteristiche Principali

- **Salto Variabile & Thruster Glide**:
  - **Tap breve** (touch, click o `Spazio` / `Freccia Su`): salto rapido e basso per superare singole barriere.
  - **Pressione prolungata**: spinta verticale estesa fino alla quota massima per scavalcare barriere alte e raccogliere archi di crediti.
  - **Planata fluida (Glide)**: continuando a tenere premuto durante la discesa si attivano i propulsori, rallentando la caduta con controllo preciso.
  - **Coyote Time & Jump Buffering**: tolleranza in uscita dalle piattaforme e pre-caricamento del salto poco prima dell'atterraggio.
- **Ostacoli Fissi vs Cyber Drones**:
  - Le **barriere laser** (basse e alte) sono indistruttibili e vanno superate saltando.
  - I **Cyber Drones** volanti vengono abbattuti dal blaster automatico del runner rilasciando esplosioni e **crediti bonus**.
- **Power-Up Raccoglibili**:
  - **Energy Shield**: assorbe un impatto fatale attivando brevi frame di invulnerabilità.
  - **Credit Magnet**: attira automaticamente tutti i crediti nel raggio d'azione.
- **Progressione & Potenziamenti Persistenti**:
  - Record personale (`highScore`), portafoglio **Credits**, preferenza audio e livelli di 4 upgrade (**Energy Shield**, **Credit Magnet**, **Pulse Blaster**, **Credit Boost**) vengono salvati automaticamente in `localStorage`.
- **Audio Sintetico Zero-Dipendenze**:
  - Effetti sonori generati in tempo reale tramite **Web Audio API** (salto, planata, sparo, esplosioni, monete, power-up, rottura scudo, game over) con tasto **Mute** nell'HUD e nel menu.
- **Responsive Mobile & PWA Offline**:
  - Ridimensionamento dinamico del canvas Phaser su rotazione schermo o cambio finestra.
  - Asset grafici generati proceduralmente su canvas (nessun asset esterno fragile).
  - Precache completo tramite Service Worker (`vite-plugin-pwa`).

---

## Controlli

| Azione | Mobile (Touch) | Desktop (Mouse / Tastiera) |
| :--- | :--- | :--- |
| **Salto corto** | Tap rapido sullo schermo | Click rapido o pressione breve `Spazio` / `↑` |
| **Salto alto** | Tieni premuto in salita | Tieni premuto Click o `Spazio` / `↑` in salita |
| **Planata (Glide)** | Tieni premuto in caduta | Tieni premuto Click o `Spazio` / `↑` in caduta |
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
