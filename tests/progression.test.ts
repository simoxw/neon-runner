import { beforeEach, describe, expect, it } from 'vitest';
import {
  GAME_CONFIG,
  getBlasterCooldownMs,
  getJetpackMaxFuelMs,
  getJetpackMaxRiseSpeed,
  getUpgradeCost,
  isDualPulseBlaster,
  SKINS_CATALOG,
  UPGRADES_CATALOG,
} from '../constants';
import { PlayerProgress } from '../types';
import {
  loadProgress,
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

describe('Progression, Workshop Upgrades & Storage Migration', () => {
  beforeEach(() => {
    (globalThis as unknown as { localStorage: ReturnType<typeof createMemoryStorage> }).localStorage =
      createMemoryStorage();
  });

  it('loads valid defaults including jetpackThruster and 3 distinct missions', () => {
    const progress = loadProgress();
    expect(progress.highScore).toBe(0);
    expect(progress.totalCredits).toBe(0);
    expect(progress.equippedSkin).toBe('cyan');
    expect(progress.upgrades.jetpackThruster).toBe(0);
    expect(progress.missions).toHaveLength(3);
    const types = new Set(progress.missions.map((m) => m.type));
    expect(types.size).toBe(3);
  });

  it('migrates legacy localStorage payloads missing jetpackThruster or containing deprecated fastFalls missions', () => {
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
          // jetpackThruster intentionally missing
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
    expect(loaded.totalCredits).toBe(120);
    expect(loaded.unlockedSkins).toContain('cyan');
    expect(loaded.unlockedSkins).toContain('crimson');
    expect(loaded.equippedSkin).toBe('cyan'); // falls back cleanly if invalid
    expect(loaded.upgrades.magnetDuration).toBe(5); // clamped to max 5
    expect(loaded.upgrades.blasterRate).toBe(0); // clamped to min 0
    expect(loaded.upgrades.jetpackThruster).toBe(0); // migrated safely
    expect(loaded.missions).toHaveLength(3);
    expect(loaded.missions.every((m) => (m.type as string) !== 'fastFalls')).toBe(true);
    expect(loaded.missions.some((m) => /Corri|Distruggi|Raccogli|Esegui|Atterra|Attiva/.test(m.label))).toBe(true);
  });

  it('enforces upgrade purchase credits, caps at max level, and unlocks Dual Pulse at Lv 3', () => {
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

    // Cannot purchase if insufficient credits
    const poorAttempt = updateUpgradeLevel({ ...progress, totalCredits: 5 }, 'blasterRate', 30);
    expect(poorAttempt).toBeNull();

    // Dual Pulse unlocks at Lv 3+
    expect(isDualPulseBlaster(2)).toBe(false);
    expect(isDualPulseBlaster(GAME_CONFIG.DUAL_PULSE_MIN_LEVEL)).toBe(true);
    expect(getBlasterCooldownMs(5)).toBeGreaterThanOrEqual(320);
  });

  it('unlocks and equips skins without double-charging on subsequent equips', () => {
    let progress: PlayerProgress = { ...loadProgress(), totalCredits: 200 };
    const solar = SKINS_CATALOG.find((s) => s.id === 'solar')!;
    const unlocked = unlockAndEquipSkin(progress, 'solar', solar.cost);
    expect(unlocked).not.toBeNull();
    progress = unlocked!;
    expect(progress.equippedSkin).toBe('solar');
    expect(progress.totalCredits).toBe(200 - solar.cost);

    // Re-equipping cyan (already unlocked) costs 0 credits
    const reEquipped = unlockAndEquipSkin(progress, 'cyan', 0);
    expect(reEquipped).not.toBeNull();
    expect(reEquipped!.equippedSkin).toBe('cyan');
    expect(reEquipped!.totalCredits).toBe(200 - solar.cost);
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
