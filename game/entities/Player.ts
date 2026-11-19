import Phaser from 'phaser';
import {
  GAME_CONFIG,
  getBlasterCooldownMs,
  getJetpackMaxFuelMs,
  getJetpackMaxRiseSpeed,
  getMagnetRadiusPx,
  getSkinConfig,
  isDualPulseBlaster,
} from '../../constants';
import { SkinId } from '../../types';
import { computeRefilledFuel } from '../../utils/gameRules';
import { soundEngine } from '../../utils/sound';

export class Player extends Phaser.Physics.Arcade.Sprite {
  public bullets: Phaser.Physics.Arcade.Group | null = null;
  public particles: Phaser.GameObjects.Particles.ParticleEmitter | null = null;
  private burstParticles: Phaser.GameObjects.Particles.ParticleEmitter | null = null;
  public shieldRing: Phaser.GameObjects.Arc;
  public magnetRing: Phaser.GameObjects.Arc;
  public overdriveRing: Phaser.GameObjects.Arc;

  private jetpackBarBg: Phaser.GameObjects.Rectangle;
  private jetpackBarFill: Phaser.GameObjects.Rectangle;

  public isHoldingJump: boolean = false;
  public isJumping: boolean = false;
  public isGliding: boolean = false;
  public hasDoubleJump: boolean = true;
  public isDead: boolean = false;

  public jumpHoldTimer: number = 0;
  public jetpackFuelMs: number = GAME_CONFIG.JETPACK_MAX_FUEL_MS;
  public lastGroundedTime: number = 0;
  public jumpPressedTime: number = -9999;
  public nextFire: number = 0;
  public invulnUntil: number = 0;
  private wasGrounded: boolean = true;
  private squashX: number = 1;
  private squashY: number = 1;
  private afterimageTimer: number = 0;

  public shieldRemaining: number = 0;
  public shieldMax: number = 6000;
  public magnetRemaining: number = 0;
  public magnetMax: number = 7000;

  public overdriveCharge: number = 0;
  public overdriveRemaining: number = 0;
  public overdriveMax: number = GAME_CONFIG.OVERDRIVE_DURATION_MS;

  public doubleJumpsUsed: number = 0;
  public overdrivesTriggered: number = 0;

  public blasterLevel: number = 0;
  public magnetLevel: number = 0;
  public jetpackLevel: number = 0;
  public skinId: SkinId = 'cyan';

  private isPausedSupplier: () => boolean;
  private onBuffChange: () => void;
  private onStatsChange: () => void;

  declare public body: Phaser.Physics.Arcade.Body;

  constructor(
    scene: Phaser.Scene,
    x: number,
    y: number,
    isPausedSupplier: () => boolean,
    onBuffChange: () => void,
    onStatsChange: () => void = () => {}
  ) {
    super(scene, x, y, 'player_run_0');

    this.isPausedSupplier = isPausedSupplier;
    this.onBuffChange = onBuffChange;
    this.onStatsChange = onStatsChange;

    scene.add.existing(this);
    scene.physics.add.existing(this);

    this.setCollideWorldBounds(true);
    this.setDepth(10);

    if (this.body) {
      this.body.setGravityY(GAME_CONFIG.GRAVITY);
      this.body.setSize(28, 52);
      this.body.setOffset(10, 10);
    }

    // Aura rings for Overdrive, Magnet, and Shield
    this.overdriveRing = scene.add.circle(x, y, 48, 0xffc857, 0.2);
    this.overdriveRing.setStrokeStyle(3, 0xffc857, 0.95);
    this.overdriveRing.setDepth(9);
    this.overdriveRing.setVisible(false);

    this.magnetRing = scene.add.circle(x, y, 42, 0xffc857, 0.08);
    this.magnetRing.setStrokeStyle(2, 0xffc857, 0.65);
    this.magnetRing.setDepth(9);
    this.magnetRing.setVisible(false);

    this.shieldRing = scene.add.circle(x, y, 36, 0x00f3ff, 0.14);
    this.shieldRing.setStrokeStyle(2.5, 0x00f3ff, 0.9);
    this.shieldRing.setDepth(9);
    this.shieldRing.setVisible(false);

    // Subtle in-flight Jetpack fuel bar directly below runner
    this.jetpackBarBg = scene.add.rectangle(x, y + 38, 34, 4, 0x06070d, 0.85);
    this.jetpackBarBg.setStrokeStyle(1, 0xffffff, 0.25);
    this.jetpackBarBg.setDepth(11);
    this.jetpackBarBg.setVisible(false);

    this.jetpackBarFill = scene.add.rectangle(x - 16, y + 38, 32, 2, 0x00f3ff, 1);
    this.jetpackBarFill.setOrigin(0, 0.5);
    this.jetpackBarFill.setDepth(12);
    this.jetpackBarFill.setVisible(false);

    this.bullets = scene.physics.add.group({
      defaultKey: 'bullet',
      maxSize: 16,
    });

    if (scene.textures.exists('particle')) {
      this.particles = scene.add.particles(0, 0, 'particle', {
        speed: { min: 70, max: 140 },
        angle: { min: 155, max: 215 },
        scale: { start: 1.15, end: 0 },
        blendMode: Phaser.BlendModes.ADD,
        lifespan: 240,
        frequency: 28,
        emitting: false,
      });
      this.particles.setDepth(9);
      this.particles.startFollow(this, -16, 10);

      this.burstParticles = scene.add.particles(0, 0, 'particle', {
        speed: { min: 55, max: 135 },
        angle: { min: 150, max: 225 },
        scale: { start: 1.1, end: 0 },
        blendMode: Phaser.BlendModes.ADD,
        lifespan: 240,
        emitting: false,
      });
      this.burstParticles.setDepth(9);
    }

    this.applySkinVisuals();
    this.play('anim_player_run');
  }

