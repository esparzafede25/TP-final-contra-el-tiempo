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

    // 1. Domestic House Wallpaper & Kitchen Backsplash
    ctx.fillStyle = '#f5f6fa';
    ctx.fillRect(0, 0, w, 146);

    // Ceramic tile grid on wall
    ctx.strokeStyle = '#dcdde1';
    ctx.lineWidth = 1;
    for (let y = 10; y < 146; y += 14) {
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(w, y);
      ctx.stroke();
    }
    const tileParallax = cameraX * 0.2;
    for (let x = -20; x < w + 30; x += 18) {
      const tx = ((x - tileParallax) % 18 + 18) % 18;
      ctx.beginPath();
      ctx.moveTo(tx + (x % w), 0);
      ctx.lineTo(tx + (x % w), 146);
      ctx.stroke();
    }

    // Parallax household elements: Kitchen sink, Fridge, Cupboards, Clothesline
    const bgParallax = cameraX * 0.3;

    for (let x = -80; x < w + 180; x += 160) {
      const sx = ((x - bgParallax) % (w + 180) + (w + 180)) % (w + 180) - 80;

      // Refrigerator with colorful sticky notes
      ctx.fillStyle = '#718093';
      ctx.fillRect(sx, 22, 38, 124);
      ctx.fillStyle = '#f5f6fa';
      ctx.fillRect(sx + 2, 24, 34, 120);
      ctx.fillStyle = '#718093';
      ctx.fillRect(sx + 2, 64, 34, 2); // door split
      // Sticky notes: "PAGAR LUZ", "COMPRAR YERBA", "VENCE TP!"
      ctx.fillStyle = '#f1c40f'; // yellow note
      ctx.fillRect(sx + 6, 30, 8, 8);
      ctx.fillStyle = '#ff7675'; // pink note
      ctx.fillRect(sx + 18, 34, 9, 8);
      ctx.fillStyle = '#55efc4'; // green note
      ctx.fillRect(sx + 10, 44, 12, 7);
      ctx.fillStyle = '#0984e3'; // blue magnet
      ctx.fillRect(sx + 24, 46, 3, 3);

      // Kitchen Countertop & Sink overflowing with soapy dishes
      ctx.fillStyle = '#b2bec3';
      ctx.fillRect(sx + 48, 85, 54, 61);
      ctx.fillStyle = '#636e72';
      ctx.fillRect(sx + 52, 90, 36, 18); // sink basin
      // Metallic faucet
      ctx.strokeStyle = '#2d3436';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(sx + 70, 90);
      ctx.lineTo(sx + 70, 78);
      ctx.lineTo(sx + 65, 82);
      ctx.stroke();

      // Pile of dirty plates and bowls
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(sx + 54, 94, 14, 4);
      ctx.fillRect(sx + 55, 90, 12, 3);
      ctx.fillRect(sx + 56, 86, 10, 3);
      // Suds / detergent bubbles
      ctx.fillStyle = '#74b9ff';
      ctx.beginPath();
      ctx.arc(sx + 74, 94, 4, 0, Math.PI * 2);
      ctx.arc(sx + 80, 92, 3, 0, Math.PI * 2);
      ctx.arc(sx + 77, 88, 3, 0, Math.PI * 2);
      ctx.fill();

      // Clothesline overhead stretched across
      ctx.strokeStyle = '#2d3436';
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(sx + 20, 52);
      ctx.lineTo(sx + 160, 52);
      ctx.stroke();

      // Hanging socks and shirts
      ctx.fillStyle = '#e84393';
      ctx.fillRect(sx + 115, 52, 10, 16);
      ctx.fillStyle = '#0984e3';
      ctx.fillRect(sx + 130, 52, 14, 18);
      ctx.fillStyle = '#fdcb6e';
      ctx.fillRect(sx + 148, 52, 8, 12);
    }

    // Wall baseboard / moulding
    ctx.fillStyle = '#2d3436';
    ctx.fillRect(0, 146, w, 5);

    // 2. Parquet wooden floor with warm planks
    ctx.fillStyle = '#b85a28';
    ctx.fillRect(0, 151, w, h - 151);

    const floorParallax = cameraX;
    ctx.strokeStyle = '#8c3d14';
    ctx.lineWidth = 1;

    // Horizontal plank seams
    for (let y = 151; y < h; y += 18) {
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(w, y);
      ctx.stroke();
    }

    // Vertical parquet interlocking seams
    for (let x = -60; x < w + 60; x += 36) {
      const fx = ((x - floorParallax) % 36 + 36) % 36;
      for (let y = 151; y < h; y += 18) {
        ctx.beginPath();
        ctx.moveTo(fx + (x % w), y);
        ctx.lineTo(fx + (x % w), y + 18);
        ctx.stroke();
      }
    }
  }
}
