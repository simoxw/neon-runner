# Struttura del Progetto — Neon Runner: Cyber City

Questo documento descrive l'organizzazione completa delle cartelle e il ruolo di ogni singolo file del progetto.

---

## Albero delle Cartelle e dei File

```text
.
├── .github/
│   └── workflows/
│       └── deploy.yml              # Pipeline CI/CD per build e deploy PWA su GitHub Pages
├── components/
│   ├── GameOver.tsx                # Schermata di fine corsa con statistiche e retry
│   ├── HUD.tsx                     # Interfaccia in partita (metri, velocità, buff, mute, pausa)
│   ├── Menu.tsx                    # Menu iniziale con record, crediti, upgrade e install PWA
│   ├── PWAInstallButton.tsx        # Pulsante installazione PWA per Android/Desktop e guida iOS
│   ├── PauseModal.tsx              # Overlay di pausa con ripresa, audio, riavvio e uscita
│   └── UpgradesModal.tsx           # Officina potenziamenti permanenti acquistabili con crediti
├── game/
│   ├── entities/
│   │   ├── ObstacleManager.ts      # Spawner a pattern (barriere, droni, crediti, power-up)
│   │   └── Player.ts               # Entità giocatore (salto variabile, glide, blaster, buff)
│   ├── scenes/
│   │   ├── MainGame.ts             # Scena principale Phaser (fisica, collisioni, resize, pausa)
│   │   └── Preloader.ts            # Generatore procedurale di texture e animazioni su canvas
│   └── PhaserGame.tsx              # Wrapper React che monta e distrugge il canvas Phaser 3
├── hooks/
│   ├── useOrientation.ts           # Hook per toggle orientamento Auto/Landscape, Fullscreen e avviso iOS
│   └── usePWAInstall.ts            # Hook React per intercettare beforeinstallprompt e iOS Safari
├── public/
│   ├── .nojekyll                   # Disattiva Jekyll su GitHub Pages per servire tutti gli asset
│   ├── apple-touch-icon.png        # Icona PNG 180x180 per iOS Safari
│   ├── icon.svg                    # Icona vettoriale SVG per schede browser desktop
│   ├── manifest.json               # Manifest statico di riferimento per compatibilità base
│   ├── pwa-192x192.png             # Icona PWA PNG 192x192
│   ├── pwa-512x512.png             # Icona PWA PNG 512x512
│   └── pwa-maskable-512x512.png    # Icona PWA PNG 512x512 con safe-zone per Android
├── utils/
│   ├── sound.ts                    # Motore audio sintetico Web Audio API + gestione Mute
│   └── storage.ts                  # Lettura/scrittura persistente su localStorage
├── .gitignore                      # File e cartelle esclusi dal versionamento Git
├── App.tsx                         # Guscio principale React, macchina a stati ed event bridge
├── ARCHITECTURE / STRUCTURE.md     # Questo file di documentazione tecnica della struttura
├── README.md                       # Guida utente, controlli e istruzioni deploy GitHub Pages
├── constants.ts                    # Costanti fisiche di salto/glide e catalogo potenziamenti
├── index.css                       # Foglio di stile globale Tailwind v4 e classi tipografiche
├── index.html                      # Entrypoint HTML con font e meta tag PWA/mobile
├── index.tsx                       # Bootstrap React DOM su #root
├── metadata.json                   # Metadati descrittivi dell'applicazione AI Studio
├── package.json                    # Dipendenze npm e script di build/dev/lint
├── tsconfig.json                   # Configurazione compilatore TypeScript
├── types.ts                        # Tipi ed enum condivisi (GameState, UpgradeId, ActiveBuffs)
└── vite.config.ts                  # Configurazione Vite, Tailwind v4 e VitePWA (con base dinamica)
```

---

## Descrizione Dettagliata per Area e File

### 1. Root & Configurazione

