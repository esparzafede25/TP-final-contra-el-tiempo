import { Entity } from './Entity';
import { SpriteSheetGenerator } from '../graphics/SpriteSheetGenerator';
import { Player } from './Player';
import { AudioManager } from '../core/AudioManager';
import { ParticleSystem } from '../graphics/ParticleSystem';

// Destructible Popup Window spawned by Boss 1
export class BossPopup extends Entity {
  public title: string;
  public isDefeated: boolean = false;

  constructor(x: number, z: number, title: string) {
    super(x, z);
    this.title = title;
    this.width = 36;
    this.height = 24;
    this.maxHealth = 15;
    this.health = 15;
    this.vx = (Math.random() - 0.5) * 40;
    this.vz = (Math.random() - 0.5) * 20;
  }

  public render(ctx: CanvasRenderingContext2D, cameraX: number, cameraY: number): void {
    if (this.isDead) return;
    const sX = Math.round(this.x - cameraX);
    const sY = Math.round(this.z - cameraY);

    // Popup window graphic
    ctx.fillStyle = '#f1f2f6';
    ctx.fillRect(sX - 18, sY - 12, 36, 24);
    ctx.fillStyle = '#ff4757';
    ctx.fillRect(sX - 18, sY - 12, 36, 6); // red titlebar
    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 5px monospace';
    ctx.fillText('X', sX + 13, sY - 7);
    ctx.fillStyle = '#2f3542';
    ctx.font = 'bold 6px monospace';
    ctx.fillText(this.title, sX - 16, sY + 4);
  }
}

// Boss 1: EL ALGORITMO INFINITO
export class BossAlgoritmo extends Entity {
  public bossName = 'EL ALGORITMO INFINITO';
  private frameTimer: number = 0;
  private currentFrame: number = 0;
  private attackPhase: 'laser' | 'popups' | 'notifications' = 'notifications';
  private attackTimer: number = 2.0;

  constructor(x: number, z: number) {
    super(x, z);
    this.width = 64;
    this.height = 72;
    this.maxHealth = 350;
    this.health = 350;
  }

  public updateBoss(
    player: Player,
    dt: number,
    popups: BossPopup[],
    particles: ParticleSystem
  ): void {
    if (this.isDead) return;

    this.frameTimer += dt;
    if (this.frameTimer > 0.12) {
      this.frameTimer = 0;
      this.currentFrame = (this.currentFrame + 1) % 4;
    }

    // Hover gently in place on right side of arena
    this.vz = Math.sin(performance.now() / 600) * 25;

    this.attackTimer -= dt;
    if (this.attackTimer <= 0) {
      this.executeRandomAttack(player, popups, particles);
      this.attackTimer = 2.5 + Math.random() * 1.5;
    }
  }

  private executeRandomAttack(
    player: Player,
    popups: BossPopup[],
    particles: ParticleSystem
  ): void {
    const audio = AudioManager.getInstance();
    const roll = Math.random();

    if (roll < 0.4) {
      // Attack 1: Spawn Popups
      audio.playPopupAlert();
      const titles = ['¡MIRA ESTE REEL!', '¡COMPRA YA!', '¡NO TE PIERDAS!', '¡VIRAL!'];
      for (let i = 0; i < 3; i++) {
        popups.push(
          new BossPopup(
            this.x - 40 - i * 30,
            140 + Math.random() * 80,
            titles[Math.floor(Math.random() * titles.length)]
          )
        );
      }
    } else if (roll < 0.75) {
      // Attack 2: Remote Control Laser Beam across ground
      audio.playNotification();
      particles.emitHitSparks(player.x, player.y, player.z, 8, true);
      const dx = Math.abs(player.x - this.x);
      const dz = Math.abs(player.z - this.z);
      if (dx < 220 && dz < 28 && player.invulnerableTimer <= 0) {
        player.takeDamage(18, -120, 0, 40);
      }
    } else {
      // Attack 3: Notification Stream
      audio.playNotification();
      for (let i = 0; i < 4; i++) {
        particles.emitDust(this.x - 20, 20 + i * 10, this.z, 2);
      }
    }
  }

  public render(ctx: CanvasRenderingContext2D, cameraX: number, cameraY: number): void {
    if (this.isDead) return;
    const frames = SpriteSheetGenerator.getEnemyFrames('boss_algoritmo');
    const frame = frames[this.currentFrame % frames.length];
    this.drawSpriteFrame(ctx, frame, cameraX, cameraY);
  }
}

// Boss 2: LA LISTA INTERMINABLE (3 Cores: Organización, Tiempo, Culpa)
export class BossLista extends Entity {
  public bossName = 'LA LISTA INTERMINABLE';
  private frameTimer: number = 0;
  private currentFrame: number = 0;

  // 3 Cores
  public currentCore: 1 | 2 | 3 = 1;
  public coreNames = {
    1: 'NÚCLEO 1: ORGANIZACIÓN',
    2: 'NÚCLEO 2: TIEMPO',
    3: 'NÚCLEO 3: CULPA',
  };

  public coreHealth: { 1: number; 2: number; 3: number } = {
    1: 150,
    2: 150,
    3: 200,
  };
  public coreMaxHealth: { 1: number; 2: number; 3: number } = {
    1: 150,
    2: 150,
    3: 200,
  };

  private attackTimer: number = 2.0;

  constructor(x: number, z: number) {
    super(x, z);
    this.width = 70;
    this.height = 90;
    this.maxHealth = 500;
    this.health = 500;
  }

