import React, { useEffect, useRef } from 'react';
import Phaser from 'phaser';
import { Preloader } from './scenes/Preloader.ts';
import { MainGame } from './scenes/MainGame.ts';

interface PhaserGameProps {
  onEvent: (event: string, data: Record<string, unknown>) => void;
}

const PhaserGame: React.FC<PhaserGameProps> = ({ onEvent }) => {
  const gameRef = useRef<Phaser.Game | null>(null);
  const onEventRef = useRef(onEvent);
  onEventRef.current = onEvent;

  useEffect(() => {
    if (gameRef.current) return;

    const width = window.innerWidth;
    const height = window.innerHeight;

    const config: Phaser.Types.Core.GameConfig = {
      type: Phaser.AUTO,
      width: width,
      height: height,
      parent: 'game-container',
      physics: {
        default: 'arcade',
        arcade: {
          gravity: { y: 0, x: 0 },
          debug: false,
        },
      },
      scene: [Preloader, MainGame],
      backgroundColor: '#06070d',
      scale: {
        mode: Phaser.Scale.RESIZE,
        autoCenter: Phaser.Scale.CENTER_BOTH
      }
    };

    const game = new Phaser.Game(config);
    gameRef.current = game;

    const handlePhaserEvent = (e: Event) => {
      const customEvent = e as CustomEvent<{ type: string; data: Record<string, unknown> }>;
      if (customEvent.detail) {
        onEventRef.current(customEvent.detail.type, customEvent.detail.data);
      }
    };

    window.addEventListener('PHASER_EVENT', handlePhaserEvent);

    return () => {
      window.removeEventListener('PHASER_EVENT', handlePhaserEvent);
      if (gameRef.current) {
        gameRef.current.destroy(true);
        gameRef.current = null;
      }
    };
  }, []);

  return <div id="game-container" className="w-full h-full" />;
};

export default PhaserGame;
