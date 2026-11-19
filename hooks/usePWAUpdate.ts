import { useCallback, useEffect, useRef, useState } from 'react';
import { registerSW } from 'virtual:pwa-register';

const CHECK_THROTTLE_MS = 30_000;
const PERIODIC_CHECK_MS = 15 * 60_000;

export function usePWAUpdate() {
  const [needRefresh, setNeedRefresh] = useState(false);
  const [isUpdating, setIsUpdating] = useState(false);

  const updateFnRef = useRef<((reloadPage?: boolean) => Promise<void>) | null>(null);
  const registrationRef = useRef<ServiceWorkerRegistration | null>(null);
  const lastCheckRef = useRef<number>(0);

  useEffect(() => {
    if (typeof window === 'undefined' || !('serviceWorker' in navigator)) return;

    const updateSW = registerSW({
      immediate: true,
      onNeedRefresh() {
        setNeedRefresh(true);
      },
      onRegisteredSW(_swUrl, registration) {
        if (!registration) return;
        registrationRef.current = registration;
        if (registration.waiting) {
          setNeedRefresh(true);
        }
      },
    });

    updateFnRef.current = updateSW;

    const checkForUpdates = () => {
      const now = Date.now();
      if (now - lastCheckRef.current < CHECK_THROTTLE_MS) return;
      lastCheckRef.current = now;

      const reg = registrationRef.current;
      if (reg) {
        reg.update().catch(() => {});
        if (reg.waiting) {
          setNeedRefresh(true);
        }
      }
    };

    const onVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        checkForUpdates();
      }
    };

    document.addEventListener('visibilitychange', onVisibilityChange);
    window.addEventListener('focus', checkForUpdates);
    window.addEventListener('online', checkForUpdates);

    const intervalId = window.setInterval(checkForUpdates, PERIODIC_CHECK_MS);

    return () => {
      document.removeEventListener('visibilitychange', onVisibilityChange);
      window.removeEventListener('focus', checkForUpdates);
      window.removeEventListener('online', checkForUpdates);
      window.clearInterval(intervalId);
    };
  }, []);

  const applyUpdate = useCallback(async () => {
    if (!updateFnRef.current || isUpdating) return;
    setIsUpdating(true);
    try {
      await updateFnRef.current(true);
    } catch {
      setIsUpdating(false);
    }
  }, [isUpdating]);

  return {
    needRefresh,
    isUpdating,
    applyUpdate,
  };
}
