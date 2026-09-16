export interface SpriteFrame {
  canvas: HTMLCanvasElement;
  originX: number;
  originY: number;
  width: number;
  height: number;
}

export class SpriteSheetGenerator {
  private static cache: Map<string, SpriteFrame[]> = new Map();

  // Helper to create an offscreen pixel canvas
  private static createCanvas(w: number, h: number): { canvas: HTMLCanvasElement; ctx: CanvasRenderingContext2D } {
    const canvas = document.createElement('canvas');
    canvas.width = w;
    canvas.height = h;
    const ctx = canvas.getContext('2d')!;
    ctx.imageSmoothingEnabled = false;
    return { canvas, ctx };
  }

  // Draw pixel rectangle helper
  private static px(ctx: CanvasRenderingContext2D, color: string, x: number, y: number, w: number = 1, h: number = 1): void {
    ctx.fillStyle = color;
    ctx.fillRect(Math.round(x), Math.round(y), Math.round(w), Math.round(h));
  }

  // =========================================================================
  // PROTAGONIST: Argentine man, 41yo, 1.80m, lean/fibrous, long greying hair,
  // scruffy beard, black t-shirt, dark pants, sneakers, tired/determined eyes
  // =========================================================================

  public static getPlayerFrames(action: string): SpriteFrame[] {
    const key = `player_${action}`;
    if (this.cache.has(key)) return this.cache.get(key)!;

    const frames: SpriteFrame[] = [];

    switch (action) {
      case 'idle':
        for (let f = 0; f < 4; f++) {
          frames.push(this.drawPlayerIdleFrame(f));
        }
        break;
      case 'walk':
        for (let f = 0; f < 6; f++) {
          frames.push(this.drawPlayerWalkFrame(f));
        }
        break;
      case 'walk_up':
      case 'walk_down':
        for (let f = 0; f < 4; f++) {
          frames.push(this.drawPlayerWalkDepthFrame(f, action === 'walk_up'));
        }
        break;
      case 'run':
        for (let f = 0; f < 6; f++) {
          frames.push(this.drawPlayerRunFrame(f));
        }
        break;
      case 'jump':
        frames.push(this.drawPlayerJumpFrame(0)); // rise
        frames.push(this.drawPlayerJumpFrame(1)); // apex
        frames.push(this.drawPlayerJumpFrame(2)); // fall
        break;
      case 'punch1':
        frames.push(this.drawPlayerPunch1(0));
        frames.push(this.drawPlayerPunch1(1));
        frames.push(this.drawPlayerPunch1(2));
        break;
      case 'punch2':
        frames.push(this.drawPlayerPunch2(0));
        frames.push(this.drawPlayerPunch2(1));
        frames.push(this.drawPlayerPunch2(2));
        break;
      case 'kick':
        frames.push(this.drawPlayerKick(0));
        frames.push(this.drawPlayerKick(1));
        frames.push(this.drawPlayerKick(2));
        break;
      case 'jump_kick':
        frames.push(this.drawPlayerJumpKick());
        break;
      case 'combo3':
        frames.push(this.drawPlayerCombo3(0));
        frames.push(this.drawPlayerCombo3(1));
        frames.push(this.drawPlayerCombo3(2));
        frames.push(this.drawPlayerCombo3(3));
        break;
      case 'hurt':
        frames.push(this.drawPlayerHurt());
        break;
      case 'knockdown':
        frames.push(this.drawPlayerKnockdown(0));
        frames.push(this.drawPlayerKnockdown(1));
        break;
      case 'getup':
        frames.push(this.drawPlayerGetUp(0));
        frames.push(this.drawPlayerGetUp(1));
        break;
      case 'victory':
        for (let f = 0; f < 4; f++) {
          frames.push(this.drawPlayerVictory(f));
        }
        break;
      case 'defeat':
        frames.push(this.drawPlayerDefeat());
        break;
      case 'typing':
        for (let f = 0; f < 4; f++) {
          frames.push(this.drawPlayerTyping(f));
        }
        break;
      default:
        frames.push(this.drawPlayerIdleFrame(0));
    }

    this.cache.set(key, frames);
    return frames;
  }

