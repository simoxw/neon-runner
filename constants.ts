import { ActiveMission, MissionType, SkinId, UpgradeId } from './types';

export const GAME_CONFIG = {
  GRAVITY: 1550,
  PLAYER_JUMP_INITIAL: -475,
  PLAYER_JUMP_HOLD_ACCEL: -1450,
  DOUBLE_JUMP_VELOCITY: -510,
  JUMP_PAD_VELOCITY: -735,
  JETPACK_MAX_FUEL_MS: 950,
  JETPACK_FUEL_PER_LEVEL_MS: 200,
  JETPACK_THRUST_ACCEL: -1950,
  JETPACK_MAX_RISE_SPEED: -190,
  JETPACK_RISE_PER_LEVEL: 22,
  MAX_JUMP_HOLD_MS: 240,
  PLAYER_JUMP_CUT_MULTIPLIER: 0.52,
  COYOTE_TIME_MS: 95,
  JUMP_BUFFER_MS: 110,
  GLIDE_MAX_FALL_SPEED: 135,
  BASE_SPEED: 320,
  MAX_SPEED: 860,
  SPEED_INCREMENT: 25,
  TURBO_BASE_SPEED: 560,
  TURBO_MAX_SPEED: 980,
  TURBO_SPEED_INCREMENT: 24,
  TURBO_CREDIT_MULTIPLIER: 1.5,
  DIFFICULTY_INTERVAL_METERS: 160,
  GROUND_HEIGHT: 96,
  GROUND_HEIGHT_COMPACT: 72,
  POOL_SIZE: 16,
  POWERUP_INTERVAL_METERS: 180,
  MAGNET_DROP_PROBABILITY: 0.7,
  OVERDRIVE_DURATION_MS: 5500,
  OVERDRIVE_SPEED_BONUS: 240,
  OVERDRIVE_CHARGE_PER_COIN: 1,
  OVERDRIVE_CHARGE_PER_DRONE: 3,
  OVERDRIVE_CHARGE_PER_ARMORED_DRONE: 5,
  OVERDRIVE_CHARGE_PER_RING: 4,
  MISSILE_SPEED_MULTIPLIER: 1.2,
  SECTOR_INTERVAL_METERS: 300,
  BOSS_INTERVAL_METERS: 800,
  LASER_WARN_MS: 950,
  LASER_ACTIVE_MS: 1150,
  COMBO_DECAY_MS: 2800,
  COMBO_TIER_2_THRESHOLD: 6,
  COMBO_TIER_3_THRESHOLD: 14,
  DUAL_PULSE_MIN_LEVEL: 3,
  EMP_BASE_COOLDOWN_MS: 22000,
  EMP_COOLDOWN_STEP_MS: 2400,
};

export interface BossVariantConfig {
  id: string;
  name: string;
  tint: number;
  attackIntervalMs: number;
}

export const BOSS_VARIANTS: BossVariantConfig[] = [
  {
    id: 'sentinel',
    name: 'Sentinel Mk-I',
    tint: 0xffffff,
    attackIntervalMs: 2200,
  },
  {
    id: 'viper',
    name: 'Crimson Viper',
    tint: 0xff6b8b,
    attackIntervalMs: 2000,
  },
  {
    id: 'titan',
    name: 'Solar Titan',
    tint: 0xffc857,
    attackIntervalMs: 1850,
  },
  {
    id: 'warden',
    name: 'Void Warden',
    tint: 0xc084fc,
    attackIntervalMs: 1700,
  },
];

export function getBossVariantConfig(encounterIndex: number): BossVariantConfig {
  const safeIdx = Math.max(1, Math.floor(encounterIndex)) - 1;
  return BOSS_VARIANTS[safeIdx % BOSS_VARIANTS.length];
}

export const DAILY_REWARD_SCHEDULE = [25, 35, 50, 65, 80, 100, 120];

