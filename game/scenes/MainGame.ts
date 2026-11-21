import Phaser from 'phaser';
import {
  GAME_CONFIG,
  getGroundHeight,
  getMagnetDurationMs,
  getShieldDurationMs,
  SECTORS_PALETTE,
} from '../../constants';
import { PlayerProgress, RunMode } from '../../types';
import {
  advanceComboOnEvent,
  ComboState,
  computeCreditReward,
  computeSectorIndex,
  computeSpeedForScore,
  isOverRoadGap,
  resetCombo,
  resolveDroneBulletHit,
  shouldCollideWithGround,
  stepRunDistance,
  tickComboDecay,
} from '../../utils/gameRules';
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
  public streetLamps: Phaser.GameObjects.TileSprite | null = null;
  public ground: Phaser.GameObjects.TileSprite | null = null;
  public foregroundGirders: Phaser.GameObjects.TileSprite | null = null;
  public groundBody: Phaser.GameObjects.Rectangle | null = null;

  private sectorSun: Phaser.GameObjects.Image | null = null;
  private searchlights: Phaser.GameObjects.Image[] = [];
  private hoverTraffic: Array<{
    sprite: Phaser.GameObjects.Image;
    speedX: number;
    baseYRatio: number;
    phase: number;
    baseAlpha: number;
    extraSectorOnly: boolean;
  }> = [];

  private explosionEmitter: Phaser.GameObjects.Particles.ParticleEmitter | null = null;
  private sparkEmitter: Phaser.GameObjects.Particles.ParticleEmitter | null = null;
  private pickupEmitter: Phaser.GameObjects.Particles.ParticleEmitter | null = null;
  private windEmitter: Phaser.GameObjects.Particles.ParticleEmitter | null = null;

  public score: number = 0;
  public distance: number = 0;
  public runCredits: number = 0;
  public dronesDestroyed: number = 0;
  public platformsLanded: number = 0;
  public bossesDefeated: number = 0;
  public maxCombo: number = 0;
  public combo: ComboState = resetCombo();
  public runMode: RunMode = 'classic';
  public currentSpeed: number = GAME_CONFIG.BASE_SPEED;
  public currentSectorIndex: number = 0;
  public isGameOver: boolean = false;
  public isStarted: boolean = false;
  public isPausedState: boolean = false;

  private progress: PlayerProgress = loadProgress();
  private lastBuffEmitTime: number = 0;
  private lastDifficultyStep: number = 0;
  private prevBossActive: boolean = false;
  private prevBossHp: number = 0;

  constructor() {
    super('MainGame');
  }

  create() {
    this.progress = loadProgress();
    soundEngine.setMuted(this.progress.muted);

    const { width, height } = this.scale;
    const gh = getGroundHeight(height);

    this.sky = this.add.tileSprite(0, 0, width, height, 'sky').setOrigin(0, 0).setScrollFactor(0).setDepth(0);

    if (this.textures.exists('sector_sun')) {
      this.sectorSun = this.add
        .image(width * 0.72, Math.max(92, height - gh - 185), 'sector_sun')
        .setScrollFactor(0)
        .setDepth(0.25)
        .setAlpha(0);
    }

    this.cityFar = this.add
      .tileSprite(0, height - gh - 340, width, 420, 'city_far')
      .setOrigin(0, 0)
      .setScrollFactor(0)
      .setDepth(0.5);

    this.hoverTraffic = [];
    if (this.textures.exists('hover_car_0') && this.textures.exists('hover_car_1')) {
      const carDefs = [
        { key: 'hover_car_0', speedX: -125, baseYRatio: 0.24, scale: 0.85, alpha: 0.65, extra: false },
        { key: 'hover_car_1', speedX: 92, baseYRatio: 0.34, scale: 0.72, alpha: 0.52, extra: false },
        { key: 'hover_car_0', speedX: -152, baseYRatio: 0.44, scale: 0.95, alpha: 0.72, extra: false },
        { key: 'hover_car_1', speedX: 118, baseYRatio: 0.54, scale: 0.8, alpha: 0.58, extra: false },
        { key: 'hover_car_0', speedX: -175, baseYRatio: 0.3, scale: 1.0, alpha: 0.75, extra: true },
        { key: 'hover_car_1', speedX: 140, baseYRatio: 0.48, scale: 0.88, alpha: 0.65, extra: true },
      ];
      const skySpan = Math.max(120, height - gh - 45);
      carDefs.forEach((def, idx) => {
        const sprite = this.add
          .image(Phaser.Math.Between(0, Math.max(320, width)), 45 + skySpan * def.baseYRatio, def.key)
          .setScrollFactor(0)
          .setDepth(0.8)
          .setScale(def.scale)
          .setAlpha(def.extra ? 0 : def.alpha);
        this.hoverTraffic.push({
          sprite,
          speedX: def.speedX,
          baseYRatio: def.baseYRatio,
          phase: idx * 1.3,
          baseAlpha: def.alpha,
          extraSectorOnly: def.extra,
        });
      });
    }

    this.searchlights = [];
    if (this.textures.exists('searchlight_beam')) {
      [width * 0.28, width * 0.74].forEach((bx) => {
        const beam = this.add
          .image(bx, height - gh + 10, 'searchlight_beam')
          .setOrigin(0.5, 1)
          .setScrollFactor(0)
          .setDepth(0.9)
          .setBlendMode(Phaser.BlendModes.ADD)
          .setAlpha(0);
        this.searchlights.push(beam);
      });
    }

    this.cityNear = this.add
      .tileSprite(0, height - gh - 260, width, 340, 'city_near')
      .setOrigin(0, 0)
      .setScrollFactor(0)
      .setDepth(1.2);

    const scaleY = gh / 96;
    const deckBackPx = Math.round(14 * scaleY);
    const totalGroundH = gh + deckBackPx;

    if (this.textures.exists('street_lamps')) {
      const lampH = Math.round(92 * scaleY);
      this.streetLamps = this.add
        .tileSprite(0, height - gh + Math.round(8 * scaleY) - lampH, width, lampH, 'street_lamps')
        .setOrigin(0, 0)
        .setScrollFactor(0)
        .setTileScale(1, scaleY)
        .setDepth(2.4);
    }

    this.ground = this.add
      .tileSprite(0, height - totalGroundH, width, totalGroundH, 'ground')
      .setOrigin(0, 0)
      .setScrollFactor(0)
      .setTileScale(1, scaleY)
      .setDepth(2.5);

    if (this.textures.exists('fg_girders')) {
      this.foregroundGirders = this.add
        .tileSprite(0, height - 56, width, 56, 'fg_girders')
        .setOrigin(0, 0)
        .setScrollFactor(0)
        .setDepth(13.5);
    }

    this.groundBody = this.add.rectangle(width / 2, height - gh / 2, width, gh, 0x000000, 0);
    this.physics.add.existing(this.groundBody, true);
    this.physics.world.setBounds(0, 0, width, height);
    this.physics.world.setBoundsCollision(true, true, true, false);

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

    this.obstacleManager = new ObstacleManager(this, (bossNumber) => {
      const { width, height } = this.scale;
      this.spawnFloatingText(
        width / 2,
        Math.max(115, height * 0.25),
        `ALLERTA BOSS DRONE #${bossNumber}`,
        '#ff2a6d'
      );
      this.emitRunUpdate();
    });
    this.physics.add.collider(
      this.player,
      this.groundBody,
      undefined,
      this.shouldCollideWithGroundCallback,
      this
    );
    this.physics.add.collider(
      this.player,
      this.obstacleManager.platforms,
      this.handlePlatformLand as Phaser.Types.Physics.Arcade.ArcadePhysicsCallback,
      undefined,
      this
    );

    this.explosionEmitter = this.add.particles(0, 0, 'spark_yellow', {
      speed: { min: 80, max: 280 },
      scale: { start: 1.4, end: 0 },
      lifespan: 360,
      blendMode: Phaser.BlendModes.ADD,
      emitting: false,
    });
    this.explosionEmitter.setDepth(12);

    this.sparkEmitter = this.add.particles(0, 0, 'spark_red', {
      speed: { min: 60, max: 180 },
      scale: { start: 0.9, end: 0 },
      lifespan: 200,
      blendMode: Phaser.BlendModes.ADD,
      emitting: false,
    });
    this.sparkEmitter.setDepth(12);

    this.pickupEmitter = this.add.particles(0, 0, 'particle', {
      speed: { min: 60, max: 190 },
      scale: { start: 1.1, end: 0 },
      lifespan: 280,
      blendMode: Phaser.BlendModes.ADD,
      emitting: false,
    });
    this.pickupEmitter.setDepth(12);

    if (this.textures.exists('wind_streak')) {
      this.windEmitter = this.add.particles(width + 40, height * 0.42, 'wind_streak', {
        x: width + 40,
        y: { min: 48, max: Math.max(120, height - gh - 40) },
        speedX: { min: -760, max: -460 },
        speedY: 0,
        alpha: { start: 0.42, end: 0 },
        scaleX: { min: 0.8, max: 1.6 },
        lifespan: 1900,
        frequency: 110,
        quantity: 1,
        emitting: false,
      });
      this.windEmitter.setDepth(2);
    }

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
      this.obstacleManager.lasers,
      this.handleLaserCollision as Phaser.Types.Physics.Arcade.ArcadePhysicsCallback,
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
      this.obstacleManager.boostRings,
      this.handleBoostRingCollect as Phaser.Types.Physics.Arcade.ArcadePhysicsCallback,
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

    this.physics.add.overlap(
      this.player,
      this.obstacleManager.jumpPads,
      this.handleJumpPadOverlap as Phaser.Types.Physics.Arcade.ArcadePhysicsCallback,
      undefined,
      this
    );

    this.physics.add.overlap(
      this.player,
      this.obstacleManager.bosses,
      this.handleBossHazardCollision as Phaser.Types.Physics.Arcade.ArcadePhysicsCallback,
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

      this.physics.add.overlap(
        this.player.bullets,
        this.obstacleManager.bosses,
        this.handleBulletBossHit as Phaser.Types.Physics.Arcade.ArcadePhysicsCallback,
        undefined,
        this
      );
    }

    const onPointerDown = () => {
      if (!this.isStarted || this.isGameOver || this.isPausedState) return;
      this.player?.handlePress(this.time.now);
    };

    const onPointerUp = () => {
      this.player?.handleRelease();
    };

    this.input.on('pointerdown', onPointerDown);
    this.input.on('pointerup', onPointerUp);
    this.input.on('pointercancel', onPointerUp);

    const spaceKey = this.input.keyboard?.addKey(Phaser.Input.Keyboard.KeyCodes.SPACE);
    const upKey = this.input.keyboard?.addKey(Phaser.Input.Keyboard.KeyCodes.UP);
    const escKey = this.input.keyboard?.addKey(Phaser.Input.Keyboard.KeyCodes.ESC);
    const pKey = this.input.keyboard?.addKey(Phaser.Input.Keyboard.KeyCodes.P);
    const eKey = this.input.keyboard?.addKey(Phaser.Input.Keyboard.KeyCodes.E);

    spaceKey?.on('down', onPointerDown);
    spaceKey?.on('up', onPointerUp);
    upKey?.on('down', onPointerDown);
    upKey?.on('up', onPointerUp);

    const togglePauseFromKey = () => {
      if (!this.isStarted || this.isGameOver) return;
      if (this.isPausedState) {
        this.resumeGame();
      } else {
        this.pauseGame();
      }
    };

    const triggerEmpFromKey = () => {
      this.executeEmpWave();
    };

    escKey?.on('down', togglePauseFromKey);
    pKey?.on('down', togglePauseFromKey);
    eKey?.on('down', triggerEmpFromKey);

    this.scale.on('resize', this.handleResize, this);

    const startHandler = (evt: Event) => {
      const detail = (evt as CustomEvent<{ runMode?: RunMode }>).detail;
      this.startRunning(detail?.runMode);
    };
    const restartHandler = (evt: Event) => {
      const detail = (evt as CustomEvent<{ runMode?: RunMode }>).detail;
      this.restart(detail?.runMode);
    };
    const pauseHandler = () => this.pauseGame();
    const resumeHandler = () => this.resumeGame();
    const quitMenuHandler = () => this.returnToMenu();
    const empHandler = () => this.executeEmpWave();
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
    window.addEventListener('PHASER_EMP', empHandler);
    window.addEventListener('PHASER_SYNC_PROGRESS', syncProgressHandler);

    this.events.once('shutdown', () => {
      this.input.off('pointerdown', onPointerDown);
      this.input.off('pointerup', onPointerUp);
      this.input.off('pointercancel', onPointerUp);
      spaceKey?.off('down', onPointerDown);
      spaceKey?.off('up', onPointerUp);
      upKey?.off('down', onPointerDown);
      upKey?.off('up', onPointerUp);
      escKey?.off('down', togglePauseFromKey);
      pKey?.off('down', togglePauseFromKey);
      eKey?.off('down', triggerEmpFromKey);
      this.scale.off('resize', this.handleResize, this);

      window.removeEventListener('PHASER_START', startHandler);
      window.removeEventListener('PHASER_RESTART', restartHandler);
      window.removeEventListener('PHASER_PAUSE', pauseHandler);
      window.removeEventListener('PHASER_RESUME', resumeHandler);
      window.removeEventListener('PHASER_MENU', quitMenuHandler);
      window.removeEventListener('PHASER_EMP', empHandler);
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
    const scaleY = gh / 96;
    const deckBackPx = Math.round(14 * scaleY);
    const totalGroundH = gh + deckBackPx;

    if (this.streetLamps) {
      const lampH = Math.round(92 * scaleY);
      this.streetLamps.setPosition(0, height - gh + Math.round(8 * scaleY) - lampH);
      this.streetLamps.setSize(width, lampH);
      this.streetLamps.setTileScale(1, scaleY);
    }
    if (this.ground) {
      this.ground.setPosition(0, height - totalGroundH);
      this.ground.setSize(width, totalGroundH);
      this.ground.setTileScale(1, scaleY);
    }
    if (this.foregroundGirders) {
      this.foregroundGirders.setPosition(0, height - 56);
      this.foregroundGirders.setSize(width, 56);
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
    this.physics.world.setBoundsCollision(true, true, true, false);
    this.obstacleManager?.syncRoadGapHeights(height);

    if (this.sectorSun) {
      this.sectorSun.setPosition(width * 0.72, Math.max(92, height - gh - 185));
    }

    if (this.searchlights.length >= 2) {
      this.searchlights[0].setPosition(width * 0.28, height - gh + 10);
      this.searchlights[1].setPosition(width * 0.74, height - gh + 10);
    }

    if (this.windEmitter) {
      this.windEmitter.setPosition(width + 40, height * 0.42);
    }

    if (this.player) {
      const targetX = Math.min(130, Math.max(76, width * 0.16));
      this.player.x = targetX;
      if (!this.isStarted && this.player.y > height - gh - 28) {
        this.player.y = height - gh - 36;
      }
    }
  }

  private shouldCollideWithGroundCallback = (): boolean => {
    if (!this.player) return true;
    const gh = getGroundHeight(this.scale.height);
    const groundTop = this.scale.height - gh;
    const gaps = this.obstacleManager ? this.obstacleManager.getActiveGapSpans() : [];
    return shouldCollideWithGround(
      this.player.x,
      this.player.y,
      groundTop,
      gaps,
      this.player.overdriveActive
    );
  };

  private applyProgressToPlayer() {
    if (!this.player) return;
    this.player.setUpgradeLevels(
      this.progress.upgrades.blasterRate,
      this.progress.upgrades.magnetDuration,
      this.progress.upgrades.jetpackThruster,
      this.progress.upgrades.empWave
    );
    this.player.setSkin(this.progress.equippedSkin);
  }

  private applySectorPaletteImmediate(sectorIdx: number) {
    const palette = SECTORS_PALETTE[sectorIdx % SECTORS_PALETTE.length];
    this.sky?.setTint(palette.skyTint);
    this.cityFar?.setTint(palette.cityFarTint);
    this.cityNear?.setTint(palette.cityNearTint);
    this.streetLamps?.setTint(palette.cityNearTint);
    this.ground?.setTint(palette.groundTint);
    this.applySectorEnvironment(sectorIdx, true);
  }

  private applySectorEnvironment(sectorIdx: number, immediate: boolean) {
    const themeIdx = sectorIdx % SECTORS_PALETTE.length;

    // Sector 3 (Solar Amber): reveal synthwave sun behind skyline
    if (this.sectorSun) {
      const targetAlpha = themeIdx === 2 ? 0.85 : 0;
      if (immediate) {
        this.sectorSun.setAlpha(targetAlpha);
      } else {
        this.tweens.add({
          targets: this.sectorSun,
          alpha: targetAlpha,
          duration: 1100,
        });
      }
    }

    // Sector 2 (Crimson Grid): activate sweeping diagonal sky searchlights
    const beamTargetAlpha = themeIdx === 1 ? 0.56 : 0;
    this.searchlights.forEach((beam) => {
      if (immediate) {
        beam.setAlpha(beamTargetAlpha);
      } else {
        this.tweens.add({
          targets: beam,
          alpha: beamTargetAlpha,
          duration: 900,
        });
      }
    });

    // Sector 4 (Ultraviolet Core): unlock extra aerial hover-car traffic
    this.hoverTraffic.forEach((car) => {
      const targetAlpha = car.extraSectorOnly ? (themeIdx >= 3 ? car.baseAlpha : 0) : car.baseAlpha;
      if (immediate) {
        car.sprite.setAlpha(targetAlpha);
      } else {
        this.tweens.add({
          targets: car.sprite,
          alpha: targetAlpha,
          duration: 800,
        });
      }
    });

    // Wind / Neon Rain streaks per sector
    if (this.windEmitter) {
      if (themeIdx >= 1) {
        const windTint =
          themeIdx === 1 ? 0xff6b8b : themeIdx === 2 ? 0xffc857 : 0xc084fc;
        this.windEmitter.particleTint = windTint;
        this.windEmitter.frequency = themeIdx === 1 ? 92 : themeIdx === 2 ? 78 : 48;
        if (!this.windEmitter.emitting) {
          this.windEmitter.start();
        }
      } else if (this.windEmitter.emitting) {
        this.windEmitter.stop();
      }
    }
  }

  private updateAmbientAtmosphere(time: number, delta: number) {
    const { width, height } = this.scale;
    const gh = getGroundHeight(height);
    const skySpan = Math.max(120, height - gh - 45);
    const dtSec = delta / 1000;

    if (this.sectorSun && this.sectorSun.alpha > 0.01) {
      const baseSunY = Math.max(92, height - gh - 185);
      this.sectorSun.y = baseSunY + Math.sin(time * 0.0008) * 3;
    }

    for (let i = 0; i < this.searchlights.length; i++) {
      const beam = this.searchlights[i];
      if (beam.alpha > 0.01) {
        const centerAngle = i === 0 ? 14 : -14;
        beam.angle = centerAngle + Math.sin(time * 0.0011 + i * 2.1) * 22;
      }
    }

    for (let i = 0; i < this.hoverTraffic.length; i++) {
      const car = this.hoverTraffic[i];
      car.sprite.x += car.speedX * dtSec;
      car.sprite.y = 45 + skySpan * car.baseYRatio + Math.sin(time * 0.0025 + car.phase) * 4;
      if (car.speedX < 0 && car.sprite.x < -50) {
        car.sprite.x = width + 50;
      } else if (car.speedX > 0 && car.sprite.x > width + 50) {
        car.sprite.x = -50;
      }
    }
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
    tweenTint(this.streetLamps, palette.cityNearTint);
    tweenTint(this.ground, palette.groundTint);

    soundEngine.playSectorChange();
    this.applySectorEnvironment(sectorIdx, false);
    const { width, height } = this.scale;
    this.spawnFloatingText(width / 2, Math.max(100, height * 0.28), `SECTOR ${sectorIdx + 1} · ${palette.name.toUpperCase()}`, '#00f3ff');
  }

  update(time: number, delta: number) {
    if (this.isPausedState) return;

    if (!this.isStarted) {
      if (this.sky) this.sky.tilePositionX += 0.02 * delta;
      if (this.cityFar) this.cityFar.tilePositionX += 0.06 * delta;
      if (this.cityNear) this.cityNear.tilePositionX += 0.12 * delta;
      if (this.streetLamps) this.streetLamps.tilePositionX += 0.22 * delta;
      if (this.ground) this.ground.tilePositionX += 0.22 * delta;
      if (this.foregroundGirders) this.foregroundGirders.tilePositionX += 0.30 * delta;
      this.updateAmbientAtmosphere(time, delta);
      if (this.player) {
        this.player.update(time, delta, false);
        const gh = getGroundHeight(this.scale.height);
        this.player.updateShadow(this.scale.height - gh, false);
      }
      return;
    }

    if (this.isGameOver) return;

    this.updateAmbientAtmosphere(time, delta);

    const prevComboCount = this.combo.count;
    this.combo = tickComboDecay(this.combo, delta);
    if (prevComboCount > 0 && this.combo.count === 0) {
      this.emitRunUpdate();
    }

    const stepResult = stepRunDistance(
      this.distance,
      this.currentSpeed,
      Boolean(this.player?.overdriveActive),
      delta,
      this.runMode
    );
    this.distance = stepResult.nextDistance;
    const effectiveSpeed = stepResult.effectiveSpeed;
    const newScore = stepResult.nextScore;

    if (newScore !== this.score) {
      this.score = newScore;
      const step = Math.floor(this.score / GAME_CONFIG.DIFFICULTY_INTERVAL_METERS);
      if (step > this.lastDifficultyStep) {
        this.lastDifficultyStep = step;
        this.currentSpeed = computeSpeedForScore(this.score, this.runMode);
      }

      const nextSector = computeSectorIndex(this.score);
      if (nextSector > this.currentSectorIndex) {
        this.currentSectorIndex = nextSector;
        this.transitionToSector(nextSector);
      }

      this.emitRunUpdate();
    }

    if (this.sky) this.sky.tilePositionX += effectiveSpeed * 0.00008 * delta;
    if (this.cityFar) this.cityFar.tilePositionX += effectiveSpeed * 0.00024 * delta;
    if (this.cityNear) this.cityNear.tilePositionX += effectiveSpeed * 0.00048 * delta;
    if (this.streetLamps) this.streetLamps.tilePositionX += effectiveSpeed * 0.001 * delta;
    if (this.ground) this.ground.tilePositionX += effectiveSpeed * 0.001 * delta;
    if (this.foregroundGirders) this.foregroundGirders.tilePositionX += effectiveSpeed * 0.00135 * delta;

    if (this.player) {
      this.player.update(time, delta, true);

      const gh = getGroundHeight(this.scale.height);
      const groundTop = this.scale.height - gh;
      if (this.player.y > groundTop + 34) {
        this.triggerFallGameOver();
        return;
      }

      const gaps = this.obstacleManager ? this.obstacleManager.getActiveGapSpans() : [];
      this.player.updateShadow(groundTop, isOverRoadGap(this.player.x, gaps));

      if (
        (this.player.shieldRemaining > 0 ||
          this.player.magnetRemaining > 0 ||
          this.player.overdriveRemaining > 0 ||
          this.player.empCooldownRemaining > 0) &&
        time - this.lastBuffEmitTime > 120
      ) {
        this.lastBuffEmitTime = time;
        this.emitBuffUpdate();
      }
    }

    if (this.obstacleManager) {
      this.obstacleManager.update(time, delta, effectiveSpeed, this.player, this.score);
      if (
        this.obstacleManager.bossActive !== this.prevBossActive ||
        this.obstacleManager.bossHp !== this.prevBossHp
      ) {
        this.prevBossActive = this.obstacleManager.bossActive;
        this.prevBossHp = this.obstacleManager.bossHp;
        this.emitRunUpdate();
      }
    }
  }

  startRunning(requestedMode?: RunMode) {
    soundEngine.unlock();
    this.progress = loadProgress();
    soundEngine.setMuted(this.progress.muted);
    this.runMode = requestedMode ?? this.progress.runMode;
    this.currentSpeed = computeSpeedForScore(0, this.runMode);
    this.applyProgressToPlayer();
    this.applySectorPaletteImmediate(0);
    this.isPausedState = false;
    this.physics.world.resume();
    this.isStarted = true;
    this.isGameOver = false;
    this.emitEvent('GAME_START', {
      runMode: this.runMode,
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

  private bumpCombo(gain: number) {
    this.combo = advanceComboOnEvent(this.combo, gain);
    this.maxCombo = Math.max(this.maxCombo, this.combo.count);
  }

  private executeEmpWave() {
    if (!this.isStarted || this.isGameOver || this.isPausedState || !this.player || !this.obstacleManager) {
      return;
    }
    if (!this.player.consumeEmpCooldown()) return;

    const px = this.player.x;
    const py = this.player.y;
    const result = this.obstacleManager.triggerEmpBlast(this.time.now);

    if (this.textures.exists('emp_wave_ring')) {
      const ring = this.add
        .image(px, py, 'emp_wave_ring')
        .setDepth(14)
        .setScale(0.35)
        .setAlpha(0.95)
        .setBlendMode(Phaser.BlendModes.ADD);
      this.tweens.add({
        targets: ring,
        scale: 8.5,
        alpha: 0,
        duration: 420,
        ease: 'Cubic.easeOut',
        onComplete: () => ring.destroy(),
      });
    }

    this.cameras.main.shake(150, 0.008);
    soundEngine.playEmpBlast();
    this.spawnFloatingText(px, py - 46, 'ONDA EMP!', '#00f3ff');

    let empBonus = 0;
    for (let i = 0; i < result.clearedPoints.length; i++) {
      const pt = result.clearedPoints[i];
      this.bumpCombo(1);
      empBonus += computeCreditReward(
        pt.points,
        this.progress.upgrades.creditMultiplier,
        this.combo.multiplier,
        this.runMode
      );
      this.explosionEmitter?.explode(12, pt.x, pt.y);
    }

    if (empBonus > 0) {
      this.runCredits += empBonus;
    }
    if (result.dronesCleared > 0) {
      this.dronesDestroyed += result.dronesCleared;
    }

    if (result.bossDefeated && result.bossPos) {
      this.awardBossDefeat(result.bossPos.x, result.bossPos.y, result.bossPos.bountyBase);
    }

    this.emitRunUpdate();
    this.emitBuffUpdate();
  }

  private awardBossDefeat(bx: number, by: number, bountyBase: number) {
    this.bossesDefeated += 1;
    this.dronesDestroyed += 1;
    this.bumpCombo(4);
    const bounty = computeCreditReward(
      bountyBase,
      this.progress.upgrades.creditMultiplier,
      this.combo.multiplier,
      this.runMode
    );
    this.runCredits += bounty;
    this.player?.addOverdriveCharge(25);
    this.explosionEmitter?.explode(36, bx, by);
    this.pickupEmitter?.explode(24, bx, by);
    this.cameras.main.shake(220, 0.012);
    soundEngine.playBossDefeat();
    this.spawnFloatingText(bx, by - 20, `BOSS ABBATTUTO! +${bounty}`, '#ffc857');
  }

  private handleJumpPadOverlap = (_playerObj: unknown, padObj: unknown) => {
    if (!this.isStarted || this.isGameOver || this.isPausedState || !this.player) return;
    const pad = padObj as Phaser.Physics.Arcade.Sprite;
    if (!pad || !pad.active || pad.getData('triggered')) return;

    pad.setData('triggered', true);
    this.player.launchFromJumpPad();
    this.pickupEmitter?.explode(14, pad.x, pad.y - 6);
    this.spawnFloatingText(pad.x, pad.y - 26, 'BOOST JUMP!', '#00ff9d');
  };

  private handleBossHazardCollision = (_playerObj: unknown, bossObj: unknown) => {
    if (this.isGameOver || !this.isStarted || this.isPausedState || !this.player || !this.obstacleManager) {
      return;
    }
    const boss = bossObj as Phaser.Physics.Arcade.Sprite;
    if (!boss || !boss.active) return;

    const now = this.time.now;
    if (this.player.overdriveActive) {
      if (this.player.isInvulnerable(now) && now < this.player.invulnUntil) return;
      this.player.invulnUntil = now + 480;
      const dmg = this.obstacleManager.damageBoss(Math.max(6, Math.ceil(this.obstacleManager.bossMaxHp * 0.5)));
      if (dmg.hit) {
        this.cameras.main.shake(120, 0.009);
        soundEngine.playOverdriveSmash();
        this.explosionEmitter?.explode(20, dmg.x, dmg.y);
        if (dmg.defeated) {
          this.awardBossDefeat(dmg.x, dmg.y, dmg.bountyBase);
        }
        this.emitRunUpdate();
      }
      return;
    }

    if (this.player.isInvulnerable(now)) return;

    if (this.player.consumeShield(now)) {
      this.cameras.main.shake(180, 0.01);
      this.combo = resetCombo();
      this.emitRunUpdate();
      return;
    }

    this.triggerFatalGameOver();
  };

  private handleBulletBossHit = (bulletObj: unknown, bossObj: unknown) => {
    const bullet = bulletObj as Phaser.Physics.Arcade.Sprite;
    const boss = bossObj as Phaser.Physics.Arcade.Sprite;
    if (!bullet || !bullet.active || !boss || !boss.active || !this.obstacleManager) return;

    const bx = bullet.x;
    const by = bullet.y;
    bullet.disableBody(true, true);

    const dmg = this.obstacleManager.damageBoss(1);
    if (!dmg.hit) return;

    this.sparkEmitter?.explode(10, bx, by);
    if (dmg.defeated) {
      this.awardBossDefeat(dmg.x, dmg.y, dmg.bountyBase);
    } else {
      soundEngine.playArmorCrack();
    }
    this.emitRunUpdate();
  };

  private handleLaserCollision = (playerObj: unknown, laserObj: unknown) => {
    const laser = laserObj as Phaser.Physics.Arcade.Sprite;
    if (!laser || !laser.active) return;
    if (laser.getData('laserState') !== 'active') return;
    this.handleHazardCollision(playerObj, laserObj);
  };

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

        this.bumpCombo(1);
        const smashBonus = computeCreditReward(
          3,
          this.progress.upgrades.creditMultiplier,
          this.combo.multiplier,
          this.runMode
        );
        this.runCredits += smashBonus;
        this.spawnFloatingText(hx, hy - 14, `+${smashBonus} SMASH`, '#ffc857');
        this.emitRunUpdate();
      }
      return;
    }

    if (this.player.isInvulnerable(now)) return;

    if (this.player.consumeShield(now)) {
      this.cameras.main.shake(180, 0.01);
      this.combo = resetCombo();
      this.emitRunUpdate();
      if (hazard && hazard.active) {
        this.pickupEmitter?.explode(18, hazard.x, hazard.y);
        hazard.disableBody(true, true);
      }
      return;
    }

    this.triggerFatalGameOver();
  };

  private triggerFallGameOver() {
    if (this.isGameOver || !this.isStarted || !this.player) return;
    this.triggerFatalGameOver();
  }

  private triggerFatalGameOver() {
    if (!this.player) return;
    this.cameras.main.shake(280, 0.016);
    this.isGameOver = true;
    this.windEmitter?.stop();
    this.explosionEmitter?.explode(24, this.player.x, this.player.y);
    this.player.die();
    soundEngine.playGameOver();
    this.emitBuffUpdate();
    this.emitEvent('GAME_OVER', {
      score: this.score,
      runCredits: this.runCredits,
      dronesDestroyed: this.dronesDestroyed,
      doubleJumps: this.player.doubleJumpsUsed,
      platformsLanded: this.platformsLanded,
      overdrivesTriggered: this.player.overdrivesTriggered,
      comboCount: this.combo.count,
      comboMultiplier: this.combo.multiplier,
      maxCombo: this.maxCombo,
      runMode: this.runMode,
      bossesDefeated: this.bossesDefeated,
    });
  }

  private handlePlatformLand = (_playerObj: unknown, platformObj: unknown) => {
    if (!this.isStarted || this.isGameOver || !this.player || !this.player.body) return;
    const platform = platformObj as Phaser.Physics.Arcade.Sprite;
    if (!platform || !platform.active) return;

    if (
      (this.player.body.blocked.down || this.player.body.touching.down) &&
      !platform.getData('landedByRun')
    ) {
      platform.setData('landedByRun', true);
      this.platformsLanded += 1;
      this.emitRunUpdate();
    }
  };

  private handleBoostRingCollect = (_playerObj: unknown, ringObj: unknown) => {
    const ring = ringObj as Phaser.Physics.Arcade.Sprite;
    if (!ring || !ring.active || !this.player) return;

    const rx = ring.x;
    const ry = ring.y;
    ring.disableBody(true, true);

    this.player.refillJetpack();
    this.bumpCombo(2);
    const earned = computeCreditReward(
      3,
      this.progress.upgrades.creditMultiplier,
      this.combo.multiplier,
      this.runMode
    );
    this.runCredits += earned;
    this.player.addOverdriveCharge(GAME_CONFIG.OVERDRIVE_CHARGE_PER_RING);
    this.pickupEmitter?.explode(16, rx, ry);
    soundEngine.playRingBoost();
    this.spawnFloatingText(rx, ry - 14, `+FUEL +${earned}`, '#00ff9d');
    this.emitRunUpdate();
  };

  private handleCoinCollect = (_playerObj: unknown, coinObj: unknown) => {
    const coin = coinObj as Phaser.Physics.Arcade.Sprite;
    if (!coin || !coin.active) return;

    const cx = coin.x;
    const cy = coin.y;
    coin.disableBody(true, true);

    this.bumpCombo(1);
    const earned = computeCreditReward(
      1,
      this.progress.upgrades.creditMultiplier,
      this.combo.multiplier,
      this.runMode
    );
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
      this.spawnFloatingText(px, py - 12, 'SCUDO', '#00f3ff');
    } else {
      this.player.activateMagnet(getMagnetDurationMs(this.progress.upgrades.magnetDuration));
      this.spawnFloatingText(px, py - 12, 'MAGNETE', '#ffc857');
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

    const currentHp = (drone.getData('hp') as number) || 1;
    const hit = resolveDroneBulletHit(currentHp);
    drone.setData('hp', hit.nextHp);

    if (!hit.destroyed) {
      if (hit.armorBroken) {
        drone.setTint(0xff6b8b);
        drone.play('anim_drone', true);
      }
      this.sparkEmitter?.explode(10, dx, dy);
      soundEngine.playArmorCrack();
      return;
    }

    const wasArmored = Boolean(drone.getData('armored'));
    drone.disableBody(true, true);

    this.bumpCombo(wasArmored ? 2 : 1);
    const earned = computeCreditReward(
      wasArmored ? 4 : 2,
      this.progress.upgrades.creditMultiplier,
      this.combo.multiplier,
      this.runMode
    );
    this.runCredits += earned;
    this.dronesDestroyed += 1;

    this.player?.addOverdriveCharge(
      wasArmored
        ? GAME_CONFIG.OVERDRIVE_CHARGE_PER_ARMORED_DRONE
        : GAME_CONFIG.OVERDRIVE_CHARGE_PER_DRONE
    );
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
    }).setOrigin(0.5).setDepth(16);

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
      platformsLanded: this.platformsLanded,
      overdrivesTriggered: this.player?.overdrivesTriggered ?? 0,
      comboCount: this.combo.count,
      comboMultiplier: this.combo.multiplier,
      maxCombo: this.maxCombo,
      runMode: this.runMode,
      bossesDefeated: this.bossesDefeated,
      bossActive: this.obstacleManager?.bossActive ?? false,
      bossHp: this.obstacleManager?.bossHp ?? 0,
      bossMaxHp: this.obstacleManager?.bossMaxHp ?? 0,
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
      empUnlocked: this.player.empWaveLevel > 0,
      empCooldownRemaining: this.player.empCooldownRemaining,
      empCooldownMax: this.player.empCooldownMax,
    });
  }

  resetGame() {
    this.score = 0;
    this.distance = 0;
    this.runCredits = 0;
    this.dronesDestroyed = 0;
    this.platformsLanded = 0;
    this.bossesDefeated = 0;
    this.maxCombo = 0;
    this.combo = resetCombo();
    this.lastDifficultyStep = 0;
    this.currentSectorIndex = 0;
    this.prevBossActive = false;
    this.prevBossHp = 0;
    this.currentSpeed = computeSpeedForScore(0, this.runMode);
    this.isGameOver = false;
    this.isStarted = false;
    this.isPausedState = false;
    this.windEmitter?.stop();
    this.applySectorPaletteImmediate(0);
  }

  restart(requestedMode?: RunMode) {
    this.progress = loadProgress();
    soundEngine.setMuted(this.progress.muted);
    this.runMode = requestedMode ?? this.progress.runMode;
    this.applyProgressToPlayer();
    this.physics.world.resume();
    this.anims.resumeAll();
    this.resetGame();
    this.obstacleManager?.reset();
    const { width, height } = this.scale;
    const gh = getGroundHeight(height);
    const playerStartX = Math.min(130, Math.max(76, width * 0.16));
    this.player?.reset(playerStartX, height - gh - 36);
    this.startRunning(this.runMode);
  }

  emitEvent(type: string, data: Record<string, unknown>) {
    window.dispatchEvent(
      new CustomEvent('PHASER_EVENT', {
        detail: { type, data },
      })
    );
  }
}