  // Draw Protagonist Base Model
  // Dimensions: 48x64 canvas, origin at (24, 60)
  private static drawProtagonistBody(
    ctx: CanvasRenderingContext2D,
    opts: {
      breatheY?: number;
      hairFlowX?: number;
      hairFlowY?: number;
      armLeftAngle?: number;
      armRightAngle?: number;
      legLeftOffset?: number;
      legRightOffset?: number;
      punchExtend?: number;
      kickExtend?: number;
      hurt?: boolean;
      headYOffset?: number;
      torsoLeanX?: number;
      crouchY?: number;
    }
  ): void {
    const breathe = opts.breatheY || 0;
    const crouch = opts.crouchY || 0;
    const hairX = opts.hairFlowX || 0;
    const hairY = opts.hairFlowY || 0;
    const leanX = opts.torsoLeanX || 0;

    const skinColor = opts.hurt ? '#f5c6cb' : '#d4a373';
    const skinShadow = opts.hurt ? '#d17b88' : '#a26a42';
    const eyeTiredColor = '#5c4033';
    const hairDark = '#4a4e51';
    const hairGrey = '#a6afb8';
    const hairWhite = '#e2e8f0';
    const shirtBlack = '#1a1a1d';
    const shirtHighlight = '#323236';
    const pantsDark = '#1f2421';
    const pantsHighlight = '#343e39';
    const sneakerWhite = '#e9ecef';
    const sneakerSole = '#d63031';

    const cx = 24 + leanX;
    const baseY = 60 + crouch;

    // --- LEGS ---
    const legL = opts.legLeftOffset || 0;
    const legR = opts.legRightOffset || 0;

    // Left leg (back)
    this.px(ctx, pantsDark, cx - 5, baseY - 22 + breathe, 4, 12);
    this.px(ctx, pantsHighlight, cx - 5, baseY - 22 + breathe, 1, 12);
    this.px(ctx, pantsDark, cx - 5 + legL, baseY - 10, 4, 8);
    // Left sneaker
    this.px(ctx, sneakerWhite, cx - 7 + legL, baseY - 2, 6, 3);
    this.px(ctx, sneakerSole, cx - 7 + legL, baseY + 1, 6, 1);

    // Right leg (front)
    this.px(ctx, pantsDark, cx + 1, baseY - 22 + breathe, 4, 12);
    this.px(ctx, pantsHighlight, cx + 4, baseY - 22 + breathe, 1, 12);
    this.px(ctx, pantsDark, cx + 1 + legR, baseY - 10, 4, 8);
    // Right sneaker
    this.px(ctx, sneakerWhite, cx - 1 + legR, baseY - 2, 6, 3);
    this.px(ctx, sneakerSole, cx - 1 + legR, baseY + 1, 6, 1);

    // If kicking
    if (opts.kickExtend) {
      const kx = cx + opts.kickExtend;
      this.px(ctx, pantsDark, cx + 3, baseY - 20, opts.kickExtend, 5);
      this.px(ctx, pantsHighlight, cx + 3, baseY - 20, opts.kickExtend, 1);
      // Sneaker thrust
      this.px(ctx, sneakerWhite, kx, baseY - 22, 7, 5);
      this.px(ctx, sneakerSole, kx, baseY - 17, 7, 2);
    }

    // --- TORSO (Black T-shirt, lean & wiry) ---
    const torsoY = baseY - 36 + breathe;
    this.px(ctx, shirtBlack, cx - 6, torsoY, 12, 15);
    this.px(ctx, shirtHighlight, cx - 6, torsoY, 2, 15);
    // Collar / neck opening
    this.px(ctx, skinColor, cx - 2, torsoY, 4, 3);
    this.px(ctx, skinShadow, cx - 2, torsoY + 2, 4, 1);

    // Belt / waistband
    this.px(ctx, '#0b0c10', cx - 6, torsoY + 14, 12, 2);

    // --- LEFT ARM (Back) ---
    if (!opts.punchExtend) {
      this.px(ctx, shirtBlack, cx - 8, torsoY + 1, 3, 5);
      this.px(ctx, skinColor, cx - 8, torsoY + 6, 3, 8);
      // Fist
      this.px(ctx, skinShadow, cx - 8, torsoY + 14, 3, 3);
    }

    // --- HEAD & NECK ---
    const headY = torsoY - 14 + (opts.headYOffset || 0);

    // Neck
    this.px(ctx, skinColor, cx - 2, headY + 10, 4, 4);

    // Long Greying Hair (Back flowing layer)
    for (let hy = 0; hy < 14; hy++) {
      const hw = 4 + (hy > 6 ? 3 : 0);
      const hx = cx - 7 - Math.floor(hy / 3) + hairX;
      this.px(ctx, hy % 2 === 0 ? hairDark : hairGrey, hx, headY + 4 + hy + hairY, hw, 1);
      if (hy % 3 === 0) {
        this.px(ctx, hairWhite, hx + 1, headY + 4 + hy + hairY, 1, 1); // grey strands
      }
    }

    // Face / Head structure
    this.px(ctx, skinColor, cx - 4, headY, 9, 11);
    this.px(ctx, skinShadow, cx - 5, headY + 2, 1, 9); // jaw contour

    // Scruffy greying beard (41yo Argentine look)
    this.px(ctx, hairDark, cx - 3, headY + 8, 8, 3);
    this.px(ctx, hairGrey, cx - 2, headY + 9, 2, 1);
    this.px(ctx, hairGrey, cx + 2, headY + 9, 2, 1);
    this.px(ctx, hairDark, cx - 1, headY + 7, 3, 1); // mustache

    // Eyes: tired, heavy eyelids, determined look
    this.px(ctx, eyeTiredColor, cx - 2, headY + 3, 7, 1); // dark circles under eyes
    this.px(ctx, '#ffffff', cx - 1, headY + 4, 2, 2);
    this.px(ctx, '#1f2421', cx, headY + 4, 1, 2); // pupil
    this.px(ctx, '#ffffff', cx + 2, headY + 4, 2, 2);
    this.px(ctx, '#1f2421', cx + 3, headY + 4, 1, 2); // pupil
    // Eyebrows: thick, slightly furrowed
    this.px(ctx, hairDark, cx - 2, headY + 2, 3, 1);
    this.px(ctx, hairDark, cx + 2, headY + 2, 3, 1);

    // Nose
    this.px(ctx, skinShadow, cx + 1, headY + 5, 2, 2);

    // Forehead Hair & Bangs (Long greying hair parting)
    this.px(ctx, hairDark, cx - 5, headY - 2, 11, 4);
    this.px(ctx, hairGrey, cx - 4, headY - 1, 9, 2);
    this.px(ctx, hairWhite, cx - 2, headY - 2, 4, 1); // distinct grey streak
    this.px(ctx, hairDark, cx - 5, headY + 1, 2, 5); // sideburns
    this.px(ctx, hairGrey, cx - 5, headY + 4, 2, 3);

    // --- RIGHT ARM (Front / Punching) ---
    if (opts.punchExtend) {
      const pxLen = opts.punchExtend;
      // Shoulder
      this.px(ctx, shirtBlack, cx + 3, torsoY + 1, 4, 4);
      // Arm extended forward
      this.px(ctx, skinColor, cx + 6, torsoY + 2, pxLen, 4);
      this.px(ctx, skinShadow, cx + 6, torsoY + 5, pxLen, 1);
      // Knuckles / fist
      this.px(ctx, skinShadow, cx + 6 + pxLen, torsoY + 1, 5, 5);
      this.px(ctx, skinColor, cx + 7 + pxLen, torsoY + 2, 3, 3);
    } else {
      // Guard stance arm
      this.px(ctx, shirtBlack, cx + 3, torsoY + 1, 4, 4);
      this.px(ctx, skinColor, cx + 4, torsoY + 5, 4, 6);
      // Raised fist
      this.px(ctx, skinShadow, cx + 5, torsoY + 7, 4, 4);
      this.px(ctx, skinColor, cx + 6, torsoY + 8, 2, 2);
    }
  }

  // --- Protagonist Animation Generators ---

  private static drawPlayerIdleFrame(frame: number): SpriteFrame {
    const { canvas, ctx } = this.createCanvas(48, 64);
    const breatheY = frame === 1 || frame === 2 ? -1 : 0;
    const hairFlowX = frame === 2 || frame === 3 ? -1 : 0;

    this.drawProtagonistBody(ctx, { breatheY, hairFlowX });
    return { canvas, originX: 24, originY: 60, width: 48, height: 64 };
  }

  private static drawPlayerWalkFrame(frame: number): SpriteFrame {
    const { canvas, ctx } = this.createCanvas(48, 64);
    const cycle = [
      { l: -4, r: 4, b: 0, hx: -1 },
      { l: -2, r: 2, b: -1, hx: 0 },
      { l: 0, r: 0, b: -2, hx: 1 },
      { l: 4, r: -4, b: 0, hx: 0 },
      { l: 2, r: -2, b: -1, hx: -1 },
      { l: 0, r: 0, b: -2, hx: 0 },
    ][frame % 6];

    this.drawProtagonistBody(ctx, {
      legLeftOffset: cycle.l,
      legRightOffset: cycle.r,
      breatheY: cycle.b,
      hairFlowX: cycle.hx,
    });

    return { canvas, originX: 24, originY: 60, width: 48, height: 64 };
  }

  private static drawPlayerWalkDepthFrame(frame: number, isUp: boolean): SpriteFrame {
    const { canvas, ctx } = this.createCanvas(48, 64);
    const lOff = frame % 2 === 0 ? -2 : 2;
    const rOff = frame % 2 === 0 ? 2 : -2;
    const breathe = frame % 2 === 0 ? -1 : 0;

    this.drawProtagonistBody(ctx, {
      legLeftOffset: lOff,
      legRightOffset: rOff,
      breatheY: breathe,
      hairFlowY: isUp ? -1 : 1,
      headYOffset: isUp ? -1 : 0,
    });

    return { canvas, originX: 24, originY: 60, width: 48, height: 64 };
  }

