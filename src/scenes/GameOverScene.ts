import { Scene } from './Scene';
import { PixelRenderer } from '../graphics/PixelRenderer';
import { AudioManager } from '../core/AudioManager';
import { InputManager } from '../core/InputManager';
import { SpriteSheetGenerator } from '../graphics/SpriteSheetGenerator';

export class GameOverScene implements Scene {
  private onContinueCheckpoint: () => void;
  private onRestartFromStart: () => void;
  private onQuitToTitle: () => void;

  private selectedIndex: number = 0;
  private options: { id: string; label: string }[] = [];
  private animTimer: number = 0;

  constructor(
    onContinueCheckpoint: () => void,
    onRestartFromStart: () => void,
    onQuitToTitle: () => void
  ) {
    this.onContinueCheckpoint = onContinueCheckpoint;
    this.onRestartFromStart = onRestartFromStart;
    this.onQuitToTitle = onQuitToTitle;
  }

  public init(): void {
    this.options = [
      { id: 'checkpoint', label: 'CONTINUAR DESDE EL CHECKPOINT' },
      { id: 'restart', label: 'COMENZAR DE NUEVO' },
      { id: 'quit', label: 'SALIR AL MENÚ' },
    ];
    this.selectedIndex = 0;
    AudioManager.getInstance().playMusic('gameover');
  }

  public update(dt: number): void {
    this.animTimer += dt;
    const input = InputManager.getInstance();
    const audio = AudioManager.getInstance();

    if (input.isJustPressed('up')) {
      audio.playPunchLight();
      this.selectedIndex = (this.selectedIndex - 1 + this.options.length) % this.options.length;
    } else if (input.isJustPressed('down')) {
      audio.playPunchLight();
      this.selectedIndex = (this.selectedIndex + 1) % this.options.length;
    }

    if (input.isJustPressed('attack') || input.isJustPressed('jump')) {
      audio.playPunchHeavy();
      const choice = this.options[this.selectedIndex].id;
      if (choice === 'checkpoint') {
        this.onContinueCheckpoint();
      } else if (choice === 'restart') {
        this.onRestartFromStart();
      } else {
        this.onQuitToTitle();
      }
    }
  }

  public render(renderer: PixelRenderer): void {
    const ctx = renderer.getBufferCtx();
    const w = renderer.virtualWidth;
    const h = renderer.virtualHeight;

    ctx.save();

    // Dark moody background
    ctx.fillStyle = '#0b0c10';
    ctx.fillRect(0, 0, w, h);

    // Red fog band
    ctx.fillStyle = 'rgba(235, 47, 6, 0.15)';
    ctx.fillRect(0, 80, w, 110);

    ctx.textAlign = 'center';

    // Giant GAME OVER
    ctx.font = '900 24px monospace';
    ctx.fillStyle = '#000000';
    ctx.fillText('GAME OVER', w / 2 + 2, 72);
    ctx.fillStyle = '#ff4757';
    ctx.fillText('GAME OVER', w / 2, 70);

    ctx.font = 'bold 8px monospace';
    ctx.fillStyle = '#747d8c';
    ctx.fillText('El TP no se entregó a tiempo...', w / 2, 90);

    // Defeated protagonist sprite
    const defeatFrame = SpriteSheetGenerator.getPlayerFrames('defeat')[0];
    ctx.drawImage(defeatFrame.canvas, w / 2 - 16, 100);

    // Menu options
    ctx.font = 'bold 9px monospace';
    this.options.forEach((opt, idx) => {
      const y = 180 + idx * 20;
      if (idx === this.selectedIndex) {
        ctx.fillStyle = '#f1c40f';
        ctx.fillText(`► ${opt.label} ◄`, w / 2, y);
      } else {
        ctx.fillStyle = '#dcdde1';
        ctx.fillText(opt.label, w / 2, y);
      }
    });

    // Control hint
    ctx.font = 'bold 7px monospace';
    ctx.fillStyle = '#a4b0be';
    ctx.fillText('[↑/↓] Elegir   [Alt Izq / Espacio] Seleccionar', w / 2, h - 10);

    ctx.restore();
  }

  public destroy(): void {}
}
