import { Entity } from './Entity';
import { SpriteSheetGenerator } from '../graphics/SpriteSheetGenerator';
import { Player } from './Player';
import { AudioManager } from '../core/AudioManager';
import { ParticleSystem } from '../graphics/ParticleSystem';

export type EnemyAIState = 'entering' | 'idle' | 'seek' | 'flank' | 'windup' | 'attack' | 'hurt' | 'knockdown' | 'dead';
export type EnemyArchetype = 'rusher' | 'flanker' | 'tank' | 'zoner' | 'erratic';

export class Enemy extends Entity {
  public enemyType: string;
  public enemyName: string;
  public aiState: EnemyAIState = 'idle';
  public archetype: EnemyArchetype = 'flanker';

  // Entrance from offscreen
  public entranceTargetX: number = 0;
  public entranceTargetZ: number = 0;

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

  // AI flanking & organic variation
  public flankOffsetX: number = 0;
  public flankOffsetZ: number = 0;
  private thinkTimer: number = 0;
  private wanderTimer: number = 0;
  private wanderPhase: number = Math.random() * Math.PI * 2;

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
    this.maxHealth = 30;
    this.health = 30;
    this.attackTimer = 0.5 + Math.random();

    // Assign random flanking offset
    this.flankOffsetX = (Math.random() > 0.5 ? 1 : -1) * (25 + Math.random() * 20);
    this.flankOffsetZ = (Math.random() - 0.5) * 20;

