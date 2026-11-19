import React from 'react';
import { Magnet, Pause, Shield, Volume2, VolumeX } from 'lucide-react';
import { ActiveBuffs } from '../types';

interface HUDProps {
  score: number;
  runCredits: number;
  speedMultiplier: number;
  buffs: ActiveBuffs;
  muted: boolean;
  onToggleMute: () => void;
  onPause: () => void;
}

const HUD: React.FC<HUDProps> = ({
  score,
  runCredits,
  speedMultiplier,
  buffs,
  muted,
  onToggleMute,
  onPause,
}) => {
  const shieldPct = buffs.shieldMax > 0 ? Math.min(100, (buffs.shieldRemaining / buffs.shieldMax) * 100) : 0;
  const magnetPct = buffs.magnetMax > 0 ? Math.min(100, (buffs.magnetRemaining / buffs.magnetMax) * 100) : 0;

  return (
    <div className="pointer-events-none absolute inset-x-0 top-0 z-20 flex flex-col gap-2 px-4 pt-3 sm:px-6 sm:pt-4">
      <div className="flex items-start justify-between gap-4">
        <div className="flex flex-col">
          <div className="flex items-baseline gap-3">
            <span className="font-mono-num text-2xl font-bold tracking-tight text-white sm:text-3xl">
              {score}m
            </span>
            <span className="font-mono-num text-xs font-medium text-cyan-300/80">
              {speedMultiplier.toFixed(1)}x speed
            </span>
          </div>
          <div className="mt-0.5 flex items-center gap-2 text-xs text-slate-300">
            <span className="font-mono-num font-bold text-emerald-400">+{runCredits}</span>
            <span className="text-slate-400">Credits</span>
          </div>
        </div>

        <div className="pointer-events-auto flex items-center gap-2">
          <button
            type="button"
            onClick={onToggleMute}
            aria-label={muted ? 'Unmute audio' : 'Mute audio'}
            className="inline-flex h-11 w-11 items-center justify-center rounded-lg border border-white/15 bg-[#0d1021]/80 text-slate-200 backdrop-blur-md transition hover:bg-white/10 active:scale-95 cursor-pointer"
          >
            {muted ? <VolumeX className="h-5 w-5 text-rose-400" /> : <Volume2 className="h-5 w-5 text-cyan-400" />}
          </button>

          <button
            type="button"
            onClick={onPause}
            aria-label="Pause game"
            className="inline-flex h-11 min-w-[44px] items-center justify-center gap-1.5 rounded-lg border border-white/15 bg-[#0d1021]/80 px-3 text-xs font-semibold text-white backdrop-blur-md transition hover:bg-white/10 active:scale-95 whitespace-nowrap cursor-pointer"
          >
            <Pause className="h-4 w-4" />
            <span className="hidden sm:inline">Pause</span>
          </button>
        </div>
      </div>

      {(buffs.shieldRemaining > 0 || buffs.magnetRemaining > 0) && (
        <div className="flex flex-wrap items-center gap-3">
          {buffs.shieldRemaining > 0 && (
            <div className="flex items-center gap-2 rounded-md border border-cyan-400/30 bg-[#0d1021]/80 px-2.5 py-1 backdrop-blur-sm">
              <Shield className="h-3.5 w-3.5 text-cyan-400" />
              <div className="h-1.5 w-16 overflow-hidden rounded-full bg-white/10">
                <div
                  className="h-full bg-cyan-400 transition-[width] duration-100"
                  style={{ width: `${shieldPct}%` }}
                />
              </div>
              <span className="font-mono-num text-[11px] font-bold text-cyan-300">
                {(buffs.shieldRemaining / 1000).toFixed(1)}s
              </span>
            </div>
          )}

          {buffs.magnetRemaining > 0 && (
            <div className="flex items-center gap-2 rounded-md border border-amber-400/30 bg-[#0d1021]/80 px-2.5 py-1 backdrop-blur-sm">
              <Magnet className="h-3.5 w-3.5 text-amber-400" />
              <div className="h-1.5 w-16 overflow-hidden rounded-full bg-white/10">
                <div
                  className="h-full bg-amber-400 transition-[width] duration-100"
                  style={{ width: `${magnetPct}%` }}
                />
              </div>
              <span className="font-mono-num text-[11px] font-bold text-amber-300">
                {(buffs.magnetRemaining / 1000).toFixed(1)}s
              </span>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default HUD;