  public override takeDamage(amount: number, knockbackX?: number, knockbackZ?: number, knockbackY?: number): void {
    if (this.isDead) return;

    // Damage current core
    this.coreHealth[this.currentCore] -= amount;
    this.health = this.coreHealth[1] + this.coreHealth[2] + this.coreHealth[3];

    if (this.coreHealth[this.currentCore] <= 0) {
      this.coreHealth[this.currentCore] = 0;
      if (this.currentCore === 1) {
        this.currentCore = 2;
        AudioManager.getInstance().playKnockdown();
      } else if (this.currentCore === 2) {
        this.currentCore = 3;
        AudioManager.getInstance().playKnockdown();
      } else {
        this.isDead = true;
        this.onDeath();
      }
    }
  }

  public updateBoss(player: Player, dt: number, particles: ParticleSystem): void {
    if (this.isDead) return;

    this.frameTimer += dt;
    if (this.frameTimer > 0.12) {
      this.frameTimer = 0;
      this.currentFrame = (this.currentFrame + 1) % 4;
    }

    // Sweep across depth
    this.vz = Math.sin(performance.now() / 700) * 30;

    this.attackTimer -= dt;
    if (this.attackTimer <= 0) {
      this.attackTimer = 2.2;
      this.launchCoreAttack(player, particles);
    }
  }

  private launchCoreAttack(player: Player, particles: ParticleSystem): void {
    const audio = AudioManager.getInstance();
    audio.playPunchHeavy();

    // Swirling laundry and papers sweep
    const dx = Math.abs(player.x - this.x);
    const dz = Math.abs(player.z - this.z);

    if (dx < 120 && dz < 35 && player.invulnerableTimer <= 0) {
      player.takeDamage(16, -100, 0, 30);
      particles.emitHitSparks(player.x, player.y, player.z, 8, true);
    }
  }

  public render(ctx: CanvasRenderingContext2D, cameraX: number, cameraY: number): void {
    if (this.isDead) return;
    const frames = SpriteSheetGenerator.getEnemyFrames('boss_lista');
    const frame = frames[this.currentFrame % frames.length];
    this.drawSpriteFrame(ctx, frame, cameraX, cameraY);
  }
}

// Boss 3: EL COLAPSO (3 Phases: Sobrecarga, Laguna mental, Entrega final)
export class BossColapso extends Entity {
  public bossName = 'EL COLAPSO';
  private frameTimer: number = 0;
  private currentFrame: number = 0;

  public phase: 1 | 2 | 3 = 1;
  public phaseTitles = {
    1: 'FASE 1: SOBRECARGA',
    2: 'FASE 2: LAGUNA MENTAL',
    3: 'FASE 3: ENTREGA FINAL (BLOQUEO)',
  };

  public isControlsInverted: boolean = false;
  private attackTimer: number = 2.0;

  constructor(x: number, z: number) {
    super(x, z);
    this.width = 80;
    this.height = 100;
    this.maxHealth = 600;
    this.health = 600;
  }

  public updateBoss(player: Player, dt: number, particles: ParticleSystem): void {
    if (this.isDead) return;

    this.frameTimer += dt;
    if (this.frameTimer > 0.12) {
      this.frameTimer = 0;
      this.currentFrame = (this.currentFrame + 1) % 4;
    }

    // Check phase thresholds
    if (this.health > 400) {
      this.phase = 1;
    } else if (this.health > 200) {
      this.phase = 2;
    } else {
      this.phase = 3;
    }

    this.vz = Math.sin(performance.now() / 500) * 35;

    this.attackTimer -= dt;
    if (this.attackTimer <= 0) {
      this.attackTimer = this.phase === 3 ? 1.4 : 2.0;
      this.executePhaseAttack(player, particles);
    }
  }

  private executePhaseAttack(player: Player, particles: ParticleSystem): void {
    const audio = AudioManager.getInstance();

    if (this.phase === 1) {
      // Phase 1: Overload - Barrage of errors and AFIP bills
      audio.playPopupAlert();
      particles.emitGlitch(this.x - 30, 40, this.z, 8);
      const dx = Math.abs(player.x - this.x);
      const dz = Math.abs(player.z - this.z);
      if (dx < 160 && dz < 30 && player.invulnerableTimer <= 0) {
        player.takeDamage(18, -110, 0, 30);
      }
    } else if (this.phase === 2) {
      // Phase 2: Laguna mental - Control distortion & blackout glitch
      audio.playNotification();
      particles.emitGlitch(player.x, 30, player.z, 12);
      this.isControlsInverted = true;
      setTimeout(() => {
        this.isControlsInverted = false;
      }, 2500);

      const dx = Math.abs(player.x - this.x);
      const dz = Math.abs(player.z - this.z);
      if (dx < 140 && dz < 25 && player.invulnerableTimer <= 0) {
        player.takeDamage(20, -120, 0, 40);
      }
    } else {
      // Phase 3: Final Delivery - Destroy BLOQUEO core before 23:59!
      audio.playPunchHeavy();
      particles.emitHitSparks(player.x, player.y, player.z, 10, true);
      const dx = Math.abs(player.x - this.x);
      const dz = Math.abs(player.z - this.z);
      if (dx < 180 && dz < 35 && player.invulnerableTimer <= 0) {
        player.takeDamage(25, -140, 0, 50);
      }
    }
  }

  public render(ctx: CanvasRenderingContext2D, cameraX: number, cameraY: number): void {
    if (this.isDead) return;
    const frames = SpriteSheetGenerator.getEnemyFrames('boss_colapso');
    const frame = frames[this.currentFrame % frames.length];
    this.drawSpriteFrame(ctx, frame, cameraX, cameraY);
  }
}
