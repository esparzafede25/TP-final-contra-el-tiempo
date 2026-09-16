import { LevelScene } from './LevelScene';
import { BossAlgoritmo } from '../entities/Bosses';
import { BreakableItem } from '../entities/BreakableItem';
import { AudioManager } from '../core/AudioManager';

export class Level1Scene extends LevelScene {
  constructor(onLevelComplete: () => void, onGameOver: () => void, onOpenPause: () => void) {
    super(1, onLevelComplete, onGameOver, onOpenPause);
    this.levelTitle = 'PROCRASTINACIÓN';
    this.tpProgressPct = 33;
    this.levelWidth = 1900;
  }

  public setupLevel(): void {
    AudioManager.getInstance().playMusic('level1');

    // Setup Breakables & Pickups along the level
    this.breakables.push(new BreakableItem(280, 150, 'caja', 'mate'));
    this.breakables.push(new BreakableItem(620, 210, 'tacho', 'cafe'));
    this.breakables.push(new BreakableItem(1050, 160, 'caja', 'pizza'));
    this.breakables.push(new BreakableItem(1350, 200, 'tacho', 'bebida'));

    // Waves of distractions
    this.waves = [
      {
        triggerX: 300,
        lockMinX: 100,
        lockMaxX: 580,
        isCleared: false,
        enemies: [
          { type: 'botella', name: 'Botella Caminante', x: 500, z: 150 },
          { type: 'duende_procrastinacion', name: 'Duende Procrastinación', x: 520, z: 210 },
          { type: 'botella', name: 'Botella Caminante', x: 560, z: 180 },
        ],
      },
      {
        triggerX: 750,
        lockMinX: 550,
        lockMaxX: 1050,
        isCleared: false,
        enemies: [
          { type: 'tv_hipnotico', name: 'TV Hipnótico', x: 960, z: 160 },
          { type: 'notificacion', name: 'Notificación', x: 980, z: 220 },
          { type: 'gamer_fantasma', name: 'Gamer Fantasma', x: 1020, z: 180 },
          { type: 'duende_procrastinacion', name: 'Duende Procrastinación', x: 920, z: 140 },
        ],
      },
      {
        triggerX: 1200,
        lockMinX: 1000,
        lockMaxX: 1500,
        isCleared: false,
        enemies: [
          { type: 'sillon_viviente', name: 'Sillón Viviente', x: 1420, z: 170 },
          { type: 'tv_hipnotico', name: 'TV Hipnótico', x: 1440, z: 220 },
          { type: 'gamer_fantasma', name: 'Gamer Fantasma', x: 1380, z: 150 },
          { type: 'notificacion', name: 'Notificación', x: 1460, z: 190 },
        ],
      },
    ];
  }

  protected override triggerBossBattle(): void {
    super.triggerBossBattle();
    this.activeBoss = new BossAlgoritmo(this.levelWidth - 100, 180);
  }

  public drawBackground(ctx: CanvasRenderingContext2D, cameraX: number, cameraY: number): void {
    const w = 480;
    const h = 270;

    // 1. Psychedelic ceiling & wallpaper with neon distortion
    const grad = ctx.createLinearGradient(0, 0, 0, 160);
    grad.addColorStop(0, '#2d132c');
    grad.addColorStop(0.6, '#801336');
    grad.addColorStop(1, '#c72c41');
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, w, 160);

    // Parallax floating TVs and smartphones in background
    const bgParallax = cameraX * 0.3;
    for (let x = -60; x < w + 120; x += 110) {
      const sx = ((x - bgParallax) % (w + 140) + (w + 140)) % (w + 140) - 60;
      // TV silhouette
      ctx.fillStyle = '#ee4540';
      ctx.fillRect(sx, 40, 28, 22);
      ctx.fillStyle = '#2d132c';
      ctx.fillRect(sx + 2, 42, 24, 18);
      // Smartphone silhouette
      ctx.fillStyle = '#00d2d3';
      ctx.fillRect(sx + 50, 60, 14, 28);
      ctx.fillStyle = '#10ac84';
      ctx.fillRect(sx + 52, 64, 10, 20);
    }

    // Neon wallpaper wave pattern
    ctx.strokeStyle = 'rgba(255, 230, 109, 0.2)';
    ctx.lineWidth = 1;
    for (let y = 30; y < 150; y += 20) {
      ctx.beginPath();
      for (let x = 0; x < w; x += 10) {
        const py = y + Math.sin((x + cameraX * 0.4) / 30) * 4;
        if (x === 0) ctx.moveTo(x, py);
        else ctx.lineTo(x, py);
      }
      ctx.stroke();
    }

    // 2. Floor: Retro funky carpet
    ctx.fillStyle = '#2d132c';
    ctx.fillRect(0, 150, w, h - 150);

    // Carpet tiles
    const floorParallax = cameraX;
    ctx.fillStyle = '#3a1839';
    for (let x = -40; x < w + 60; x += 40) {
      const fx = ((x - floorParallax) % 80 + 80) % 80 - 40;
      for (let y = 150; y < h; y += 30) {
        if (((x / 40) + (y / 30)) % 2 === 0) {
          ctx.fillRect(fx + (x % w), y, 20, 15);
        }
      }
    }

    // Floor edge highlight
    ctx.strokeStyle = '#f1c40f';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(0, 150);
    ctx.lineTo(w, 150);
    ctx.stroke();
  }
}
