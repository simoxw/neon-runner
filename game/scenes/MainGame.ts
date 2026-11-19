import Phaser from 'phaser';
import {
  GAME_CONFIG,
  getCreditMultiplier,
  getGroundHeight,
  getMagnetDurationMs,
  getShieldDurationMs,
  SECTORS_PALETTE,
} from '../../constants';
import { PlayerProgress } from '../../types';
import { soundEngine } from '../../utils/sound';
import { loadProgress } from '../../utils/storage';
import { ObstacleManager } from '../entities/ObstacleManager';
import { Player } from '../entities/Player';

export class MainGame extends Phaser.Scene {
  public player: Player | null = null;
  public obstacleManager: ObstacleManager | null = null;

  public sky: Phaser.GameObjects.TileSprite | null = null;
  public cityFar: Phaser.GameObjects.TileSprite | null = null;
  public cityNear: Phaser.GameObjects.TileSprite | null = null;
  public ground: Phaser.GameObjects.TileSprite | null = null;
  public groundBody: Phaser.GameObjects.Rectangle | null = null;

  private explosionEmitter: Phaser.GameObjects.Particles.ParticleEmitter | null = null;
  private sparkEmitter: Phaser.GameObjects.Particles.ParticleEmitter | null = null;
  private pickupEmitter: Phaser.GameObjects.Particles.ParticleEmitter | null = null;

  public score: number = 0;
  public distance: number = 0;
  public runCredits: number = 0;
  public dronesDestroyed: number = 0;
  public currentSpeed: number = GAME_CONFIG.BASE_SPEED;
  public currentSectorIndex: number = 0;
  public isGameOver: boolean = false;
  public isStarted: boolean = false;
  public isPausedState: boolean = false;

  private progress: PlayerProgress = loadProgress();
  private lastBuffEmitTime: number = 0;
  private lastDifficultyStep: number = 0;

  constructor() {
    super('MainGame');
  }