  private static drawPlayerRunFrame(frame: number): SpriteFrame {
    const { canvas, ctx } = this.createCanvas(56, 64);
    const cycle = [
      { l: -8, r: 8, b: 0, lean: 3, hx: -4 },
      { l: -5, r: 5, b: -2, lean: 4, hx: -5 },
      { l: 0, r: 0, b: -3, lean: 4, hx: -5 },
      { l: 8, r: -8, b: 0, lean: 3, hx: -4 },
      { l: 5, r: -5, b: -2, lean: 4, hx: -5 },
      { l: 0, r: 0, b: -3, lean: 4, hx: -5 },
    ][frame % 6];

    this.drawProtagonistBody(ctx, {
      legLeftOffset: cycle.l,
      legRightOffset: cycle.r,
      breatheY: cycle.b,
      torsoLeanX: cycle.lean,
      hairFlowX: cycle.hx,
    });

    return { canvas, originX: 28, originY: 60, width: 56, height: 64 };
  }

  private static drawPlayerJumpFrame(frame: number): SpriteFrame {
    const { canvas, ctx } = this.createCanvas(48, 64);
    if (frame === 0) {
      // Springing up
      this.drawProtagonistBody(ctx, {
        breatheY: -4,
        hairFlowY: 3,
        legLeftOffset: -2,
        legRightOffset: 2,
      });
    } else if (frame === 1) {
      // Apex / tuck
      this.drawProtagonistBody(ctx, {
        breatheY: -6,
        crouchY: -4,
        hairFlowX: -2,
        hairFlowY: -1,
        legLeftOffset: 0,
        legRightOffset: 0,
      });
    } else {
      // Falling down
      this.drawProtagonistBody(ctx, {
        breatheY: -2,
        hairFlowY: -4,
        legLeftOffset: -1,
        legRightOffset: 1,
      });
    }

    return { canvas, originX: 24, originY: 60, width: 48, height: 64 };
  }

  private static drawPlayerPunch1(frame: number): SpriteFrame {
    const { canvas, ctx } = this.createCanvas(56, 64);
    const extend = [6, 14, 8][frame];
    this.drawProtagonistBody(ctx, {
      punchExtend: extend,
      torsoLeanX: frame === 1 ? 2 : 0,
      hairFlowX: frame === 1 ? -2 : 0,
    });
    return { canvas, originX: 24, originY: 60, width: 56, height: 64 };
  }

  private static drawPlayerPunch2(frame: number): SpriteFrame {
    const { canvas, ctx } = this.createCanvas(64, 64);
    const extend = [8, 18, 10][frame];
    this.drawProtagonistBody(ctx, {
      punchExtend: extend,
      torsoLeanX: frame === 1 ? 4 : 1,
      hairFlowX: frame === 1 ? -3 : 0,
      legLeftOffset: -3,
      legRightOffset: 4,
    });
    return { canvas, originX: 24, originY: 60, width: 64, height: 64 };
  }

  private static drawPlayerKick(frame: number): SpriteFrame {
    const { canvas, ctx } = this.createCanvas(64, 64);
    const extend = [6, 16, 8][frame];
    this.drawProtagonistBody(ctx, {
      kickExtend: extend,
      torsoLeanX: frame === 1 ? -2 : 0,
      hairFlowX: frame === 1 ? 2 : 0,
    });
    return { canvas, originX: 24, originY: 60, width: 64, height: 64 };
  }

  private static drawPlayerJumpKick(): SpriteFrame {
    const { canvas, ctx } = this.createCanvas(64, 64);
    this.drawProtagonistBody(ctx, {
      kickExtend: 18,
      torsoLeanX: -4,
      breatheY: -8,
      hairFlowX: -5,
      hairFlowY: 2,
    });
    return { canvas, originX: 24, originY: 60, width: 64, height: 64 };
  }

  private static drawPlayerCombo3(frame: number): SpriteFrame {
    const { canvas, ctx } = this.createCanvas(64, 64);
    // Spinning finisher roundhouse
    const extend = [4, 18, 14, 2][frame];
    this.drawProtagonistBody(ctx, {
      kickExtend: extend,
      torsoLeanX: frame === 1 ? 3 : 0,
      hairFlowX: frame === 1 ? -4 : frame === 2 ? 3 : 0,
    });
    return { canvas, originX: 24, originY: 60, width: 64, height: 64 };
  }

  private static drawPlayerHurt(): SpriteFrame {
    const { canvas, ctx } = this.createCanvas(48, 64);
    this.drawProtagonistBody(ctx, {
      hurt: true,
      torsoLeanX: -5,
      headYOffset: -2,
      hairFlowX: -4,
      breatheY: 2,
    });
    return { canvas, originX: 24, originY: 60, width: 48, height: 64 };
  }

  private static drawPlayerKnockdown(frame: number): SpriteFrame {
    const { canvas, ctx } = this.createCanvas(64, 48);
    const skinColor = '#d4a373';
    const hairDark = '#4a4e51';
    const hairGrey = '#a6afb8';
    const shirtBlack = '#1a1a1d';
    const pantsDark = '#1f2421';
    const sneakerWhite = '#e9ecef';

    if (frame === 0) {
      // In air tumbling backwards
      this.px(ctx, skinColor, 10, 20, 8, 8); // head
      this.px(ctx, hairDark, 6, 20, 6, 8); // hair
      this.px(ctx, shirtBlack, 18, 18, 14, 10); // torso
      this.px(ctx, pantsDark, 32, 16, 16, 8); // legs
      this.px(ctx, sneakerWhite, 48, 14, 6, 4); // sneakers
    } else {
      // Flat on the ground
      this.px(ctx, hairGrey, 6, 38, 8, 4);
      this.px(ctx, skinColor, 12, 36, 8, 6);
      this.px(ctx, shirtBlack, 20, 36, 14, 6);
      this.px(ctx, pantsDark, 34, 38, 16, 4);
      this.px(ctx, sneakerWhite, 50, 37, 6, 4);
    }

    return { canvas, originX: 32, originY: 42, width: 64, height: 48 };
  }

  private static drawPlayerGetUp(frame: number): SpriteFrame {
    const { canvas, ctx } = this.createCanvas(48, 64);
    // Pushing up from knees
    const crouch = frame === 0 ? 12 : 6;
    this.drawProtagonistBody(ctx, {
      crouchY: -crouch,
      torsoLeanX: -2,
      headYOffset: 2,
    });
    return { canvas, originX: 24, originY: 60, width: 48, height: 64 };
  }

  private static drawPlayerVictory(frame: number): SpriteFrame {
    const { canvas, ctx } = this.createCanvas(48, 64);
    // Holding mate cup with straw (bombilla) and smiling
    this.drawProtagonistBody(ctx, { breatheY: frame % 2 === 0 ? -1 : 0 });

    // Draw mate in hand!
    const cx = 24;
    const mateY = 60 - 32;
    this.px(ctx, '#2d5a27', cx + 7, mateY, 5, 5); // green calabash
    this.px(ctx, '#e9ecef', cx + 9, mateY - 3, 1, 4); // silver bombilla straw
    this.px(ctx, '#d4af37', cx + 10, mateY - 4, 1, 2); // gold tip

    return { canvas, originX: 24, originY: 60, width: 48, height: 64 };
  }