export function getDailyRewardCredits(streak: number): number {
  const safeStreak = Math.max(1, Math.floor(streak));
  const idx = Math.min(DAILY_REWARD_SCHEDULE.length - 1, safeStreak - 1);
  return DAILY_REWARD_SCHEDULE[idx];
}

export function getGroundHeight(viewportHeight: number): number {
  return viewportHeight < 480 ? GAME_CONFIG.GROUND_HEIGHT_COMPACT : GAME_CONFIG.GROUND_HEIGHT;
}

export interface SectorTheme {
  name: string;
  skyTint: number;
  cityFarTint: number;
  cityNearTint: number;
  groundTint: number;
}

export const SECTORS_PALETTE: SectorTheme[] = [
  {
    name: 'Cyber Cyan',
    skyTint: 0xffffff,
    cityFarTint: 0xffffff,
    cityNearTint: 0xffffff,
    groundTint: 0xffffff,
  },
  {
    name: 'Crimson Grid',
    skyTint: 0xffa8c2,
    cityFarTint: 0xff6b8b,
    cityNearTint: 0xff4d79,
    groundTint: 0xff6b9d,
  },
  {
    name: 'Solar Amber',
    skyTint: 0xffe2a8,
    cityFarTint: 0xffb347,
    cityNearTint: 0xffa22b,
    groundTint: 0xffc857,
  },
  {
    name: 'Ultraviolet Core',
    skyTint: 0xd8b8ff,
    cityFarTint: 0xb975ff,
    cityNearTint: 0x9f5cff,
    groundTint: 0xc084fc,
  },
];

export interface SkinConfig {
  id: SkinId;
  name: string;
  cost: number;
  unlockType: 'free' | 'credits' | 'milestone';
  milestoneLabel?: string;
  primaryHex: string;
  accentHex: string;
  bodyTint: number;
  trailTint: number;
  bulletTint: number;
}

export const SKINS_CATALOG: SkinConfig[] = [
  {
    id: 'cyan',
    name: 'Cyber Cyan',
    cost: 0,
    unlockType: 'free',
    primaryHex: '#00f3ff',
    accentHex: '#ff2a6d',
    bodyTint: 0xffffff,
    trailTint: 0x00f3ff,
    bulletTint: 0xffffff,
  },
  {
    id: 'crimson',
    name: 'Crimson Striker',
    cost: 60,
    unlockType: 'credits',
    primaryHex: '#ff2a6d',
    accentHex: '#ffc857',
    bodyTint: 0xff7096,
    trailTint: 0xff2a6d,
    bulletTint: 0xff5c8a,
  },
  {
    id: 'solar',
    name: 'Solar Gold',
    cost: 110,
    unlockType: 'credits',
    primaryHex: '#ffc857',
    accentHex: '#ffffff',
    bodyTint: 0xffe082,
    trailTint: 0xffc857,
    bulletTint: 0xffe066,
  },
  {
    id: 'emerald',
    name: 'Toxic Emerald',
    cost: 160,
    unlockType: 'credits',
    primaryHex: '#00ff9d',
    accentHex: '#00f3ff',
    bodyTint: 0x80ffcb,
    trailTint: 0x00ff9d,
    bulletTint: 0x6bffc6,
  },
  {
    id: 'violet',
    name: 'Phantom Violet',
    cost: 220,
    unlockType: 'credits',
    primaryHex: '#c084fc',
    accentHex: '#f472b6',
    bodyTint: 0xd8b4fe,
    trailTint: 0xc084fc,
    bulletTint: 0xe879f9,
  },
  {
    id: 'apex_chrome',
    name: 'Apex Chrome',
    cost: 0,
    unlockType: 'milestone',
    milestoneLabel: 'Raggiungi 1.500m in una corsa',
    primaryHex: '#f8fafc',
    accentHex: '#00f3ff',
    bodyTint: 0xe2e8f0,
    trailTint: 0x7dd3fc,
    bulletTint: 0xe0f2fe,
  },
  {
    id: 'boss_slayer',
    name: 'Boss Slayer',
    cost: 0,
    unlockType: 'milestone',
    milestoneLabel: 'Abbatti 3 Boss Drone in carriera',
    primaryHex: '#ff5e3a',
    accentHex: '#ffc857',
    bodyTint: 0xff9e7d,
    trailTint: 0xff5e3a,
    bulletTint: 0xffb347,
  },
  {
    id: 'turbo_phantom',
    name: 'Turbo Phantom',
    cost: 0,
    unlockType: 'milestone',
    milestoneLabel: 'Raggiungi 800m in Corsa Turbo',
    primaryHex: '#38bdf8',
    accentHex: '#f43f5e',
    bodyTint: 0x7dd3fc,
    trailTint: 0xf43f5e,
    bulletTint: 0x38bdf8,
  },
];

