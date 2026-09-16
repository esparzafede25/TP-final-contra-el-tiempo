export class Camera {
  public x: number = 0;
  public y: number = 0;
  public width: number = 480;
  public height: number = 270;

  public minX: number = 0;
  public maxX: number = 3000;
  public lockMinX: number = 0;
  public lockMaxX: number = 3000;

  // Screen shake
  private shakeIntensity: number = 0;
  private shakeDuration: number = 0;
  private shakeTimer: number = 0;
  public shakeOffsetX: number = 0;
  public shakeOffsetY: number = 0;

  constructor(width: number = 480, height: number = 270) {
    this.width = width;
    this.height = height;
  }

  public setBounds(minX: number, maxX: number): void {
    this.minX = minX;
    this.maxX = maxX;
    this.lockMinX = minX;
    this.lockMaxX = maxX;
  }

  public setLockBounds(minX: number, maxX: number): void {
    this.lockMinX = Math.max(this.minX, minX);
    this.lockMaxX = Math.min(this.maxX, maxX);
  }

  public unlockBounds(): void {
    this.lockMinX = this.minX;
    this.lockMaxX = this.maxX;
  }

  public follow(targetX: number, dt: number): void {
    // Center camera on target horizontally
    const desiredX = targetX - this.width / 2;

    // Smooth lerp
    const lerpSpeed = 8.0;
    this.x += (desiredX - this.x) * Math.min(1.0, lerpSpeed * dt);

    // Clamp within locked wave boundaries
    const maxScroll = Math.max(this.lockMinX, this.lockMaxX - this.width);
    if (this.x < this.lockMinX) this.x = this.lockMinX;
    if (this.x > maxScroll) this.x = maxScroll;

    // Update screen shake
    if (this.shakeTimer > 0) {
      this.shakeTimer -= dt;
      const progress = this.shakeTimer / this.shakeDuration;
      const currentIntensity = this.shakeIntensity * progress;
      this.shakeOffsetX = (Math.random() * 2 - 1) * currentIntensity;
      this.shakeOffsetY = (Math.random() * 2 - 1) * currentIntensity;
    } else {
      this.shakeOffsetX = 0;
      this.shakeOffsetY = 0;
    }
  }

  public shake(intensity: number = 4, duration: number = 0.25): void {
    this.shakeIntensity = intensity;
    this.shakeDuration = duration;
    this.shakeTimer = duration;
  }

  public getDrawX(): number {
    return Math.round(this.x + this.shakeOffsetX);
  }

  public getDrawY(): number {
    return Math.round(this.y + this.shakeOffsetY);
  }
}
