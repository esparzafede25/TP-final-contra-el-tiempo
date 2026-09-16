import { Scene } from './Scene';
import { PixelRenderer } from '../graphics/PixelRenderer';
import { AudioManager } from '../core/AudioManager';
import { InputManager } from '../core/InputManager';
import { SpriteSheetGenerator } from '../graphics/SpriteSheetGenerator';

export class CutsceneScene implements Scene {
  private mode: 'intro' | 'epilogue';
  private onFinished: () => void;

  private timer: number = 0;
  private typingFrame: number = 0;
  private typingSoundTimer: number = 0;

  constructor(mode: 'intro' | 'epilogue', onFinished: () => void) {
    this.mode = mode;
    this.onFinished = onFinished;
  }

  public init(): void {
    this.timer = 0;
    this.typingFrame = 0;
    if (this.mode === 'epilogue') {
      AudioManager.getInstance().stopMusic();
    }
  }

  public update(dt: number): void {
    this.timer += dt;
    const input = InputManager.getInstance();
    const audio = AudioManager.getInstance();

    // Intro can be skipped with Space or Attack
    if (this.mode === 'intro') {
      if (input.isJustPressed('jump') || input.isJustPressed('attack') || input.isJustPressed('pause')) {
        this.onFinished();
        return;
      }
      if (this.timer >= 12.0) {
        this.onFinished();
        return;
      }
    } else {
      // Epilogue keyboard sounds while typing
      if (this.timer < 5.0) {
        this.typingSoundTimer += dt;
        if (this.typingSoundTimer > 0.08) {
          this.typingSoundTimer = 0;
          this.typingFrame = (this.typingFrame + 1) % 4;
          audio.playTyping();
        }
      } else if (this.timer >= 5.0 && this.timer < 5.1) {
        audio.playSubmit();
      } else if (this.timer >= 9.0 && this.timer < 9.1) {
        audio.playNotification();
      }

      if (this.timer >= 15.0 || (this.timer > 11.0 && input.isJustPressed('jump'))) {
        this.onFinished();
      }
    }
  }

  public render(renderer: PixelRenderer): void {
    const ctx = renderer.getBufferCtx();
    const w = renderer.virtualWidth;
    const h = renderer.virtualHeight;

    ctx.save();

    if (this.mode === 'intro') {
      this.renderIntro(ctx, w, h);
    } else {
      this.renderEpilogue(ctx, w, h);
    }

    ctx.restore();
  }

