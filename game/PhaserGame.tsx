import React, { useEffect, useRef } from 'react';
import Phaser from 'phaser';
import { Preloader } from './scenes/Preloader.ts';
import { MainGame } from './scenes/MainGame.ts';

interface PhaserGameProps {
  onEvent: (event: string, data: Record<string, unknown>) => void;
}

function canUseWebGLFramebuffer(): boolean {
  try {
    const testCanvas = document.createElement('canvas');
    testCanvas.width = 16;
    testCanvas.height = 16;
    const gl =
      (testCanvas.getContext('webgl2') as WebGL2RenderingContext | null) ||
      (testCanvas.getContext('webgl') as WebGLRenderingContext | null);
    if (!gl) return false;

    const texture = gl.createTexture();
    const framebuffer = gl.createFramebuffer();
    if (!texture || !framebuffer) return false;

    gl.bindTexture(gl.TEXTURE_2D, texture);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, 16, 16, 0, gl.RGBA, gl.UNSIGNED_BYTE, null);

    gl.bindFramebuffer(gl.FRAMEBUFFER, framebuffer);
    gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_2D, texture, 0);
    const status = gl.checkFramebufferStatus(gl.FRAMEBUFFER);

    gl.bindFramebuffer(gl.FRAMEBUFFER, null);
    gl.bindTexture(gl.TEXTURE_2D, null);
    gl.deleteFramebuffer(framebuffer);
    gl.deleteTexture(texture);
    gl.getExtension('WEBGL_lose_context')?.loseContext();

    return status === gl.FRAMEBUFFER_COMPLETE;
  } catch {
    return false;
  }
}

const PhaserGame: React.FC<PhaserGameProps> = ({ onEvent }) => {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const gameRef = useRef<Phaser.Game | null>(null);
  const onEventRef = useRef(onEvent);
  onEventRef.current = onEvent;

  useEffect(() => {
    const container = containerRef.current;
    if (!container || gameRef.current) return;

    let cancelled = false;
    let rafId: number | null = null;
    let resizeObserver: ResizeObserver | null = null;

    const handlePhaserEvent = (e: Event) => {
      const customEvent = e as CustomEvent<{ type: string; data: Record<string, unknown> }>;
      if (customEvent.detail) {
        onEventRef.current(customEvent.detail.type, customEvent.detail.data);
      }
    };

    window.addEventListener('PHASER_EVENT', handlePhaserEvent);

    const bootPhaser = () => {
      if (cancelled || gameRef.current) return;

      const width = Math.floor(container.clientWidth || window.innerWidth);
      const height = Math.floor(container.clientHeight || window.innerHeight);

      if (width <= 0 || height <= 0) {
        return;
      }

      if (resizeObserver) {
        resizeObserver.disconnect();
        resizeObserver = null;
      }

      const rendererType = canUseWebGLFramebuffer() ? Phaser.WEBGL : Phaser.CANVAS;

      const config: Phaser.Types.Core.GameConfig = {
        type: rendererType,
        width,
        height,
        parent: container,
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
        },
      };

      const game = new Phaser.Game(config);
      gameRef.current = game;
    };

    // Defer boot by one animation frame so React StrictMode's initial mount/unmount
    // doesn't destroy a booting Phaser WebGL context mid-texture-load.
    rafId = window.requestAnimationFrame(() => {
      rafId = null;
      if (cancelled) return;

      const width = Math.floor(container.clientWidth || window.innerWidth);
      const height = Math.floor(container.clientHeight || window.innerHeight);

      if (width > 0 && height > 0) {
        bootPhaser();
      } else if (typeof ResizeObserver !== 'undefined') {
        resizeObserver = new ResizeObserver(() => {
          bootPhaser();
        });
        resizeObserver.observe(container);
      }
    });

    return () => {
      cancelled = true;
      if (rafId !== null) {
        window.cancelAnimationFrame(rafId);
      }
      if (resizeObserver) {
        resizeObserver.disconnect();
      }
      window.removeEventListener('PHASER_EVENT', handlePhaserEvent);
      if (gameRef.current) {
        gameRef.current.destroy(true);
        gameRef.current = null;
      }
    };
  }, []);

  return <div ref={containerRef} id="game-container" className="w-full h-full" />;
};

export default PhaserGame;
