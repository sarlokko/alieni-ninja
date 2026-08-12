(() => {
  "use strict";

  const DepthRender = {
    LIFT_MULT: 1.15,
    PARALLAX: [0.18, 0.38, 0.62],
    FOG_DIST: 1100,
    TILE_H: 88,

    depthScaleY(y, worldH) {
      const t = Math.max(0, Math.min(1, y / worldH));
      return 0.78 + t * 0.22;
    },

    spriteDrawY(groundY, entityHeight) {
      return groundY - entityHeight * this.LIFT_MULT;
    },

    drawGroundShadow(ctx, x, y, radius, opts = {}) {
      const rx = radius * (opts.rxMult || 1.35);
      const ry = radius * (opts.ryMult || 0.38);
      const alpha = opts.alpha || 0.55;
      ctx.save();
      ctx.fillStyle = `rgba(0,0,0,${alpha * 0.4})`;
      ctx.beginPath();
      ctx.ellipse(x, y + radius * 0.1, rx * 1.5, ry * 1.4, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = `rgba(0,0,0,${alpha})`;
      ctx.beginPath();
      ctx.ellipse(x, y + radius * 0.58, rx, ry, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = "rgba(0,0,0,0.65)";
      ctx.beginPath();
      ctx.ellipse(x, y + radius * 0.65, rx * 0.45, ry * 0.35, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    },

    drawExtrudedBox(ctx, cx, baseY, width, height, depth, colors) {
      const w = width;
      const h = height;
      const d = depth * 1.4;
      const x = cx - w / 2;
      const y = baseY - h;
      const top = colors.top || colors.front;
      const front = colors.front || "#444";
      const side = colors.side || this.shadeColor(front, -0.28);
      const edge = colors.edge || this.shadeColor(front, -0.4);
      ctx.save();
      ctx.imageSmoothingEnabled = false;
      ctx.fillStyle = side;
      ctx.beginPath();
      ctx.moveTo(x + w, y);
      ctx.lineTo(x + w + d, y - d * 0.62);
      ctx.lineTo(x + w + d, y + h - d * 0.62);
      ctx.lineTo(x + w, y + h);
      ctx.closePath();
      ctx.fill();
      ctx.fillStyle = top;
      ctx.beginPath();
      ctx.moveTo(x, y);
      ctx.lineTo(x + d, y - d * 0.62);
      ctx.lineTo(x + w + d, y - d * 0.62);
      ctx.lineTo(x + w, y);
      ctx.closePath();
      ctx.fill();
      ctx.fillStyle = front;
      ctx.fillRect(x, y, w, h);
      ctx.strokeStyle = edge;
      ctx.lineWidth = 2;
      ctx.strokeRect(x + 0.5, y + 0.5, w - 1, h - 1);
      ctx.restore();
    },

    drawExtrudedPillar(ctx, cx, baseY, width, height, color) {
      const w = width;
      const h = height;
      const x = cx - w / 2;
      const y = baseY - h;
      ctx.save();
      ctx.fillStyle = this.shadeColor(color, -0.32);
      ctx.fillRect(x + w * 0.62, y + 2, w * 0.42, h);
      ctx.fillStyle = color;
      ctx.fillRect(x, y, w * 0.68, h);
      ctx.fillStyle = this.shadeColor(color, 0.2);
      ctx.fillRect(x - 3, y - 8, w * 0.74 + 6, 10);
      ctx.restore();
    },

    drawCrystal3D(ctx, cx, baseY, h, color) {
      ctx.save();
      const top = baseY - h;
      ctx.fillStyle = this.shadeColor(color, -0.35);
      ctx.beginPath();
      ctx.moveTo(cx + 4, top + 4);
      ctx.lineTo(cx + 14, baseY);
      ctx.lineTo(cx, baseY - 2);
      ctx.closePath();
      ctx.fill();
      ctx.fillStyle = color;
      ctx.globalAlpha = 0.9;
      ctx.beginPath();
      ctx.moveTo(cx, top);
      ctx.lineTo(cx - 14, baseY);
      ctx.lineTo(cx + 14, baseY);
      ctx.closePath();
      ctx.fill();
      ctx.fillStyle = "#ffffff";
      ctx.globalAlpha = 0.5;
      ctx.fillRect(cx - 2, top + h * 0.12, 4, h * 0.45);
      ctx.restore();
    },

    shadeColor(hex, amount) {
      if (!hex || hex[0] !== "#") return hex;
      const n = parseInt(hex.slice(1), 16);
      let r = (n >> 16) & 255;
      let g = (n >> 8) & 255;
      let b = n & 255;
      r = Math.max(0, Math.min(255, Math.round(r + amount * 255)));
      g = Math.max(0, Math.min(255, Math.round(g + amount * 255)));
      b = Math.max(0, Math.min(255, Math.round(b + amount * 255)));
      return `rgb(${r},${g},${b})`;
    },

    /** Cielo parallax — coordinate SCHERMO (chiamare prima del translate mondo) */
    drawParallaxSkyScreen(ctx, level, camX, camY, viewW, viewH) {
      const t = gameTime || 0;
      ctx.save();
      ctx.imageSmoothingEnabled = false;
      const skyGrad = ctx.createLinearGradient(0, 0, 0, viewH * 0.55);
      skyGrad.addColorStop(0, level.bg[0]);
      skyGrad.addColorStop(0.55, level.bg[1]);
      skyGrad.addColorStop(1, "rgba(0,0,0,0)");
      ctx.fillStyle = skyGrad;
      ctx.fillRect(0, 0, viewW, viewH);

      this.PARALLAX.forEach((mult, i) => {
        ctx.globalAlpha = 0.22 + i * 0.12;
        ctx.fillStyle = i === 0 ? this.shadeColor(level.bg[1], 0.1) : level.accent;
        const spacing = 220 + i * 90;
        const mh = 90 + i * 50;
        const scroll = camX * mult;
        for (let x = -spacing; x < viewW + spacing; x += spacing) {
          const mx = x - (scroll % spacing);
          const my = viewH * (0.12 + i * 0.05) - camY * mult * 0.15;
          ctx.beginPath();
          ctx.moveTo(mx, my + mh);
          ctx.lineTo(mx + spacing * 0.32, my);
          ctx.lineTo(mx + spacing * 0.68, my + mh * 0.4);
          ctx.lineTo(mx + spacing, my + mh);
          ctx.closePath();
          ctx.fill();
        }
      });

      ctx.globalAlpha = 0.45;
      ctx.fillStyle = "#ffffff";
      for (let i = 0; i < 55; i++) {
        const sx = (i * 173 + Math.floor(camX * 0.06) + Math.floor(t * 0.4)) % viewW;
        const sy = (i * 97 + Math.floor(t * 0.25)) % Math.floor(viewH * 0.42);
        ctx.fillRect(sx, sy, i % 3 === 0 ? 3 : 2, i % 3 === 0 ? 3 : 2);
      }
      ctx.restore();
    },

    /** Pavimento isometrico in coordinate MONDO */
    drawWorldDepthFloor(ctx, level, left, top, right, bottom, worldW, worldH) {
      ctx.save();
      ctx.imageSmoothingEnabled = false;
      const tileW = 64;
      const tileH = this.TILE_H;
      const startX = Math.floor(left / tileW) * tileW - tileW;
      const startY = Math.floor(top / tileH) * tileH - tileH;

      for (let wy = startY; wy < bottom + tileH; wy += tileH) {
        const depthT = Math.max(0, Math.min(1, wy / worldH));
        const rowBright = 0.55 + depthT * 0.45;
        const parity = Math.floor(wy / tileH) % 2;

        for (let wx = startX; wx < right + tileW; wx += tileW) {
          const cx = wx + tileW / 2;
          const cy = wy + tileH / 2;
          const p = parity ^ (Math.floor(wx / tileW) % 2);

          ctx.globalAlpha = rowBright;
          ctx.fillStyle = p ? level.floor : this.shadeColor(level.floor, -0.12);
          this.drawIsoTile(ctx, cx, cy, tileW * 0.92, tileH * 0.48);

          ctx.globalAlpha = 0.18 + depthT * 0.2;
          ctx.strokeStyle = level.accent;
          ctx.lineWidth = 1;
          this.strokeIsoTile(ctx, cx, cy, tileW * 0.92, tileH * 0.48);
        }

        ctx.globalAlpha = 0.15 + depthT * 0.15;
        ctx.strokeStyle = level.accent;
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.moveTo(left - 40, wy + tileH);
        ctx.lineTo(right + 40, wy + tileH);
        ctx.stroke();
      }

      ctx.restore();
    },

    drawIsoTile(ctx, cx, cy, w, h) {
      ctx.beginPath();
      ctx.moveTo(cx, cy - h);
      ctx.lineTo(cx + w / 2, cy);
      ctx.lineTo(cx, cy + h);
      ctx.lineTo(cx - w / 2, cy);
      ctx.closePath();
      ctx.fill();
    },

    strokeIsoTile(ctx, cx, cy, w, h) {
      ctx.beginPath();
      ctx.moveTo(cx, cy - h);
      ctx.lineTo(cx + w / 2, cy);
      ctx.lineTo(cx, cy + h);
      ctx.lineTo(cx - w / 2, cy);
      ctx.closePath();
      ctx.stroke();
    },

    applyDepthFog(ctx, x, y, px, py) {
      const dist = Math.hypot(x - px, y - py);
      const fog = Math.min(0.55, (dist / this.FOG_DIST) * 0.55);
      if (fog > 0.02) ctx.globalAlpha *= 1 - fog;
    },

    sortByY(items, yKey = "y") {
      return [...items].sort((a, b) => a[yKey] - b[yKey]);
    },
  };

  let gameTime = 0;
  DepthRender.setGameTime = (t) => { gameTime = t; };
  window.DepthRender = DepthRender;
})();
