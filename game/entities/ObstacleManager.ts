import Phaser from 'phaser';
import { GAME_CONFIG, getGroundHeight } from '../../constants';
import {
  advanceLaserState,
  isChasmPattern,
  LaserPhase,
  PatternId,
  pickNextPattern,
  RoadGapSpan,
} from '../../utils/gameRules';
import { soundEngine } from '../../utils/sound';
import { Player } from './Player';

interface ActiveMissileWarning {
  sprite: Phaser.GameObjects.Sprite;
  targetY: number;
  elapsedMs: number;
  phase: 'tracking' | 'locked';
}

export class ObstacleManager {
  public scene: Phaser.Scene;
  public barriers: Phaser.Physics.Arcade.Group;
  public lasers: Phaser.Physics.Arcade.Group;
  public drones: Phaser.Physics.Arcade.Group;
  public missiles: Phaser.Physics.Arcade.Group;
  public platforms: Phaser.Physics.Arcade.Group;
  public roadGaps: Phaser.Physics.Arcade.Group;
  public boostRings: Phaser.Physics.Arcade.Group;
  public coins: Phaser.Physics.Arcade.Group;
  public powerups: Phaser.Physics.Arcade.Group;

  private distanceUntilNextPattern: number = 220;
  private distanceSincePowerup: number = 0;
  private distanceSinceMissile: number = 0;
  private nextMissileDistance: number = 1400;
  private recentPatterns: PatternId[] = [];
  private chainRemaining: number = 0;
  private warnings: ActiveMissileWarning[] = [];

  constructor(scene: Phaser.Scene) {
    this.scene = scene;

    this.barriers = scene.physics.add.group({
      defaultKey: 'barrier',
      maxSize: 20,
    });

    this.lasers = scene.physics.add.group({
      defaultKey: 'laser_gate_warn',
      maxSize: 8,
    });

    this.drones = scene.physics.add.group({
      defaultKey: 'drone_0',
      maxSize: 16,
    });

    this.missiles = scene.physics.add.group({
      defaultKey: 'missile_0',
      maxSize: 6,
    });

    this.platforms = scene.physics.add.group({
      defaultKey: 'sky_platform',
      maxSize: 12,
    });

    this.roadGaps = scene.physics.add.group({
      defaultKey: 'road_gap',
      maxSize: 8,
    });

    this.boostRings = scene.physics.add.group({
      defaultKey: 'boost_ring',
      maxSize: 8,
    });

    this.coins = scene.physics.add.group({
      defaultKey: 'coin_0',
      maxSize: 48,
    });

    this.powerups = scene.physics.add.group({
      defaultKey: 'powerup_shield',
      maxSize: 4,
    });
  }

