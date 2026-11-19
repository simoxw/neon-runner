import { useCallback, useEffect, useState } from 'react';
import { OrientationMode } from '../types';

type LockableOrientation = ScreenOrientation & {
  lock?: (orientation: 'landscape' | 'portrait' | 'any') => Promise<void>;
  unlock?: () => void;
};

export function useOrientation() {
  const [isLandscapeViewport, setIsLandscapeViewport] = useState(() =>
    typeof window !== 'undefined' ? window.innerWidth > window.innerHeight : true
  );
  const [showRotateHint, setShowRotateHint] = useState(false);

  useEffect(() => {
    const syncViewport = () => {
      const landscape = window.innerWidth > window.innerHeight;
      setIsLandscapeViewport(landscape);
      if (landscape) {
        setShowRotateHint(false);
      }
    };

    window.addEventListener('resize', syncViewport);
    window.addEventListener('orientationchange', syncViewport);
    return () => {
      window.removeEventListener('resize', syncViewport);
      window.removeEventListener('orientationchange', syncViewport);
    };
  }, []);

  const applyOrientation = useCallback(
    async (mode: OrientationMode, fromUserGesture: boolean) => {
      if (typeof window === 'undefined') return;

      const isStandalone =
        window.matchMedia('(display-mode: standalone)').matches ||
        (window.navigator as unknown as { standalone?: boolean }).standalone === true;
      const orientation = window.screen?.orientation as LockableOrientation | undefined;

      if (mode === 'landscape') {
        try {
          if (!isStandalone && !document.fullscreenElement && document.documentElement.requestFullscreen) {
            await document.documentElement.requestFullscreen().catch(() => {});
          }
          if (orientation && typeof orientation.lock === 'function') {
            await orientation.lock('landscape');
            setShowRotateHint(false);
            return;
          }
        } catch {
          // Lock rejected or unsupported (e.g. iOS Safari or desktop browser)
        }

        if (fromUserGesture && window.innerWidth <= window.innerHeight) {
          setShowRotateHint(true);
        }
      } else {
        setShowRotateHint(false);
        try {
          if (orientation && typeof orientation.unlock === 'function') {
            orientation.unlock();
          }
        } catch {
          // Ignore unlock errors
        }
        try {
          if (document.fullscreenElement && document.exitFullscreen) {
            await document.exitFullscreen().catch(() => {});
          }
        } catch {
          // Ignore fullscreen exit errors
        }
      }
    },
    []
  );

  const dismissRotateHint = useCallback(() => {
    setShowRotateHint(false);
  }, []);

  return {
    isLandscapeViewport,
    showRotateHint,
    applyOrientation,
    dismissRotateHint,
  };
}
