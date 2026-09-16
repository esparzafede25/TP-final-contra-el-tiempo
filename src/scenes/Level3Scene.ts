import { LevelScene } from './LevelScene';
import { BossColapso } from '../entities/Bosses';
import { BreakableItem } from '../entities/BreakableItem';
import { AudioManager } from '../core/AudioManager';

export class Level3Scene extends LevelScene {
  private rainDrops: { x: number; y: number; speed: number; len: number }[] = [];
  private rainTimer: number = 0;
  private lightningTimer: number = 0;

  // Brain fog puddles (lagunas mentales)
  private brainFogPuddles: { x: number; z: number; radius: number }[] = [];

  constructor(onLevelComplete: () => void, onGameOver: () => void, onOpenPause: () => void) {
    super(3, onLevelComplete, onGameOver, onOpenPause);
    this.levelTitle = 'COLAPSO MENTAL Y ECONÓMICO';
    this.tpProgressPct = 100;
    this.levelWidth = 2200;

    // Time limit: 180 seconds (3 minutes) ticking down towards 23:59!
    this.level3TimerSeconds = 180;

    // Generate rain particles
    for (let i = 0; i < 70; i++) {
      this.rainDrops.push({
        x: Math.random() * 480,
        y: Math.random() * 270,
        speed: 350 + Math.random() * 200,
        len: 8 + Math.random() * 6,
      });
    }

    // Brain fog dark puddles on the ground
    this.brainFogPuddles = [
      { x: 450, z: 180, radius: 26 },
      { x: 920, z: 160, radius: 30 },
      { x: 1350, z: 210, radius: 32 },
    ];
  }

  public setupLevel(): void {
    AudioManager.getInstance().playMusic('level3');

    // Special items
    this.breakables.push(new BreakableItem(280, 160, 'caja', 'mate'));
    this.breakables.push(new BreakableItem(640, 200, 'tacho', 'agenda')); // freezes time!
    this.breakables.push(new BreakableItem(1080, 150, 'caja', 'auriculares')); // shields distractions
    this.breakables.push(new BreakableItem(1420, 220, 'tacho', 'cafe'));
    this.breakables.push(new BreakableItem(1700, 180, 'caja', 'pizza'));

    // Waves of financial/mental breakdown
    this.waves = [
      {
        triggerX: 300,
        lockMinX: 100,
        lockMaxX: 600,
        isCleared: false,
        enemies: [
          { type: 'factura_voladora', name: 'Factura Voladora', x: 500, z: 150 },
          { type: 'inspector_monotributo', name: 'Inspector Monotributo', x: 540, z: 210 },
          { type: 'pasajero_impaciente', name: 'Pasajero Impaciente', x: 570, z: 180 },
        ],
      },
      {
        triggerX: 750,
        lockMinX: 550,
        lockMaxX: 1100,
        isCleared: false,
        enemies: [
          { type: 'deuda_encapuchada', name: 'Deuda Encapuchada', x: 960, z: 160 },
          { type: 'cliente_cambio', name: 'Cliente "Cambio Chiquito"', x: 1020, z: 220 },
          { type: 'factura_voladora', name: 'Factura Voladora', x: 1060, z: 180 },
          { type: 'inspector_monotributo', name: 'Inspector Monotributo', x: 920, z: 140 },
        ],
      },
      {
        triggerX: 1250,
        lockMinX: 1050,
        lockMaxX: 1600,
        isCleared: false,
        enemies: [
          // The 3 exhausted versions of protagonist from the 3 jobs!
          { type: 'protag_clon', name: 'Versión Chofer Uber', x: 1450, z: 150 },
          { type: 'protag_clon', name: 'Versión Editor Freelance', x: 1500, z: 220 },
          { type: 'protag_clon', name: 'Versión Empleado Oficina', x: 1540, z: 180 },
          { type: 'deuda_encapuchada', name: 'Deuda Encapuchada', x: 1420, z: 200 },
        ],
      },
    ];
  }

