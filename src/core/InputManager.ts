import { KeyBindings, SaveManager } from './SaveManager';

export type GameAction = 'left' | 'right' | 'up' | 'down' | 'attack' | 'jump' | 'pause';

export class InputManager {
  private static instance: InputManager;
  private keyBindings: KeyBindings;
  private keyState: Map<string, boolean> = new Map();
  private justPressed: Map<string, boolean> = new Map();
  private justReleased: Map<string, boolean> = new Map();
  private rebindCallback: ((action: GameAction, newKey: string) => void) | null = null;
  private rebindTargetAction: GameAction | null = null;

  // Double tap detection for running (dash)
  private lastTapTime: Map<string, number> = new Map();
  private doubleTapped: Map<string, boolean> = new Map();

  private constructor() {
    this.keyBindings = SaveManager.loadKeys();
    this.initEventListeners();
  }

  public static getInstance(): InputManager {
    if (!InputManager.instance) {
      InputManager.instance = new InputManager();
    }
    return InputManager.instance;
  }

  private initEventListeners(): void {
    window.addEventListener(
      'keydown',
      (e: KeyboardEvent) => {
        // Prevent default browser behavior for keys used in game (Space scroll, Alt menu, Arrows scroll)
        const code = e.code;
        const key = e.key;

        // If in rebinding mode
        if (this.rebindTargetAction && this.rebindCallback) {
          e.preventDefault();
          e.stopPropagation();
          const chosenKey = code || key;
          const action = this.rebindTargetAction;
          this.rebindTargetAction = null;
          const cb = this.rebindCallback;
          this.rebindCallback = null;
          cb(action, chosenKey);
          return;
        }

        // Always intercept Alt, Space, Arrow keys, Tab, etc.
        if (
          code.startsWith('Arrow') ||
          code === 'Space' ||
          code === 'AltLeft' ||
          code === 'AltRight' ||
          key === 'Alt' ||
          this.isGameKey(code)
        ) {
          e.preventDefault();
        }

        // Check if just pressed
        if (!this.keyState.get(code)) {
          this.justPressed.set(code, true);

          // Double tap check for dash (e.g. tapping Left twice quickly or Right twice)
          const now = performance.now();
          const lastTime = this.lastTapTime.get(code) || 0;
          if (now - lastTime < 300) {
            this.doubleTapped.set(code, true);
          } else {
            this.doubleTapped.set(code, false);
          }
          this.lastTapTime.set(code, now);
        }

        this.keyState.set(code, true);
        if (key === 'Alt') {
          this.keyState.set('AltLeft', true);
        }
      },
      { passive: false }
    );

    window.addEventListener(
      'keyup',
      (e: KeyboardEvent) => {
        const code = e.code;
        const key = e.key;

        if (
          code.startsWith('Arrow') ||
          code === 'Space' ||
          code === 'AltLeft' ||
          code === 'AltRight' ||
          key === 'Alt' ||
          this.isGameKey(code)
        ) {
          e.preventDefault();
        }

        this.keyState.set(code, false);
        if (key === 'Alt') {
          this.keyState.set('AltLeft', false);
        }
        this.justReleased.set(code, true);
      },
      { passive: false }
    );

    // Reset keys on window blur to avoid stuck keys
    window.addEventListener('blur', () => {
      this.keyState.clear();
      this.justPressed.clear();
      this.justReleased.clear();
      this.doubleTapped.clear();
    });
  }

  private isGameKey(code: string): boolean {
    return Object.values(this.keyBindings).includes(code);
  }

  public update(): void {
    // Clear transient states at the end of frame
    this.justPressed.clear();
    this.justReleased.clear();
    this.doubleTapped.clear();
  }

  public isDown(action: GameAction): boolean {
    const key = this.keyBindings[action];
    return !!this.keyState.get(key);
  }

  public isJustPressed(action: GameAction): boolean {
    const key = this.keyBindings[action];
    return !!this.justPressed.get(key);
  }

  public isJustReleased(action: GameAction): boolean {
    const key = this.keyBindings[action];
    return !!this.justReleased.get(key);
  }

  public isDoubleTapped(action: GameAction): boolean {
    const key = this.keyBindings[action];
    return !!this.doubleTapped.get(key);
  }

  public getKeyForAction(action: GameAction): string {
    return this.keyBindings[action];
  }

  public getKeyLabel(action: GameAction): string {
    const code = this.keyBindings[action];
    return this.formatKeyLabel(code);
  }

  public formatKeyLabel(code: string): string {
    if (code === 'AltLeft') return 'Alt Izq';
    if (code === 'AltRight') return 'Alt Der';
    if (code === 'Space') return 'Espacio';
    if (code === 'ArrowLeft') return '← Izquierda';
    if (code === 'ArrowRight') return '→ Derecha';
    if (code === 'ArrowUp') return '↑ Arriba';
    if (code === 'ArrowDown') return '↓ Abajo';
    if (code === 'Escape') return 'Esc';
    if (code.startsWith('Key')) return code.replace('Key', '');
    if (code.startsWith('Digit')) return code.replace('Digit', '');
    return code;
  }

  public startRebinding(action: GameAction, callback: (action: GameAction, newKey: string) => void): void {
    this.rebindTargetAction = action;
    this.rebindCallback = callback;
  }

  public cancelRebinding(): void {
    this.rebindTargetAction = null;
    this.rebindCallback = null;
  }

  public isRebinding(): boolean {
    return this.rebindTargetAction !== null;
  }

  public rebindKey(action: GameAction, newCode: string): { success: boolean; conflictAction?: GameAction } {
    // Check if key is already assigned to another action
    for (const [act, code] of Object.entries(this.keyBindings)) {
      if (act !== action && code === newCode) {
        return { success: false, conflictAction: act as GameAction };
      }
    }

    this.keyBindings[action] = newCode;
    SaveManager.saveKeys(this.keyBindings);
    return { success: true };
  }

  public resetToDefaults(): void {
    this.keyBindings = SaveManager.resetKeys();
  }
}
