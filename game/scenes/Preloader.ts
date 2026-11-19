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
    const canvas = this.textures.createCanvas('ground', 512, 96);
    if (!canvas) return;
    const ctx = canvas.context;

    // 1. Deep dark sky-void backdrop beneath elevated viaduct arches
    const voidGrad = ctx.createLinearGradient(0, 24, 0, 96);
    voidGrad.addColorStop(0, '#050712');
    voidGrad.addColorStop(0.65, '#070a18');
    voidGrad.addColorStop(1, '#0b1026');
    ctx.fillStyle = voidGrad;
    ctx.fillRect(0, 0, 512, 96);

    // Subtle city underglow rising between viaduct piers
    for (let x = 0; x < 512; x += 256) {
      const archGlow = ctx.createRadialGradient(x + 128, 96, 12, x + 128, 96, 108);
      archGlow.addColorStop(0, 'rgba(0, 243, 255, 0.14)');
      archGlow.addColorStop(1, 'rgba(0, 243, 255, 0)');
      ctx.fillStyle = archGlow;
      ctx.fillRect(x, 36, 256, 60);
    }

    // 2. Sculpted 256px viaduct arch bays & diagonal steel V-struts
    for (let bayX = 0; bayX < 512; bayX += 256) {
      const spanStart = bayX + 34;
      const spanEnd = bayX + 222;
      const spanMid = bayX + 128;

      // Arched steel soffit silhouette under the deck
      ctx.fillStyle = '#11162e';
      ctx.beginPath();
      ctx.moveTo(spanStart, 96);
      ctx.lineTo(spanStart, 46);
      ctx.quadraticCurveTo(spanMid, 24, spanEnd, 46);
      ctx.lineTo(spanEnd, 96);
      ctx.lineTo(spanEnd - 14, 96);
      ctx.lineTo(spanEnd - 14, 54);
      ctx.quadraticCurveTo(spanMid, 33, spanStart + 14, 54);
      ctx.lineTo(spanStart + 14, 96);
      ctx.closePath();
      ctx.fill();

      // Clean diagonal support V-trusses anchored to central girder
      ctx.strokeStyle = '#1c2345';
      ctx.lineWidth = 4;
      ctx.beginPath();
      ctx.moveTo(spanStart + 18, 86);
      ctx.lineTo(spanMid - 34, 42);
      ctx.lineTo(spanMid, 82);
      ctx.lineTo(spanMid + 34, 42);
      ctx.lineTo(spanEnd - 18, 86);
      ctx.stroke();

      // Crisp inner highlight along truss edges
      ctx.strokeStyle = 'rgba(0, 243, 255, 0.16)';
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(spanStart + 18, 84);
      ctx.lineTo(spanMid - 34, 40);
      ctx.moveTo(spanMid + 34, 40);
      ctx.lineTo(spanEnd - 18, 84);
      ctx.stroke();
    }

    // 3. Single clean horizontal energy conduit bus beneath the deck lip
    ctx.fillStyle = '#0d1124';
    ctx.fillRect(0, 28, 512, 10);
    ctx.fillStyle = 'rgba(0, 243, 255, 0.22)';
    ctx.fillRect(0, 31, 512, 4);
    ctx.fillStyle = '#00f3ff';
    ctx.fillRect(0, 32.5, 512, 1.5);

    // Metallic pipe clamps every 128px
    for (let x = 122; x < 512; x += 256) {
      ctx.fillStyle = '#242c54';
      ctx.fillRect(x, 26, 12, 14);
      ctx.fillStyle = '#ffc857';
      ctx.fillRect(x + 4, 31, 4, 4);
    }

    // 4. Heavy structural viaduct piers every 256px (split across tile seam at 0 / 256)
    const drawPierColumn = (px: number, w: number) => {
      // Main concrete/steel shaft
      const pierGrad = ctx.createLinearGradient(px, 24, px + w, 24);
      pierGrad.addColorStop(0, '#232b52');
      pierGrad.addColorStop(0.3, '#171d3a');
      pierGrad.addColorStop(1, '#0e1226');
      ctx.fillStyle = pierGrad;
      ctx.fillRect(px, 24, w, 72);

      // Left edge rim highlight & right shadow border
      ctx.fillStyle = '#333f73';
      ctx.fillRect(px, 24, 2, 72);
      ctx.fillStyle = '#070914';
      ctx.fillRect(px + w - 2, 24, 2, 72);

      // Clean vertical cyan core light strip centered on pier
      const cx = Math.floor(px + w / 2 - 2);
      ctx.fillStyle = 'rgba(0, 243, 255, 0.25)';
      ctx.fillRect(cx - 2, 34, 8, 52);
      ctx.fillStyle = '#00f3ff';
      ctx.fillRect(cx, 36, 4, 48);

      // Top pier capital bracket & amber safety marker
      ctx.fillStyle = '#28315c';
      ctx.fillRect(px - 3, 24, w + 6, 7);
      ctx.fillStyle = '#ffc857';
      ctx.fillRect(cx - 3, 26, 10, 3);
    };

    drawPierColumn(0, 34);
    drawPierColumn(256, 34);

    // 5. Overhanging upper highway deck (y = 0..24) — razor-sharp playable surface
    // Drop shadow cast beneath overhanging road deck
    const overhangShadow = ctx.createLinearGradient(0, 22, 0, 30);
    overhangShadow.addColorStop(0, 'rgba(0, 0, 0, 0.72)');
    overhangShadow.addColorStop(1, 'rgba(0, 0, 0, 0)');
    ctx.fillStyle = overhangShadow;
    ctx.fillRect(0, 22, 512, 8);

    // Roadway steel fascia & bevel
    const deckGrad = ctx.createLinearGradient(0, 3, 0, 23);
    deckGrad.addColorStop(0, '#1e264a');
    deckGrad.addColorStop(0.55, '#141933');
    deckGrad.addColorStop(1, '#0e1226');
    ctx.fillStyle = deckGrad;
    ctx.fillRect(0, 3, 512, 19);

    // Clean lower steel flange rim
    ctx.fillStyle = '#2b3666';
    ctx.fillRect(0, 20, 512, 3);
    ctx.fillStyle = '#070912';
    ctx.fillRect(0, 23, 512, 1.5);

    // Crisp spaced speed chevrons & amber deck reflectors (every 64px, zero clutter)
    for (let x = 0; x < 512; x += 64) {
      // Subtle angled metallic deck seam
      ctx.fillStyle = 'rgba(255, 255, 255, 0.06)';
      ctx.beginPath();
      ctx.moveTo(x + 14, 5);
      ctx.lineTo(x + 28, 5);
      ctx.lineTo(x + 20, 19);
      ctx.lineTo(x + 6, 19);
      ctx.closePath();
      ctx.fill();

      // Clean cyan lane dash
      ctx.fillStyle = 'rgba(0, 243, 255, 0.55)';
      ctx.fillRect(x + 38, 10, 14, 3);
    }

    // Razor-sharp top Mag-Rail (white-hot core + cyan glow)
    ctx.fillStyle = 'rgba(0, 243, 255, 0.32)';
    ctx.fillRect(0, 3, 512, 4);
    ctx.fillStyle = '#00f3ff';
    ctx.fillRect(0, 0, 512, 3.5);
    ctx.fillStyle = '#d8ffff';
    ctx.fillRect(0, 0, 512, 1.2);

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

    [0, 1].forEach((frame) => {
      const key = `drone_armored_${frame}`;
      if (this.textures.exists(key)) return;
      const canvas = this.textures.createCanvas(key, 54, 46);
      if (!canvas) return;
      const ctx = canvas.context;

      // Reinforced outer armor shell
      ctx.fillStyle = '#191335';
      ctx.beginPath();
      ctx.moveTo(6, 23);
      ctx.lineTo(18, 7);
      ctx.lineTo(39, 7);
      ctx.lineTo(49, 23);
      ctx.lineTo(39, 39);
      ctx.lineTo(18, 39);
      ctx.closePath();
      ctx.fill();
      ctx.strokeStyle = '#00f3ff';
      ctx.lineWidth = 3;
      ctx.stroke();

      // Golden armor plate stripe & pulsing core
      ctx.fillStyle = '#ffc857';
      ctx.fillRect(18, 11, 18, 4);
      ctx.fillRect(18, 31, 18, 4);

      ctx.fillStyle = frame === 0 ? '#00f3ff' : '#ff2a6d';
      ctx.beginPath();
      ctx.arc(27, 23, frame === 0 ? 7 : 5, 0, Math.PI * 2);
      ctx.fill();
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

  private createLaserAndRingTextures() {
    if (!this.textures.exists('laser_gate_warn')) {
      const canvas = this.textures.createCanvas('laser_gate_warn', 32, 132);
      if (canvas) {
        const ctx = canvas.context;
        // Top & bottom emitter pods
        ctx.fillStyle = '#20132d';
        ctx.fillRect(4, 0, 24, 14);
        ctx.fillRect(4, 118, 24, 14);
        ctx.fillStyle = '#ffc857';
        ctx.fillRect(8, 12, 16, 4);
        ctx.fillRect(8, 116, 16, 4);

        // Thin warning laser line
        ctx.fillStyle = 'rgba(255, 42, 109, 0.55)';
        ctx.fillRect(15, 16, 2, 100);
        canvas.refresh();
      }
    }

    if (!this.textures.exists('laser_gate_active')) {
      const canvas = this.textures.createCanvas('laser_gate_active', 32, 132);
      if (canvas) {
        const ctx = canvas.context;
        ctx.fillStyle = '#2a0b24';
        ctx.fillRect(4, 0, 24, 14);
        ctx.fillRect(4, 118, 24, 14);
        ctx.fillStyle = '#ff2a6d';
        ctx.fillRect(8, 12, 16, 4);
        ctx.fillRect(8, 116, 16, 4);

        // Outer plasma glow + bright core
        ctx.fillStyle = 'rgba(255, 42, 109, 0.45)';
        ctx.fillRect(8, 16, 16, 100);
        ctx.fillStyle = '#ff2a6d';
        ctx.fillRect(11, 16, 10, 100);
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(14, 16, 4, 100);
        canvas.refresh();
      }
    }

    if (!this.textures.exists('boost_ring')) {
      const canvas = this.textures.createCanvas('boost_ring', 36, 62);
      if (canvas) {
        const ctx = canvas.context;
        ctx.strokeStyle = 'rgba(0, 243, 255, 0.32)';
        ctx.lineWidth = 7;
        ctx.beginPath();
        ctx.ellipse(18, 31, 12, 24, 0, 0, Math.PI * 2);
        ctx.stroke();

        ctx.strokeStyle = '#00ff9d';
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.ellipse(18, 31, 12, 24, 0, 0, Math.PI * 2);
        ctx.stroke();

        ctx.strokeStyle = '#ffffff';
        ctx.lineWidth = 1.5;
        ctx.beginPath();
        ctx.ellipse(18, 31, 8, 18, 0, 0, Math.PI * 2);
        ctx.stroke();
        canvas.refresh();
      }
    }

    if (!this.textures.exists('wind_streak')) {
      const canvas = this.textures.createCanvas('wind_streak', 48, 3);
      if (canvas) {
        const ctx = canvas.context;
        const grad = ctx.createLinearGradient(0, 0, 48, 0);
        grad.addColorStop(0, 'rgba(0, 243, 255, 0)');
        grad.addColorStop(0.5, 'rgba(0, 243, 255, 0.55)');
        grad.addColorStop(1, 'rgba(255, 255, 255, 0)');
        ctx.fillStyle = grad;
        ctx.fillRect(0, 0, 48, 3);
        canvas.refresh();
      }
    }
  }

  private createEnvironmentTextures() {
    if (!this.textures.exists('road_gap')) {
      const canvas = this.textures.createCanvas('road_gap', 160, 96);
      if (canvas) {
        const ctx = canvas.context;
        // Abyssal drop shaft cleanly cutting the viaduct deck
        const dropGrad = ctx.createLinearGradient(0, 0, 0, 96);
        dropGrad.addColorStop(0, '#090a18');
        dropGrad.addColorStop(0.55, '#05060f');
        dropGrad.addColorStop(1, '#020207');
        ctx.fillStyle = dropGrad;
        ctx.fillRect(0, 0, 160, 96);

        // Sheared viaduct end-pillars flanking the gap
        ctx.fillStyle = '#1c2345';
        ctx.fillRect(0, 0, 10, 96);
        ctx.fillRect(150, 0, 10, 96);
        ctx.fillStyle = '#2c3769';
        ctx.fillRect(8, 22, 3, 74);
        ctx.fillRect(149, 22, 3, 74);

        // High-contrast crimson/amber hazard edge caps at deck level
        ctx.fillStyle = '#ff2a6d';
        ctx.fillRect(0, 0, 13, 12);
        ctx.fillRect(147, 0, 13, 12);
        ctx.fillStyle = '#ffc857';
        ctx.fillRect(2, 3, 8, 4);
        ctx.fillRect(150, 3, 8, 4);

        // Faint downward laser-drop guide lines inside shaft walls
        ctx.fillStyle = 'rgba(255, 42, 109, 0.22)';
        ctx.fillRect(11, 0, 4, 96);
        ctx.fillRect(145, 0, 4, 96);
        canvas.refresh();
      }
    }

    if (!this.textures.exists('hover_car_0')) {
      const canvas = this.textures.createCanvas('hover_car_0', 36, 10);
      if (canvas) {
        const ctx = canvas.context;
        // Left-bound sleek speeder with cyan headlight & magenta thruster tail
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
        // Right-bound distant speeder with amber headlight & cyan tail
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

        // Retro synthwave horizontal scanline slices in lower half
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