  private static drawPlayerDefeat(): SpriteFrame {
    const { canvas, ctx } = this.createCanvas(48, 64);
    // Slumped head down, exhausted
    this.drawProtagonistBody(ctx, {
      torsoLeanX: -3,
      headYOffset: 4,
      hairFlowY: 4,
    });
    return { canvas, originX: 24, originY: 60, width: 48, height: 64 };
  }

  private static drawPlayerTyping(frame: number): SpriteFrame {
    const { canvas, ctx } = this.createCanvas(64, 64);
    const skinColor = '#d4a373';
    const hairDark = '#4a4e51';
    const hairGrey = '#a6afb8';
    const shirtBlack = '#1a1a1d';
    const pantsDark = '#1f2421';

    // Chair
    this.px(ctx, '#2c3e50', 12, 38, 14, 18);
    this.px(ctx, '#1a252f', 16, 56, 6, 6);

    // Protagonist seated leaning into monitor
    this.px(ctx, pantsDark, 18, 46, 12, 12);
    this.px(ctx, shirtBlack, 16, 30, 12, 16);
    this.px(ctx, hairDark, 12, 18, 8, 12);
    this.px(ctx, hairGrey, 14, 16, 6, 4);
    this.px(ctx, skinColor, 20, 18, 8, 8); // face looking at screen

    // Arms typing frantically
    const handY = frame % 2 === 0 ? 36 : 38;
    this.px(ctx, shirtBlack, 24, 32, 6, 4);
    this.px(ctx, skinColor, 30, handY, 8, 3);

    // Desk
    this.px(ctx, '#795548', 36, 42, 26, 4);
    this.px(ctx, '#5d4037', 58, 46, 4, 16);

    // Glowing Computer Monitor
    this.px(ctx, '#37474f', 44, 24, 16, 14);
    this.px(ctx, frame % 2 === 0 ? '#00e5ff' : '#ffffff', 46, 26, 12, 10); // glowing screen
    this.px(ctx, '#263238', 50, 38, 4, 4); // stand

    // Keyboard
    this.px(ctx, '#90a4ae', 36, 40, 8, 2);

    return { canvas, originX: 32, originY: 62, width: 64, height: 64 };
  }

  // =========================================================================
  // ENEMIES AND BOSSES
  // =========================================================================

  public static getEnemyFrames(type: string): SpriteFrame[] {
    const key = `enemy_${type}`;
    if (this.cache.has(key)) return this.cache.get(key)!;

    const frames: SpriteFrame[] = [];

    switch (type) {
      // LEVEL 1: PROCRASTINACIÓN
      case 'botella':
        for (let f = 0; f < 4; f++) frames.push(this.drawBotella(f));
        break;
      case 'tv_hipnotico':
        for (let f = 0; f < 4; f++) frames.push(this.drawTvHipnotico(f));
        break;
      case 'notificacion':
        for (let f = 0; f < 4; f++) frames.push(this.drawNotificacion(f));
        break;
      case 'gamer_fantasma':
        for (let f = 0; f < 4; f++) frames.push(this.drawGamerFantasma(f));
        break;
      case 'duende_procrastinacion':
        for (let f = 0; f < 4; f++) frames.push(this.drawDuende(f));
        break;
      case 'sillon_viviente':
        for (let f = 0; f < 4; f++) frames.push(this.drawSillon(f));
        break;
      case 'boss_algoritmo':
        for (let f = 0; f < 4; f++) frames.push(this.drawBossAlgoritmo(f));
        break;

      // LEVEL 2: RESPONSABILIDADES
      case 'platos_mutantes':
        for (let f = 0; f < 4; f++) frames.push(this.drawPlatos(f));
        break;
      case 'ropa_sucia':
        for (let f = 0; f < 4; f++) frames.push(this.drawRopaSucia(f));
        break;
      case 'escoba_rebelde':
        for (let f = 0; f < 4; f++) frames.push(this.drawEscoba(f));
        break;
      case 'bolsa_basura':
        for (let f = 0; f < 4; f++) frames.push(this.drawBolsaBasura(f));
        break;
      case 'clon_tareas':
        for (let f = 0; f < 4; f++) frames.push(this.drawClonTareas(f));
        break;
      case 'gato_naranja':
        for (let f = 0; f < 4; f++) frames.push(this.drawGato(f, '#e67e22', '#d35400'));
        break;
      case 'gato_tuxedo':
        for (let f = 0; f < 4; f++) frames.push(this.drawGato(f, '#2c3e50', '#ffffff'));
        break;
      case 'boss_lista':
        for (let f = 0; f < 4; f++) frames.push(this.drawBossLista(f));
        break;

      // LEVEL 3: COLAPSO MENTAL Y ECONÓMICO
      case 'factura_voladora':
        for (let f = 0; f < 4; f++) frames.push(this.drawFactura(f));
        break;
      case 'inspector_monotributo':
        for (let f = 0; f < 4; f++) frames.push(this.drawInspector(f));
        break;
      case 'deuda_encapuchada':
        for (let f = 0; f < 4; f++) frames.push(this.drawDeuda(f));
        break;
      case 'pasajero_impaciente':
        for (let f = 0; f < 4; f++) frames.push(this.drawPasajero(f));
        break;
      case 'cliente_cambio':
        for (let f = 0; f < 4; f++) frames.push(this.drawCliente(f));
        break;
      case 'protag_clon':
        for (let f = 0; f < 4; f++) frames.push(this.drawPlayerWalkFrame(f));
        break;
      case 'boss_colapso':
        for (let f = 0; f < 4; f++) frames.push(this.drawBossColapso(f));
        break;

      default:
        for (let f = 0; f < 4; f++) frames.push(this.drawBotella(f));
    }

    this.cache.set(key, frames);
    return frames;
  }

  // --- Specific Enemy Renderers ---

  private static drawBotella(f: number): SpriteFrame {
    const { canvas, ctx } = this.createCanvas(32, 48);
    const wobble = Math.sin(f * Math.PI / 2) * 2;
    const bx = 16 + wobble;
    // Green glass bottle
    this.px(ctx, '#27ae60', bx - 5, 20, 10, 18);
    this.px(ctx, '#2ecc71', bx - 4, 20, 2, 18); // shine
    this.px(ctx, '#1e8449', bx - 2, 12, 4, 8); // neck
    this.px(ctx, '#f1c40f', bx - 2, 10, 4, 2); // cap
    // Eyes
    this.px(ctx, '#ffffff', bx - 3, 24, 3, 3);
    this.px(ctx, '#e74c3c', bx - 2, 25, 1, 1);
    this.px(ctx, '#ffffff', bx + 1, 24, 3, 3);
    this.px(ctx, '#e74c3c', bx + 2, 25, 1, 1);
    // Little beer feet
    this.px(ctx, '#d35400', bx - 4, 38, 3, 4);
    this.px(ctx, '#d35400', bx + 2, 38, 3, 4);

    return { canvas, originX: 16, originY: 42, width: 32, height: 48 };
  }

