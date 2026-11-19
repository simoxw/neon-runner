import React, { useState } from 'react';
import { Check, Coins, Magnet, Palette, Shield, Sparkles, X, Zap } from 'lucide-react';
import { getUpgradeCost, SKINS_CATALOG, UPGRADES_CATALOG } from '../constants';
import { PlayerProgress, SkinId, UpgradeId } from '../types';

interface UpgradesModalProps {
  progress: PlayerProgress;
  onBuyUpgrade: (id: UpgradeId, cost: number) => void;
  onUnlockOrEquipSkin: (skinId: SkinId, cost: number) => void;
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
  onUnlockOrEquipSkin,
  onClose,
}) => {
  const [activeTab, setActiveTab] = useState<'upgrades' | 'skins'>('upgrades');

  return (
    <div className="absolute inset-0 z-50 flex items-center justify-center bg-[#06070d]/85 p-4 backdrop-blur-md">
      <div className="flex max-h-[92dvh] w-full max-w-2xl flex-col rounded-xl border border-white/15 bg-[#0d1021] shadow-2xl">
        <div className="flex items-center justify-between border-b border-white/10 px-6 py-4 [@media(max-height:500px)]:px-4 [@media(max-height:500px)]:py-2.5">
          <div>
            <h2 className="font-display text-xl font-bold text-white [@media(max-height:500px)]:text-lg">
              Runner Workshop
            </h2>
            <p className="text-xs text-slate-400">
              Available Credits:{' '}
              <span className="font-mono-num font-bold text-emerald-400">
                {progress.totalCredits}
              </span>
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

        <div className="flex gap-2 border-b border-white/10 px-6 py-2.5 [@media(max-height:500px)]:px-4 [@media(max-height:500px)]:py-2">
          <button
            type="button"
            onClick={() => setActiveTab('upgrades')}
            className={`inline-flex min-h-[44px] flex-1 items-center justify-center gap-2 rounded-lg px-4 py-2 text-xs font-bold transition whitespace-nowrap cursor-pointer ${
              activeTab === 'upgrades'
                ? 'bg-cyan-400 text-slate-950'
                : 'border border-white/10 bg-white/[0.03] text-slate-300 hover:bg-white/10'
            }`}
          >
            <Sparkles className="h-4 w-4" />
            <span>Upgrades</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('skins')}
            className={`inline-flex min-h-[44px] flex-1 items-center justify-center gap-2 rounded-lg px-4 py-2 text-xs font-bold transition whitespace-nowrap cursor-pointer ${
              activeTab === 'skins'
                ? 'bg-cyan-400 text-slate-950'
                : 'border border-white/10 bg-white/[0.03] text-slate-300 hover:bg-white/10'
            }`}
          >
            <Palette className="h-4 w-4" />
            <span>Skins</span>
          </button>
        </div>

        {activeTab === 'upgrades' ? (
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
        ) : (
          <div className="grid gap-3 overflow-y-auto p-6 sm:grid-cols-2 [@media(max-height:500px)]:grid-cols-2 [@media(max-height:500px)]:p-4">
            {SKINS_CATALOG.map((skin) => {
              const isUnlocked = progress.unlockedSkins.includes(skin.id);
              const isEquipped = progress.equippedSkin === skin.id;
              const canAfford = progress.totalCredits >= skin.cost;

              return (
                <div
                  key={skin.id}
                  className={`flex flex-col justify-between rounded-lg border p-4 [@media(max-height:500px)]:p-3 ${
                    isEquipped
                      ? 'border-cyan-400/50 bg-cyan-400/5'
                      : 'border-white/10 bg-white/[0.03]'
                  }`}
                >
                  <div className="flex items-center justify-between gap-3">
                    <div className="flex items-center gap-3">
                      <div
                        className="relative h-10 w-10 shrink-0 rounded-lg border border-white/20 shadow-inner"
                        style={{
                          background: `linear-gradient(135deg, ${skin.primaryHex} 0%, ${skin.accentHex} 100%)`,
                        }}
                      />
                      <div>
                        <h3 className="text-sm font-bold text-white">{skin.name}</h3>
                        <p className="text-xs text-slate-400">
                          {isEquipped
                            ? 'Active Suit'
                            : isUnlocked
                            ? 'Unlocked'
                            : `${skin.cost} Credits`}
                        </p>
                      </div>
                    </div>

                    {isEquipped && <Check className="h-5 w-5 shrink-0 text-cyan-400" />}
                  </div>

                  <button
                    type="button"
                    disabled={isEquipped || (!isUnlocked && !canAfford)}
                    onClick={() => onUnlockOrEquipSkin(skin.id, skin.cost)}
                    className={`mt-4 inline-flex min-h-[44px] w-full items-center justify-center rounded-lg px-4 py-2 text-xs font-bold transition whitespace-nowrap [@media(max-height:500px)]:mt-3 ${
                      isEquipped
                        ? 'cursor-default border border-cyan-400/30 bg-cyan-400/15 text-cyan-300'
                        : isUnlocked
                        ? 'cursor-pointer border border-white/15 bg-white/10 text-white hover:bg-white/20 active:scale-[0.98]'
                        : canAfford
                        ? 'cursor-pointer bg-emerald-400 text-slate-950 hover:bg-emerald-300 active:scale-[0.98]'
                        : 'cursor-not-allowed border border-white/10 bg-white/5 text-slate-500'
                    }`}
                  >
                    {isEquipped
                      ? 'Equipped'
                      : isUnlocked
                      ? 'Equip'
                      : `Unlock · ${skin.cost} Credits`}
                  </button>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};

export default UpgradesModal;
