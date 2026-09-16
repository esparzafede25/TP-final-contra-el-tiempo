import { Scene } from './Scene';
import { PixelRenderer } from '../graphics/PixelRenderer';
import { AudioManager } from '../core/AudioManager';
import { InputManager } from '../core/InputManager';
import { SaveManager } from '../core/SaveManager';
import { SpriteSheetGenerator } from '../graphics/SpriteSheetGenerator';

export class TitleScene implements Scene {
  private onStartGame: (continueFromCheckpoint: boolean) => void;
  private onOpenSettings: (initialTab?: 'controls' | 'audio' | 'gameplay') => void;

  private selectedIndex: number = 0;
  private menuOptions: { id: string; label: string; enabled: boolean }[] = [];
  private titleAnimTimer: number = 0;
  private hasSavedGame: boolean = false;
  private highScore: number = 0;

  // Credits modal
  private showCreditsModal: boolean = false;

  constructor(
    onStartGame: (continueFromCheckpoint: boolean) => void,
    onOpenSettings: (initialTab?: 'controls' | 'audio' | 'gameplay') => void
  ) {
    this.onStartGame = onStartGame;
    this.onOpenSettings = onOpenSettings;
  }

  public init(): void {
    const progress = SaveManager.loadProgress();
    this.hasSavedGame = progress.hasActiveGame && progress.lastCheckpoint > 1;
    this.highScore = progress.highScore;

    this.menuOptions = [
      { id: 'play', label: 'JUGAR', enabled: true },
      { id: 'continue', label: 'CONTINUAR', enabled: this.hasSavedGame },
      { id: 'controls', label: 'CONTROLES', enabled: true },
      { id: 'settings', label: 'CONFIGURACIÓN', enabled: true },
      { id: 'credits', label: 'CRÉDITOS', enabled: true },
    ];

    if (!this.hasSavedGame) {
      this.selectedIndex = 0;
    } else {
      this.selectedIndex = 1;
    }

    AudioManager.getInstance().playMusic('title');
  }

  public update(dt: number): void {
    this.titleAnimTimer += dt;
    const input = InputManager.getInstance();
    const audio = AudioManager.getInstance();

    if (this.showCreditsModal) {
      if (input.isJustPressed('attack') || input.isJustPressed('jump') || input.isJustPressed('pause')) {
        this.showCreditsModal = false;
        audio.playNotification();
      }
      return;
    }

    // Menu navigation
    if (input.isJustPressed('up')) {
      audio.playPunchLight();
      do {
        this.selectedIndex = (this.selectedIndex - 1 + this.menuOptions.length) % this.menuOptions.length;
      } while (!this.menuOptions[this.selectedIndex].enabled);
    } else if (input.isJustPressed('down')) {
      audio.playPunchLight();
      do {
        this.selectedIndex = (this.selectedIndex + 1) % this.menuOptions.length;
      } while (!this.menuOptions[this.selectedIndex].enabled);
    }

    // Select option
    if (input.isJustPressed('attack') || input.isJustPressed('jump')) {
      this.activateSelected();
    }
  }

  private activateSelected(): void {
    const audio = AudioManager.getInstance();
    const option = this.menuOptions[this.selectedIndex];
    if (!option.enabled) return;

    audio.playPunchHeavy();

    switch (option.id) {
      case 'play':
        this.onStartGame(false);
        break;
      case 'continue':
        this.onStartGame(true);
        break;
      case 'controls':
        this.onOpenSettings('controls');
        break;
      case 'settings':
        this.onOpenSettings('audio');
        break;
      case 'credits':
        this.showCreditsModal = true;
        break;
    }
  }

  public render(renderer: PixelRenderer): void {
    const ctx = renderer.getBufferCtx();
    const w = renderer.virtualWidth;
    const h = renderer.virtualHeight;

    // 1. Retro animated background grid
    ctx.fillStyle = '#0f0c29';
    ctx.fillRect(0, 0, w, h);

    // Horizon line
    const horizonY = 160;
    const gradient = ctx.createLinearGradient(0, 0, 0, horizonY);
    gradient.addColorStop(0, '#24243e');
    gradient.addColorStop(0.5, '#302b63');
    gradient.addColorStop(1, '#ff007f');
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, w, horizonY);

    // Grid floor scrolling
    ctx.fillStyle = '#0b0c10';
    ctx.fillRect(0, horizonY, w, h - horizonY);

    ctx.strokeStyle = '#ff007f';
    ctx.lineWidth = 1;
    const gridOffset = (this.titleAnimTimer * 40) % 20;

    for (let y = horizonY; y < h; y += 10) {
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(w, y);
      ctx.stroke();
    }