  update(
    time: number,
    delta: number,
    speed: number,
    player: Player | null,
    scoreMeters: number = 0
  ) {
    const dtSec = delta / 1000;
    const dx = speed * dtSec;

    this.distanceUntilNextPattern -= dx;
    this.distanceSincePowerup += dx;
    this.distanceSinceMissile += dx;

    if (this.distanceUntilNextPattern <= 0) {
      const spawned = this.spawnPattern(speed, scoreMeters);
      if (this.chainRemaining > 0) {
        this.chainRemaining -= 1;
        const recoveryGap = spawned.isChasm
          ? Math.max(295, speed * 0.65)
          : Math.max(285, speed * 0.64);
        const maxGap = Math.max(430, speed * 0.94);
        this.distanceUntilNextPattern = spawned.width + Phaser.Math.Between(recoveryGap, maxGap);
      } else if (spawned.startsChain) {
        this.chainRemaining = 1;
        const chainGap = Math.max(198, speed * 0.45);
        this.distanceUntilNextPattern = spawned.width + chainGap;
      } else {
        const minSafeGap = spawned.isChasm
          ? Math.max(295, speed * 0.65)
          : Math.max(285, speed * 0.64);
        const maxGap = Math.max(430, speed * 0.94);
        this.distanceUntilNextPattern = spawned.width + Phaser.Math.Between(minSafeGap, maxGap);
      }
    }

    // Trigger Jetpack Joyride-style missile warning periodically after 80m
    if (
      scoreMeters >= 80 &&
      this.distanceSinceMissile >= this.nextMissileDistance &&
      this.warnings.length === 0
    ) {
      this.distanceSinceMissile = 0;
      this.nextMissileDistance = Phaser.Math.Between(1600, 2600);
      this.triggerMissileWarning(player);
    }

    this.updateMissileWarnings(delta, speed, player);

    // Move barriers, laser gates, road gaps, boost rings, and sky platforms
    this.updateGroupMovement(this.barriers, speed, -120);
    this.updateGroupMovement(this.platforms, speed, -180);
    this.updateGroupMovement(this.roadGaps, speed, -220);
    this.updateGroupMovement(this.boostRings, speed, -120);
    this.updateLasers(time, delta, speed);

    // Move missiles at configured 1.2x scroll speed
    const missileChildren = this.missiles.getChildren();
    for (let i = 0; i < missileChildren.length; i++) {
      const m = missileChildren[i] as Phaser.Physics.Arcade.Sprite;
      if (m && m.active) {
        m.setVelocityX(-speed * GAME_CONFIG.MISSILE_SPEED_MULTIPLIER);
        if (m.x < -120) {
          m.disableBody(true, true);
        }
      }
    }

    // Move drones with slight sinusoidal hover
    const droneChildren = this.drones.getChildren();
    for (let i = 0; i < droneChildren.length; i++) {
      const drone = droneChildren[i] as Phaser.Physics.Arcade.Sprite;
      if (drone && drone.active) {
        const baseY = (drone.getData('baseY') as number) || drone.y;
        const phase = (drone.getData('phase') as number) || 0;
        drone.setVelocityX(-speed * 1.12);
        drone.y = baseY + Math.sin(time * 0.005 + phase) * 12;
        if (drone.x < -100) {
          drone.disableBody(true, true);
        }
      }
    }

    // Move coins + Magnet attraction
    const magnetActive = Boolean(
      player && (player.magnetRemaining > 0 || player.overdriveActive) && !player.isDead
    );
    const magnetRadius = player
      ? player.overdriveActive
        ? Math.max(240, player.getMagnetRadius())
        : player.getMagnetRadius()
      : 200;
    const coinChildren = this.coins.getChildren();

    for (let i = 0; i < coinChildren.length; i++) {
      const coin = coinChildren[i] as Phaser.Physics.Arcade.Sprite;
      if (coin && coin.active) {
        if (magnetActive && player) {
          const dist = Phaser.Math.Distance.Between(coin.x, coin.y, player.x, player.y);
          if (dist < magnetRadius) {
            const angle = Phaser.Math.Angle.Between(coin.x, coin.y, player.x, player.y);
            const pullSpeed = Math.max(speed * 1.45, 720);
            coin.setVelocity(Math.cos(angle) * pullSpeed, Math.sin(angle) * pullSpeed);
          } else {
            coin.setVelocity(-speed, 0);
          }
        } else {
          coin.setVelocity(-speed, 0);
        }

        if (coin.x < -100) {
          coin.disableBody(true, true);
        }
      }
    }

    // Move powerups with gentle bob
    const powerupChildren = this.powerups.getChildren();
    for (let i = 0; i < powerupChildren.length; i++) {
      const p = powerupChildren[i] as Phaser.Physics.Arcade.Sprite;
      if (p && p.active) {
        const baseY = (p.getData('baseY') as number) || p.y;
        p.setVelocityX(-speed * 0.96);
        p.y = baseY + Math.sin(time * 0.006) * 9;
        if (p.x < -100) {
          p.disableBody(true, true);
        }
      }
    }
  }

  private triggerMissileWarning(player: Player | null) {
    const { width, height } = this.scene.scale;
    const gh = getGroundHeight(height);
    const groundTop = height - gh;
    const safeTopY = Math.max(76, height * 0.21);
    const initialY = player
      ? Phaser.Math.Clamp(player.y, safeTopY, groundTop - 32)
      : groundTop - 70;

    const sprite = this.scene.add.sprite(width - 34, initialY, 'missile_warning');
    sprite.setDepth(15);

    this.warnings.push({
      sprite,
      targetY: initialY,
      elapsedMs: 0,
      phase: 'tracking',
    });

    soundEngine.playMissileWarning();
  }

