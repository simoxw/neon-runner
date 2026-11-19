import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import GameOver from './components/GameOver.tsx';
import HUD, { MissionToastData } from './components/HUD.tsx';
import Menu from './components/Menu.tsx';
import PauseModal from './components/PauseModal.tsx';
import UpgradesModal from './components/UpgradesModal.tsx';
import {
  GAME_CONFIG,
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
  SkinId,
  UpgradeId,
} from './types.ts';
import { soundEngine } from './utils/sound.ts';
import {
  loadProgress,
  refreshCompletedMissions,
  saveProgress,
  unlockAndEquipSkin,
  updateUpgradeLevel,
} from './utils/storage.ts';

const EMPTY_BUFFS: ActiveBuffs = {
  shieldRemaining: 0,
  shieldMax: 0,
  magnetRemaining: 0,
  magnetMax: 0,
  overdriveCharge: 0,
  overdriveActive: false,
  overdriveRemaining: 0,
  overdriveMax: GAME_CONFIG.OVERDRIVE_DURATION_MS,
};

interface RunMetricSnapshot {
  distance: number;
  drones: number;
  credits: number;
  doubleJumps: number;
  fastFalls: number;
  overdrive: number;
}

const ZERO_METRICS: RunMetricSnapshot = {
  distance: 0,
  drones: 0,
  credits: 0,
  doubleJumps: 0,
  fastFalls: 0,
  overdrive: 0,
};

