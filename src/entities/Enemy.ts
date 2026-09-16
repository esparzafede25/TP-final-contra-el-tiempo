import { Entity } from './Entity';
import { SpriteSheetGenerator } from '../graphics/SpriteSheetGenerator';
import { Player } from './Player';
import { AudioManager } from '../core/AudioManager';
import { ParticleSystem } from '../graphics/ParticleSystem';

export type EnemyAIState = 'idle' | 'seek' | 'flank' | 'windup' | 'attack' | 'hurt' | 'knockdown' | 'dead';

export class Enemy extends Entity {
  public enemyType: string;
  public enemyName: string;
  public aiState: EnemyAIState = 'idle';

  // AI parameters
  public walkSpeed: number = 65;
  public attackRangeX: number = 32;
  public attackRangeZ: number = 14;
  public attackDamage: number = 10;
  public attackCooldown: number = 1.5;
  public attackTimer: number = 0;
  public windupDuration: number = 0.4;
  public windupTimer: number = 0;

  public scoreValue: number = 200;

  // Animation
  protected currentFrame: number = 0;
  protected frameTimer: number = 0;

  // AI flanking offset (each enemy chooses a slot relative to player)
  public flankOffsetX: number = 0;
  public flankOffsetZ: number = 0;
  private thinkTimer: number = 0;

  // Health display
  public showHealthBarTimer: number = 0;

  // Split on death (for Level 2 chore clones)
  public canSplitOnDeath: boolean = false;
  public isSplitChild: boolean = false;

  constructor(x: number, z: number, type: string, name: string) {
    super(x, z);
    this.enemyType = type;
    this.enemyName = name;
    this.width = 32;
    this.height = 48;
    this.maxHealth = 40;
    this.health = 40;
    this.attackTimer = 0.5 + Math.random();

    // Assign random flanking offset
    this.flankOffsetX = (Math.random() > 0.5 ? 1 : -1) * (25 + Math.random() * 20);
    this.flankOffsetZ = (Math.random() - 0.5) * 20;

    this.configureEnemyType();
  }

  private configureEnemyType(): void {
    switch (this.enemyType) {
      case 'botella':
        this.maxHealth = 30;
        this.walkSpeed = 50;
        this.attackDamage = 8;
        this.scoreValue = 150;
        break;
      case 'tv_hipnotico':
        this.maxHealth = 45;
        this.walkSpeed = 40;
        this.attackDamage = 12;
        this.attackRangeX = 40;
        this.scoreValue = 250;
        break;
      case 'notificacion':
        this.maxHealth = 20;
        this.walkSpeed = 95;
        this.attackDamage = 6;
        this.scoreValue = 180;
        break;
      case 'gamer_fantasma':
        this.maxHealth = 40;
        this.walkSpeed = 60;
        this.attackDamage = 14;
        this.scoreValue = 220;
        break;
      case 'duende_procrastinacion':
        this.maxHealth = 35;
        this.walkSpeed = 75;
        this.attackDamage = 10;
        this.scoreValue = 200;
        break;
      case 'sillon_viviente':
        this.maxHealth = 70;
        this.walkSpeed = 35;
        this.attackDamage = 20;
        this.attackRangeX = 36;
        this.scoreValue = 350;
        break;
      case 'platos_mutantes':
        this.maxHealth = 30;
        this.walkSpeed = 65;
        this.attackDamage = 10;
        this.scoreValue = 180;
        break;
      case 'ropa_sucia':
        this.maxHealth = 50;
        this.walkSpeed = 45;
        this.attackDamage = 14;
        this.scoreValue = 240;
        break;
      case 'escoba_rebelde':
        this.maxHealth = 35;
        this.walkSpeed = 70;
        this.attackDamage = 12;
        this.scoreValue = 200;
        break;
      case 'bolsa_basura':
        this.maxHealth = 40;
        this.walkSpeed = 60;
        this.attackDamage = 10;
        this.scoreValue = 210;
        break;
      case 'clon_tareas':
        this.maxHealth = 35;
        this.walkSpeed = 60;
        this.attackDamage = 8;
        this.scoreValue = 250;
        this.canSplitOnDeath = !this.isSplitChild;
        break;
      case 'factura_voladora':
        this.maxHealth = 30;
        this.walkSpeed = 85;
        this.attackDamage = 12;
        this.scoreValue = 220;
        break;
      case 'inspector_monotributo':
        this.maxHealth = 55;
        this.walkSpeed = 55;
        this.attackDamage = 16;
        this.scoreValue = 300;
        break;
      case 'deuda_encapuchada':
        this.maxHealth = 65;
        this.walkSpeed = 50;
        this.attackDamage = 22;
        this.scoreValue = 350;
        break;
      case 'pasajero_impaciente':
        this.maxHealth = 40;
        this.walkSpeed = 70;
        this.attackDamage = 14;
        this.scoreValue = 230;
        break;
      case 'cliente_cambio':
        this.maxHealth = 45;
        this.walkSpeed = 55;
        this.attackDamage = 15;
        this.scoreValue = 260;
        break;
      case 'protag_clon':
        this.maxHealth = 60;
        this.walkSpeed = 80;
        this.attackDamage = 18;
        this.scoreValue = 400;
        break;
    }
    this.health = this.maxHealth;
  }