  private static drawTvHipnotico(f: number): SpriteFrame {
    const { canvas, ctx } = this.createCanvas(40, 48);
    const bob = f % 2 === 0 ? 0 : -1;
    // TV Body
    this.px(ctx, '#4b4b4b', 6, 12 + bob, 28, 24);
    this.px(ctx, '#2d3436', 8, 14 + bob, 20, 20); // Screen
    // Antenna
    this.px(ctx, '#747d8c', 16, 6 + bob, 2, 6);
    this.px(ctx, '#747d8c', 22, 6 + bob, 2, 6);
    // Hypnotic spiral / static
    const colors = ['#e84393', '#00cec9', '#fdcb6e', '#6c5ce7'];
    this.px(ctx, colors[f % 4], 12, 18 + bob, 12, 12);
    this.px(ctx, '#ffffff', 16, 22 + bob, 4, 4);
    // Legs
    this.px(ctx, '#2f3542', 10, 36 + bob, 4, 6);
    this.px(ctx, '#2f3542', 26, 36 + bob, 4, 6);

    return { canvas, originX: 20, originY: 42, width: 40, height: 48 };
  }

  private static drawNotificacion(f: number): SpriteFrame {
    const { canvas, ctx } = this.createCanvas(36, 36);
    const floatY = Math.sin(f * Math.PI / 2) * 2;
    // Red notification badge bubble
    this.px(ctx, '#e84118', 4, 6 + floatY, 28, 20);
    this.px(ctx, '#c23616', 4, 24 + floatY, 8, 4); // bubble tail
    // White exclamation bell
    this.px(ctx, '#f5f6fa', 16, 10 + floatY, 4, 8);
    this.px(ctx, '#f5f6fa', 16, 20 + floatY, 4, 3);
    // Angry pixel eyes
    this.px(ctx, '#ffffff', 8, 12 + floatY, 4, 4);
    this.px(ctx, '#2f3640', 10, 13 + floatY, 2, 2);
    this.px(ctx, '#ffffff', 24, 12 + floatY, 4, 4);
    this.px(ctx, '#2f3640', 24, 13 + floatY, 2, 2);

    return { canvas, originX: 18, originY: 30, width: 36, height: 36 };
  }

  private static drawGamerFantasma(f: number): SpriteFrame {
    const { canvas, ctx } = this.createCanvas(40, 52);
    const bob = Math.sin(f * Math.PI / 2) * 3;
    // Translucent ghost body
    ctx.globalAlpha = 0.85;
    this.px(ctx, '#48dbfb', 8, 10 + bob, 24, 28);
    this.px(ctx, '#0abde3', 10, 8 + bob, 20, 6);
    // Floating ripples
    this.px(ctx, '#48dbfb', 8, 38 + bob, 6, 6);
    this.px(ctx, '#48dbfb', 18, 38 + bob, 6, 4);
    this.px(ctx, '#48dbfb', 26, 38 + bob, 6, 6);
    // Glowing red eyes
    this.px(ctx, '#ff3838', 12, 16 + bob, 4, 4);
    this.px(ctx, '#ff3838', 22, 16 + bob, 4, 4);
    // Gamepad controller in hands
    this.px(ctx, '#1e272e', 10, 26 + bob, 20, 8);
    this.px(ctx, '#ff5e57', 12, 28 + bob, 3, 3); // buttons
    this.px(ctx, '#0be881', 24, 28 + bob, 3, 3);
    ctx.globalAlpha = 1.0;

    return { canvas, originX: 20, originY: 46, width: 40, height: 52 };
  }

  private static drawDuende(f: number): SpriteFrame {
    const { canvas, ctx } = this.createCanvas(36, 44);
    const bob = f % 2 === 0 ? 0 : 1;
    // Little gremlin body
    this.px(ctx, '#2ed573', 12, 18 + bob, 12, 14);
    this.px(ctx, '#1e90ff', 12, 32 + bob, 12, 6); // little pants
    // Big elf ears & face
    this.px(ctx, '#2ed573', 8, 14 + bob, 4, 4);
    this.px(ctx, '#2ed573', 24, 14 + bob, 4, 4);
    this.px(ctx, '#ffa502', 14, 16 + bob, 8, 8); // face
    this.px(ctx, '#ff4757', 16, 18 + bob, 2, 2); // eyes
    this.px(ctx, '#ff4757', 20, 18 + bob, 2, 2);
    // Sign: "MAÑANA"
    this.px(ctx, '#f1f2f6', 2, 4 + bob, 32, 10);
    this.px(ctx, '#2f3542', 4, 7 + bob, 28, 4);

    return { canvas, originX: 18, originY: 38, width: 36, height: 44 };
  }

  private static drawSillon(f: number): SpriteFrame {
    const { canvas, ctx } = this.createCanvas(56, 52);
    const bob = f % 2 === 0 ? 0 : 1;
    // Plush brown recliner with gaping mouth
    this.px(ctx, '#8d6e63', 6, 12 + bob, 44, 30);
    this.px(ctx, '#5d4037', 10, 14 + bob, 36, 16); // backrest
    // Jaws / cushion trap
    this.px(ctx, '#d32f2f', 12, 28 + bob, 32, 8);
    this.px(ctx, '#ffffff', 14, 28 + bob, 4, 3); // teeth
    this.px(ctx, '#ffffff', 22, 28 + bob, 4, 3);
    this.px(ctx, '#ffffff', 30, 28 + bob, 4, 3);
    this.px(ctx, '#ffffff', 38, 28 + bob, 4, 3);
    // Armrests
    this.px(ctx, '#6d4c41', 4, 20 + bob, 8, 18);
    this.px(ctx, '#6d4c41', 44, 20 + bob, 8, 18);
    // Wooden legs
    this.px(ctx, '#3e2723', 8, 42 + bob, 6, 6);
    this.px(ctx, '#3e2723', 42, 42 + bob, 6, 6);

    return { canvas, originX: 28, originY: 48, width: 56, height: 52 };
  }

  // --- Boss 1: EL ALGORITMO INFINITO ---
  private static drawBossAlgoritmo(f: number): SpriteFrame {
    const { canvas, ctx } = this.createCanvas(96, 96);
    const bob = Math.sin(f * Math.PI / 2) * 3;
    // Massive hybrid monitor / smartphone / console
    this.px(ctx, '#1e272e', 14, 16 + bob, 68, 62);
    this.px(ctx, '#0be881', 18, 20 + bob, 60, 48); // Glitching screen
    // Smartphone border on right
    this.px(ctx, '#3d3d3d', 68, 12 + bob, 20, 44);
    this.px(ctx, '#ff5e57', 70, 16 + bob, 16, 36);
    // Streaming feed / reels visual
    this.px(ctx, '#ff3838', 22, 24 + bob, 24, 14);
    this.px(ctx, '#3498db', 22, 42 + bob, 24, 14);
    // Huge cybernetic glowing eye in center
    this.px(ctx, '#ffffff', 44, 28 + bob, 16, 16);
    this.px(ctx, '#e74c3c', 48, 32 + bob, 8, 8);
    this.px(ctx, '#f1c40f', 50, 34 + bob, 4, 4);
    // Antennas / Cables
    this.px(ctx, '#7f8c8d', 28, 4 + bob, 4, 12);
    this.px(ctx, '#e74c3c', 26, 2 + bob, 8, 4); // blinking red beacon
    this.px(ctx, '#7f8c8d', 60, 4 + bob, 4, 12);
    this.px(ctx, '#00d2d3', 58, 2 + bob, 8, 4);
    // Hover thruster / cable tentacles
    this.px(ctx, '#2c3e50', 26, 78 + bob, 10, 12);
    this.px(ctx, '#2c3e50', 60, 78 + bob, 10, 12);

    return { canvas, originX: 48, originY: 86, width: 96, height: 96 };
  }

