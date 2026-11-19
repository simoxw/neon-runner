import Phaser from 'phaser';
import {
  GAME_CONFIG,
  getBlasterCooldownMs,
  getMagnetRadiusPx,
  getSkinConfig,
} from '../../constants';
import { SkinId } from '../../types';
import { soundEngine } from '../../utils/sound';

export class Player extends Phaser.Physics.Arcade.Sprite {
  public bullets: Phaser.Physics.Arcade.Group | null = null;
  public particles: Phaser.GameObjects.Particles.ParticleEmitter | null = null;
  public shieldRing: Phaser.GameObjects.Arc;
  public magnetRing: Phaser.GameObjects.Arc;
  public overdriveRing: Phaser.GameObjects.Arc;

  public isHoldingJump: boolean = false;
  public isJumping: boolean = false;
  public isGliding: boolean = false;
  public isDead: boolean = false;

  public jumpHoldTimer: number = 0;
  public lastGroundedTime: number = 0;
  public jumpPressedTime: number = -9999;
  public nextFire: number = 0;
  public invulnUntil: number = 0;

  public shieldRemaining: number = 0;
  public shieldMax: number = 6000;
  public magnetRemaining: number = 0;
  public magnetMax: number = 7000;

  public overdriveCharge: number = 0;
  public overdriveRemaining: number = 0;
  public overdriveMax: number = GAME_CONFIG.OVERDRIVE_DURATION_MS;

  public blasterLevel: number = 0;
  public magnetLevel: number = 0;
  public skinId: SkinId = 'cyan';

  private isPausedSupplier: () => boolean;
  private onBuffChange: () => void;

  declare public body: Phaser.Physics.Arcade.Body;

  constructor(
    scene: Phaser.Scene,
    x: number,
    y: number,
    isPausedSupplier: () => boolean,
    onBuffChange: () => void
  ) {
    super(scene, x, y, 'player_run_0');

    this.isPausedSupplier = isPausedSupplier;
    this.onBuffChange = onBuffChange;

    scene.add.existing(this);
    scene.physics.add.existing(this);

    this.setCollideWorldBounds(true);

    if (this.body) {
      this.body.setGravityY(GAME_CONFIG.GRAVITY);
      this.body.setSize(28, 52);
      this.body.setOffset(10, 10);
    }

    // Aura rings for Overdrive, Magnet, and Shield
    this.overdriveRing = scene.add.circle(x, y, 48, 0xffc857, 0.2);
    this.overdriveRing.setStrokeStyle(3, 0xffc857, 0.95);
    this.overdriveRing.setVisible(false);

    this.magnetRing = scene.add.circle(x, y, 42, 0xffc857, 0.08);
    this.magnetRing.setStrokeStyle(2, 0xffc857, 0.65);
    this.magnetRing.setVisible(false);

    this.shieldRing = scene.add.circle(x, y, 36, 0x00f3ff, 0.14);
    this.shieldRing.setStrokeStyle(2.5, 0x00f3ff, 0.9);
    this.shieldRing.setVisible(false);

    this.bullets = scene.physics.add.group({
      defaultKey: 'bullet',
      maxSize: 16,
    });

    if (scene.textures.exists('particle')) {
      this.particles = scene.add.particles(0, 0, 'particle', {
        speed: { min: 70, max: 140 },
        angle: { min: 155, max: 215 },
        scale: { start: 1.1, end: 0 },
        blendMode: Phaser.BlendModes.ADD,
        lifespan: 240,
        emitting: false,
      });
      this.particles.startFollow(this, -16, 10);
    }

    this.applySkinVisuals();
    this.play('anim_player_run');
  }

  public get overdriveActive(): boolean {
    return this.overdriveRemaining > 0;
  }

  public setUpgradeLevels(blasterLevel: number, magnetLevel: number) {
    this.blasterLevel = blasterLevel;
    this.magnetLevel = magnetLevel;
  }

  public setSkin(skinId: SkinId) {
    this.skinId = skinId;
    this.applySkinVisuals();
  }

  private applySkinVisuals() {
    if (this.isDead) return;
    const skin = getSkinConfig(this.skinId);
    if (this.overdriveActive) {
      this.setTint(0xffe066);
      if (this.particles) this.particles.particleTint = 0xffc857;
    } else {
      if (skin.bodyTint === 0xffffff) {
        this.clearTint();
      } else {
        this.setTint(skin.bodyTint);
      }
      if (this.particles) this.particles.particleTint = skin.trailTint;
    }
  }

  public getMagnetRadius(): number {
    return getMagnetRadiusPx(this.magnetLevel);
  }

  public handlePress(now: number) {
    if (this.isDead || this.isPausedSupplier()) return;
    soundEngine.unlock();
    this.isHoldingJump = true;
    this.jumpPressedTime = now;

    if (this.canJumpNow(now)) {
      this.executeJump();
    }
  }

