import { Scene } from './Scene';
import { PixelRenderer, Renderable } from '../graphics/PixelRenderer';
import { Entity } from '../entities/Entity';
import { Camera } from '../core/Camera';
import { ParticleSystem } from '../graphics/ParticleSystem';
import { HUD } from '../ui/HUD';
import { Player } from '../entities/Player';
import { Enemy } from '../entities/Enemy';
import { BreakableItem, PickupItem } from '../entities/BreakableItem';
import { Cat } from '../entities/Cat';
import { BossAlgoritmo, BossLista, BossColapso, BossPopup } from '../entities/Bosses';
import { AudioManager } from '../core/AudioManager';
import { SaveManager } from '../core/SaveManager';
import { InputManager } from '../core/InputManager';

export interface Wave {
  triggerX: number;
  lockMinX: number;
  lockMaxX: number;
  enemies: { type: string; name: string; x: number; z: number }[];
  isCleared: boolean;
}

export abstract class LevelScene implements Scene {
  public levelNumber: number = 1;
  public tpProgressPct: number = 0;

  protected player: Player;
  protected camera: Camera;
  protected particles: ParticleSystem;
  protected hud: HUD;

  protected enemies: Enemy[] = [];
  protected breakables: BreakableItem[] = [];
  protected pickups: PickupItem[] = [];
  protected cats: Cat[] = [];
  protected bossPopups: BossPopup[] = [];

  protected activeBoss: BossAlgoritmo | BossLista | BossColapso | null = null;
  protected isBossBattle: boolean = false;

  protected waves: Wave[] = [];
  protected currentWaveIndex: number = 0;
  protected isWaveLocked: boolean = false;

  protected levelWidth: number = 2400;
  protected levelHeight: number = 270;

  protected level3TimerSeconds: number | null = null;

  protected onLevelComplete: () => void;
  protected onGameOver: () => void;
  protected onOpenPause: () => void;

  private isLevelFinished: boolean = false;
  private bannerTimer: number = 3.0; // Level start title banner
  public levelTitle: string = '';

  constructor(
    levelNumber: number,
    onLevelComplete: () => void,
    onGameOver: () => void,
    onOpenPause: () => void
  ) {
    this.levelNumber = levelNumber;
    this.onLevelComplete = onLevelComplete;
    this.onGameOver = onGameOver;
    this.onOpenPause = onOpenPause;

    this.player = new Player(60, 180);
    this.camera = new Camera(480, 270);
    this.particles = new ParticleSystem();
    this.hud = new HUD();
  }

  public abstract setupLevel(): void;
  public abstract drawBackground(ctx: CanvasRenderingContext2D, cameraX: number, cameraY: number): void;

  public init(): void {
    this.camera.setBounds(0, this.levelWidth);
    this.setupLevel();

    // Adjust for difficulty
    const settings = SaveManager.loadSettings();
    if (settings.difficulty === 'facil') {
      this.player.maxHealth = 130;
      this.player.health = 130;
      this.player.lives = 4;
    } else if (settings.difficulty === 'dificil') {
      this.player.maxHealth = 85;
      this.player.health = 85;
      this.player.lives = 2;
    }

    // Save checkpoint
    SaveManager.saveProgress({
      unlockedLevel: Math.max(SaveManager.loadProgress().unlockedLevel, this.levelNumber),
      lastCheckpoint: this.levelNumber,
      hasActiveGame: true,
    });
  }

