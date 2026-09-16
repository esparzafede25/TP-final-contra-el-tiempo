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

    // 1. Psychedelic bedroom wall with vibrant neon distortion
    const grad = ctx.createLinearGradient(0, 0, 0, 150);
    grad.addColorStop(0, '#1d0c1f');
    grad.addColorStop(0.5, '#4a1133');
    grad.addColorStop(1, '#8b1e3f');
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, w, 150);

    // Distant parallax layer: Floating open browser tabs and procrastination app icons
    const bgParallax = cameraX * 0.25;
    for (let x = -80; x < w + 160; x += 130) {
      const sx = ((x - bgParallax) % (w + 160) + (w + 160)) % (w + 160) - 80;

      // Floating YouTube Window
      ctx.fillStyle = 'rgba(255, 71, 87, 0.85)';
      ctx.fillRect(sx, 25, 34, 22);
      ctx.fillStyle = '#1e272e';
      ctx.fillRect(sx + 2, 27, 30, 18);
      // Play triangle
      ctx.fillStyle = '#ffffff';
      ctx.beginPath();
      ctx.moveTo(sx + 14, 32);
      ctx.lineTo(sx + 22, 36);
      ctx.lineTo(sx + 14, 40);
      ctx.fill();

      // Floating Social Feed / Smartphone
      ctx.fillStyle = '#00d2d3';
      ctx.fillRect(sx + 52, 45, 18, 32);
      ctx.fillStyle = '#10ac84';
      ctx.fillRect(sx + 54, 49, 14, 24);
      // Scroll lines
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(sx + 56, 53, 10, 2);
      ctx.fillRect(sx + 56, 58, 8, 2);
      ctx.fillRect(sx + 56, 63, 6, 2);

      // Floating Game Controller / Steam logo silhouette
      ctx.fillStyle = '#1e90ff';
      ctx.fillRect(sx + 85, 30, 24, 16);
      ctx.fillStyle = '#2f3542';
      ctx.fillRect(sx + 88, 33, 5, 5); // dpad
      ctx.fillStyle = '#f1c40f';
      ctx.fillRect(sx + 100, 34, 3, 3); // button
    }

    // Salvador Dali-style melting wall clock ticking closer to 23:59
    const clockX = ((220 - cameraX * 0.4) % (w + 200) + (w + 200)) % (w + 200) - 40;
    ctx.fillStyle = '#f1f2f6';
    ctx.beginPath();
    ctx.ellipse(clockX, 60, 20, 14, Math.PI * 0.15, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = '#2f3542';
    ctx.lineWidth = 2;
    ctx.stroke();
    // Dripping bottom of clock
    ctx.fillStyle = '#f1f2f6';
    ctx.beginPath();
    ctx.moveTo(clockX - 10, 68);
    ctx.quadraticCurveTo(clockX, 85, clockX + 6, 70);
    ctx.fill();
    // Clock hands showing near midnight!
    ctx.strokeStyle = '#eb2f06';
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.moveTo(clockX, 60);
    ctx.lineTo(clockX - 2, 50); // hand at 11:55
    ctx.moveTo(clockX, 60);
    ctx.lineTo(clockX + 8, 58);
    ctx.stroke();

    // Wallpaper neon wave energy
    ctx.strokeStyle = 'rgba(255, 234, 167, 0.22)';
    ctx.lineWidth = 1;
    for (let y = 30; y < 145; y += 22) {
      ctx.beginPath();
      for (let x = 0; x < w; x += 12) {
        const py = y + Math.sin((x + cameraX * 0.35) / 25) * 5;
        if (x === 0) ctx.moveTo(x, py);
        else ctx.lineTo(x, py);
      }
      ctx.stroke();
    }

    // Midground clutter along the wall: Tangled cables, energy drink cans, pizza boxes
    const midParallax = cameraX * 0.6;
    for (let x = -40; x < w + 120; x += 140) {
      const mx = ((x - midParallax) % (w + 140) + (w + 140)) % (w + 140) - 40;

      // Pizza box stacked
      ctx.fillStyle = '#f39c12';
      ctx.fillRect(mx + 10, 134, 28, 6);
      ctx.fillStyle = '#d35400';
      ctx.fillRect(mx + 12, 128, 24, 6);
      ctx.fillStyle = '#c0392b';
      ctx.fillRect(mx + 18, 125, 4, 3); // pizza logo

      // Soda / energy drink can
      ctx.fillStyle = '#00cec9';
      ctx.fillRect(mx + 70, 132, 7, 14);
      ctx.fillStyle = '#d63031';
      ctx.fillRect(mx + 72, 134, 3, 10);
    }

    // 2. Floor: Retro funky psychedelic carpet
    ctx.fillStyle = '#261129';
    ctx.fillRect(0, 146, w, h - 146);

    // Glowing skirting board
    ctx.fillStyle = '#e84393';
    ctx.fillRect(0, 146, w, 4);
    ctx.fillStyle = '#feca57';
    ctx.fillRect(0, 149, w, 2);

    // Isometric diamond patterned carpet tiles
    const floorParallax = cameraX;
    ctx.fillStyle = '#39173c';
    for (let x = -40; x < w + 60; x += 36) {
      const fx = ((x - floorParallax) % 72 + 72) % 72 - 36;
      for (let y = 152; y < h; y += 24) {
        if (((x / 36) + (y / 24)) % 2 === 0) {
          ctx.fillRect(fx + (x % w), y, 18, 12);
        }
      }
    }
  }
}
