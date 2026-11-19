export enum GameState {
  MENU = 'MENU',
  PLAYING = 'PLAYING',
  PAUSED = 'PAUSED',
  GAME_OVER = 'GAME_OVER',
}

export type OrientationMode = 'auto' | 'landscape';

export type SkinId = 'cyan' | 'crimson' | 'solar' | 'emerald' | 'violet';

export type UpgradeId =
  | 'shieldDuration'
  | 'magnetDuration'
  | 'blasterRate'
  | 'creditMultiplier';

export interface PlayerProgress {
  highScore: number;
  totalCredits: number;
  muted: boolean;
  orientationMode: OrientationMode;
  unlockedSkins: SkinId[];
  equippedSkin: SkinId;
  upgrades: Record<UpgradeId, number>;
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
}

export interface RunTelemetry {
  score: number;
  runCredits: number;
  dronesDestroyed: number;
  speedMultiplier: number;
  sectorNumber: number;
  sectorName: string;
}
