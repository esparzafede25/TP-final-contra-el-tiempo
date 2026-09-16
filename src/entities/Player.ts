import { Entity } from './Entity';
import { SpriteSheetGenerator, SpriteFrame } from '../graphics/SpriteSheetGenerator';
import { InputManager } from '../core/InputManager';
import { AudioManager } from '../core/AudioManager';
import { ParticleSystem } from '../graphics/ParticleSystem';

export type PlayerState =
  | 'idle'
  | 'walk'
  | 'walk_up'
  | 'walk_down'
  | 'run'
  | 'jump'
  | 'punch1'
  | 'punch2'
  | 'kick'
  | 'jump_kick'
  | 'combo3'
  | 'hurt'
  | 'knockdown'
  | 'getup'
  | 'victory'
  | 'defeat'
  | 'typing';

export class Player extends Entity {
  public state: PlayerState = 'idle';
  private animTimer: number = 0;
  private currentFrameIndex: number = 0;

  public lives: number = 3;
  public score: number = 0;

  // Combo system
  public comboHits: number = 0;
  public comboTimer: number = 0;
  public comboMultiplier: number = 1.0;

  // Attack chain buffering
  private comboStep: number = 0; // 0: none, 1: punch1, 2: punch2, 3: combo3
  private attackWindowTimer: number = 0;
  private attackBuffer: boolean = false;
  private hasHitTargetThisAttack: boolean = false;

  // Powerups & buffs
  public mateSpeedTimer: number = 0;
  public auricularesTimer: number = 0;

  // Play area depth limits
  public minZ: number = 120;
  public maxZ: number = 240;

  // Attack hitboxes definition per attack state
  public attackHitbox: {
    rangeX: number;
    toleranceZ: number;
    damage: number;
    knockbackX: number;
    knockbackY: number;
    isFinisher: boolean;
  } | null = null;

  constructor(x: number, z: number) {
    super(x, z);
    this.width = 36;
    this.height = 56;
    this.maxHealth = 100;
    this.health = 100;
  }

  public update(dt: number): void {
    super.update(dt);

    if (this.hitstopTimer > 0) return;

    // Update buff timers
    if (this.mateSpeedTimer > 0) {
      this.mateSpeedTimer -= dt;
    }
    if (this.auricularesTimer > 0) {
      this.auricularesTimer -= dt;
    }

    // Update combo streak timer
    if (this.comboHits > 0) {
      this.comboTimer -= dt;
      if (this.comboTimer <= 0) {
        this.resetComboStreak();
      }
    }

    // Update attack buffer window
    if (this.attackWindowTimer > 0) {
      this.attackWindowTimer -= dt;
      if (this.attackWindowTimer <= 0 && !this.isAttacking()) {
        this.comboStep = 0;
      }
    }

    // State machine updates
    this.handleInput(dt);
    this.updateAnimation(dt);

    // Clamp depth to floor boundaries
    if (this.z < this.minZ) this.z = this.minZ;
    if (this.z > this.maxZ) this.z = this.maxZ;
  }

