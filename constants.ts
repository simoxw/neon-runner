import { UpgradeId } from './types';

export const GAME_CONFIG = {
  GRAVITY: 1550,
  PLAYER_JUMP_INITIAL: -460,
  PLAYER_JUMP_HOLD_ACCEL: -1450,
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
};

export function getGroundHeight(viewportHeight: number): number {
  return viewportHeight < 480 ? GAME_CONFIG.GROUND_HEIGHT_COMPACT : GAME_CONFIG.GROUND_HEIGHT;
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
    formatValue: (lvl: number) => `${(720 - lvl * 75)}ms`,
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
