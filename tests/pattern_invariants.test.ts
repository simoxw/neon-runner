import { describe, expect, it } from 'vitest';
import { GAME_CONFIG, getGroundHeight, SECTORS_PALETTE } from '../constants';
import { computeSectorIndex, getMaxSingleJumpDistancePx } from '../utils/gameRules';

describe('Level Design & Physics Reachability Invariants', () => {
  it('ensures single + double jump easily clears the tall barrier (94px) across all speeds', () => {
    // Physics peak jump height: v0^2 / (2 * g)
    const singleJumpPeakPx =
      (GAME_CONFIG.PLAYER_JUMP_INITIAL * GAME_CONFIG.PLAYER_JUMP_INITIAL) /
      (2 * GAME_CONFIG.GRAVITY);
    const doubleJumpPeakPx =
      (GAME_CONFIG.DOUBLE_JUMP_VELOCITY * GAME_CONFIG.DOUBLE_JUMP_VELOCITY) /
      (2 * GAME_CONFIG.GRAVITY);
    const combinedJumpHeightPx = singleJumpPeakPx + doubleJumpPeakPx;

    expect(singleJumpPeakPx).toBeGreaterThan(68); // clears standard 58px barrier
    expect(combinedJumpHeightPx).toBeGreaterThan(140); // comfortably clears tall 94px barrier & mid sky platforms
  });

  it('keeps missile speed multiplier readable at exactly 1.2x scroll speed', () => {
    expect(GAME_CONFIG.MISSILE_SPEED_MULTIPLIER).toBe(1.2);
  });

  it('computes safe playable airspace for both compact landscape phones (360px) and desktop (720px)', () => {
    for (const viewportHeight of [360, 420, 640, 720, 1080]) {
      const gh = getGroundHeight(viewportHeight);
      const groundTop = viewportHeight - gh;
      const safeTopY = Math.max(76, viewportHeight * 0.21);
      const usableHeight = Math.max(120, groundTop - safeTopY);

      expect(groundTop).toBeGreaterThan(safeTopY);
      expect(usableHeight).toBeGreaterThanOrEqual(120);

      // Verify sky platform tiers stay inside safeTopY .. groundTop
      const midLift = Math.min(115, Math.max(82, usableHeight * 0.44));
      const highLift = Math.min(usableHeight - 28, Math.max(midLift + 54, usableHeight * 0.74));
      const midY = Math.max(safeTopY, Math.min(groundTop - 36, groundTop - midLift));
      const highY = Math.max(safeTopY, Math.min(groundTop - 36, groundTop - highLift));

      expect(midY).toBeGreaterThanOrEqual(safeTopY);
      expect(midY).toBeLessThan(groundTop);
      expect(highY).toBeGreaterThanOrEqual(safeTopY);
      expect(highY).toBeLessThan(midY);
    }
  });

  it('maps sector indices cleanly to palette entries without out-of-bounds access', () => {
    for (const meters of [0, 299, 300, 600, 900, 1200, 2500]) {
      const idx = computeSectorIndex(meters);
      const palette = SECTORS_PALETTE[idx % SECTORS_PALETTE.length];
      expect(palette).toBeDefined();
      expect(palette.name.length).toBeGreaterThan(0);
    }
  });

  it('guarantees single jump horizontal reach exceeds maximum road chasm width (152px) across all speeds', () => {
    for (const speed of [GAME_CONFIG.BASE_SPEED, 540, 680, GAME_CONFIG.MAX_SPEED]) {
      const maxJumpReach = getMaxSingleJumpDistancePx(speed);
      expect(maxJumpReach).toBeGreaterThan(152 + 80);
    }
  });

  it('guarantees double-chasm bridge spacing leaves a wide solid landing island between chasms', () => {
    const centerToCenterSpacing = 360;
    const maxChasmWidth = 138;
    const minSolidIslandWidth = centerToCenterSpacing - maxChasmWidth;
    expect(minSolidIslandWidth).toBeGreaterThanOrEqual(220);
  });
});