  public update(dt: number): void {
    const input = InputManager.getInstance();

    // Pause toggle
    if (input.isJustPressed('pause')) {
      this.onOpenPause();
      return;
    }

    if (this.bannerTimer > 0) {
      this.bannerTimer -= dt;
    }

    // 1. Update Player
    this.player.update(dt);

    // If player died
    if (this.player.isDead) {
      if (this.player.lives <= 0) {
        setTimeout(() => this.onGameOver(), 1500);
        return;
      } else {
        // Respawn at current wave anchor
        setTimeout(() => {
          if (this.player.isDead) {
            this.player.respawn(this.camera.x + 40, 180);
          }
        }, 1200);
      }
    }

    // 2. Camera Tracking
    this.camera.follow(this.player.x, dt);

    // 3. Update Particles
    this.particles.update(dt);

    // 4. Update Breakables & Pickups
    for (let i = this.pickups.length - 1; i >= 0; i--) {
      const p = this.pickups[i];
      p.update(dt);
      if (p.checkPlayerCollection(this.player, this.particles)) {
        this.pickups.splice(i, 1);
      }
    }

    // 5. Update Cats (non-hittable, playful)
    for (const cat of this.cats) {
      cat.update(dt);
      cat.interactWithPlayer(this.player);
    }

    // 6. Update Boss Popups (for Boss 1)
    for (let i = this.bossPopups.length - 1; i >= 0; i--) {
      const popup = this.bossPopups[i];
      popup.update(dt);
      if (popup.isDead) {
        this.bossPopups.splice(i, 1);
      }
    }

    // 7. Update Active Boss
    if (this.activeBoss && !this.activeBoss.isDead) {
      if (this.activeBoss instanceof BossAlgoritmo) {
        this.activeBoss.updateBoss(this.player, dt, this.bossPopups, this.particles);
      } else if (this.activeBoss instanceof BossLista) {
        this.activeBoss.updateBoss(this.player, dt, this.particles);
      } else if (this.activeBoss instanceof BossColapso) {
        this.activeBoss.updateBoss(this.player, dt, this.particles);
      }
    } else if (this.activeBoss && this.activeBoss.isDead && !this.isLevelFinished) {
      this.isLevelFinished = true;
      AudioManager.getInstance().playMusic('victory');
      setTimeout(() => {
        this.onLevelComplete();
      }, 3500);
    }

    // 8. Waves and Arena Locking
    this.updateWaveLogic();

    // 9. Update Enemies
    for (let i = this.enemies.length - 1; i >= 0; i--) {
      const enemy = this.enemies[i];
      enemy.update(dt);
      enemy.updateAI(this.player, dt, this.particles);

      // Handle Chore Clone split on death
      if (enemy.isDead) {
        if (enemy.canSplitOnDeath) {
          enemy.canSplitOnDeath = false;
          // Spawn 2 mini clones
          const c1 = new Enemy(enemy.x - 12, enemy.z - 6, 'clon_tareas', 'Mini Tarea');
          c1.isSplitChild = true;
          c1.maxHealth = 18;
          c1.health = 18;
          c1.width = 24;
          c1.height = 32;

          const c2 = new Enemy(enemy.x + 12, enemy.z + 6, 'clon_tareas', 'Mini Tarea');
          c2.isSplitChild = true;
          c2.maxHealth = 18;
          c2.health = 18;
          c2.width = 24;
          c2.height = 32;

          this.enemies.push(c1, c2);
          this.particles.emitDust(enemy.x, 20, enemy.z, 6);
        }

        this.particles.emitScorePopup(enemy.x, enemy.y, enemy.z, `+${enemy.scoreValue}`, '#f1c40f');
        this.player.score += enemy.scoreValue;
        this.enemies.splice(i, 1);
      }
    }

    // 10. Combat Hit Collisions (Player Attack -> Enemies, Breakables, Popups, Boss)
    this.handlePlayerAttacks();

    // Level 3 Clock countdown
    if (this.level3TimerSeconds !== null && this.level3TimerSeconds > 0) {
      this.level3TimerSeconds -= dt;
      if (this.level3TimerSeconds <= 0) {
        // Time ran out!
        this.player.takeDamage(999);
      }
    }
  }

  private updateWaveLogic(): void {
    if (this.currentWaveIndex >= this.waves.length) {
      // Check boss arena trigger
      if (!this.isBossBattle && this.player.x >= this.levelWidth - 480) {
        this.triggerBossBattle();
      }
      return;
    }

    const currentWave = this.waves[this.currentWaveIndex];

    // Trigger wave if player reaches position
    if (!this.isWaveLocked && this.player.x >= currentWave.triggerX) {
      this.isWaveLocked = true;
      this.camera.setLockBounds(currentWave.lockMinX, currentWave.lockMaxX);

      // Spawn wave enemies with natural lateral entrance from offscreen
      currentWave.enemies.forEach((eData, idx) => {
        const enemy = new Enemy(eData.x, eData.z, eData.type, eData.name);
        const spawnFromRight = idx % 2 === 1 || eData.x > this.camera.x + 240;
        const offscreenX = spawnFromRight
          ? this.camera.x + 480 + 35 + idx * 25
          : this.camera.x - 35 - idx * 25;

        enemy.startEntrance(offscreenX, eData.z, eData.x, eData.z);
        this.enemies.push(enemy);
      });
    }

    // Check if wave is cleared
    if (this.isWaveLocked && this.enemies.length === 0) {
      this.isWaveLocked = false;
      currentWave.isCleared = true;
      this.currentWaveIndex++;

      // Unlock camera until next wave trigger
      if (this.currentWaveIndex < this.waves.length) {
        this.camera.setLockBounds(currentWave.lockMinX, this.waves[this.currentWaveIndex].lockMaxX);
      } else {
        this.camera.unlockBounds();
      }

      AudioManager.getInstance().playNotification();
    }
  }