  private updateMissileWarnings(delta: number, speed: number, player: Player | null) {
    if (this.warnings.length === 0) return;

    const { width, height } = this.scene.scale;
    const gh = getGroundHeight(height);
    const groundTop = height - gh;
    const safeTopY = Math.max(76, height * 0.21);

    for (let i = this.warnings.length - 1; i >= 0; i--) {
      const w = this.warnings[i];
      w.elapsedMs += delta;
      w.sprite.x = width - 34;

      if (w.phase === 'tracking') {
        if (player) {
          const clampedPlayerY = Phaser.Math.Clamp(player.y, safeTopY, groundTop - 32);
          w.targetY = Phaser.Math.Linear(w.targetY, clampedPlayerY, Math.min(1, delta * 0.009));
        }
        w.sprite.y = w.targetY;
        w.sprite.setAlpha(0.75 + Math.sin(w.elapsedMs * 0.02) * 0.25);

        if (w.elapsedMs >= 750) {
          w.phase = 'locked';
        }
      } else {
        w.sprite.y = w.targetY;
        const blink = Math.floor(w.elapsedMs / 55) % 2 === 0;
        w.sprite.setAlpha(blink ? 1 : 0.25);
        w.sprite.setScale(blink ? 1.18 : 0.95);

        if (w.elapsedMs >= 1100) {
          const launchY = w.targetY;
          w.sprite.destroy();
          this.warnings.splice(i, 1);
          this.spawnMissile(width + 45, launchY, speed);
        }
      }
    }
  }

  private spawnMissile(x: number, y: number, speed: number) {
    const missile = this.missiles.get(x, y, 'missile_0') as Phaser.Physics.Arcade.Sprite | null;
    if (missile) {
      missile.enableBody(true, x, y, true, true);
      missile.setDepth(7);
      missile.play('anim_missile', true);
      if (missile.body) {
        const body = missile.body as Phaser.Physics.Arcade.Body;
        body.setAllowGravity(false);
        body.immovable = true;
        body.setSize(42, 16);
        body.setOffset(4, 4);
        missile.setVelocityX(-speed * GAME_CONFIG.MISSILE_SPEED_MULTIPLIER);
      }
      soundEngine.playMissileLaunch();
    }
  }

  private updateGroupMovement(
    group: Phaser.Physics.Arcade.Group,
    speed: number,
    despawnX: number
  ) {
    const children = group.getChildren();
    for (let i = 0; i < children.length; i++) {
      const obj = children[i] as Phaser.Physics.Arcade.Sprite;
      if (obj && obj.active) {
        obj.setVelocityX(-speed);
        if (obj.x < despawnX) {
          obj.disableBody(true, true);
        }
      }
    }
  }

  private updateLasers(time: number, delta: number, speed: number) {
    const children = this.lasers.getChildren();
    for (let i = 0; i < children.length; i++) {
      const laser = children[i] as Phaser.Physics.Arcade.Sprite;
      if (laser && laser.active) {
        laser.setVelocityX(-speed);
        const prevPhase = (laser.getData('laserState') as LaserPhase) || 'warning';
        const prevElapsed = (laser.getData('laserElapsedMs') as number) || 0;
        const next = advanceLaserState({ phase: prevPhase, elapsedMs: prevElapsed }, delta);
        laser.setData('laserState', next.phase);
        laser.setData('laserElapsedMs', next.elapsedMs);

        if (next.phase === 'warning') {
          if (laser.texture.key !== 'laser_gate_warn') {
            laser.setTexture('laser_gate_warn');
          }
          laser.setAlpha(Math.floor(time / 70) % 2 === 0 ? 0.85 : 0.4);
        } else {
          if (laser.texture.key !== 'laser_gate_active') {
            laser.setTexture('laser_gate_active');
          }
          laser.setAlpha(0.92 + Math.sin(time * 0.03) * 0.08);
        }

        if (laser.x < -100) {
          laser.disableBody(true, true);
        }
      }
    }
  }