  public handleRelease() {
    this.isHoldingJump = false;
    this.isGliding = false;

    // Variable jump height cut when releasing early while still moving upward
    if (this.isJumping && this.body && this.body.velocity.y < -90) {
      this.body.velocity.y *= GAME_CONFIG.PLAYER_JUMP_CUT_MULTIPLIER;
    }

    if (this.particles && this.particles.emitting && !this.overdriveActive) {
      this.particles.stop();
    }
  }

  private canJumpNow(now: number): boolean {
    if (!this.body) return false;
    const isGrounded = this.body.blocked.down || this.body.touching.down;
    const withinCoyote = now - this.lastGroundedTime <= GAME_CONFIG.COYOTE_TIME_MS;
    return isGrounded || (withinCoyote && !this.isJumping);
  }

  private executeJump() {
    if (!this.body) return;
    this.setVelocityY(GAME_CONFIG.PLAYER_JUMP_INITIAL);
    this.isJumping = true;
    this.jumpHoldTimer = 0;
    this.jumpPressedTime = -9999;
    soundEngine.playJump();
  }

  public activateShield(durationMs: number) {
    this.shieldMax = durationMs;
    this.shieldRemaining = durationMs;
    this.shieldRing.setVisible(true);
    this.onBuffChange();
  }

  public activateMagnet(durationMs: number) {
    this.magnetMax = durationMs;
    this.magnetRemaining = durationMs;
    this.magnetRing.setVisible(true);
    this.onBuffChange();
  }

  public addOverdriveCharge(amount: number) {
    if (this.isDead || this.overdriveActive) return;
    this.overdriveCharge = Math.min(100, this.overdriveCharge + amount);
    if (this.overdriveCharge >= 100) {
      this.activateOverdrive();
    } else {
      this.onBuffChange();
    }
  }

  public activateOverdrive() {
    this.overdriveCharge = 0;
    this.overdriveMax = GAME_CONFIG.OVERDRIVE_DURATION_MS;
    this.overdriveRemaining = this.overdriveMax;
    this.setScale(1.18);
    this.overdriveRing.setVisible(true);
    this.applySkinVisuals();
    soundEngine.playOverdriveStart();
    this.onBuffChange();
  }

  public consumeShield(now: number): boolean {
    if (this.shieldRemaining <= 0) return false;
    this.shieldRemaining = 0;
    this.shieldRing.setVisible(false);
    this.invulnUntil = now + 1150;
    soundEngine.playShieldBreak();
    this.onBuffChange();
    return true;
  }

  public isInvulnerable(now: number): boolean {
    return now < this.invulnUntil || this.overdriveActive;
  }

  update(time: number, delta: number, isRunning: boolean) {
    this.overdriveRing.setPosition(this.x, this.y);
    this.shieldRing.setPosition(this.x, this.y);
    this.magnetRing.setPosition(this.x, this.y);

    if (this.isDead) return;

    const isGrounded = Boolean(this.body && (this.body.blocked.down || this.body.touching.down));
    if (isGrounded) {
      this.lastGroundedTime = time;
      if (this.isJumping && this.body.velocity.y >= 0) {
        this.isJumping = false;
      }

      if (isRunning && time - this.jumpPressedTime <= GAME_CONFIG.JUMP_BUFFER_MS) {
        this.executeJump();
      }
    }

    // Variable jump hold boost while ascending
    if (
      isRunning &&
      this.isHoldingJump &&
      this.isJumping &&
      this.jumpHoldTimer < GAME_CONFIG.MAX_JUMP_HOLD_MS &&
      this.body &&
      this.body.velocity.y < 0
    ) {
      this.jumpHoldTimer += delta;
      const dtSec = delta / 1000;
      this.body.velocity.y += GAME_CONFIG.PLAYER_JUMP_HOLD_ACCEL * dtSec;
    }

    // Fluid thruster glide while holding during descent
    if (isRunning && this.isHoldingJump && !isGrounded && this.body && this.body.velocity.y > 0) {
      this.isGliding = true;
      const dtSec = delta / 1000;
      const factor = 1 - Math.exp(-12 * dtSec);
      this.body.velocity.y = Phaser.Math.Linear(
        this.body.velocity.y,
        GAME_CONFIG.GLIDE_MAX_FALL_SPEED,
        factor
      );
      if (this.particles && !this.particles.emitting) {
        this.particles.start();
      }
      soundEngine.playGlidePulse(time);
    } else {
      this.isGliding = false;
      if (this.overdriveActive) {
        if (this.particles && !this.particles.emitting) {
          this.particles.start();
        }
      } else if (this.particles && this.particles.emitting) {
        this.particles.stop();
      }
    }

    // Animation state transitions
    if (!isGrounded) {
      if (this.isGliding) {
        if (this.texture.key !== 'player_glide') {
          this.stop();
          this.setTexture('player_glide');
        }
      } else if (this.texture.key !== 'player_jump') {
        this.stop();
        this.setTexture('player_jump');
      }
    } else if (!this.anims.isPlaying || this.anims.currentAnim?.key !== 'anim_player_run') {
      this.play('anim_player_run', true);
    }

    // Invulnerability flicker (when not in overdrive)
    if (!this.overdriveActive && time < this.invulnUntil) {
      this.setAlpha(Math.floor(time / 70) % 2 === 0 ? 0.45 : 1);
    } else if (this.alpha !== 1) {
      this.setAlpha(1);
    }

    if (!isRunning) return;

    // Buff countdowns
    let buffChanged = false;

    if (this.overdriveRemaining > 0) {
      this.overdriveRemaining = Math.max(0, this.overdriveRemaining - delta);
      const pulse = 1 + Math.sin(time * 0.018) * 0.1;
      this.overdriveRing.setScale(pulse);
      if (this.overdriveRemaining < 1200) {
        this.overdriveRing.setAlpha(Math.floor(time / 70) % 2 === 0 ? 0.3 : 0.9);
      } else {
        this.overdriveRing.setAlpha(0.9);
      }

      if (this.overdriveRemaining === 0) {
        this.overdriveRing.setVisible(false);
        this.setScale(1);
        this.invulnUntil = time + 1000;
        this.applySkinVisuals();
        buffChanged = true;
      }
    }

    if (this.shieldRemaining > 0) {
      this.shieldRemaining = Math.max(0, this.shieldRemaining - delta);
      const pulse = 1 + Math.sin(time * 0.01) * 0.06;
      this.shieldRing.setScale(pulse);
      if (this.shieldRemaining < 1800) {
        this.shieldRing.setAlpha(Math.floor(time / 90) % 2 === 0 ? 0.35 : 0.9);
      } else {
        this.shieldRing.setAlpha(0.9);
      }
      if (this.shieldRemaining === 0) {
        this.shieldRing.setVisible(false);
        buffChanged = true;
      }
    }

    if (this.magnetRemaining > 0) {
      this.magnetRemaining = Math.max(0, this.magnetRemaining - delta);
      const pulse = 1 + Math.cos(time * 0.012) * 0.08;
      this.magnetRing.setScale(pulse);
      if (this.magnetRemaining === 0) {
        this.magnetRing.setVisible(false);
        buffChanged = true;
      }
    }

    if (buffChanged) {
      this.onBuffChange();
    }

    // Auto-blaster scaled by upgrade level
    const cooldown = getBlasterCooldownMs(this.blasterLevel);
    if (time > this.nextFire) {
      this.shoot();
      this.nextFire = time + cooldown;
    }

    // Clean up off-screen bullets
    if (this.bullets) {
      const bulletChildren = this.bullets.getChildren();
      for (let i = 0; i < bulletChildren.length; i++) {
        const b = bulletChildren[i] as Phaser.Physics.Arcade.Sprite;
        if (b && b.active && b.x > this.scene.scale.width + 60) {
          b.disableBody(true, true);
        }
      }
    }
  }

