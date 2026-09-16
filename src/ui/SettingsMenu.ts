import { InputManager, GameAction } from '../core/InputManager';
import { AudioManager } from '../core/AudioManager';
import { SaveManager, GameSettings } from '../core/SaveManager';

export class SettingsMenu {
  private overlayElement: HTMLElement | null = null;
  private isVisible: boolean = false;
  private currentRebindingAction: GameAction | null = null;
  private onCloseCallback: (() => void) | null = null;

  constructor() {
    this.createDOM();
  }

  private createDOM(): void {
    const existing = document.getElementById('settings-overlay');
    if (existing) existing.remove();

    const overlay = document.createElement('div');
    overlay.id = 'settings-overlay';
    overlay.className = 'modal-overlay hidden';
    overlay.innerHTML = `
      <div class="modal-box retro-panel">
        <h2 class="retro-title">CONFIGURACIÓN</h2>
        
        <!-- TABS -->
        <div class="tab-header">
          <button id="tab-controls-btn" class="retro-tab active">CONTROLES</button>
          <button id="tab-audio-btn" class="retro-tab">AUDIO Y VIDEO</button>
          <button id="tab-gameplay-btn" class="retro-tab">DIFICULTAD</button>
        </div>

        <!-- TAB CONTENT: CONTROLS -->
        <div id="tab-controls-content" class="tab-content active">
          <p class="section-desc">Haz clic en una acción para asignar una nueva tecla:</p>
          <div class="controls-list" id="controls-list">
            <!-- Dynamically populated -->
          </div>
          <div class="modal-buttons">
            <button id="reset-controls-btn" class="retro-btn warning">Restaurar Predeterminados</button>
          </div>
        </div>

        <!-- TAB CONTENT: AUDIO & VIDEO -->
        <div id="tab-audio-content" class="tab-content">
          <div class="setting-row">
            <label>Volumen General:</label>
            <input type="range" id="slider-master" min="0" max="1" step="0.05" />
            <span id="label-master">80%</span>
          </div>
          <div class="setting-row">
            <label>Volumen Música:</label>
            <input type="range" id="slider-music" min="0" max="1" step="0.05" />
            <span id="label-music">70%</span>
          </div>
          <div class="setting-row">
            <label>Efectos de Sonido:</label>
            <input type="range" id="slider-sfx" min="0" max="1" step="0.05" />
            <span id="label-sfx">90%</span>
          </div>
          <div class="setting-row checkbox-row">
            <label><input type="checkbox" id="check-crt" /> Filtro Retro CRT / Scanlines</label>
          </div>
          <div class="setting-row checkbox-row">
            <label><input type="checkbox" id="check-shake" /> Vibración de Cámara (Screen Shake)</label>
          </div>
          <div class="modal-buttons">
            <button id="toggle-fullscreen-btn" class="retro-btn">Pantalla Completa (Toggle)</button>
          </div>
        </div>

        <!-- TAB CONTENT: GAMEPLAY -->
        <div id="tab-gameplay-content" class="tab-content">
          <p class="section-desc">Selecciona la dificultad de la partida:</p>
          <div class="difficulty-options">
            <label class="diff-opt">
              <input type="radio" name="difficulty" value="facil" />
              <span class="diff-card">
                <strong>FÁCIL</strong>
                <small>Más energía y enemigos con menos vida.</small>
              </span>
            </label>
            <label class="diff-opt">
              <input type="radio" name="difficulty" value="normal" />
              <span class="diff-card">
                <strong>NORMAL</strong>
                <small>Experiencia beat 'em up clásica equilibrada.</small>
              </span>
            </label>
            <label class="diff-opt">
              <input type="radio" name="difficulty" value="dificil" />
              <span class="diff-card">
                <strong>DIFÍCIL</strong>
                <small>Enemigos más agresivos y reloj implacable.</small>
              </span>
            </label>
          </div>
        </div>

        <div id="rebind-message" class="rebind-prompt hidden">
          Presiona la nueva tecla para: <span id="rebind-action-name"></span>...
        </div>

        <div class="modal-footer">
          <button id="close-settings-btn" class="retro-btn primary">VOLVER</button>
        </div>
      </div>
    `;

    document.body.appendChild(overlay);
    this.overlayElement = overlay;

    this.bindEvents();
  }