  public updateAI(player: Player, dt: number, particles: ParticleSystem): void {
    if (this.isDead) return;

    if (this.hitstopTimer > 0) return;

    if (this.showHealthBarTimer > 0) {
      this.showHealthBarTimer -= dt;
    }

    // Cooldown
    if (this.attackTimer > 0) {
      this.attackTimer -= dt;
    }

    // Animation frame cycling
    this.frameTimer += dt;
    if (this.frameTimer > 0.12) {
      this.frameTimer = 0;
      this.currentFrame = (this.currentFrame + 1) % 4;
    }

    // Don't think if knocked down or hurt
    if (this.aiState === 'hurt' || this.aiState === 'knockdown') {
      this.vx *= 0.9;
      this.vz *= 0.9;
      return;
    }

    // Handle telegraph / windup
    if (this.aiState === 'windup') {
      this.vx = 0;
      this.vz = 0;
      this.windupTimer -= dt;
      if (this.windupTimer <= 0) {
        this.executeAttack(player, particles);
      }
      return;
    }

    // Distance to player
    const dx = player.x - this.x;
    const dz = player.z - this.z;
    const dist = Math.hypot(dx, dz);

    this.facing = dx > 0 ? 'right' : 'left';

    // Periodically re-evaluate flank slot
    this.thinkTimer += dt;
    if (this.thinkTimer > 2.0) {
      this.thinkTimer = 0;
      this.flankOffsetZ = (Math.random() - 0.5) * 24;
    }

    // Check if in attack range
    const inRangeX = Math.abs(dx) <= this.attackRangeX;
    const inRangeZ = Math.abs(dz) <= this.attackRangeZ;

    if (inRangeX && inRangeZ && this.attackTimer <= 0 && !player.isDead) {
      // Begin attack windup / telegraph
      this.aiState = 'windup';
      this.windupTimer = this.windupDuration;
      return;
    }

    // Movement: Move towards flank position around player
    const targetX = player.x + this.flankOffsetX;
    const targetZ = player.z + this.flankOffsetZ;

    const toTargetX = targetX - this.x;
    const toTargetZ = targetZ - this.z;
    const targetDist = Math.hypot(toTargetX, toTargetZ);

    if (targetDist > 10) {
      this.vx = (toTargetX / targetDist) * this.walkSpeed;
      this.vz = (toTargetZ / targetDist) * (this.walkSpeed * 0.7);
      this.aiState = 'seek';
    } else {
      this.vx = 0;
      this.vz = 0;
      this.aiState = 'idle';
    }
  }

  private executeAttack(player: Player, particles: ParticleSystem): void {
    this.aiState = 'attack';
    this.attackTimer = this.attackCooldown;

    const dx = player.x - this.x;
    const dz = Math.abs(player.z - this.z);

    // Check if player is still in range when attack releases
    if (Math.abs(dx) <= this.attackRangeX + 6 && dz <= this.attackRangeZ + 4 && player.invulnerableTimer <= 0) {
      const knockDir = dx >= 0 ? 90 : -90;
      player.takeDamage(this.attackDamage, knockDir, 0, 40);
      particles.emitHitSparks(player.x, player.y + 20, player.z, 6);
    }

    setTimeout(() => {
      if (this.aiState === 'attack') {
        this.aiState = 'idle';
      }
    }, 250);
  }

  public override takeDamage(amount: number, knockbackX: number = 0, knockbackZ: number = 0, knockbackY: number = 0): void {
    if (this.isDead) return;

    this.showHealthBarTimer = 2.0;

    if (amount >= 20 || knockbackY > 60) {
      this.aiState = 'knockdown';
      AudioManager.getInstance().playKnockdown();
      setTimeout(() => {
        if (!this.isDead) {
          this.aiState = 'idle';
        }
      }, 500);
    } else {
      this.aiState = 'hurt';
      setTimeout(() => {
        if (!this.isDead && this.aiState === 'hurt') {
          this.aiState = 'idle';
        }
      }, 200);
    }

    super.takeDamage(amount, knockbackX, knockbackZ, knockbackY);
  }

  protected override onDeath(): void {
    this.aiState = 'dead';
    this.showHealthBarTimer = 0;
  }

  public render(ctx: CanvasRenderingContext2D, cameraX: number, cameraY: number): void {
    if (this.isDead) return;

    const frames = SpriteSheetGenerator.getEnemyFrames(this.enemyType);
    const frame = frames[this.currentFrame % frames.length];

    // Telegraph flash when about to attack (windup warning!)
    if (this.aiState === 'windup') {
      ctx.save();
      const sX = Math.round(this.x - cameraX);
      const sZ = Math.round(this.z - 28 - cameraY);
      ctx.fillStyle = '#ff4757';
      ctx.font = 'bold 8px monospace';
      ctx.fillText('!', sX - 2, sZ);
      ctx.restore();
    }

    this.drawSpriteFrame(ctx, frame, cameraX, cameraY);

    // Health bar overhead when damaged
    if (this.showHealthBarTimer > 0 && !this.isDead) {
      const sX = Math.round(this.x - cameraX);
      const sY = Math.round(this.z - this.y - 38 - cameraY);
      const barW = 24;
      const barH = 3;
      const pct = this.health / this.maxHealth;

      ctx.fillStyle = '#2f3542';
      ctx.fillRect(sX - barW / 2, sY, barW, barH);
      ctx.fillStyle = pct > 0.5 ? '#2ed573' : pct > 0.25 ? '#ffa502' : '#ff4757';
      ctx.fillRect(sX - barW / 2, sY, Math.round(barW * pct), barH);
    }
  }
}