  private spawnPattern(
    speed: number,
    scoreMeters: number
  ): { width: number; isChasm: boolean; startsChain: boolean } {
    const { width, height } = this.scene.scale;
    const gh = getGroundHeight(height);
    const groundTop = height - gh;
    const safeTopY = Math.max(76, height * 0.21);
    const usableHeight = Math.max(120, groundTop - safeTopY);
    const startX = width + 90;

    const clampY = (desiredY: number) => Math.max(safeTopY, Math.min(groundTop - 36, desiredY));

    // Periodic Shield or Magnet drop (~every 180m)
    if (this.distanceSincePowerup >= GAME_CONFIG.POWERUP_INTERVAL_METERS * 14) {
      this.distanceSincePowerup = 0;
      const type = Phaser.Math.Between(0, 1) === 0 ? 'shield' : 'magnet';
      const powerupY = clampY(groundTop - Math.min(125, usableHeight * 0.62));
      this.spawnPowerup(startX + 40, powerupY, type, speed);
      this.spawnCoinArc(
        startX + 120,
        clampY(groundTop - Math.min(82, usableHeight * 0.42)),
        3,
        speed,
        safeTopY
      );
      return { width: 220, isChasm: false, startsChain: false };
    }

    const sector2Unlocked = scoreMeters >= GAME_CONFIG.SECTOR_INTERVAL_METERS;
    const selection = pickNextPattern(scoreMeters, this.recentPatterns);
    this.recentPatterns = selection.nextRecent;
    const patternId = selection.patternId;
    const startsChain = this.chainRemaining === 0 && selection.startsChain;
    const isChasm = isChasmPattern(patternId);

    switch (patternId) {
      case 'single_barrier': {
        this.spawnBarrier(startX, groundTop, false, speed);
        this.spawnCoinArc(
          startX - 45,
          clampY(groundTop - Math.min(92, usableHeight * 0.48)),
          3,
          speed,
          safeTopY
        );
        return { width: 120, isChasm, startsChain };
      }

      case 'double_barrier_rhythm': {
        const hopSpacing = Math.max(215, speed * 0.45);
        this.spawnBarrier(startX, groundTop, false, speed);
        this.spawnBarrier(startX + hopSpacing, groundTop, false, speed);
        this.spawnCoinArc(
          startX - 35,
          clampY(groundTop - Math.min(92, usableHeight * 0.46)),
          3,
          speed,
          safeTopY
        );
        this.spawnCoinArc(
          startX + hopSpacing - 35,
          clampY(groundTop - Math.min(98, usableHeight * 0.5)),
          3,
          speed,
          safeTopY
        );
        return { width: hopSpacing + 90, isChasm, startsChain };
      }

      case 'tall_barrier': {
        this.spawnBarrier(startX, groundTop, true, speed);
        this.spawnCoinArc(
          startX + 55,
          clampY(groundTop - Math.min(138, usableHeight * 0.68)),
          4,
          speed,
          safeTopY
        );
        return { width: 190, isChasm, startsChain };
      }

      case 'drone_squad': {
        const droneCount = speed > 540 ? 2 : 1;
        const minDroneY = safeTopY + 14;
        const maxDroneY = Math.max(minDroneY + 10, groundTop - 75);
        for (let i = 0; i < droneCount; i++) {
          const dy = Phaser.Math.Between(minDroneY, maxDroneY);
          const armored = sector2Unlocked && (i === 1 || Phaser.Math.Between(0, 99) < 42);
          this.spawnDrone(startX + i * 175, dy, speed, armored);
        }
        this.spawnCoinLine(startX + 30, clampY(groundTop - 44), 3, speed);
        return { width: droneCount === 2 ? 230 : 130, isChasm, startsChain };
      }

      case 'drone_swarms': {
        const count = speed > 580 ? 3 : 2;
        const rising = Phaser.Math.Between(0, 1) === 0;
        for (let i = 0; i < count; i++) {
          const ratio = rising ? 0.32 + i * 0.2 : 0.72 - i * 0.2;
          const dy = clampY(groundTop - Math.min(usableHeight - 16, usableHeight * ratio));
          const armored = sector2Unlocked && i === count - 1;
          this.spawnDrone(startX + i * 145, dy, speed, armored);
        }
        this.spawnCoinLine(startX + 20, clampY(groundTop - 44), 4, speed);
        return { width: count === 3 ? 340 : 210, isChasm, startsChain };
      }

      case 'barrier_then_drone': {
        const tallFirst = speed > 520 && Phaser.Math.Between(0, 1) === 1;
        this.spawnBarrier(startX, groundTop, tallFirst, speed);
        const spacing = Math.max(245, speed * 0.5);
        const droneY = clampY(groundTop - Math.min(130, usableHeight * 0.6));
        this.spawnDrone(
          startX + spacing,
          droneY,
          speed,
          sector2Unlocked && Phaser.Math.Between(0, 1) === 1
        );
        this.spawnCoinArc(startX + spacing * 0.45, droneY, 3, speed, safeTopY);
        return { width: spacing + 80, isChasm, startsChain };
      }

      case 'sky_staircase': {
        const midLift = Math.min(115, Math.max(82, usableHeight * 0.44));
        const highLift = Math.min(usableHeight - 28, Math.max(midLift + 54, usableHeight * 0.74));
        const midY = clampY(groundTop - midLift);
        const highY = clampY(groundTop - highLift);

        const firstX = startX + 75;
        const secondX = firstX + 260;

        this.spawnPlatform(firstX, midY, speed);
        this.spawnCoinLine(firstX - 44, Math.max(safeTopY, midY - 28), 3, speed);

        this.spawnPlatform(secondX, highY, speed);
        this.spawnCoinLine(secondX - 64, Math.max(safeTopY, highY - 28), 4, speed);
        this.spawnBoostRing(firstX + 130, Math.max(safeTopY + 12, (midY + highY) / 2 - 22), speed);

        if (Phaser.Math.Between(0, 1) === 1) {
          this.spawnBarrier(firstX, groundTop, false, speed);
        } else {
          this.spawnDrone(secondX, clampY(groundTop - 52), speed, false);
        }

        return { width: 430, isChasm, startsChain };
      }

      case 'sky_rail_gauntlet': {
        const railLift = Math.min(132, Math.max(90, usableHeight * 0.52));
        const railY = clampY(groundTop - railLift);

        const p1X = startX + 80;
        const p2X = p1X + 245;

        this.spawnPlatform(p1X, railY, speed);
        this.spawnPlatform(p2X, railY - 14, speed);
        this.spawnCoinLine(p1X - 44, Math.max(safeTopY, railY - 28), 3, speed);
        this.spawnCoinArc(p2X - 44, Math.max(safeTopY + 12, railY - 46), 4, speed, safeTopY);

        this.spawnBarrier(p1X - 10, groundTop, false, speed);
        this.spawnBarrier(p2X + 10, groundTop, false, speed);

        return { width: 450, isChasm, startsChain };
      }

      case 'sky_slalom': {
        const midY = clampY(groundTop - Math.min(118, Math.max(82, usableHeight * 0.46)));
        const pX = startX + 85;
        this.spawnPlatform(pX, midY, speed);
        this.spawnCoinLine(pX - 44, Math.max(safeTopY, midY - 28), 3, speed);
        this.spawnDrone(pX + 190, clampY(midY - 24), speed, sector2Unlocked);
        this.spawnBoostRing(pX + 290, clampY(groundTop - Math.min(140, usableHeight * 0.62)), speed);
        this.spawnBarrier(pX + 180, groundTop, false, speed);
        return { width: 390, isChasm, startsChain };
      }

      case 'road_chasm': {
        const gapWidth = Phaser.Math.Between(122, 150);
        const gapCenterX = startX + 95;
        this.spawnRoadGap(gapCenterX, gapWidth, gh, height, speed);

        if (Phaser.Math.Between(0, 1) === 0) {
          this.spawnCoinArc(
            gapCenterX - 44,
            clampY(groundTop - Math.min(96, usableHeight * 0.48)),
            3,
            speed,
            safeTopY
          );
          return { width: 220, isChasm: true, startsChain: false };
        } else {
          const highY = clampY(groundTop - Math.min(126, Math.max(88, usableHeight * 0.56)));
          this.spawnPlatform(gapCenterX + 135, highY, speed);
          this.spawnCoinLine(gapCenterX + 91, Math.max(safeTopY, highY - 28), 3, speed);
          this.spawnBoostRing(
            gapCenterX + 18,
            Math.max(safeTopY + 14, highY - 18),
            speed
          );
          return { width: 350, isChasm: true, startsChain: false };
        }
      }

      case 'double_chasm_bridge': {
        const g1W = Phaser.Math.Between(122, 138);
        const g2W = Phaser.Math.Between(122, 138);
        const g1X = startX + 90;
        const g2X = g1X + 360;
        const midBridgeY = clampY(groundTop - Math.min(108, Math.max(80, usableHeight * 0.48)));

        this.spawnRoadGap(g1X, g1W, gh, height, speed);
        this.spawnPlatform(g1X + 180, midBridgeY, speed);
        this.spawnCoinLine(g1X + 136, Math.max(safeTopY, midBridgeY - 28), 3, speed);
        this.spawnBoostRing(g1X + 270, Math.max(safeTopY + 18, midBridgeY - 36), speed);
        this.spawnRoadGap(g2X, g2W, gh, height, speed);
        this.spawnCoinArc(g2X - 44, clampY(groundTop - Math.min(96, usableHeight * 0.48)), 3, speed, safeTopY);

        return { width: 520, isChasm: true, startsChain: false };
      }

      case 'laser_bypass': {
        const gateY = groundTop - 68;
        const bypassLift = Math.min(usableHeight - 24, Math.max(122, usableHeight * 0.62));
        const bypassY = clampY(groundTop - bypassLift);

        this.spawnPlatform(startX + 40, bypassY, speed);
        this.spawnCoinLine(startX - 4, Math.max(safeTopY, bypassY - 28), 3, speed);
        this.spawnLaserGate(startX + 240, gateY, speed);
        this.spawnBoostRing(startX + 240, Math.max(safeTopY + 16, bypassY - 36), speed);

        return { width: 340, isChasm, startsChain };
      }

      case 'laser_drone_cross': {
        const gateY = groundTop - 68;
        const highY = clampY(groundTop - Math.min(usableHeight - 24, Math.max(124, usableHeight * 0.64)));
        this.spawnDrone(startX + 50, clampY(groundTop - 86), speed, true);
        this.spawnPlatform(startX + 215, highY, speed);
        this.spawnCoinLine(startX + 175, Math.max(safeTopY, highY - 28), 3, speed);
        this.spawnLaserGate(startX + 240, gateY, speed);
        return { width: 360, isChasm, startsChain };
      }

      case 'coin_wave':
      default: {
        const waveBase = clampY(groundTop - Math.min(96, usableHeight * 0.45));
        const waveAmp = Math.min(46, usableHeight * 0.25);
        for (let i = 0; i < 6; i++) {
          const cy = clampY(waveBase - Math.sin((i / 5) * Math.PI) * waveAmp);
          this.spawnSingleCoin(startX + i * 44, cy, speed);
        }
        if (Phaser.Math.Between(0, 1) === 1) {
          this.spawnBoostRing(startX + 130, clampY(groundTop - Math.min(148, usableHeight * 0.68)), speed);
        }
        return { width: 250, isChasm: false, startsChain };
      }
    }
  }

