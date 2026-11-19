import Phaser from 'phaser';

export class Preloader extends Phaser.Scene {
  constructor() {
    super('Preloader');
  }

  preload() {
    this.createProceduralTextures();
  }

  create() {
    this.createAnimations();
    this.scene.start('MainGame');
  }

  private createAnimations() {
    if (!this.anims.exists('anim_player_run')) {
      this.anims.create({
        key: 'anim_player_run',
        frames: [
          { key: 'player_run_0' },
          { key: 'player_run_1' },
          { key: 'player_run_2' },
          { key: 'player_run_3' },
        ],
        frameRate: 13,
        repeat: -1,
      });
    }

    if (!this.anims.exists('anim_drone')) {
      this.anims.create({
        key: 'anim_drone',
        frames: [{ key: 'drone_0' }, { key: 'drone_1' }],
        frameRate: 8,
        repeat: -1,
      });
    }

    if (!this.anims.exists('anim_coin')) {
      this.anims.create({
        key: 'anim_coin',
        frames: [
          { key: 'coin_0' },
          { key: 'coin_1' },
          { key: 'coin_2' },
          { key: 'coin_3' },
        ],
        frameRate: 10,
        repeat: -1,
      });
    }

    if (!this.anims.exists('anim_missile')) {
      this.anims.create({
        key: 'anim_missile',
        frames: [{ key: 'missile_0' }, { key: 'missile_1' }],
        frameRate: 14,
        repeat: -1,
      });
    }
  }

  private createProceduralTextures() {
    this.createSkyTexture();
    this.createCityFarTexture();
    this.createCityNearTexture();
    this.createGroundTexture();
    this.createPlayerFrames();
    this.createBarrierTextures();
    this.createDroneFrames();
    this.createCoinFrames();
    this.createPowerupTextures();
    this.createMissileTextures();
    this.createParticleAndBulletTextures();
  }

  private createSkyTexture() {
    if (this.textures.exists('sky')) return;
    const canvas = this.textures.createCanvas('sky', 800, 600);
    if (!canvas) return;
    const ctx = canvas.context;

    const grad = ctx.createLinearGradient(0, 0, 0, 600);
    grad.addColorStop(0, '#04050b');
    grad.addColorStop(0.55, '#0b0a1f');
    grad.addColorStop(1, '#180d35');
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, 800, 600);

    // Subtle horizon glow
    const glow = ctx.createRadialGradient(400, 560, 20, 400, 560, 420);
    glow.addColorStop(0, 'rgba(0, 243, 255, 0.14)');
    glow.addColorStop(0.5, 'rgba(255, 42, 109, 0.06)');
    glow.addColorStop(1, 'rgba(0, 0, 0, 0)');
    ctx.fillStyle = glow;
    ctx.fillRect(0, 150, 800, 450);

