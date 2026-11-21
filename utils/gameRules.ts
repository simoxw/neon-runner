import { GAME_CONFIG, getCreditMultiplier, getDailyRewardCredits } from '../constants';
import { DailyRewardState, PlayerProgress, RunMode, SkinId } from '../types';

export interface ComboState {
  count: number;
  timerMs: number;
  multiplier: number;
}

export type LaserPhase = 'warning' | 'active';

export interface LaserState {
  phase: LaserPhase;
  elapsedMs: number;
}

export function getComboMultiplier(comboCount: number): number {
  if (comboCount >= GAME_CONFIG.COMBO_TIER_3_THRESHOLD) return 3;
  if (comboCount >= GAME_CONFIG.COMBO_TIER_2_THRESHOLD) return 2;
  return 1;
}

export function advanceComboOnEvent(
  state: ComboState,
  streakGain: number = 1
): ComboState {
  const nextCount = Math.max(0, state.count + Math.max(0, streakGain));
  return {
    count: nextCount,
    timerMs: GAME_CONFIG.COMBO_DECAY_MS,
    multiplier: getComboMultiplier(nextCount),
  };
}

export function tickComboDecay(state: ComboState, deltaMs: number): ComboState {
  if (state.count <= 0) {
    return { count: 0, timerMs: 0, multiplier: 1 };
  }
  const remaining = Math.max(0, state.timerMs - Math.max(0, deltaMs));
  if (remaining === 0) {
    return { count: 0, timerMs: 0, multiplier: 1 };
  }
  return {
    count: state.count,
    timerMs: remaining,
    multiplier: getComboMultiplier(state.count),
  };
}

export function resetCombo(): ComboState {
  return { count: 0, timerMs: 0, multiplier: 1 };
}

export function computeCreditReward(
  baseAmount: number,
  upgradeLevel: number,
  comboMultiplier: number,
  runMode: RunMode = 'classic'
): number {
  const upgradeMult = getCreditMultiplier(upgradeLevel);
  const safeCombo = Math.max(1, comboMultiplier);
  const modeMult = runMode === 'turbo' ? GAME_CONFIG.TURBO_CREDIT_MULTIPLIER : 1;
  return Math.max(1, Math.round(baseAmount * upgradeMult * safeCombo * modeMult));
}

export function pickPowerupType(rng: () => number = Math.random): 'magnet' | 'shield' {
  return rng() < GAME_CONFIG.MAGNET_DROP_PROBABILITY ? 'magnet' : 'shield';
}

export function computeBossMaxHp(bossIndex: number): number {
  const safeIndex = Math.max(1, Math.floor(bossIndex));
  return Math.min(22, 7 + (safeIndex - 1) * 4);
}

export function shouldPauseSpawnsForBoss(
  scoreMeters: number,
  nextBossScoreMeters: number,
  bossActive: boolean
): boolean {
  return !bossActive && scoreMeters >= Math.max(0, nextBossScoreMeters - 38);
}

export function pickBossFixedLaneY(
  laneIndex: number,
  groundTop: number,
  safeTopY: number
): number {
  const lowLaneY = groundTop - 36;
  const highLaneY = Math.max(safeTopY + 32, groundTop - 132);
  return Math.abs(Math.floor(laneIndex)) % 2 === 0 ? lowLaneY : highLaneY;
}

export function advanceLaserState(state: LaserState, deltaMs: number): LaserState {
  const cycleMs = GAME_CONFIG.LASER_WARN_MS + GAME_CONFIG.LASER_ACTIVE_MS;
  const totalElapsed = (Math.max(0, state.elapsedMs) + Math.max(0, deltaMs)) % cycleMs;
  const phase: LaserPhase = totalElapsed < GAME_CONFIG.LASER_WARN_MS ? 'warning' : 'active';
  return {
    phase,
    elapsedMs: totalElapsed,
  };
}

export function resolveDroneBulletHit(currentHp: number): {
  nextHp: number;
  destroyed: boolean;
  armorBroken: boolean;
} {
  const nextHp = Math.max(0, currentHp - 1);
  return {
    nextHp,
    destroyed: nextHp <= 0,
    armorBroken: currentHp > 1 && nextHp === 1,
  };
}

