import React from 'react';
import { Home, RotateCcw, Wrench } from 'lucide-react';

interface GameOverProps {
  score: number;
  highScore: number;
  runCredits: number;
  totalCredits: number;
  dronesDestroyed: number;
  isNewRecord: boolean;
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
  onRestart,
  onOpenUpgrades,
  onQuitToMenu,
}) => {
  return (
    <div className="absolute inset-0 z-40 flex items-center justify-center bg-[#06070d]/82 p-4 backdrop-blur-md">
      <div className="max-h-[92dvh] w-full max-w-sm overflow-y-auto rounded-xl border border-rose-500/30 bg-[#0d1021]/95 p-6 shadow-2xl [@media(max-height:500px)]:max-w-md [@media(max-height:500px)]:p-4">
        <div className="text-center">
          <h2 className="font-display text-3xl font-bold text-white [@media(max-height:500px)]:text-2xl">
            Run Ended
          </h2>
          {isNewRecord && (
            <p className="mt-1 text-xs font-bold uppercase tracking-wider text-cyan-400">
              New Personal Best
            </p>
          )}
        </div>

        <div className="mt-5 space-y-2.5 border-y border-white/10 py-3.5 text-sm [@media(max-height:500px)]:mt-3 [@media(max-height:500px)]:space-y-1.5 [@media(max-height:500px)]:py-2.5">
          <div className="flex items-center justify-between">
            <span className="text-slate-400">Distance</span>
            <span className="font-mono-num text-xl font-bold text-white [@media(max-height:500px)]:text-lg">
              {score}m
            </span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-slate-400">Credits Earned</span>
            <span className="font-mono-num text-lg font-bold text-emerald-400 [@media(max-height:500px)]:text-base">
              +{runCredits}
            </span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-slate-400">Drones Destroyed</span>
            <span className="font-mono-num font-semibold text-amber-300">{dronesDestroyed}</span>
          </div>
          <div className="flex items-center justify-between pt-1 text-xs">
            <span className="text-slate-400">
              Best: <strong className="font-mono-num text-slate-200">{highScore}m</strong>
            </span>
            <span className="text-slate-400">
              Wallet: <strong className="font-mono-num text-emerald-400">{totalCredits}</strong>
            </span>
          </div>
        </div>

        <div className="mt-5 flex flex-col gap-3 [@media(max-height:500px)]:mt-3.5 [@media(max-height:500px)]:gap-2">
          <button
            type="button"
            onClick={onRestart}
            className="inline-flex min-h-[48px] w-full items-center justify-center gap-2 rounded-lg bg-cyan-400 px-6 py-3 text-base font-bold text-slate-950 transition hover:bg-cyan-300 active:scale-[0.98] whitespace-nowrap cursor-pointer [@media(max-height:500px)]:min-h-[44px] [@media(max-height:500px)]:py-2"
          >
            <RotateCcw className="h-4 w-4" />
            <span>Play Again</span>
          </button>

          <div className="grid grid-cols-2 gap-3 [@media(max-height:500px)]:gap-2">
            <button
              type="button"
              onClick={onOpenUpgrades}
              className="inline-flex min-h-[44px] items-center justify-center gap-2 rounded-lg border border-white/15 bg-white/5 px-4 py-2.5 text-sm font-semibold text-slate-200 transition hover:bg-white/10 active:scale-[0.98] whitespace-nowrap cursor-pointer"
            >
              <Wrench className="h-4 w-4 text-amber-400" />
              <span>Upgrades</span>
            </button>

            <button
              type="button"
              onClick={onQuitToMenu}
              className="inline-flex min-h-[44px] items-center justify-center gap-2 rounded-lg border border-white/15 bg-white/5 px-4 py-2.5 text-sm font-semibold text-slate-200 transition hover:bg-white/10 active:scale-[0.98] whitespace-nowrap cursor-pointer"
            >
              <Home className="h-4 w-4" />
              <span>Main Menu</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default GameOver;