  create() {
    this.progress = loadProgress();
    soundEngine.setMuted(this.progress.muted);

    const { width, height } = this.scale;
    const gh = getGroundHeight(height);

    this.sky = this.add.tileSprite(0, 0, width, height, 'sky').setOrigin(0, 0).setScrollFactor(0);
    this.cityFar = this.add.tileSprite(0, height - gh - 340, width, 420, 'city_far').setOrigin(0, 0).setScrollFactor(0);
    this.cityNear = this.add.tileSprite(0, height - gh - 260, width, 340, 'city_near').setOrigin(0, 0).setScrollFactor(0);
    this.ground = this.add.tileSprite(0, height - gh, width, gh, 'ground').setOrigin(0, 0).setScrollFactor(0);

    this.groundBody = this.add.rectangle(width / 2, height - gh / 2, width, gh, 0x000000, 0);
    this.physics.add.existing(this.groundBody, true);
    this.physics.world.setBounds(0, 0, width, height);

    const playerStartX = Math.min(130, Math.max(76, width * 0.16));
    const playerStartY = height - gh - 36;

    this.player = new Player(
      this,
      playerStartX,
      playerStartY,
      () => this.isPausedState,
      () => this.emitBuffUpdate(),
      () => this.emitRunUpdate()
    );
    this.applyProgressToPlayer();
    this.physics.add.collider(this.player, this.groundBody);

    this.obstacleManager = new ObstacleManager(this);
    this.physics.add.collider(this.player, this.obstacleManager.platforms);

    this.explosionEmitter = this.add.particles(0, 0, 'spark_yellow', {
      speed: { min: 80, max: 280 },
      scale: { start: 1.4, end: 0 },
      lifespan: 360,
      blendMode: Phaser.BlendModes.ADD,
      emitting: false,
    });

    this.sparkEmitter = this.add.particles(0, 0, 'spark_red', {
      speed: { min: 60, max: 180 },
      scale: { start: 0.9, end: 0 },
      lifespan: 200,
      blendMode: Phaser.BlendModes.ADD,
      emitting: false,
    });

    this.pickupEmitter = this.add.particles(0, 0, 'particle', {
      speed: { min: 60, max: 190 },
      scale: { start: 1.1, end: 0 },
      lifespan: 280,
      blendMode: Phaser.BlendModes.ADD,
      emitting: false,
    });

    // Overlaps
    this.physics.add.overlap(
      this.player,
      this.obstacleManager.barriers,
      this.handleHazardCollision as Phaser.Types.Physics.Arcade.ArcadePhysicsCallback,
      undefined,
      this
    );

    this.physics.add.overlap(
      this.player,
      this.obstacleManager.drones,
      this.handleHazardCollision as Phaser.Types.Physics.Arcade.ArcadePhysicsCallback,
      undefined,
      this
    );

    this.physics.add.overlap(
      this.player,
      this.obstacleManager.missiles,
      this.handleHazardCollision as Phaser.Types.Physics.Arcade.ArcadePhysicsCallback,
      undefined,
      this
    );

    this.physics.add.overlap(
      this.player,
      this.obstacleManager.coins,
      this.handleCoinCollect as Phaser.Types.Physics.Arcade.ArcadePhysicsCallback,
      undefined,
      this
    );

    this.physics.add.overlap(
      this.player,
      this.obstacleManager.powerups,
      this.handlePowerupCollect as Phaser.Types.Physics.Arcade.ArcadePhysicsCallback,
      undefined,
      this
    );

    if (this.player.bullets) {
      this.physics.add.overlap(
        this.player.bullets,
        this.obstacleManager.barriers,
        this.handleBulletBarrierHit as Phaser.Types.Physics.Arcade.ArcadePhysicsCallback,
        undefined,
        this
      );

      this.physics.add.overlap(
        this.player.bullets,
        this.obstacleManager.drones,
        this.handleBulletDroneHit as Phaser.Types.Physics.Arcade.ArcadePhysicsCallback,
        undefined,
        this
      );
    }

    let pointerDownY = 0;
    let swipeFastFallFired = false;

    const onPointerDown = (pointer?: Phaser.Input.Pointer) => {
      if (!this.isStarted || this.isGameOver || this.isPausedState) return;
      if (pointer) {
        pointerDownY = pointer.y;
        swipeFastFallFired = false;
      }
      this.player?.handlePress(this.time.now);
    };

    const onPointerMove = (pointer: Phaser.Input.Pointer) => {
      if (!pointer.isDown || swipeFastFallFired) return;
      if (!this.isStarted || this.isGameOver || this.isPausedState) return;
      if (pointer.y - pointerDownY > 36) {
        swipeFastFallFired = true;
        this.player?.triggerFastFall();
      }
    };

    const onPointerUp = () => {
      swipeFastFallFired = false;
      this.player?.handleRelease();
    };

    const onFastFallKey = () => {
      if (!this.isStarted || this.isGameOver || this.isPausedState) return;
      this.player?.triggerFastFall();
    };

    this.input.on('pointerdown', onPointerDown);
    this.input.on('pointermove', onPointerMove);
    this.input.on('pointerup', onPointerUp);
    this.input.on('pointercancel', onPointerUp);

    const spaceKey = this.input.keyboard?.addKey(Phaser.Input.Keyboard.KeyCodes.SPACE);
    const upKey = this.input.keyboard?.addKey(Phaser.Input.Keyboard.KeyCodes.UP);
    const downKey = this.input.keyboard?.addKey(Phaser.Input.Keyboard.KeyCodes.DOWN);
    const sKey = this.input.keyboard?.addKey(Phaser.Input.Keyboard.KeyCodes.S);
    const escKey = this.input.keyboard?.addKey(Phaser.Input.Keyboard.KeyCodes.ESC);
    const pKey = this.input.keyboard?.addKey(Phaser.Input.Keyboard.KeyCodes.P);

    const onJumpKeyDown = () => onPointerDown();

    spaceKey?.on('down', onJumpKeyDown);
    spaceKey?.on('up', onPointerUp);
    upKey?.on('down', onJumpKeyDown);
    upKey?.on('up', onPointerUp);
    downKey?.on('down', onFastFallKey);
    sKey?.on('down', onFastFallKey);

    const togglePauseFromKey = () => {
      if (!this.isStarted || this.isGameOver) return;
      if (this.isPausedState) {
        this.resumeGame();
      } else {
        this.pauseGame();
      }
    };

    escKey?.on('down', togglePauseFromKey);
    pKey?.on('down', togglePauseFromKey);

    this.scale.on('resize', this.handleResize, this);

    const startHandler = () => this.startRunning();
    const restartHandler = () => this.restart();
    const pauseHandler = () => this.pauseGame();
    const resumeHandler = () => this.resumeGame();
    const quitMenuHandler = () => this.returnToMenu();
    const syncProgressHandler = () => {
      this.progress = loadProgress();
      soundEngine.setMuted(this.progress.muted);
      this.applyProgressToPlayer();
    };

    window.addEventListener('PHASER_START', startHandler);
    window.addEventListener('PHASER_RESTART', restartHandler);
    window.addEventListener('PHASER_PAUSE', pauseHandler);
    window.addEventListener('PHASER_RESUME', resumeHandler);
    window.addEventListener('PHASER_MENU', quitMenuHandler);
    window.addEventListener('PHASER_SYNC_PROGRESS', syncProgressHandler);

    this.events.once('shutdown', () => {
      this.input.off('pointerdown', onPointerDown);
      this.input.off('pointermove', onPointerMove);
      this.input.off('pointerup', onPointerUp);
      this.input.off('pointercancel', onPointerUp);
      spaceKey?.off('down', onJumpKeyDown);
      spaceKey?.off('up', onPointerUp);
      upKey?.off('down', onJumpKeyDown);
      upKey?.off('up', onPointerUp);
      downKey?.off('down', onFastFallKey);
      sKey?.off('down', onFastFallKey);
      escKey?.off('down', togglePauseFromKey);
      pKey?.off('down', togglePauseFromKey);
      this.scale.off('resize', this.handleResize, this);

      window.removeEventListener('PHASER_START', startHandler);
      window.removeEventListener('PHASER_RESTART', restartHandler);
      window.removeEventListener('PHASER_PAUSE', pauseHandler);
      window.removeEventListener('PHASER_RESUME', resumeHandler);
      window.removeEventListener('PHASER_MENU', quitMenuHandler);
      window.removeEventListener('PHASER_SYNC_PROGRESS', syncProgressHandler);
    });

    this.resetGame();
  }