  // --- Level 2 Enemies ---

  private static drawPlatos(f: number): SpriteFrame {
    const { canvas, ctx } = this.createCanvas(36, 44);
    const bob = Math.sin(f * Math.PI / 2) * 2;
    // Stack of wobbly dishes
    for (let i = 0; i < 5; i++) {
      const wobble = ((i % 2 === 0 ? 1 : -1) * f) % 2;
      this.px(ctx, '#ecf0f1', 6 + wobble, 12 + i * 5 + bob, 24, 4);
      this.px(ctx, '#bdc3c7', 8 + wobble, 14 + i * 5 + bob, 20, 2);
    }
    // Greedy eyes on top plate
    this.px(ctx, '#e74c3c', 12, 14 + bob, 3, 3);
    this.px(ctx, '#e74c3c', 22, 14 + bob, 3, 3);
    // Soap suds feet
    this.px(ctx, '#3498db', 10, 36 + bob, 6, 4);
    this.px(ctx, '#3498db', 20, 36 + bob, 6, 4);

    return { canvas, originX: 18, originY: 40, width: 36, height: 44 };
  }

  private static drawRopaSucia(f: number): SpriteFrame {
    const { canvas, ctx } = this.createCanvas(44, 48);
    const bob = f % 2 === 0 ? 0 : 1;
    // Chaotic pile of colorful shirts and socks
    this.px(ctx, '#3498db', 8, 16 + bob, 28, 24);
    this.px(ctx, '#e74c3c', 12, 10 + bob, 18, 12);
    this.px(ctx, '#f1c40f', 6, 26 + bob, 12, 10);
    this.px(ctx, '#9b59b6', 22, 22 + bob, 14, 14);
    // Menacing sock arms
    this.px(ctx, '#e67e22', 2, 18 + bob, 8, 6);
    this.px(ctx, '#e67e22', 34, 18 + bob, 8, 6);
    // Glowing red button eyes
    this.px(ctx, '#ffffff', 14, 16 + bob, 4, 4);
    this.px(ctx, '#2c3e50', 16, 17 + bob, 2, 2);
    this.px(ctx, '#ffffff', 24, 16 + bob, 4, 4);
    this.px(ctx, '#2c3e50', 24, 17 + bob, 2, 2);

    return { canvas, originX: 22, originY: 44, width: 44, height: 48 };
  }

  private static drawEscoba(f: number): SpriteFrame {
    const { canvas, ctx } = this.createCanvas(32, 52);
    const tilt = f % 2 === 0 ? 2 : -2;
    // Wooden handle
    this.px(ctx, '#d35400', 15 + tilt, 6, 4, 28);
    // Straw bristles
    this.px(ctx, '#f39c12', 8 + tilt, 34, 18, 12);
    this.px(ctx, '#e67e22', 10 + tilt, 42, 14, 6);
    // Angry eyes on bristles
    this.px(ctx, '#ffffff', 11 + tilt, 36, 3, 3);
    this.px(ctx, '#c0392b', 12 + tilt, 37, 1, 1);
    this.px(ctx, '#ffffff', 19 + tilt, 36, 3, 3);
    this.px(ctx, '#c0392b', 20 + tilt, 37, 1, 1);

    return { canvas, originX: 16, originY: 48, width: 32, height: 52 };
  }

  private static drawBolsaBasura(f: number): SpriteFrame {
    const { canvas, ctx } = this.createCanvas(36, 44);
    const squish = f % 2 === 0 ? 0 : 2;
    // Bulging shiny black trash bag
    this.px(ctx, '#2d3436', 6, 14 + squish, 24, 24);
    this.px(ctx, '#636e72', 8, 16 + squish, 6, 18); // sheen
    // Tied neck
    this.px(ctx, '#d63031', 14, 10 + squish, 8, 4);
    // Glowing green slime eyes
    this.px(ctx, '#00b894', 10, 22 + squish, 4, 4);
    this.px(ctx, '#00b894', 22, 22 + squish, 4, 4);

    return { canvas, originX: 18, originY: 38 + squish, width: 36, height: 44 };
  }

  private static drawClonTareas(f: number): SpriteFrame {
    const { canvas, ctx } = this.createCanvas(32, 44);
    const bob = f % 2 === 0 ? 0 : 1;
    // Sticky post-it humanoid
    this.px(ctx, '#ffeaa7', 8, 12 + bob, 16, 20);
    this.px(ctx, '#fdcb6e', 10, 10 + bob, 12, 6); // head
    this.px(ctx, '#d63031', 12, 14 + bob, 2, 2); // eyes
    this.px(ctx, '#d63031', 18, 14 + bob, 2, 2);
    // Text lines on post-it
    this.px(ctx, '#2d3436', 11, 20 + bob, 10, 1);
    this.px(ctx, '#2d3436', 11, 24 + bob, 8, 1);
    // Little paper legs
    this.px(ctx, '#ffeaa7', 10, 32 + bob, 3, 6);
    this.px(ctx, '#ffeaa7', 19, 32 + bob, 3, 6);

    return { canvas, originX: 16, originY: 38, width: 32, height: 44 };
  }

  // --- Cat (Mischievous, playful, friendly, non-damageable) ---
  private static drawGato(f: number, coatColor: string, secondaryColor: string): SpriteFrame {
    const { canvas, ctx } = this.createCanvas(36, 28);
    const walk = f % 2 === 0 ? 0 : 1;
    // Body
    this.px(ctx, coatColor, 8, 12, 18, 9);
    this.px(ctx, secondaryColor, 10, 15, 14, 5); // belly/patch
    // Head & ears
    this.px(ctx, coatColor, 24, 8, 8, 8);
    this.px(ctx, secondaryColor, 24, 6, 3, 3); // left ear
    this.px(ctx, secondaryColor, 29, 6, 3, 3); // right ear
    // Eyes (emerald green)
    this.px(ctx, '#2ecc71', 27, 10, 2, 2);
    this.px(ctx, '#f39c12', 31, 11, 1, 1); // nose
    // Paws
    this.px(ctx, coatColor, 10 + walk, 21, 3, 5);
    this.px(ctx, coatColor, 16 - walk, 21, 3, 5);
    this.px(ctx, coatColor, 22 + walk, 21, 3, 5);
    // Tail waving
    const tailY = [4, 2, 4, 6][f % 4];
    this.px(ctx, coatColor, 4, 12, 4, 3);
    this.px(ctx, coatColor, 2, 8 + tailY, 3, 5);

    return { canvas, originX: 18, originY: 26, width: 36, height: 28 };
  }

