import React from 'react';
import { Home, Play, RotateCcw, Volume2, VolumeX } from 'lucide-react';

interface PauseModalProps {
  score: number;
  runCredits: number;
  muted: boolean;
  onResume: () => void;
  onRestart: () => void;
  onToggleMute: () => void;
  onQuitToMenu: () => void;
}

const PauseModal: React.FC<PauseModalProps> = ({
  score,
  runCredits,
  muted,
  onResume,
  onRestart,
  onToggleMute,
  onQuitToMenu,
}) => {
  return (
    <div className="absolute inset-0 z-40 flex items-center justify-center bg-[#06070d]/80 p-4 backdrop-blur-md">
      <div className="max-h-[92dvh] w-full max-w-sm overflow-y-auto rounded-xl border border-white/15 bg-[#0d1021]/95 p-6 shadow-2xl [@media(max-height:500px)]:p-4">
        <h2 className="font-display text-center text-2xl font-bold text-white [@media(max-height:500px)]:text-xl">
          Game Paused
        </h2>

        <div className="mt-4 flex items-center justify-center gap-4 text-sm text-slate-300 [@media(max-height:500px)]:mt-2">
          <div>
            <span className="text-slate-400">Distance </span>
            <span className="font-mono-num font-bold text-white">{score}m</span>
          </div>
          <span aria-hidden="true" className="text-slate-600">·</span>
          <div>
            <span className="text-slate-400">Run Credits </span>
            <span className="font-mono-num font-bold text-emerald-400">+{runCredits}</span>
          </div>
        </div>

        <div className="mt-6 flex flex-col gap-3 [@media(max-height:500px)]:mt-4 [@media(max-height:500px)]:gap-2">
          <button
            type="button"
            onClick={onResume}
            className="inline-flex min-h-[48px] w-full items-center justify-center gap-2 rounded-lg bg-cyan-400 px-5 py-3 text-sm font-bold text-slate-950 transition hover:bg-cyan-300 active:scale-[0.98] whitespace-nowrap cursor-pointer [@media(max-height:500px)]:min-h-[44px] [@media(max-height:500px)]:py-2"
          >
            <Play className="h-4 w-4 fill-current" />
            <span>Resume</span>
          </button>

          <button
            type="button"
            onClick={onToggleMute}
            className="inline-flex min-h-[44px] w-full items-center justify-center gap-2 rounded-lg border border-white/15 bg-white/5 px-5 py-2.5 text-sm font-semibold text-slate-200 transition hover:bg-white/10 active:scale-[0.98] whitespace-nowrap cursor-pointer"
          >
            {muted ? <VolumeX className="h-4 w-4 text-rose-400" /> : <Volume2 className="h-4 w-4 text-cyan-400" />}
            <span>{muted ? 'Sound: Off' : 'Sound: On'}</span>
          </button>

          <div className="grid grid-cols-2 gap-3 [@media(max-height:500px)]:gap-2">
            <button
              type="button"
              onClick={onRestart}
              className="inline-flex min-h-[44px] items-center justify-center gap-2 rounded-lg border border-white/15 bg-white/5 px-4 py-2.5 text-sm font-semibold text-slate-200 transition hover:bg-white/10 active:scale-[0.98] whitespace-nowrap cursor-pointer"
            >
              <RotateCcw className="h-4 w-4" />
              <span>Restart</span>
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

export default PauseModal;
