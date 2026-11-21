import React, { useEffect, useState } from 'react';
import {
  Check,
  Coins,
  Crosshair,
  Lock,
  Magnet,
  Palette,
  Radio,
  Rocket,
  Shield,
  Sparkles,
  Trophy,
  X,
} from 'lucide-react';
import { getUpgradeCost, SKINS_CATALOG, UPGRADES_CATALOG } from '../constants';
import { PlayerProgress, SkinId, UpgradeId } from '../types';

export type UpgradesModalTab = 'upgrades' | 'skins' | 'career';

interface UpgradesModalProps {
  progress: PlayerProgress;
  initialTab?: UpgradesModalTab;
  onBuyUpgrade: (id: UpgradeId, cost: number) => void;
  onUnlockOrEquipSkin: (skinId: SkinId, cost: number, isMilestoneLocked?: boolean) => void;
  onClose: () => void;
}

const UPGRADE_ICONS: Record<UpgradeId, React.ReactNode> = {
  shieldDuration: <Shield className="h-5 w-5 text-cyan-400" />,
  magnetDuration: <Magnet className="h-5 w-5 text-amber-400" />,
  blasterRate: <Crosshair className="h-5 w-5 text-rose-400" />,
  jetpackThruster: <Rocket className="h-5 w-5 text-sky-400" />,
  empWave: <Radio className="h-5 w-5 text-cyan-300" />,
  creditMultiplier: <Coins className="h-5 w-5 text-emerald-400" />,
};

function getSkinMilestoneProgress(
  skinId: SkinId,
  progress: PlayerProgress
): { current: number; target: number; unit: string } | null {
  switch (skinId) {
    case 'apex_chrome':
      return { current: Math.min(1500, progress.highScore), target: 1500, unit: 'm' };
    case 'boss_slayer':
      return { current: Math.min(3, progress.career.totalBosses), target: 3, unit: '' };
    case 'turbo_phantom':
      return { current: Math.min(800, progress.turboHighScore), target: 800, unit: 'm' };
    default:
      return null;
  }
}