  private handleResize(gameSize: Phaser.Structs.Size) {
    const width = Math.floor(gameSize.width);
    const height = Math.floor(gameSize.height);
    if (width <= 0 || height <= 0) return;
    const gh = getGroundHeight(height);

    if (this.sky) {
      this.sky.setSize(width, height);
    }
    if (this.cityFar) {
      this.cityFar.setPosition(0, height - gh - 340);
      this.cityFar.setSize(width, 420);
    }
    if (this.cityNear) {
      this.cityNear.setPosition(0, height - gh - 260);
      this.cityNear.setSize(width, 340);
    }
    if (this.ground) {
      this.ground.setPosition(0, height - gh);
      this.ground.setSize(width, gh);
    }
    if (this.groundBody) {
      this.groundBody.setPosition(width / 2, height - gh / 2);
      this.groundBody.setSize(width, gh);
      const staticBody = this.groundBody.body as Phaser.Physics.Arcade.StaticBody | null;
      if (staticBody) {
        staticBody.updateFromGameObject();
      }
    }

    this.physics.world.setBounds(0, 0, width, height);

    if (this.player) {
      const targetX = Math.min(130, Math.max(76, width * 0.16));
      this.player.x = targetX;
      if (this.player.y > height - gh - 28) {
        this.player.y = height - gh - 36;
      }
    }
  }

  private applyProgressToPlayer() {
    if (!this.player) return;
    this.player.setUpgradeLevels(
      this.progress.upgrades.blasterRate,
      this.progress.upgrades.magnetDuration
    );
    this.player.setSkin(this.progress.equippedSkin);
  }

  private applySectorPaletteImmediate(sectorIdx: number) {
    const palette = SECTORS_PALETTE[sectorIdx % SECTORS_PALETTE.length];
    this.sky?.setTint(palette.skyTint);
    this.cityFar?.setTint(palette.cityFarTint);
    this.cityNear?.setTint(palette.cityNearTint);
    this.ground?.setTint(palette.groundTint);
  }

