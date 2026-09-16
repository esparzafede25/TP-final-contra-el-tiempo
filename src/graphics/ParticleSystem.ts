export interface Particle {
  x: number;
  y: number;
  z: number;
  vx: number;
  vy: number;
  life: number;
  maxLife: number;
  color: string;
  size: number;
  type: 'dust' | 'spark' | 'text' | 'rain' | 'bubble' | 'glitch';
  text?: string;
}

export class ParticleSystem {
  private particles: Particle[] = [];

  public update(dt: number): void {
    for (let i = this.particles.length - 1; i >= 0; i--) {
      const p = this.particles[i];
      p.life -= dt;
      if (p.life <= 0) {
        this.particles.splice(i, 1);
        continue;
      }

      p.x += p.vx * dt;
      p.y += p.vy * dt;

      // Gravity for some particles
      if (p.type === 'spark') {
        p.vy += 300 * dt;
      } else if (p.type === 'dust') {
        p.vx *= 0.95;
        p.vy *= 0.95;
      }
    }
  }

  public emitDust(x: number, y: number, z: number, count: number = 4): void {
    for (let i = 0; i < count; i++) {
      this.particles.push({
        x: x + (Math.random() * 8 - 4),
        y: y,
        z: z,
        vx: (Math.random() * 30 - 15),
        vy: -(Math.random() * 20 + 5),
        life: 0.25 + Math.random() * 0.15,
        maxLife: 0.4,
        color: Math.random() > 0.5 ? '#b8a690' : '#8c7b6c',
        size: 2 + Math.random() * 2,
        type: 'dust'
      });
    }
  }

  public emitHitSparks(x: number, y: number, z: number, count: number = 8, isHeavy: boolean = false): void {
    const colors = isHeavy ? ['#ff0055', '#ffcc00', '#ffffff', '#ff6600'] : ['#ffdd33', '#ffffff', '#ff9900'];
    for (let i = 0; i < count; i++) {
      const angle = Math.random() * Math.PI * 2;
      const speed = 60 + Math.random() * (isHeavy ? 180 : 120);
      this.particles.push({
        x: x,
        y: y,
        z: z,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed - 40,
        life: 0.15 + Math.random() * 0.15,
        maxLife: 0.3,
        color: colors[Math.floor(Math.random() * colors.length)],
        size: isHeavy ? 3 : 2,
        type: 'spark'
      });
    }

    // Comic onomatopoeia popup
    const words = isHeavy ? ['¡¡CRACK!!', '¡¡BOOM!!', '¡¡ZAS!!', '¡¡TOMA!!'] : ['¡PAF!', '¡PUM!', '¡BAM!'];
    const chosenWord = words[Math.floor(Math.random() * words.length)];
    this.particles.push({
      x: x,
      y: y - 10,
      z: z,
      vx: (Math.random() * 20 - 10),
      vy: -50,
      life: 0.45,
      maxLife: 0.45,
      color: isHeavy ? '#ffeb3b' : '#ffffff',
      size: 10,
      type: 'text',
      text: chosenWord
    });
  }

  public emitScorePopup(x: number, y: number, z: number, text: string, color: string = '#4cd137'): void {
    this.particles.push({
      x: x,
      y: y - 15,
      z: z,
      vx: 0,
      vy: -40,
      life: 0.6,
      maxLife: 0.6,
      color: color,
      size: 9,
      type: 'text',
      text: text
    });
  }

  public emitGlitch(x: number, y: number, z: number, count: number = 6): void {
    const glitchColors = ['#00ffff', '#ff00ff', '#ffff00', '#ffffff'];
    for (let i = 0; i < count; i++) {
      this.particles.push({
        x: x + (Math.random() * 20 - 10),
        y: y + (Math.random() * 30 - 15),
        z: z,
        vx: (Math.random() * 60 - 30),
        vy: (Math.random() * 60 - 30),
        life: 0.2 + Math.random() * 0.1,
        maxLife: 0.3,
        color: glitchColors[Math.floor(Math.random() * glitchColors.length)],
        size: 3 + Math.random() * 3,
        type: 'glitch'
      });
    }
  }

  public render(ctx: CanvasRenderingContext2D, cameraX: number, cameraY: number): void {
    for (const p of this.particles) {
      const screenX = Math.round(p.x - cameraX);
      const screenY = Math.round(p.z - p.y - cameraY);
      const progress = p.life / p.maxLife;

      ctx.save();
      ctx.globalAlpha = Math.max(0, Math.min(1, progress * 1.2));

      if (p.type === 'text' && p.text) {
        ctx.font = 'bold 9px monospace';
        ctx.fillStyle = '#000000';
        ctx.fillText(p.text, screenX + 1, screenY + 1);
        ctx.fillStyle = p.color;
        ctx.fillText(p.text, screenX, screenY);
      } else {
        ctx.fillStyle = p.color;
        ctx.fillRect(screenX, screenY, Math.round(p.size), Math.round(p.size));
      }

      ctx.restore();
    }
  }

  public clear(): void {
    this.particles = [];
  }
}