  public getActiveGapSpans(): RoadGapSpan[] {
    const spans: RoadGapSpan[] = [];
    const children = this.roadGaps.getChildren();
    for (let i = 0; i < children.length; i++) {
      const gap = children[i] as Phaser.Physics.Arcade.Sprite;
      if (gap && gap.active) {
        const w = (gap.getData('gapWidth') as number) || gap.displayWidth || 140;
        spans.push({
          leftX: gap.x - w / 2,
          rightX: gap.x + w / 2,
        });
      }
    }
    return spans;
  }

  public syncRoadGapHeights(viewportHeight: number) {
    const gh = getGroundHeight(viewportHeight);
    const deckBackPx = Math.round(14 * (gh / 96));
    const totalVisualH = gh + deckBackPx;
    const centerY = viewportHeight - totalVisualH / 2;
    const children = this.roadGaps.getChildren();
    for (let i = 0; i < children.length; i++) {
      const gap = children[i] as Phaser.Physics.Arcade.Sprite;
      if (gap && gap.active) {
        const w = (gap.getData('gapWidth') as number) || 140;
        gap.y = centerY;
        gap.setDisplaySize(w, totalVisualH);
      }
    }
  }

  private spawnRoadGap(
    centerX: number,
    gapWidth: number,
    groundHeight: number,
    viewportHeight: number,
    speed: number
  ) {
    const deckBackPx = Math.round(14 * (groundHeight / 96));
    const totalVisualH = groundHeight + deckBackPx;
    const centerY = viewportHeight - totalVisualH / 2;
    const gap = this.roadGaps.get(centerX, centerY, 'road_gap') as Phaser.Physics.Arcade.Sprite | null;
    if (gap) {
      gap.setData('gapWidth', gapWidth);
      gap.enableBody(true, centerX, centerY, true, true);
      gap.setDisplaySize(gapWidth, totalVisualH);
      gap.setDepth(3);
      if (gap.body) {
        const body = gap.body as Phaser.Physics.Arcade.Body;
        body.setAllowGravity(false);
        body.immovable = true;
        gap.setVelocityX(-speed);
      }
    }
  }

