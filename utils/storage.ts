import { OrientationMode, PlayerProgress, UpgradeId } from '../types';

const STORAGE_KEY = 'neon_runner_progress_v2';
const LEGACY_HIGHSCORE_KEY = 'neon_runner_highscore';

const DEFAULT_PROGRESS: PlayerProgress = {
  highScore: 0,
  totalCredits: 0,
  muted: false,
  orientationMode: 'auto',
  upgrades: {
    shieldDuration: 0,
    magnetDuration: 0,
    blasterRate: 0,
    creditMultiplier: 0,
  },
};

function sanitizeOrientation(val: unknown): OrientationMode {
  return val === 'landscape' ? 'landscape' : 'auto';
}

export function loadProgress(): PlayerProgress {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw) as Partial<PlayerProgress>;
      return {
        highScore: typeof parsed.highScore === 'number' ? parsed.highScore : 0,
        totalCredits: typeof parsed.totalCredits === 'number' ? parsed.totalCredits : 0,
        muted: Boolean(parsed.muted),
        orientationMode: sanitizeOrientation(parsed.orientationMode),
        upgrades: {
          shieldDuration: sanitizeLevel(parsed.upgrades?.shieldDuration),
          magnetDuration: sanitizeLevel(parsed.upgrades?.magnetDuration),
          blasterRate: sanitizeLevel(parsed.upgrades?.blasterRate),
          creditMultiplier: sanitizeLevel(parsed.upgrades?.creditMultiplier),
        },
      };
    }

    const legacyScore = parseInt(localStorage.getItem(LEGACY_HIGHSCORE_KEY) || '0', 10);
    return {
      ...DEFAULT_PROGRESS,
      upgrades: { ...DEFAULT_PROGRESS.upgrades },
      highScore: Number.isFinite(legacyScore) && legacyScore > 0 ? legacyScore : 0,
    };
  } catch {
    return {
      ...DEFAULT_PROGRESS,
      upgrades: { ...DEFAULT_PROGRESS.upgrades },
    };
  }
}

export function saveProgress(progress: PlayerProgress): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(progress));
    localStorage.setItem(LEGACY_HIGHSCORE_KEY, progress.highScore.toString());
  } catch {
    // Ignore storage quota or private mode restrictions
  }
}

function sanitizeLevel(val: unknown): number {
  if (typeof val !== 'number' || !Number.isFinite(val)) return 0;
  return Math.max(0, Math.min(5, Math.floor(val)));
}

export function updateUpgradeLevel(
  progress: PlayerProgress,
  id: UpgradeId,
  cost: number
): PlayerProgress | null {
  if (progress.totalCredits < cost) return null;
  const next: PlayerProgress = {
    ...progress,
    totalCredits: progress.totalCredits - cost,
    upgrades: {
      ...progress.upgrades,
      [id]: Math.min(5, progress.upgrades[id] + 1),
    },
  };
  saveProgress(next);
  return next;
}
