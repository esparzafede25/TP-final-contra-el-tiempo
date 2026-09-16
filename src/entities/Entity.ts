import { Renderable } from '../graphics/PixelRenderer';
import { SpriteFrame } from '../graphics/SpriteSheetGenerator';

export abstract class Entity implements Renderable {
  public x: number = 0;
  public z: number = 0; // Depth axis on ground plane
  public y: number = 0; // Altitude above ground

  public vx: number = 0;
  public vz: number = 0;
  public vy: number = 0;

  public width: number = 32;
  public height: number = 48;
  public facing: 'left' | 'right' = 'right';

  public health: number = 100;
  public maxHealth: number = 100;
  public isDead: boolean = false;

  public isGrounded: boolean = true;
  public gravity: number = 700;

  // Invulnerability
  public invulnerableTimer: number = 0;
  public isFlashing: boolean = false;

  // Hitstop (micro freeze on impact)
  public hitstopTimer: number = 0;

  constructor(x: number, z: number) {
    this.x = x;
    this.z = z;
    this.y = 0;
  }

  public update(dt: number): void {
    if (this.hitstopTimer > 0) {
      this.hitstopTimer -= dt;
      return;
    }

    if (this.invulnerableTimer > 0) {
      this.invulnerableTimer -= dt;
      this.isFlashing = Math.floor(this.invulnerableTimer * 20) % 2 === 0;
    } else {
      this.isFlashing = false;
    }

    // Apply horizontal and depth movement
    this.x += this.vx * dt;
    this.z += this.vz * dt;

    // Apply altitude / jump physics
    if (!this.isGrounded || this.y > 0 || this.vy !== 0) {
      this.y += this.vy * dt;
      this.vy -= this.gravity * dt;

      if (this.y <= 0) {
        this.y = 0;
        this.vy = 0;
        this.isGrounded = true;
        this.onLand();
      } else {
        this.isGrounded = false;
      }
    }
  }

  protected onLand(): void {
    // Override in subclasses
  }

  public takeDamage(amount: number, knockbackX: number = 0, knockbackZ: number = 0, knockbackY: number = 0): void {
    if (this.invulnerableTimer > 0 || this.isDead) return;

    this.health -= amount;
    this.invulnerableTimer = 0.5;
    this.hitstopTimer = 0.05;

    this.vx = knockbackX;
    this.vz = knockbackZ;
    if (knockbackY > 0) {
      this.vy = knockbackY;
      this.isGrounded = false;
    }

    if (this.health <= 0) {
      this.health = 0;
      this.isDead = true;
      this.onDeath();
    }
  }

  protected onDeath(): void {
    // Override in subclasses
  }

  // 2.5D Beat 'Em Up hit detection: Checks horizontal X distance, depth Z distance, and vertical Y altitude
  public canHit(
    target: Entity,
    rangeX: number,
    toleranceZ: number = 16,
    toleranceY: number = 32
  ): boolean {
    const dx = target.x - this.x;
    const dz = Math.abs(target.z - this.z);
    const dy = Math.abs(target.y - this.y);

    // Must be facing towards the target
    const isFacingTarget = this.facing === 'right' ? dx >= -8 : dx <= 8;

    return (
      isFacingTarget &&
      Math.abs(dx) <= rangeX &&
      dz <= toleranceZ &&
      dy <= toleranceY
    );
  }

  public renderShadow(ctx: CanvasRenderingContext2D, cameraX: number, cameraY: number): void {
    const screenX = Math.round(this.x - cameraX);
    const screenZ = Math.round(this.z - cameraY);

    // Shadow gets smaller and lighter if entity is jumping high
    const altitudeScale = Math.max(0.4, 1 - this.y / 150);
    const radX = (this.width / 3) * altitudeScale;
    const radY = (radX * 0.4);

    ctx.save();
    ctx.fillStyle = `rgba(0, 0, 0, ${0.4 * altitudeScale})`;
    ctx.beginPath();
    ctx.ellipse(screenX, screenZ, Math.max(2, radX), Math.max(1, radY), 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  }

  public drawSpriteFrame(
    ctx: CanvasRenderingContext2D,
    frame: SpriteFrame,
    cameraX: number,
    cameraY: number
  ): void {
    if (this.isFlashing) {
      ctx.globalAlpha = 0.5;
    }

    const screenX = Math.round(this.x - cameraX);
    const screenY = Math.round(this.z - this.y - cameraY);

    ctx.save();
    ctx.translate(screenX, screenY);

    if (this.facing === 'left') {
      ctx.scale(-1, 1);
    }

    ctx.drawImage(frame.canvas, -frame.originX, -frame.originY);
    ctx.restore();

    ctx.globalAlpha = 1.0;
  }

  public abstract render(ctx: CanvasRenderingContext2D, cameraX: number, cameraY: number): void;
}