  private spawnPlatform(x: number, y: number, speed: number) {
    const platform = this.platforms.get(x, y, 'sky_platform') as Phaser.Physics.Arcade.Sprite | null;
    if (platform) {
      platform.setData('landedByRun', false);
      platform.enableBody(true, x, y, true, true);
      platform.setDepth(5);
      if (platform.body) {
        const body = platform.body as Phaser.Physics.Arcade.Body;
        body.setAllowGravity(false);
        body.immovable = true;
        body.checkCollision.up = true;
        body.checkCollision.down = false;
        body.checkCollision.left = false;
        body.checkCollision.right = false;
        body.setSize(176, 16);
        body.setOffset(2, 2);
        platform.setVelocityX(-speed);
      }
    }
  }

  private spawnBarrier(x: number, groundTop: number, tall: boolean, speed: number) {
    const key = tall ? 'barrier_tall' : 'barrier';
    const halfH = tall ? 46 : 28;
    const y = groundTop - halfH;

    const obs = this.barriers.get(x, y, key) as Phaser.Physics.Arcade.Sprite | null;
    if (obs) {
      obs.setTexture(key);
      obs.enableBody(true, x, y, true, true);
      obs.setDepth(6);
      if (obs.body) {
        const body = obs.body as Phaser.Physics.Arcade.Body;
        body.setAllowGravity(false);
        body.immovable = true;
        body.setSize(tall ? 26 : 24, tall ? 86 : 50);
        body.setOffset(tall ? 11 : 10, 8);
        obs.setVelocityX(-speed);
      }
    }
  }