const UpgradesModal: React.FC<UpgradesModalProps> = ({
  progress,
  initialTab = 'upgrades',
  onBuyUpgrade,
  onUnlockOrEquipSkin,
  onClose,
}) => {
  const [activeTab, setActiveTab] = useState<UpgradesModalTab>(initialTab);

  useEffect(() => {
    setActiveTab(initialTab);
  }, [initialTab]);

  return (
    <div className="absolute inset-0 z-50 flex items-center justify-center bg-[#06070d]/85 p-4 backdrop-blur-md">
      <div className="flex max-h-[92dvh] w-full max-w-2xl flex-col rounded-xl border border-white/15 bg-[#0d1021] shadow-2xl">
        <div className="flex items-center justify-between border-b border-white/10 px-6 py-4 [@media(max-height:500px)]:px-4 [@media(max-height:500px)]:py-2.5">
          <div>
            <h2 className="font-display text-xl font-bold text-white [@media(max-height:500px)]:text-lg">
              Officina Runner
            </h2>
            <p className="text-xs text-slate-400">
              Crediti Disponibili:{' '}
              <span className="font-mono-num font-bold text-emerald-400">
                {progress.totalCredits}
              </span>
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Chiudi officina"
            className="inline-flex h-11 w-11 items-center justify-center rounded-lg text-slate-400 transition hover:bg-white/10 hover:text-white cursor-pointer"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="flex gap-2 border-b border-white/10 px-6 py-2.5 [@media(max-height:500px)]:px-4 [@media(max-height:500px)]:py-2">
          <button
            type="button"
            onClick={() => setActiveTab('upgrades')}
            className={`inline-flex min-h-[44px] flex-1 items-center justify-center gap-2 rounded-lg px-3 py-2 text-xs font-bold transition whitespace-nowrap cursor-pointer ${
              activeTab === 'upgrades'
                ? 'bg-cyan-400 text-slate-950'
                : 'border border-white/10 bg-white/[0.03] text-slate-300 hover:bg-white/10'
            }`}
          >
            <Sparkles className="h-4 w-4" />
            <span>Potenziamenti</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('skins')}
            className={`inline-flex min-h-[44px] flex-1 items-center justify-center gap-2 rounded-lg px-3 py-2 text-xs font-bold transition whitespace-nowrap cursor-pointer ${
              activeTab === 'skins'
                ? 'bg-cyan-400 text-slate-950'
                : 'border border-white/10 bg-white/[0.03] text-slate-300 hover:bg-white/10'
            }`}
          >
            <Palette className="h-4 w-4" />
            <span>Skin</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('career')}
            className={`inline-flex min-h-[44px] flex-1 items-center justify-center gap-2 rounded-lg px-3 py-2 text-xs font-bold transition whitespace-nowrap cursor-pointer ${
              activeTab === 'career'
                ? 'bg-cyan-400 text-slate-950'
                : 'border border-white/10 bg-white/[0.03] text-slate-300 hover:bg-white/10'
            }`}
          >
            <Trophy className="h-4 w-4" />
            <span>Carriera</span>
          </button>
        </div>

        {activeTab === 'upgrades' && (
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
                          className={`h-1.5 flex-1 rounded-sm ${
                            idx < level ? 'bg-cyan-400' : 'bg-white/10'
                          }`}
                        />
                      ))}
                    </div>

                    <div className="mt-2.5 text-xs text-slate-300">
                      <span>Attuale: </span>
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
                    {isMax
                      ? 'Livello Max'
                      : item.id === 'empWave' && level === 0
                      ? `Sblocca · ${cost} Crediti`
                      : `Potenzia · ${cost} Crediti`}
                  </button>
                </div>
              );
            })}
          </div>
        )}

        {activeTab === 'skins' && (
          <div className="grid gap-3 overflow-y-auto p-6 sm:grid-cols-2 [@media(max-height:500px)]:grid-cols-2 [@media(max-height:500px)]:p-4">
            {SKINS_CATALOG.map((skin) => {
              const isUnlocked = progress.unlockedSkins.includes(skin.id);
              const isEquipped = progress.equippedSkin === skin.id;
              const isMilestone = skin.unlockType === 'milestone';
              const isMilestoneLocked = isMilestone && !isUnlocked;
              const canAfford = !isMilestone && progress.totalCredits >= skin.cost;
              const milestoneProg = isMilestoneLocked
                ? getSkinMilestoneProgress(skin.id, progress)
                : null;
              const milestonePct = milestoneProg
                ? Math.min(100, Math.round((milestoneProg.current / milestoneProg.target) * 100))
                : 0;

              return (
                <div
                  key={skin.id}
                  className={`flex flex-col justify-between rounded-lg border p-4 [@media(max-height:500px)]:p-3 ${
                    isEquipped
                      ? 'border-cyan-400/50 bg-cyan-400/5'
                      : isMilestoneLocked
                      ? 'border-amber-400/20 bg-white/[0.025]'
                      : 'border-white/10 bg-white/[0.03]'
                  }`}
                >
                  <div>
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
                              ? 'Tuta Attiva'
                              : isUnlocked
                              ? isMilestone
                                ? 'Traguardo Raggiunto'
                                : 'Sbloccata'
                              : isMilestone
                              ? skin.milestoneLabel
                              : `${skin.cost} Crediti`}
                          </p>
                        </div>
                      </div>

                      {isEquipped ? (
                        <Check className="h-5 w-5 shrink-0 text-cyan-400" />
                      ) : isMilestoneLocked ? (
                        <Lock className="h-4 w-4 shrink-0 text-amber-400/80" />
                      ) : null}
                    </div>

                    {milestoneProg && (
                      <div className="mt-3 space-y-1">
                        <div className="flex items-center justify-between text-[11px] text-slate-400">
                          <span>Avanzamento</span>
                          <span className="font-mono-num text-amber-300">
                            {milestoneProg.current}
                            {milestoneProg.unit}/{milestoneProg.target}
                            {milestoneProg.unit}
                          </span>
                        </div>
                        <div className="h-1.5 w-full overflow-hidden rounded-sm bg-white/10">
                          <div
                            className="h-full bg-amber-400 transition-[width]"
                            style={{ width: `${milestonePct}%` }}
                          />
                        </div>
                      </div>
                    )}
                  </div>

                  <button
                    type="button"
                    disabled={isEquipped || isMilestoneLocked || (!isUnlocked && !canAfford)}
                    onClick={() => onUnlockOrEquipSkin(skin.id, skin.cost, isMilestoneLocked)}
                    className={`mt-4 inline-flex min-h-[44px] w-full items-center justify-center rounded-lg px-4 py-2 text-xs font-bold transition whitespace-nowrap [@media(max-height:500px)]:mt-3 ${
                      isEquipped
                        ? 'cursor-default border border-cyan-400/30 bg-cyan-400/15 text-cyan-300'
                        : isUnlocked
                        ? 'cursor-pointer border border-white/15 bg-white/10 text-white hover:bg-white/20 active:scale-[0.98]'
                        : isMilestoneLocked
                        ? 'cursor-not-allowed border border-amber-400/20 bg-amber-400/5 text-amber-300/70'
                        : canAfford
                        ? 'cursor-pointer bg-emerald-400 text-slate-950 hover:bg-emerald-300 active:scale-[0.98]'
                        : 'cursor-not-allowed border border-white/10 bg-white/5 text-slate-500'
                    }`}
                  >
                    {isEquipped
                      ? 'Equipaggiata'
                      : isUnlocked
                      ? 'Equipaggia'
                      : isMilestoneLocked
                      ? 'Sblocca tramite Traguardo'
                      : `Sblocca · ${skin.cost} Crediti`}
                  </button>
                </div>
              );
            })}
          </div>
        )}

        {activeTab === 'career' && (
          <div className="space-y-4 overflow-y-auto p-6 [@media(max-height:500px)]:p-4">
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
              <div className="rounded-lg border border-cyan-400/25 bg-cyan-400/5 p-3.5">
                <p className="text-[11px] font-medium text-slate-400">Record Classica</p>
                <p className="font-mono-num mt-1 text-xl font-bold text-cyan-300">
                  {progress.highScore}m
                </p>
              </div>
              <div className="rounded-lg border border-amber-400/25 bg-amber-400/5 p-3.5">
                <p className="text-[11px] font-medium text-slate-400">Record Turbo</p>
                <p className="font-mono-num mt-1 text-xl font-bold text-amber-300">
                  {progress.turboHighScore}m
                </p>
              </div>
              <div className="rounded-lg border border-white/10 bg-white/[0.03] p-3.5">
                <p className="text-[11px] font-medium text-slate-400">Corse Totali</p>
                <p className="font-mono-num mt-1 text-xl font-bold text-white">
                  {progress.career.totalRuns}
                </p>
              </div>
              <div className="rounded-lg border border-white/10 bg-white/[0.03] p-3.5">
                <p className="text-[11px] font-medium text-slate-400">Distanza Totale</p>
                <p className="font-mono-num mt-1 text-xl font-bold text-white">
                  {progress.career.totalDistance}m
                </p>
              </div>
              <div className="rounded-lg border border-white/10 bg-white/[0.03] p-3.5">
                <p className="text-[11px] font-medium text-slate-400">Droni Distrutti</p>
                <p className="font-mono-num mt-1 text-xl font-bold text-emerald-400">
                  {progress.career.totalDrones}
                </p>
              </div>
              <div className="rounded-lg border border-white/10 bg-white/[0.03] p-3.5">
                <p className="text-[11px] font-medium text-slate-400">Boss Abbattuti</p>
                <p className="font-mono-num mt-1 text-xl font-bold text-rose-400">
                  {progress.career.totalBosses}
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              <div className="flex items-center justify-between rounded-lg border border-white/10 bg-white/[0.03] px-4 py-3">
                <span className="text-xs font-medium text-slate-300">Serie Combo Massima</span>
                <span className="font-mono-num text-base font-bold text-cyan-300">
                  {progress.career.bestCombo}
                </span>
              </div>
              <div className="flex items-center justify-between rounded-lg border border-white/10 bg-white/[0.03] px-4 py-3">
                <span className="text-xs font-medium text-slate-300">Serie Giornaliera</span>
                <span className="font-mono-num text-base font-bold text-amber-300">
                  Giorno {Math.max(0, progress.dailyReward.streak)}
                </span>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default UpgradesModal;
