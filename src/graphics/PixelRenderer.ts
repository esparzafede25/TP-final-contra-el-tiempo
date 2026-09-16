import { Camera } from '../core/Camera';

export interface Renderable {
  x: number;
  z: number;
  y: number; // height above ground (altitude)
  render(ctx: CanvasRenderingContext2D, cameraX: number, cameraY: number): void;
  renderShadow?(ctx: CanvasRenderingContext2D, cameraX: number, cameraY: number): void;
}

export class PixelRenderer {
  public readonly virtualWidth = 480;
  public readonly virtualHeight = 270;

  private canvas: HTMLCanvasElement;
  private ctx: CanvasRenderingContext2D;

  private bufferCanvas: HTMLCanvasElement;
  private bufferCtx: CanvasRenderingContext2D;

  private flashAlpha: number = 0;
  private flashColor: string = '#ffffff';

  public crtFilterEnabled: boolean = true;

  constructor(canvas: HTMLCanvasElement) {
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d', { alpha: false })!;
    this.ctx.imageSmoothingEnabled = false;

    this.bufferCanvas = document.createElement('canvas');
    this.bufferCanvas.width = this.virtualWidth;
    this.bufferCanvas.height = this.virtualHeight;
    this.bufferCtx = this.bufferCanvas.getContext('2d')!;
    this.bufferCtx.imageSmoothingEnabled = false;

    this.resize();
    window.addEventListener('resize', () => this.resize());
  }

  public resize(): void {
    const windowWidth = window.innerWidth;
    const windowHeight = window.innerHeight;

    // Calculate maximum 16:9 scale
    const scaleX = windowWidth / this.virtualWidth;
    const scaleY = windowHeight / this.virtualHeight;
    const scale = Math.min(scaleX, scaleY);

    const targetWidth = Math.floor(this.virtualWidth * scale);
    const targetHeight = Math.floor(this.virtualHeight * scale);

    this.canvas.width = targetWidth;
    this.canvas.height = targetHeight;
    this.canvas.style.width = `${targetWidth}px`;
    this.canvas.style.height = `${targetHeight}px`;

    this.ctx.imageSmoothingEnabled = false;
  }

  public getBufferCtx(): CanvasRenderingContext2D {
    return this.bufferCtx;
  }

  public clear(color: string = '#000000'): void {
    this.bufferCtx.fillStyle = color;
    this.bufferCtx.fillRect(0, 0, this.virtualWidth, this.virtualHeight);
  }

  public flash(color: string = '#ffffff', duration: number = 0.2): void {
    this.flashColor = color;
    this.flashAlpha = 0.8;
  }

  public update(dt: number): void {
    if (this.flashAlpha > 0) {
      this.flashAlpha -= dt * 4.0;
      if (this.flashAlpha < 0) this.flashAlpha = 0;
    }
  }

  public renderEntities(entities: Renderable[], camera: Camera): void {
    const camX = camera.getDrawX();
    const camY = camera.getDrawY();

    // 1. Draw shadows first on the ground plane
    for (const entity of entities) {
      if (entity.renderShadow) {
        entity.renderShadow(this.bufferCtx, camX, camY);
      }
    }

    // 2. Sort entities by depth (z-coordinate) back-to-front
    const sorted = [...entities].sort((a, b) => a.z - b.z);

    // 3. Draw sorted entities
    for (const entity of sorted) {
      entity.render(this.bufferCtx, camX, camY);
    }
  }

  public drawShadow(ctx: CanvasRenderingContext2D, screenX: number, screenZ: number, radiusX: number = 10, radiusY: number = 4): void {
    ctx.save();
    ctx.fillStyle = 'rgba(0, 0, 0, 0.4)';
    ctx.beginPath();
    ctx.ellipse(screenX, screenZ, radiusX, radiusY, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  }

  public present(): void {
    // Flash effect if active
    if (this.flashAlpha > 0) {
      this.bufferCtx.save();
      this.bufferCtx.globalAlpha = this.flashAlpha;
      this.bufferCtx.fillStyle = this.flashColor;
      this.bufferCtx.fillRect(0, 0, this.virtualWidth, this.virtualHeight);
      this.bufferCtx.restore();
    }

    // Scanlines filter on buffer
    if (this.crtFilterEnabled) {
      this.bufferCtx.save();
      this.bufferCtx.fillStyle = 'rgba(0, 0, 0, 0.12)';
      for (let y = 0; y < this.virtualHeight; y += 2) {
        this.bufferCtx.fillRect(0, y, this.virtualWidth, 1);
      }
      this.bufferCtx.restore();
    }

    // Blit virtual buffer to target canvas with sharp nearest-neighbor interpolation
    this.ctx.drawImage(
      this.bufferCanvas,
      0, 0, this.virtualWidth, this.virtualHeight,
      0, 0, this.canvas.width, this.canvas.height
    );
  }
}