  private spawnLaserGate(x: number, y: number, speed: number) {
    const laser = this.lasers.get(x, y, 'laser_gate_warn') as Phaser.Physics.Arcade.Sprite | null;
    if (laser) {
      laser.setTexture('laser_gate_warn');
      laser.setData('laserState', 'warning');
      laser.setData('laserElapsedMs', Phaser.Math.Between(0, 350));
      laser.enableBody(true, x, y, true, true);
      laser.setDepth(6);
      if (laser.body) {
        const body = laser.body as Phaser.Physics.Arcade.Body;
        body.setAllowGravity(false);
        body.immovable = true;
        body.setSize(12, 112);
        body.setOffset(12, 11);
        laser.setVelocityX(-speed);
      }
    }
  }

  private spawnBoostRing(x: number, y: number, speed: number) {
    const ring = this.boostRings.get(x, y, 'boost_ring') as Phaser.Physics.Arcade.Sprite | null;
    if (ring) {
      ring.enableBody(true, x, y, true, true);
      ring.setDepth(5);
      if (ring.body) {
        const body = ring.body as Phaser.Physics.Arcade.Body;
        body.setAllowGravity(false);
        body.setSize(28, 52);
        body.setOffset(6, 6);
        ring.setVelocityX(-speed);
      }
    }
  }