const App: React.FC = () => {
  const [progress, setProgress] = useState<PlayerProgress>(() => {
    const initial = loadProgress();
    soundEngine.setMuted(initial.muted);
    return initial;
  });

  const [gameState, setGameState] = useState<GameState>(GameState.MENU);
  const [showUpgrades, setShowUpgrades] = useState(false);

  const [score, setScore] = useState(0);
  const [runCredits, setRunCredits] = useState(0);
  const [dronesDestroyed, setDronesDestroyed] = useState(0);
  const [speedMultiplier, setSpeedMultiplier] = useState(1.0);
  const [sectorNumber, setSectorNumber] = useState(1);
  const [sectorName, setSectorName] = useState(SECTORS_PALETTE[0].name);
  const [buffs, setBuffs] = useState<ActiveBuffs>(EMPTY_BUFFS);
  const [isNewRecord, setIsNewRecord] = useState(false);
  const [missionToast, setMissionToast] = useState<MissionToastData | null>(null);

  const { showRotateHint, applyOrientation, dismissRotateHint } = useOrientation();
  const { needRefresh, isUpdating, applyUpdate } = usePWAUpdate();

  const progressRef = useRef(progress);
  progressRef.current = progress;
  const prevRunMetricsRef = useRef<RunMetricSnapshot>({ ...ZERO_METRICS });
  const toastTimerRef = useRef<number | null>(null);

  useEffect(() => {
    return () => {
      if (toastTimerRef.current !== null) {
        window.clearTimeout(toastTimerRef.current);
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
        fastFalls: snapshot.fastFalls ?? prevMetrics.fastFalls,
        overdrive: snapshot.overdrive ?? prevMetrics.overdrive,
      };

      const deltas: Record<MissionType, number> = {
        distance: Math.max(0, nextMetrics.distance - prevMetrics.distance),
        drones: Math.max(0, nextMetrics.drones - prevMetrics.drones),
        credits: Math.max(0, nextMetrics.credits - prevMetrics.credits),
        doubleJumps: Math.max(0, nextMetrics.doubleJumps - prevMetrics.doubleJumps),
        fastFalls: Math.max(0, nextMetrics.fastFalls - prevMetrics.fastFalls),
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
        !progress.unlockedSkins.includes(skin.id) && progress.totalCredits >= skin.cost
    );
    return canUpgrade || canUnlockSkin;
  }, [progress]);

  const handleGameEvent = useCallback(
    (event: string, data: Record<string, unknown>) => {
      switch (event) {
        case 'GAME_START':
          prevRunMetricsRef.current = { ...ZERO_METRICS };
          setMissionToast(null);
          setGameState(GameState.PLAYING);
          setScore(0);
          setRunCredits(0);
          setDronesDestroyed(0);
          setSpeedMultiplier(
            typeof data?.speedMultiplier === 'number' ? data.speedMultiplier : 1.0
          );
          setSectorNumber(typeof data?.sectorNumber === 'number' ? data.sectorNumber : 1);
          setSectorName(
            typeof data?.sectorName === 'string' ? data.sectorName : SECTORS_PALETTE[0].name
          );
          setIsNewRecord(false);
          setBuffs(EMPTY_BUFFS);
          break;

        case 'UPDATE_RUN': {
          const nextScore = typeof data?.score === 'number' ? data.score : undefined;
          const nextCredits = typeof data?.runCredits === 'number' ? data.runCredits : undefined;
          const nextDrones =
            typeof data?.dronesDestroyed === 'number' ? data.dronesDestroyed : undefined;
          const nextDoubleJumps =
            typeof data?.doubleJumps === 'number' ? data.doubleJumps : undefined;
          const nextFastFalls = typeof data?.fastFalls === 'number' ? data.fastFalls : undefined;
          const nextOverdrives =
            typeof data?.overdrivesTriggered === 'number' ? data.overdrivesTriggered : undefined;

          if (nextScore !== undefined) setScore(nextScore);
          if (nextCredits !== undefined) setRunCredits(nextCredits);
          if (nextDrones !== undefined) setDronesDestroyed(nextDrones);
          if (typeof data?.speedMultiplier === 'number') setSpeedMultiplier(data.speedMultiplier);
          if (typeof data?.sectorNumber === 'number') setSectorNumber(data.sectorNumber);
          if (typeof data?.sectorName === 'string') setSectorName(data.sectorName);

          applyMissionDeltas(
            {
              distance: nextScore,
              credits: nextCredits,
              drones: nextDrones,
              doubleJumps: nextDoubleJumps,
              fastFalls: nextFastFalls,
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
          const finalFastFalls = typeof data?.fastFalls === 'number' ? data.fastFalls : 0;
          const finalOverdrives =
            typeof data?.overdrivesTriggered === 'number' ? data.overdrivesTriggered : 0;

          setScore(finalScore);
          setRunCredits(earnedCredits);
          setDronesDestroyed(finalDrones);
          setBuffs(EMPTY_BUFFS);
          setGameState(GameState.GAME_OVER);

          const afterMissionProgress = applyMissionDeltas(
            {
              distance: finalScore,
              credits: earnedCredits,
              drones: finalDrones,
              doubleJumps: finalDoubleJumps,
              fastFalls: finalFastFalls,
              overdrive: finalOverdrives,
            },
            false
          );

          const beatRecord = finalScore > afterMissionProgress.highScore;
          setIsNewRecord(beatRecord);

          const updated: PlayerProgress = {
            ...afterMissionProgress,
            highScore: beatRecord ? finalScore : afterMissionProgress.highScore,
            totalCredits: afterMissionProgress.totalCredits + earnedCredits,
          };
          saveProgress(updated);
          progressRef.current = updated;
          setProgress(updated);
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
    setProgress(updated);
  };

  const toggleOrientationMode = () => {
    const nextMode: OrientationMode = progress.orientationMode === 'auto' ? 'landscape' : 'auto';
    const updated: PlayerProgress = {
      ...progress,
      orientationMode: nextMode,
    };
    saveProgress(updated);
    setProgress(updated);
    void applyOrientation(nextMode, true);
  };

  const startGame = () => {
    soundEngine.unlock();
    setShowUpgrades(false);
    const rotated = refreshCompletedMissions(progressRef.current);
    progressRef.current = rotated;
    setProgress(rotated);
    if (rotated.orientationMode === 'landscape') {
      void applyOrientation('landscape', false);
    }
    window.dispatchEvent(new CustomEvent('PHASER_START'));
  };

  const restartGame = () => {
    soundEngine.unlock();
    setShowUpgrades(false);
    const rotated = refreshCompletedMissions(progressRef.current);
    progressRef.current = rotated;
    setProgress(rotated);
    window.dispatchEvent(new CustomEvent('PHASER_RESTART'));
  };

  const pauseGame = () => {
    window.dispatchEvent(new CustomEvent('PHASER_PAUSE'));
  };

  const resumeGame = () => {
    window.dispatchEvent(new CustomEvent('PHASER_RESUME'));
  };

  const quitToMenu = () => {
    setShowUpgrades(false);
    setMissionToast(null);
    prevRunMetricsRef.current = { ...ZERO_METRICS };
    const rotated = refreshCompletedMissions(progressRef.current);
    saveProgress(rotated);
    progressRef.current = rotated;
    setProgress(rotated);
    setGameState(GameState.MENU);
    setSectorNumber(1);
    setSectorName(SECTORS_PALETTE[0].name);
    window.dispatchEvent(new CustomEvent('PHASER_MENU'));
  };

  const handleBuyUpgrade = (id: UpgradeId, cost: number) => {
    soundEngine.unlock();
    const next = updateUpgradeLevel(progress, id, cost);
    if (next) {
      soundEngine.playUpgrade();
      setProgress(next);
      window.dispatchEvent(new CustomEvent('PHASER_SYNC_PROGRESS'));
    }
  };

  const handleUnlockOrEquipSkin = (skinId: SkinId, cost: number) => {
    soundEngine.unlock();
    const next = unlockAndEquipSkin(progress, skinId, cost);
    if (next) {
      soundEngine.playUpgrade();
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
          totalCredits={progress.totalCredits}
          muted={progress.muted}
          orientationMode={progress.orientationMode}
          showRotateHint={showRotateHint}
          hasUpdate={needRefresh}
          isUpdatingApp={isUpdating}
          canAffordUpgrade={canAffordUpgrade}
          missions={progress.missions}
          onStart={startGame}
          onOpenUpgrades={() => setShowUpgrades(true)}
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
          buffs={buffs}
          missionToast={missionToast}
          muted={progress.muted}
          onToggleMute={toggleMute}
          onPause={pauseGame}
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
          highScore={progress.highScore}
          runCredits={runCredits}
          totalCredits={progress.totalCredits}
          dronesDestroyed={dronesDestroyed}
          isNewRecord={isNewRecord}
          missions={progress.missions}
          onRestart={restartGame}
          onOpenUpgrades={() => setShowUpgrades(true)}
          onQuitToMenu={quitToMenu}
        />
      )}

      {showUpgrades && (
        <UpgradesModal
          progress={progress}
          onBuyUpgrade={handleBuyUpgrade}
          onUnlockOrEquipSkin={handleUnlockOrEquipSkin}
          onClose={() => setShowUpgrades(false)}
        />
      )}
    </div>
  );
};

export default App;
