import { Entity } from './Entity';
import { SpriteSheetGenerator } from '../graphics/SpriteSheetGenerator';
import { Player } from './Player';

export class Cat extends Entity {
  public catType: 'gato_naranja' | 'gato_tuxedo';
  private frameTimer: number = 0;
  private currentFrame: number = 0;
  private stateTimer: number = 0;
  private catState: 'walking' | 'sitting' | 'purring' | 'sleeping' = 'walking';
  public isFed: boolean = false;

  constructor(x: number, z: number, type: 'gato_naranja' | 'gato_tuxedo' = 'gato_naranja') {
    super(x, z);
    this.catType = type;
    this.width = 28;
    this.height = 20;
    this.health = 999;
    this.maxHealth = 999;
    this.facing = Math.random() > 0.5 ? 'left' : 'right';
    this.vx = this.facing === 'right' ? 35 : -35;
  }

  // Strict rule from prompt: Cats cannot take damage or be hit!
  public override takeDamage(): void {
    // Purr or jump away gently instead of taking damage
    this.vy = 60;
    this.isGrounded = false;
  }

  public override update(dt: number): void {
    super.update(dt);

    this.frameTimer += dt;
    if (this.frameTimer > 0.15) {
      this.frameTimer = 0;
      this.currentFrame = (this.currentFrame + 1) % 4;
    }

    this.stateTimer += dt;
    if (this.stateTimer > 4.0) {
      this.stateTimer = 0;
      // Change cat mood
      const roll = Math.random();
      if (roll < 0.4) {
        this.catState = 'walking';
        this.facing = this.facing === 'left' ? 'right' : 'left';
        this.vx = this.facing === 'right' ? 30 : -30;
      } else if (roll < 0.8) {
        this.catState = 'sitting';
        this.vx = 0;
        this.vz = 0;
      } else {
        this.catState = 'purring';
        this.vx = 0;
      }
    }
  }

  public interactWithPlayer(player: Player): void {
    const dx = Math.abs(player.x - this.x);
    const dz = Math.abs(player.z - this.z);

    // If player approaches closely
    if (dx < 30 && dz < 16) {
      if (!this.isFed) {
        // Blocks or gently scampers away
        this.facing = player.x > this.x ? 'left' : 'right';
        this.vx = this.facing === 'right' ? 60 : -60;
        this.vy = 40;
        this.isGrounded = false;
        this.catState = 'walking';
      }
    }
  }

  public render(ctx: CanvasRenderingContext2D, cameraX: number, cameraY: number): void {
    const frames = SpriteSheetGenerator.getEnemyFrames(this.catType);
    const frame = frames[this.currentFrame % frames.length];
    this.drawSpriteFrame(ctx, frame, cameraX, cameraY);

    // Floating heart or 'miau' symbol when happy
    if (this.catState === 'purring') {
      const screenX = Math.round(this.x - cameraX);
      const screenY = Math.round(this.z - 22 - cameraY);
      ctx.font = 'bold 8px monospace';
      ctx.fillStyle = '#ff7675';
      ctx.fillText('♥ miau', screenX - 10, screenY);
    }
  }
}