| File | Cosa fa |
| :--- | :--- |
| `index.html` | Documento HTML principale; definisce viewport mobile-first senza zoom accidentale, meta tag Apple/Android PWA, link icone con `%BASE_URL%` e Google Fonts (`Chakra Petch`, `Plus Jakarta Sans`, `JetBrains Mono`). |
| `index.tsx` | Punto di ingresso JavaScript che importa `index.css` e monta il componente `<App />` nell'elemento `#root`. |
| `index.css` | Importa Tailwind CSS v4 (`@import "tailwindcss";`), blocca lo scroll/selezione touch sul canvas e definisce le utility tipografiche `.font-display` e `.font-mono-num` (cifre tabellari). |
| `App.tsx` | Orchestratore React dell'interfaccia: gestisce la macchina a stati (`MENU`, `PLAYING`, `PAUSED`, `GAME_OVER`), ascolta gli eventi provenienti da Phaser (`PHASER_EVENT`), aggiorna record/crediti/upgrade in `localStorage` e invia comandi a Phaser (`PHASER_START`, `PHASER_PAUSE`, `PHASER_RESUME`, `PHASER_RESTART`, `PHASER_MENU`, `PHASER_SYNC_PROGRESS`). |
| `constants.ts` | Contiene tutti i parametri fisici tarati (gravità, spinta iniziale del salto, accelerazione tenendo premuto, taglio salto anticipato, *coyote time*, *jump buffer*, velocità massima planata, velocità base/massima) e il catalogo `UPGRADES_CATALOG` con costi e formule per livello. |
| `types.ts` | Definisce gli enum e le interfacce TypeScript condivise tra UI e motore di gioco (`GameState`, `UpgradeId`, `PlayerProgress`, `ActiveBuffs`, `RunTelemetry`). |
| `vite.config.ts` | Configura Vite con `@vitejs/plugin-react`, `@tailwindcss/vite` e `vite-plugin-pwa`. Legge `VITE_BASE_PATH` per adattare automaticamente `base`, manifest PWA (`start_url`, `scope`, `id`, icone) e Workbox sia in root (`/`) che su sottopath GitHub Pages (`/<repo>/`). |
| `package.json` | Elenco dipendenze (`phaser`, `react`, `react-dom`, `lucide-react`, `tailwindcss`, `@tailwindcss/vite`, `vite-plugin-pwa`) e script `dev`, `build`, `preview`, `lint`. |
| `tsconfig.json` | Configurazione TypeScript (`ES2022`, `bundler`, tipi `vite/client` e `vite-plugin-pwa/client`). |
| `metadata.json` | Nome e descrizione dell'app usati da AI Studio. |
| `.gitignore` | Esclude `node_modules`, `dist`, file `.local`, cache editor e log da Git. |

---

### 2. Motore di Gioco Phaser (`game/`)

| File | Cosa fa |
| :--- | :--- |
| `game/PhaserGame.tsx` | Componente React che inizializza un'unica istanza `Phaser.Game` in modalità `Phaser.Scale.RESIZE`, collega il bridge `PHASER_EVENT` verso React e distrugge l'istanza allo smontaggio. |
| `game/scenes/Preloader.ts` | Genera in memoria tramite Canvas 2D tutte le texture del gioco (cielo stellato, città lontana, città vicina, passerella catwalk, 4 frame corsa + salto + planata del runner, barriere basse/alte, drone animato, monete rotanti, icone Shield/Magnet, proiettili e particelle) e registra le animazioni Phaser (`anim_player_run`, `anim_drone`, `anim_coin`). |
| `game/scenes/MainGame.ts` | Cuore della partita: gestisce i 4 layer di parallasse, la fisica del pavimento e dei bordi, l'ascolto del resize mobile/desktop (`handleResize`), i comandi touch/tastiera (`Space`, `↑`, `Esc`, `P`), la pausa/ripresa, le collisioni tra player, barriere indistruttibili, droni abbattibili, crediti e power-up, gli emettitori particellari e i testi fluttuanti (`+2`, `SHIELD`, `MAGNET`). |
| `game/entities/Player.ts` | Gestisce l'entità del runner: salto ad altezza variabile con finestra di spinta (`MAX_JUMP_HOLD_MS`) e taglio velocità al rilascio, *coyote time*, *jump buffer*, planata fluida (*glide*) con scia particellare, sparo automatico calibrato sul livello `blasterRate`, timer e anelli visivi per **Shield** e **Magnet**, e frame di invulnerabilità post-rottura scudo. |
| `game/entities/ObstacleManager.ts` | Gestisce il pool di barriere fisse, Cyber Drones oscillanti, crediti e power-up. Genera pattern basati sulla distanza e calibrati sulla velocità corrente (garantendo salti sempre possibili) e applica l'attrazione magnetica sui crediti quando il Magnet è attivo. |

---

### 3. Componenti Interfaccia React (`components/`)

