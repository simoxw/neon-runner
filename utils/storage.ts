import { createMissionFromSeed, formatMissionLabel } from '../constants';
import {
  ActiveMission,
  CareerStats,
  DailyRewardState,
  MissionType,
  OrientationMode,
  PlayerProgress,
  RunMode,
  SkinId,
  UpgradeId,
} from '../types';
import {
  computeDailyClaimState,
  evaluateMilestoneSkins,
  getLocalDateKey,
} from './gameRules';

const STORAGE_KEY = 'neon_runner_progress_v2';
const LEGACY_HIGHSCORE_KEY = 'neon_runner_highscore';

const VALID_SKINS: SkinId[] = [
  'cyan',
  'crimson',
  'solar',
  'emerald',
  'violet',
  'apex_chrome',
  'boss_slayer',
  'turbo_phantom',
];

const VALID_MISSION_TYPES: MissionType[] = [
  'distance',
  'drones',
  'credits',
  'doubleJumps',
  'platforms',
  'overdrive',
];

function createInitialMissions(startSeed: number = 0): {
  missions: ActiveMission[];
  nextSeed: number;
} {
  const missions: ActiveMission[] = [];
  let seed = startSeed;
  while (missions.length < 3) {
    const usedTypes = missions.map((m) => m.type);
    missions.push(createMissionFromSeed(seed, usedTypes));
    seed += 1;
  }
  return { missions, nextSeed: seed };
}

const INITIAL_MISSION_BATCH = createInitialMissions(0);

const DEFAULT_CAREER: CareerStats = {
  totalRuns: 0,
  totalDistance: 0,
  totalDrones: 0,
  totalBosses: 0,
  bestCombo: 0,
};

const DEFAULT_DAILY: DailyRewardState = {
  lastClaimDate: null,
  streak: 0,
};

const DEFAULT_PROGRESS: PlayerProgress = {
  highScore: 0,
  turboHighScore: 0,
  totalCredits: 0,
  muted: false,
  orientationMode: 'auto',
  runMode: 'classic',
  unlockedSkins: ['cyan'],
  equippedSkin: 'cyan',
  upgrades: {
    shieldDuration: 0,
    magnetDuration: 0,
    blasterRate: 0,
    creditMultiplier: 0,
    jetpackThruster: 0,
    empWave: 0,
  },
  missions: INITIAL_MISSION_BATCH.missions,
  missionSeed: INITIAL_MISSION_BATCH.nextSeed,
  dailyReward: { ...DEFAULT_DAILY },
  career: { ...DEFAULT_CAREER },
};

function sanitizeOrientation(val: unknown): OrientationMode {
  return val === 'landscape' ? 'landscape' : 'auto';
}

function sanitizeRunMode(val: unknown): RunMode {
  return val === 'turbo' ? 'turbo' : 'classic';
}

function sanitizeSkinId(val: unknown): SkinId {
  return typeof val === 'string' && VALID_SKINS.includes(val as SkinId)
    ? (val as SkinId)
    : 'cyan';
}

function sanitizeUnlockedSkins(val: unknown): SkinId[] {
  if (!Array.isArray(val)) return ['cyan'];
  const filtered = val.filter(
    (item): item is SkinId =>
      typeof item === 'string' && VALID_SKINS.includes(item as SkinId)
  );
  if (!filtered.includes('cyan')) {
    filtered.unshift('cyan');
  }
  return Array.from(new Set(filtered));
}

function sanitizeNonNegativeInt(val: unknown): number {
  if (typeof val !== 'number' || !Number.isFinite(val)) return 0;
  return Math.max(0, Math.floor(val));
}

function sanitizeDailyReward(val: unknown): DailyRewardState {
  if (!val || typeof val !== 'object') return { ...DEFAULT_DAILY };
  const raw = val as Partial<DailyRewardState>;
  const lastClaimDate =
    typeof raw.lastClaimDate === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(raw.lastClaimDate)
      ? raw.lastClaimDate
      : null;
  const streak = sanitizeNonNegativeInt(raw.streak);
  return { lastClaimDate, streak };
}

function sanitizeCareer(val: unknown): CareerStats {
  if (!val || typeof val !== 'object') return { ...DEFAULT_CAREER };
  const raw = val as Partial<CareerStats>;
  return {
    totalRuns: sanitizeNonNegativeInt(raw.totalRuns),
    totalDistance: sanitizeNonNegativeInt(raw.totalDistance),
    totalDrones: sanitizeNonNegativeInt(raw.totalDrones),
    totalBosses: sanitizeNonNegativeInt(raw.totalBosses),
    bestCombo: sanitizeNonNegativeInt(raw.bestCombo),
  };
}