  private transitionToSector(sectorIdx: number) {
    const palette = SECTORS_PALETTE[sectorIdx % SECTORS_PALETTE.length];
    const tweenTint = (target: Phaser.GameObjects.TileSprite | null, destHex: number) => {
      if (!target) return;
      const fromColor = Phaser.Display.Color.IntegerToColor(target.tintTopLeft);
      const toColor = Phaser.Display.Color.IntegerToColor(destHex);
      this.tweens.addCounter({
        from: 0,
        to: 100,
        duration: 1200,
        onUpdate: (tween) => {
          const val = tween.getValue() ?? 0;
          const c = Phaser.Display.Color.Interpolate.ColorWithColor(
            fromColor,
            toColor,
            100,
            val
          );
          target.setTint(Phaser.Display.Color.GetColor(c.r, c.g, c.b));
        },
      });
    };

    tweenTint(this.sky, palette.skyTint);
    tweenTint(this.cityFar, palette.cityFarTint);
    tweenTint(this.cityNear, palette.cityNearTint);
    tweenTint(this.ground, palette.groundTint);

    soundEngine.playSectorChange();
    const { width, height } = this.scale;
    this.spawnFloatingText(width / 2, Math.max(100, height * 0.28), `SECTOR ${sectorIdx + 1} · ${palette.name.toUpperCase()}`, '#00f3ff');
  }

  update(time: number, delta: number) {
    if (this.isPausedState) return;

    if (!this.isStarted) {
      if (this.sky) this.sky.tilePositionX += 0.02 * delta;
      if (this.cityFar) this.cityFar.tilePositionX += 0.06 * delta;
      if (this.cityNear) this.cityNear.tilePositionX += 0.12 * delta;
      if (this.ground) this.ground.tilePositionX += 0.22 * delta;
      if (this.player) this.player.update(time, delta, false);
      return;
    }

    if (this.isGameOver) return;

    const effectiveSpeed = this.player?.overdriveActive
      ? Math.min(GAME_CONFIG.MAX_SPEED + 180, this.currentSpeed + GAME_CONFIG.OVERDRIVE_SPEED_BONUS)
      : this.currentSpeed;

    const dtSec = delta / 1000;
    this.distance += (effectiveSpeed * dtSec) / 14;
    const newScore = Math.floor(this.distance);

    if (newScore !== this.score) {
      this.score = newScore;
      const step = Math.floor(this.score / GAME_CONFIG.DIFFICULTY_INTERVAL_METERS);
      if (step > this.lastDifficultyStep) {
        this.lastDifficultyStep = step;
        this.currentSpeed = Math.min(
          GAME_CONFIG.MAX_SPEED,
          this.currentSpeed + GAME_CONFIG.SPEED_INCREMENT
        );
      }

      const nextSector = Math.floor(this.score / GAME_CONFIG.SECTOR_INTERVAL_METERS);
      if (nextSector > this.currentSectorIndex) {
        this.currentSectorIndex = nextSector;
        this.transitionToSector(nextSector);
      }

      this.emitRunUpdate();
    }

    if (this.sky) this.sky.tilePositionX += effectiveSpeed * 0.00008 * delta;
    if (this.cityFar) this.cityFar.tilePositionX += effectiveSpeed * 0.00024 * delta;
    if (this.cityNear) this.cityNear.tilePositionX += effectiveSpeed * 0.00048 * delta;
    if (this.ground) this.ground.tilePositionX += effectiveSpeed * 0.001 * delta;

    if (this.player) {
      this.player.update(time, delta, true);
      if (
        (this.player.shieldRemaining > 0 ||
          this.player.magnetRemaining > 0 ||
          this.player.overdriveRemaining > 0) &&
        time - this.lastBuffEmitTime > 120
      ) {
        this.lastBuffEmitTime = time;
        this.emitBuffUpdate();
      }
    }

    if (this.obstacleManager) {
      this.obstacleManager.update(time, delta, effectiveSpeed, this.player, this.score);
    }
  }

  startRunning() {
    soundEngine.unlock();
    this.progress = loadProgress();
    soundEngine.setMuted(this.progress.muted);
    this.applyProgressToPlayer();
    this.applySectorPaletteImmediate(0);
    this.isPausedState = false;
    this.physics.world.resume();
    this.isStarted = true;
    this.isGameOver = false;
    this.emitEvent('GAME_START', {
      speedMultiplier: this.getSpeedMultiplier(),
      sectorNumber: 1,
      sectorName: SECTORS_PALETTE[0].name,
    });
    this.emitBuffUpdate();
  }

  pauseGame() {
    if (!this.isStarted || this.isGameOver || this.isPausedState) return;
    this.isPausedState = true;
    this.player?.handleRelease();
    this.physics.world.pause();
    this.anims.pauseAll();
    this.emitEvent('GAME_PAUSED', {});
  }