  private bindEvents(): void {
    if (!this.overlayElement) return;

    // Tabs
    const tabControls = this.overlayElement.querySelector('#tab-controls-btn')!;
    const tabAudio = this.overlayElement.querySelector('#tab-audio-btn')!;
    const tabGameplay = this.overlayElement.querySelector('#tab-gameplay-btn')!;

    const contentControls = this.overlayElement.querySelector('#tab-controls-content')!;
    const contentAudio = this.overlayElement.querySelector('#tab-audio-content')!;
    const contentGameplay = this.overlayElement.querySelector('#tab-gameplay-content')!;

    const switchTab = (activeBtn: Element, activeContent: Element) => {
      [tabControls, tabAudio, tabGameplay].forEach((t) => t.classList.remove('active'));
      [contentControls, contentAudio, contentGameplay].forEach((c) => c.classList.remove('active'));
      activeBtn.classList.add('active');
      activeContent.classList.add('active');
    };

    tabControls.addEventListener('click', () => switchTab(tabControls, contentControls));
    tabAudio.addEventListener('click', () => switchTab(tabAudio, contentAudio));
    tabGameplay.addEventListener('click', () => switchTab(tabGameplay, contentGameplay));

    // Audio Sliders
    const audio = AudioManager.getInstance();
    const sMaster = this.overlayElement.querySelector('#slider-master') as HTMLInputElement;
    const sMusic = this.overlayElement.querySelector('#slider-music') as HTMLInputElement;
    const sSfx = this.overlayElement.querySelector('#slider-sfx') as HTMLInputElement;

    const lMaster = this.overlayElement.querySelector('#label-master')!;
    const lMusic = this.overlayElement.querySelector('#label-music')!;
    const lSfx = this.overlayElement.querySelector('#label-sfx')!;

    const updateAudioValues = () => {
      const m = parseFloat(sMaster.value);
      const mu = parseFloat(sMusic.value);
      const sf = parseFloat(sSfx.value);

      audio.setVolumes(m, mu, sf);
      lMaster.textContent = `${Math.round(m * 100)}%`;
      lMusic.textContent = `${Math.round(mu * 100)}%`;
      lSfx.textContent = `${Math.round(sf * 100)}%`;
    };

    sMaster.addEventListener('input', updateAudioValues);
    sMusic.addEventListener('input', updateAudioValues);
    sSfx.addEventListener('input', () => {
      updateAudioValues();
      audio.playPunchLight(); // immediate audio feedback
    });

    // Checkboxes
    const checkCrt = this.overlayElement.querySelector('#check-crt') as HTMLInputElement;
    const checkShake = this.overlayElement.querySelector('#check-shake') as HTMLInputElement;

    checkCrt.addEventListener('change', () => {
      const s = SaveManager.loadSettings();
      s.crtFilter = checkCrt.checked;
      SaveManager.saveSettings(s);
    });

    checkShake.addEventListener('change', () => {
      const s = SaveManager.loadSettings();
      s.screenShake = checkShake.checked;
      SaveManager.saveSettings(s);
    });

    // Fullscreen Toggle
    const fsBtn = this.overlayElement.querySelector('#toggle-fullscreen-btn')!;
    fsBtn.addEventListener('click', () => {
      if (!document.fullscreenElement) {
        document.documentElement.requestFullscreen().catch(() => {});
      } else {
        document.exitFullscreen().catch(() => {});
      }
    });

    // Difficulty radio buttons
    const diffRadios = this.overlayElement.querySelectorAll('input[name="difficulty"]');
    diffRadios.forEach((r) => {
      r.addEventListener('change', (e) => {
        const target = e.target as HTMLInputElement;
        const s = SaveManager.loadSettings();
        s.difficulty = target.value as 'facil' | 'normal' | 'dificil';
        SaveManager.saveSettings(s);
      });
    });

    // Reset Controls
    const resetBtn = this.overlayElement.querySelector('#reset-controls-btn')!;
    resetBtn.addEventListener('click', () => {
      InputManager.getInstance().resetToDefaults();
      this.populateControlsList();
      audio.playNotification();
    });

    // Close button
    const closeBtn = this.overlayElement.querySelector('#close-settings-btn')!;
    closeBtn.addEventListener('click', () => {
      this.hide();
    });
  }