function sanitizeMissions(
  val: unknown,
  seedVal: unknown
): { missions: ActiveMission[]; missionSeed: number } {
  let nextSeed =
    typeof seedVal === 'number' && Number.isFinite(seedVal) && seedVal >= 0
      ? Math.floor(seedVal)
      : 3;

  if (!Array.isArray(val)) {
    const fresh = createInitialMissions(0);
    return { missions: fresh.missions, missionSeed: fresh.nextSeed };
  }

  const valid: ActiveMission[] = [];
  for (const item of val) {
    if (
      item &&
      typeof item === 'object' &&
      typeof (item as ActiveMission).id === 'string' &&
      VALID_MISSION_TYPES.includes((item as ActiveMission).type) &&
      typeof (item as ActiveMission).label === 'string' &&
      typeof (item as ActiveMission).target === 'number' &&
      (item as ActiveMission).target > 0 &&
      typeof (item as ActiveMission).reward === 'number'
    ) {
      const m = item as ActiveMission;
      const clampedProgress = Math.max(
        0,
        Math.min(m.target, typeof m.progress === 'number' ? m.progress : 0)
      );
      valid.push({
        id: m.id,
        type: m.type,
        label: formatMissionLabel(m.type, m.target),
        target: m.target,
        progress: clampedProgress,
        reward: m.reward,
        completed: Boolean(m.completed) || clampedProgress >= m.target,
      });
    }
    if (valid.length >= 3) break;
  }

  while (valid.length < 3) {
    const usedTypes = valid.map((m) => m.type);
    valid.push(createMissionFromSeed(nextSeed, usedTypes));
    nextSeed += 1;
  }

  return { missions: valid, missionSeed: nextSeed };
}

export function refreshCompletedMissions(progress: PlayerProgress): PlayerProgress {
  let nextSeed = progress.missionSeed;
  const activeTypes = progress.missions.filter((m) => !m.completed).map((m) => m.type);
  let changed = false;

  const updatedMissions = progress.missions.map((mission) => {
    if (!mission.completed) return mission;
    changed = true;
    const replacement = createMissionFromSeed(nextSeed, activeTypes);
    activeTypes.push(replacement.type);
    nextSeed += 1;
    return replacement;
  });

  if (!changed) return progress;
  const next: PlayerProgress = {
    ...progress,
    missions: updatedMissions,
    missionSeed: nextSeed,
  };
  saveProgress(next);
  return next;
}

