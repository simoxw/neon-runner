export enum GameState {
  MENU = 'MENU',
  PLAYING = 'PLAYING',
  PAUSED = 'PAUSED',
  GAME_OVER = 'GAME_OVER',
}

export type OrientationMode = 'auto' | 'landscape';

export type RunMode = 'classic' | 'turbo';

export type SkinId =
  | 'cyan'
  | 'crimson'
  | 'solar'
  | 'emerald'
  | 'violet'
  | 'apex_chrome'
  | 'boss_slayer'
  | 'turbo_phantom';

export type UpgradeId =
  | 'shieldDuration'
  | 'magnetDuration'
  | 'blasterRate'
  | 'creditMultiplier'
  | 'jetpackThruster'
  | 'empWave';

export type MissionType =
  | 'distance'
  | 'drones'
  | 'credits'
  | 'doubleJumps'
  | 'platforms'
  | 'overdrive';

export interface ActiveMission {
  id: string;
  type: MissionType;
  label: string;
  target: number;
  progress: number;
  reward: number;
  completed: boolean;
}

export interface DailyRewardState {
  lastClaimDate: string | null;
  streak: number;
}

export interface CareerStats {
  totalRuns: number;
  totalDistance: number;
  totalDrones: number;
  totalBosses: number;
  bestCombo: number;
}

export interface PlayerProgress {
  highScore: number;
  turboHighScore: number;
  totalCredits: number;
  muted: boolean;
  orientationMode: OrientationMode;
  runMode: RunMode;
  unlockedSkins: SkinId[];
  equippedSkin: SkinId;
  upgrades: Record<UpgradeId, number>;
  missions: ActiveMission[];
  missionSeed: number;
  dailyReward: DailyRewardState;
  career: CareerStats;
}

export interface ActiveBuffs {
  shieldRemaining: number;
  shieldMax: number;
  magnetRemaining: number;
  magnetMax: number;
  overdriveCharge: number;
  overdriveActive: boolean;
  overdriveRemaining: number;
  overdriveMax: number;
  empUnlocked: boolean;
  empCooldownRemaining: number;
  empCooldownMax: number;
}

export interface RunTelemetry {
  score: number;
  runCredits: number;
  dronesDestroyed: number;
  speedMultiplier: number;
  sectorNumber: number;
  sectorName: string;
  doubleJumps: number;
  platformsLanded: number;
  overdrivesTriggered: number;
  comboCount: number;
  comboMultiplier: number;
  maxCombo: number;
  runMode: RunMode;
  bossesDefeated: number;
  bossActive: boolean;
  bossName: string;
  bossHp: number;
  bossMaxHp: number;
}