  shoot() {
    if (!this.bullets || !this.active || this.isDead) return;
    const bullet = this.bullets.get(this.x + 28, this.y - 2, 'bullet') as Phaser.Physics.Arcade.Sprite | null;
    if (bullet) {
      const skin = getSkinConfig(this.skinId);
      bullet.enableBody(true, this.x + 28, this.y - 2, true, true);
      bullet.setTint(this.overdriveActive ? 0xffc857 : skin.bulletTint);
      if (bullet.body) {
        const body = bullet.body as Phaser.Physics.Arcade.Body;
        body.setAllowGravity(false);
        bullet.setVelocityX(940);
      }
      soundEngine.playLaser();
    }
  }

  die() {
    this.isDead = true;
    this.isHoldingJump = false;
    this.isGliding = false;
    this.stop();
    this.setScale(1);
    this.setTint(0xff2a6d);
    this.setVelocity(0, 0);
    this.shieldRemaining = 0;
    this.magnetRemaining = 0;
    this.overdriveRemaining = 0;
    this.overdriveCharge = 0;
    this.shieldRing.setVisible(false);
    this.magnetRing.setVisible(false);
    this.overdriveRing.setVisible(false);
    if (this.particles && this.particles.emitting) {
      this.particles.stop();
    }
  }

  reset(x: number, y: number) {
    this.isDead = false;
    this.isHoldingJump = false;
    this.isJumping = false;
    this.isGliding = false;
    this.jumpHoldTimer = 0;
    this.jumpPressedTime = -9999;
    this.invulnUntil = 0;
    this.shieldRemaining = 0;
    this.magnetRemaining = 0;
    this.overdriveRemaining = 0;
    this.overdriveCharge = 0;

    this.setActive(true).setVisible(true);
    this.setScale(1);
    this.setPosition(x, y);
    this.setAlpha(1);
    this.setVelocity(0, 0);
    this.shieldRing.setVisible(false);
    this.magnetRing.setVisible(false);
    this.overdriveRing.setVisible(false);
    this.applySkinVisuals();
    this.play('anim_player_run', true);

    if (this.particles && this.particles.emitting) {
      this.particles.stop();
    }
    if (this.bullets) {
      const bulletChildren = this.bullets.getChildren();
      for (let i = 0; i < bulletChildren.length; i++) {
        const b = bulletChildren[i] as Phaser.Physics.Arcade.Sprite;
        if (b) b.disableBody(true, true);
      }
    }
  }
}