export function getSkinConfig(id: SkinId): SkinConfig {
  return SKINS_CATALOG.find((s) => s.id === id) || SKINS_CATALOG[0];
}

interface MissionTemplate {
  type: MissionType;
  targets: number[];
  rewards: number[];
  formatLabel: (target: number) => string;
}

const MISSION_TEMPLATES: MissionTemplate[] = [
  {
    type: 'distance',
    targets: [600, 1000, 1600, 2400],
    rewards: [30, 40, 55, 70],
    formatLabel: (target) => `Corri per ${target}m totali`,
  },
  {
    type: 'drones',
    targets: [8, 14, 22, 30],
    rewards: [30, 45, 60, 75],
    formatLabel: (target) => `Distruggi ${target} Droni Cyber`,
  },
  {
    type: 'credits',
    targets: [50, 85, 130, 180],
    rewards: [25, 35, 50, 65],
    formatLabel: (target) => `Raccogli ${target} Crediti`,
  },
  {
    type: 'doubleJumps',
    targets: [10, 18, 28, 40],
    rewards: [25, 35, 45, 60],
    formatLabel: (target) => `Esegui ${target} Doppi Salti`,
  },
  {
    type: 'platforms',
    targets: [6, 12, 20, 30],
    rewards: [25, 35, 50, 65],
    formatLabel: (target) => `Atterra su ${target} Piattaforme Aeree`,
  },
  {
    type: 'overdrive',
    targets: [1, 2, 3, 4],
    rewards: [35, 55, 75, 95],
    formatLabel: (target) =>
      target === 1 ? 'Attiva Hyper Overdrive 1 volta' : `Attiva Hyper Overdrive ${target} volte`,
  },
];

export function formatMissionLabel(type: MissionType, target: number): string {
  const template = MISSION_TEMPLATES.find((t) => t.type === type);
  return template ? template.formatLabel(target) : `${target}`;
}

export function createMissionFromSeed(
  seed: number,
  excludedTypes: MissionType[] = []
): ActiveMission {
  const candidates = MISSION_TEMPLATES.filter((t) => !excludedTypes.includes(t.type));
  const pool = candidates.length > 0 ? candidates : MISSION_TEMPLATES;
  const template = pool[Math.abs(seed) % pool.length];
  const tier = Math.min(template.targets.length - 1, Math.floor(Math.abs(seed) / 6));
  const target = template.targets[tier];
  const reward = template.rewards[tier];

  return {
    id: `m_${seed}_${template.type}`,
    type: template.type,
    label: template.formatLabel(target),
    target,
    progress: 0,
    reward,
    completed: false,
  };
}

export interface UpgradeConfig {
  id: UpgradeId;
  name: string;
  description: string;
  maxLevel: number;
  baseCost: number;
  costStep: number;
  unit: string;
  formatValue: (level: number) => string;
}

