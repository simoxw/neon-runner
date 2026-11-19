import Phaser from 'phaser';
import { GAME_CONFIG, getGroundHeight } from '../../constants';
import { Player } from './Player';

export class ObstacleManager {
  public scene: Phaser.Scene;
  public barriers: Phaser.Physics.Arcade.Group;
  public drones: Phaser.Physics.Arcade.Group;
  public coins: Phaser.Physics.Arcade.Group;
  public powerups: Phaser.Physics.Arcade.Group;

  private distanceUntilNextPattern: number = 220;
  private distanceSincePowerup: number = 0;

  constructor(scene: Phaser.Scene) {
    this.scene = scene;

    this.barriers = scene.physics.add.group({
      defaultKey: 'barrier',
      maxSize: GAME_CONFIG.POOL_SIZE,
    });

    this.drones = scene.physics.add.group({
      defaultKey: 'drone_0',
      maxSize: 12,
    });

    this.coins = scene.physics.add.group({
      defaultKey: 'coin_0',
      maxSize: 32,
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
    player: Player | null
  ) {
    const dtSec = delta / 1000;
    const dx = speed * dtSec;

    this.distanceUntilNextPattern -= dx;
    this.distanceSincePowerup += dx;

    if (this.distanceUntilNextPattern <= 0) {
      const patternWidth = this.spawnPattern(speed);
      const minSafeGap = Math.max(290, speed * 0.66);
      const maxGap = Math.max(430, speed * 0.96);
      this.distanceUntilNextPattern = patternWidth + Phaser.Math.Between(minSafeGap, maxGap);
    }

    // Move barriers
    this.updateGroupMovement(this.barriers, speed);

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
    const magnetActive = Boolean(player && player.magnetRemaining > 0 && !player.isDead);
    const magnetRadius = player ? player.getMagnetRadius() : 200;
    const coinChildren = this.coins.getChildren();

    for (let i = 0; i < coinChildren.length; i++) {
      const coin = coinChildren[i] as Phaser.Physics.Arcade.Sprite;
      if (coin && coin.active) {
        if (magnetActive && player) {
          const dist = Phaser.Math.Distance.Between(coin.x, coin.y, player.x, player.y);
          if (dist < magnetRadius) {
            const angle = Phaser.Math.Angle.Between(coin.x, coin.y, player.x, player.y);
            const pullSpeed = Math.max(speed * 1.4, 680);
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

  private updateGroupMovement(group: Phaser.Physics.Arcade.Group, speed: number) {
    const children = group.getChildren();
    for (let i = 0; i < children.length; i++) {
      const obj = children[i] as Phaser.Physics.Arcade.Sprite;
      if (obj && obj.active) {
        obj.setVelocityX(-speed);
        if (obj.x < -120) {
          obj.disableBody(true, true);
        }
      }
    }
  }

  private spawnPattern(speed: number): number {
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
      this.spawnCoinArc(startX + 120, clampY(groundTop - Math.min(82, usableHeight * 0.42)), 3, speed, safeTopY);
      return 220;
    }

    const roll = Phaser.Math.Between(0, 99);

    if (roll < 28) {
      // Pattern 1: Single low barrier + rewarding coin arc overhead
      this.spawnBarrier(startX, groundTop, false, speed);
      this.spawnCoinArc(startX - 45, clampY(groundTop - Math.min(92, usableHeight * 0.48)), 3, speed, safeTopY);
      return 120;
    } else if (roll < 52) {
      // Pattern 2: Tall barrier (encourages holding jump) + glide coin trail
      this.spawnBarrier(startX, groundTop, true, speed);
      this.spawnCoinArc(startX + 55, clampY(groundTop - Math.min(138, usableHeight * 0.68)), 4, speed, safeTopY);
      return 190;
    } else if (roll < 76) {
      // Pattern 3: Destructible Cyber Drone(s) + coins behind
      const droneCount = speed > 560 ? 2 : 1;
      const minDroneY = safeTopY + 14;
      const maxDroneY = Math.max(minDroneY + 10, groundTop - 75);
      for (let i = 0; i < droneCount; i++) {
        const dy = Phaser.Math.Between(minDroneY, maxDroneY);
        this.spawnDrone(startX + i * 165, dy, speed);
      }
      this.spawnCoinLine(startX + 30, clampY(groundTop - 44), 3, speed);
      return droneCount === 2 ? 220 : 120;
    } else if (roll < 90) {
      // Pattern 4: Low barrier followed by hovering drone
      this.spawnBarrier(startX, groundTop, false, speed);
      const spacing = Math.max(250, speed * 0.52);
      const droneY = clampY(groundTop - Math.min(130, usableHeight * 0.6));
      this.spawnDrone(startX + spacing, droneY, speed);
      this.spawnCoinArc(startX + spacing * 0.45, droneY, 3, speed, safeTopY);
      return spacing + 80;
    } else {
      // Pattern 5: Safe coin streak
      this.spawnCoinLine(startX, clampY(groundTop - 48), 5, speed);
      return 180;
    }
  }

  private spawnBarrier(x: number, groundTop: number, tall: boolean, speed: number) {
    const key = tall ? 'barrier_tall' : 'barrier';
    const halfH = tall ? 47 : 29;
    const y = groundTop - halfH;

    const obs = this.barriers.get(x, y, key) as Phaser.Physics.Arcade.Sprite | null;
    if (obs) {
      obs.setTexture(key);
      obs.enableBody(true, x, y, true, true);
      if (obs.body) {
        const body = obs.body as Phaser.Physics.Arcade.Body;
        body.setAllowGravity(false);
        body.immovable = true;
        body.setSize(tall ? 26 : 24, tall ? 86 : 50);
        body.setOffset(tall ? 9 : 8, tall ? 6 : 6);
        obs.setVelocityX(-speed);
      }
    }
  }

  private spawnDrone(x: number, y: number, speed: number) {
    const drone = this.drones.get(x, y, 'drone_0') as Phaser.Physics.Arcade.Sprite | null;
    if (drone) {
      drone.enableBody(true, x, y, true, true);
      drone.setData('baseY', y);
      drone.setData('phase', Phaser.Math.FloatBetween(0, Math.PI * 2));
      drone.play('anim_drone', true);
      if (drone.body) {
        const body = drone.body as Phaser.Physics.Arcade.Body;
        body.setAllowGravity(false);
        body.immovable = true;
        body.setSize(34, 26);
        body.setOffset(7, 7);
        drone.setVelocityX(-speed * 1.12);
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
    deactivateAll(this.drones);
    deactivateAll(this.coins);
    deactivateAll(this.powerups);

    this.distanceUntilNextPattern = 200;
    this.distanceSincePowerup = 0;
  }
}