    this.configureEnemyType();
  }

  public startEntrance(startX: number, startZ: number, targetX: number, targetZ: number): void {
    this.x = startX;
    this.z = startZ;
    this.entranceTargetX = targetX;
    this.entranceTargetZ = targetZ;
    this.aiState = 'entering';
    this.attackTimer = 1.2;
  }

  private configureEnemyType(): void {
    switch (this.enemyType) {
      case 'botella':
        this.archetype = 'flanker';
        this.maxHealth = 26;
        this.walkSpeed = 58;
        this.attackDamage = 7;
        this.scoreValue = 150;
        break;
      case 'tv_hipnotico':
        this.archetype = 'zoner';
        this.maxHealth = 38;
        this.walkSpeed = 45;
        this.attackDamage = 10;
        this.attackRangeX = 42;
        this.windupDuration = 0.45;
        this.scoreValue = 250;
        break;
      case 'notificacion':
        this.archetype = 'rusher';
        this.maxHealth = 22;
        this.walkSpeed = 95;
        this.attackDamage = 5;
        this.windupDuration = 0.25;
        this.scoreValue = 180;
        break;
      case 'gamer_fantasma':
        this.archetype = 'erratic';
        this.maxHealth = 35;
        this.walkSpeed = 68;
        this.attackDamage = 11;
        this.scoreValue = 220;
        break;
      case 'duende_procrastinacion':
        this.archetype = 'flanker';
        this.maxHealth = 28;
        this.walkSpeed = 75;
        this.attackDamage = 8;
        this.scoreValue = 200;
        break;
      case 'sillon_viviente':
        this.archetype = 'tank';
        this.maxHealth = 55;
        this.walkSpeed = 38;
        this.attackDamage = 16;
        this.attackRangeX = 38;
        this.windupDuration = 0.55;
        this.scoreValue = 350;
        break;
      case 'platos_mutantes':
        this.archetype = 'flanker';
        this.maxHealth = 30;
        this.walkSpeed = 65;
        this.attackDamage = 8;
        this.scoreValue = 180;
        break;
      case 'ropa_sucia':
        this.archetype = 'tank';
        this.maxHealth = 48;
        this.walkSpeed = 44;
        this.attackDamage = 13;
        this.windupDuration = 0.5;
        this.scoreValue = 240;
        break;
      case 'escoba_rebelde':
        this.archetype = 'rusher';
        this.maxHealth = 30;
        this.walkSpeed = 75;
        this.attackDamage = 9;
        this.scoreValue = 200;
        break;
      case 'bolsa_basura':
        this.archetype = 'rusher';
        this.maxHealth = 34;
        this.walkSpeed = 64;
        this.attackDamage = 8;
        this.scoreValue = 210;
        break;
      case 'clon_tareas':
        this.archetype = 'erratic';
        this.maxHealth = 28;
        this.walkSpeed = 64;
        this.attackDamage = 7;
        this.scoreValue = 250;
        this.canSplitOnDeath = !this.isSplitChild;
        break;
      case 'factura_voladora':
        this.archetype = 'rusher';
        this.maxHealth = 24;
        this.walkSpeed = 88;
        this.attackDamage = 9;
        this.scoreValue = 220;
        break;
      case 'inspector_monotributo':
        this.archetype = 'zoner';
        this.maxHealth = 44;
        this.walkSpeed = 54;
        this.attackDamage = 12;
        this.windupDuration = 0.45;
        this.scoreValue = 300;
        break;
      case 'deuda_encapuchada':
        this.archetype = 'tank';
        this.maxHealth = 58;
        this.walkSpeed = 50;
        this.attackDamage = 16;
        this.windupDuration = 0.5;
        this.scoreValue = 350;
        break;
      case 'pasajero_impaciente':
        this.archetype = 'erratic';
        this.maxHealth = 34;
        this.walkSpeed = 72;
        this.attackDamage = 10;
        this.scoreValue = 230;
        break;
      case 'cliente_cambio':
        this.archetype = 'zoner';
        this.maxHealth = 38;
        this.walkSpeed = 56;
        this.attackDamage = 11;
        this.scoreValue = 260;
        break;
      case 'protag_clon':
        this.archetype = 'erratic';
        this.maxHealth = 50;
        this.walkSpeed = 80;
        this.attackDamage = 14;
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
      this.vx *= 0.88;
      this.vz *= 0.88;
      return;
    }

    // 1. Handle organic entrance from sides of screen
    if (this.aiState === 'entering') {
      const dx = this.entranceTargetX - this.x;
      const dz = this.entranceTargetZ - this.z;
      const dist = Math.hypot(dx, dz);
      this.facing = dx >= 0 ? 'right' : 'left';

      if (dist > 10) {
        const speed = this.walkSpeed * 1.3;
        this.vx = (dx / dist) * speed;
        this.vz = (dz / dist) * (speed * 0.7);
      } else {
        this.x = this.entranceTargetX;
        this.z = this.entranceTargetZ;
        this.vx = 0;
        this.vz = 0;
        this.aiState = 'idle';
        this.attackTimer = 0.8 + Math.random() * 0.6; // Small delay before first attack
      }
      return;
    }

    // 2. Handle telegraph / windup
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

    this.facing = dx > 0 ? 'right' : 'left';

    this.wanderTimer += dt;
    const wanderWobble = Math.sin(this.wanderTimer * 2.5 + this.wanderPhase) * 12;

    // Periodically re-evaluate flank slot
    this.thinkTimer += dt;
    if (this.thinkTimer > 2.0) {
      this.thinkTimer = 0;
      this.flankOffsetZ = (Math.random() - 0.5) * 20;
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

    // 3. Movement based on Archetypes
    let targetX = player.x + this.flankOffsetX;
    let targetZ = player.z + this.flankOffsetZ + wanderWobble;

    if (this.archetype === 'rusher') {
      // Rushers charge straight in with rapid Z shifts
      const side = dx > 0 ? -this.attackRangeX * 0.85 : this.attackRangeX * 0.85;
      targetX = player.x + side;
      targetZ = player.z + Math.sin(this.wanderTimer * 4.5) * 16;
    } else if (this.archetype === 'flanker') {
      // Flankers dance around and try to get to the sides / diagonals
      const side = player.facing === 'right' ? -40 : 40;
      targetX = player.x + side + Math.cos(this.wanderTimer * 2) * 15;
      targetZ = player.z + Math.sin(this.wanderTimer * 3) * 24;
    } else if (this.archetype === 'tank') {
      // Tanks walk steadily straight ahead, undeterred
      const side = dx > 0 ? -this.attackRangeX : this.attackRangeX;
      targetX = player.x + side;
      targetZ = player.z + Math.sin(this.wanderTimer * 1.2) * 6;
    } else if (this.archetype === 'zoner') {
      // Zoners keep mid-distance on X, align with player on Z
      const side = dx > 0 ? -70 : 70;
      targetX = player.x + side;
      targetZ = player.z + Math.sin(this.wanderTimer * 1.5) * 8;
    } else if (this.archetype === 'erratic') {
      // Erratics alternate between quick dashes and hesitant pauses
      const hopCycle = Math.floor(this.wanderTimer * 1.8) % 3;
      if (hopCycle === 0) {
        targetX = player.x + (dx > 0 ? -26 : 26);
      } else {
        targetX = player.x + (dx > 0 ? -65 : 65);
      }
      targetZ = player.z + (Math.sin(this.wanderTimer * 3.5) > 0 ? 16 : -16);
    }

    const toTargetX = targetX - this.x;
    const toTargetZ = targetZ - this.z;
    const targetDist = Math.hypot(toTargetX, toTargetZ);

    if (targetDist > 10) {
      const speed = this.walkSpeed;
      this.vx = (toTargetX / targetDist) * speed;
      this.vz = (toTargetZ / targetDist) * (speed * 0.72);
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
    if (Math.abs(dx) <= this.attackRangeX + 8 && dz <= this.attackRangeZ + 6 && player.invulnerableTimer <= 0) {
      const knockDir = dx >= 0 ? 80 : -80;
      player.takeDamage(this.attackDamage, knockDir, 0, 35);
      particles.emitHitSparks(player.x, player.y + 20, player.z, 6);
    }

    // Zoners retreat slightly after attacking to reset spacing
    if (this.archetype === 'zoner') {
      this.vx = this.facing === 'right' ? -55 : 55;
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