  resumeGame() {
    if (!this.isPausedState) return;
    this.isPausedState = false;
    this.physics.world.resume();
    this.anims.resumeAll();
    this.emitEvent('GAME_RESUMED', {});
  }

  returnToMenu() {
    this.isPausedState = false;
    this.physics.world.resume();
    this.anims.resumeAll();
    this.resetGame();
    this.applySectorPaletteImmediate(0);
    this.obstacleManager?.reset();
    const { width, height } = this.scale;
    const gh = getGroundHeight(height);
    const playerStartX = Math.min(130, Math.max(76, width * 0.16));
    this.player?.reset(playerStartX, height - gh - 36);
    this.emitBuffUpdate();
  }

  private handleHazardCollision = (_playerObj: unknown, hazardObj: unknown) => {
    if (this.isGameOver || !this.isStarted || this.isPausedState || !this.player) return;

    const now = this.time.now;
    const hazard = hazardObj as Phaser.Physics.Arcade.Sprite;

    // Hyper Overdrive smashes any obstacle, drone, or missile for bonus credits
    if (this.player.overdriveActive) {
      if (hazard && hazard.active) {
        const hx = hazard.x;
        const hy = hazard.y;
        hazard.disableBody(true, true);
        this.explosionEmitter?.explode(22, hx, hy);
        this.cameras.main.shake(90, 0.008);
        soundEngine.playOverdriveSmash();

        const mult = getCreditMultiplier(this.progress.upgrades.creditMultiplier);
        const smashBonus = Math.max(3, Math.round(3 * mult));
        this.runCredits += smashBonus;
        this.spawnFloatingText(hx, hy - 14, `+${smashBonus} SMASH`, '#ffc857');
        this.emitRunUpdate();
      }
      return;
    }

    if (this.player.isInvulnerable(now)) return;

    if (this.player.consumeShield(now)) {
      this.cameras.main.shake(180, 0.01);
      if (hazard && hazard.active) {
        this.pickupEmitter?.explode(18, hazard.x, hazard.y);
        hazard.disableBody(true, true);
      }
      return;
    }

    this.cameras.main.shake(280, 0.016);
    this.isGameOver = true;
    this.explosionEmitter?.explode(24, this.player.x, this.player.y);
    this.player.die();
    soundEngine.playGameOver();
    this.emitBuffUpdate();
    this.emitEvent('GAME_OVER', {
      score: this.score,
      runCredits: this.runCredits,
      dronesDestroyed: this.dronesDestroyed,
      doubleJumps: this.player.doubleJumpsUsed,
      fastFalls: this.player.fastFallsUsed,
      overdrivesTriggered: this.player.overdrivesTriggered,
    });
  };

  private handleCoinCollect = (_playerObj: unknown, coinObj: unknown) => {
    const coin = coinObj as Phaser.Physics.Arcade.Sprite;
    if (!coin || !coin.active) return;

    const cx = coin.x;
    const cy = coin.y;
    coin.disableBody(true, true);

    const mult = getCreditMultiplier(this.progress.upgrades.creditMultiplier);
    const earned = Math.max(1, Math.round(1 * mult));
    this.runCredits += earned;

    this.player?.addOverdriveCharge(GAME_CONFIG.OVERDRIVE_CHARGE_PER_COIN);
    this.pickupEmitter?.explode(8, cx, cy);
    soundEngine.playCoin();
    this.emitRunUpdate();
  };

  private handlePowerupCollect = (_playerObj: unknown, powerupObj: unknown) => {
    const item = powerupObj as Phaser.Physics.Arcade.Sprite;
    if (!item || !item.active || !this.player) return;

    const type = item.getData('powerupType') as 'shield' | 'magnet';
    const px = item.x;
    const py = item.y;
    item.disableBody(true, true);

    if (type === 'shield') {
      this.player.activateShield(getShieldDurationMs(this.progress.upgrades.shieldDuration));
      this.spawnFloatingText(px, py - 12, 'SHIELD', '#00f3ff');
    } else {
      this.player.activateMagnet(getMagnetDurationMs(this.progress.upgrades.magnetDuration));
      this.spawnFloatingText(px, py - 12, 'MAGNET', '#ffc857');
    }

    this.pickupEmitter?.explode(16, px, py);
    soundEngine.playPowerup();
    this.emitBuffUpdate();
  };

