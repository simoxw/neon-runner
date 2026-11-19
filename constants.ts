import { ActiveMission, MissionType, SkinId, UpgradeId } from './types';

export const GAME_CONFIG = {
  GRAVITY: 1550,
  PLAYER_JUMP_INITIAL: -460,
  PLAYER_JUMP_HOLD_ACCEL: -1450,
  DOUBLE_JUMP_VELOCITY: -490,
  FAST_FALL_VELOCITY: 860,
  MAX_JUMP_HOLD_MS: 240,
  PLAYER_JUMP_CUT_MULTIPLIER: 0.52,
  COYOTE_TIME_MS: 95,
  JUMP_BUFFER_MS: 110,
  GLIDE_MAX_FALL_SPEED: 125,
  BASE_SPEED: 420,
  MAX_SPEED: 940,
  SPEED_INCREMENT: 24,
  DIFFICULTY_INTERVAL_METERS: 120,
  GROUND_HEIGHT: 96,
  GROUND_HEIGHT_COMPACT: 72,
  POOL_SIZE: 16,
  POWERUP_INTERVAL_METERS: 180,
  OVERDRIVE_DURATION_MS: 5500,
  OVERDRIVE_SPEED_BONUS: 240,
  OVERDRIVE_CHARGE_PER_COIN: 2,
  OVERDRIVE_CHARGE_PER_DRONE: 6,
  MISSILE_SPEED_MULTIPLIER: 1.2,
  SECTOR_INTERVAL_METERS: 300,
};

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
    primaryHex: '#c084fc',
    accentHex: '#f472b6',
    bodyTint: 0xd8b4fe,
    trailTint: 0xc084fc,
    bulletTint: 0xe879f9,
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
    formatLabel: (target) => `Sprint ${target}m total`,
  },
  {
    type: 'drones',
    targets: [8, 14, 22, 30],
    rewards: [30, 45, 60, 75],
    formatLabel: (target) => `Destroy ${target} Cyber Drones`,
  },
  {
    type: 'credits',
    targets: [50, 85, 130, 180],
    rewards: [25, 35, 50, 65],
    formatLabel: (target) => `Collect ${target} Credits`,
  },
  {
    type: 'doubleJumps',
    targets: [10, 18, 28, 40],
    rewards: [25, 35, 45, 60],
    formatLabel: (target) => `Perform ${target} Double Jumps`,
  },
  {
    type: 'fastFalls',
    targets: [6, 12, 18, 26],
    rewards: [25, 35, 50, 65],
    formatLabel: (target) => `Execute ${target} Fast-Falls`,
  },
  {
    type: 'overdrive',
    targets: [1, 2, 3, 4],
    rewards: [35, 55, 75, 95],
    formatLabel: (target) =>
      target === 1 ? 'Trigger Hyper Overdrive once' : `Trigger Hyper Overdrive ${target} times`,
  },
];

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
    name: 'Energy Shield',
    description: 'Extends active barrier absorption time.',
    maxLevel: 5,
    baseCost: 25,
    costStep: 25,
    unit: 's',
    formatValue: (lvl: number) => `${(6 + lvl * 2).toFixed(0)}s`,
  },
  {
    id: 'magnetDuration',
    name: 'Credit Magnet',
    description: 'Increases attraction duration and pull radius.',
    maxLevel: 5,
    baseCost: 25,
    costStep: 25,
    unit: 's',
    formatValue: (lvl: number) => `${(7 + lvl * 2).toFixed(0)}s · ${190 + lvl * 35}px`,
  },
  {
    id: 'blasterRate',
    name: 'Pulse Blaster',
    description: 'Speeds up automatic anti-drone fire rate.',
    maxLevel: 5,
    baseCost: 30,
    costStep: 30,
    unit: 'ms',
    formatValue: (lvl: number) => `${720 - lvl * 75}ms`,
  },
  {
    id: 'creditMultiplier',
    name: 'Credit Boost',
    description: 'Bonus multiplier on collected and drone credits.',
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

export function getCreditMultiplier(level: number): number {
  return 1 + level * 0.25;
}