  public show(onClose?: () => void): void {
    this.onCloseCallback = onClose || null;
    this.isVisible = true;
    if (!this.overlayElement) return;

    this.overlayElement.classList.remove('hidden');
    this.populateControlsList();
    this.populateAudioAndVideoSettings();
  }

  public hide(): void {
    this.isVisible = false;
    if (this.overlayElement) {
      this.overlayElement.classList.add('hidden');
    }
    if (this.onCloseCallback) {
      this.onCloseCallback();
      this.onCloseCallback = null;
    }
  }

  public isOpen(): boolean {
    return this.isVisible;
  }

  private populateControlsList(): void {
    if (!this.overlayElement) return;
    const list = this.overlayElement.querySelector('#controls-list')!;
    list.innerHTML = '';

    const input = InputManager.getInstance();
    const actions: { id: GameAction; label: string }[] = [
      { id: 'left', label: 'Moverse Izquierda' },
      { id: 'right', label: 'Moverse Derecha' },
      { id: 'up', label: 'Moverse Arriba (Profundidad)' },
      { id: 'down', label: 'Moverse Abajo (Profundidad)' },
      { id: 'attack', label: 'Golpe / Combo / Patada aérea' },
      { id: 'jump', label: 'Saltar' },
      { id: 'pause', label: 'Pausar Juego' },
    ];

    actions.forEach((act) => {
      const row = document.createElement('div');
      row.className = 'control-row';

      const nameSpan = document.createElement('span');
      nameSpan.className = 'action-name';
      nameSpan.textContent = act.label;

      const btn = document.createElement('button');
      btn.className = 'key-bind-btn retro-btn small';
      btn.textContent = input.getKeyLabel(act.id);

      btn.addEventListener('click', () => {
        this.promptRebind(act.id, act.label, btn);
      });

      row.appendChild(nameSpan);
      row.appendChild(btn);
      list.appendChild(row);
    });
  }

  private promptRebind(action: GameAction, label: string, btn: HTMLElement): void {
    const input = InputManager.getInstance();
    const promptBox = this.overlayElement!.querySelector('#rebind-message')!;
    const nameSpan = this.overlayElement!.querySelector('#rebind-action-name')!;

    promptBox.classList.remove('hidden');
    nameSpan.textContent = label;
    btn.textContent = '...PRESIONA...';

    input.startRebinding(action, (act, newKey) => {
      promptBox.classList.add('hidden');
      const result = input.rebindKey(act, newKey);

      if (!result.success && result.conflictAction) {
        alert(`¡La tecla ya está asignada a la acción "${result.conflictAction}"! Elige otra tecla.`);
      }

      this.populateControlsList();
      AudioManager.getInstance().playNotification();
    });
  }

  private populateAudioAndVideoSettings(): void {
    if (!this.overlayElement) return;
    const settings = SaveManager.loadSettings();

    const sMaster = this.overlayElement.querySelector('#slider-master') as HTMLInputElement;
    const sMusic = this.overlayElement.querySelector('#slider-music') as HTMLInputElement;
    const sSfx = this.overlayElement.querySelector('#slider-sfx') as HTMLInputElement;

    const lMaster = this.overlayElement.querySelector('#label-master')!;
    const lMusic = this.overlayElement.querySelector('#label-music')!;
    const lSfx = this.overlayElement.querySelector('#label-sfx')!;

    sMaster.value = settings.masterVolume.toString();
    sMusic.value = settings.musicVolume.toString();
    sSfx.value = settings.sfxVolume.toString();

    lMaster.textContent = `${Math.round(settings.masterVolume * 100)}%`;
    lMusic.textContent = `${Math.round(settings.musicVolume * 100)}%`;
    lSfx.textContent = `${Math.round(settings.sfxVolume * 100)}%`;

    const checkCrt = this.overlayElement.querySelector('#check-crt') as HTMLInputElement;
    const checkShake = this.overlayElement.querySelector('#check-shake') as HTMLInputElement;

    checkCrt.checked = settings.crtFilter;
    checkShake.checked = settings.screenShake;

    // Difficulty
    const diffRadio = this.overlayElement.querySelector(
      `input[name="difficulty"][value="${settings.difficulty}"]`
    ) as HTMLInputElement;
    if (diffRadio) diffRadio.checked = true;
  }
}