export function loadProgress(): PlayerProgress {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw) as Partial<PlayerProgress>;
      const unlocked = sanitizeUnlockedSkins(parsed.unlockedSkins);
      const equippedCandidate = sanitizeSkinId(parsed.equippedSkin);
      const equipped = unlocked.includes(equippedCandidate) ? equippedCandidate : 'cyan';
      const missionState = sanitizeMissions(parsed.missions, parsed.missionSeed);

      return {
        highScore: sanitizeNonNegativeInt(parsed.highScore),
        turboHighScore: sanitizeNonNegativeInt(parsed.turboHighScore),
        totalCredits: sanitizeNonNegativeInt(parsed.totalCredits),
        muted: Boolean(parsed.muted),
        orientationMode: sanitizeOrientation(parsed.orientationMode),
        runMode: sanitizeRunMode(parsed.runMode),
        unlockedSkins: unlocked,
        equippedSkin: equipped,
        upgrades: {
          shieldDuration: sanitizeLevel(parsed.upgrades?.shieldDuration),
          magnetDuration: sanitizeLevel(parsed.upgrades?.magnetDuration),
          blasterRate: sanitizeLevel(parsed.upgrades?.blasterRate),
          creditMultiplier: sanitizeLevel(parsed.upgrades?.creditMultiplier),
          jetpackThruster: sanitizeLevel(parsed.upgrades?.jetpackThruster),
          empWave: sanitizeLevel(parsed.upgrades?.empWave),
        },
        missions: missionState.missions,
        missionSeed: missionState.missionSeed,
        dailyReward: sanitizeDailyReward(parsed.dailyReward),
        career: sanitizeCareer(parsed.career),
      };
    }

    const legacyScore = parseInt(localStorage.getItem(LEGACY_HIGHSCORE_KEY) || '0', 10);
    const fresh = createInitialMissions(0);
    return {
      ...DEFAULT_PROGRESS,
      unlockedSkins: ['cyan'],
      upgrades: { ...DEFAULT_PROGRESS.upgrades },
      missions: fresh.missions,
      missionSeed: fresh.nextSeed,
      dailyReward: { ...DEFAULT_DAILY },
      career: { ...DEFAULT_CAREER },
      highScore: Number.isFinite(legacyScore) && legacyScore > 0 ? legacyScore : 0,
    };
  } catch {
    const fresh = createInitialMissions(0);
    return {
      ...DEFAULT_PROGRESS,
      unlockedSkins: ['cyan'],
      upgrades: { ...DEFAULT_PROGRESS.upgrades },
      missions: fresh.missions,
      missionSeed: fresh.nextSeed,
      dailyReward: { ...DEFAULT_DAILY },
      career: { ...DEFAULT_CAREER },
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
  if (progress.totalCredits < cost || progress.upgrades[id] >= 5) return null;
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

export function unlockAndEquipSkin(
  progress: PlayerProgress,
  skinId: SkinId,
  cost: number,
  isMilestoneLocked: boolean = false
): PlayerProgress | null {
  if (progress.unlockedSkins.includes(skinId)) {
    const next: PlayerProgress = { ...progress, equippedSkin: skinId };
    saveProgress(next);
    return next;
  }
  if (isMilestoneLocked || progress.totalCredits < cost) return null;
  const next: PlayerProgress = {
    ...progress,
    totalCredits: progress.totalCredits - cost,
    unlockedSkins: [...progress.unlockedSkins, skinId],
    equippedSkin: skinId,
  };
  saveProgress(next);
  return next;
}

export function claimDailyReward(
  progress: PlayerProgress,
  todayKey: string = getLocalDateKey()
): {
  nextProgress: PlayerProgress;
  rewardCredits: number;
  newStreak: number;
} | null {
  const claimState = computeDailyClaimState(progress.dailyReward, todayKey);
  if (!claimState.canClaim) return null;

  const nextProgress: PlayerProgress = {
    ...progress,
    totalCredits: progress.totalCredits + claimState.rewardCredits,
    dailyReward: {
      lastClaimDate: todayKey,
      streak: claimState.nextStreak,
    },
  };
  saveProgress(nextProgress);
  return {
    nextProgress,
    rewardCredits: claimState.rewardCredits,
    newStreak: claimState.nextStreak,
  };
}

export function recordRunOutcome(
  progress: PlayerProgress,
  outcome: {
    score: number;
    runMode: RunMode;
    earnedCredits: number;
    dronesDestroyed: number;
    bossesDefeated: number;
    maxCombo: number;
  }
): {
  nextProgress: PlayerProgress;
  beatRecord: boolean;
  newlyUnlockedSkins: SkinId[];
} {
  const isTurbo = outcome.runMode === 'turbo';
  const beatRecord = isTurbo
    ? outcome.score > progress.turboHighScore
    : outcome.score > progress.highScore;

  const updatedCareer: CareerStats = {
    totalRuns: progress.career.totalRuns + 1,
    totalDistance: progress.career.totalDistance + Math.max(0, Math.floor(outcome.score)),
    totalDrones: progress.career.totalDrones + Math.max(0, Math.floor(outcome.dronesDestroyed)),
    totalBosses: progress.career.totalBosses + Math.max(0, Math.floor(outcome.bossesDefeated)),
    bestCombo: Math.max(progress.career.bestCombo, Math.max(0, Math.floor(outcome.maxCombo))),
  };

  const baseUpdated: PlayerProgress = {
    ...progress,
    highScore: !isTurbo && beatRecord ? outcome.score : progress.highScore,
    turboHighScore: isTurbo && beatRecord ? outcome.score : progress.turboHighScore,
    totalCredits: progress.totalCredits + Math.max(0, Math.floor(outcome.earnedCredits)),
    career: updatedCareer,
  };

  const newlyUnlockedSkins = evaluateMilestoneSkins(baseUpdated, outcome.score, outcome.runMode);
  const nextProgress: PlayerProgress =
    newlyUnlockedSkins.length > 0
      ? {
          ...baseUpdated,
          unlockedSkins: Array.from(new Set([...baseUpdated.unlockedSkins, ...newlyUnlockedSkins])),
        }
      : baseUpdated;

  saveProgress(nextProgress);
  return {
    nextProgress,
    beatRecord,
    newlyUnlockedSkins,
  };
}