  private handleBulletBarrierHit = (bulletObj: unknown, _barrierObj: unknown) => {
    const bullet = bulletObj as Phaser.Physics.Arcade.Sprite;
    if (!bullet || !bullet.active) return;
    this.sparkEmitter?.explode(6, bullet.x, bullet.y);
    bullet.disableBody(true, true);
  };

  private handleBulletDroneHit = (bulletObj: unknown, droneObj: unknown) => {
    const bullet = bulletObj as Phaser.Physics.Arcade.Sprite;
    const drone = droneObj as Phaser.Physics.Arcade.Sprite;
    if (!bullet || !bullet.active || !drone || !drone.active) return;

    const dx = drone.x;
    const dy = drone.y;
    bullet.disableBody(true, true);
    drone.disableBody(true, true);

    const mult = getCreditMultiplier(this.progress.upgrades.creditMultiplier);
    const earned = Math.max(2, Math.round(2 * mult));
    this.runCredits += earned;
    this.dronesDestroyed += 1;

    this.player?.addOverdriveCharge(GAME_CONFIG.OVERDRIVE_CHARGE_PER_DRONE);
    this.explosionEmitter?.explode(18, dx, dy);
    this.cameras.main.shake(90, 0.005);
    soundEngine.playExplosion();
    this.spawnFloatingText(dx, dy - 10, `+${earned}`, '#ffc857');
    this.emitRunUpdate();
  };

  private spawnFloatingText(x: number, y: number, label: string, color: string) {
    const text = this.add.text(x, y, label, {
      fontFamily: 'JetBrains Mono, monospace',
      fontSize: '15px',
      fontStyle: 'bold',
      color,
    }).setOrigin(0.5);

    this.tweens.add({
      targets: text,
      y: y - 36,
      alpha: 0,
      duration: 600,
      ease: 'Cubic.easeOut',
      onComplete: () => text.destroy(),
    });
  }

  private getSpeedMultiplier(): number {
    return Number((this.currentSpeed / GAME_CONFIG.BASE_SPEED).toFixed(1));
  }

  private emitRunUpdate() {
    const sector = SECTORS_PALETTE[this.currentSectorIndex % SECTORS_PALETTE.length];
    this.emitEvent('UPDATE_RUN', {
      score: this.score,
      runCredits: this.runCredits,
      dronesDestroyed: this.dronesDestroyed,
      speedMultiplier: this.getSpeedMultiplier(),
      sectorNumber: this.currentSectorIndex + 1,
      sectorName: sector.name,
      doubleJumps: this.player?.doubleJumpsUsed ?? 0,
      fastFalls: this.player?.fastFallsUsed ?? 0,
      overdrivesTriggered: this.player?.overdrivesTriggered ?? 0,
    });
  }

  private emitBuffUpdate() {
    if (!this.player) return;
    this.emitEvent('BUFF_UPDATE', {
      shieldRemaining: this.player.shieldRemaining,
      shieldMax: this.player.shieldMax,
      magnetRemaining: this.player.magnetRemaining,
      magnetMax: this.player.magnetMax,
      overdriveCharge: this.player.overdriveCharge,
      overdriveActive: this.player.overdriveActive,
      overdriveRemaining: this.player.overdriveRemaining,
      overdriveMax: this.player.overdriveMax,
    });
  }

  resetGame() {
    this.score = 0;
    this.distance = 0;
    this.runCredits = 0;
    this.dronesDestroyed = 0;
    this.lastDifficultyStep = 0;
    this.currentSectorIndex = 0;
    this.currentSpeed = GAME_CONFIG.BASE_SPEED;
    this.isGameOver = false;
    this.isStarted = false;
    this.isPausedState = false;
    this.applySectorPaletteImmediate(0);
  }

  restart() {
    this.progress = loadProgress();
    soundEngine.setMuted(this.progress.muted);
    this.applyProgressToPlayer();
    this.physics.world.resume();
    this.anims.resumeAll();
    this.resetGame();
    this.obstacleManager?.reset();
    const { width, height } = this.scale;
    const gh = getGroundHeight(height);
    const playerStartX = Math.min(130, Math.max(76, width * 0.16));
    this.player?.reset(playerStartX, height - gh - 36);
    this.startRunning();
  }

  emitEvent(type: string, data: Record<string, unknown>) {
    window.dispatchEvent(
      new CustomEvent('PHASER_EVENT', {
        detail: { type, data },
      })
    );
  }
}
