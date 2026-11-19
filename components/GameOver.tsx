import React from 'react';
import { Check, Home, RotateCcw, Wrench } from 'lucide-react';
import { ActiveMission } from '../types';

interface GameOverProps {
  score: number;
  highScore: number;
  runCredits: number;
  totalCredits: number;
  dronesDestroyed: number;
  isNewRecord: boolean;
  missions: ActiveMission[];
  onRestart: () => void;
  onOpenUpgrades: () => void;
  onQuitToMenu: () => void;
}

const GameOver: React.FC<GameOverProps> = ({
  score,
  highScore,
  runCredits,
  totalCredits,
  dronesDestroyed,
  isNewRecord,
  missions,
  onRestart,
  onOpenUpgrades,
  onQuitToMenu,
}) => {
  return (
    <div className="absolute inset-0 z-40 flex items-center justify-center bg-[#06070d]/82 p-4 backdrop-blur-md">
      <div className="max-h-[92dvh] w-full max-w-md overflow-y-auto rounded-xl border border-rose-500/30 bg-[#0d1021]/95 p-6 shadow-2xl [@media(max-height:500px)]:max-w-lg [@media(max-height:500px)]:p-4">
        <div className="text-center">
          <h2 className="font-display text-3xl font-bold text-white [@media(max-height:500px)]:text-2xl">
            Corsa Terminata
          </h2>
          {isNewRecord && (
            <p className="mt-1 text-xs font-bold uppercase tracking-wider text-cyan-400">
              Nuovo Record Personale
            </p>
          )}
        </div>

        <div className="mt-4 space-y-2 border-y border-white/10 py-3 text-sm [@media(max-height:500px)]:mt-2.5 [@media(max-height:500px)]:space-y-1.5 [@media(max-height:500px)]:py-2">
          <div className="flex items-center justify-between">
            <span className="text-slate-400">Distanza</span>
            <span className="font-mono-num text-xl font-bold text-white [@media(max-height:500px)]:text-lg">
              {score}m
            </span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-slate-400">Crediti Guadagnati</span>
            <span className="font-mono-num text-lg font-bold text-emerald-400 [@media(max-height:500px)]:text-base">
              +{runCredits}
            </span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-slate-400">Droni Distrutti</span>
            <span className="font-mono-num font-semibold text-amber-300">{dronesDestroyed}</span>
          </div>
          <div className="flex items-center justify-between pt-1 text-xs">
            <span className="text-slate-400">
              Record: <strong className="font-mono-num text-slate-200">{highScore}m</strong>
            </span>
            <span className="text-slate-400">
              Portafoglio: <strong className="font-mono-num text-emerald-400">{totalCredits}</strong>
            </span>
          </div>
        </div>

        {missions.length > 0 && (
          <div className="mt-3 space-y-2 border-b border-white/10 pb-3 [@media(max-height:500px)]:mt-2 [@media(max-height:500px)]:pb-2">
            <p className="text-xs font-semibold text-slate-300">Missioni</p>
            <div className="space-y-1.5 [@media(max-height:500px)]:grid [@media(max-height:500px)]:grid-cols-3 [@media(max-height:500px)]:gap-2 [@media(max-height:500px)]:space-y-0">
              {missions.map((mission) => {
                const pct = Math.min(100, Math.round((mission.progress / mission.target) * 100));
                return (
                  <div key={mission.id} className="space-y-1">
                    <div className="flex items-center justify-between gap-2 text-xs">
                      <span
                        className={`truncate ${
                          mission.completed ? 'text-emerald-300 font-semibold' : 'text-slate-300'
                        }`}
                      >
                        {mission.label}
                      </span>
                      <span className="font-mono-num shrink-0 text-[11px] font-bold text-emerald-400">
                        {mission.completed ? (
                          <span className="inline-flex items-center gap-0.5">
                            <Check className="h-3 w-3" />+{mission.reward}
                          </span>
                        ) : (
                          `${Math.floor(mission.progress)}/${mission.target}`
                        )}
                      </span>
                    </div>
                    <div className="h-1 w-full overflow-hidden rounded-full bg-white/10">
                      <div
                        className={`h-full ${
                          mission.completed ? 'bg-emerald-400' : 'bg-cyan-400'
                        }`}
                        style={{ width: `${pct}%` }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        <div className="mt-4 flex flex-col gap-3 [@media(max-height:500px)]:mt-3 [@media(max-height:500px)]:gap-2">
          <button
            type="button"
            onClick={onRestart}
            className="inline-flex min-h-[48px] w-full items-center justify-center gap-2 rounded-lg bg-cyan-400 px-6 py-3 text-base font-bold text-slate-950 transition hover:bg-cyan-300 active:scale-[0.98] whitespace-nowrap cursor-pointer [@media(max-height:500px)]:min-h-[44px] [@media(max-height:500px)]:py-2"
          >
            <RotateCcw className="h-4 w-4" />
            <span>Rigioca</span>
          </button>

          <div className="grid grid-cols-2 gap-3 [@media(max-height:500px)]:gap-2">
            <button
              type="button"
              onClick={onOpenUpgrades}
              className="inline-flex min-h-[44px] items-center justify-center gap-2 rounded-lg border border-white/15 bg-white/5 px-4 py-2.5 text-sm font-semibold text-slate-200 transition hover:bg-white/10 active:scale-[0.98] whitespace-nowrap cursor-pointer"
            >
              <Wrench className="h-4 w-4 text-amber-400" />
              <span>Officina</span>
            </button>

            <button
              type="button"
              onClick={onQuitToMenu}
              className="inline-flex min-h-[44px] items-center justify-center gap-2 rounded-lg border border-white/15 bg-white/5 px-4 py-2.5 text-sm font-semibold text-slate-200 transition hover:bg-white/10 active:scale-[0.98] whitespace-nowrap cursor-pointer"
            >
              <Home className="h-4 w-4" />
              <span>Menu</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default GameOver;
