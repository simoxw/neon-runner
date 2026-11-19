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
│   ├── usePWAInstall.ts            # Hook React per intercettare beforeinstallprompt e iOS Safari
│   └── usePWAUpdate.ts             # Hook React per controllo/applicazione aggiornamenti Service Worker
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
| `constants.ts` | Contiene tutti i parametri fisici tarati (gravità, salto, doppio salto, fast-fall, *coyote time*, *jump buffer*, planata, Overdrive), le palette dei settori (`SECTORS_PALETTE`), il catalogo skin (`SKINS_CATALOG`), i potenziamenti (`UPGRADES_CATALOG`) e i template delle missioni (`createMissionFromSeed`). |
| `types.ts` | Definisce gli enum e le interfacce TypeScript condivise tra UI e motore di gioco (`GameState`, `SkinId`, `UpgradeId`, `MissionType`, `ActiveMission`, `PlayerProgress`, `ActiveBuffs`, `RunTelemetry`). |
| `vite.config.ts` | Configura Vite con `@vitejs/plugin-react`, `@tailwindcss/vite` e `vite-plugin-pwa`. Legge `VITE_BASE_PATH` per adattare automaticamente `base`, manifest PWA (`start_url`, `scope`, `id`, icone) e Workbox sia in root (`/`) che su sottopath GitHub Pages (`/<repo>/`). |
| `package.json` | Elenco dipendenze (`phaser`, `react`, `react-dom`, `lucide-react`, `tailwindcss`, `@tailwindcss/vite`, `vite-plugin-pwa`) e script `dev`, `build`, `preview`, `lint`. |
| `tsconfig.json` | Configurazione TypeScript (`ES2022`, `bundler`, tipi `vite/client` e `vite-plugin-pwa/client`). |
| `metadata.json` | Nome e descrizione dell'app usati da AI Studio. |
| `.gitignore` | Esclude `node_modules`, `dist`, file `.local`, cache editor e log da Git. |

---

### 2. Motore di Gioco Phaser (`game/`)

| File | Cosa fa |
| :--- | :--- |
| `game/PhaserGame.tsx` | Componente React che inizializza in sicurezza un'unica istanza `Phaser.Game` in modalità `Phaser.Scale.RESIZE`, con test preventivo del framebuffer WebGL e fallback automatico a Canvas. |
| `game/scenes/Preloader.ts` | Genera in memoria tramite Canvas 2D tutte le texture del gioco (cielo, città, pavimento, passerelle aeree `sky_platform`, runner, barriere, drone, missili e segnale di pericolo, monete, icona Shield/Magnet, proiettili e particelle tintabili) e registra le animazioni (`anim_player_run`, `anim_drone`, `anim_missile`, `anim_coin`). |
| `game/scenes/MainGame.ts` | Cuore della partita: gestisce parallasse, collider one-way per piattaforme aeree, input swipe-down / `↓` / `S` per Fast-Fall, transizioni cromatiche dei settori ogni 300m, collisioni (incluse collisioni distruttive in **Hyper Overdrive**), pausa, resize mobile/desktop ed eventi verso React. |
| `game/entities/Player.ts` | Gestisce il runner: salto variabile, doppio salto a mezz'aria, picchiata rapida (Fast-Fall), *coyote time*, *jump buffer*, planata, blaster, skin cromatiche applicate a corpo/scia/proiettili, barra **Hyper Overdrive** e timer Shield/Magnet. |
| `game/entities/ObstacleManager.ts` | Gestisce il pool di barriere fisse, piattaforme aeree one-way, Cyber Drones oscillanti, missili con telegrafo sul bordo destro, crediti e power-up con attrazione magnetica. |

---

### 3. Componenti Interfaccia React (`components/`)

| File | Cosa fa |
| :--- | :--- |
| `components/Menu.tsx` | Schermata iniziale sopra il fondale animato in parallasse: mostra titolo, miglior distanza, crediti totali, riepilogo delle **3 missioni attive**, pulsanti **Start Run**, **Upgrades**, toggle orientamento (**Auto** / **Landscape** con avviso iOS), banner aggiornamenti SW, toggle audio e **Install App**. |
| `components/HUD.tsx` | Barra superiore non invasiva in partita: mostra distanza in metri, velocità, settore corrente (`S1 · Cyber Cyan`), crediti della corsa, barra di carica/countdown **Hyper Overdrive**, barre **Shield**/**Magnet**, toast di **Mission Complete**, **Mute** e **Pause**. |
| `components/PauseModal.tsx` | Finestra modale mostrata in pausa con riepilogo corsa e azioni **Resume**, **Sound: On/Off**, **Restart** e **Main Menu** (compatta anche in landscape). |
| `components/GameOver.tsx` | Schermata di fine corsa con distanza raggiunta, crediti guadagnati, droni distrutti, avanzamento delle **3 missioni attive**, indicatore **New Personal Best**, accesso diretto a **Upgrades**, **Main Menu** e **Play Again**. |
| `components/UpgradesModal.tsx` | Officina a due schede (**Upgrades** e **Skins**): permette di potenziare i 4 moduli (`0..5`) e di sbloccare/equipaggiare le 5 skin cromatiche con i crediti salvati. |
| `components/PWAInstallButton.tsx` | Pulsante intelligente per l'installazione PWA: mostra il prompt nativo su Android/Desktop oppure apre una guida visiva dedicata per Safari su iPhone/iPad, nascondendosi automaticamente se l'app è già avviata in modalità `standalone`. |

---

### 4. Utility & Hook (`utils/`, `hooks/`)

| File | Cosa fa |
| :--- | :--- |
| `utils/sound.ts` | Classe `SoundEngine` basata su Web Audio API: sintetizza gli effetti sonori senza file audio esterni (inclusi doppio salto, fast-fall, atterraggio, completamento missione, missile e overdrive) e gestisce `muted`. |
| `utils/storage.ts` | Gestisce caricamento, validazione, rotazione e salvataggio in `localStorage` (`neon_runner_progress_v2`) per `highScore`, `totalCredits`, `muted`, `orientationMode`, `unlockedSkins`, `equippedSkin`, `missions` e `upgrades`. |
| `hooks/useOrientation.ts` | Hook React che gestisce la modalità **Auto** / **Landscape** usando Fullscreen API e `screen.orientation.lock('landscape')` su Android/PWA, e mostra un avviso auto-chiudibile su iOS Safari quando è richiesta la rotazione manuale. |
| `hooks/usePWAInstall.ts` | Hook React che rileva se l'app è già installata (`display-mode: standalone`), riconosce iOS Safari e cattura l'evento `beforeinstallprompt` per attivare l'installazione con un tap. |
| `hooks/usePWAUpdate.ts` | Hook React basato su `virtual:pwa-register`: forza il controllo del nuovo Service Worker al rientro sull'app (`visibilitychange`, `focus`, `online`) e applica `skipWaiting` + reload quando l'utente preme **Update Now** nel Menu. |

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
