import { Player } from '../entities/Player';
import { SpriteSheetGenerator } from '../graphics/SpriteSheetGenerator';
import { BossAlgoritmo, BossLista, BossColapso } from '../entities/Bosses';

export class HUD {
  private portrait: HTMLCanvasElement;
  private goFlashTimer: number = 0;

  constructor() {
    this.portrait = SpriteSheetGenerator.getProtagonistPortrait();
  }

  public render(
    ctx: CanvasRenderingContext2D,
    player: Player,
    levelNumber: number,
    tpProgressPct: number,
    level3TimeRemainingSeconds: number | null,
    activeBoss: BossAlgoritmo | BossLista | BossColapso | null,
    canAdvanceWave: boolean
  ): void {
    // 1. Protagonist Portrait and Status Box
    ctx.save();

    // Top-left HUD panel background
    ctx.fillStyle = 'rgba(26, 26, 29, 0.85)';
    ctx.fillRect(8, 8, 160, 40);
    ctx.strokeStyle = '#4a4e51';
    ctx.lineWidth = 1;
    ctx.strokeRect(8, 8, 160, 40);

    // Draw Portrait
    ctx.drawImage(this.portrait, 12, 12);

    // Player Name / Tag
    ctx.font = 'bold 8px monospace';
    ctx.fillStyle = '#f5f6fa';
    ctx.fillText('PROTAGONISTA (41)', 48, 18);

    // Health Bar
    const barX = 48;
    const barY = 22;
    const barW = 75;
    const barH = 7;
    const healthPct = Math.max(0, player.health / player.maxHealth);

    ctx.fillStyle = '#2f3542';
    ctx.fillRect(barX, barY, barW, barH);

    // Gradient or health color
    let hpColor = '#2ed573';
    if (healthPct <= 0.25) hpColor = '#ff4757';
    else if (healthPct <= 0.5) hpColor = '#ffa502';

    ctx.fillStyle = hpColor;
    ctx.fillRect(barX, barY, Math.round(barW * healthPct), barH);

    ctx.strokeStyle = '#ffffff';
    ctx.strokeRect(barX, barY, barW, barH);

    // Lives icons (3 heads)
    for (let i = 0; i < 3; i++) {
      const lx = 48 + i * 14;
      const ly = 33;
      if (i < player.lives) {
        ctx.fillStyle = '#ff4757';
        ctx.fillRect(lx, ly, 10, 8);
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(lx + 2, ly + 2, 2, 2);
        ctx.fillRect(lx + 6, ly + 2, 2, 2);
      } else {
        ctx.fillStyle = '#57606f';
        ctx.fillRect(lx, ly, 10, 8);
      }
    }

    // Score
    ctx.font = 'bold 8px monospace';
    ctx.fillStyle = '#f1c40f';
    ctx.fillText(`PTS: ${player.score.toString().padStart(6, '0')}`, 128, 28);

    // 2. Combo Counter (if active)
    if (player.comboHits > 1) {
      ctx.fillStyle = '#ff4757';
      ctx.font = 'bold 11px monospace';
      ctx.fillText(`¡${player.comboHits} GOLPES!`, 48, 60);

      ctx.fillStyle = '#ffa502';
      ctx.font = 'bold 8px monospace';
      ctx.fillText(`x${player.comboMultiplier.toFixed(1)} MULTI`, 48, 70);
    }

    // 3. Top-Right: Level Title & TP Progress
    ctx.fillStyle = 'rgba(26, 26, 29, 0.85)';
    ctx.fillRect(320, 8, 152, 30);
    ctx.strokeStyle = '#4a4e51';
    ctx.strokeRect(320, 8, 152, 30);

    ctx.font = 'bold 7px monospace';
    ctx.fillStyle = '#00d2d3';
    ctx.fillText(`NIVEL ${levelNumber}`, 326, 18);

    // TP Progress Bar
    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 7px monospace';
    ctx.fillText(`TP: ${tpProgressPct}%`, 380, 18);

    ctx.fillStyle = '#2f3542';
    ctx.fillRect(326, 23, 140, 6);
    ctx.fillStyle = '#10ac84';
    ctx.fillRect(326, 23, Math.round(140 * (tpProgressPct / 100)), 6);
    ctx.strokeStyle = '#ffffff';
    ctx.strokeRect(326, 23, 140, 6);

    // 4. Level 3 Countdown Clock towards 23:59!
    if (level3TimeRemainingSeconds !== null) {
      const minutesLeft = Math.floor(level3TimeRemainingSeconds / 60);
      const secondsLeft = Math.floor(level3TimeRemainingSeconds % 60);

      // Simulates real time advancing to 23:59
      // E.g. starting at 23:45 and ticking to 23:59
      const clockHour = 23;
      const clockMin = 59 - Math.max(0, minutesLeft);
      const clockSec = 59 - Math.max(0, secondsLeft);

      const timeStr = `${clockHour}:${clockMin.toString().padStart(2, '0')}:${clockSec.toString().padStart(2, '0')}`;

      ctx.fillStyle = 'rgba(235, 47, 6, 0.9)';
      ctx.fillRect(180, 8, 120, 20);
      ctx.strokeStyle = '#ffffff';
      ctx.strokeRect(180, 8, 120, 20);

      ctx.font = 'bold 9px monospace';
      ctx.fillStyle = '#ffffff';
      ctx.fillText(`ENTREGA: ${timeStr}`, 186, 22);
    }

    // 5. Boss Bar (if active)
    if (activeBoss && !activeBoss.isDead) {
      const bossHpPct = Math.max(0, activeBoss.health / activeBoss.maxHealth);

      ctx.fillStyle = 'rgba(26, 26, 29, 0.9)';
      ctx.fillRect(100, 235, 280, 26);
      ctx.strokeStyle = '#ff3838';
      ctx.strokeRect(100, 235, 280, 26);

      ctx.font = 'bold 8px monospace';
      ctx.fillStyle = '#ff4757';
      ctx.fillText(activeBoss.bossName, 106, 245);

      // Subtitle if Boss has phases or cores
      if (activeBoss instanceof BossLista) {
        ctx.fillStyle = '#fbc531';
        ctx.font = 'bold 7px monospace';
        ctx.fillText(activeBoss.coreNames[activeBoss.currentCore], 240, 245);
      } else if (activeBoss instanceof BossColapso) {
        ctx.fillStyle = '#e056fd';
        ctx.font = 'bold 7px monospace';
        ctx.fillText(activeBoss.phaseTitles[activeBoss.phase], 230, 245);
      }

      // Bar
      ctx.fillStyle = '#2f3542';
      ctx.fillRect(106, 250, 268, 6);
      ctx.fillStyle = '#ff3838';
      ctx.fillRect(106, 250, Math.round(268 * bossHpPct), 6);
      ctx.strokeStyle = '#ffffff';
      ctx.strokeRect(106, 250, 268, 6);
    }

    // 6. "GO ->" Wave Clear Indicator
    if (canAdvanceWave) {
      this.goFlashTimer += 0.05;
      if (Math.floor(this.goFlashTimer * 4) % 2 === 0) {
        ctx.fillStyle = 'rgba(46, 213, 115, 0.9)';
        ctx.fillRect(420, 115, 52, 22);
        ctx.strokeStyle = '#ffffff';
        ctx.strokeRect(420, 115, 52, 22);

        ctx.font = 'bold 11px monospace';
        ctx.fillStyle = '#ffffff';
        ctx.fillText('¡GO! →', 424, 130);
      }
    }

    ctx.restore();
  }
}