  public override update(dt: number): void {
    super.update(dt);

    // Rain drops simulation
    for (const drop of this.rainDrops) {
      drop.y += drop.speed * dt;
      drop.x -= (drop.speed * 0.3) * dt; // diagonal wind
      if (drop.y > 270) {
        drop.y = -10;
        drop.x = Math.random() * 560;
      }
    }

    // Brain fog puddles: drain HP if player stands on them without Auriculares buff
    if (this.player.auricularesTimer <= 0) {
      for (const puddle of this.brainFogPuddles) {
        const dx = Math.abs(this.player.x - puddle.x);
        const dz = Math.abs(this.player.z - puddle.z);
        if (dx < puddle.radius && dz < puddle.radius * 0.6) {
          this.player.health = Math.max(1, this.player.health - 6 * dt);
          this.particles.emitGlitch(this.player.x, 10, this.player.z, 1);
        }
      }
    }

    // Lightning flashes
    this.lightningTimer += dt;
    if (this.lightningTimer > 8.0) {
      this.lightningTimer = 0;
      AudioManager.getInstance().playPunchHeavy();
    }
  }

  protected override triggerBossBattle(): void {
    super.triggerBossBattle();
    this.activeBoss = new BossColapso(this.levelWidth - 120, 180);
  }

  public drawBackground(ctx: CanvasRenderingContext2D, cameraX: number, cameraY: number): void {
    const w = 480;
    const h = 270;

    // 1. Nocturnal rainy city skyline with lightning illumination
    const isLightning = this.lightningTimer < 0.12;

    if (isLightning) {
      ctx.fillStyle = '#b8e994'; // dramatic flash
      ctx.fillRect(0, 0, w, 150);
    } else {
      const grad = ctx.createLinearGradient(0, 0, 0, 150);
      grad.addColorStop(0, '#0a0918');
      grad.addColorStop(0.6, '#181430');
      grad.addColorStop(1, '#2f1a38');
      ctx.fillStyle = grad;
      ctx.fillRect(0, 0, w, 150);
    }

    // Parallax Cathedral of La Plata spires & office towers
    const bgParallax = cameraX * 0.2;

    for (let x = -100; x < w + 220; x += 180) {
      const sx = ((x - bgParallax) % (w + 220) + (w + 220)) % (w + 220) - 100;

      // Gothic Cathedral silhouette (La Plata style central & twin spires)
      ctx.fillStyle = isLightning ? '#2f3640' : '#0c0a1a';
      // Twin spires
      ctx.beginPath();
      ctx.moveTo(sx + 10, 148);
      ctx.lineTo(sx + 24, 25); // spire top
      ctx.lineTo(sx + 38, 148);
      ctx.fill();

      // Cross atop spire
      ctx.strokeStyle = '#f5f6fa';
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(sx + 24, 18);
      ctx.lineTo(sx + 24, 26);
      ctx.moveTo(sx + 21, 21);
      ctx.lineTo(sx + 27, 21);
      ctx.stroke();

      // Cathedral nave & rose window
      ctx.fillStyle = isLightning ? '#353b48' : '#0e0d20';
      ctx.fillRect(sx + 38, 60, 50, 88);
      // Rose window
      ctx.fillStyle = '#9c88ff';
      ctx.beginPath();
      ctx.arc(sx + 63, 85, 10, 0, Math.PI * 2);
      ctx.fill();

      // Right tower
      ctx.beginPath();
      ctx.moveTo(sx + 88, 148);
      ctx.lineTo(sx + 102, 25);
      ctx.lineTo(sx + 116, 148);
      ctx.fill();

      // Office Building with lit windows (exhausted workers)
      ctx.fillStyle = isLightning ? '#404552' : '#141228';
      ctx.fillRect(sx + 120, 45, 52, 103);

      ctx.fillStyle = '#f1c40f';
      for (let wy = 55; wy < 140; wy += 12) {
        ctx.fillRect(sx + 126, wy, 4, 5);
        ctx.fillRect(sx + 138, wy, 4, 5);
        ctx.fillRect(sx + 154, wy, 4, 5);
      }

      // Neon Billboard: "AFIP" / "INTIMACIÓN" / "23:59"
      ctx.fillStyle = '#eb2f06';
      ctx.fillRect(sx + 125, 28, 44, 14);
      ctx.strokeStyle = '#ffffff';
      ctx.strokeRect(sx + 125, 28, 44, 14);
      ctx.font = 'bold 6px monospace';
      ctx.fillStyle = '#ffffff';
      ctx.fillText('AFIP: 23:59', sx + 128, 38);
    }

    // Streetlamps with rain cone illumination
    const lampParallax = cameraX * 0.7;
    for (let x = -50; x < w + 150; x += 220) {
      const lx = ((x - lampParallax) % (w + 150) + (w + 150)) % (w + 150) - 50;

      // Lamp pole
      ctx.strokeStyle = '#718093';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(lx, 148);
      ctx.lineTo(lx, 80);
      ctx.lineTo(lx + 14, 76);
      ctx.stroke();

      // Lamp light cone on sidewalk
      const coneGrad = ctx.createRadialGradient(lx + 14, 76, 2, lx + 14, 150, 45);
      coneGrad.addColorStop(0, 'rgba(245, 205, 121, 0.4)');
      coneGrad.addColorStop(1, 'rgba(245, 205, 121, 0)');
      ctx.fillStyle = coneGrad;
      ctx.beginPath();
      ctx.moveTo(lx + 14, 76);
      ctx.lineTo(lx - 25, 150);
      ctx.lineTo(lx + 55, 150);
      ctx.closePath();
      ctx.fill();
    }

    // 2. Wet asphalt street with neon reflections
    ctx.fillStyle = '#11141c';
    ctx.fillRect(0, 148, w, h - 148);

    // Sidewalk curb
    ctx.fillStyle = '#3d4a5d';
    ctx.fillRect(0, 146, w, 4);

    // Yellow dashed road lines
    const roadParallax = cameraX;
    ctx.fillStyle = '#f1c40f';
    for (let x = -40; x < w + 60; x += 40) {
      const rx = ((x - roadParallax) % 80 + 80) % 80 - 40;
      ctx.fillRect(rx + (x % w), 205, 22, 2);
    }

    // Street puddle reflections of neon billboards
    ctx.fillStyle = 'rgba(235, 47, 6, 0.22)';
    ctx.fillRect(0, 158, w, 14);
    ctx.fillStyle = 'rgba(0, 210, 211, 0.25)';
    ctx.fillRect(0, 188, w, 18);

    // Draw Brain Fog Puddles (Lagunas Mentales) on the street
    for (const puddle of this.brainFogPuddles) {
      const sX = Math.round(puddle.x - cameraX);
      const sZ = Math.round(puddle.z - cameraY);

      ctx.save();
      ctx.fillStyle = '#8e44ad';
      ctx.beginPath();
      ctx.ellipse(sX, sZ, puddle.radius, puddle.radius * 0.4, 0, 0, Math.PI * 2);
      ctx.fill();

      // Swirling purple center
      ctx.fillStyle = '#2c003e';
      ctx.beginPath();
      ctx.ellipse(sX, sZ, puddle.radius * 0.7, puddle.radius * 0.25, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    }

    // 3. Rain overlay with diagonal wind
    ctx.strokeStyle = isLightning ? 'rgba(255, 255, 255, 0.8)' : 'rgba(165, 177, 194, 0.55)';
    ctx.lineWidth = 1;
    for (const drop of this.rainDrops) {
      ctx.beginPath();
      ctx.moveTo(drop.x, drop.y);
      ctx.lineTo(drop.x - 3, drop.y + drop.len);
      ctx.stroke();
    }
  }
}
