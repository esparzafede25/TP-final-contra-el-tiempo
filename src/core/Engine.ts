import { PixelRenderer } from '../graphics/PixelRenderer';
import { InputManager } from './InputManager';
import { AudioManager } from './AudioManager';
import { SaveManager } from './SaveManager';
import { SettingsMenu } from '../ui/SettingsMenu';
import { PauseMenu } from '../ui/PauseMenu';
import { Scene } from '../scenes/Scene';
import { TitleScene } from '../scenes/TitleScene';
import { CutsceneScene } from '../scenes/CutsceneScene';
import { Level1Scene } from '../scenes/Level1Scene';
import { Level2Scene } from '../scenes/Level2Scene';
import { Level3Scene } from '../scenes/Level3Scene';
import { GameOverScene } from '../scenes/GameOverScene';

export class Engine {
  private canvas: HTMLCanvasElement;
  private renderer: PixelRenderer;
  private input: InputManager;
  private audio: AudioManager;
  private settingsMenu: SettingsMenu;
  private pauseMenu: PauseMenu;

  private currentScene: Scene | null = null;
  private isRunning: boolean = false;
  private lastTime: number = 0;
  private isPaused: boolean = false;

  private activeLevelNumber: number = 1;

  constructor(canvas: HTMLCanvasElement) {
    this.canvas = canvas;
    this.renderer = new PixelRenderer(canvas);
    this.input = InputManager.getInstance();
    this.audio = AudioManager.getInstance();
    this.settingsMenu = new SettingsMenu();
    this.pauseMenu = new PauseMenu();

    // Load initial video settings
    const settings = SaveManager.loadSettings();
    this.renderer.crtFilterEnabled = settings.crtFilter;
  }

  public start(): void {
    this.goToTitle();
    this.isRunning = true;
    this.lastTime = performance.now();
    requestAnimationFrame((t) => this.loop(t));
  }

  private loop(timestamp: number): void {
    if (!this.isRunning) return;

    let dt = (timestamp - this.lastTime) / 1000;
    this.lastTime = timestamp;

    // Clamp dt to avoid physics explodes on lag
    if (dt > 0.05) dt = 0.05;

    // Refresh settings
    const settings = SaveManager.loadSettings();
    this.renderer.crtFilterEnabled = settings.crtFilter;

    // Update scene if not paused
    if (!this.isPaused && this.currentScene) {
      this.currentScene.update(dt);
      this.renderer.update(dt);
    }

    // Render current scene
    if (this.currentScene) {
      this.currentScene.render(this.renderer);
    }

    // Present to canvas
    this.renderer.present();

    // Clear input single-frame states
    this.input.update();

    requestAnimationFrame((t) => this.loop(t));
  }

  // --- Scene Switching Architecture ---

  public changeScene(newScene: Scene): void {
    if (this.currentScene) {
      this.currentScene.destroy();
    }
    this.currentScene = newScene;
    this.currentScene.init();
  }

  public goToTitle(): void {
    this.isPaused = false;
    this.pauseMenu.hide();
    this.changeScene(
      new TitleScene(
        (continueFromCheckpoint) => {
          if (continueFromCheckpoint) {
            const progress = SaveManager.loadProgress();
            this.startLevel(progress.lastCheckpoint || 1);
          } else {
            this.goToIntro();
          }
        },
        (tab) => {
          this.settingsMenu.show();
        }
      )
    );
  }

  public goToIntro(): void {
    this.changeScene(
      new CutsceneScene('intro', () => {
        this.startLevel(1);
      })
    );
  }

  public startLevel(levelNum: number): void {
    this.activeLevelNumber = levelNum;
    let levelScene: Scene;

    if (levelNum === 1) {
      levelScene = new Level1Scene(
        () => this.startLevel(2),
        () => this.goToGameOver(),
        () => this.openPause()
      );
    } else if (levelNum === 2) {
      levelScene = new Level2Scene(
        () => this.startLevel(3),
        () => this.goToGameOver(),
        () => this.openPause()
      );
    } else {
      levelScene = new Level3Scene(
        () => this.goToEpilogue(),
        () => this.goToGameOver(),
        () => this.openPause()
      );
    }

    this.changeScene(levelScene);
  }

  public goToEpilogue(): void {
    this.changeScene(
      new CutsceneScene('epilogue', () => {
        this.goToTitle();
      })
    );
  }

  public goToGameOver(): void {
    this.changeScene(
      new GameOverScene(
        () => {
          // Continue from current level checkpoint
          this.startLevel(this.activeLevelNumber);
        },
        () => {
          // Restart from Level 1
          this.startLevel(1);
        },
        () => {
          this.goToTitle();
        }
      )
    );
  }

  public openPause(): void {
    if (this.isPaused || this.settingsMenu.isOpen()) return;
    this.isPaused = true;
    this.audio.playNotification();

    this.pauseMenu.show({
      onResume: () => {
        this.isPaused = false;
      },
      onSettings: () => {
        this.settingsMenu.show(() => {
          // On settings closed, resume pause menu
          this.pauseMenu.show({
            onResume: () => { this.isPaused = false; },
            onSettings: () => { this.settingsMenu.show(); },
            onRestartCheckpoint: () => {
              this.isPaused = false;
              this.startLevel(this.activeLevelNumber);
            },
            onQuitToTitle: () => {
              this.isPaused = false;
              this.goToTitle();
            },
          });
        });
      },
      onRestartCheckpoint: () => {
        this.isPaused = false;
        this.startLevel(this.activeLevelNumber);
      },
      onQuitToTitle: () => {
        this.isPaused = false;
        this.goToTitle();
      },
    });
  }
}
