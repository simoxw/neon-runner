import { describe, expect, it } from 'vitest';
import { GAME_CONFIG, getBossVariantConfig, getJetpackMaxFuelMs } from '../constants';
import {
  advanceComboOnEvent,
  advanceLaserState,
  computeBossMaxHp,
  computeCreditReward,
  computeRefilledFuel,
  computeSectorIndex,
  computeSpeedForScore,
  getComboMultiplier,
  getEligiblePatterns,
  isChasmPattern,
  isOverRoadGap,
  LaserState,
  PatternId,
  pickBossAttackSpec,
  pickBossFixedLaneY,
  pickNextPattern,
  pickPowerupType,
  resetCombo,
  resolveDroneBulletHit,
  shouldCollideWithGround,
  shouldPauseSpawnsForBoss,
  stepRunDistance,
  tickComboDecay,
} from '../utils/gameRules';

describe('Gameplay Simulation & Anomaly Checks', () => {
  it('simulates a 90-second multi-sector run with zero NaN, monotonic score, and clamped speed', () => {
    let distance = 0;
    let score = 0;
    let speed = GAME_CONFIG.BASE_SPEED;
    let sector = 0;
    const seenSectors = new Set<number>([0]);

    // Simulate 90 seconds at variable frame deltas (16ms normal + occasional 50ms spike)
    for (let frame = 0; frame < 5400; frame++) {
      const deltaMs = frame % 120 === 0 ? 50 : 16.67;
      const overdriveActive = frame >= 2400 && frame < 2730;
      const step = stepRunDistance(distance, speed, overdriveActive, deltaMs);

      expect(Number.isFinite(step.nextDistance)).toBe(true);
      expect(step.nextDistance).toBeGreaterThan(distance);
      expect(step.nextScore).toBeGreaterThanOrEqual(score);

      distance = step.nextDistance;
      score = step.nextScore;
      speed = computeSpeedForScore(score);
      expect(speed).toBeLessThanOrEqual(GAME_CONFIG.MAX_SPEED);
      expect(speed).toBeGreaterThanOrEqual(GAME_CONFIG.BASE_SPEED);

      sector = computeSectorIndex(score);
      seenSectors.add(sector);
    }

    expect(score).toBeGreaterThan(1500);
    expect(seenSectors.has(1)).toBe(true); // >= 300m
    expect(seenSectors.has(2)).toBe(true); // >= 600m
    expect(seenSectors.has(3)).toBe(true); // >= 900m
  });

  it('cycles Intermittent Laser Gate cleanly between warning (non-lethal) and active (lethal) even across frame spikes', () => {
    let laser: LaserState = { phase: 'warning', elapsedMs: 0 };
    const phasesObserved = new Set<string>();

    // Step in 50ms increments over 3 full cycles
    for (let i = 0; i < 150; i++) {
      laser = advanceLaserState(laser, 50);
      phasesObserved.add(laser.phase);
      expect(laser.elapsedMs).toBeGreaterThanOrEqual(0);
      expect(laser.elapsedMs).toBeLessThan(GAME_CONFIG.LASER_WARN_MS + GAME_CONFIG.LASER_ACTIVE_MS);
    }

    expect(phasesObserved.has('warning')).toBe(true);
    expect(phasesObserved.has('active')).toBe(true);

    // Verify exact transition boundary
    const atBoundary = advanceLaserState({ phase: 'warning', elapsedMs: 0 }, GAME_CONFIG.LASER_WARN_MS);
    expect(atBoundary.phase).toBe('active');
  });

  it('requires 2 blaster hits for Armored Drones and cracks armor on hit 1', () => {
    const hit1 = resolveDroneBulletHit(2);
    expect(hit1.nextHp).toBe(1);
    expect(hit1.armorBroken).toBe(true);
    expect(hit1.destroyed).toBe(false);

    const hit2 = resolveDroneBulletHit(hit1.nextHp);
    expect(hit2.nextHp).toBe(0);
    expect(hit2.armorBroken).toBe(false);
    expect(hit2.destroyed).toBe(true);

    // Regular 1-HP drone dies in 1 hit without armorBroken
    const regularHit = resolveDroneBulletHit(1);
    expect(regularHit.destroyed).toBe(true);
    expect(regularHit.armorBroken).toBe(false);
  });

  it('tracks Combo Streak tiers (1x -> 2x -> 3x), decays cleanly on timeout, and multiplies rewards', () => {
    let combo = resetCombo();
    expect(getComboMultiplier(combo.count)).toBe(1);

    for (let i = 0; i < GAME_CONFIG.COMBO_TIER_2_THRESHOLD; i++) {
      combo = advanceComboOnEvent(combo, 1);
    }
    expect(combo.multiplier).toBe(2);

    for (let i = 0; i < GAME_CONFIG.COMBO_TIER_3_THRESHOLD - GAME_CONFIG.COMBO_TIER_2_THRESHOLD; i++) {
      combo = advanceComboOnEvent(combo, 1);
    }
    expect(combo.multiplier).toBe(3);

    // Reward scaling with Lv 2 creditMultiplier (1.5x) and 3x combo
    const reward = computeCreditReward(2, 2, combo.multiplier);
    expect(reward).toBe(9);

    // Partial decay preserves streak
    combo = tickComboDecay(combo, GAME_CONFIG.COMBO_DECAY_MS - 100);
    expect(combo.count).toBeGreaterThan(0);
    expect(combo.multiplier).toBe(3);

    // Full decay resets streak cleanly
    combo = tickComboDecay(combo, 200);
    expect(combo.count).toBe(0);
    expect(combo.multiplier).toBe(1);
  });

  it('clamps Boost Ring jetpack fuel refills to upgraded max capacity', () => {
    const maxLv0 = getJetpackMaxFuelMs(0);
    const maxLv4 = getJetpackMaxFuelMs(4);
    expect(computeRefilledFuel(120, maxLv0)).toBe(maxLv0);
    expect(computeRefilledFuel(maxLv4 + 500, maxLv4)).toBe(maxLv4);
  });

  it('keeps Overdrive charge pacing balanced around ~600m rather than triggering prematurely', () => {
    // Typical 100m has ~8-12 coins + ~1-2 drones -> ~11-16% per 100m -> ~600m to hit 100%
    const chargePer100mLowEstimate =
      8 * GAME_CONFIG.OVERDRIVE_CHARGE_PER_COIN + 1 * GAME_CONFIG.OVERDRIVE_CHARGE_PER_DRONE;
    expect(chargePer100mLowEstimate).toBeLessThanOrEqual(15);
    expect(chargePer100mLowEstimate).toBeGreaterThanOrEqual(8);
  });

  it('scales speed smoothly in Classic and Turbo modes and applies 1.5x Turbo credit bonus', () => {
    expect(computeSpeedForScore(0, 'classic')).toBe(320);
    expect(computeSpeedForScore(159, 'classic')).toBe(320);
    expect(computeSpeedForScore(160, 'classic')).toBe(345);
    expect(computeSpeedForScore(320, 'classic')).toBe(370);
    expect(computeSpeedForScore(640, 'classic')).toBe(420);
    expect(computeSpeedForScore(99999, 'classic')).toBe(GAME_CONFIG.MAX_SPEED);

    expect(computeSpeedForScore(0, 'turbo')).toBe(GAME_CONFIG.TURBO_BASE_SPEED);
    expect(computeSpeedForScore(GAME_CONFIG.DIFFICULTY_INTERVAL_METERS, 'turbo')).toBe(
      GAME_CONFIG.TURBO_BASE_SPEED + GAME_CONFIG.TURBO_SPEED_INCREMENT
    );
    expect(computeSpeedForScore(99999, 'turbo')).toBe(GAME_CONFIG.TURBO_MAX_SPEED);

    const classicReward = computeCreditReward(4, 0, 1, 'classic');
    const turboReward = computeCreditReward(4, 0, 1, 'turbo');
    expect(classicReward).toBe(4);
    expect(turboReward).toBe(6);
  });

  it('balances power-up drops at 70% Magnet and 30% Shield', () => {
    let seed = 42;
    const rng = () => {
      seed = (seed * 1664525 + 1013904223) % 4294967296;
      return seed / 4294967296;
    };

    let magnets = 0;
    const total = 1000;
    for (let i = 0; i < total; i++) {
      if (pickPowerupType(rng) === 'magnet') {
        magnets += 1;
      }
    }
    const ratio = magnets / total;
    expect(ratio).toBeGreaterThan(0.65);
    expect(ratio).toBeLessThan(0.75);
  });

  it('spawns Bosses every 800m looping across 4 variants with 4-phase fixed-lane attacks and -40m pre-Boss pause', () => {
    expect(GAME_CONFIG.BOSS_INTERVAL_METERS).toBe(800);
    expect(computeBossMaxHp(1)).toBe(7);
    expect(computeBossMaxHp(2)).toBe(11);
    expect(computeBossMaxHp(3)).toBe(15);
    expect(computeBossMaxHp(10)).toBe(22);

    expect(getBossVariantConfig(1).name).toBe('Sentinel Mk-I');
    expect(getBossVariantConfig(2).name).toBe('Crimson Viper');
    expect(getBossVariantConfig(3).name).toBe('Solar Titan');
    expect(getBossVariantConfig(4).name).toBe('Void Warden');
    expect(getBossVariantConfig(5).name).toBe('Sentinel Mk-I');

    const groundTop = 624;
    const safeTopY = 120;
    const lane0 = pickBossFixedLaneY(0, groundTop, safeTopY);
    const lane1 = pickBossFixedLaneY(1, groundTop, safeTopY);
    expect(lane0).toBe(groundTop - 36);
    expect(lane1).toBeLessThan(lane0 - 60);

    expect(pickBossAttackSpec(0, groundTop, safeTopY)).toEqual({ kind: 'missile', lane: 'low', laneY: lane0 });
    expect(pickBossAttackSpec(1, groundTop, safeTopY)).toEqual({ kind: 'drone', lane: 'high', laneY: lane1 });
    expect(pickBossAttackSpec(2, groundTop, safeTopY)).toEqual({ kind: 'missile', lane: 'high', laneY: lane1 });
    expect(pickBossAttackSpec(3, groundTop, safeTopY)).toEqual({ kind: 'drone', lane: 'low', laneY: lane0 });

    expect(shouldPauseSpawnsForBoss(750, 800, false)).toBe(false);
    expect(shouldPauseSpawnsForBoss(760, 800, false)).toBe(true);
    expect(shouldPauseSpawnsForBoss(810, 1600, true)).toBe(false);
  });

  it('disables ground collision cleanly over road chasms, blocks edge-snapping once fallen, and hovers in Overdrive', () => {
    const gaps = [{ leftX: 200, rightX: 340 }];
    const groundTop = 624;

    // Grace edge (within 10px lip) stays forgiving; middle of chasm disables ground collider
    expect(isOverRoadGap(205, gaps)).toBe(false);
    expect(isOverRoadGap(270, gaps)).toBe(true);
    expect(shouldCollideWithGround(270, groundTop - 30, groundTop, gaps, false)).toBe(false);

    // Solid ground outside chasm collides normally
    expect(shouldCollideWithGround(150, groundTop - 30, groundTop, gaps, false)).toBe(true);

    // Once player drops past groundTop - 16, trailing road lip cannot snap them back up
    expect(shouldCollideWithGround(345, groundTop - 10, groundTop, gaps, false)).toBe(false);

    // Hyper Overdrive hovers safely across chasms while above groundTop - 16
    expect(shouldCollideWithGround(270, groundTop - 30, groundTop, gaps, true)).toBe(true);
  });

  it('unlocks advanced obstacle patterns including Jump Pads and Moving Lasers progressively', () => {
    const startPool = getEligiblePatterns(0);
    expect(startPool).not.toContain('road_chasm');
    expect(startPool).not.toContain('jump_pad_skyline');
    expect(startPool).not.toContain('double_chasm_bridge');
    expect(startPool).not.toContain('laser_bypass');

    const at55m = getEligiblePatterns(55);
    expect(at55m).toContain('road_chasm');
    expect(at55m).toContain('jump_pad_skyline');
    expect(at55m).not.toContain('jump_pad_chasm_launch');

    const at145m = getEligiblePatterns(145);
    expect(at145m).toContain('double_chasm_bridge');
    expect(at145m).toContain('jump_pad_chasm_launch');
    expect(at145m).not.toContain('moving_laser_corridor');

    const atSector2 = getEligiblePatterns(GAME_CONFIG.SECTOR_INTERVAL_METERS);
    expect(atSector2).toContain('laser_bypass');
    expect(atSector2).toContain('laser_drone_cross');
    expect(atSector2).toContain('moving_laser_corridor');
  });

  it('prevents pattern repetition within the last 3 draws and never starts chains from chasms', () => {
    let seed = 1337;
    const deterministicRng = () => {
      seed = (seed * 1664525 + 1013904223) % 4294967296;
      return seed / 4294967296;
    };

    let recent: PatternId[] = [];
    let chainCount = 0;
    const observed = new Set<PatternId>();

    for (let i = 0; i < 240; i++) {
      const scoreMeters = 400 + i * 2;
      const pick = pickNextPattern(scoreMeters, recent, deterministicRng);

      expect(recent).not.toContain(pick.patternId);
      if (isChasmPattern(pick.patternId)) {
        expect(pick.startsChain).toBe(false);
      }
      if (pick.startsChain) {
        chainCount += 1;
      }

      observed.add(pick.patternId);
      recent = pick.nextRecent;
      expect(recent.length).toBeLessThanOrEqual(3);
    }

    expect(observed.size).toBe(17);
    expect(chainCount).toBeGreaterThan(20);
  });
});
