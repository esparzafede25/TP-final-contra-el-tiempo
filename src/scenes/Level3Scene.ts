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

    // 1. Nocturnal rainy city skyline inspired by La Plata
    const grad = ctx.createLinearGradient(0, 0, 0, 150);
    grad.addColorStop(0, '#0c0b1e');
    grad.addColorStop(0.6, '#1e1a3a');
    grad.addColorStop(1, '#3b2042');
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, w, 150);

    // Parallax Cathedral silhouettes, streetlamps and neon "VENCIMIENTO" billboards
    const bgParallax = cameraX * 0.2;

    for (let x = -100; x < w + 200; x += 160) {
      const sx = ((x - bgParallax) % (w + 200) + (w + 200)) % (w + 200) - 100;

      // Cathedral towers & office buildings
      ctx.fillStyle = '#100e24';
      ctx.fillRect(sx, 20, 36, 130);
      ctx.fillRect(sx + 36, 40, 50, 110);
      ctx.fillRect(sx + 86, 10, 36, 140);

      // Windows lit in buildings
      ctx.fillStyle = '#f1c40f';
      for (let wy = 50; wy < 130; wy += 14) {
        ctx.fillRect(sx + 8, wy, 4, 6);
        ctx.fillRect(sx + 20, wy, 4, 6);
        ctx.fillRect(sx + 50, wy, 4, 6);
      }

      // Neon Billboard: "VENCIMIENTO" / "ARBA" / "AFIP"
      ctx.fillStyle = '#ff3838';
      ctx.fillRect(sx + 15, 25, 42, 14);
      ctx.strokeStyle = '#ffffff';
      ctx.strokeRect(sx + 15, 25, 42, 14);
      ctx.font = 'bold 6px monospace';
      ctx.fillStyle = '#ffffff';
      ctx.fillText('VENCE HOY', sx + 18, 35);
    }

    // 2. Wet asphalt street with neon reflections
    ctx.fillStyle = '#151922';
    ctx.fillRect(0, 150, w, h - 150);

    // Street puddle reflections
    const floorParallax = cameraX;
    ctx.fillStyle = 'rgba(232, 65, 24, 0.2)';
    ctx.fillRect(0, 160, w, 15);
    ctx.fillStyle = 'rgba(0, 210, 211, 0.2)';
    ctx.fillRect(0, 200, w, 20);

    // Sidewalk curb
    ctx.fillStyle = '#4b6584';
    ctx.fillRect(0, 148, w, 4);

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

    // 3. Rain overlay
    ctx.strokeStyle = 'rgba(165, 177, 194, 0.5)';
    ctx.lineWidth = 1;
    for (const drop of this.rainDrops) {
      ctx.beginPath();
      ctx.moveTo(drop.x, drop.y);
      ctx.lineTo(drop.x - 3, drop.y + drop.len);
      ctx.stroke();
    }
  }
}