export function stepRunDistance(
  currentDistance: number,
  currentSpeed: number,
  overdriveActive: boolean,
  deltaMs: number,
  runMode: RunMode = 'classic'
): {
  nextDistance: number;
  nextScore: number;
  effectiveSpeed: number;
} {
  const cap = runMode === 'turbo' ? GAME_CONFIG.TURBO_MAX_SPEED : GAME_CONFIG.MAX_SPEED;
  const effectiveSpeed = overdriveActive
    ? Math.min(cap + 180, currentSpeed + GAME_CONFIG.OVERDRIVE_SPEED_BONUS)
    : currentSpeed;
  const dtSec = Math.max(0, deltaMs) / 1000;
  const nextDistance = currentDistance + (effectiveSpeed * dtSec) / 14;
  return {
    nextDistance,
    nextScore: Math.floor(nextDistance),
    effectiveSpeed,
  };
}

export function computeSectorIndex(scoreMeters: number): number {
  return Math.max(0, Math.floor(scoreMeters / GAME_CONFIG.SECTOR_INTERVAL_METERS));
}

export function computeSpeedForScore(
  scoreMeters: number,
  runMode: RunMode = 'classic'
): number {
  const steps = Math.max(0, Math.floor(scoreMeters / GAME_CONFIG.DIFFICULTY_INTERVAL_METERS));
  if (runMode === 'turbo') {
    return Math.min(
      GAME_CONFIG.TURBO_MAX_SPEED,
      GAME_CONFIG.TURBO_BASE_SPEED + steps * GAME_CONFIG.TURBO_SPEED_INCREMENT
    );
  }
  return Math.min(
    GAME_CONFIG.MAX_SPEED,
    GAME_CONFIG.BASE_SPEED + steps * GAME_CONFIG.SPEED_INCREMENT
  );
}

export function computeRefilledFuel(currentFuelMs: number, maxFuelMs: number): number {
  return Math.max(0, Math.min(maxFuelMs, Math.max(currentFuelMs, maxFuelMs)));
}

export interface RoadGapSpan {
  leftX: number;
  rightX: number;
}

export function isOverRoadGap(
  playerX: number,
  gaps: RoadGapSpan[],
  edgeGracePx: number = 10
): boolean {
  for (let i = 0; i < gaps.length; i++) {
    const gap = gaps[i];
    if (playerX >= gap.leftX + edgeGracePx && playerX <= gap.rightX - edgeGracePx) {
      return true;
    }
  }
  return false;
}

export function shouldCollideWithGround(
  playerX: number,
  playerY: number,
  groundTop: number,
  gaps: RoadGapSpan[],
  overdriveActive: boolean
): boolean {
  if (playerY > groundTop - 16) {
    return false;
  }
  if (overdriveActive) {
    return true;
  }
  return !isOverRoadGap(playerX, gaps);
}

export function getMaxSingleJumpDistancePx(speedPxPerSec: number): number {
  const airTimeSec = (2 * Math.abs(GAME_CONFIG.PLAYER_JUMP_INITIAL)) / GAME_CONFIG.GRAVITY;
  return speedPxPerSec * airTimeSec;
}

export function getRoadChasmWidthBounds(speedPxPerSec: number): { min: number; max: number } {
  const singleReach = getMaxSingleJumpDistancePx(speedPxPerSec);
  const maxAllowed = Math.min(150, Math.max(108, Math.floor(singleReach - 82)));
  const minAllowed = Math.max(92, maxAllowed - 26);
  return { min: minAllowed, max: maxAllowed };
}

export type PatternId =
  | 'single_barrier'
  | 'double_barrier_rhythm'
  | 'tall_barrier'
  | 'drone_squad'
  | 'drone_swarms'
  | 'barrier_then_drone'
  | 'sky_staircase'
  | 'sky_rail_gauntlet'
  | 'sky_slalom'
  | 'jump_pad_skyline'
  | 'jump_pad_chasm_launch'
  | 'road_chasm'
  | 'double_chasm_bridge'
  | 'laser_bypass'
  | 'laser_drone_cross'
  | 'moving_laser_corridor'
  | 'coin_wave';