    for (let i = 0; i < 110; i++) {
      const sx = (i * 73) % 800;
      const sy = (i * 41) % 420;
      const sr = (i % 3) * 0.45 + 0.6;
      ctx.fillStyle = i % 5 === 0 ? '#00f3ff' : i % 7 === 0 ? '#ff2a6d' : 'rgba(255,255,255,0.75)';
      ctx.beginPath();
      ctx.arc(sx, sy, sr, 0, Math.PI * 2);
      ctx.fill();
    }
    canvas.refresh();
  }

  private createCityFarTexture() {
    if (this.textures.exists('city_far')) return;
    const canvas = this.textures.createCanvas('city_far', 1000, 420);
    if (!canvas) return;
    const ctx = canvas.context;
    ctx.clearRect(0, 0, 1000, 420);

    let x = 0;
    let seed = 17;
    while (x < 1000) {
      seed = (seed * 31 + 7) % 1000;
      const w = 52 + (seed % 58);
      const h = 150 + ((seed * 3) % 210);
      const y = 420 - h;

      ctx.fillStyle = '#0d0c1d';
      ctx.fillRect(x, y, w - 3, h);

      if (h > 250) {
        ctx.fillStyle = 'rgba(0, 243, 255, 0.35)';
        ctx.fillRect(x + w / 2 - 1, y - 24, 2, 24);
      }

      ctx.fillStyle = 'rgba(0, 243, 255, 0.14)';
      for (let wy = y + 18; wy < 395; wy += 20) {
        for (let wx = x + 8; wx < x + w - 12; wx += 14) {
          if (((wx + wy) % 3) !== 0) {
            ctx.fillRect(wx, wy, 6, 8);
          }
        }
      }
      x += w;
    }
    canvas.refresh();
  }

  private createCityNearTexture() {
    if (this.textures.exists('city_near')) return;
    const canvas = this.textures.createCanvas('city_near', 1000, 340);
    if (!canvas) return;
    const ctx = canvas.context;
    ctx.clearRect(0, 0, 1000, 340);

    let x = 0;
    let seed = 43;
    while (x < 1000) {
      seed = (seed * 37 + 13) % 1000;
      const w = 48 + (seed % 64);
      const h = 110 + ((seed * 5) % 180);
      const y = 340 - h;

      ctx.fillStyle = '#121329';
      ctx.fillRect(x, y, w - 4, h);

      // Rooftop neon edge
      ctx.fillStyle = seed % 2 === 0 ? 'rgba(0, 243, 255, 0.5)' : 'rgba(255, 42, 109, 0.5)';
      ctx.fillRect(x, y, w - 4, 2);

      // Windows
      for (let wy = y + 14; wy < 320; wy += 18) {
        for (let wx = x + 7; wx < x + w - 12; wx += 12) {
          if ((wx * wy + seed) % 5 === 0) {
            ctx.fillStyle = (wx + seed) % 2 === 0 ? 'rgba(0, 243, 255, 0.45)' : 'rgba(255, 200, 87, 0.35)';
            ctx.fillRect(wx, wy, 6, 9);
          }
        }
      }
      x += w;
    }
    canvas.refresh();
  }

  private createGroundTexture() {
    if (this.textures.exists('ground')) return;
    const canvas = this.textures.createCanvas('ground', 400, 96);
    if (!canvas) return;
    const ctx = canvas.context;

    ctx.fillStyle = '#080914';
    ctx.fillRect(0, 0, 400, 96);

    // Top glowing rail
    ctx.fillStyle = '#00f3ff';
    ctx.fillRect(0, 0, 400, 4);
    ctx.fillStyle = 'rgba(0, 243, 255, 0.25)';
    ctx.fillRect(0, 4, 400, 5);

    // Industrial deck trusses
    ctx.strokeStyle = '#1d203d';
    ctx.lineWidth = 2;
    for (let x = 0; x < 400; x += 40) {
      ctx.beginPath();
      ctx.moveTo(x, 12);
      ctx.lineTo(x + 40, 86);
      ctx.moveTo(x + 40, 12);
      ctx.lineTo(x, 86);
      ctx.stroke();
      ctx.strokeRect(x, 12, 40, 74);
    }

    for (let x = 16; x < 400; x += 80) {
      ctx.fillStyle = '#ff2a6d';
      ctx.fillRect(x, 15, 10, 3);
    }
    canvas.refresh();

    if (!this.textures.exists('sky_platform')) {
      const platCanvas = this.textures.createCanvas('sky_platform', 180, 22);
      if (platCanvas) {
        const pctx = platCanvas.context;
        pctx.fillStyle = '#111630';
        pctx.fillRect(4, 4, 172, 12);

        // Top neon landing rail
        pctx.fillStyle = '#00f3ff';
        pctx.fillRect(0, 0, 180, 4);
        pctx.fillStyle = 'rgba(0, 243, 255, 0.35)';
        pctx.fillRect(4, 4, 172, 3);

        // Underside hover thruster emitters
        pctx.fillStyle = '#ff2a6d';
        pctx.fillRect(22, 16, 26, 4);
        pctx.fillRect(132, 16, 26, 4);
        pctx.fillStyle = '#ffc857';
        pctx.fillRect(80, 16, 20, 3);

        platCanvas.refresh();
      }
    }
  }

  private drawRunnerBase(ctx: CanvasRenderingContext2D, opts: {
    bodyY: number;
    leftLegAngle: number;
    rightLegAngle: number;
    armAngle: number;
    glideMode?: boolean;
  }) {
    const { bodyY, leftLegAngle, rightLegAngle, armAngle, glideMode } = opts;

    // Thruster pack
    ctx.fillStyle = '#1f2342';
    ctx.fillRect(10, bodyY + 18, 8, 16);
    ctx.fillStyle = glideMode ? '#00f3ff' : '#ff2a6d';
    ctx.fillRect(8, bodyY + 22, 4, 8);

    // Back leg
    ctx.save();
    ctx.translate(22, bodyY + 34);
    ctx.rotate(leftLegAngle);
    ctx.fillStyle = '#0e8ea8';
    ctx.fillRect(-3, 0, 7, 18);
    ctx.fillStyle = '#00f3ff';
    ctx.fillRect(-3, 14, 9, 4);
    ctx.restore();

    // Torso
    ctx.fillStyle = '#181c36';
    ctx.fillRect(16, bodyY + 14, 16, 22);
    ctx.fillStyle = '#00f3ff';
    ctx.fillRect(20, bodyY + 16, 4, 18);
    ctx.fillRect(26, bodyY + 18, 3, 14);

    // Front leg
    ctx.save();
    ctx.translate(26, bodyY + 34);
    ctx.rotate(rightLegAngle);
    ctx.fillStyle = '#00f3ff';
    ctx.fillRect(-3, 0, 7, 18);
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(-3, 14, 10, 4);
    ctx.restore();

    // Helmet & Visor
    ctx.fillStyle = '#1d2240';
    ctx.beginPath();
    ctx.arc(25, bodyY + 8, 10, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = '#00f3ff';
    ctx.lineWidth = 2;
    ctx.stroke();

    ctx.fillStyle = '#ff2a6d';
    ctx.fillRect(26, bodyY + 4, 10, 6);

    // Arm / Blaster
    ctx.save();
    ctx.translate(22, bodyY + 20);
    ctx.rotate(armAngle);
    ctx.fillStyle = '#00f3ff';
    ctx.fillRect(0, -2, 13, 5);
    ctx.fillStyle = '#ffc857';
    ctx.fillRect(11, -3, 7, 6);
    ctx.restore();
  }

  private createPlayerFrames() {
    const runPoses = [
      { bodyY: 6, leftLegAngle: -0.55, rightLegAngle: 0.5, armAngle: 0.1 },
      { bodyY: 4, leftLegAngle: -0.1, rightLegAngle: 0.15, armAngle: 0.0 },
      { bodyY: 6, leftLegAngle: 0.5, rightLegAngle: -0.55, armAngle: -0.08 },
      { bodyY: 4, leftLegAngle: 0.15, rightLegAngle: -0.1, armAngle: 0.0 },
    ];

    runPoses.forEach((pose, idx) => {
      const key = `player_run_${idx}`;
      if (this.textures.exists(key)) return;
      const canvas = this.textures.createCanvas(key, 48, 64);
      if (!canvas) return;
      this.drawRunnerBase(canvas.context, pose);
      canvas.refresh();
    });

    if (!this.textures.exists('player_jump')) {
      const canvas = this.textures.createCanvas('player_jump', 48, 64);
      if (canvas) {
        this.drawRunnerBase(canvas.context, {
          bodyY: 3,
          leftLegAngle: -0.45,
          rightLegAngle: -0.8,
          armAngle: -0.2,
        });
        canvas.refresh();
      }
    }

    if (!this.textures.exists('player_glide')) {
      const canvas = this.textures.createCanvas('player_glide', 48, 64);
      if (canvas) {
        const ctx = canvas.context;
        this.drawRunnerBase(ctx, {
          bodyY: 5,
          leftLegAngle: 0.45,
          rightLegAngle: 0.65,
          armAngle: 0.05,
          glideMode: true,
        });
        // Glide wing / thruster jet
        ctx.fillStyle = 'rgba(0, 243, 255, 0.85)';
        ctx.beginPath();
        ctx.moveTo(8, 22);
        ctx.lineTo(-2, 16);
        ctx.lineTo(14, 18);
        ctx.closePath();
        ctx.fill();
        canvas.refresh();
      }
    }
  }

  private createBarrierTextures() {
    if (!this.textures.exists('barrier')) {
      const canvas = this.textures.createCanvas('barrier', 40, 58);
      if (canvas) {
        const ctx = canvas.context;
        ctx.fillStyle = '#24091b';
        ctx.fillRect(10, 0, 20, 58);
        ctx.fillStyle = '#ff2a6d';
        ctx.fillRect(15, 4, 10, 50);
        ctx.fillStyle = '#ff77a8';
        ctx.fillRect(4, 10, 32, 6);
        ctx.fillRect(4, 28, 32, 6);
        ctx.fillRect(2, 48, 36, 10);
        canvas.refresh();
      }
    }

    if (!this.textures.exists('barrier_tall')) {
      const canvas = this.textures.createCanvas('barrier_tall', 44, 94);
      if (canvas) {
        const ctx = canvas.context;
        ctx.fillStyle = '#24091b';
        ctx.fillRect(12, 0, 20, 94);
        ctx.fillStyle = '#ff2a6d';
        ctx.fillRect(17, 4, 10, 86);
        ctx.fillStyle = '#ff77a8';
        for (let y = 10; y <= 70; y += 20) {
          ctx.fillRect(4, y, 36, 6);
        }
        ctx.fillRect(2, 84, 40, 10);
        canvas.refresh();
      }
    }
  }

  private createDroneFrames() {
    [0, 1].forEach((frame) => {
      const key = `drone_${frame}`;
      if (this.textures.exists(key)) return;
      const canvas = this.textures.createCanvas(key, 48, 40);
      if (!canvas) return;
      const ctx = canvas.context;

      // Outer chassis
      ctx.fillStyle = '#1b1d36';
      ctx.beginPath();
      ctx.moveTo(8, 20);
      ctx.lineTo(20, 8);
      ctx.lineTo(36, 8);
      ctx.lineTo(44, 20);
      ctx.lineTo(36, 32);
      ctx.lineTo(20, 32);
      ctx.closePath();
      ctx.fill();
      ctx.strokeStyle = '#ff8a00';
      ctx.lineWidth = 2;
      ctx.stroke();

      // Pulsing core eye
      ctx.fillStyle = frame === 0 ? '#ff2a6d' : '#ffc857';
      ctx.beginPath();
      ctx.arc(24, 20, frame === 0 ? 7 : 5, 0, Math.PI * 2);
      ctx.fill();

      // Thruster fins
      ctx.fillStyle = '#00f3ff';
      ctx.fillRect(18, frame === 0 ? 3 : 4, 14, 3);
      ctx.fillRect(18, frame === 0 ? 34 : 33, 14, 3);
      canvas.refresh();
    });
  }

  private createCoinFrames() {
    const widths = [12, 9, 5, 9];
    widths.forEach((rx, idx) => {
      const key = `coin_${idx}`;
      if (this.textures.exists(key)) return;
      const canvas = this.textures.createCanvas(key, 32, 32);
      if (!canvas) return;
      const ctx = canvas.context;

      ctx.fillStyle = '#00ff9d';
      ctx.beginPath();
      ctx.ellipse(16, 16, rx, 12, 0, 0, Math.PI * 2);
      ctx.fill();

      ctx.fillStyle = '#ffffff';
      ctx.beginPath();
      ctx.ellipse(16, 16, Math.max(2, rx * 0.45), 6, 0, 0, Math.PI * 2);
      ctx.fill();

      canvas.refresh();
    });
  }

  private createPowerupTextures() {
    if (!this.textures.exists('powerup_shield')) {
      const canvas = this.textures.createCanvas('powerup_shield', 38, 38);
      if (canvas) {
        const ctx = canvas.context;
        ctx.fillStyle = 'rgba(0, 243, 255, 0.22)';
        ctx.beginPath();
        ctx.arc(19, 19, 17, 0, Math.PI * 2);
        ctx.fill();
        ctx.strokeStyle = '#00f3ff';
        ctx.lineWidth = 2.5;
        ctx.stroke();

        // Inner shield emblem
        ctx.fillStyle = '#00f3ff';
        ctx.beginPath();
        ctx.moveTo(19, 8);
        ctx.lineTo(28, 12);
        ctx.lineTo(26, 23);
        ctx.lineTo(19, 30);
        ctx.lineTo(12, 23);
        ctx.lineTo(10, 12);
        ctx.closePath();
        ctx.fill();
        canvas.refresh();
      }
    }

    if (!this.textures.exists('powerup_magnet')) {
      const canvas = this.textures.createCanvas('powerup_magnet', 38, 38);
      if (canvas) {
        const ctx = canvas.context;
        ctx.fillStyle = 'rgba(255, 200, 87, 0.22)';
        ctx.beginPath();
        ctx.arc(19, 19, 17, 0, Math.PI * 2);
        ctx.fill();
        ctx.strokeStyle = '#ffc857';
        ctx.lineWidth = 2.5;
        ctx.stroke();

        // U-Magnet
        ctx.strokeStyle = '#ff2a6d';
        ctx.lineWidth = 5;
        ctx.beginPath();
        ctx.arc(19, 18, 8, 0, Math.PI, false);
        ctx.stroke();
        ctx.fillStyle = '#00f3ff';
        ctx.fillRect(9, 10, 5, 8);
        ctx.fillRect(24, 10, 5, 8);
        canvas.refresh();
      }
    }
  }

  private createMissileTextures() {
    [0, 1].forEach((frame) => {
      const key = `missile_${frame}`;
      if (this.textures.exists(key)) return;
      const canvas = this.textures.createCanvas(key, 56, 24);
      if (!canvas) return;
      const ctx = canvas.context;

      // Exhaust flame on right
      const flameLen = frame === 0 ? 16 : 11;
      ctx.fillStyle = '#ffc857';
      ctx.beginPath();
      ctx.moveTo(40, 8);
      ctx.lineTo(40 + flameLen, 12);
      ctx.lineTo(40, 16);
      ctx.closePath();
      ctx.fill();

      // Missile body pointing left
      ctx.fillStyle = '#1e223d';
      ctx.fillRect(14, 6, 26, 12);

      // Red nose cone
      ctx.fillStyle = '#ff2a6d';
      ctx.beginPath();
      ctx.moveTo(2, 12);
      ctx.lineTo(15, 6);
      ctx.lineTo(15, 18);
      ctx.closePath();
      ctx.fill();

      // Warning stripe & fins
      ctx.fillStyle = '#ffc857';
      ctx.fillRect(22, 6, 5, 12);
      ctx.fillStyle = '#ff2a6d';
      ctx.fillRect(34, 2, 6, 5);
      ctx.fillRect(34, 17, 6, 5);

      canvas.refresh();
    });

    if (!this.textures.exists('missile_warning')) {
      const canvas = this.textures.createCanvas('missile_warning', 38, 38);
      if (canvas) {
        const ctx = canvas.context;
        ctx.fillStyle = 'rgba(255, 42, 109, 0.25)';
        ctx.beginPath();
        ctx.moveTo(19, 3);
        ctx.lineTo(35, 33);
        ctx.lineTo(3, 33);
        ctx.closePath();
        ctx.fill();

        ctx.strokeStyle = '#ff2a6d';
        ctx.lineWidth = 2.5;
        ctx.stroke();

        ctx.fillStyle = '#ffc857';
        ctx.fillRect(17, 12, 4, 12);
        ctx.fillRect(17, 26, 4, 4);
        canvas.refresh();
      }
    }
  }

  private createParticleAndBulletTextures() {
    const createRadial = (key: string, inner: string, outer: string) => {
      if (this.textures.exists(key)) return;
      const canvas = this.textures.createCanvas(key, 16, 16);
      if (!canvas) return;
      const ctx = canvas.context;
      const grad = ctx.createRadialGradient(8, 8, 1, 8, 8, 8);
      grad.addColorStop(0, inner);
      grad.addColorStop(1, outer);
      ctx.fillStyle = grad;
      ctx.fillRect(0, 0, 16, 16);
      canvas.refresh();
    };

    createRadial('particle', '#ffffff', 'rgba(255, 255, 255, 0)');
    createRadial('spark_red', '#ff2a6d', 'rgba(255, 42, 109, 0)');
    createRadial('spark_yellow', '#ffc857', 'rgba(255, 200, 87, 0)');

    if (!this.textures.exists('bullet')) {
      const canvas = this.textures.createCanvas('bullet', 26, 8);
      if (canvas) {
        const ctx = canvas.context;
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(0, 2, 14, 4);
        ctx.fillStyle = '#fff380';
        ctx.fillRect(10, 1, 16, 6);
        canvas.refresh();
      }
    }
  }
}