| File | Cosa fa |
| :--- | :--- |
| `components/Menu.tsx` | Schermata iniziale sopra il fondale animato in parallasse: mostra titolo, miglior distanza, crediti totali, pulsanti **Start Run**, **Upgrades**, toggle orientamento (**Auto** / **Landscape** con avviso iOS), toggle audio e **Install App**. |
| `components/HUD.tsx` | Barra superiore leggera e non invasiva durante la corsa: mostra distanza in metri, moltiplicatore velocità, crediti della corsa, barre countdown dinamiche per **Shield** e **Magnet**, toggle **Mute** e pulsante **Pause** ($\ge 44\times44\text{px}$). |
| `components/PauseModal.tsx` | Finestra modale mostrata in pausa con riepilogo corsa e azioni **Resume**, **Sound: On/Off**, **Restart** e **Main Menu** (compatta anche in landscape). |
| `components/GameOver.tsx` | Schermata di fine corsa con distanza raggiunta, crediti guadagnati, droni distrutti, indicatore **New Personal Best**, accesso diretto a **Upgrades**, **Main Menu** e **Play Again**. |
| `components/UpgradesModal.tsx` | Negozio potenziamenti con 4 schede (**Energy Shield**, **Credit Magnet**, **Pulse Blaster**, **Credit Boost**), barra di avanzamento livelli (`0..5`), anteprima effetto attuale/successivo e acquisto immediato con crediti salvati. |
| `components/PWAInstallButton.tsx` | Pulsante intelligente per l'installazione PWA: mostra il prompt nativo su Android/Desktop oppure apre una guida visiva dedicata per Safari su iPhone/iPad, nascondendosi automaticamente se l'app è già avviata in modalità `standalone`. |

---

### 4. Utility & Hook (`utils/`, `hooks/`)

| File | Cosa fa |
| :--- | :--- |
| `utils/sound.ts` | Classe `SoundEngine` basata su Web Audio API: sintetizza gli effetti sonori senza file audio esterni, sblocca automaticamente `AudioContext` al primo input utente e gestisce lo stato `muted`. |
| `utils/storage.ts` | Gestisce caricamento, validazione e salvataggio in `localStorage` (`neon_runner_progress_v2` con migrazione automatica del vecchio record) per `highScore`, `totalCredits`, `muted`, `orientationMode` e `upgrades`. |
| `hooks/useOrientation.ts` | Hook React che gestisce la modalità **Auto** / **Landscape** usando Fullscreen API e `screen.orientation.lock('landscape')` su Android/PWA, e mostra un avviso auto-chiudibile su iOS Safari quando è richiesta la rotazione manuale. |
| `hooks/usePWAInstall.ts` | Hook React che rileva se l'app è già installata (`display-mode: standalone`), riconosce iOS Safari e cattura l'evento `beforeinstallprompt` per attivare l'installazione con un tap. |

---

### 5. Asset PWA & Automazione Deploy (`public/`, `.github/`)

| File | Cosa fa |
| :--- | :--- |
| `public/icon.svg` | Icona vettoriale del brand per browser desktop. |
| `public/pwa-192x192.png` / `pwa-512x512.png` | Icone PNG standard richieste dai manifest PWA su Android e Chromium. |
| `public/pwa-maskable-512x512.png` | Icona PNG adattiva con margine di sicurezza per ritagli circolari/squircle su Android. |
| `public/apple-touch-icon.png` | Icona PNG `180x180` dedicata alla schermata Home di iOS Safari. |
| `public/manifest.json` | Manifest statico di supporto (in produzione VitePWA genera e collega dinamicamente `manifest.webmanifest` allineato al `basePath`). |
| `public/.nojekyll` | Marker vuoto che impedisce a GitHub Pages di filtrare file o cartelle statiche. |
| `.github/workflows/deploy.yml` | Workflow GitHub Actions: a ogni push su `main`/`master` installa le dipendenze, imposta `VITE_BASE_PATH` in base al nome del repository, esegue `npm run build` e pubblica `dist/` su GitHub Pages. |

---

## Flusso di Comunicazione Dati

```text
[Touch / Mouse / Tastiera]
           │
           ▼
   Phaser MainGame / Player ──(CustomEvent: PHASER_EVENT)──► React App Shell
           ▲                                                       │
           └────(CustomEvent: PHASER_START/PAUSE/SYNC_PROGRESS)────┘
                                                                   │
                                                            [localStorage]
```
