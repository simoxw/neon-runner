import React from 'react';
import { Flame, Magnet, Pause, Shield, Skull, Trophy, Volume2, VolumeX, Zap } from 'lucide-react';
import { ActiveBuffs, RunMode } from '../types';

export interface MissionToastData {
  label: string;
  reward: number;
}

interface HUDProps {
  score: number;
  runCredits: number;
  speedMultiplier: number;
  sectorNumber: number;
  sectorName: string;
  runMode: RunMode;
  comboCount: number;
  comboMultiplier: number;
  bossActive: boolean;
  bossHp: number;
  bossMaxHp: number;
  buffs: ActiveBuffs;
  missionToast: MissionToastData | null;
  muted: boolean;
  onToggleMute: () => void;
  onPause: () => void;
  onTriggerEmp: () => void;
}

const HUD: React.FC<HUDProps> = ({
  score,
  runCredits,
  speedMultiplier,
  sectorNumber,
  sectorName,
  runMode,
  comboCount,
  comboMultiplier,
  bossActive,
  bossHp,
  bossMaxHp,
  buffs,
  missionToast,
  muted,
  onToggleMute,
  onPause,
  onTriggerEmp,
}) => {
  const shieldPct =
    buffs.shieldMax > 0 ? Math.min(100, (buffs.shieldRemaining / buffs.shieldMax) * 100) : 0;
  const magnetPct =
    buffs.magnetMax > 0 ? Math.min(100, (buffs.magnetRemaining / buffs.magnetMax) * 100) : 0;
  const overdrivePct = buffs.overdriveActive
    ? buffs.overdriveMax > 0
      ? Math.min(100, (buffs.overdriveRemaining / buffs.overdriveMax) * 100)
      : 0
    : Math.min(100, Math.max(0, buffs.overdriveCharge));

  const bossPct = bossMaxHp > 0 ? Math.max(0, Math.min(100, (bossHp / bossMaxHp) * 100)) : 0;
  const empReady = buffs.empUnlocked && buffs.empCooldownRemaining <= 0;
  const empChargePct =
    buffs.empCooldownMax > 0
      ? Math.max(0, Math.min(100, 100 - (buffs.empCooldownRemaining / buffs.empCooldownMax) * 100))
      : 100;

  return (
    <div className="pointer-events-none absolute inset-0 z-20 flex flex-col justify-between px-4 py-3 sm:px-6 sm:py-4 [@media(max-height:500px)]:py-2">
      <div className="flex flex-col gap-1.5">
        <div className="flex items-start justify-between gap-4">
          <div className="flex flex-col">
            <div className="flex flex-wrap items-baseline gap-x-2.5 gap-y-0.5">
              <span className="font-mono-num text-2xl font-bold tracking-tight text-white sm:text-3xl [@media(max-height:500px)]:text-2xl">
                {score}m
              </span>
              <span className="font-mono-num text-xs font-medium text-cyan-300/80">
                {speedMultiplier.toFixed(1)}x
              </span>
              <span className="text-xs font-medium text-slate-300/90">
                S{sectorNumber} · {sectorName}
                {runMode === 'turbo' ? ' · Turbo' : ''}
              </span>
            </div>
            <div className="mt-0.5 flex items-center gap-2 text-xs text-slate-300">
              <span className="font-mono-num font-bold text-emerald-400">+{runCredits}</span>
              <span className="text-slate-400">Crediti</span>
              {comboCount >= 3 && (
                <>
                  <span aria-hidden="true" className="text-slate-600">·</span>
                  <span
                    className={`font-mono-num font-bold ${
                      comboMultiplier >= 3
                        ? 'text-amber-300'
                        : comboMultiplier >= 2
                        ? 'text-cyan-300'
                        : 'text-slate-300'
                    }`}
                  >
                    {comboMultiplier}x Serie ({comboCount})
                  </span>
                </>
              )}
            </div>
          </div>

          <div className="pointer-events-auto flex items-center gap-2">
            <button
              type="button"
              onClick={onToggleMute}
              aria-label={muted ? 'Attiva audio' : 'Disattiva audio'}
              className="inline-flex h-11 w-11 items-center justify-center rounded-lg border border-white/15 bg-[#0d1021]/80 text-slate-200 backdrop-blur-md transition hover:bg-white/10 active:scale-95 cursor-pointer"
            >
              {muted ? (
                <VolumeX className="h-5 w-5 text-rose-400" />
              ) : (
                <Volume2 className="h-5 w-5 text-cyan-400" />
              )}
            </button>

            <button
              type="button"
              onClick={onPause}
              aria-label="Pausa"
              className="inline-flex h-11 min-w-[44px] items-center justify-center gap-1.5 rounded-lg border border-white/15 bg-[#0d1021]/80 px-3 text-xs font-semibold text-white backdrop-blur-md transition hover:bg-white/10 active:scale-95 whitespace-nowrap cursor-pointer"
            >
              <Pause className="h-4 w-4" />
              <span className="hidden sm:inline">Pausa</span>
            </button>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <div
            className={`flex items-center gap-2 rounded-md border px-2.5 py-1 backdrop-blur-sm ${
              buffs.overdriveActive
                ? 'border-amber-400/70 bg-amber-500/20'
                : 'border-white/15 bg-[#0d1021]/80'
            }`}
          >
            <Flame
              className={`h-3.5 w-3.5 ${
                buffs.overdriveActive ? 'text-amber-300' : 'text-amber-400/80'
              }`}
            />
            <div className="h-1.5 w-20 overflow-hidden rounded-full bg-white/10 sm:w-24">
              <div
                className={`h-full transition-[width] duration-100 ${
                  buffs.overdriveActive
                    ? 'bg-gradient-to-r from-amber-300 via-yellow-300 to-rose-400'
                    : 'bg-gradient-to-r from-cyan-400 to-amber-400'
                }`}
                style={{ width: `${overdrivePct}%` }}
              />
            </div>
            <span
              className={`font-mono-num text-[11px] font-bold whitespace-nowrap ${
                buffs.overdriveActive ? 'text-amber-200' : 'text-slate-200'
              }`}
            >
              {buffs.overdriveActive
                ? `OVERDRIVE ${(buffs.overdriveRemaining / 1000).toFixed(1)}s`
                : `${Math.round(overdrivePct)}%`}
            </span>
          </div>

          {buffs.shieldRemaining > 0 && (
            <div className="flex items-center gap-2 rounded-md border border-cyan-400/30 bg-[#0d1021]/80 px-2.5 py-1 backdrop-blur-sm">
              <Shield className="h-3.5 w-3.5 text-cyan-400" />
              <div className="h-1.5 w-14 overflow-hidden rounded-full bg-white/10">
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
              <div className="h-1.5 w-14 overflow-hidden rounded-full bg-white/10">
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

          {bossActive && bossMaxHp > 0 && (
            <div className="flex items-center gap-2 rounded-md border border-rose-500/50 bg-[#1a0b18]/90 px-2.5 py-1 backdrop-blur-sm">
              <Skull className="h-3.5 w-3.5 text-rose-400" />
              <span className="text-[11px] font-bold text-rose-200 whitespace-nowrap">
                Boss Drone
              </span>
              <div className="h-1.5 w-20 overflow-hidden rounded-full bg-white/10 sm:w-28">
                <div
                  className="h-full bg-gradient-to-r from-rose-500 to-amber-400 transition-[width] duration-100"
                  style={{ width: `${bossPct}%` }}
                />
              </div>
              <span className="font-mono-num text-[11px] font-bold text-rose-200">
                {bossHp}/{bossMaxHp}
              </span>
            </div>
          )}
        </div>

        {missionToast && (
          <div
            role="status"
            aria-label={`Missione completata: ${missionToast.label}`}
            className="mt-1 inline-flex h-10 w-10 items-center justify-center rounded-lg border border-cyan-400/70 bg-[#0d1021]/90 text-cyan-300 shadow-[0_0_20px_rgba(0,243,255,0.55)] backdrop-blur-md"
          >
            <Trophy className="h-5 w-5 text-cyan-300 drop-shadow-[0_0_8px_rgba(0,243,255,0.9)]" />
          </div>
        )}
      </div>

      {buffs.empUnlocked && (
        <div className="flex justify-end">
          <button
            type="button"
            disabled={!empReady}
            onPointerDown={(e) => e.stopPropagation()}
            onClick={(e) => {
              e.stopPropagation();
              onTriggerEmp();
            }}
            aria-label={empReady ? 'Attiva Onda EMP' : 'Onda EMP in ricarica'}
            className={`pointer-events-auto relative inline-flex min-h-[48px] items-center gap-2 overflow-hidden rounded-lg border px-4 py-2 text-xs font-bold backdrop-blur-md transition active:scale-95 whitespace-nowrap shrink-0 ${
              empReady
                ? 'cursor-pointer border-cyan-400/80 bg-cyan-400/20 text-cyan-200 shadow-[0_0_18px_rgba(0,243,255,0.35)] hover:bg-cyan-400/30'
                : 'cursor-not-allowed border-white/15 bg-[#0d1021]/80 text-slate-400'
            }`}
          >
            <span
              aria-hidden="true"
              className="absolute inset-y-0 left-0 bg-cyan-400/15 transition-[width] duration-150"
              style={{ width: `${empChargePct}%` }}
            />
            <Zap className={`relative h-4 w-4 ${empReady ? 'text-cyan-300' : 'text-slate-500'}`} />
            <span className="relative">Onda EMP</span>
            <span className="relative font-mono-num text-[11px]">
              {empReady
                ? 'Pronta (E)'
                : `${(buffs.empCooldownRemaining / 1000).toFixed(1)}s`}
            </span>
          </button>
        </div>
      )}
    </div>
  );
};

export default HUD;