export const UPGRADES_CATALOG: UpgradeConfig[] = [
  {
    id: 'shieldDuration',
    name: 'Scudo Energetico',
    description: 'Prolunga la durata della barriera protettiva attiva.',
    maxLevel: 5,
    baseCost: 25,
    costStep: 25,
    unit: 's',
    formatValue: (lvl: number) => `${(6 + lvl * 2).toFixed(0)}s`,
  },
  {
    id: 'magnetDuration',
    name: 'Magnete Crediti',
    description: 'Aumenta durata e raggio di attrazione dei crediti.',
    maxLevel: 5,
    baseCost: 25,
    costStep: 25,
    unit: 's',
    formatValue: (lvl: number) => `${(7 + lvl * 2).toFixed(0)}s · ${190 + lvl * 35}px`,
  },
  {
    id: 'blasterRate',
    name: 'Pulse Blaster',
    description: 'Aumenta la cadenza di fuoco; sblocca Doppio Raggio al Lv 3+.',
    maxLevel: 5,
    baseCost: 30,
    costStep: 30,
    unit: 'ms',
    formatValue: (lvl: number) =>
      lvl >= GAME_CONFIG.DUAL_PULSE_MIN_LEVEL
        ? `${getBlasterCooldownMs(lvl)}ms · Doppio`
        : `${getBlasterCooldownMs(lvl)}ms`,
  },
  {
    id: 'jetpackThruster',
    name: 'Propulsore Jetpack',
    description: 'Aumenta la capacità del serbatoio e la spinta in volo.',
    maxLevel: 5,
    baseCost: 30,
    costStep: 30,
    unit: 'ms',
    formatValue: (lvl: number) =>
      `${(getJetpackMaxFuelMs(lvl) / 1000).toFixed(2)}s`,
  },
  {
    id: 'empWave',
    name: 'Onda EMP',
    description: 'Gadget attivo (E / HUD): spazza droni, missili, danneggia Boss e blocca i laser.',
    maxLevel: 5,
    baseCost: 45,
    costStep: 35,
    unit: 's',
    formatValue: (lvl: number) =>
      lvl <= 0 ? 'Bloccata' : `${(getEmpCooldownMs(lvl) / 1000).toFixed(1)}s rec.`,
  },
  {
    id: 'creditMultiplier',
    name: 'Moltiplicatore Crediti',
    description: 'Bonus sui crediti raccolti, sui droni e sui Boss abbattuti.',
    maxLevel: 5,
    baseCost: 40,
    costStep: 35,
    unit: 'x',
    formatValue: (lvl: number) => `${(1 + lvl * 0.25).toFixed(2)}x`,
  },
];

export function getUpgradeCost(config: UpgradeConfig, currentLevel: number): number {
  return config.baseCost + currentLevel * config.costStep;
}

export function getShieldDurationMs(level: number): number {
  return (6 + level * 2) * 1000;
}

export function getMagnetDurationMs(level: number): number {
  return (7 + level * 2) * 1000;
}

export function getMagnetRadiusPx(level: number): number {
  return 190 + level * 35;
}

export function getBlasterCooldownMs(level: number): number {
  return Math.max(320, 720 - level * 75);
}

export function isDualPulseBlaster(level: number): boolean {
  return level >= GAME_CONFIG.DUAL_PULSE_MIN_LEVEL;
}

export function getJetpackMaxFuelMs(level: number): number {
  const clamped = Math.max(0, Math.min(5, level));
  return GAME_CONFIG.JETPACK_MAX_FUEL_MS + clamped * GAME_CONFIG.JETPACK_FUEL_PER_LEVEL_MS;
}

export function getJetpackMaxRiseSpeed(level: number): number {
  const clamped = Math.max(0, Math.min(5, level));
  return GAME_CONFIG.JETPACK_MAX_RISE_SPEED - clamped * GAME_CONFIG.JETPACK_RISE_PER_LEVEL;
}

export function getEmpCooldownMs(level: number): number {
  if (level <= 0) return 0;
  const clamped = Math.max(1, Math.min(5, level));
  return Math.max(11000, GAME_CONFIG.EMP_BASE_COOLDOWN_MS - (clamped - 1) * GAME_CONFIG.EMP_COOLDOWN_STEP_MS);
}

export function getCreditMultiplier(level: number): number {
  return 1 + level * 0.25;
}