    for (let x = -40; x < w + 40; x += 30) {
      ctx.beginPath();
      ctx.moveTo(w / 2 + (x - w / 2) * 0.1, horizonY);
      ctx.lineTo(x + gridOffset, h);
      ctx.stroke();
    }

    // 2. Animated Giant Title
    const titleBob = Math.sin(this.titleAnimTimer * 3) * 4;

    ctx.save();
    ctx.textAlign = 'center';

    // Title shadow
    ctx.font = '900 22px monospace';
    ctx.fillStyle = '#000000';
    ctx.fillText('TP FINAL:', w / 2 + 2, 52 + titleBob + 2);
    ctx.fillText('CONTRA EL TIEMPO', w / 2 + 2, 76 + titleBob + 2);

    // Title outer glow
    ctx.fillStyle = '#ff007f';
    ctx.fillText('TP FINAL:', w / 2 + 1, 52 + titleBob);
    ctx.fillText('CONTRA EL TIEMPO', w / 2 + 1, 76 + titleBob);

    // Title front face
    ctx.fillStyle = '#f1c40f';
    ctx.fillText('TP FINAL:', w / 2, 52 + titleBob);
    ctx.fillStyle = '#ffffff';
    ctx.fillText('CONTRA EL TIEMPO', w / 2, 76 + titleBob);

    // Subtitle
    ctx.font = 'bold 7px monospace';
    ctx.fillStyle = '#00d2d3';
    ctx.fillText('BEAT \'EM UP RETRO - ENTREGA ANTES DE LAS 23:59', w / 2, 92 + titleBob);

    // Protagonist Pixel Portrait beside title
    const portrait = SpriteSheetGenerator.getProtagonistPortrait();
    ctx.drawImage(portrait, w / 2 - 16, 100);

    // High Score
    if (this.highScore > 0) {
      ctx.font = 'bold 7px monospace';
      ctx.fillStyle = '#f1c40f';
      ctx.fillText(`MEJOR PUNTUACIÓN: ${this.highScore}`, w / 2, 142);
    }

    // 3. Menu Options
    ctx.font = 'bold 10px monospace';
    const menuStartY = 160;

    this.menuOptions.forEach((opt, idx) => {
      const y = menuStartY + idx * 17;
      const isSelected = idx === this.selectedIndex;

      if (!opt.enabled) {
        ctx.fillStyle = '#57606f';
        ctx.fillText(opt.label, w / 2, y);
      } else if (isSelected) {
        // Selection cursor and flashing highlight
        ctx.fillStyle = '#ff4757';
        ctx.fillText(`► ${opt.label} ◄`, w / 2, y);
      } else {
        ctx.fillStyle = '#f5f6fa';
        ctx.fillText(opt.label, w / 2, y);
      }
    });

    // Instructions footer
    ctx.font = 'bold 7px monospace';
    ctx.fillStyle = '#a4b0be';
    ctx.fillText('[↑/↓] Seleccionar   [Alt Izq / Espacio] Confirmar', w / 2, h - 8);

    // 4. Credits Modal Overlay
    if (this.showCreditsModal) {
      ctx.fillStyle = 'rgba(0, 0, 0, 0.85)';
      ctx.fillRect(0, 0, w, h);

      ctx.fillStyle = '#1e272e';
      ctx.fillRect(40, 30, w - 80, h - 60);
      ctx.strokeStyle = '#00d2d3';
      ctx.lineWidth = 2;
      ctx.strokeRect(40, 30, w - 80, h - 60);

      ctx.font = 'bold 11px monospace';
      ctx.fillStyle = '#f1c40f';
      ctx.fillText('CRÉDITOS', w / 2, 50);

      ctx.font = 'bold 7px monospace';
      ctx.fillStyle = '#ffffff';
      ctx.fillText('IDEA, CONCEPTO Y GUION AUTOBIOGRÁFICO', w / 2, 70);
      ctx.fillStyle = '#00d2d3';
      ctx.fillText('El estudiante/programador de 41 años', w / 2, 82);

      ctx.fillStyle = '#ffffff';
      ctx.fillText('DESARROLLO Y MOTOR BEAT \'EM UP', w / 2, 102);
      ctx.fillStyle = '#2ed573';
      ctx.fillText('Antigravity Engine & Web Audio Synth', w / 2, 114);

      ctx.fillStyle = '#ffffff';
      ctx.fillText('DEDICADO A:', w / 2, 134);
      ctx.fillStyle = '#ff7675';
      ctx.fillText('La familia, los 2 gatos y a todos los que entregan a las 23:59', w / 2, 146);

      ctx.fillStyle = '#f1c40f';
      ctx.fillText('Presiona Espacio o Alt para volver', w / 2, 175);
    }

    ctx.restore();
  }

  public destroy(): void {}
}