  public get overdriveActive(): boolean {
    return this.overdriveRemaining > 0;
  }

  public setUpgradeLevels(
    blasterLevel: number,
    magnetLevel: number,
    jetpackLevel: number = 0
  ) {
    this.blasterLevel = blasterLevel;
    this.magnetLevel = magnetLevel;
    this.jetpackLevel = jetpackLevel;
    this.jetpackFuelMs = Math.min(this.jetpackFuelMs, this.getMaxJetpackFuelMs());
  }

  public getMaxJetpackFuelMs(): number {
    return getJetpackMaxFuelMs(this.jetpackLevel);
  }

  public refillJetpack() {
    this.jetpackFuelMs = computeRefilledFuel(this.jetpackFuelMs, this.getMaxJetpackFuelMs());
    this.hasDoubleJump = true;
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
      if (this.burstParticles) this.burstParticles.particleTint = 0xffc857;
      this.jetpackBarFill.setFillStyle(0xffc857, 1);
    } else {
      if (skin.bodyTint === 0xffffff) {
        this.clearTint();
      } else {
        this.setTint(skin.bodyTint);
      }
      if (this.particles) this.particles.particleTint = skin.trailTint;
      if (this.burstParticles) this.burstParticles.particleTint = skin.trailTint;
      this.jetpackBarFill.setFillStyle(skin.trailTint, 1);
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
    } else if (this.body && !this.isGroundedNow() && this.hasDoubleJump) {
      this.executeDoubleJump();
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

  private isGroundedNow(): boolean {
    return Boolean(this.body && (this.body.blocked.down || this.body.touching.down));
  }

  private canJumpNow(now: number): boolean {
    if (!this.body) return false;
    const isGrounded = this.isGroundedNow();
    const withinCoyote = now - this.lastGroundedTime <= GAME_CONFIG.COYOTE_TIME_MS;
    return isGrounded || (withinCoyote && !this.isJumping);
  }

  private executeJump() {
    if (!this.body) return;
    this.setVelocityY(GAME_CONFIG.PLAYER_JUMP_INITIAL);
    this.isJumping = true;
    this.hasDoubleJump = true;
    this.jumpHoldTimer = 0;
    this.jumpPressedTime = -9999;
    this.squashX = 0.88;
    this.squashY = 1.14;
    this.burstParticles?.explode(6, this.x - 8, this.y + 24);
    soundEngine.playJump();
  }

  private executeDoubleJump() {
    if (!this.body) return;
    this.setVelocityY(GAME_CONFIG.DOUBLE_JUMP_VELOCITY);
    this.hasDoubleJump = false;
    this.isJumping = true;
    this.isGliding = false;
    this.jumpHoldTimer = GAME_CONFIG.MAX_JUMP_HOLD_MS;
    this.jumpPressedTime = -9999;
    this.doubleJumpsUsed += 1;
    this.squashX = 0.82;
    this.squashY = 1.2;

    this.burstParticles?.explode(14, this.x - 8, this.y + 22);
    soundEngine.playDoubleJump();
    this.onStatsChange();
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
    this.overdrivesTriggered += 1;
    this.overdriveRing.setVisible(true);
    this.applySkinVisuals();
    soundEngine.playOverdriveStart();
    this.onBuffChange();
    this.onStatsChange();
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

  private spawnAfterimage() {
    if (!this.scene || !this.visible) return;
    const skin = getSkinConfig(this.skinId);
    const ghost = this.scene.add.image(this.x - 4, this.y, this.texture.key);
    ghost.setDepth(this.depth - 1);
    ghost.setScale(this.scaleX, this.scaleY);
    ghost.setAlpha(this.overdriveActive ? 0.38 : 0.24);
    ghost.setTint(this.overdriveActive ? 0xffc857 : skin.trailTint);

    this.scene.tweens.add({
      targets: ghost,
      x: this.x - 46,
      alpha: 0,
      scaleX: this.scaleX * 0.9,
      scaleY: this.scaleY * 0.9,
      duration: 160,
      ease: 'Quad.easeOut',
      onComplete: () => ghost.destroy(),
    });
  }

  update(time: number, delta: number, isRunning: boolean) {
    const dtSec = delta / 1000;

    this.overdriveRing.setPosition(this.x, this.y);
    this.shieldRing.setPosition(this.x, this.y);
    this.magnetRing.setPosition(this.x, this.y);

    if (this.isDead) return;

    const isGrounded = this.isGroundedNow();
    if (isGrounded) {
      if (!this.wasGrounded) {
        this.burstParticles?.explode(8, this.x - 6, this.y + 26);
        soundEngine.playLand();
      }
      if (!this.isJumping) {
        this.squashX = 1;
        this.squashY = 1;
      }
      this.hasDoubleJump = true;
      this.jetpackFuelMs = this.getMaxJetpackFuelMs();
      this.lastGroundedTime = time;

      if (this.isJumping && this.body.velocity.y >= 0) {
        this.isJumping = false;
      }

      if (isRunning && time - this.jumpPressedTime <= GAME_CONFIG.JUMP_BUFFER_MS) {
        this.executeJump();
      }
    }
    this.wasGrounded = isGrounded;

    // Smooth squash & stretch recovery in mid-air with physics hitbox compensation
    if (!isGrounded) {
      const damp = 1 - Math.exp(-15 * dtSec);
      this.squashX = Phaser.Math.Linear(this.squashX, 1, damp);
      this.squashY = Phaser.Math.Linear(this.squashY, 1, damp);
    }
    const baseScale = this.overdriveActive ? 1.18 : 1;
    this.setScale(baseScale * this.squashX, baseScale * this.squashY);
    if (this.body) {
      this.body.setSize(28 / this.squashX, 52 / this.squashY);
      this.body.setOffset(24 - 14 / this.squashX, 32 - 22 / this.squashY);
    }

    // Primary jump hold extension vs active Jetpack Boost when holding in mid-air
    let usingJetpackNow = false;
    if (
      isRunning &&
      this.isHoldingJump &&
      this.isJumping &&
      this.jumpHoldTimer < GAME_CONFIG.MAX_JUMP_HOLD_MS &&
      this.body &&
      this.body.velocity.y < 0
    ) {
      this.jumpHoldTimer += delta;
      this.body.velocity.y += GAME_CONFIG.PLAYER_JUMP_HOLD_ACCEL * dtSec;
    } else if (isRunning && this.isHoldingJump && !isGrounded && this.body) {
      if (this.jetpackFuelMs > 0) {
        usingJetpackNow = true;
        this.isGliding = true;
        this.jetpackFuelMs = Math.max(0, this.jetpackFuelMs - delta);
        const maxRiseSpeed = getJetpackMaxRiseSpeed(this.jetpackLevel);
        this.body.velocity.y = Math.max(
          maxRiseSpeed,
          this.body.velocity.y + GAME_CONFIG.JETPACK_THRUST_ACCEL * dtSec
        );
        if (this.particles && !this.particles.emitting) {
          this.particles.start();
        }
        soundEngine.playGlidePulse(time);
      } else if (this.body.velocity.y > 0) {
        this.isGliding = true;
        const factor = 1 - Math.exp(-12 * dtSec);
        this.body.velocity.y = Phaser.Math.Linear(
          this.body.velocity.y,
          GAME_CONFIG.GLIDE_MAX_FALL_SPEED,
          factor
        );
      }
    }

    if (!usingJetpackNow && !(isRunning && this.isHoldingJump && !isGrounded)) {
      this.isGliding = false;
      if (this.overdriveActive) {
        if (this.particles && !this.particles.emitting) {
          this.particles.start();
        }
      } else if (this.particles && this.particles.emitting) {
        this.particles.stop();
      }
    }

    // Update subtle in-flight Jetpack fuel indicator
    const maxFuel = this.getMaxJetpackFuelMs();
    const showFuelBar = isRunning && !isGrounded && this.jetpackFuelMs < maxFuel;
    this.jetpackBarBg.setPosition(this.x, this.y + 38).setVisible(showFuelBar);
    if (showFuelBar) {
      const ratio = Math.max(0, this.jetpackFuelMs / maxFuel);
      this.jetpackBarFill
        .setPosition(this.x - 16, this.y + 38)
        .setScale(ratio, 1)
        .setVisible(true);
    } else {
      this.jetpackBarFill.setVisible(false);
    }

    // Afterimage trail during jumps, double-jump, and jetpack (never on ground walk)
    if (isRunning && (!isGrounded || this.isGliding)) {
      this.afterimageTimer += delta;
      const interval = 52;
      if (this.afterimageTimer >= interval) {
        this.afterimageTimer = 0;
        this.spawnAfterimage();
      }
    } else {
      this.afterimageTimer = 0;
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

  private spawnBulletAt(bx: number, by: number, tint: number) {
    if (!this.bullets) return;
    const bullet = this.bullets.get(bx, by, 'bullet') as Phaser.Physics.Arcade.Sprite | null;
    if (bullet) {
      bullet.enableBody(true, bx, by, true, true);
      bullet.setTint(tint);
      if (bullet.body) {
        const body = bullet.body as Phaser.Physics.Arcade.Body;
        body.setAllowGravity(false);
        bullet.setVelocityX(940);
      }
    }
  }

  shoot() {
    if (!this.bullets || !this.active || this.isDead) return;
    const skin = getSkinConfig(this.skinId);
    const tint = this.overdriveActive ? 0xffc857 : skin.bulletTint;

    if (isDualPulseBlaster(this.blasterLevel)) {
      this.spawnBulletAt(this.x + 28, this.y - 7, tint);
      this.spawnBulletAt(this.x + 28, this.y + 4, tint);
    } else {
      this.spawnBulletAt(this.x + 28, this.y - 2, tint);
    }
    soundEngine.playLaser();
  }

  die() {
    this.isDead = true;
    this.isHoldingJump = false;
    this.isGliding = false;
    this.squashX = 1;
    this.squashY = 1;
    this.stop();
    this.setScale(1, 1);
    this.setTint(0xff2a6d);
    this.setVelocity(0, 0);
    this.shieldRemaining = 0;
    this.magnetRemaining = 0;
    this.overdriveRemaining = 0;
    this.overdriveCharge = 0;
    this.shieldRing.setVisible(false);
    this.magnetRing.setVisible(false);
    this.overdriveRing.setVisible(false);
    this.jetpackBarBg.setVisible(false);
    this.jetpackBarFill.setVisible(false);
    if (this.particles && this.particles.emitting) {
      this.particles.stop();
    }
  }

  reset(x: number, y: number) {
    this.isDead = false;
    this.isHoldingJump = false;
    this.isJumping = false;
    this.isGliding = false;
    this.hasDoubleJump = true;
    this.wasGrounded = true;
    this.squashX = 1;
    this.squashY = 1;
    this.afterimageTimer = 0;
    this.jumpHoldTimer = 0;
    this.jetpackFuelMs = this.getMaxJetpackFuelMs();
    this.jumpPressedTime = -9999;
    this.invulnUntil = 0;
    this.shieldRemaining = 0;
    this.magnetRemaining = 0;
    this.overdriveRemaining = 0;
    this.overdriveCharge = 0;
    this.doubleJumpsUsed = 0;
    this.overdrivesTriggered = 0;

    this.setActive(true).setVisible(true);
    this.setScale(1, 1);
    this.setPosition(x, y);
    this.setAlpha(1);
    this.setVelocity(0, 0);
    this.shieldRing.setVisible(false);
    this.magnetRing.setVisible(false);
    this.overdriveRing.setVisible(false);
    this.jetpackBarBg.setVisible(false);
    this.jetpackBarFill.setVisible(false);
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
