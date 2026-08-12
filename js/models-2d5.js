(() => {
  "use strict";

  const edgeCache = new Map();

  function shade(hex, amount) {
    if (!hex || hex[0] !== "#") return hex;
    const n = parseInt(hex.slice(1), 16);
    let r = (n >> 16) & 255, g = (n >> 8) & 255, b = n & 255;
    r = Math.max(0, Math.min(255, Math.round(r + amount * 255)));
    g = Math.max(0, Math.min(255, Math.round(g + amount * 255)));
    b = Math.max(0, Math.min(255, Math.round(b + amount * 255)));
    return `rgb(${r},${g},${b})`;
  }

  function getPixel(sprite, col, row) {
    if (!sprite) return null;
    if (sprite.pixels) {
      const i = row * sprite.w + col;
      return sprite.pixels[i] || null;
    }
    if (sprite.canvas) {
      const c = sprite.canvas.getContext("2d");
      const d = c.getImageData(col, row, 1, 1).data;
      if (d[3] < 20) return null;
      return `#${((1 << 24) + (d[0] << 16) + (d[1] << 8) + d[2]).toString(16).slice(1)}`;
    }
    return null;
  }

  function getEdgeProfile(sprite, fromRight) {
    const key = `${sprite.w}x${sprite.h}_${fromRight ? "R" : "L"}_${sprite.canvas ? "b" : "p"}`;
    if (edgeCache.has(key)) return edgeCache.get(key);
    const rows = [];
    for (let row = 0; row < sprite.h; row++) {
      let edgeCol = -1;
      let color = null;
      if (fromRight) {
        for (let col = sprite.w - 1; col >= 0; col--) {
          const p = getPixel(sprite, col, row);
          if (p) { edgeCol = col; color = p; break; }
        }
      } else {
        for (let col = 0; col < sprite.w; col++) {
          const p = getPixel(sprite, col, row);
          if (p) { edgeCol = col; color = p; break; }
        }
      }
      if (edgeCol >= 0) rows.push({ row, edgeCol, color });
    }
    edgeCache.set(key, rows);
    return rows;
  }

  const Models2D5 = {
    DEPTH_HERO: 18,
    DEPTH_ENEMY: 14,
    DEPTH_BOSS: 26,

    /** Sprite pixel extruso con facce laterali per ogni riga del profilo */
    drawExtrudedSprite(ctx, sprite, cx, groundY, scale, facingLeft, opts = {}) {
      if (!sprite) return;
      const depth = opts.depth || this.DEPTH_HERO;
      const bob = opts.bob || 0;
      const flash = opts.flash || 0;
      const s = scale;
      const w = sprite.w * s;
      const h = sprite.h * s;
      const footY = groundY;
      const cy = footY - h * 0.48 + bob;
      const depthX = (facingLeft ? -1 : 1) * depth * s * 0.52;
      const depthY = -depth * s * 0.42;
      const fromRight = !facingLeft;

      const DR = window.DepthRender;
      if (DR) DR.drawGroundShadow(ctx, cx, footY, w * 0.22, { alpha: 0.5 });

      ctx.save();
      ctx.imageSmoothingEnabled = false;

      const profile = getEdgeProfile(sprite, fromRight);
      const left = cx - w / 2;
      const top = cy - h / 2;

      // Piano posteriore (sprite scuro spostato)
      ctx.globalAlpha = 0.32;
      window.PixelSprites.drawSpriteCentered(ctx, sprite, cx + depthX * 0.85, cy + depthY * 0.85 + depth * 0.08, s * 0.97, facingLeft);
      ctx.globalAlpha = 1;

      // Facce laterali estruse (strisce per riga)
      const step = s >= 2 ? 1 : 2;
      for (let i = 0; i < profile.length; i += step) {
        const { row, edgeCol, color } = profile[i];
        const fx = left + edgeCol * s;
        const fy = top + row * s;
        const side = shade(color, -0.38);
        ctx.fillStyle = side;
        ctx.beginPath();
        if (fromRight) {
          ctx.moveTo(fx + s, fy);
          ctx.lineTo(fx + s + depthX, fy + depthY);
          ctx.lineTo(fx + s + depthX, fy + depthY + s);
          ctx.lineTo(fx + s, fy + s);
        } else {
          ctx.moveTo(fx, fy);
          ctx.lineTo(fx + depthX, fy + depthY);
          ctx.lineTo(fx + depthX, fy + depthY + s);
          ctx.lineTo(fx, fy + s);
        }
        ctx.closePath();
        ctx.fill();
      }

      // Cappello superiore (top face approssimato)
      let minRow = sprite.h, maxRow = 0;
      profile.forEach((p) => {
        minRow = Math.min(minRow, p.row);
        maxRow = Math.max(maxRow, p.row);
      });
      if (profile.length) {
        const topRow = profile.find((p) => p.row === minRow) || profile[0];
        const ty = top + minRow * s;
        ctx.fillStyle = shade(topRow.color, 0.12);
        ctx.beginPath();
        ctx.moveTo(left + topRow.edgeCol * s, ty);
        ctx.lineTo(left + topRow.edgeCol * s + depthX, ty + depthY);
        ctx.lineTo(left + w + depthX, ty + depthY);
        ctx.lineTo(left + w, ty);
        ctx.closePath();
        ctx.fill();
      }

      // Sprite frontale
      window.PixelSprites.drawSpriteCentered(ctx, sprite, cx, cy, s, facingLeft);

      if (flash > 0) {
        ctx.globalAlpha = Math.min(0.65, flash / 10);
        ctx.fillStyle = "#ffffff";
        ctx.fillRect(cx - w / 2, cy - h / 2, w, h);
      }
      ctx.restore();
    },

    /** Gatto mannaro procedurale 2.5D (corpo + testa + zampe + coda extruded) */
    drawCatModel(ctx, cx, groundY, size, palette, facingLeft, opts = {}) {
      const s = size;
      const footY = groundY;
      const bob = opts.bob || 0;
      const flip = facingLeft ? -1 : 1;
      const dx = flip * s * 0.55;
      const dy = -s * 0.38;
      const bodyW = s * 1.5;
      const bodyH = s * 1.1;
      const bodyD = s * 0.85;
      const bodyTop = footY - bodyH * 1.05 + bob;

      const DR = window.DepthRender;
      if (DR) DR.drawGroundShadow(ctx, cx, footY, s * 0.9, { alpha: 0.48 });

      ctx.save();
      ctx.imageSmoothingEnabled = false;

      // Coda extruded
      ctx.fillStyle = shade(palette.tail, -0.25);
      ctx.beginPath();
      ctx.moveTo(cx - flip * bodyW * 0.55, bodyTop + bodyH * 0.5);
      ctx.lineTo(cx - flip * bodyW * 1.1 + dx * 0.4, bodyTop + bodyH * 0.2 + dy * 0.4);
      ctx.lineTo(cx - flip * bodyW * 1.1 + dx * 0.4, bodyTop + bodyH * 0.35 + dy * 0.4);
      ctx.lineTo(cx - flip * bodyW * 0.55 + dx * 0.2, bodyTop + bodyH * 0.65 + dy * 0.2);
      ctx.closePath();
      ctx.fill();

      // Zampe (4 box)
      const legW = s * 0.28;
      const legH = s * 0.55;
      [[-0.42, 0.15], [0.42, 0.15], [-0.28, 0.55], [0.28, 0.55]].forEach(([lx, ly]) => {
        this.drawMiniBox(ctx, cx + lx * bodyW, footY - legH * 0.1, legW, legH, s * 0.35, palette.legs, flip);
      });

      // Corpo principale
      this.drawBox(ctx, cx, bodyTop + bodyH / 2, bodyW, bodyH, bodyD, {
        front: palette.body,
        top: shade(palette.body, 0.15),
        side: shade(palette.body, -0.28),
      }, flip);

      // Testa
      const headS = s * 0.95;
      const headY = bodyTop - headS * 0.35;
      this.drawBox(ctx, cx + flip * s * 0.08, headY, headS * 1.15, headS, headS * 0.75, {
        front: palette.head,
        top: shade(palette.head, 0.18),
        side: shade(palette.head, -0.3),
      }, flip);

      // Orecchie
      const earY = headY - headS * 0.45;
      [-0.38, 0.38].forEach((ex) => {
        ctx.fillStyle = palette.ear;
        const bx = cx + ex * headS + flip * 4;
        ctx.beginPath();
        ctx.moveTo(bx, earY);
        ctx.lineTo(bx + flip * 5 + dx * 0.15, earY - headS * 0.35 + dy * 0.15);
        ctx.lineTo(bx - flip * 3 + dx * 0.15, earY - headS * 0.2 + dy * 0.15);
        ctx.closePath();
        ctx.fill();
        ctx.fillStyle = palette.innerEar || "#ff8899";
        ctx.beginPath();
        ctx.moveTo(bx, earY - 2);
        ctx.lineTo(bx + flip * 2 + dx * 0.08, earY - headS * 0.22 + dy * 0.08);
        ctx.lineTo(bx - flip * 1 + dx * 0.08, earY - headS * 0.12 + dy * 0.08);
        ctx.closePath();
        ctx.fill();
      });

      // Muso + occhi 3D (quadrati extruded)
      const eyeY = headY - headS * 0.05;
      ctx.fillStyle = palette.eye;
      ctx.fillRect(cx + flip * headS * 0.22 - 3, eyeY, 5, 4);
      ctx.fillRect(cx - flip * headS * 0.22 - 3, eyeY, 5, 4);
      ctx.fillStyle = "#111";
      ctx.fillRect(cx + flip * headS * 0.22 - 1, eyeY + 1, 2, 3);
      ctx.fillRect(cx - flip * headS * 0.22 - 1, eyeY + 1, 2, 3);
      ctx.fillStyle = palette.nose || "#ff6688";
      ctx.fillRect(cx - 2 + flip * 2, headY + headS * 0.12, 4, 3);

      // Decal sprite opzionale sulla faccia
      if (opts.sprite) {
        ctx.globalAlpha = 0.55;
        window.PixelSprites.drawSpriteCentered(ctx, opts.sprite, cx + flip * 2, headY + headS * 0.05, s * 0.55, facingLeft);
        ctx.globalAlpha = 1;
      }

      ctx.restore();
    },

    /** Ninja umanoide 2.5D: torso box + testa + sprite sul petto */
    drawNinjaModel(ctx, cx, groundY, scale, palette, facingLeft, sprite, opts = {}) {
      const s = scale * 10;
      const footY = groundY;
      const bob = opts.bob || 0;
      const flip = facingLeft ? -1 : 1;
      const footY2 = footY + bob;

      const DR = window.DepthRender;
      if (DR) DR.drawGroundShadow(ctx, cx, footY, s * 0.55, { alpha: 0.52 });

      ctx.save();
      ctx.imageSmoothingEnabled = false;

      // Gambe
      this.drawMiniBox(ctx, cx - s * 0.22, footY2 - s * 0.15, s * 0.32, s * 0.55, s * 0.28, palette.legs, flip);
      this.drawMiniBox(ctx, cx + s * 0.22, footY2 - s * 0.15, s * 0.32, s * 0.55, s * 0.28, palette.legs, flip);

      // Torso
      this.drawBox(ctx, cx, footY2 - s * 0.95, s * 0.95, s * 0.85, s * 0.55, {
        front: palette.body,
        top: shade(palette.body, 0.2),
        side: shade(palette.body, -0.32),
      }, flip);

      // Braccia
      this.drawMiniBox(ctx, cx - s * 0.62, footY2 - s * 1.05, s * 0.28, s * 0.65, s * 0.32, palette.arms, flip);
      this.drawMiniBox(ctx, cx + s * 0.62, footY2 - s * 1.05, s * 0.28, s * 0.65, s * 0.32, palette.arms, flip);

      // Testa box
      const headY = footY2 - s * 1.55;
      this.drawBox(ctx, cx, headY, s * 0.72, s * 0.62, s * 0.48, {
        front: palette.mask,
        top: shade(palette.mask, 0.15),
        side: shade(palette.mask, -0.25),
      }, flip);

      // Bandana / crest
      ctx.fillStyle = palette.accent;
      ctx.fillRect(cx - s * 0.38 + flip * 2, headY - s * 0.38, s * 0.76, s * 0.12);

      // Sprite eroe sul torso (decal frontale)
      if (sprite) {
        this.drawExtrudedSprite(ctx, sprite, cx, footY2 - s * 0.35, scale * 0.52, facingLeft, {
          depth: this.DEPTH_HERO * 0.65,
          bob: 0,
        });
      }

      ctx.restore();
    },

    drawBox(ctx, cx, cy, w, h, d, colors, flip = 1) {
      const x = cx - w / 2;
      const y = cy - h / 2;
      const dx = flip * d * 0.58;
      const dy = -d * 0.42;
      const side = colors.side || shade(colors.front, -0.28);
      const top = colors.top || shade(colors.front, 0.14);

      ctx.fillStyle = side;
      ctx.beginPath();
      ctx.moveTo(x + w, y);
      ctx.lineTo(x + w + dx, y + dy);
      ctx.lineTo(x + w + dx, y + h + dy);
      ctx.lineTo(x + w, y + h);
      ctx.closePath();
      ctx.fill();

      ctx.fillStyle = top;
      ctx.beginPath();
      ctx.moveTo(x, y);
      ctx.lineTo(x + dx, y + dy);
      ctx.lineTo(x + w + dx, y + dy);
      ctx.lineTo(x + w, y);
      ctx.closePath();
      ctx.fill();

      ctx.fillStyle = colors.front;
      ctx.fillRect(x, y, w, h);
      ctx.strokeStyle = shade(colors.front, -0.4);
      ctx.lineWidth = 1;
      ctx.strokeRect(x + 0.5, y + 0.5, w - 1, h - 1);
    },

    drawMiniBox(ctx, cx, baseY, w, h, d, color, flip) {
      this.drawBox(ctx, cx, baseY - h / 2, w, h, d, { front: color, side: shade(color, -0.3), top: shade(color, 0.1) }, flip);
    },

    /** Albero volumetrico */
    drawTreeModel(ctx, cx, groundY, r, palette, depthSc = 1) {
      const s = r * depthSc;
      const DR = window.DepthRender;
      if (DR) DR.drawGroundShadow(ctx, cx, groundY, s * 1.1, { alpha: 0.35 });

      ctx.save();
      // Tronco
      this.drawBox(ctx, cx, groundY - s * 0.55, s * 0.35, s * 0.9, s * 0.28, {
        front: palette.trunk || "#4a3020",
        side: "#3a2018",
        top: "#5a4030",
      }, 1);

      // Chioma a 3 layer extruded
      [0.95, 0.72, 0.5].forEach((mult, i) => {
        const layerY = groundY - s * (0.85 + i * 0.38);
        const rw = s * mult * 1.4;
        const rh = s * mult * 0.75;
        const rd = s * mult * 0.5;
        this.drawBox(ctx, cx, layerY, rw, rh, rd, {
          front: palette.leaf || "#1a6a28",
          side: shade(palette.leaf || "#1a6a28", -0.22),
          top: shade(palette.leaf || "#2a9a38", 0.2),
        }, 1);
      });
      ctx.restore();
    },

    /** Cristallo / roccia volumetrica */
    drawRockModel(ctx, cx, groundY, r, color) {
      const s = r;
      const DR = window.DepthRender;
      if (DR) DR.drawGroundShadow(ctx, cx, groundY, s, { alpha: 0.4 });
      this.drawBox(ctx, cx, groundY - s * 0.45, s * 1.3, s * 0.85, s * 0.55, {
        front: color,
        side: shade(color, -0.3),
        top: shade(color, 0.15),
      }, 1);
    },

    catPalette(typeId, isBoss) {
      const palettes = {
        kitten: { body: "#cc8844", head: "#dd9955", legs: "#aa6633", tail: "#bb7733", ear: "#cc8844", innerEar: "#ffaa88", eye: "#44ff44" },
        tabby: { body: "#b07030", head: "#c08040", legs: "#905020", tail: "#a06028", ear: "#b07030", innerEar: "#ffcc99", eye: "#88ff44" },
        hunter: { body: "#886644", head: "#997755", legs: "#665533", tail: "#776644", ear: "#886644", innerEar: "#ff9988", eye: "#ffcc00" },
        archer: { body: "#6a7040", head: "#7a8050", legs: "#505830", tail: "#606838", ear: "#6a7040", innerEar: "#ccaa66", eye: "#aaff44" },
        werewolf: { body: "#662222", head: "#883333", legs: "#441818", tail: "#551818", ear: "#772828", innerEar: "#ff4444", eye: "#ff2200" },
        shadow: { body: "#442266", head: "#553388", legs: "#331844", tail: "#3a2050", ear: "#553388", innerEar: "#cc66ff", eye: "#ff44ff" },
      };
      if (isBoss) return { body: "#881100", head: "#aa2200", legs: "#550800", tail: "#661000", ear: "#991100", innerEar: "#ff4400", eye: "#ffff00" };
      return palettes[typeId] || palettes.tabby;
    },

    heroPalette(heroId) {
      const map = {
        kael: { body: "#1a4080", arms: "#153060", legs: "#102848", mask: "#224488", accent: "#00f5ff" },
        zara: { body: "#5a2080", arms: "#401860", legs: "#301050", mask: "#6622aa", accent: "#39ff14" },
        vex: { body: "#505860", arms: "#404850", legs: "#303840", mask: "#606878", accent: "#ffd700" },
        nia: { body: "#686868", arms: "#585858", legs: "#484848", mask: "#787878", accent: "#ff69b4" },
        ryn: { body: "#208888", arms: "#186868", legs: "#105050", mask: "#28a0a0", accent: "#00f5ff" },
      };
      return map[heroId] || map.kael;
    },
  };

  window.Models2D5 = Models2D5;
})();
