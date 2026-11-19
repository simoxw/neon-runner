import React from 'react';
import { Coins, Magnet, Shield, X, Zap } from 'lucide-react';
import { getUpgradeCost, UPGRADES_CATALOG } from '../constants';
import { PlayerProgress, UpgradeId } from '../types';

interface UpgradesModalProps {
  progress: PlayerProgress;
  onBuyUpgrade: (id: UpgradeId, cost: number) => void;
  onClose: () => void;
}

const UPGRADE_ICONS: Record<UpgradeId, React.ReactNode> = {
  shieldDuration: <Shield className="h-5 w-5 text-cyan-400" />,
  magnetDuration: <Magnet className="h-5 w-5 text-amber-400" />,
  blasterRate: <Zap className="h-5 w-5 text-rose-400" />,
  creditMultiplier: <Coins className="h-5 w-5 text-emerald-400" />,
};

const UpgradesModal: React.FC<UpgradesModalProps> = ({
  progress,
  onBuyUpgrade,
  onClose,
}) => {
  return (
    <div className="absolute inset-0 z-50 flex items-center justify-center bg-[#06070d]/85 p-4 backdrop-blur-md">
      <div className="flex max-h-[92dvh] w-full max-w-2xl flex-col rounded-xl border border-white/15 bg-[#0d1021] shadow-2xl">
        <div className="flex items-center justify-between border-b border-white/10 px-6 py-4 [@media(max-height:500px)]:px-4 [@media(max-height:500px)]:py-2.5">
          <div>
            <h2 className="font-display text-xl font-bold text-white [@media(max-height:500px)]:text-lg">
              Runner Upgrades
            </h2>
            <p className="text-xs text-slate-400">
              Available Credits:{' '}
              <span className="font-mono-num font-bold text-emerald-400">{progress.totalCredits}</span>
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close upgrades"
            className="inline-flex h-11 w-11 items-center justify-center rounded-lg text-slate-400 transition hover:bg-white/10 hover:text-white cursor-pointer"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="grid gap-3 overflow-y-auto p-6 sm:grid-cols-2 [@media(max-height:500px)]:grid-cols-2 [@media(max-height:500px)]:p-4">
          {UPGRADES_CATALOG.map((item) => {
            const level = progress.upgrades[item.id];
            const isMax = level >= item.maxLevel;
            const cost = getUpgradeCost(item, level);
            const canAfford = !isMax && progress.totalCredits >= cost;

            return (
              <div
                key={item.id}
                className="flex flex-col justify-between rounded-lg border border-white/10 bg-white/[0.03] p-4 [@media(max-height:500px)]:p-3"
              >
                <div>
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-2.5">
                      {UPGRADE_ICONS[item.id]}
                      <h3 className="text-sm font-bold text-white">{item.name}</h3>
                    </div>
                    <span className="font-mono-num text-xs text-slate-400">
                      Lv {level}/{item.maxLevel}
                    </span>
                  </div>

                  <p className="mt-2 text-xs leading-relaxed text-slate-400">
                    {item.description}
                  </p>

                  <div className="mt-3 flex items-center gap-1.5">
                    {Array.from({ length: item.maxLevel }).map((_, idx) => (
                      <div
                        key={idx}
                        className={`h-1.5 flex-1 rounded-full ${
                          idx < level ? 'bg-cyan-400' : 'bg-white/10'
                        }`}
                      />
                    ))}
                  </div>

                  <div className="mt-2.5 text-xs text-slate-300">
                    <span>Current: </span>
                    <strong className="font-mono-num text-white">{item.formatValue(level)}</strong>
                    {!isMax && (
                      <span className="text-cyan-400"> → {item.formatValue(level + 1)}</span>
                    )}
                  </div>
                </div>

                <button
                  type="button"
                  disabled={isMax || !canAfford}
                  onClick={() => onBuyUpgrade(item.id, cost)}
                  className={`mt-4 inline-flex min-h-[44px] w-full items-center justify-center rounded-lg px-4 py-2 text-xs font-bold transition whitespace-nowrap [@media(max-height:500px)]:mt-3 ${
                    isMax
                      ? 'cursor-default border border-white/10 bg-white/5 text-slate-500'
                      : canAfford
                      ? 'cursor-pointer bg-cyan-400 text-slate-950 hover:bg-cyan-300 active:scale-[0.98]'
                      : 'cursor-not-allowed border border-white/10 bg-white/5 text-slate-500'
                  }`}
                >
                  {isMax ? 'Max Level' : `Upgrade · ${cost} Credits`}
                </button>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};

export default UpgradesModal;