export function getEligiblePatterns(scoreMeters: number): PatternId[] {
  const base: PatternId[] = [
    'single_barrier',
    'double_barrier_rhythm',
    'tall_barrier',
    'drone_squad',
    'drone_swarms',
    'barrier_then_drone',
    'sky_staircase',
    'sky_rail_gauntlet',
    'sky_slalom',
    'coin_wave',
  ];

  if (scoreMeters >= 35) {
    base.push('road_chasm');
  }
  if (scoreMeters >= 50) {
    base.push('jump_pad_skyline');
  }
  if (scoreMeters >= 120) {
    base.push('double_chasm_bridge');
  }
  if (scoreMeters >= 140) {
    base.push('jump_pad_chasm_launch');
  }
  if (scoreMeters >= GAME_CONFIG.SECTOR_INTERVAL_METERS) {
    base.push('laser_bypass', 'laser_drone_cross', 'moving_laser_corridor');
  }

  return base;
}

export function isChasmPattern(patternId: PatternId): boolean {
  return (
    patternId === 'road_chasm' ||
    patternId === 'double_chasm_bridge' ||
    patternId === 'jump_pad_chasm_launch'
  );
}

export function pickNextPattern(
  scoreMeters: number,
  recentPatterns: PatternId[],
  rng: () => number = Math.random
): {
  patternId: PatternId;
  nextRecent: PatternId[];
  startsChain: boolean;
} {
  const eligible = getEligiblePatterns(scoreMeters);
  const blocked = new Set(recentPatterns.slice(-3));
  let candidates = eligible.filter((id) => !blocked.has(id));

  if (candidates.length === 0) {
    const lastId = recentPatterns[recentPatterns.length - 1];
    candidates = eligible.filter((id) => id !== lastId);
    if (candidates.length === 0) {
      candidates = eligible;
    }
  }

  const weightedPool: PatternId[] = [];
  for (let i = 0; i < candidates.length; i++) {
    const id = candidates[i];
    const weight = id === 'coin_wave' ? 1 : 2;
    for (let w = 0; w < weight; w++) {
      weightedPool.push(id);
    }
  }

  const pickIndex = Math.min(
    weightedPool.length - 1,
    Math.max(0, Math.floor(rng() * weightedPool.length))
  );
  const patternId = weightedPool[pickIndex];
  const nextRecent = [...recentPatterns, patternId].slice(-3);

  const chainChance = scoreMeters < 80 ? 0 : Math.min(0.48, 0.22 + (scoreMeters / 1200) * 0.26);
  const startsChain = !isChasmPattern(patternId) && rng() < chainChance;

  return {
    patternId,
    nextRecent,
    startsChain,
  };
}

export function getLocalDateKey(date: Date = new Date()): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

export function getPreviousDateKey(dateKey: string): string {
  const parts = dateKey.split('-').map((v) => parseInt(v, 10));
  if (parts.length !== 3 || parts.some((n) => !Number.isFinite(n))) return '';
  const dt = new Date(parts[0], parts[1] - 1, parts[2]);
  dt.setDate(dt.getDate() - 1);
  return getLocalDateKey(dt);
}

export function computeDailyClaimState(
  daily: DailyRewardState,
  todayKey: string = getLocalDateKey()
): {
  canClaim: boolean;
  nextStreak: number;
  rewardCredits: number;
} {
  if (daily.lastClaimDate === todayKey) {
    const currentStreak = Math.max(1, daily.streak);
    return {
      canClaim: false,
      nextStreak: currentStreak,
      rewardCredits: getDailyRewardCredits(currentStreak),
    };
  }
  const yesterdayKey = getPreviousDateKey(todayKey);
  const nextStreak = daily.lastClaimDate === yesterdayKey ? Math.max(1, daily.streak) + 1 : 1;
  return {
    canClaim: true,
    nextStreak,
    rewardCredits: getDailyRewardCredits(nextStreak),
  };
}

export function evaluateMilestoneSkins(
  progress: PlayerProgress,
  runScore: number = 0,
  runMode: RunMode = 'classic'
): SkinId[] {
  const newlyUnlocked: SkinId[] = [];
  const checkAndAdd = (id: SkinId, condition: boolean) => {
    if (condition && !progress.unlockedSkins.includes(id)) {
      newlyUnlocked.push(id);
    }
  };

  const bestClassicOrRun = Math.max(progress.highScore, runScore);
  const bestTurboOrRun = Math.max(
    progress.turboHighScore,
    runMode === 'turbo' ? runScore : 0
  );

  checkAndAdd('apex_chrome', bestClassicOrRun >= 1500);
  checkAndAdd('boss_slayer', progress.career.totalBosses >= 3);
  checkAndAdd('turbo_phantom', bestTurboOrRun >= 800);

  return newlyUnlocked;
}