  // --- Boss 2: LA LISTA INTERMINABLE ---
  private static drawBossLista(f: number): SpriteFrame {
    const { canvas, ctx } = this.createCanvas(96, 110);
    const bob = Math.sin(f * Math.PI / 2) * 2;
    // Enormous swirling tower of papers, post-its, plates, calendars
    this.px(ctx, '#f5f6fa', 20, 24 + bob, 56, 70);
    this.px(ctx, '#dcdde1', 24, 28 + bob, 48, 62);

    // 3 Cores visibly pulsating inside:
    // Core 1: Organización (Blue)
    this.px(ctx, '#00a8ff', 32, 34 + bob, 10, 10);
    this.px(ctx, '#ffffff', 35, 37 + bob, 4, 4);

    // Core 2: Tiempo (Gold Clock)
    this.px(ctx, '#fbc531', 54, 34 + bob, 10, 10);
    this.px(ctx, '#4cd137', 56, 36 + bob, 6, 6);

    // Core 3: Culpa (Crimson Heart at center)
    const pulse = f % 2 === 0 ? 14 : 12;
    this.px(ctx, '#e84118', 41, 56 + bob, pulse, pulse);
    this.px(ctx, '#ffffff', 44, 59 + bob, 4, 4);

    // To-do checkboxes
    for (let y = 0; y < 4; y++) {
      this.px(ctx, '#e84118', 26, 74 + y * 7 + bob, 3, 3);
      this.px(ctx, '#718093', 32, 75 + y * 7 + bob, 24, 1);
    }

    // Swirling laundry arms
    this.px(ctx, '#3498db', 8, 44 + bob, 14, 8);
    this.px(ctx, '#e74c3c', 74, 44 + bob, 14, 8);

    return { canvas, originX: 48, originY: 96, width: 96, height: 110 };
  }

  // --- Level 3 Enemies ---

  private static drawFactura(f: number): SpriteFrame {
    const { canvas, ctx } = this.createCanvas(36, 32);
    const flap = f % 2 === 0 ? 2 : -2;
    // Origami sharp bill with ARBA/AFIP header
    this.px(ctx, '#f5f6fa', 6, 10 + flap, 24, 16);
    this.px(ctx, '#e74c3c', 8, 12 + flap, 20, 3); // Red VENCIMIENTO stamp
    this.px(ctx, '#2f3542', 8, 18 + flap, 16, 1);
    this.px(ctx, '#2f3542', 8, 21 + flap, 12, 1);
    // Sharp razor teeth
    this.px(ctx, '#c0392b', 8, 24 + flap, 20, 3);
    this.px(ctx, '#ffffff', 10, 24 + flap, 3, 2);
    this.px(ctx, '#ffffff', 18, 24 + flap, 3, 2);

    return { canvas, originX: 18, originY: 26, width: 36, height: 32 };
  }

  private static drawInspector(f: number): SpriteFrame {
    const { canvas, ctx } = this.createCanvas(40, 56);
    const walk = f % 2 === 0 ? 0 : 2;
    // Grey suit bureaucrat
    this.px(ctx, '#718093', 12, 18, 16, 18);
    this.px(ctx, '#2f3542', 12, 36, 16, 12); // pants
    this.px(ctx, '#2f3542', 16, 20, 8, 14); // grey tie
    this.px(ctx, '#f8c291', 14, 8, 12, 10); // stern face
    this.px(ctx, '#2f3542', 12, 6, 16, 4); // hat / hair
    this.px(ctx, '#000000', 16, 12, 3, 2); // sunglasses
    this.px(ctx, '#000000', 22, 12, 3, 2);
    // Briefcase / Clausura Stamp
    this.px(ctx, '#8d6e63', 4, 26 + walk, 8, 10);
    this.px(ctx, '#e74c3c', 28, 24, 6, 8); // Red stamp

    return { canvas, originX: 20, originY: 52, width: 40, height: 56 };
  }

  private static drawDeuda(f: number): SpriteFrame {
    const { canvas, ctx } = this.createCanvas(44, 60);
    const bob = Math.sin(f * Math.PI / 2) * 2;
    // Hooded black reaper figure
    this.px(ctx, '#1e272e', 10, 10 + bob, 24, 40);
    this.px(ctx, '#000000', 14, 12 + bob, 16, 16); // dark hood interior
    // Glowing red eyes
    this.px(ctx, '#ff3838', 18, 18 + bob, 2, 2);
    this.px(ctx, '#ff3838', 24, 18 + bob, 2, 2);
    // Scythe of interest rates (% symbol)
    this.px(ctx, '#718093', 30, 6 + bob, 3, 44);
    this.px(ctx, '#ff5252', 26, 4 + bob, 14, 4); // blade
    this.px(ctx, '#ff5252', 24, 8 + bob, 6, 8);

    return { canvas, originX: 22, originY: 54, width: 44, height: 60 };
  }

  private static drawPasajero(f: number): SpriteFrame {
    const { canvas, ctx } = this.createCanvas(40, 56);
    const footTap = f % 2 === 0 ? 0 : 2;
    // Man checking watch frantically
    this.px(ctx, '#e67e22', 12, 18, 16, 18); // orange coat
    this.px(ctx, '#2c3e50', 12, 36, 16, 12);
    this.px(ctx, '#fad390', 14, 8, 12, 10);
    this.px(ctx, '#e74c3c', 16, 12, 8, 2); // stressed brow
    // Watch on wrist
    this.px(ctx, '#f1c40f', 6, 24, 6, 6);
    // Foot tapping
    this.px(ctx, '#000000', 12, 48 - footTap, 6, 3);
    this.px(ctx, '#000000', 22, 48, 6, 3);

    return { canvas, originX: 20, originY: 52, width: 40, height: 56 };
  }

  private static drawCliente(f: number): SpriteFrame {
    const { canvas, ctx } = this.createCanvas(44, 56);
    const bob = f % 2 === 0 ? 0 : 1;
    // Guy holding giant WhatsApp audio memo
    this.px(ctx, '#3498db', 12, 18 + bob, 18, 18);
    this.px(ctx, '#2c3e50', 14, 36 + bob, 14, 12);
    this.px(ctx, '#fad390', 16, 8 + bob, 10, 10);
    // Smug grin
    this.px(ctx, '#e74c3c', 18, 14 + bob, 6, 2);
    // Giant green voice memo bubble (08:45 mins!)
    this.px(ctx, '#25d366', 2, 22 + bob, 22, 12);
    this.px(ctx, '#ffffff', 6, 26 + bob, 14, 4); // soundwave bars

    return { canvas, originX: 22, originY: 52, width: 44, height: 56 };
  }

