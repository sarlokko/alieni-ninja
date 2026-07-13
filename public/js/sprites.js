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
    // Kael — pelle blu, mantello nero, bracciale argento
    kael: parseSprite([
      "......bb......",
      ".....bbbb.....",
      "....bkkkkb....",
      "...bkkwwkkb...",
      "...bkwwwwkb...",
      "...bkkkkkkb...",
      "....bksskb....",
      ".....bssb.....",
      "....bB..Bb....",
      "....bB..Bb....",
      ".....b..b.....",
      ".....b..b.....",
    ], { ".": null, b: "#1e90ff", k: "#111122", w: "#e8e8ff", s: "#c0c0c0", B: "#0055aa" }),

    // Zara — pelle viola, occhi verdi, spade laser
    zara: parseSprite([
      "......vv......",
      ".....vvvv.....",
      "...ggvvvvgg...",
      "..gvvvvvvvvg..",
      "..gvvvvvvvvg..",
      "..gvvvvvvvvg..",
      "...vvvvvvvv...",
      "..ll....ll....",
      "..ll....ll....",
      "..ll....ll....",
      "................",
      "................",
    ], { ".": null, v: "#9b30ff", g: "#39ff14", l: "#00cc00" }),

    // Vex — corazza grigio-argento, occhi gialli
    vex: parseSprite([
      "......aa......",
      ".....aaaa.....",
      "....aaggga....",
      "...agggggga...",
      "...agyyyyga...",
      "...agggggga...",
      "...agggggga...",
      "....agggga....",
      "....ag..ga....",
      "...agg..gga...",
      "...aaa..aaa...",
      "...aaa..aaa...",
    ], { ".": null, a: "#5a6670", g: "#9aa8b5", y: "#ffd700" }),

    // Nia — pelle argento, occhi rosa, agile
    nia: parseSprite([
      "......ss......",
      ".....ssss.....",
      "....spppps....",
      "...spssssps...",
      "...spssssps...",
      "...spppppps...",
      "....ssssss....",
      ".....slls.....",
      "....ss..ss....",
      "....ss..ss....",
      "...ss....ss...",
      "................",
    ], { ".": null, s: "#d8d8e8", p: "#ff69b4", l: "#a8a8c0" }),

    // Ryn — piccola, pelle ciano, bastone dorato
    ryn: parseSprite([
      "......cc......",
      ".....cccc.....",
      "....cggggc....",
      "...cggggggc...",
      "...cggggggc...",
      "....ccggcc....",
      ".....cggc.....",
      ".....c||c.....",
      ".....c..c.....",
      ".....c..c.....",
      "................",
      "................",
    ], { ".": null, c: "#00f5ff", g: "#ffd700", "|": "#cc9900" }),

    cat: parseSprite([
      "....oooo....",
      "..oooooooo..",
      ".oooooooooo.",
      ".oowwooowoo.",
      ".oooooooooo.",
      ".oooooooooo.",
      "..oooooooo..",
      "...oo..oo...",
      "...oo..oo...",
      "............",
    ], { ".": null, o: "#cc8844", w: "#ffeecc" }),

    cat_boss: parseSprite([
      ".....rrrrr.....",
      "...rrrrrrrrr...",
      "..rrrrrrrrrrr..",
      ".rrrwwrrrwwrrr.",
      ".rrrrrrrrrrrrr.",
      ".rrrrrrrrrrrrr.",
      ".rrrrrrrrrrrrr.",
      "..rrrrrrrrrrr..",
      "...rrr..rrr....",
      "...rrr..rrr....",
      "...............",
      "...............",
    ], { ".": null, r: "#aa5522", w: "#ff4444" }),
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