  private handleInput(dt: number): void {
    const input = InputManager.getInstance();
    const audio = AudioManager.getInstance();

    // Disable input during un-interruptible states
    if (
      this.state === 'hurt' ||
      this.state === 'knockdown' ||
      this.state === 'getup' ||
      this.state === 'victory' ||
      this.state === 'defeat' ||
      this.state === 'typing'
    ) {
      return;
    }

    // Buffer attack input if currently attacking
    if (input.isJustPressed('attack')) {
      if (this.isAttacking()) {
        this.attackBuffer = true;
      } else {
        this.startAttack();
        return;
      }
    }

    // Handle jumping
    if (this.isGrounded && input.isJustPressed('jump') && !this.isAttacking()) {
      this.vy = 280;
      this.isGrounded = false;
      this.state = 'jump';
      audio.playJump();
      return;
    }

    // Jump attacks
    if (!this.isGrounded) {
      if (input.isJustPressed('attack') && this.state !== 'jump_kick') {
        this.state = 'jump_kick';
        this.currentFrameIndex = 0;
        this.hasHitTargetThisAttack = false;
        this.attackHitbox = {
          rangeX: 34,
          toleranceZ: 20,
          damage: 18,
          knockbackX: (this.facing === 'right' ? 140 : -140),
          knockbackY: 100,
          isFinisher: true,
        };
        audio.playAirKick();
      }
      return; // Do not process ground walk while in midair
    }

    // Do not process movement while executing ground attack animations
    if (this.isAttacking()) {
      this.vx *= 0.8;
      this.vz = 0;
      return;
    }

    // Movement speeds
    const speedMultiplier = this.mateSpeedTimer > 0 ? 1.45 : 1.0;
    const walkSpeed = 95 * speedMultiplier;
    const runSpeed = 160 * speedMultiplier;
    const depthSpeed = 70 * speedMultiplier;

    const left = input.isDown('left');
    const right = input.isDown('right');
    const up = input.isDown('up');
    const down = input.isDown('down');

    const isRunning = input.isDoubleTapped('left') || input.isDoubleTapped('right') || (this.state === 'run' && (left || right));

    let moveX = 0;
    let moveZ = 0;

    if (left && !right) {
      moveX = -1;
      this.facing = 'left';
    } else if (right && !left) {
      moveX = 1;
      this.facing = 'right';
    }

    if (up && !down) {
      moveZ = -1;
    } else if (down && !up) {
      moveZ = 1;
    }

    // Apply movement
    const currentSpeed = isRunning ? runSpeed : walkSpeed;
    this.vx = moveX * currentSpeed;
    this.vz = moveZ * depthSpeed;

    // Determine state
    if (moveX !== 0 || moveZ !== 0) {
      if (isRunning) {
        this.state = 'run';
      } else if (moveX !== 0) {
        this.state = 'walk';
      } else if (moveZ < 0) {
        this.state = 'walk_up';
      } else {
        this.state = 'walk_down';
      }
    } else {
      this.state = 'idle';
    }
  }

  private startAttack(): void {
    const audio = AudioManager.getInstance();
    this.hasHitTargetThisAttack = false;
    this.currentFrameIndex = 0;
    this.animTimer = 0;

    if (this.comboStep === 0 || this.attackWindowTimer <= 0) {
      // Step 1: Jab
      this.state = 'punch1';
      this.comboStep = 1;
      this.attackHitbox = {
        rangeX: 28,
        toleranceZ: 16,
        damage: 10,
        knockbackX: (this.facing === 'right' ? 30 : -30),
        knockbackY: 0,
        isFinisher: false,
      };
      audio.playPunchLight();
    } else if (this.comboStep === 1) {
      // Step 2: Heavy Cross
      this.state = 'punch2';
      this.comboStep = 2;
      this.attackHitbox = {
        rangeX: 32,
        toleranceZ: 18,
        damage: 15,
        knockbackX: (this.facing === 'right' ? 60 : -60),
        knockbackY: 20,
        isFinisher: false,
      };
      audio.playPunchHeavy();
    } else if (this.comboStep === 2) {
      // Step 3: Spinning Roundhouse Finisher
      this.state = 'combo3';
      this.comboStep = 0;
      this.attackHitbox = {
        rangeX: 38,
        toleranceZ: 22,
        damage: 25,
        knockbackX: (this.facing === 'right' ? 160 : -160),
        knockbackY: 120,
        isFinisher: true,
      };
      audio.playKick();
    }

    this.attackWindowTimer = 0.55;
  }

  public isAttacking(): boolean {
    return (
      this.state === 'punch1' ||
      this.state === 'punch2' ||
      this.state === 'kick' ||
      this.state === 'jump_kick' ||
      this.state === 'combo3'
    );
  }

  private updateAnimation(dt: number): void {
    this.animTimer += dt;
    const frames = SpriteSheetGenerator.getPlayerFrames(this.state);
    const frameCount = frames.length;

    let frameDuration = 0.12;

    if (this.state === 'idle') frameDuration = 0.18;
    if (this.state === 'run') frameDuration = 0.08;
    if (this.state === 'punch1') frameDuration = 0.07;
    if (this.state === 'punch2') frameDuration = 0.08;
    if (this.state === 'combo3') frameDuration = 0.09;
    if (this.state === 'jump_kick') frameDuration = 0.2;

    if (this.animTimer >= frameDuration) {
      this.animTimer = 0;
      this.currentFrameIndex++;

      // Non-looping animations
      if (this.isAttacking()) {
        if (this.currentFrameIndex >= frameCount) {
          this.attackHitbox = null;
          this.state = 'idle';
          this.currentFrameIndex = 0;

          // Process buffered attack if pressed during recovery
          if (this.attackBuffer) {
            this.attackBuffer = false;
            this.startAttack();
          }
        }
      } else if (this.state === 'hurt') {
        if (this.currentFrameIndex >= frameCount) {
          this.state = 'idle';
          this.currentFrameIndex = 0;
        }
      } else if (this.state === 'knockdown') {
        if (this.currentFrameIndex >= frameCount) {
          this.currentFrameIndex = frameCount - 1;
          setTimeout(() => {
            if (this.state === 'knockdown' && !this.isDead) {
              this.state = 'getup';
              this.currentFrameIndex = 0;
            }
          }, 400);
        }
      } else if (this.state === 'getup') {
        if (this.currentFrameIndex >= frameCount) {
          this.state = 'idle';
          this.currentFrameIndex = 0;
        }
      } else {
        // Looping animation
        this.currentFrameIndex %= frameCount;
      }
    }
  }

