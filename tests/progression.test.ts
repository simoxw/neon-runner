import { beforeEach, describe, expect, it } from 'vitest';
import {
  GAME_CONFIG,
  getBlasterCooldownMs,
  getDailyRewardCredits,
  getEmpCooldownMs,
  getJetpackMaxFuelMs,
  getJetpackMaxRiseSpeed,
  getUpgradeCost,
  isDualPulseBlaster,
  SKINS_CATALOG,
  UPGRADES_CATALOG,
} from '../constants';
import { PlayerProgress } from '../types';
import {
  claimDailyReward,
  loadProgress,
  recordRunOutcome,
  refreshCompletedMissions,
  saveProgress,
  unlockAndEquipSkin,
  updateUpgradeLevel,
} from '../utils/storage';

function createMemoryStorage() {
  const store = new Map<string, string>();
  return {
    getItem: (key: string) => store.get(key) ?? null,
    setItem: (key: string, value: string) => {
      store.set(key, String(value));
    },
    removeItem: (key: string) => {
      store.delete(key);
    },
    clear: () => {
      store.clear();
    },
  };
}

describe('Progression, Workshop Upgrades, Daily Rewards, Career & Milestone Skins', () => {
  beforeEach(() => {
    (globalThis as unknown as { localStorage: ReturnType<typeof createMemoryStorage> }).localStorage =
      createMemoryStorage();
  });

  it('loads valid defaults including empWave, career, dailyReward, and 3 distinct missions', () => {
    const progress = loadProgress();
    expect(progress.highScore).toBe(0);
    expect(progress.turboHighScore).toBe(0);
    expect(progress.totalCredits).toBe(0);
    expect(progress.runMode).toBe('classic');
    expect(progress.equippedSkin).toBe('cyan');
    expect(progress.upgrades.jetpackThruster).toBe(0);
    expect(progress.upgrades.empWave).toBe(0);
    expect(progress.career.totalRuns).toBe(0);
    expect(progress.dailyReward.lastClaimDate).toBeNull();
    expect(progress.missions).toHaveLength(3);
    const types = new Set(progress.missions.map((m) => m.type));
    expect(types.size).toBe(3);
  });

  it('migrates legacy localStorage payloads missing empWave, turboHighScore, career, or dailyReward', () => {
    localStorage.setItem(
      'neon_runner_progress_v2',
      JSON.stringify({
        highScore: 845,
        totalCredits: 120,
        unlockedSkins: ['crimson'],
        equippedSkin: 'non_existent_skin',
        upgrades: {
          shieldDuration: 2,
          magnetDuration: 99, // anomalous out-of-range level
          blasterRate: -4, // anomalous negative level
          creditMultiplier: 1,
          // jetpackThruster and empWave intentionally missing
        },
        missions: [
          {
            id: 'legacy_fastfall',
            type: 'fastFalls',
            label: 'Execute 8 Fast-Falls',
            target: 8,
            progress: 3,
            reward: 30,
            completed: false,
          },
        ],
        missionSeed: 5,
      })
    );

    const loaded = loadProgress();
    expect(loaded.highScore).toBe(845);
    expect(loaded.turboHighScore).toBe(0);
    expect(loaded.totalCredits).toBe(120);
    expect(loaded.runMode).toBe('classic');
    expect(loaded.unlockedSkins).toContain('cyan');
    expect(loaded.unlockedSkins).toContain('crimson');
    expect(loaded.equippedSkin).toBe('cyan'); // falls back cleanly if invalid
    expect(loaded.upgrades.magnetDuration).toBe(5); // clamped to max 5
    expect(loaded.upgrades.blasterRate).toBe(0); // clamped to min 0
    expect(loaded.upgrades.jetpackThruster).toBe(0); // migrated safely
    expect(loaded.upgrades.empWave).toBe(0); // migrated safely
    expect(loaded.career.totalBosses).toBe(0);
    expect(loaded.dailyReward.streak).toBe(0);
    expect(loaded.missions).toHaveLength(3);
    expect(loaded.missions.every((m) => (m.type as string) !== 'fastFalls')).toBe(true);
    expect(loaded.missions.some((m) => /Corri|Distruggi|Raccogli|Esegui|Atterra|Attiva/.test(m.label))).toBe(true);
  });

  it('enforces upgrade purchase credits, EMP Wave cooldown scaling, and Dual Pulse at Lv 3', () => {
    let progress = loadProgress();
    progress.totalCredits = 500;
    saveProgress(progress);

    const jetpackCfg = UPGRADES_CATALOG.find((u) => u.id === 'jetpackThruster')!;
    const costLv0 = getUpgradeCost(jetpackCfg, 0);
    const afterBuy = updateUpgradeLevel(progress, 'jetpackThruster', costLv0);
    expect(afterBuy).not.toBeNull();
    progress = afterBuy!;
    expect(progress.upgrades.jetpackThruster).toBe(1);
    expect(progress.totalCredits).toBe(500 - costLv0);
    expect(getJetpackMaxFuelMs(1)).toBeGreaterThan(getJetpackMaxFuelMs(0));
    expect(getJetpackMaxRiseSpeed(1)).toBeLessThan(getJetpackMaxRiseSpeed(0)); // stronger upward negative velocity

    const empCfg = UPGRADES_CATALOG.find((u) => u.id === 'empWave')!;
    const empCostLv0 = getUpgradeCost(empCfg, 0);
    const afterEmp = updateUpgradeLevel(progress, 'empWave', empCostLv0);
    expect(afterEmp).not.toBeNull();
    progress = afterEmp!;
    expect(progress.upgrades.empWave).toBe(1);
    expect(getEmpCooldownMs(0)).toBe(0);
    expect(getEmpCooldownMs(1)).toBe(GAME_CONFIG.EMP_BASE_COOLDOWN_MS);
    expect(getEmpCooldownMs(5)).toBeLessThan(getEmpCooldownMs(1));

    // Cannot purchase if insufficient credits
    const poorAttempt = updateUpgradeLevel({ ...progress, totalCredits: 5 }, 'blasterRate', 30);
    expect(poorAttempt).toBeNull();

    // Dual Pulse unlocks at Lv 3+
    expect(isDualPulseBlaster(2)).toBe(false);
    expect(isDualPulseBlaster(GAME_CONFIG.DUAL_PULSE_MIN_LEVEL)).toBe(true);
    expect(getBlasterCooldownMs(5)).toBeGreaterThanOrEqual(320);
  });

  it('unlocks and equips credit skins without double-charging and blocks credit purchase of locked milestone skins', () => {
    let progress: PlayerProgress = { ...loadProgress(), totalCredits: 200 };
    const solar = SKINS_CATALOG.find((s) => s.id === 'solar')!;
    const unlocked = unlockAndEquipSkin(progress, 'solar', solar.cost);
    expect(unlocked).not.toBeNull();
    progress = unlocked!;
    expect(progress.equippedSkin).toBe('solar');
    expect(progress.totalCredits).toBe(200 - solar.cost);

    // Locked milestone skins cannot be bypassed via credit purchase
    const blockedMilestone = unlockAndEquipSkin(progress, 'apex_chrome', 0, true);
    expect(blockedMilestone).toBeNull();

    // Re-equipping cyan (already unlocked) costs 0 credits
    const reEquipped = unlockAndEquipSkin(progress, 'cyan', 0);
    expect(reEquipped).not.toBeNull();
    expect(reEquipped!.equippedSkin).toBe('cyan');
    expect(reEquipped!.totalCredits).toBe(200 - solar.cost);
  });

  it('handles Daily Reward streaks, consecutive claims, same-day blocking, and missed-day resets', () => {
    const start = loadProgress();

    // Day 1 claim
    const claim1 = claimDailyReward(start, '2026-11-10');
    expect(claim1).not.toBeNull();
    expect(claim1!.newStreak).toBe(1);
    expect(claim1!.rewardCredits).toBe(getDailyRewardCredits(1));
    expect(claim1!.nextProgress.totalCredits).toBe(25);

    // Same-day repeat claim blocked
    const repeatSameDay = claimDailyReward(claim1!.nextProgress, '2026-11-10');
    expect(repeatSameDay).toBeNull();

    // Consecutive day increments streak to Day 2 (+35)
    const claim2 = claimDailyReward(claim1!.nextProgress, '2026-11-11');
    expect(claim2).not.toBeNull();
    expect(claim2!.newStreak).toBe(2);
    expect(claim2!.rewardCredits).toBe(getDailyRewardCredits(2));
    expect(claim2!.nextProgress.totalCredits).toBe(60);

    // Skipping a day resets streak cleanly back to Day 1
    const afterGap = claimDailyReward(claim2!.nextProgress, '2026-11-14');
    expect(afterGap).not.toBeNull();
    expect(afterGap!.newStreak).toBe(1);
  });

  it('records run outcomes, separates Classic/Turbo records, accumulates Career stats, and unlocks Milestone Skins', () => {
    let progress = loadProgress();

    const classicRun = recordRunOutcome(progress, {
      score: 1550,
      runMode: 'classic',
      earnedCredits: 95,
      dronesDestroyed: 14,
      bossesDefeated: 2,
      maxCombo: 18,
    });
    expect(classicRun.beatRecord).toBe(true);
    expect(classicRun.newlyUnlockedSkins).toContain('apex_chrome');
    expect(classicRun.newlyUnlockedSkins).not.toContain('boss_slayer');
    expect(classicRun.nextProgress.highScore).toBe(1550);
    expect(classicRun.nextProgress.turboHighScore).toBe(0);
    expect(classicRun.nextProgress.career.totalRuns).toBe(1);
    expect(classicRun.nextProgress.career.totalBosses).toBe(2);

    progress = classicRun.nextProgress;

    const turboRun = recordRunOutcome(progress, {
      score: 820,
      runMode: 'turbo',
      earnedCredits: 110,
      dronesDestroyed: 9,
      bossesDefeated: 1,
      maxCombo: 22,
    });
    expect(turboRun.beatRecord).toBe(true);
    expect(turboRun.newlyUnlockedSkins).toContain('boss_slayer');
    expect(turboRun.newlyUnlockedSkins).toContain('turbo_phantom');
    expect(turboRun.nextProgress.highScore).toBe(1550);
    expect(turboRun.nextProgress.turboHighScore).toBe(820);
    expect(turboRun.nextProgress.career.totalRuns).toBe(2);
    expect(turboRun.nextProgress.career.totalDistance).toBe(2370);
    expect(turboRun.nextProgress.career.totalDrones).toBe(23);
    expect(turboRun.nextProgress.career.totalBosses).toBe(3);
    expect(turboRun.nextProgress.career.bestCombo).toBe(22);
  });

  it('rotates completed missions on next run while preserving unfinished ones', () => {
    const progress = loadProgress();
    progress.missions[0] = { ...progress.missions[0], completed: true, progress: progress.missions[0].target };
    const firstId = progress.missions[0].id;
    const secondId = progress.missions[1].id;

    const rotated = refreshCompletedMissions(progress);
    expect(rotated.missions[0].id).not.toBe(firstId);
    expect(rotated.missions[0].completed).toBe(false);
    expect(rotated.missions[1].id).toBe(secondId);
  });
});