  private renderIntro(ctx: CanvasRenderingContext2D, w: number, h: number): void {
    // Room background
    ctx.fillStyle = '#1e272e';
    ctx.fillRect(0, 0, w, h);

    // Wall & floor
    ctx.fillStyle = '#2f3542';
    ctx.fillRect(0, 0, w, 180);
    ctx.fillStyle = '#57606f';
    ctx.fillRect(0, 180, w, h - 180);

    // Drawing Desk & Protagonist Typing at PC
    const typingFrames = SpriteSheetGenerator.getPlayerFrames('typing');
    const fIdx = Math.floor(this.timer * 6) % typingFrames.length;
    const frame = typingFrames[fIdx];

    const px = w / 2 - 32;
    const py = 190;
    ctx.drawImage(frame.canvas, px - frame.originX, py - frame.originY);

    // Wall Clock
    ctx.fillStyle = '#f1f2f6';
    ctx.beginPath();
    ctx.arc(w / 2 + 60, 80, 18, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = '#2f3542';
    ctx.lineWidth = 2;
    ctx.stroke();

    // Clock hands showing 18:00
    ctx.beginPath();
    ctx.moveTo(w / 2 + 60, 80);
    ctx.lineTo(w / 2 + 60, 68); // 12 (minutes)
    ctx.moveTo(w / 2 + 60, 80);
    ctx.lineTo(w / 2 + 60, 90); // 6 (hours)
    ctx.stroke();

    ctx.textAlign = 'center';

    // Cinematic Text progression
    if (this.timer < 3.5) {
      // Step 1: Monitor reading
      ctx.fillStyle = 'rgba(0, 0, 0, 0.75)';
      ctx.fillRect(40, 20, w - 80, 40);
      ctx.strokeStyle = '#00d2d3';
      ctx.strokeRect(40, 20, w - 80, 40);

      ctx.font = 'bold 9px monospace';
      ctx.fillStyle = '#ff4757';
      ctx.fillText('TRABAJO PRÁCTICO FINAL', w / 2, 36);
      ctx.fillStyle = '#ffffff';
      ctx.font = 'bold 8px monospace';
      ctx.fillText('ENTREGA: HOY, 23:59', w / 2, 50);
    } else if (this.timer < 7.0) {
      // Step 2: Clock & warping room
      ctx.fillStyle = 'rgba(0, 0, 0, 0.75)';
      ctx.fillRect(40, 20, w - 80, 40);
      ctx.strokeStyle = '#f1c40f';
      ctx.strokeRect(40, 20, w - 80, 40);

      ctx.font = 'bold 8px monospace';
      ctx.fillStyle = '#f1c40f';
      ctx.fillText('Son las 18:00. Quedan 6 horas.', w / 2, 36);
      ctx.fillStyle = '#ffffff';
      ctx.fillText('Abre el proyecto, pero la habitación empieza a mutar...', w / 2, 50);

      // Warping psychedelic wavy lines
      ctx.strokeStyle = `hsl(${(this.timer * 100) % 360}, 80%, 50%)`;
      ctx.lineWidth = 2;
      for (let i = 0; i < 5; i++) {
        ctx.beginPath();
        ctx.arc(w / 2 + (i - 2) * 40, 100, 20 + Math.sin(this.timer * 4 + i) * 10, 0, Math.PI * 2);
        ctx.stroke();
      }
    } else if (this.timer < 10.5) {
      // Step 3: Procrastination quote
      ctx.fillStyle = 'rgba(0, 0, 0, 0.85)';
      ctx.fillRect(20, 20, w - 40, 46);
      ctx.strokeStyle = '#ff007f';
      ctx.strokeRect(20, 20, w - 40, 46);

      ctx.font = 'bold 8px monospace';
      ctx.fillStyle = '#ffffff';
      ctx.fillText('“Para entregar el TP deberá atravesar todo', w / 2, 38);
      ctx.fillText('lo que lleva semanas evitando.”', w / 2, 52);
    } else {
      // Step 4: Level 1 Title Banner
      ctx.fillStyle = 'rgba(0, 0, 0, 0.9)';
      ctx.fillRect(40, 30, w - 80, 50);
      ctx.strokeStyle = '#00d2d3';
      ctx.strokeRect(40, 30, w - 80, 50);

      ctx.font = 'bold 12px monospace';
      ctx.fillStyle = '#ff4757';
      ctx.fillText('NIVEL 1', w / 2, 50);
      ctx.font = 'bold 10px monospace';
      ctx.fillStyle = '#f1c40f';
      ctx.fillText('PROCRASTINACIÓN', w / 2, 68);
    }

    // Skip notice
    ctx.font = 'bold 7px monospace';
    ctx.fillStyle = '#a4b0be';
    ctx.fillText('[Espacio / Alt para omitir]', w / 2, h - 10);
  }

  private renderEpilogue(ctx: CanvasRenderingContext2D, w: number, h: number): void {
    ctx.fillStyle = '#0b0c10';
    ctx.fillRect(0, 0, w, h);

    ctx.textAlign = 'center';

    if (this.timer < 5.0) {
      // Typing frantically
      const typingFrames = SpriteSheetGenerator.getPlayerFrames('typing');
      const frame = typingFrames[this.typingFrame % typingFrames.length];
      const px = w / 2;
      const py = 170;
      ctx.drawImage(frame.canvas, px - frame.originX, py - frame.originY);

      ctx.font = 'bold 11px monospace';
      ctx.fillStyle = '#ff4757';
      ctx.fillText('¡ESCRIBIENDO FRENÉTICAMENTE!', w / 2, 50);
      ctx.font = 'bold 8px monospace';
      ctx.fillStyle = '#f1c40f';
      ctx.fillText('Compilando, formateando, guardando cambios...', w / 2, 70);
    } else if (this.timer < 9.0) {
      // 23:59 delivered
      ctx.fillStyle = '#1e272e';
      ctx.fillRect(40, 40, w - 80, 100);
      ctx.strokeStyle = '#2ed573';
      ctx.lineWidth = 2;
      ctx.strokeRect(40, 40, w - 80, 100);

      ctx.font = 'bold 20px monospace';
      ctx.fillStyle = '#2ed573';
      ctx.fillText('23:59', w / 2, 75);

      ctx.font = 'bold 11px monospace';
      ctx.fillStyle = '#ffffff';
      ctx.fillText('TRABAJO PRÁCTICO ENTREGADO', w / 2, 105);

      ctx.font = 'bold 8px monospace';
      ctx.fillStyle = '#ffa502';
      ctx.fillText('¡Silencio absoluto en la habitación!', w / 2, 125);
    } else if (this.timer < 14.0) {
      // Comic punchline notification!
      // Tired protagonist looking at camera
      const portrait = SpriteSheetGenerator.getProtagonistPortrait();
      ctx.drawImage(portrait, w / 2 - 16, 50);

      // Notification modal
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(60, 100, w - 120, 55);
      ctx.strokeStyle = '#ff4757';
      ctx.lineWidth = 2;
      ctx.strokeRect(60, 100, w - 120, 55);

      ctx.fillStyle = '#ff4757';
      ctx.fillRect(60, 100, w - 120, 14);
      ctx.fillStyle = '#ffffff';
      ctx.font = 'bold 7px monospace';
      ctx.fillText('NOTIFICACIÓN DEL SISTEMA', w / 2, 110);

      ctx.font = 'bold 8px monospace';
      ctx.fillStyle = '#2f3542';
      ctx.fillText('“El archivo enviado no tiene nombre.”', w / 2, 134);

      ctx.font = 'bold 8px monospace';
      ctx.fillStyle = '#747d8c';
      ctx.fillText('El protagonista mira a cámara, agotado...', w / 2, 185);
    } else {
      // Cut to black
      ctx.fillStyle = '#000000';
      ctx.fillRect(0, 0, w, h);

      ctx.font = 'bold 12px monospace';
      ctx.fillStyle = '#ffffff';
      ctx.fillText('FIN', w / 2, h / 2);
    }
  }

  public destroy(): void {}
}
