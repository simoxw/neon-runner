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

    if (!this.anims.exists('anim_drone_armored')) {
      this.anims.create({
        key: 'anim_drone_armored',
        frames: [{ key: 'drone_armored_0' }, { key: 'drone_armored_1' }],
        frameRate: 7,
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

    if (!this.anims.exists('anim_boss_drone')) {
      this.anims.create({
        key: 'anim_boss_drone',
        frames: [{ key: 'boss_drone_0' }, { key: 'boss_drone_1' }],
        frameRate: 8,
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
    this.createLaserAndRingTextures();
    this.createExpansionTextures();
    this.createEnvironmentTextures();
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
      const h = 155 + ((seed * 3) % 215);
      const y = 420 - h;

      ctx.fillStyle = '#0d0c1d';
      ctx.fillRect(x, y, w - 3, h);

      // Spire & aviation beacon
      if (h > 240) {
        ctx.fillStyle = 'rgba(0, 243, 255, 0.35)';
        ctx.fillRect(x + w / 2 - 1, y - 28, 2, 28);
        ctx.fillStyle = seed % 2 === 0 ? '#ff2a6d' : '#00f3ff';
        ctx.fillRect(x + w / 2 - 2, y - 31, 4, 4);
      }

      // Distant skybridges every few towers
      if (seed % 3 === 0 && x + w + 28 < 1000) {
        ctx.fillStyle = 'rgba(18, 20, 44, 0.9)';
        ctx.fillRect(x + w - 4, y + 60, 22, 6);
        ctx.fillStyle = 'rgba(0, 243, 255, 0.28)';
        ctx.fillRect(x + w - 4, y + 60, 22, 1.5);
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
      const w = 54 + (seed % 64);
      const h = 115 + ((seed * 5) % 180);
      const y = 340 - h;

      ctx.fillStyle = '#121329';
      ctx.fillRect(x, y, w - 4, h);

      // Rooftop neon edge
      ctx.fillStyle = seed % 2 === 0 ? 'rgba(0, 243, 255, 0.6)' : 'rgba(255, 42, 109, 0.6)';
      ctx.fillRect(x, y, w - 4, 2.5);

      // Rooftop holographic billboards
      if (seed % 4 === 0 && w >= 66) {
        const bw = 34;
        const bh = 16;
        const bx = x + 8;
        const by = y - bh - 6;
        ctx.fillStyle = '#1c1f40';
        ctx.fillRect(bx + 6, y - 6, 3, 6);
        ctx.fillRect(bx + bw - 9, y - 6, 3, 6);
        ctx.fillStyle = 'rgba(13, 16, 33, 0.9)';
        ctx.fillRect(bx, by, bw, bh);
        ctx.strokeStyle = seed % 8 === 0 ? '#00f3ff' : '#ff2a6d';
        ctx.lineWidth = 1.5;
        ctx.strokeRect(bx, by, bw, bh);
        // Geometric hologram bars inside billboard
        ctx.fillStyle = seed % 8 === 0 ? '#00f3ff' : '#ffc857';
        ctx.fillRect(bx + 5, by + 5, 16, 2.5);
        ctx.fillRect(bx + 5, by + 10, 24, 2);
      }

      // Vertical neon street signs on building sides
      if (seed % 3 === 1 && h > 150) {
        const sx = x + w - 12;
        const sy = y + 24;
        ctx.fillStyle = seed % 2 === 0 ? 'rgba(255, 42, 109, 0.72)' : 'rgba(0, 243, 255, 0.72)';
        ctx.fillRect(sx, sy, 5, 36);
        ctx.fillStyle = 'rgba(255, 255, 255, 0.85)';
        ctx.fillRect(sx + 1.5, sy + 4, 2, 7);
        ctx.fillRect(sx + 1.5, sy + 15, 2, 8);
        ctx.fillRect(sx + 1.5, sy + 27, 2, 5);
      }

      // Multi-tone lit windows
      for (let wy = y + 14; wy < 320; wy += 18) {
        for (let wx = x + 7; wx < x + w - 16; wx += 12) {
          if ((wx * wy + seed) % 5 === 0) {
            ctx.fillStyle =
              (wx + seed) % 3 === 0
                ? 'rgba(0, 243, 255, 0.45)'
                : (wx + seed) % 3 === 1
                ? 'rgba(255, 200, 87, 0.38)'
                : 'rgba(255, 42, 109, 0.34)';
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
    const canvas = this.textures.createCanvas('ground', 512, 110);
    if (!canvas) return;
    const ctx = canvas.context;

    // 1. Deep dark sky-void backdrop beneath elevated viaduct arches (y = 24..110)
    const voidGrad = ctx.createLinearGradient(0, 26, 0, 110);
    voidGrad.addColorStop(0, '#050712');
    voidGrad.addColorStop(0.65, '#070a18');
    voidGrad.addColorStop(1, '#0b1026');
    ctx.fillStyle = voidGrad;
    ctx.fillRect(0, 24, 512, 86);

    // Subtle city underglow rising between viaduct piers
    for (let x = 0; x < 512; x += 256) {
      const archGlow = ctx.createRadialGradient(x + 128, 110, 12, x + 128, 110, 112);
      archGlow.addColorStop(0, 'rgba(0, 243, 255, 0.16)');
      archGlow.addColorStop(1, 'rgba(0, 243, 255, 0)');
      ctx.fillStyle = archGlow;
      ctx.fillRect(x, 44, 256, 66);
    }

    // 2. Sculpted 256px viaduct arch bays & diagonal steel V-struts
    for (let bayX = 0; bayX < 512; bayX += 256) {
      const spanStart = bayX + 34;
      const spanEnd = bayX + 222;
      const spanMid = bayX + 128;

      ctx.fillStyle = '#11162e';
      ctx.beginPath();
      ctx.moveTo(spanStart, 110);
      ctx.lineTo(spanStart, 56);
      ctx.quadraticCurveTo(spanMid, 34, spanEnd, 56);
      ctx.lineTo(spanEnd, 110);
      ctx.lineTo(spanEnd - 14, 110);
      ctx.lineTo(spanEnd - 14, 64);
      ctx.quadraticCurveTo(spanMid, 43, spanStart + 14, 64);
      ctx.lineTo(spanStart + 14, 110);
      ctx.closePath();
      ctx.fill();

      ctx.strokeStyle = '#1d254a';
      ctx.lineWidth = 4;
      ctx.beginPath();
      ctx.moveTo(spanStart + 18, 100);
      ctx.lineTo(spanMid - 34, 54);
      ctx.lineTo(spanMid, 96);
      ctx.lineTo(spanMid + 34, 54);
      ctx.lineTo(spanEnd - 18, 100);
      ctx.stroke();

      ctx.strokeStyle = 'rgba(0, 243, 255, 0.18)';
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(spanStart + 18, 98);
      ctx.lineTo(spanMid - 34, 52);
      ctx.moveTo(spanMid + 34, 52);
      ctx.lineTo(spanEnd - 18, 98);
      ctx.stroke();
    }

    // 3. Recessed horizontal energy conduit beneath front deck fascia
    ctx.fillStyle = '#0d1124';
    ctx.fillRect(0, 40, 512, 10);
    ctx.fillStyle = 'rgba(0, 243, 255, 0.24)';
    ctx.fillRect(0, 43, 512, 4);
    ctx.fillStyle = '#00f3ff';
    ctx.fillRect(0, 44.5, 512, 1.5);

    for (let x = 122; x < 512; x += 256) {
      ctx.fillStyle = '#242c54';
      ctx.fillRect(x, 38, 12, 14);
      ctx.fillStyle = '#ffc857';
      ctx.fillRect(x + 4, 43, 4, 4);
    }

    // 4. Heavy 3D viaduct piers every 256px
    const drawPierColumn = (px: number, w: number) => {
      const pierGrad = ctx.createLinearGradient(px, 36, px + w, 36);
      pierGrad.addColorStop(0, '#27305c');
      pierGrad.addColorStop(0.35, '#171d3a');
      pierGrad.addColorStop(1, '#0c1022');
      ctx.fillStyle = pierGrad;
      ctx.fillRect(px, 36, w, 74);

      ctx.fillStyle = '#38467d';
      ctx.fillRect(px, 36, 2, 74);
      ctx.fillStyle = '#070914';
      ctx.fillRect(px + w - 2, 36, 2, 74);

      const cx = Math.floor(px + w / 2 - 2);
      ctx.fillStyle = 'rgba(0, 243, 255, 0.26)';
      ctx.fillRect(cx - 2, 46, 8, 54);
      ctx.fillStyle = '#00f3ff';
      ctx.fillRect(cx, 48, 4, 50);

      ctx.fillStyle = '#28315c';
      ctx.fillRect(px - 3, 36, w + 6, 7);
      ctx.fillStyle = '#ffc857';
      ctx.fillRect(cx - 3, 38, 10, 3);
    };

    drawPierColumn(0, 34);
    drawPierColumn(256, 34);

    // 5. Overhanging 2.5D Front Deck Fascia (y = 22..38) + drop shadow
    const overhangShadow = ctx.createLinearGradient(0, 36, 0, 44);
    overhangShadow.addColorStop(0, 'rgba(0, 0, 0, 0.78)');
    overhangShadow.addColorStop(1, 'rgba(0, 0, 0, 0)');
    ctx.fillStyle = overhangShadow;
    ctx.fillRect(0, 36, 512, 8);

    const fasciaGrad = ctx.createLinearGradient(0, 22, 0, 37);
    fasciaGrad.addColorStop(0, '#222b54');
    fasciaGrad.addColorStop(0.6, '#141933');
    fasciaGrad.addColorStop(1, '#0c1022');
    ctx.fillStyle = fasciaGrad;
    ctx.fillRect(0, 22, 512, 15);

    ctx.fillStyle = '#2e3a6e';
    ctx.fillRect(0, 35, 512, 2.5);
    ctx.fillStyle = '#060810';
    ctx.fillRect(0, 37.5, 512, 1.5);

    // Subtle fascia deck ribs & amber reflector ticks
    for (let x = 0; x < 512; x += 64) {
      ctx.fillStyle = 'rgba(255, 255, 255, 0.06)';
      ctx.fillRect(x + 14, 24, 10, 10);
      ctx.fillStyle = 'rgba(0, 243, 255, 0.45)';
      ctx.fillRect(x + 40, 27, 12, 2.5);
    }

    // 6. 2.5D Perspective Running Lane Surface (y = 0..22, runner center line at y = 14)
    const roadGrad = ctx.createLinearGradient(0, 0, 0, 22);
    roadGrad.addColorStop(0, '#0a0d1f');
    roadGrad.addColorStop(0.45, '#131936');
    roadGrad.addColorStop(1, '#1c244a');
    ctx.fillStyle = roadGrad;
    ctx.fillRect(0, 0, 512, 22);

    // Back curb rail along horizon edge
    ctx.fillStyle = '#283363';
    ctx.fillRect(0, 0, 512, 2.5);
    ctx.fillStyle = 'rgba(0, 243, 255, 0.42)';
    ctx.fillRect(0, 2, 512, 1.2);

    // Foreshortened perspective seam lines & center glowing lane dashes
    for (let x = 0; x < 512; x += 64) {
      ctx.strokeStyle = 'rgba(0, 243, 255, 0.14)';
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.moveTo(x + 20, 3);
      ctx.lineTo(x + 8, 20);
      ctx.stroke();

      // Center perspective running dashes (along y = 11)
      ctx.fillStyle = 'rgba(0, 243, 255, 0.34)';
      ctx.fillRect(x + 28, 10.5, 20, 2);
    }

    // Specular pool reflections on wet cyber asphalt beneath back streetlights (at x = 64 & 320)
    for (const lx of [64, 320]) {
      const pool = ctx.createRadialGradient(lx, 12, 2, lx, 12, 34);
      pool.addColorStop(0, 'rgba(0, 243, 255, 0.24)');
      pool.addColorStop(1, 'rgba(0, 243, 255, 0)');
      ctx.fillStyle = pool;
      ctx.fillRect(lx - 34, 2, 68, 18);
    }

    // Front glowing magnetic curb rail (brightest edge facing camera)
    ctx.fillStyle = 'rgba(0, 243, 255, 0.35)';
    ctx.fillRect(0, 18, 512, 4);
    ctx.fillStyle = '#00f3ff';
    ctx.fillRect(0, 20, 512, 3);
    ctx.fillStyle = '#d8ffff';
    ctx.fillRect(0, 20, 512, 1.2);

    canvas.refresh();

    if (!this.textures.exists('sky_platform')) {
      const platCanvas = this.textures.createCanvas('sky_platform', 180, 28);
      if (platCanvas) {
        const pctx = platCanvas.context;

        // 2.5D top perspective deck (trapezoid top plane)
        const topGrad = pctx.createLinearGradient(0, 0, 0, 9);
        topGrad.addColorStop(0, '#161e40');
        topGrad.addColorStop(1, '#263469');
        pctx.fillStyle = topGrad;
        pctx.beginPath();
        pctx.moveTo(8, 0);
        pctx.lineTo(172, 0);
        pctx.lineTo(180, 9);
        pctx.lineTo(0, 9);
        pctx.closePath();
        pctx.fill();

        // Holographic lane center strip on 2.5D top deck
        pctx.fillStyle = 'rgba(0, 243, 255, 0.45)';
        pctx.fillRect(16, 4, 148, 2);

        // Bright beveled front landing rail
        pctx.fillStyle = '#00f3ff';
        pctx.fillRect(0, 8, 180, 3);
        pctx.fillStyle = '#d8ffff';
        pctx.fillRect(2, 8, 176, 1);

        // Heavy 2.5D armored front chassis
        const bodyGrad = pctx.createLinearGradient(0, 11, 0, 21);
        bodyGrad.addColorStop(0, '#182042');
        bodyGrad.addColorStop(1, '#0c1024');
        pctx.fillStyle = bodyGrad;
        pctx.fillRect(3, 11, 174, 10);
        pctx.fillStyle = '#2d396e';
        pctx.fillRect(14, 14, 24, 3);
        pctx.fillRect(78, 14, 24, 3);
        pctx.fillRect(142, 14, 24, 3);

        // Underside hover thruster cones & amber core glow
        for (const tx of [22, 80, 132]) {
          const w = tx === 80 ? 20 : 26;
          const tGrad = pctx.createLinearGradient(0, 21, 0, 28);
          tGrad.addColorStop(0, tx === 80 ? '#ffc857' : '#ff2a6d');
          tGrad.addColorStop(1, 'rgba(255, 42, 109, 0)');
          pctx.fillStyle = tGrad;
          pctx.fillRect(tx, 21, w, 7);
        }

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

    // 2.5D Jetpack thruster housing with bevel & nozzle
    ctx.fillStyle = '#151933';
    ctx.fillRect(9, bodyY + 17, 10, 18);
    ctx.fillStyle = '#2b3563';
    ctx.fillRect(10, bodyY + 17, 3, 16);
    ctx.fillStyle = glideMode ? '#00f3ff' : '#ff2a6d';
    ctx.fillRect(7, bodyY + 21, 4, 10);
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(8, bodyY + 23, 2, 5);

    // Back leg (darker slate-cyan for 2.5D depth separation)
    ctx.save();
    ctx.translate(22, bodyY + 34);
    ctx.rotate(leftLegAngle);
    ctx.fillStyle = '#096a82';
    ctx.fillRect(-3.5, 0, 7.5, 18);
    ctx.fillStyle = '#113c57';
    ctx.fillRect(-3.5, 0, 3, 14);
    ctx.fillStyle = '#00c8db';
    ctx.fillRect(-3.5, 14, 10, 4.5);
    ctx.restore();

    // Sculpted 2.5D armored torso with sternum arc reactor
    const torsoGrad = ctx.createLinearGradient(15, bodyY + 14, 33, bodyY + 36);
    torsoGrad.addColorStop(0, '#272f59');
    torsoGrad.addColorStop(1, '#12162e');
    ctx.fillStyle = torsoGrad;
    ctx.fillRect(15, bodyY + 14, 17, 22);
    ctx.fillStyle = '#00f3ff';
    ctx.fillRect(19, bodyY + 16, 3.5, 18);
    ctx.fillStyle = '#d8ffff';
    ctx.fillRect(25, bodyY + 18, 4.5, 6);
    ctx.fillStyle = '#ff2a6d';
    ctx.fillRect(26, bodyY + 27, 3, 5);

    // Front leg (bright high-contrast cyan armor + cyber boot highlight)
    ctx.save();
    ctx.translate(26, bodyY + 34);
    ctx.rotate(rightLegAngle);
    ctx.fillStyle = '#00d8f0';
    ctx.fillRect(-3.5, 0, 7.5, 18);
    ctx.fillStyle = '#8cf8ff';
    ctx.fillRect(-3.5, 0, 2.5, 14);
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(-3.5, 14, 11, 4.5);
    ctx.fillStyle = '#00f3ff';
    ctx.fillRect(4.5, 15, 3, 3);
    ctx.restore();

    // Sculpted 2.5D Helmet with rim highlight & specular visor
    const helmGrad = ctx.createRadialGradient(23, bodyY + 5, 2, 25, bodyY + 8, 12);
    helmGrad.addColorStop(0, '#323c70');
    helmGrad.addColorStop(1, '#151933');
    ctx.fillStyle = helmGrad;
    ctx.beginPath();
    ctx.arc(25, bodyY + 8, 10.5, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = '#00f3ff';
    ctx.lineWidth = 2;
    ctx.stroke();

    // Visor + glowing slit
    ctx.fillStyle = '#ff2a6d';
    ctx.fillRect(25, bodyY + 4, 11, 6);
    ctx.fillStyle = '#ffc857';
    ctx.fillRect(28, bodyY + 5, 7, 2.5);
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(31, bodyY + 5, 3, 1.5);

    // Forearm & Pulse Blaster with glowing chamber
    ctx.save();
    ctx.translate(22, bodyY + 20);
    ctx.rotate(armAngle);
    ctx.fillStyle = '#1b2447';
    ctx.fillRect(0, -3, 12, 6);
    ctx.fillStyle = '#00f3ff';
    ctx.fillRect(1, -2, 12, 3.5);
    ctx.fillStyle = '#ffc857';
    ctx.fillRect(11, -3.5, 8, 6.5);
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(16, -2, 3, 3.5);
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
        // 2.5D plasma aero-wing & jet thrust flare
        ctx.fillStyle = 'rgba(0, 243, 255, 0.85)';
        ctx.beginPath();
        ctx.moveTo(8, 22);
        ctx.lineTo(-2, 14);
        ctx.lineTo(14, 17);
        ctx.closePath();
        ctx.fill();
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(2, 16, 7, 2);
        canvas.refresh();
      }
    }
  }

  private createBarrierTextures() {
    if (!this.textures.exists('barrier')) {
      const canvas = this.textures.createCanvas('barrier', 44, 62);
      if (canvas) {
        const ctx = canvas.context;
        // 2.5D contact shadow & chamfered base pad
        ctx.fillStyle = 'rgba(0, 0, 0, 0.42)';
        ctx.beginPath();
        ctx.ellipse(22, 57, 20, 5, 0, 0, Math.PI * 2);
        ctx.fill();

        ctx.fillStyle = '#2d1026';
        ctx.beginPath();
        ctx.moveTo(4, 52);
        ctx.lineTo(40, 52);
        ctx.lineTo(43, 59);
        ctx.lineTo(1, 59);
        ctx.closePath();
        ctx.fill();

        // Outer armored pillar + 3D highlight edge
        ctx.fillStyle = '#24091b';
        ctx.fillRect(10, 4, 24, 50);
        ctx.fillStyle = '#471535';
        ctx.fillRect(10, 4, 4, 50);

        // Glowing plasma core & bright inner filament
        ctx.fillStyle = '#ff2a6d';
        ctx.fillRect(15, 6, 14, 46);
        ctx.fillStyle = '#ffd1e1';
        ctx.fillRect(19, 8, 5, 42);

        // Cross emitter fins
        ctx.fillStyle = '#ff77a8';
        ctx.fillRect(4, 12, 36, 6);
        ctx.fillRect(4, 30, 36, 6);
        ctx.fillStyle = '#ffc857';
        ctx.fillRect(6, 51, 32, 4);
        canvas.refresh();
      }
    }

    if (!this.textures.exists('barrier_tall')) {
      const canvas = this.textures.createCanvas('barrier_tall', 48, 98);
      if (canvas) {
        const ctx = canvas.context;
        ctx.fillStyle = 'rgba(0, 0, 0, 0.45)';
        ctx.beginPath();
        ctx.ellipse(24, 93, 22, 5, 0, 0, Math.PI * 2);
        ctx.fill();

        ctx.fillStyle = '#2d1026';
        ctx.beginPath();
        ctx.moveTo(4, 88);
        ctx.lineTo(44, 88);
        ctx.lineTo(47, 95);
        ctx.lineTo(1, 95);
        ctx.closePath();
        ctx.fill();

        ctx.fillStyle = '#24091b';
        ctx.fillRect(12, 4, 24, 86);
        ctx.fillStyle = '#471535';
        ctx.fillRect(12, 4, 4, 86);

        ctx.fillStyle = '#ff2a6d';
        ctx.fillRect(17, 6, 14, 82);
        ctx.fillStyle = '#ffd1e1';
        ctx.fillRect(21, 8, 5, 78);

        ctx.fillStyle = '#ff77a8';
        for (let y = 12; y <= 72; y += 20) {
          ctx.fillRect(5, y, 38, 6);
        }
        ctx.fillStyle = '#ffc857';
        ctx.fillRect(6, 87, 36, 4);
        canvas.refresh();
      }
    }
  }

  private createDroneFrames() {
    [0, 1].forEach((frame) => {
      const key = `drone_${frame}`;
      if (this.textures.exists(key)) return;
      const canvas = this.textures.createCanvas(key, 50, 42);
      if (!canvas) return;
      const ctx = canvas.context;

      // 2.5D faceted fuselage gradient
      const hullGrad = ctx.createLinearGradient(10, 8, 42, 34);
      hullGrad.addColorStop(0, '#2e335c');
      hullGrad.addColorStop(0.55, '#1b1d36');
      hullGrad.addColorStop(1, '#0e1022');
      ctx.fillStyle = hullGrad;
      ctx.beginPath();
      ctx.moveTo(8, 21);
      ctx.lineTo(20, 8);
      ctx.lineTo(38, 8);
      ctx.lineTo(46, 21);
      ctx.lineTo(38, 34);
      ctx.lineTo(20, 34);
      ctx.closePath();
      ctx.fill();

      ctx.strokeStyle = '#ff8a00';
      ctx.lineWidth = 2;
      ctx.stroke();

      // Top rim highlight
      ctx.fillStyle = 'rgba(255, 255, 255, 0.2)';
      ctx.fillRect(20, 10, 16, 2);

      // Pulsing scanner optic with white specular glint
      ctx.fillStyle = frame === 0 ? '#ff2a6d' : '#ffc857';
      ctx.beginPath();
      ctx.arc(24, 21, frame === 0 ? 7.5 : 5.5, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = '#ffffff';
      ctx.beginPath();
      ctx.arc(22, 19, 2, 0, Math.PI * 2);
      ctx.fill();

      // Twin hover turbine fins
      ctx.fillStyle = '#00f3ff';
      ctx.fillRect(18, frame === 0 ? 3 : 4, 15, 3);
      ctx.fillRect(18, frame === 0 ? 36 : 35, 15, 3);
      canvas.refresh();
    });

    [0, 1].forEach((frame) => {
      const key = `drone_armored_${frame}`;
      if (this.textures.exists(key)) return;
      const canvas = this.textures.createCanvas(key, 56, 48);
      if (!canvas) return;
      const ctx = canvas.context;

      const shellGrad = ctx.createLinearGradient(8, 8, 48, 40);
      shellGrad.addColorStop(0, '#2c225c');
      shellGrad.addColorStop(0.6, '#191335');
      shellGrad.addColorStop(1, '#0c091e');
      ctx.fillStyle = shellGrad;
      ctx.beginPath();
      ctx.moveTo(6, 24);
      ctx.lineTo(18, 7);
      ctx.lineTo(41, 7);
      ctx.lineTo(51, 24);
      ctx.lineTo(41, 41);
      ctx.lineTo(18, 41);
      ctx.closePath();
      ctx.fill();

      ctx.strokeStyle = '#00f3ff';
      ctx.lineWidth = 3;
      ctx.stroke();

      // Angled gold armor plates
      ctx.fillStyle = '#ffc857';
      ctx.fillRect(18, 11, 20, 4.5);
      ctx.fillRect(18, 32.5, 20, 4.5);

      ctx.fillStyle = frame === 0 ? '#00f3ff' : '#ff2a6d';
      ctx.beginPath();
      ctx.arc(27, 24, frame === 0 ? 7.5 : 5.5, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = '#ffffff';
      ctx.beginPath();
      ctx.arc(25, 22, 2.2, 0, Math.PI * 2);
      ctx.fill();
      canvas.refresh();
    });
  }

  private createCoinFrames() {
    const widths = [12, 9, 5, 9];
    widths.forEach((rx, idx) => {
      const key = `coin_${idx}`;
      if (this.textures.exists(key)) return;
      const canvas = this.textures.createCanvas(key, 34, 34);
      if (!canvas) return;
      const ctx = canvas.context;

      // 2.5D extruded metallic depth edge
      ctx.fillStyle = '#046e46';
      ctx.beginPath();
      ctx.ellipse(18.5, 17, rx, 12.5, 0, 0, Math.PI * 2);
      ctx.fill();

      // Main neon emerald face
      const faceGrad = ctx.createLinearGradient(17 - rx, 5, 17 + rx, 29);
      faceGrad.addColorStop(0, '#80ffce');
      faceGrad.addColorStop(0.5, '#00ff9d');
      faceGrad.addColorStop(1, '#00b36e');
      ctx.fillStyle = faceGrad;
      ctx.beginPath();
      ctx.ellipse(16.5, 17, rx, 12.5, 0, 0, Math.PI * 2);
      ctx.fill();

      // Bright specular core slit
      ctx.fillStyle = '#ffffff';
      ctx.beginPath();
      ctx.ellipse(16.5, 17, Math.max(2, rx * 0.42), 6, 0, 0, Math.PI * 2);
      ctx.fill();

      canvas.refresh();
    });
  }

  private createPowerupTextures() {
    if (!this.textures.exists('powerup_shield')) {
      const canvas = this.textures.createCanvas('powerup_shield', 40, 40);
      if (canvas) {
        const ctx = canvas.context;
        const glow = ctx.createRadialGradient(20, 20, 4, 20, 20, 19);
        glow.addColorStop(0, 'rgba(0, 243, 255, 0.36)');
        glow.addColorStop(1, 'rgba(0, 243, 255, 0)');
        ctx.fillStyle = glow;
        ctx.fillRect(0, 0, 40, 40);

        ctx.strokeStyle = '#00f3ff';
        ctx.lineWidth = 2.5;
        ctx.beginPath();
        ctx.arc(20, 20, 16, 0, Math.PI * 2);
        ctx.stroke();

        ctx.fillStyle = '#00f3ff';
        ctx.beginPath();
        ctx.moveTo(20, 9);
        ctx.lineTo(29, 13);
        ctx.lineTo(27, 24);
        ctx.lineTo(20, 31);
        ctx.lineTo(13, 24);
        ctx.lineTo(11, 13);
        ctx.closePath();
        ctx.fill();

        ctx.fillStyle = '#d8ffff';
        ctx.fillRect(16, 13, 4, 11);
        canvas.refresh();
      }
    }

    if (!this.textures.exists('powerup_magnet')) {
      const canvas = this.textures.createCanvas('powerup_magnet', 40, 40);
      if (canvas) {
        const ctx = canvas.context;
        const glow = ctx.createRadialGradient(20, 20, 4, 20, 20, 19);
        glow.addColorStop(0, 'rgba(255, 200, 87, 0.36)');
        glow.addColorStop(1, 'rgba(255, 200, 87, 0)');
        ctx.fillStyle = glow;
        ctx.fillRect(0, 0, 40, 40);

        ctx.strokeStyle = '#ffc857';
        ctx.lineWidth = 2.5;
        ctx.beginPath();
        ctx.arc(20, 20, 16, 0, Math.PI * 2);
        ctx.stroke();

        ctx.strokeStyle = '#ff2a6d';
        ctx.lineWidth = 5;
        ctx.beginPath();
        ctx.arc(20, 19, 8, 0, Math.PI, false);
        ctx.stroke();
        ctx.fillStyle = '#00f3ff';
        ctx.fillRect(10, 11, 5, 8);
        ctx.fillRect(25, 11, 5, 8);
        canvas.refresh();
      }
    }
  }

  private createMissileTextures() {
    [0, 1].forEach((frame) => {
      const key = `missile_${frame}`;
      if (this.textures.exists(key)) return;
      const canvas = this.textures.createCanvas(key, 58, 26);
      if (!canvas) return;
      const ctx = canvas.context;

      const flameLen = frame === 0 ? 17 : 12;
      ctx.fillStyle = '#ff8a00';
      ctx.beginPath();
      ctx.moveTo(41, 8);
      ctx.lineTo(41 + flameLen, 13);
      ctx.lineTo(41, 18);
      ctx.closePath();
      ctx.fill();
      ctx.fillStyle = '#fff380';
      ctx.beginPath();
      ctx.moveTo(41, 10);
      ctx.lineTo(41 + flameLen * 0.65, 13);
      ctx.lineTo(41, 16);
      ctx.closePath();
      ctx.fill();

      // Cylindrical shaded fuselage
      const bodyGrad = ctx.createLinearGradient(14, 7, 14, 19);
      bodyGrad.addColorStop(0, '#3a4270');
      bodyGrad.addColorStop(0.5, '#1e223d');
      bodyGrad.addColorStop(1, '#0e1022');
      ctx.fillStyle = bodyGrad;
      ctx.fillRect(15, 7, 26, 12);

      // Crimson warhead cone
      ctx.fillStyle = '#ff2a6d';
      ctx.beginPath();
      ctx.moveTo(2, 13);
      ctx.lineTo(16, 7);
      ctx.lineTo(16, 19);
      ctx.closePath();
      ctx.fill();
      ctx.fillStyle = 'rgba(255, 255, 255, 0.35)';
      ctx.fillRect(10, 9, 28, 2);

      ctx.fillStyle = '#ffc857';
      ctx.fillRect(23, 7, 5, 12);
      ctx.fillStyle = '#ff2a6d';
      ctx.fillRect(35, 3, 6, 5);
      ctx.fillRect(35, 18, 6, 5);

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

  private createLaserAndRingTextures() {
    if (!this.textures.exists('laser_gate_warn')) {
      const canvas = this.textures.createCanvas('laser_gate_warn', 36, 134);
      if (canvas) {
        const ctx = canvas.context;
        // 2.5D top & bottom armored emitter pods
        ctx.fillStyle = '#251738';
        ctx.fillRect(4, 0, 28, 15);
        ctx.fillRect(4, 119, 28, 15);
        ctx.fillStyle = '#3b2459';
        ctx.fillRect(4, 0, 6, 15);
        ctx.fillRect(4, 119, 6, 15);
        ctx.fillStyle = '#ffc857';
        ctx.fillRect(8, 13, 20, 4);
        ctx.fillRect(8, 117, 20, 4);

        ctx.fillStyle = 'rgba(255, 42, 109, 0.58)';
        ctx.fillRect(17, 17, 2, 100);
        canvas.refresh();
      }
    }

    if (!this.textures.exists('laser_gate_active')) {
      const canvas = this.textures.createCanvas('laser_gate_active', 36, 134);
      if (canvas) {
        const ctx = canvas.context;
        ctx.fillStyle = '#300c29';
        ctx.fillRect(4, 0, 28, 15);
        ctx.fillRect(4, 119, 28, 15);
        ctx.fillStyle = '#ff2a6d';
        ctx.fillRect(8, 13, 20, 4);
        ctx.fillRect(8, 117, 20, 4);

        ctx.fillStyle = 'rgba(255, 42, 109, 0.45)';
        ctx.fillRect(9, 17, 18, 100);
        ctx.fillStyle = '#ff2a6d';
        ctx.fillRect(13, 17, 10, 100);
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(16, 17, 4, 100);
        canvas.refresh();
      }
    }

    if (!this.textures.exists('boost_ring')) {
      const canvas = this.textures.createCanvas('boost_ring', 40, 64);
      if (canvas) {
        const ctx = canvas.context;
        // Outer soft halo
        ctx.strokeStyle = 'rgba(0, 243, 255, 0.28)';
        ctx.lineWidth = 8;
        ctx.beginPath();
        ctx.ellipse(20, 32, 13, 25, 0, 0, Math.PI * 2);
        ctx.stroke();

        // Back arc slightly dimmed for 2.5D torus perspective
        ctx.strokeStyle = '#009966';
        ctx.lineWidth = 3.5;
        ctx.beginPath();
        ctx.ellipse(20, 32, 13, 25, 0, Math.PI * 0.5, Math.PI * 1.5);
        ctx.stroke();

        // Bright front arc facing camera
        ctx.strokeStyle = '#00ff9d';
        ctx.lineWidth = 4;
        ctx.beginPath();
        ctx.ellipse(20, 32, 13, 25, 0, -Math.PI * 0.5, Math.PI * 0.5);
        ctx.stroke();

        ctx.strokeStyle = '#ffffff';
        ctx.lineWidth = 1.5;
        ctx.beginPath();
        ctx.ellipse(20, 32, 9, 19, 0, -Math.PI * 0.45, Math.PI * 0.45);
        ctx.stroke();
        canvas.refresh();
      }
    }

    if (!this.textures.exists('wind_streak')) {
      const canvas = this.textures.createCanvas('wind_streak', 54, 3);
      if (canvas) {
        const ctx = canvas.context;
        const grad = ctx.createLinearGradient(0, 0, 54, 0);
        grad.addColorStop(0, 'rgba(0, 243, 255, 0)');
        grad.addColorStop(0.5, 'rgba(0, 243, 255, 0.62)');
        grad.addColorStop(1, 'rgba(255, 255, 255, 0)');
        ctx.fillStyle = grad;
        ctx.fillRect(0, 0, 54, 3);
        canvas.refresh();
      }
    }
  }

  private createExpansionTextures() {
    if (!this.textures.exists('jump_pad')) {
      const canvas = this.textures.createCanvas('jump_pad', 60, 22);
      if (canvas) {
        const ctx = canvas.context;
        // 2.5D Trapezoid base housing
        ctx.fillStyle = '#181f3d';
        ctx.beginPath();
        ctx.moveTo(4, 22);
        ctx.lineTo(10, 12);
        ctx.lineTo(50, 12);
        ctx.lineTo(56, 22);
        ctx.closePath();
        ctx.fill();

        // Piston spring gap glow
        ctx.fillStyle = 'rgba(0, 243, 255, 0.35)';
        ctx.fillRect(14, 9, 32, 4);

        // Luminous amber/cyan bounce deck top
        const topGrad = ctx.createLinearGradient(8, 2, 52, 10);
        topGrad.addColorStop(0, '#00f3ff');
        topGrad.addColorStop(0.5, '#00ff9d');
        topGrad.addColorStop(1, '#ffc857');
        ctx.fillStyle = topGrad;
        ctx.beginPath();
        ctx.moveTo(8, 10);
        ctx.lineTo(14, 3);
        ctx.lineTo(46, 3);
        ctx.lineTo(52, 10);
        ctx.closePath();
        ctx.fill();

        // Upward chevron glyphs
        ctx.strokeStyle = '#06070d';
        ctx.lineWidth = 2;
        for (const cx of [22, 30, 38]) {
          ctx.beginPath();
          ctx.moveTo(cx - 4, 8);
          ctx.lineTo(cx, 4.5);
          ctx.lineTo(cx + 4, 8);
          ctx.stroke();
        }
        canvas.refresh();
      }
    }

    [0, 1].forEach((frame) => {
      const key = `boss_drone_${frame}`;
      if (this.textures.exists(key)) return;
      const canvas = this.textures.createCanvas(key, 116, 84);
      if (!canvas) return;
      const ctx = canvas.context;

      // Twin side hover thruster flames
      const flameH = frame === 0 ? 14 : 9;
      ctx.fillStyle = '#ff5e3a';
      ctx.fillRect(22, 66, 12, flameH);
      ctx.fillRect(82, 66, 12, flameH);
      ctx.fillStyle = '#ffc857';
      ctx.fillRect(25, 66, 6, flameH - 3);
      ctx.fillRect(85, 66, 6, flameH - 3);

      // Shadowed 2.5D armored dreadnought hull
      const hullGrad = ctx.createLinearGradient(12, 12, 104, 70);
      hullGrad.addColorStop(0, '#2c2359');
      hullGrad.addColorStop(0.55, '#191438');
      hullGrad.addColorStop(1, '#0c091f');
      ctx.fillStyle = hullGrad;
      ctx.beginPath();
      ctx.moveTo(8, 42);
      ctx.lineTo(28, 14);
      ctx.lineTo(88, 14);
      ctx.lineTo(108, 42);
      ctx.lineTo(86, 68);
      ctx.lineTo(30, 68);
      ctx.closePath();
      ctx.fill();

      // Glowing crimson trim & bevel
      ctx.strokeStyle = '#ff2a6d';
      ctx.lineWidth = 3;
      ctx.stroke();
      ctx.fillStyle = 'rgba(255, 255, 255, 0.22)';
      ctx.fillRect(30, 16, 56, 3);

      // Twin armored wing pods
      ctx.fillStyle = '#20264c';
      ctx.fillRect(14, 30, 22, 24);
      ctx.fillRect(80, 30, 22, 24);
      ctx.fillStyle = '#ffc857';
      ctx.fillRect(16, 28, 18, 4);
      ctx.fillRect(82, 28, 18, 4);

      // Central menacing core optic
      ctx.fillStyle = frame === 0 ? '#ff2a6d' : '#ff8a00';
      ctx.beginPath();
      ctx.arc(52, 42, frame === 0 ? 14 : 11, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = '#fff380';
      ctx.beginPath();
      ctx.arc(49, 39, 5, 0, Math.PI * 2);
      ctx.fill();

      // Forward plasma barrel
      ctx.fillStyle = '#00f3ff';
      ctx.fillRect(4, 39, 14, 6);
      canvas.refresh();
    });

    if (!this.textures.exists('emp_wave_ring')) {
      const canvas = this.textures.createCanvas('emp_wave_ring', 160, 160);
      if (canvas) {
        const ctx = canvas.context;
        const grad = ctx.createRadialGradient(80, 80, 48, 80, 80, 78);
        grad.addColorStop(0, 'rgba(0, 243, 255, 0)');
        grad.addColorStop(0.65, 'rgba(0, 243, 255, 0.45)');
        grad.addColorStop(0.85, 'rgba(125, 211, 252, 0.9)');
        grad.addColorStop(1, 'rgba(0, 243, 255, 0)');
        ctx.fillStyle = grad;
        ctx.fillRect(0, 0, 160, 160);
        canvas.refresh();
      }
    }
  }

  private createEnvironmentTextures() {
    if (!this.textures.exists('road_gap')) {
      const canvas = this.textures.createCanvas('road_gap', 160, 110);
      if (canvas) {
        const ctx = canvas.context;
        // 1. Deep night sky & void opening where the 2.5D deck breaks
        const dropGrad = ctx.createLinearGradient(0, 0, 0, 110);
        dropGrad.addColorStop(0, '#090a18');
        dropGrad.addColorStop(0.55, '#05060f');
        dropGrad.addColorStop(1, '#020207');
        ctx.fillStyle = dropGrad;
        ctx.fillRect(0, 0, 160, 110);

        // 2. 2.5D angled perspective sheared cut-off curbs on left & right sides (y = 0..24)
        ctx.fillStyle = '#1d254a';
        ctx.beginPath();
        ctx.moveTo(0, 0);
        ctx.lineTo(14, 0);
        ctx.lineTo(6, 22);
        ctx.lineTo(0, 22);
        ctx.closePath();
        ctx.fill();

        ctx.beginPath();
        ctx.moveTo(146, 0);
        ctx.lineTo(160, 0);
        ctx.lineTo(160, 22);
        ctx.lineTo(154, 22);
        ctx.closePath();
        ctx.fill();

        // Sheared steel end-pillars beneath deck fascia
        ctx.fillStyle = '#1c2345';
        ctx.fillRect(0, 22, 10, 88);
        ctx.fillRect(150, 22, 10, 88);
        ctx.fillStyle = '#2e3a6e';
        ctx.fillRect(8, 34, 3, 76);
        ctx.fillRect(149, 34, 3, 76);

        // High-contrast crimson/amber hazard edge caps slanted along 2.5D curb cut
        ctx.fillStyle = '#ff2a6d';
        ctx.fillRect(0, 16, 13, 14);
        ctx.fillRect(147, 16, 13, 14);
        ctx.fillStyle = '#ffc857';
        ctx.fillRect(2, 19, 8, 4);
        ctx.fillRect(150, 19, 8, 4);

        // Downward hazard wall glow inside chasm shaft
        ctx.fillStyle = 'rgba(255, 42, 109, 0.24)';
        ctx.fillRect(11, 22, 4, 88);
        ctx.fillRect(145, 22, 4, 88);
        canvas.refresh();
      }
    }

    if (!this.textures.exists('street_lamps')) {
      const canvas = this.textures.createCanvas('street_lamps', 512, 92);
      if (canvas) {
        const ctx = canvas.context;
        ctx.clearRect(0, 0, 512, 92);
        for (const lx of [64, 320]) {
          // Volumetric downward light cone onto the 2.5D road surface
          const coneGrad = ctx.createLinearGradient(lx, 18, lx, 92);
          coneGrad.addColorStop(0, 'rgba(0, 243, 255, 0.28)');
          coneGrad.addColorStop(0.55, 'rgba(0, 243, 255, 0.08)');
          coneGrad.addColorStop(1, 'rgba(0, 243, 255, 0)');
          ctx.fillStyle = coneGrad;
          ctx.beginPath();
          ctx.moveTo(lx + 4, 18);
          ctx.lineTo(lx + 18, 18);
          ctx.lineTo(lx + 42, 92);
          ctx.lineTo(lx - 24, 92);
          ctx.closePath();
          ctx.fill();

          // Sleek curved cyber lamp mast anchored behind back curb
          ctx.fillStyle = '#181e3b';
          ctx.fillRect(lx - 2, 14, 4, 78);
          ctx.fillRect(lx - 2, 12, 20, 4);
          ctx.fillStyle = '#00f3ff';
          ctx.fillRect(lx + 6, 16, 11, 2.5);
        }
        canvas.refresh();
      }
    }

    if (!this.textures.exists('fg_girders')) {
      const canvas = this.textures.createCanvas('fg_girders', 512, 56);
      if (canvas) {
        const ctx = canvas.context;
        ctx.clearRect(0, 0, 512, 56);

        // Dark foreground suspension cable dip along extreme bottom frame
        ctx.strokeStyle = 'rgba(4, 5, 11, 0.85)';
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.moveTo(0, 32);
        ctx.quadraticCurveTo(256, 52, 512, 32);
        ctx.stroke();

        // Occasional fast-scrolling foreground pylon silhouettes at bottom margin
        for (const px of [44, 310]) {
          ctx.fillStyle = 'rgba(4, 5, 12, 0.92)';
          ctx.fillRect(px, 6, 16, 50);
          ctx.fillStyle = 'rgba(0, 243, 255, 0.22)';
          ctx.fillRect(px + 2, 10, 2, 16);
        }
        canvas.refresh();
      }
    }

    if (!this.textures.exists('glow_soft')) {
      const canvas = this.textures.createCanvas('glow_soft', 128, 128);
      if (canvas) {
        const ctx = canvas.context;
        const grad = ctx.createRadialGradient(64, 64, 4, 64, 64, 62);
        grad.addColorStop(0, 'rgba(255, 255, 255, 0.65)');
        grad.addColorStop(0.45, 'rgba(255, 255, 255, 0.22)');
        grad.addColorStop(1, 'rgba(255, 255, 255, 0)');
        ctx.fillStyle = grad;
        ctx.fillRect(0, 0, 128, 128);
        canvas.refresh();
      }
    }

    if (!this.textures.exists('shadow_oval')) {
      const canvas = this.textures.createCanvas('shadow_oval', 64, 20);
      if (canvas) {
        const ctx = canvas.context;
        const grad = ctx.createRadialGradient(32, 10, 2, 32, 10, 28);
        grad.addColorStop(0, 'rgba(0, 0, 0, 0.72)');
        grad.addColorStop(0.6, 'rgba(0, 0, 0, 0.3)');
        grad.addColorStop(1, 'rgba(0, 0, 0, 0)');
        ctx.fillStyle = grad;
        ctx.fillRect(0, 0, 64, 20);
        canvas.refresh();
      }
    }

    if (!this.textures.exists('hover_car_0')) {
      const canvas = this.textures.createCanvas('hover_car_0', 36, 10);
      if (canvas) {
        const ctx = canvas.context;
        ctx.fillStyle = '#1a203d';
        ctx.fillRect(6, 2, 20, 6);
        ctx.fillStyle = '#00f3ff';
        ctx.fillRect(2, 4, 6, 3);
        ctx.fillStyle = '#ff2a6d';
        ctx.fillRect(26, 4, 9, 2);
        canvas.refresh();
      }
    }

    if (!this.textures.exists('hover_car_1')) {
      const canvas = this.textures.createCanvas('hover_car_1', 36, 10);
      if (canvas) {
        const ctx = canvas.context;
        ctx.fillStyle = '#1a203d';
        ctx.fillRect(10, 2, 20, 6);
        ctx.fillStyle = '#ffc857';
        ctx.fillRect(28, 4, 6, 3);
        ctx.fillStyle = '#00f3ff';
        ctx.fillRect(1, 4, 9, 2);
        canvas.refresh();
      }
    }

    if (!this.textures.exists('sector_sun')) {
      const canvas = this.textures.createCanvas('sector_sun', 180, 180);
      if (canvas) {
        const ctx = canvas.context;
        const grad = ctx.createLinearGradient(0, 20, 0, 170);
        grad.addColorStop(0, 'rgba(255, 224, 102, 0.85)');
        grad.addColorStop(0.55, 'rgba(255, 138, 0, 0.72)');
        grad.addColorStop(1, 'rgba(255, 42, 109, 0.45)');
        ctx.fillStyle = grad;
        ctx.beginPath();
        ctx.arc(90, 90, 74, 0, Math.PI * 2);
        ctx.fill();

        ctx.globalCompositeOperation = 'destination-out';
        for (let y = 96; y < 164; y += 11) {
          const sliceH = 2 + Math.floor((y - 96) / 18);
          ctx.fillRect(10, y, 160, sliceH);
        }
        ctx.globalCompositeOperation = 'source-over';
        canvas.refresh();
      }
    }

    if (!this.textures.exists('searchlight_beam')) {
      const canvas = this.textures.createCanvas('searchlight_beam', 120, 320);
      if (canvas) {
        const ctx = canvas.context;
        const grad = ctx.createLinearGradient(60, 320, 60, 0);
        grad.addColorStop(0, 'rgba(255, 42, 109, 0.34)');
        grad.addColorStop(0.6, 'rgba(255, 42, 109, 0.09)');
        grad.addColorStop(1, 'rgba(255, 42, 109, 0)');
        ctx.fillStyle = grad;
        ctx.beginPath();
        ctx.moveTo(50, 320);
        ctx.lineTo(70, 320);
        ctx.lineTo(116, 0);
        ctx.lineTo(4, 0);
        ctx.closePath();
        ctx.fill();
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