  protected triggerBossBattle(): void {
    this.isBossBattle = true;
    this.camera.setLockBounds(this.levelWidth - 480, this.levelWidth);
    AudioManager.getInstance().playMusic('boss');
    this.camera.shake(6, 0.5);
  }

  private handlePlayerAttacks(): void {
    if (!this.player.isAttacking() || !this.player.attackHitbox) return;

    const hitbox = this.player.attackHitbox;

    // 1. Hit Enemies
    for (const enemy of this.enemies) {
      if (enemy.isDead || enemy.invulnerableTimer > 0) continue;

      if (this.player.canHit(enemy, hitbox.rangeX, hitbox.toleranceZ)) {
        enemy.takeDamage(hitbox.damage, hitbox.knockbackX, 0, hitbox.knockbackY);
        this.player.registerHit(hitbox.isFinisher);
        this.camera.shake(hitbox.isFinisher ? 4 : 2, 0.15);
        this.particles.emitHitSparks(enemy.x, enemy.y + 20, enemy.z, 6, hitbox.isFinisher);
      }
    }

    // 2. Hit Active Boss
    if (this.activeBoss && !this.activeBoss.isDead) {
      if (this.player.canHit(this.activeBoss, hitbox.rangeX + 20, hitbox.toleranceZ + 12)) {
        this.activeBoss.takeDamage(hitbox.damage, hitbox.knockbackX, 0, hitbox.knockbackY);
        this.player.registerHit(hitbox.isFinisher);
        this.camera.shake(hitbox.isFinisher ? 5 : 3, 0.2);
        this.particles.emitHitSparks(this.activeBoss.x, this.activeBoss.y + 30, this.activeBoss.z, 8, true);
      }
    }

    // 3. Hit Breakables
    for (const item of this.breakables) {
      if (item.isDead) continue;
      if (this.player.canHit(item, hitbox.rangeX, hitbox.toleranceZ)) {
        item.takeDamage(1);
        this.particles.emitDust(item.x, 15, item.z, 8);

        // Spawn dropped pickup if configured
        if (item.containsPickup) {
          this.pickups.push(new PickupItem(item.x, item.z, item.containsPickup));
        }
      }
    }

    // 4. Hit Boss Popups
    for (const popup of this.bossPopups) {
      if (popup.isDead) continue;
      if (this.player.canHit(popup, hitbox.rangeX, hitbox.toleranceZ)) {
        popup.takeDamage(hitbox.damage);
        this.particles.emitHitSparks(popup.x, 15, popup.z, 6);
      }
    }
  }

  public render(renderer: PixelRenderer): void {
    const ctx = renderer.getBufferCtx();
    const camX = this.camera.getDrawX();
    const camY = this.camera.getDrawY();

    // 1. Parallax background
    this.drawBackground(ctx, camX, camY);

    // 2. Collect all 2.5D renderables
    const renderables: (Entity | Renderable)[] = [
      this.player,
      ...this.enemies,
      ...this.breakables,
      ...this.pickups,
      ...this.cats,
      ...this.bossPopups,
    ];

    if (this.activeBoss) {
      renderables.push(this.activeBoss);
    }

    // Render entities with depth-sorting and ground plane shadows
    renderer.renderEntities(renderables, this.camera);

    // 3. Render Particles on top
    this.particles.render(ctx, camX, camY);

    // 4. Render HUD
    const canAdvanceWave = !this.isWaveLocked && !this.isBossBattle && this.currentWaveIndex < this.waves.length;
    this.hud.render(
      ctx,
      this.player,
      this.levelNumber,
      this.tpProgressPct,
      this.level3TimerSeconds,
      this.activeBoss,
      canAdvanceWave
    );

    // 5. Level Title Banner (at start)
    if (this.bannerTimer > 0) {
      ctx.save();
      ctx.textAlign = 'center';
      ctx.fillStyle = 'rgba(0, 0, 0, 0.85)';
      ctx.fillRect(40, 80, 400, 50);
      ctx.strokeStyle = '#f1c40f';
      ctx.lineWidth = 2;
      ctx.strokeRect(40, 80, 400, 50);

      ctx.font = 'bold 13px monospace';
      ctx.fillStyle = '#ff4757';
      ctx.fillText(`NIVEL ${this.levelNumber}`, 240, 100);

      ctx.font = 'bold 11px monospace';
      ctx.fillStyle = '#f1c40f';
      ctx.fillText(this.levelTitle, 240, 118);
      ctx.restore();
    }
  }

  public destroy(): void {}
}
