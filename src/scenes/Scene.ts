import { PixelRenderer } from '../graphics/PixelRenderer';

export interface Scene {
  init(): void;
  update(dt: number): void;
  render(renderer: PixelRenderer): void;
  destroy(): void;
}