  private spawnDrone(x: number, y: number, speed: number, armored: boolean = false) {
    const initialKey = armored ? 'drone_armored_0' : 'drone_0';
    const drone = this.drones.get(x, y, initialKey) as Phaser.Physics.Arcade.Sprite | null;
    if (drone) {
      drone.clearTint();
      drone.enableBody(true, x, y, true, true);
      drone.setDepth(7);
      drone.setData('baseY', y);
      drone.setData('phase', Phaser.Math.FloatBetween(0, Math.PI * 2));
      drone.setData('hp', armored ? 2 : 1);
      drone.setData('armored', armored);
      drone.play(armored ? 'anim_drone_armored' : 'anim_drone', true);
      if (drone.body) {
        const body = drone.body as Phaser.Physics.Arcade.Body;
        body.setAllowGravity(false);
        body.immovable = true;
        body.setSize(armored ? 38 : 34, armored ? 30 : 26);
        body.setOffset(armored ? 9 : 8, armored ? 9 : 8);
        drone.setVelocityX(-speed * (armored ? 1.06 : 1.12));
      }
    }
  }

  private spawnCoinArc(
    startX: number,
    peakBaseY: number,
    count: number,
    speed: number,
    safeTopY: number = 76
  ) {
    const arcLift = peakBaseY - safeTopY < 50 ? 24 : 42;
    for (let i = 0; i < count; i++) {
      const cx = startX + i * 44;
      const cy = Math.max(
        safeTopY + 10,
        peakBaseY - Math.sin((i / Math.max(1, count - 1)) * Math.PI) * arcLift
      );
      this.spawnSingleCoin(cx, cy, speed);
    }
  }

  private spawnCoinLine(startX: number, y: number, count: number, speed: number) {
    for (let i = 0; i < count; i++) {
      this.spawnSingleCoin(startX + i * 42, y, speed);
    }
  }

  private spawnSingleCoin(x: number, y: number, speed: number) {
    const coin = this.coins.get(x, y, 'coin_0') as Phaser.Physics.Arcade.Sprite | null;
    if (coin) {
      coin.enableBody(true, x, y, true, true);
      coin.setDepth(6);
      coin.play('anim_coin', true);
      if (coin.body) {
        const body = coin.body as Phaser.Physics.Arcade.Body;
        body.setAllowGravity(false);
        coin.setVelocityX(-speed);
      }
    }
  }

  private spawnPowerup(x: number, y: number, type: 'shield' | 'magnet', speed: number) {
    const key = type === 'shield' ? 'powerup_shield' : 'powerup_magnet';
    const item = this.powerups.get(x, y, key) as Phaser.Physics.Arcade.Sprite | null;
    if (item) {
      item.setTexture(key);
      item.setData('powerupType', type);
      item.setData('baseY', y);
      item.enableBody(true, x, y, true, true);
      item.setDepth(6);
      if (item.body) {
        const body = item.body as Phaser.Physics.Arcade.Body;
        body.setAllowGravity(false);
        item.setVelocityX(-speed * 0.96);
      }
    }
  }

  reset() {
    const deactivateAll = (group: Phaser.Physics.Arcade.Group) => {
      const children = group.getChildren();
      for (let i = 0; i < children.length; i++) {
        const obj = children[i] as Phaser.Physics.Arcade.Sprite;
        if (obj) obj.disableBody(true, true);
      }
    };

    deactivateAll(this.barriers);
    deactivateAll(this.lasers);
    deactivateAll(this.drones);
    deactivateAll(this.missiles);
    deactivateAll(this.platforms);
    deactivateAll(this.roadGaps);
    deactivateAll(this.boostRings);
    deactivateAll(this.coins);
    deactivateAll(this.powerups);

    for (let i = 0; i < this.warnings.length; i++) {
      this.warnings[i].sprite.destroy();
    }
    this.warnings = [];

    this.distanceUntilNextPattern = 200;
    this.distanceSincePowerup = 0;
    this.distanceSinceMissile = 0;
    this.nextMissileDistance = 1400;
    this.recentPatterns = [];
    this.chainRemaining = 0;
  }
}
