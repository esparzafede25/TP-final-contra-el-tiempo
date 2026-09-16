import { AudioManager } from '../core/AudioManager';

export class PauseMenu {
  private overlayElement: HTMLElement | null = null;
  private isPaused: boolean = false;

  private onResumeCallback: (() => void) | null = null;
  private onSettingsCallback: (() => void) | null = null;
  private onRestartCheckpointCallback: (() => void) | null = null;
  private onQuitToTitleCallback: (() => void) | null = null;

  constructor() {
    this.createDOM();
  }

  private createDOM(): void {
    const existing = document.getElementById('pause-overlay');
    if (existing) existing.remove();

    const overlay = document.createElement('div');
    overlay.id = 'pause-overlay';
    overlay.className = 'modal-overlay hidden';
    overlay.innerHTML = `
      <div class="modal-box retro-panel pause-box">
        <h2 class="retro-title">PAUSA</h2>
        <div class="pause-menu-buttons">
          <button id="pause-resume-btn" class="retro-btn primary large">CONTINUAR</button>
          <button id="pause-settings-btn" class="retro-btn large">CONFIGURACIÓN</button>
          <button id="pause-restart-btn" class="retro-btn warning large">REINICIAR CHECKPOINT</button>
          <button id="pause-quit-btn" class="retro-btn danger large">SALIR AL MENÚ</button>
        </div>
      </div>
    `;

    document.body.appendChild(overlay);
    this.overlayElement = overlay;

    this.bindEvents();
  }

  private bindEvents(): void {
    if (!this.overlayElement) return;

    this.overlayElement.querySelector('#pause-resume-btn')!.addEventListener('click', () => {
      this.resume();
    });

    this.overlayElement.querySelector('#pause-settings-btn')!.addEventListener('click', () => {
      if (this.onSettingsCallback) this.onSettingsCallback();
    });

    this.overlayElement.querySelector('#pause-restart-btn')!.addEventListener('click', () => {
      if (this.onRestartCheckpointCallback) this.onRestartCheckpointCallback();
      this.hide();
    });

    this.overlayElement.querySelector('#pause-quit-btn')!.addEventListener('click', () => {
      if (this.onQuitToTitleCallback) this.onQuitToTitleCallback();
      this.hide();
    });
  }

  public show(callbacks: {
    onResume: () => void;
    onSettings: () => void;
    onRestartCheckpoint: () => void;
    onQuitToTitle: () => void;
  }): void {
    this.isPaused = true;
    this.onResumeCallback = callbacks.onResume;
    this.onSettingsCallback = callbacks.onSettings;
    this.onRestartCheckpointCallback = callbacks.onRestartCheckpoint;
    this.onQuitToTitleCallback = callbacks.onQuitToTitle;

    if (this.overlayElement) {
      this.overlayElement.classList.remove('hidden');
    }
  }

  public resume(): void {
    this.hide();
    if (this.onResumeCallback) {
      this.onResumeCallback();
    }
  }

  public hide(): void {
    this.isPaused = false;
    if (this.overlayElement) {
      this.overlayElement.classList.add('hidden');
    }
  }

  public isOpen(): boolean {
    return this.isPaused;
  }
}
