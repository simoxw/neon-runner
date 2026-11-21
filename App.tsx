import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import GameOver from './components/GameOver.tsx';
import HUD, { MissionToastData } from './components/HUD.tsx';
import Menu from './components/Menu.tsx';
import PauseModal from './components/PauseModal.tsx';
import UpgradesModal, { UpgradesModalTab } from './components/UpgradesModal.tsx';
import {
  GAME_CONFIG,
  getEmpCooldownMs,
  getUpgradeCost,
  SECTORS_PALETTE,
  SKINS_CATALOG,
  UPGRADES_CATALOG,
} from './constants.ts';
import PhaserGame from './game/PhaserGame.tsx';
import { useOrientation } from './hooks/useOrientation.ts';
import { usePWAUpdate } from './hooks/usePWAUpdate.ts';
import {
  ActiveBuffs,
  GameState,
  MissionType,
  OrientationMode,
  PlayerProgress,
  RunMode,
  SkinId,
  UpgradeId,
} from './types.ts';
import { computeDailyClaimState } from './utils/gameRules.ts';
import { soundEngine } from './utils/sound.ts';
import {
  claimDailyReward,
  loadProgress,
  recordRunOutcome,
  refreshCompletedMissions,
  saveProgress,
  unlockAndEquipSkin,
  updateUpgradeLevel,
} from './utils/storage.ts';

function createBaseBuffs(empWaveLevel: number): ActiveBuffs {
  return {
    shieldRemaining: 0,
    shieldMax: 0,
    magnetRemaining: 0,
    magnetMax: 0,
    overdriveCharge: 0,
    overdriveActive: false,
    overdriveRemaining: 0,
    overdriveMax: GAME_CONFIG.OVERDRIVE_DURATION_MS,
    empUnlocked: empWaveLevel > 0,
    empCooldownRemaining: 0,
    empCooldownMax: getEmpCooldownMs(empWaveLevel),
  };
}

interface RunMetricSnapshot {
  distance: number;
  drones: number;
  credits: number;
  doubleJumps: number;
  platforms: number;
  overdrive: number;
}

const ZERO_METRICS: RunMetricSnapshot = {
  distance: 0,
  drones: 0,
  credits: 0,
  doubleJumps: 0,
  platforms: 0,
  overdrive: 0,
};