  protected onLand(): void {
    if (this.state === 'jump' || this.state === 'jump_kick') {
      this.state = 'idle';
      this.attackHitbox = null;
      AudioManager.getInstance().playLand();
    }
  }

  public registerHit(isHeavy: boolean = false): void {
    this.hasHitTargetThisAttack = true;
    this.comboHits++;
    this.comboTimer = 2.5; // combo streak window
    this.comboMultiplier = Math.min(4.0, 1.0 + (this.comboHits - 1) * 0.2);

    const hitScore = Math.round((isHeavy ? 150 : 80) * this.comboMultiplier);
    this.score += hitScore;
  }

  private resetComboStreak(): void {
    this.comboHits = 0;
    this.comboTimer = 0;
    this.comboMultiplier = 1.0;
  }

  public override takeDamage(amount: number, knockbackX: number = 0, knockbackZ: number = 0, knockbackY: number = 0): void {
    if (this.invulnerableTimer > 0 || this.isDead) return;

    // Reset combo streak on taking hit
    this.resetComboStreak();
    this.attackHitbox = null;

    AudioManager.getInstance().playHurt();

    // Heavy hit knocks down
    if (amount >= 25 || knockbackY > 60) {
      this.state = 'knockdown';
      this.currentFrameIndex = 0;
      this.invulnerableTimer = 1.6;
      AudioManager.getInstance().playKnockdown();
    } else {
      this.state = 'hurt';
      this.currentFrameIndex = 0;
      this.invulnerableTimer = 1.0;
    }

    super.takeDamage(amount, knockbackX, knockbackZ, knockbackY);
  }

  protected override onDeath(): void {
    this.lives--;
    this.state = 'defeat';
    this.currentFrameIndex = 0;
    AudioManager.getInstance().playKnockdown();
  }

  public heal(amount: number): void {
    this.health = Math.min(this.maxHealth, this.health + amount);
    AudioManager.getInstance().playPickup();
  }

  public applyMateBoost(): void {
    this.mateSpeedTimer = 10.0;
    AudioManager.getInstance().playPickup();
  }

  public applyAuriculares(): void {
    this.auricularesTimer = 15.0;
    AudioManager.getInstance().playPickup();
  }

  public respawn(x: number, z: number): void {
    this.x = x;
    this.z = z;
    this.y = 0;
    this.vx = 0;
    this.vz = 0;
    this.vy = 0;
    this.health = this.maxHealth;
    this.isDead = false;
    this.state = 'idle';
    this.currentFrameIndex = 0;
    this.invulnerableTimer = 2.0;
    this.resetComboStreak();
  }

  public render(ctx: CanvasRenderingContext2D, cameraX: number, cameraY: number): void {
    const frames = SpriteSheetGenerator.getPlayerFrames(this.state);
    const frame = frames[this.currentFrameIndex % frames.length];

    // Mate speed boost after-image blue trail
    if (this.mateSpeedTimer > 0 && (this.state === 'run' || this.state === 'walk')) {
      ctx.save();
      ctx.globalAlpha = 0.35;
      const trailOffsetX = this.facing === 'right' ? -10 : 10;
      const sX = Math.round(this.x + trailOffsetX - cameraX);
      const sY = Math.round(this.z - this.y - cameraY);
      ctx.translate(sX, sY);
      if (this.facing === 'left') ctx.scale(-1, 1);
      ctx.drawImage(frame.canvas, -frame.originX, -frame.originY);
      ctx.restore();
    }

    this.drawSpriteFrame(ctx, frame, cameraX, cameraY);
  }
}
