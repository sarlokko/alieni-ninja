(() => {
  "use strict";

  const PX = 3;

  function parseSprite(rows, palette) {
    const h = rows.length;
    const w = rows[0].length;
    const pixels = new Array(h * w);
    rows.forEach((row, y) => {
      [...row].forEach((ch, x) => {
        pixels[y * w + x] = palette[ch] ?? null;
      });
    });
    return { w, h, pixels };
  }

  const SPRITES = {
    // Kael — alieno blu, occhi argento, mantello ninja, antenna
    kael: parseSprite([
      "......aa......",
      ".....aaaa.....",
      "....annnna....",
      "...aksssska...",
      "...aksssska...",
      "...akkkkkka...",
      "....aksska....",
      ".....akska....",
      "....aB..Ba....",
      "...aBB..BBa...",
      "...aa....aa...",
      "................",
      "................",
      "................",
      "................",
      "................",
    ], { ".": null, a: "#1e90ff", k: "#0a1030", n: "#44aaff", s: "#d0d8e8", B: "#004488" }),

    // Zara — aliena viola, cresta, occhi verdi, lame laser
    zara: parseSprite([
      "......vv......",
      ".....vhhv.....",
      "....vggggv....",
      "...lgggggggl..",
      "..lvvvvvvvvl..",
      "..lvvvvvvvvl..",
      "...vvvvvvvv...",
      "...vvllllvv...",
      "..vvv....vvv..",
      "..lll....lll..",
      "..lll....lll..",
      "................",
      "................",
      "................",
      "................",
      "................",
    ], { ".": null, v: "#9b30ff", h: "#6a10cc", g: "#39ff14", l: "#00dd00" }),

    // Vex — alieno corazzato grigio-argento, occhi gialli
    vex: parseSprite([
      "...aaaaaaa...",
      "..aaaaaaaaa..",
      ".aaaagggaaa.",
      ".aaagyyygaaa.",
      ".aaagggggaaa.",
      ".aaagggggaaa.",
      "..aaagggaaa..",
      "...aaagaaa...",
      "...aa...aa...",
      "..aaa...aaa..",
      "..aaa...aaa..",
      "................",
      "................",
      "................",
      "................",
      "................",
    ], { ".": null, a: "#5a6678", g: "#8a98a8", y: "#ffd700" }),

    // Nia — aliena argento agile, occhi rosa, codino
    nia: parseSprite([
      "......ss......",
      ".....ssss.....",
      "....spppps....",
      "...spssssps...",
      "...spssssps...",
      "...spppppps...",
      "....ssssss....",
      ".....stts.....",
      "....ss..ss....",
      "....ss..ss....",
      "...sss..sss...",
      "................",
      "................",
      "................",
      "................",
      "................",
    ], { ".": null, s: "#c8c8d8", p: "#ff69b4", t: "#a0a0c0" }),

    // Ryn — alieno piccolo ciano, occhi dorati, bastone
    ryn: parseSprite([
      "......cc......",
      ".....cggc.....",
      "....cggggc....",
      "...cggggggc...",
      "...cggggggc...",
      "....ccggcc....",
      ".....c||c.....",
      ".....c..c.....",
      ".....c..c.....",
      "................",
      "................",
      "................",
      "................",
      "................",
      "................",
      "................",
    ], { ".": null, c: "#00f5ff", g: "#ffd700", "|": "#bb8800" }),

    // Gattino mannaro — orecchie a punta, occhi gialli, piccole zanne
    cat_kitten: parseSprite([
      "..e......e..",
      ".oooooooooo.",
      ".oowwyywoo.",
      ".oooooooooo.",
      ".oovvvvoo.",
      "..oooooooo..",
      "...oo..oo...",
      "...cc..cc...",
      "............",
      "............",
    ], { ".": null, e: "#cc8844", o: "#ddaa66", w: "#ffffee", y: "#ffee22", v: "#ffffff", c: "#ffddaa" }),

    // Gatto tigrato — strisce, occhi verdi, zanne visibili
    cat_tabby: parseSprite([
      "..e......e..",
      ".oooooooooo.",
      ".ottowwotto.",
      ".oooooooooo.",
      ".oovvvvoo.",
      ".oooooooooo.",
      "..oooooooo..",
      "..oo....oo..",
      "..cc....cc..",
      "...ff..ff...",
      "............",
    ], { ".": null, e: "#aa6622", o: "#cc8844", t: "#884422", w: "#ffeecc", v: "#aaff44", c: "#ffcc88", f: "#ffffff" }),

    // Cacciatore felino — muso allungato, artigli estesi, occhi rossi
    cat_hunter: parseSprite([
      "..e......e..",
      ".oooooooooo.",
      ".oowwffwwoo.",
      ".ooffffffoo.",
      ".oooooooooo.",
      ".oooooooooo.",
      "..oo....oo..",
      "..cc....cc..",
      "..ff....ff..",
      "...ff..ff...",
      "............",
    ], { ".": null, e: "#994422", o: "#bb7733", w: "#ffddaa", f: "#ffffff", c: "#ffaa66" }),

    // Gatto mannaro — corporatura massiccia, zanne lunghe, occhi rossi, pelo arruffato
    cat_werewolf: parseSprite([
      ".ee......ee.",
      "..oooooooo..",
      ".oooooooooo.",
      ".oowwccwwoo.",
      ".oocccccoo.",
      ".oooooooooo.",
      ".oooooooooo.",
      ".oooooooooo.",
      "..oo....oo..",
      "..cc....cc..",
      "..cc....cc..",
      "...ff..ff...",
      "............",
    ], { ".": null, e: "#772211", o: "#994422", w: "#ffccaa", c: "#ff2222" }),

    // Ombra felina — forma spettrale viola, occhi luminosi
    cat_shadow: parseSprite([
      "..e......e..",
      ".pppppppppp.",
      ".ppwwbbwwpp.",
      ".ppbbbbbbpp.",
      ".pppppppppp.",
      ".pppppppppp.",
      "..pp....pp..",
      "..bb....bb..",
      "...bb..bb...",
      "............",
    ], { ".": null, e: "#331144", p: "#442266", w: "#cc88ff", b: "#ff44ff" }),

    // Boss — re gatto mannaro con criniera, zanne enormi, corona
    cat_boss: parseSprite([
      ".ee........ee.",
      "..rrrrrrrrrr..",
      ".rrrrrrrrrrrr.",
      ".rrrwwccwwrrr.",
      ".rrccccccrrr.",
      ".rrrrrrrrrrr.",
      ".rrrrrrrrrrr.",
      ".rrrrrrrrrrr.",
      "..rrrrrrrrrr..",
      "..rr....rr....",
      "..cc....cc....",
      "..cc....cc....",
      "...ff..ff.....",
      "..............",
    ], { ".": null, e: "#661100", r: "#aa3311", w: "#ff6644", c: "#ff2222" }),
  };

  function drawSprite(ctx, sprite, x, y, scale, flipX) {
    const { w, pixels } = sprite;
    const s = scale || PX;
    pixels.forEach((color, i) => {
      if (!color) return;
      const col = i % w;
      const row = Math.floor(i / w);
      const drawCol = flipX ? (w - 1 - col) : col;
      ctx.fillStyle = color;
      ctx.fillRect(x + drawCol * s, y + row * s, s, s);
    });
  }

  function drawSpriteCentered(ctx, sprite, cx, cy, scale, facingLeft) {
    const s = scale || PX;
    drawSprite(ctx, sprite, cx - (sprite.w * s) / 2, cy - (sprite.h * s) / 2, s, facingLeft);
  }

  window.PixelSprites = { SPRITES, PX, drawSprite, drawSpriteCentered };
})();
