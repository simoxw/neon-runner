import React from 'react';
import {
  Check,
  Gift,
  RefreshCw,
  RotateCw,
  Smartphone,
  Trophy,
  Volume2,
  VolumeX,
  Wrench,
  X,
  Zap,
} from 'lucide-react';
import { ActiveMission, OrientationMode, RunMode } from '../types';
import { PWAInstallButton } from './PWAInstallButton';

interface MenuProps {
  highScore: number;
  turboHighScore: number;
  totalCredits: number;
  muted: boolean;
  orientationMode: OrientationMode;
  runMode: RunMode;
  showRotateHint: boolean;
  hasUpdate: boolean;
  isUpdatingApp: boolean;
  canAffordUpgrade: boolean;
  dailyCanClaim: boolean;
  dailyStreak: number;
  dailyRewardCredits: number;
  dailyClaimedFeedback: number | null;
  missions: ActiveMission[];
  onStart: () => void;
  onSelectRunMode: (mode: RunMode) => void;
  onClaimDaily: () => void;
  onOpenUpgrades: (initialTab?: 'upgrades' | 'skins' | 'career') => void;
  onToggleMute: () => void;
  onToggleOrientation: () => void;
  onDismissRotateHint: () => void;
  onApplyUpdate: () => void;
}

const Menu: React.FC<MenuProps> = ({
  highScore,
  turboHighScore,
  totalCredits,
  muted,
  orientationMode,
  runMode,
  showRotateHint,
  hasUpdate,
  isUpdatingApp,
  canAffordUpgrade,
  dailyCanClaim,
  dailyStreak,
  dailyRewardCredits,
  dailyClaimedFeedback,
  missions,
  onStart,
  onSelectRunMode,
  onClaimDaily,
  onOpenUpgrades,
  onToggleMute,
  onToggleOrientation,
  onDismissRotateHint,
  onApplyUpdate,
}) => {
  const isLandscapeLocked = orientationMode === 'landscape';
  const activeModeRecord = runMode === 'turbo' ? turboHighScore : highScore;

  return (
    <div className="absolute inset-0 z-30 flex flex-col items-center justify-between overflow-y-auto bg-[#06070d]/72 px-4 py-4 backdrop-blur-[2px] sm:p-6 [@media(max-height:500px)]:py-2">
      <div className="flex w-full max-w-3xl flex-wrap items-center justify-end gap-2">
        <PWAInstallButton />

        <button
          type="button"
          onClick={() => onOpenUpgrades('career')}
          className="inline-flex min-h-[44px] items-center justify-center gap-2 rounded-lg border border-white/15 bg-white/5 px-3.5 py-2 text-xs font-semibold text-slate-200 transition hover:bg-white/10 active:scale-95 whitespace-nowrap shrink-0 cursor-pointer"
        >
          <Trophy className="h-4 w-4 text-amber-400" />
          <span>Carriera</span>
        </button>

        <button
          type="button"
          onClick={onToggleOrientation}
          aria-label={`Orientation mode: ${isLandscapeLocked ? 'Landscape' : 'Auto'}`}
          className={`inline-flex min-h-[44px] items-center justify-center gap-2 rounded-lg border px-3.5 py-2 text-xs font-semibold transition active:scale-95 whitespace-nowrap shrink-0 cursor-pointer ${
            isLandscapeLocked
              ? 'border-cyan-400/50 bg-cyan-400/15 text-cyan-300 hover:bg-cyan-400/25'
              : 'border-white/15 bg-white/5 text-slate-200 hover:bg-white/10'
          }`}
        >
          {isLandscapeLocked ? (
            <RotateCw className="h-4 w-4 text-cyan-400" />
          ) : (
            <Smartphone className="h-4 w-4 text-slate-300" />
          )}
          <span>{isLandscapeLocked ? 'Landscape' : 'Auto'}</span>
        </button>

        <button
          type="button"
          onClick={onToggleMute}
          aria-label={muted ? 'Unmute audio' : 'Mute audio'}
          className="inline-flex h-11 w-11 items-center justify-center rounded-lg border border-white/15 bg-white/5 text-slate-200 transition hover:bg-white/10 active:scale-95 shrink-0 cursor-pointer"
        >
          {muted ? (
            <VolumeX className="h-5 w-5 text-rose-400" />
          ) : (
            <Volume2 className="h-5 w-5 text-cyan-400" />
          )}
        </button>
      </div>

      {hasUpdate && (
        <div className="mt-2 flex w-full max-w-md items-center justify-between gap-3 rounded-lg border border-emerald-400/40 bg-[#0d1021]/95 px-3.5 py-2 text-xs text-slate-200 shadow-lg">
          <div className="flex items-center gap-2">
            <RefreshCw
              className={`h-4 w-4 shrink-0 text-emerald-400 ${isUpdatingApp ? 'animate-spin' : ''}`}
            />
            <span>Nuova versione disponibile.</span>
          </div>
          <button
            type="button"
            disabled={isUpdatingApp}
            onClick={onApplyUpdate}
            className="inline-flex min-h-[44px] items-center justify-center rounded-md bg-emerald-400 px-3.5 py-1.5 text-xs font-bold text-slate-950 transition hover:bg-emerald-300 active:scale-95 disabled:opacity-60 whitespace-nowrap shrink-0 cursor-pointer"
          >
            {isUpdatingApp ? 'Aggiornamento...' : 'Aggiorna'}
          </button>
        </div>
      )}

      {showRotateHint && (
        <div className="mt-2 flex w-full max-w-md items-center justify-between gap-3 rounded-lg border border-cyan-400/40 bg-[#0d1021]/95 px-3.5 py-2 text-xs text-slate-200 shadow-lg">
          <div className="flex items-center gap-2">
            <RotateCw className="h-4 w-4 shrink-0 text-cyan-400" />
            <span>Ruota il dispositivo in orizzontale per giocare meglio.</span>
          </div>
          <button
            type="button"
            onClick={onDismissRotateHint}
            aria-label="Chiudi avviso rotazione"
            className="inline-flex h-8 w-8 shrink-0 items-center justify-center rounded text-slate-400 hover:bg-white/10 hover:text-white cursor-pointer"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      )}

      <div className="my-auto flex w-full max-w-lg flex-col items-center py-2 text-center [@media(max-height:500px)]:max-w-2xl [@media(max-height:500px)]:py-1">
        <h1 className="font-display text-balance text-5xl font-bold italic tracking-tight text-white sm:text-6xl [@media(max-height:500px)]:text-4xl">
          Neon <span className="text-cyan-400">Runner</span>
        </h1>
        <p className="mt-1.5 text-sm text-slate-300 [@media(max-height:500px)]:mt-0.5 [@media(max-height:500px)]:text-xs">
          Cyber City Endless Sprint
        </p>

        <div className="mt-3.5 flex items-center gap-4 text-sm text-slate-300 [@media(max-height:500px)]:mt-2 [@media(max-height:500px)]:text-xs">
          <div>
            <span className="text-slate-400">
              {runMode === 'turbo' ? 'Record Turbo ' : 'Record '}
            </span>
            <span className="font-mono-num font-bold text-white">{activeModeRecord}m</span>
          </div>
          <span aria-hidden="true" className="text-slate-600">·</span>
          <div>
            <span className="text-slate-400">Crediti </span>
            <span className="font-mono-num font-bold text-emerald-400">{totalCredits}</span>
          </div>
        </div>

        <div
          role="group"
          aria-label="Modalità di corsa"
          className="mt-4 inline-flex items-center gap-1 rounded-lg border border-white/10 bg-[#0d1021]/90 p-1 [@media(max-height:500px)]:mt-2"
        >
          <button
            type="button"
            onClick={() => onSelectRunMode('classic')}
            className={`min-h-[40px] rounded-md px-4 py-1.5 text-xs font-bold transition whitespace-nowrap cursor-pointer ${
              runMode === 'classic'
                ? 'bg-cyan-400 text-slate-950'
                : 'text-slate-300 hover:bg-white/5 hover:text-white'
            }`}
          >
            Corsa Classica
          </button>
          <button
            type="button"
            onClick={() => onSelectRunMode('turbo')}
            className={`inline-flex min-h-[40px] items-center gap-1.5 rounded-md px-4 py-1.5 text-xs font-bold transition whitespace-nowrap cursor-pointer ${
              runMode === 'turbo'
                ? 'bg-amber-400 text-slate-950'
                : 'text-slate-300 hover:bg-white/5 hover:text-white'
            }`}
          >
            <Zap className="h-3.5 w-3.5" />
            <span>Corsa Turbo · 1.5x Crediti</span>
          </button>
        </div>

        <div className="mt-4 flex w-full flex-col gap-3 sm:flex-row sm:justify-center [@media(max-height:500px)]:mt-2.5 [@media(max-height:500px)]:flex-row [@media(max-height:500px)]:justify-center">
          <button
            type="button"
            onClick={onStart}
            className={`inline-flex min-h-[48px] items-center justify-center rounded-lg px-8 py-3 text-base font-bold text-slate-950 shadow-lg transition active:scale-[0.98] whitespace-nowrap shrink-0 cursor-pointer [@media(max-height:500px)]:min-h-[44px] [@media(max-height:500px)]:py-2 ${
              runMode === 'turbo'
                ? 'bg-amber-400 shadow-amber-500/25 hover:bg-amber-300'
                : 'bg-cyan-400 shadow-cyan-500/25 hover:bg-cyan-300'
            }`}
          >
            {runMode === 'turbo' ? 'Avvia Corsa Turbo' : 'Avvia Corsa'}
          </button>

          <button
            type="button"
            onClick={() => onOpenUpgrades('upgrades')}
            className="inline-flex min-h-[48px] items-center justify-center gap-2 rounded-lg border border-white/15 bg-[#0d1021]/90 px-6 py-3 text-sm font-semibold text-white transition hover:bg-white/10 active:scale-[0.98] whitespace-nowrap shrink-0 cursor-pointer [@media(max-height:500px)]:min-h-[44px] [@media(max-height:500px)]:py-2"
          >
            <Wrench className="h-4 w-4 text-amber-400" />
            <span>Officina</span>
            {canAffordUpgrade && (
              <span className="font-mono-num text-xs font-bold text-emerald-400">Pronto</span>
            )}
          </button>
        </div>

        {(dailyCanClaim || dailyClaimedFeedback !== null) && (
          <div className="mt-3.5 flex w-full items-center justify-between gap-3 rounded-lg border border-amber-400/35 bg-[#0d1021]/88 px-4 py-2.5 text-left [@media(max-height:500px)]:mt-2 [@media(max-height:500px)]:py-1.5">
            <div className="flex items-center gap-2.5">
              <Gift className="h-4 w-4 shrink-0 text-amber-400" />
              <div className="text-xs">
                {dailyClaimedFeedback !== null ? (
                  <span className="font-semibold text-emerald-300">
                    Ricompensa riscossa: +{dailyClaimedFeedback} Crediti · Serie Giorno {dailyStreak}
                  </span>
                ) : (
                  <span className="text-slate-200">
                    Bonus Giornaliero · Giorno {dailyStreak}
                  </span>
                )}
              </div>
            </div>
            {dailyCanClaim && (
              <button
                type="button"
                onClick={onClaimDaily}
                className="inline-flex min-h-[40px] items-center justify-center rounded-md bg-amber-400 px-3.5 py-1.5 text-xs font-bold text-slate-950 transition hover:bg-amber-300 active:scale-95 whitespace-nowrap shrink-0 cursor-pointer"
              >
                Riscuoti +{dailyRewardCredits}
              </button>
            )}
          </div>
        )}

        {missions.length > 0 && (
          <div className="mt-4 w-full rounded-lg border border-white/10 bg-[#0d1021]/82 px-4 py-3 text-left [@media(max-height:500px)]:mt-2 [@media(max-height:500px)]:px-3 [@media(max-height:500px)]:py-2">
            <div className="mb-2 flex items-center justify-between text-xs font-semibold text-slate-300 [@media(max-height:500px)]:mb-1.5">
              <span>Missioni Attive</span>
              <span className="text-slate-400">Crediti Bonus</span>
            </div>
            <div className="grid gap-2 [@media(max-height:500px)]:grid-cols-3 [@media(max-height:500px)]:gap-3">
              {missions.map((mission) => {
                const pct = Math.min(100, Math.round((mission.progress / mission.target) * 100));
                return (
                  <div key={mission.id} className="space-y-1">
                    <div className="flex items-center justify-between gap-2 text-xs">
                      <span className="truncate text-slate-200">{mission.label}</span>
                      <span className="font-mono-num shrink-0 text-emerald-400">
                        {mission.completed ? (
                          <Check className="inline h-3.5 w-3.5" />
                        ) : (
                          `+${mission.reward}`
                        )}
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="h-1 flex-1 overflow-hidden rounded-full bg-white/10">
                        <div
                          className={`h-full transition-[width] ${
                            mission.completed ? 'bg-emerald-400' : 'bg-cyan-400'
                          }`}
                          style={{ width: `${pct}%` }}
                        />
                      </div>
                      <span className="font-mono-num text-[11px] text-slate-400">
                        {Math.floor(mission.progress)}/{mission.target}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>

      <div className="w-full max-w-xl border-t border-white/10 pt-2.5 text-center text-xs text-slate-400 [@media(max-height:500px)]:pt-1.5">
        <div className="flex flex-wrap items-center justify-center gap-x-3 gap-y-1">
          <span>Tap / Spazio / ↑: Salto e Doppio Salto</span>
          <span aria-hidden="true" className="text-slate-600">·</span>
          <span>Tieni premuto in aria: Jetpack</span>
          <span aria-hidden="true" className="text-slate-600">·</span>
          <span>E: Onda EMP</span>
        </div>
      </div>
    </div>
  );
};

export default Menu;
