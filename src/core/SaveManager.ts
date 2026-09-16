export interface KeyBindings {
  left: string;
  right: string;
  up: string;
  down: string;
  attack: string;
  jump: string;
  pause: string;
}

export interface GameSettings {
  masterVolume: number;
  musicVolume: number;
  sfxVolume: number;
  crtFilter: boolean;
  screenShake: boolean;
  difficulty: 'facil' | 'normal' | 'dificil';
}

export interface GameProgress {
  unlockedLevel: number;
  lastCheckpoint: number;
  highScore: number;
  hasActiveGame: boolean;
}

export const DEFAULT_KEYBINDINGS: KeyBindings = {
  left: 'ArrowLeft',
  right: 'ArrowRight',
  up: 'ArrowUp',
  down: 'ArrowDown',
  attack: 'AltLeft',
  jump: 'Space',
  pause: 'Escape',
};

export const DEFAULT_SETTINGS: GameSettings = {
  masterVolume: 0.8,
  musicVolume: 0.7,
  sfxVolume: 0.9,
  crtFilter: true,
  screenShake: true,
  difficulty: 'normal',
};

export const DEFAULT_PROGRESS: GameProgress = {
  unlockedLevel: 1,
  lastCheckpoint: 1,
  highScore: 0,
  hasActiveGame: false,
};

export class SaveManager {
  private static readonly KEYS_STORAGE = 'tp_contra_tiempo_keys';
  private static readonly SETTINGS_STORAGE = 'tp_contra_tiempo_settings';
  private static readonly PROGRESS_STORAGE = 'tp_contra_tiempo_progress';

  public static loadKeys(): KeyBindings {
    try {
      const data = localStorage.getItem(this.KEYS_STORAGE);
      if (data) {
        return { ...DEFAULT_KEYBINDINGS, ...JSON.parse(data) };
      }
    } catch (e) {
      console.warn('Error loading keybindings from localStorage', e);
    }
    return { ...DEFAULT_KEYBINDINGS };
  }

  public static saveKeys(keys: KeyBindings): void {
    try {
      localStorage.setItem(this.KEYS_STORAGE, JSON.stringify(keys));
    } catch (e) {
      console.warn('Error saving keybindings to localStorage', e);
    }
  }

  public static resetKeys(): KeyBindings {
    this.saveKeys(DEFAULT_KEYBINDINGS);
    return { ...DEFAULT_KEYBINDINGS };
  }

  public static loadSettings(): GameSettings {
    try {
      const data = localStorage.getItem(this.SETTINGS_STORAGE);
      if (data) {
        return { ...DEFAULT_SETTINGS, ...JSON.parse(data) };
      }
    } catch (e) {
      console.warn('Error loading settings from localStorage', e);
    }
    return { ...DEFAULT_SETTINGS };
  }

  public static saveSettings(settings: GameSettings): void {
    try {
      localStorage.setItem(this.SETTINGS_STORAGE, JSON.stringify(settings));
    } catch (e) {
      console.warn('Error saving settings to localStorage', e);
    }
  }

  public static loadProgress(): GameProgress {
    try {
      const data = localStorage.getItem(this.PROGRESS_STORAGE);
      if (data) {
        return { ...DEFAULT_PROGRESS, ...JSON.parse(data) };
      }
    } catch (e) {
      console.warn('Error loading progress from localStorage', e);
    }
    return { ...DEFAULT_PROGRESS };
  }

  public static saveProgress(progress: Partial<GameProgress>): void {
    try {
      const current = this.loadProgress();
      const updated = { ...current, ...progress };
      localStorage.setItem(this.PROGRESS_STORAGE, JSON.stringify(updated));
    } catch (e) {
      console.warn('Error saving progress to localStorage', e);
    }
  }
}
