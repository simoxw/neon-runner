export enum GameState {
  MENU = 'MENU',
  PLAYING = 'PLAYING',
  PAUSED = 'PAUSED',
  GAME_OVER = 'GAME_OVER',
}

export type UpgradeId =
  | 'shieldDuration'
  | 'magnetDuration'
  | 'blasterRate'
  | 'creditMultiplier';

export interface PlayerProgress {
  highScore: number;
  totalCredits: number;
  muted: boolean;
  upgrades: Record<UpgradeId, number>;
}

export interface ActiveBuffs {
  shieldRemaining: number;
  shieldMax: number;
  magnetRemaining: number;
  magnetMax: number;
}

export interface RunTelemetry {
  score: number;
  runCredits: number;
  dronesDestroyed: number;
  speedMultiplier: number;
}