const App: React.FC = () => {
  const [progress, setProgress] = useState<PlayerProgress>(() => {
    const initial = loadProgress();
    soundEngine.setMuted(initial.muted);
    return initial;
  });

  const [gameState, setGameState] = useState<GameState>(GameState.MENU);
  const [upgradesModalTab, setUpgradesModalTab] = useState<UpgradesModalTab | null>(null);

  const [score, setScore] = useState(0);
  const [runCredits, setRunCredits] = useState(0);
  const [dronesDestroyed, setDronesDestroyed] = useState(0);
  const [bossesDefeated, setBossesDefeated] = useState(0);
  const [maxCombo, setMaxCombo] = useState(0);
  const [bossActive, setBossActive] = useState(false);
  const [bossName, setBossName] = useState('');
  const [bossHp, setBossHp] = useState(0);
  const [bossMaxHp, setBossMaxHp] = useState(0);
  const [activeRunMode, setActiveRunMode] = useState<RunMode>(() => progress.runMode);

  const [speedMultiplier, setSpeedMultiplier] = useState(1.0);
  const [sectorNumber, setSectorNumber] = useState(1);
  const [sectorName, setSectorName] = useState(SECTORS_PALETTE[0].name);
  const [comboCount, setComboCount] = useState(0);
  const [comboMultiplier, setComboMultiplier] = useState(1);
  const [buffs, setBuffs] = useState<ActiveBuffs>(() =>
    createBaseBuffs(progress.upgrades.empWave)
  );
  const [isNewRecord, setIsNewRecord] = useState(false);
  const [newlyUnlockedSkins, setNewlyUnlockedSkins] = useState<SkinId[]>([]);
  const [missionToast, setMissionToast] = useState<MissionToastData | null>(null);
  const [dailyClaimedFeedback, setDailyClaimedFeedback] = useState<number | null>(null);

  const { showRotateHint, applyOrientation, dismissRotateHint } = useOrientation();
  const { needRefresh, isUpdating, applyUpdate } = usePWAUpdate();

  const progressRef = useRef(progress);
  progressRef.current = progress;
  const prevRunMetricsRef = useRef<RunMetricSnapshot>({ ...ZERO_METRICS });
  const toastTimerRef = useRef<number | null>(null);
  const dailyFeedbackTimerRef = useRef<number | null>(null);

  useEffect(() => {
    return () => {
      if (toastTimerRef.current !== null) {
        window.clearTimeout(toastTimerRef.current);
      }
      if (dailyFeedbackTimerRef.current !== null) {
        window.clearTimeout(dailyFeedbackTimerRef.current);
      }
    };
  }, []);

  const showMissionCompleteToast = useCallback((label: string, reward: number) => {
    setMissionToast({ label, reward });
    if (toastTimerRef.current !== null) {
      window.clearTimeout(toastTimerRef.current);
    }
    toastTimerRef.current = window.setTimeout(() => {
      setMissionToast(null);
      toastTimerRef.current = null;
    }, 2800);
  }, []);

  const applyMissionDeltas = useCallback(
    (snapshot: Partial<RunMetricSnapshot>, persistProgress: boolean): PlayerProgress => {
      const prevMetrics = prevRunMetricsRef.current;
      const nextMetrics: RunMetricSnapshot = {
        distance: snapshot.distance ?? prevMetrics.distance,
        drones: snapshot.drones ?? prevMetrics.drones,
        credits: snapshot.credits ?? prevMetrics.credits,
        doubleJumps: snapshot.doubleJumps ?? prevMetrics.doubleJumps,
        platforms: snapshot.platforms ?? prevMetrics.platforms,
        overdrive: snapshot.overdrive ?? prevMetrics.overdrive,
      };

      const deltas: Record<MissionType, number> = {
        distance: Math.max(0, nextMetrics.distance - prevMetrics.distance),
        drones: Math.max(0, nextMetrics.drones - prevMetrics.drones),
        credits: Math.max(0, nextMetrics.credits - prevMetrics.credits),
        doubleJumps: Math.max(0, nextMetrics.doubleJumps - prevMetrics.doubleJumps),
        platforms: Math.max(0, nextMetrics.platforms - prevMetrics.platforms),
        overdrive: Math.max(0, nextMetrics.overdrive - prevMetrics.overdrive),
      };

      prevRunMetricsRef.current = nextMetrics;

      const currentProgress = progressRef.current;
      let bonusCredits = 0;
      let anyProgressChanged = false;
      let newlyCompleted: MissionToastData | null = null;

      const updatedMissions = currentProgress.missions.map((mission) => {
        if (mission.completed) return mission;
        const delta = deltas[mission.type];
        if (delta <= 0) return mission;

        anyProgressChanged = true;
        const nextVal = Math.min(mission.target, mission.progress + delta);
        const completedNow = nextVal >= mission.target;
        if (completedNow) {
          bonusCredits += mission.reward;
          newlyCompleted = { label: mission.label, reward: mission.reward };
        }
        return {
          ...mission,
          progress: nextVal,
          completed: completedNow,
        };
      });

      if (!anyProgressChanged && !persistProgress) {
        return currentProgress;
      }

      const nextProgress: PlayerProgress = {
        ...currentProgress,
        totalCredits: currentProgress.totalCredits + bonusCredits,
        missions: updatedMissions,
      };

      if (newlyCompleted) {
        soundEngine.playMissionComplete();
        showMissionCompleteToast(newlyCompleted.label, newlyCompleted.reward);
      }

      if (newlyCompleted || persistProgress) {
        saveProgress(nextProgress);
      }

      progressRef.current = nextProgress;
      setProgress(nextProgress);
      return nextProgress;
    },
    [showMissionCompleteToast]
  );

  const canAffordUpgrade = useMemo(() => {
    const canUpgrade = UPGRADES_CATALOG.some((item) => {
      const level = progress.upgrades[item.id];
      return level < item.maxLevel && progress.totalCredits >= getUpgradeCost(item, level);
    });
    const canUnlockSkin = SKINS_CATALOG.some(
      (skin) =>
        skin.unlockType === 'credits' &&
        !progress.unlockedSkins.includes(skin.id) &&
        progress.totalCredits >= skin.cost
    );
    return canUpgrade || canUnlockSkin;
  }, [progress]);

  const dailyClaimState = useMemo(
    () => computeDailyClaimState(progress.dailyReward),
    [progress.dailyReward]
  );

  const handleGameEvent = useCallback(
    (event: string, data: Record<string, unknown>) => {
      switch (event) {
        case 'GAME_START': {
          const startedMode: RunMode = data?.runMode === 'turbo' ? 'turbo' : 'classic';
          prevRunMetricsRef.current = { ...ZERO_METRICS };
          setMissionToast(null);
          setNewlyUnlockedSkins([]);
          setActiveRunMode(startedMode);
          setGameState(GameState.PLAYING);
          setScore(0);
          setRunCredits(0);
          setDronesDestroyed(0);
          setBossesDefeated(0);
          setMaxCombo(0);
          setBossActive(false);
          setBossName('');
          setBossHp(0);
          setBossMaxHp(0);
          setSpeedMultiplier(
            typeof data?.speedMultiplier === 'number' ? data.speedMultiplier : 1.0
          );
          setSectorNumber(typeof data?.sectorNumber === 'number' ? data.sectorNumber : 1);
          setSectorName(
            typeof data?.sectorName === 'string' ? data.sectorName : SECTORS_PALETTE[0].name
          );
          setComboCount(0);
          setComboMultiplier(1);
          setIsNewRecord(false);
          setBuffs(createBaseBuffs(progressRef.current.upgrades.empWave));
          break;
        }

        case 'UPDATE_RUN': {
          const nextScore = typeof data?.score === 'number' ? data.score : undefined;
          const nextCredits = typeof data?.runCredits === 'number' ? data.runCredits : undefined;
          const nextDrones =
            typeof data?.dronesDestroyed === 'number' ? data.dronesDestroyed : undefined;
          const nextDoubleJumps =
            typeof data?.doubleJumps === 'number' ? data.doubleJumps : undefined;
          const nextPlatforms =
            typeof data?.platformsLanded === 'number' ? data.platformsLanded : undefined;
          const nextOverdrives =
            typeof data?.overdrivesTriggered === 'number' ? data.overdrivesTriggered : undefined;

          if (nextScore !== undefined) setScore(nextScore);
          if (nextCredits !== undefined) setRunCredits(nextCredits);
          if (nextDrones !== undefined) setDronesDestroyed(nextDrones);
          if (typeof data?.speedMultiplier === 'number') setSpeedMultiplier(data.speedMultiplier);
          if (typeof data?.sectorNumber === 'number') setSectorNumber(data.sectorNumber);
          if (typeof data?.sectorName === 'string') setSectorName(data.sectorName);
          if (typeof data?.comboCount === 'number') setComboCount(data.comboCount);
          if (typeof data?.comboMultiplier === 'number') setComboMultiplier(data.comboMultiplier);
          if (typeof data?.maxCombo === 'number') setMaxCombo(data.maxCombo);
          if (typeof data?.bossesDefeated === 'number') setBossesDefeated(data.bossesDefeated);
          if (typeof data?.bossActive === 'boolean') setBossActive(data.bossActive);
          if (typeof data?.bossName === 'string') setBossName(data.bossName);
          if (typeof data?.bossHp === 'number') setBossHp(data.bossHp);
          if (typeof data?.bossMaxHp === 'number') setBossMaxHp(data.bossMaxHp);

          applyMissionDeltas(
            {
              distance: nextScore,
              credits: nextCredits,
              drones: nextDrones,
              doubleJumps: nextDoubleJumps,
              platforms: nextPlatforms,
              overdrive: nextOverdrives,
            },
            false
          );
          break;
        }

        case 'BUFF_UPDATE':
          setBuffs({
            shieldRemaining: typeof data?.shieldRemaining === 'number' ? data.shieldRemaining : 0,
            shieldMax: typeof data?.shieldMax === 'number' ? data.shieldMax : 0,
            magnetRemaining: typeof data?.magnetRemaining === 'number' ? data.magnetRemaining : 0,
            magnetMax: typeof data?.magnetMax === 'number' ? data.magnetMax : 0,
            overdriveCharge: typeof data?.overdriveCharge === 'number' ? data.overdriveCharge : 0,
            overdriveActive: Boolean(data?.overdriveActive),
            overdriveRemaining:
              typeof data?.overdriveRemaining === 'number' ? data.overdriveRemaining : 0,
            overdriveMax:
              typeof data?.overdriveMax === 'number'
                ? data.overdriveMax
                : GAME_CONFIG.OVERDRIVE_DURATION_MS,
            empUnlocked: Boolean(data?.empUnlocked),
            empCooldownRemaining:
              typeof data?.empCooldownRemaining === 'number' ? data.empCooldownRemaining : 0,
            empCooldownMax: typeof data?.empCooldownMax === 'number' ? data.empCooldownMax : 0,
          });
          break;

        case 'GAME_PAUSED':
          setGameState(GameState.PAUSED);
          break;

        case 'GAME_RESUMED':
          setGameState(GameState.PLAYING);
          break;

        case 'GAME_OVER': {
          const finalScore = typeof data?.score === 'number' ? data.score : 0;
          const earnedCredits = typeof data?.runCredits === 'number' ? data.runCredits : 0;
          const finalDrones = typeof data?.dronesDestroyed === 'number' ? data.dronesDestroyed : 0;
          const finalDoubleJumps = typeof data?.doubleJumps === 'number' ? data.doubleJumps : 0;
          const finalPlatforms =
            typeof data?.platformsLanded === 'number' ? data.platformsLanded : 0;
          const finalOverdrives =
            typeof data?.overdrivesTriggered === 'number' ? data.overdrivesTriggered : 0;
          const finalBosses =
            typeof data?.bossesDefeated === 'number' ? data.bossesDefeated : 0;
          const finalMaxCombo = typeof data?.maxCombo === 'number' ? data.maxCombo : 0;
          const finishedMode: RunMode = data?.runMode === 'turbo' ? 'turbo' : 'classic';

          setScore(finalScore);
          setRunCredits(earnedCredits);
          setDronesDestroyed(finalDrones);
          setBossesDefeated(finalBosses);
          setMaxCombo(finalMaxCombo);
          setBossActive(false);
          setBossName('');
          setBossHp(0);
          setBossMaxHp(0);
          setActiveRunMode(finishedMode);
          setComboCount(0);
          setComboMultiplier(1);
          setBuffs(createBaseBuffs(progressRef.current.upgrades.empWave));
          setGameState(GameState.GAME_OVER);

          const afterMissionProgress = applyMissionDeltas(
            {
              distance: finalScore,
              credits: earnedCredits,
              drones: finalDrones,
              doubleJumps: finalDoubleJumps,
              platforms: finalPlatforms,
              overdrive: finalOverdrives,
            },
            false
          );

          const outcome = recordRunOutcome(afterMissionProgress, {
            score: finalScore,
            runMode: finishedMode,
            earnedCredits,
            dronesDestroyed: finalDrones,
            bossesDefeated: finalBosses,
            maxCombo: finalMaxCombo,
          });

          setIsNewRecord(outcome.beatRecord);
          setNewlyUnlockedSkins(outcome.newlyUnlockedSkins);
          progressRef.current = outcome.nextProgress;
          setProgress(outcome.nextProgress);
          break;
        }
      }
    },
    [applyMissionDeltas]
  );

  const toggleMute = () => {
    soundEngine.unlock();
    const nextMuted = !progress.muted;
    soundEngine.setMuted(nextMuted);
    const updated: PlayerProgress = {
      ...progress,
      muted: nextMuted,
    };
    saveProgress(updated);
    progressRef.current = updated;
    setProgress(updated);
  };

  const toggleOrientationMode = () => {
    const nextMode: OrientationMode = progress.orientationMode === 'auto' ? 'landscape' : 'auto';
    const updated: PlayerProgress = {
      ...progress,
      orientationMode: nextMode,
    };
    saveProgress(updated);
    progressRef.current = updated;
    setProgress(updated);
    void applyOrientation(nextMode, true);
  };

  const handleSelectRunMode = (mode: RunMode) => {
    soundEngine.unlock();
    if (progress.runMode === mode) return;
    const updated: PlayerProgress = {
      ...progress,
      runMode: mode,
    };
    saveProgress(updated);
    progressRef.current = updated;
    setProgress(updated);
    setActiveRunMode(mode);
    window.dispatchEvent(new CustomEvent('PHASER_SYNC_PROGRESS'));
  };

  const handleClaimDaily = () => {
    soundEngine.unlock();
    const claimed = claimDailyReward(progressRef.current);
    if (!claimed) return;
    soundEngine.playDailyClaim();
    progressRef.current = claimed.nextProgress;
    setProgress(claimed.nextProgress);
    setDailyClaimedFeedback(claimed.rewardCredits);
    if (dailyFeedbackTimerRef.current !== null) {
      window.clearTimeout(dailyFeedbackTimerRef.current);
    }
    dailyFeedbackTimerRef.current = window.setTimeout(() => {
      setDailyClaimedFeedback(null);
      dailyFeedbackTimerRef.current = null;
    }, 3500);
  };

  const handleTriggerEmp = () => {
    soundEngine.unlock();
    window.dispatchEvent(new CustomEvent('PHASER_EMP'));
  };

  const startGame = () => {
    soundEngine.unlock();
    setUpgradesModalTab(null);
    const rotated = refreshCompletedMissions(progressRef.current);
    progressRef.current = rotated;
    setProgress(rotated);
    if (rotated.orientationMode === 'landscape') {
      void applyOrientation('landscape', false);
    }
    window.dispatchEvent(
      new CustomEvent('PHASER_START', { detail: { runMode: rotated.runMode } })
    );
  };

  const restartGame = () => {
    soundEngine.unlock();
    setUpgradesModalTab(null);
    const rotated = refreshCompletedMissions(progressRef.current);
    progressRef.current = rotated;
    setProgress(rotated);
    window.dispatchEvent(
      new CustomEvent('PHASER_RESTART', { detail: { runMode: activeRunMode } })
    );
  };

  const pauseGame = () => {
    window.dispatchEvent(new CustomEvent('PHASER_PAUSE'));
  };

  const resumeGame = () => {
    window.dispatchEvent(new CustomEvent('PHASER_RESUME'));
  };

  const quitToMenu = () => {
    setUpgradesModalTab(null);
    setMissionToast(null);
    setNewlyUnlockedSkins([]);
    prevRunMetricsRef.current = { ...ZERO_METRICS };
    const rotated = refreshCompletedMissions(progressRef.current);
    saveProgress(rotated);
    progressRef.current = rotated;
    setProgress(rotated);
    setGameState(GameState.MENU);
    setBossActive(false);
    setBossName('');
    setBossHp(0);
    setBossMaxHp(0);
    setSectorNumber(1);
    setSectorName(SECTORS_PALETTE[0].name);
    window.dispatchEvent(new CustomEvent('PHASER_MENU'));
  };

  const handleBuyUpgrade = (id: UpgradeId, cost: number) => {
    soundEngine.unlock();
    const next = updateUpgradeLevel(progress, id, cost);
    if (next) {
      soundEngine.playUpgrade();
      progressRef.current = next;
      setProgress(next);
      window.dispatchEvent(new CustomEvent('PHASER_SYNC_PROGRESS'));
    }
  };

  const handleUnlockOrEquipSkin = (
    skinId: SkinId,
    cost: number,
    isMilestoneLocked: boolean = false
  ) => {
    soundEngine.unlock();
    const next = unlockAndEquipSkin(progress, skinId, cost, isMilestoneLocked);
    if (next) {
      soundEngine.playUpgrade();
      progressRef.current = next;
      setProgress(next);
      window.dispatchEvent(new CustomEvent('PHASER_SYNC_PROGRESS'));
    }
  };

  return (
    <div className="relative h-dvh w-full overflow-hidden bg-[#06070d]">
      <PhaserGame onEvent={handleGameEvent} />

      {gameState === GameState.MENU && (
        <Menu
          highScore={progress.highScore}
          turboHighScore={progress.turboHighScore}
          totalCredits={progress.totalCredits}
          muted={progress.muted}
          orientationMode={progress.orientationMode}
          runMode={progress.runMode}
          showRotateHint={showRotateHint}
          hasUpdate={needRefresh}
          isUpdatingApp={isUpdating}
          canAffordUpgrade={canAffordUpgrade}
          dailyCanClaim={dailyClaimState.canClaim}
          dailyStreak={dailyClaimState.nextStreak}
          dailyRewardCredits={dailyClaimState.rewardCredits}
          dailyClaimedFeedback={dailyClaimedFeedback}
          missions={progress.missions}
          onStart={startGame}
          onSelectRunMode={handleSelectRunMode}
          onClaimDaily={handleClaimDaily}
          onOpenUpgrades={(initialTab = 'upgrades') => setUpgradesModalTab(initialTab)}
          onToggleMute={toggleMute}
          onToggleOrientation={toggleOrientationMode}
          onDismissRotateHint={dismissRotateHint}
          onApplyUpdate={applyUpdate}
        />
      )}

      {gameState === GameState.PLAYING && (
        <HUD
          score={score}
          runCredits={runCredits}
          speedMultiplier={speedMultiplier}
          sectorNumber={sectorNumber}
          sectorName={sectorName}
          runMode={activeRunMode}
          comboCount={comboCount}
          comboMultiplier={comboMultiplier}
          bossActive={bossActive}
          bossName={bossName}
          bossHp={bossHp}
          bossMaxHp={bossMaxHp}
          buffs={buffs}
          missionToast={missionToast}
          muted={progress.muted}
          onToggleMute={toggleMute}
          onPause={pauseGame}
          onTriggerEmp={handleTriggerEmp}
        />
      )}

      {gameState === GameState.PAUSED && (
        <PauseModal
          score={score}
          runCredits={runCredits}
          muted={progress.muted}
          onResume={resumeGame}
          onRestart={restartGame}
          onToggleMute={toggleMute}
          onQuitToMenu={quitToMenu}
        />
      )}

      {gameState === GameState.GAME_OVER && (
        <GameOver
          score={score}
          highScore={activeRunMode === 'turbo' ? progress.turboHighScore : progress.highScore}
          runMode={activeRunMode}
          runCredits={runCredits}
          totalCredits={progress.totalCredits}
          dronesDestroyed={dronesDestroyed}
          bossesDefeated={bossesDefeated}
          maxCombo={maxCombo}
          isNewRecord={isNewRecord}
          newlyUnlockedSkins={newlyUnlockedSkins}
          missions={progress.missions}
          onRestart={restartGame}
          onOpenUpgrades={() => setUpgradesModalTab('upgrades')}
          onQuitToMenu={quitToMenu}
        />
      )}

      {upgradesModalTab !== null && (
        <UpgradesModal
          progress={progress}
          initialTab={upgradesModalTab}
          onBuyUpgrade={handleBuyUpgrade}
          onUnlockOrEquipSkin={handleUnlockOrEquipSkin}
          onClose={() => setUpgradesModalTab(null)}
        />
      )}
    </div>
  );
};

export default App;
