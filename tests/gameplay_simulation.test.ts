import { describe, expect, it } from 'vitest';
import { GAME_CONFIG, getJetpackMaxFuelMs } from '../constants';
import {
  advanceComboOnEvent,
  advanceLaserState,
  computeCreditReward,
  computeRefilledFuel,
  computeSectorIndex,
  computeSpeedForScore,
  getComboMultiplier,
  LaserState,
  resetCombo,
  resolveDroneBulletHit,
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

  it('keeps Overdrive charge pacing balanced around ~500m rather than triggering prematurely', () => {
    // Typical 100m has ~12 coins + ~2 drones -> 12*2 + 2*6 = 36% per ~180m -> ~500m to hit 100%
    const chargePer100mLowEstimate = 8 * GAME_CONFIG.OVERDRIVE_CHARGE_PER_COIN + 1 * GAME_CONFIG.OVERDRIVE_CHARGE_PER_DRONE;
    expect(chargePer100mLowEstimate).toBeLessThanOrEqual(25);
  });
});