  // --- Boss 3: EL COLAPSO (Colossal 3-phase nightmare) ---
  private static drawBossColapso(f: number): SpriteFrame {
    const { canvas, ctx } = this.createCanvas(120, 120);
    const bob = Math.sin(f * Math.PI / 2) * 3;

    // Giant fractured head
    this.px(ctx, '#3d3d3d', 28, 16 + bob, 64, 52);
    this.px(ctx, '#2f3542', 32, 20 + bob, 56, 44);

    // Cracks / Mental fissures glowing purple
    this.px(ctx, '#9b59b6', 56, 16 + bob, 4, 30);
    this.px(ctx, '#e056fd', 46, 30 + bob, 16, 3);
    this.px(ctx, '#e056fd', 64, 36 + bob, 14, 3);

    // 3 Glitching screens surrounding head
    this.px(ctx, '#3498db', 10, 32 + bob, 20, 16); // screen 1
    this.px(ctx, '#e74c3c', 90, 32 + bob, 20, 16); // screen 2
    this.px(ctx, '#f1c40f', 50, 4 + bob, 20, 14);  // screen 3 (top)

    // Uber steering wheel sticking out
    this.px(ctx, '#000000', 84, 60 + bob, 18, 18);
    this.px(ctx, '#718093', 88, 64 + bob, 10, 10);

    // Eyes: Glowing hollow sockets
    this.px(ctx, '#e74c3c', 42, 34 + bob, 10, 8);
    this.px(ctx, '#ffffff', 44, 36 + bob, 4, 4);
    this.px(ctx, '#e74c3c', 68, 34 + bob, 10, 8);
    this.px(ctx, '#ffffff', 70, 36 + bob, 4, 4);

    // Mouth: Gaping vortex with "ERROR AL EXPORTAR"
    this.px(ctx, '#000000', 44, 48 + bob, 32, 12);
    this.px(ctx, '#ff3838', 48, 52 + bob, 24, 4);

    // Core "BLOQUEO" located at chest
    const pulse = f % 2 === 0 ? 18 : 16;
    this.px(ctx, '#8e44ad', 51, 74 + bob, pulse, pulse);
    this.px(ctx, '#f39c12', 54, 77 + bob, 10, 10);

    // Tentacles of bills and cables
    this.px(ctx, '#2c3e50', 20, 72 + bob, 14, 32);
    this.px(ctx, '#2c3e50', 86, 72 + bob, 14, 32);

    return { canvas, originX: 60, originY: 106, width: 120, height: 120 };
  }

  // =========================================================================
  // ITEMS AND PICKUPS
  // =========================================================================

  public static getItemFrame(type: string): SpriteFrame {
    const key = `item_${type}`;
    if (this.cache.has(key)) return this.cache.get(key)![0];

    const { canvas, ctx } = this.createCanvas(24, 24);

    switch (type) {
      case 'mate':
        // Calabash gourd with silver bombilla
        this.px(ctx, '#27ae60', 6, 8, 12, 12);
        this.px(ctx, '#1e8449', 8, 10, 8, 8);
        this.px(ctx, '#bdc3c7', 12, 2, 2, 8); // bombilla
        this.px(ctx, '#f1c40f', 13, 1, 2, 3); // gold tip
        break;

      case 'cafe':
        // Steaming white mug
        this.px(ctx, '#ecf0f1', 6, 8, 12, 12);
        this.px(ctx, '#6d4c41', 8, 10, 8, 3); // dark coffee
        this.px(ctx, '#ecf0f1', 18, 11, 3, 6); // handle
        // Steam wisps
        this.px(ctx, '#ffffff', 8, 4, 2, 3);
        this.px(ctx, '#ffffff', 13, 2, 2, 4);
        break;

      case 'pizza':
        // Pizza slice
        this.px(ctx, '#f39c12', 4, 18, 16, 4); // crust
        this.px(ctx, '#f1c40f', 6, 10, 12, 8); // cheese
        this.px(ctx, '#e74c3c', 10, 4, 4, 6); // tip
        this.px(ctx, '#c0392b', 8, 12, 3, 3); // pepperoni
        this.px(ctx, '#c0392b', 13, 14, 3, 3);
        break;

      case 'bebida':
        // Energy drink can
        this.px(ctx, '#2980b9', 7, 5, 10, 16);
        this.px(ctx, '#f1c40f', 9, 8, 6, 10); // lightning bolt
        this.px(ctx, '#bdc3c7', 7, 3, 10, 2); // can top
        break;

      case 'agenda':
        // Calendar / planner
        this.px(ctx, '#8e44ad', 5, 4, 14, 16);
        this.px(ctx, '#ecf0f1', 7, 6, 10, 12);
        this.px(ctx, '#e74c3c', 7, 6, 10, 3);
        break;

      case 'auriculares':
        // Over-ear headphones
        this.px(ctx, '#2c3e50', 5, 4, 14, 3); // band
        this.px(ctx, '#e74c3c', 3, 7, 5, 10); // left cup
        this.px(ctx, '#e74c3c', 16, 7, 5, 10); // right cup
        break;

      case 'diskette':
        // Floppy disk checkpoint
        this.px(ctx, '#34495e', 5, 5, 14, 15);
        this.px(ctx, '#ecf0f1', 7, 10, 10, 9); // label
        this.px(ctx, '#bdc3c7', 7, 5, 8, 5); // metal slider
        break;

      case 'caja':
        // Cardboard box breakable
        this.px(ctx, '#d35400', 2, 4, 20, 18);
        this.px(ctx, '#e67e22', 4, 6, 16, 14);
        this.px(ctx, '#ba4a00', 2, 12, 20, 2); // tape
        break;

      case 'tacho':
        // Trash bin breakable
        this.px(ctx, '#7f8c8d', 4, 6, 16, 16);
        this.px(ctx, '#95a5a6', 2, 4, 20, 3); // lid
        this.px(ctx, '#2c3e50', 6, 10, 12, 10);
        break;

      default:
        this.px(ctx, '#f1c40f', 4, 4, 16, 16);
    }

    const frame: SpriteFrame = { canvas, originX: 12, originY: 20, width: 24, height: 24 };
    this.cache.set(key, [frame]);
    return frame;
  }

  // Protagonist Pixel Portrait for HUD
  public static getProtagonistPortrait(): HTMLCanvasElement {
    const key = 'player_portrait';
    if (this.cache.has(key)) return this.cache.get(key)![0].canvas;

    const { canvas, ctx } = this.createCanvas(32, 32);
    // Dark background box
    this.px(ctx, '#1e272e', 0, 0, 32, 32);
    this.px(ctx, '#34495e', 1, 1, 30, 30);

    // Long greying hair
    this.px(ctx, '#4a4e51', 4, 4, 24, 26);
    this.px(ctx, '#a6afb8', 6, 6, 20, 10);
    this.px(ctx, '#e2e8f0', 8, 4, 6, 4); // grey streak

    // Face
    this.px(ctx, '#d4a373', 8, 8, 16, 16);
    this.px(ctx, '#a26a42', 7, 12, 2, 10); // shadow

    // Scruffy greying beard
    this.px(ctx, '#4a4e51', 10, 19, 12, 6);
    this.px(ctx, '#a6afb8', 12, 21, 8, 3);

    // Tired eyes, determined brow
    this.px(ctx, '#5c4033', 10, 13, 5, 2);
    this.px(ctx, '#5c4033', 17, 13, 5, 2);
    this.px(ctx, '#ffffff', 11, 14, 3, 2);
    this.px(ctx, '#1f2421', 12, 14, 2, 2);
    this.px(ctx, '#ffffff', 18, 14, 3, 2);
    this.px(ctx, '#1f2421', 19, 14, 2, 2);

    // Determined smirk
    this.px(ctx, '#1a1a1d', 14, 20, 5, 1);

    const frame: SpriteFrame = { canvas, originX: 0, originY: 0, width: 32, height: 32 };
    this.cache.set(key, [frame]);
    return canvas;
  }
}
