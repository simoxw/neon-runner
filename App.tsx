import React, { useCallback, useMemo, useRef, useState } from 'react';
import GameOver from './components/GameOver.tsx';
import HUD from './components/HUD.tsx';
import Menu from './components/Menu.tsx';
import PauseModal from './components/PauseModal.tsx';
import UpgradesModal from './components/UpgradesModal.tsx';
import { getUpgradeCost, UPGRADES_CATALOG } from './constants.ts';
import PhaserGame from './game/PhaserGame.tsx';
import { useOrientation } from './hooks/useOrientation.ts';
import { ActiveBuffs, GameState, OrientationMode, PlayerProgress, UpgradeId } from './types.ts';
import { soundEngine } from './utils/sound.ts';
import { loadProgress, saveProgress, updateUpgradeLevel } from './utils/storage.ts';

const EMPTY_BUFFS: ActiveBuffs = {
  shieldRemaining: 0,
  shieldMax: 0,
  magnetRemaining: 0,
  magnetMax: 0,
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
  const [buffs, setBuffs] = useState<ActiveBuffs>(EMPTY_BUFFS);
  const [isNewRecord, setIsNewRecord] = useState(false);

  const { showRotateHint, applyOrientation, dismissRotateHint } = useOrientation();

  const progressRef = useRef(progress);
  progressRef.current = progress;

  const canAffordUpgrade = useMemo(() => {
    return UPGRADES_CATALOG.some((item) => {
      const level = progress.upgrades[item.id];
      return level < item.maxLevel && progress.totalCredits >= getUpgradeCost(item, level);
    });
  }, [progress]);

  const handleGameEvent = useCallback((event: string, data: Record<string, unknown>) => {
    switch (event) {
      case 'GAME_START':
        setGameState(GameState.PLAYING);
        setScore(0);
        setRunCredits(0);
        setDronesDestroyed(0);
        setSpeedMultiplier(
          typeof data?.speedMultiplier === 'number' ? data.speedMultiplier : 1.0
        );
        setIsNewRecord(false);
        setBuffs(EMPTY_BUFFS);
        break;

      case 'UPDATE_RUN':
        if (typeof data?.score === 'number') setScore(data.score);
        if (typeof data?.runCredits === 'number') setRunCredits(data.runCredits);
        if (typeof data?.dronesDestroyed === 'number') setDronesDestroyed(data.dronesDestroyed);
        if (typeof data?.speedMultiplier === 'number') setSpeedMultiplier(data.speedMultiplier);
        break;

      case 'BUFF_UPDATE':
        setBuffs({
          shieldRemaining: typeof data?.shieldRemaining === 'number' ? data.shieldRemaining : 0,
          shieldMax: typeof data?.shieldMax === 'number' ? data.shieldMax : 0,
          magnetRemaining: typeof data?.magnetRemaining === 'number' ? data.magnetRemaining : 0,
          magnetMax: typeof data?.magnetMax === 'number' ? data.magnetMax : 0,
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

        setScore(finalScore);
        setRunCredits(earnedCredits);
        setDronesDestroyed(finalDrones);
        setBuffs(EMPTY_BUFFS);
        setGameState(GameState.GAME_OVER);

        const prev = progressRef.current;
        const beatRecord = finalScore > prev.highScore;
        setIsNewRecord(beatRecord);

        const updated: PlayerProgress = {
          ...prev,
          highScore: beatRecord ? finalScore : prev.highScore,
          totalCredits: prev.totalCredits + earnedCredits,
        };
        saveProgress(updated);
        setProgress(updated);
        break;
      }
    }
  }, []);

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
    if (progress.orientationMode === 'landscape') {
      void applyOrientation('landscape', false);
    }
    window.dispatchEvent(new CustomEvent('PHASER_START'));
  };

  const restartGame = () => {
    soundEngine.unlock();
    setShowUpgrades(false);
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
    setGameState(GameState.MENU);
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
          canAffordUpgrade={canAffordUpgrade}
          onStart={startGame}
          onOpenUpgrades={() => setShowUpgrades(true)}
          onToggleMute={toggleMute}
          onToggleOrientation={toggleOrientationMode}
          onDismissRotateHint={dismissRotateHint}
        />
      )}

      {gameState === GameState.PLAYING && (
        <HUD
          score={score}
          runCredits={runCredits}
          speedMultiplier={speedMultiplier}
          buffs={buffs}
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
          onRestart={restartGame}
          onOpenUpgrades={() => setShowUpgrades(true)}
          onQuitToMenu={quitToMenu}
        />
      )}

      {showUpgrades && (
        <UpgradesModal
          progress={progress}
          onBuyUpgrade={handleBuyUpgrade}
          onClose={() => setShowUpgrades(false)}
        />
      )}
    </div>
  );
};

export default App;
