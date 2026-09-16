import { Entity } from './Entity';
import { SpriteSheetGenerator } from '../graphics/SpriteSheetGenerator';
import { Player } from './Player';
import { AudioManager } from '../core/AudioManager';
import { ParticleSystem } from '../graphics/ParticleSystem';

export type PickupType = 'mate' | 'cafe' | 'pizza' | 'bebida' | 'agenda' | 'auriculares' | 'diskette';
export type BreakableType = 'caja' | 'tacho';

export class BreakableItem extends Entity {
  public type: BreakableType;
  public containsPickup: PickupType | null;

  constructor(x: number, z: number, type: BreakableType = 'caja', contains: PickupType | null = null) {
    super(x, z);
    this.type = type;
    this.containsPickup = contains;
    this.width = 24;
    this.height = 24;
    this.maxHealth = 1;
    this.health = 1;
  }

  public override takeDamage(amount: number, knockbackX?: number, knockbackZ?: number, knockbackY?: number): void {
    if (this.isDead) return;
    super.takeDamage(amount, knockbackX, knockbackZ, knockbackY);
    AudioManager.getInstance().playBreakItem();
  }

  public render(ctx: CanvasRenderingContext2D, cameraX: number, cameraY: number): void {
    if (this.isDead) return;
    const frame = SpriteSheetGenerator.getItemFrame(this.type);
    this.drawSpriteFrame(ctx, frame, cameraX, cameraY);
  }
}

export class PickupItem extends Entity {
  public pickupType: PickupType;
  private floatTimer: number = 0;
  private isCollected: boolean = false;

  constructor(x: number, z: number, pickupType: PickupType) {
    super(x, z);
    this.pickupType = pickupType;
    this.width = 20;
    this.height = 20;
    this.y = 15;
    this.vy = 80; // pop up slightly when spawned
    this.isGrounded = false;
  }

  public override update(dt: number): void {
    super.update(dt);
    this.floatTimer += dt;
  }

  public checkPlayerCollection(player: Player, particles: ParticleSystem): boolean {
    if (this.isCollected) return false;

    const dx = Math.abs(player.x - this.x);
    const dz = Math.abs(player.z - this.z);

    if (dx < 20 && dz < 16) {
      this.isCollected = true;
      this.applyEffect(player, particles);
      return true;
    }
    return false;
  }

  private applyEffect(player: Player, particles: ParticleSystem): void {
    switch (this.pickupType) {
      case 'cafe':
        player.heal(35);
        particles.emitScorePopup(this.x, this.y, this.z, '+35 SALUD', '#e67e22');
        break;
      case 'mate':
        player.heal(20);
        player.applyMateBoost();
        particles.emitScorePopup(this.x, this.y, this.z, '¡MATE VELOCIDAD!', '#2ecc71');
        break;
      case 'pizza':
        player.heal(50);
        particles.emitScorePopup(this.x, this.y, this.z, '+50 SALUD', '#f1c40f');
        break;
      case 'bebida':
        player.heal(25);
        player.applyMateBoost();
        particles.emitScorePopup(this.x, this.y, this.z, '+ENERGÍA', '#3498db');
        break;
      case 'agenda':
        particles.emitScorePopup(this.x, this.y, this.z, '¡TIEMPO CONGELADO!', '#9b59b6');
        break;
      case 'auriculares':
        player.applyAuriculares();
        particles.emitScorePopup(this.x, this.y, this.z, '¡SIN DISTRACCIONES!', '#e74c3c');
        break;
      case 'diskette':
        particles.emitScorePopup(this.x, this.y, this.z, '¡CHECKPOINT GUARDADO!', '#1abc9c');
        break;
    }
  }

  public render(ctx: CanvasRenderingContext2D, cameraX: number, cameraY: number): void {
    if (this.isCollected) return;
    const frame = SpriteSheetGenerator.getItemFrame(this.pickupType);

    // Gentle bobbing when on ground
    const bob = this.isGrounded ? Math.sin(this.floatTimer * 4) * 3 : 0;
    const screenX = Math.round(this.x - cameraX);
    const screenY = Math.round(this.z - this.y - bob - cameraY);

    ctx.save();
    ctx.translate(screenX, screenY);
    ctx.drawImage(frame.canvas, -frame.originX, -frame.originY);
    ctx.restore();
  }
}
