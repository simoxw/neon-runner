import React from 'react';
import { Volume2, VolumeX, Wrench } from 'lucide-react';
import { PWAInstallButton } from './PWAInstallButton';

interface MenuProps {
  highScore: number;
  totalCredits: number;
  muted: boolean;
  canAffordUpgrade: boolean;
  onStart: () => void;
  onOpenUpgrades: () => void;
  onToggleMute: () => void;
}

const Menu: React.FC<MenuProps> = ({
  highScore,
  totalCredits,
  muted,
  canAffordUpgrade,
  onStart,
  onOpenUpgrades,
  onToggleMute,
}) => {
  return (
    <div className="absolute inset-0 z-30 flex flex-col items-center justify-between bg-[#06070d]/72 p-6 backdrop-blur-[2px]">
      <div className="flex w-full max-w-2xl items-center justify-end gap-2">
        <PWAInstallButton />
        <button
          type="button"
          onClick={onToggleMute}
          aria-label={muted ? 'Unmute audio' : 'Mute audio'}
          className="inline-flex h-11 w-11 items-center justify-center rounded-lg border border-white/15 bg-white/5 text-slate-200 transition hover:bg-white/10 active:scale-95 cursor-pointer"
        >
          {muted ? <VolumeX className="h-5 w-5 text-rose-400" /> : <Volume2 className="h-5 w-5 text-cyan-400" />}
        </button>
      </div>

      <div className="flex w-full max-w-md flex-col items-center text-center">
        <h1 className="font-display text-balance text-5xl font-bold italic tracking-tight text-white sm:text-6xl">
          Neon <span className="text-cyan-400">Runner</span>
        </h1>
        <p className="mt-2 text-sm text-slate-300">
          Cyber City Endless Sprint
        </p>

        <div className="mt-6 flex items-center gap-4 text-sm text-slate-300">
          <div>
            <span className="text-slate-400">Best </span>
            <span className="font-mono-num font-bold text-white">{highScore}m</span>
          </div>
          <span aria-hidden="true" className="text-slate-600">·</span>
          <div>
            <span className="text-slate-400">Credits </span>
            <span className="font-mono-num font-bold text-emerald-400">{totalCredits}</span>
          </div>
        </div>

        <div className="mt-8 flex w-full flex-col gap-3 sm:flex-row sm:justify-center">
          <button
            type="button"
            onClick={onStart}
            className="inline-flex min-h-[48px] items-center justify-center rounded-lg bg-cyan-400 px-8 py-3 text-base font-bold text-slate-950 shadow-lg shadow-cyan-500/25 transition hover:bg-cyan-300 active:scale-[0.98] whitespace-nowrap shrink-0 cursor-pointer"
          >
            Start Run
          </button>

          <button
            type="button"
            onClick={onOpenUpgrades}
            className="inline-flex min-h-[48px] items-center justify-center gap-2 rounded-lg border border-white/15 bg-[#0d1021]/90 px-6 py-3 text-sm font-semibold text-white transition hover:bg-white/10 active:scale-[0.98] whitespace-nowrap shrink-0 cursor-pointer"
          >
            <Wrench className="h-4 w-4 text-amber-400" />
            <span>Upgrades</span>
            {canAffordUpgrade && (
              <span className="font-mono-num text-xs font-bold text-emerald-400">Ready</span>
            )}
          </button>
        </div>
      </div>

      <div className="w-full max-w-md border-t border-white/10 pt-4 text-center text-xs text-slate-400">
        <div className="flex flex-wrap items-center justify-center gap-x-4 gap-y-1">
          <span>Tap or Space: Short Jump</span>
          <span aria-hidden="true" className="text-slate-600">·</span>
          <span>Hold: High Jump &amp; Glide</span>
        </div>
      </div>
    </div>
  );
};

export default Menu;
