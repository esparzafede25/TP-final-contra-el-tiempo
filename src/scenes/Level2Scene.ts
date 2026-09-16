import { LevelScene } from './LevelScene';
import { BossLista } from '../entities/Bosses';
import { BreakableItem } from '../entities/BreakableItem';
import { Cat } from '../entities/Cat';
import { AudioManager } from '../core/AudioManager';

export class Level2Scene extends LevelScene {
  constructor(onLevelComplete: () => void, onGameOver: () => void, onOpenPause: () => void) {
    super(2, onLevelComplete, onGameOver, onOpenPause);
    this.levelTitle = 'RESPONSABILIDADES';
    this.tpProgressPct = 66;
    this.levelWidth = 2000;
  }

  public setupLevel(): void {
    AudioManager.getInstance().playMusic('level2');

    // 2 Playful cats roaming the house (non-damageable)
    this.cats.push(new Cat(320, 160, 'gato_naranja'));
    this.cats.push(new Cat(820, 200, 'gato_tuxedo'));

    // Breakables & Domestic items
    this.breakables.push(new BreakableItem(260, 150, 'caja', 'cafe'));
    this.breakables.push(new BreakableItem(680, 220, 'tacho', 'mate'));
    this.breakables.push(new BreakableItem(1100, 160, 'caja', 'pizza'));
    this.breakables.push(new BreakableItem(1450, 210, 'tacho', 'bebida'));

    // Waves of domestic chores
    this.waves = [
      {
        triggerX: 300,
        lockMinX: 100,
        lockMaxX: 600,
        isCleared: false,
        enemies: [
          { type: 'platos_mutantes', name: 'Platos Mutantes', x: 500, z: 150 },
          { type: 'escoba_rebelde', name: 'Escoba Rebelde', x: 540, z: 210 },
          { type: 'bolsa_basura', name: 'Bolsa de Basura', x: 570, z: 180 },
        ],
      },
      {
        triggerX: 750,
        lockMinX: 550,
        lockMaxX: 1100,
        isCleared: false,
        enemies: [
          { type: 'ropa_sucia', name: 'Monstruo de Ropa', x: 980, z: 160 },
          { type: 'platos_mutantes', name: 'Platos Mutantes', x: 1020, z: 220 },
          { type: 'clon_tareas', name: 'Clon de Tareas', x: 1060, z: 180 }, // Splits on death!
          { type: 'escoba_rebelde', name: 'Escoba Rebelde', x: 940, z: 140 },
        ],
      },
      {
        triggerX: 1250,
        lockMinX: 1050,
        lockMaxX: 1580,
        isCleared: false,
        enemies: [
          { type: 'ropa_sucia', name: 'Monstruo de Ropa', x: 1450, z: 170 },
          { type: 'clon_tareas', name: 'Clon de Tareas', x: 1520, z: 220 },
          { type: 'bolsa_basura', name: 'Bolsa de Basura', x: 1480, z: 150 },
          { type: 'platos_mutantes', name: 'Platos Mutantes', x: 1420, z: 200 },
        ],
      },
    ];
  }

  protected override triggerBossBattle(): void {
    super.triggerBossBattle();
    this.activeBoss = new BossLista(this.levelWidth - 110, 180);
  }

  public drawBackground(ctx: CanvasRenderingContext2D, cameraX: number, cameraY: number): void {
    const w = 480;
    const h = 270;

    // 1. Domestic House Wallpaper (warm colors turning chaotic)
    ctx.fillStyle = '#dcdde1';
    ctx.fillRect(0, 0, w, 150);

    // Wall moulding
    ctx.fillStyle = '#718093';
    ctx.fillRect(0, 144, w, 6);

    // Kitchen cabinets, bookshelves, laundry lines in parallax
    const bgParallax = cameraX * 0.25;

    for (let x = -80; x < w + 160; x += 140) {
      const sx = ((x - bgParallax) % (w + 160) + (w + 160)) % (w + 160) - 80;

      // Cupboard
      ctx.fillStyle = '#e1b12c';
      ctx.fillRect(sx, 30, 48, 60);
      ctx.fillStyle = '#c23616';
      ctx.fillRect(sx + 4, 34, 40, 52);

      // Hanging calendar & clock
      ctx.fillStyle = '#f5f6fa';
      ctx.fillRect(sx + 70, 45, 24, 30);
      ctx.fillStyle = '#e84118';
      ctx.fillRect(sx + 70, 45, 24, 8); // red header

      // Clothesline stretched across
      ctx.strokeStyle = '#2f3542';
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(sx - 20, 110);
      ctx.lineTo(sx + 120, 110);
      ctx.stroke();

      // Hanging socks / shirts
      ctx.fillStyle = '#3498db';
      ctx.fillRect(sx + 20, 110, 12, 16);
      ctx.fillStyle = '#e74c3c';
      ctx.fillRect(sx + 45, 110, 14, 18);
      ctx.fillStyle = '#2ecc71';
      ctx.fillRect(sx + 80, 110, 10, 14);
    }

    // 2. Parquet wooden floor
    ctx.fillStyle = '#cd6133';
    ctx.fillRect(0, 150, w, h - 150);

    // Parquet floor plank lines
    const floorParallax = cameraX;
    ctx.strokeStyle = '#b33939';
    ctx.lineWidth = 1;

    for (let y = 150; y < h; y += 18) {
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(w, y);
      ctx.stroke();
    }

    for (let x = -60; x < w + 60; x += 35) {
      const fx = ((x - floorParallax) % 35 + 35) % 35;
      for (let y = 150; y < h; y += 18) {
        ctx.beginPath();
        ctx.moveTo(fx + (x % w), y);
        ctx.lineTo(fx + (x % w), y + 18);
        ctx.stroke();
      }
    }
  }
}
