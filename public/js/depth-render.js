(() => {
  "use strict";

  const DepthRender = {
    /** Quanto sollevare gli sprite sopra i piedi (illusione altezza) */
    LIFT_MULT: 0.72,
    /** Parallax moltiplicatori per strati lontani */
    PARALLAX: [0.12, 0.28, 0.48],
    /** Nebbia profondità: distanza massima */
    FOG_DIST: 1400,

    /** Scala leggera: nord = più lontano = leggermente più piccolo */
    depthScaleY(y, worldH) {
      const t = Math.max(0, Math.min(1, y / worldH));
      return 0.9 + t * 0.1;
    },

    /** Y di disegno sprite (piedi a groundY, corpo sollevato) */
    spriteDrawY(groundY, entityHeight) {
      return groundY - entityHeight * this.LIFT_MULT;
    },

    /** Ombra volumetrica a terra */
    drawGroundShadow(ctx, x, y, radius, opts = {}) {
      const rx = radius * (opts.rxMult || 1.15);
      const ry = radius * (opts.ryMult || 0.42);
      const alpha = opts.alpha || 0.38;

      ctx.save();
      ctx.fillStyle = `rgba(0,0,0,${alpha * 0.35})`;
      ctx.beginPath();
      ctx.ellipse(x, y + radius * 0.08, rx * 1.35, ry * 1.25, 0, 0, Math.PI * 2);
      ctx.fill();

      ctx.fillStyle = `rgba(0,0,0,${alpha})`;
      ctx.beginPath();
      ctx.ellipse(x, y + radius * 0.55, rx, ry, 0, 0, Math.PI * 2);
      ctx.fill();

      ctx.fillStyle = `rgba(0,0,0,${alpha * 0.55})`;
      ctx.beginPath();
      ctx.ellipse(x, y + radius * 0.62, rx * 0.55, ry * 0.45, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    },

    /** Blocco 3D extruded (vista obliqua: faccia frontale + lato destro + top) */
    drawExtrudedBox(ctx, cx, baseY, width, height, depth, colors) {
      const w = width;
      const h = height;
      const d = depth;
      const x = cx - w / 2;
      const y = baseY - h;
      const top = colors.top || colors.front;
      const front = colors.front || "#444";
      const side = colors.side || this.shadeColor(front, -0.22);
      const edge = colors.edge || this.shadeColor(front, -0.35);

      ctx.save();
      ctx.imageSmoothingEnabled = false;

      // Lato destro (profondità)
      ctx.fillStyle = side;
      ctx.beginPath();
      ctx.moveTo(x + w, y);
      ctx.lineTo(x + w + d, y - d * 0.55);
      ctx.lineTo(x + w + d, y + h - d * 0.55);
      ctx.lineTo(x + w, y + h);
      ctx.closePath();
      ctx.fill();

      // Top
      ctx.fillStyle = top;
      ctx.beginPath();
      ctx.moveTo(x, y);
      ctx.lineTo(x + d, y - d * 0.55);
      ctx.lineTo(x + w + d, y - d * 0.55);
      ctx.lineTo(x + w, y);
      ctx.closePath();
      ctx.fill();

      // Fronte
      ctx.fillStyle = front;
      ctx.fillRect(x, y, w, h);

      // Highlight bordo
      ctx.strokeStyle = edge;
      ctx.lineWidth = 2;
      ctx.strokeRect(x + 0.5, y + 0.5, w - 1, h - 1);

      ctx.restore();
    },

    /** Pilastro/cilindro 3D */
    drawExtrudedPillar(ctx, cx, baseY, width, height, color) {
      const w = width;
      const h = height;
      const x = cx - w / 2;
      const y = baseY - h;
      const side = this.shadeColor(color, -0.25);
      const top = this.shadeColor(color, 0.15);

      ctx.save();
      ctx.fillStyle = side;
      ctx.fillRect(x + w * 0.65, y + 4, w * 0.35, h - 4);
      ctx.fillStyle = color;
      ctx.fillRect(x, y, w * 0.72, h);
      ctx.fillStyle = top;
      ctx.fillRect(x - 2, y - 6, w * 0.76 + 4, 8);
      ctx.restore();
    },

    /** Cristallo 3D */
    drawCrystal3D(ctx, cx, baseY, h, color) {
      ctx.save();
      const top = baseY - h;
      ctx.fillStyle = this.shadeColor(color, -0.3);
      ctx.beginPath();
      ctx.moveTo(cx, top);
      ctx.lineTo(cx + 10, baseY);
      ctx.lineTo(cx, baseY - 4);
      ctx.closePath();
      ctx.fill();
      ctx.fillStyle = color;
      ctx.globalAlpha = 0.85;
      ctx.beginPath();
      ctx.moveTo(cx, top);
      ctx.lineTo(cx - 10, baseY);
      ctx.lineTo(cx + 10, baseY);
      ctx.closePath();
      ctx.fill();
      ctx.fillStyle = "#ffffff";
      ctx.globalAlpha = 0.35;
      ctx.fillRect(cx - 2, top + h * 0.15, 3, h * 0.4);
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

    /** Cielo parallax + montagne lontane */
    drawParallaxSky(ctx, level, viewX, viewY, viewW, viewH) {
      const t = (gameTime || 0) * 0.002;
      ctx.save();
      ctx.imageSmoothingEnabled = false;

      // Gradiente cielo profondo
      const skyGrad = ctx.createLinearGradient(0, viewY, 0, viewY + viewH * 0.55);
      skyGrad.addColorStop(0, level.bg[0]);
      skyGrad.addColorStop(1, level.bg[1] + "cc");
      ctx.fillStyle = skyGrad;
      ctx.fillRect(viewX - 40, viewY - 80, viewW + 80, viewH * 0.62);

      // Strati parallax
      this.PARALLAX.forEach((mult, i) => {
        const px = -viewX * mult;
        const py = -viewY * mult * 0.35;
        ctx.globalAlpha = 0.12 + i * 0.08;
        ctx.fillStyle = i === 0 ? level.bg[1] : level.accent;
        const spacing = 280 + i * 120;
        const h = 60 + i * 40;
        for (let x = Math.floor((viewX * mult + px) / spacing) * spacing - spacing; x < viewX + viewW + spacing; x += spacing) {
          const mx = x - viewX * mult + px;
          const my = viewY + viewH * (0.08 + i * 0.06) + py;
          ctx.beginPath();
          ctx.moveTo(mx, my + h);
          ctx.lineTo(mx + spacing * 0.35, my);
          ctx.lineTo(mx + spacing * 0.7, my + h * 0.35);
          ctx.lineTo(mx + spacing, my + h);
          ctx.closePath();
          ctx.fill();
        }
      });

      // Stelle / particelle lontane
      ctx.globalAlpha = 0.25;
      ctx.fillStyle = "#ffffff";
      for (let i = 0; i < 40; i++) {
        const sx = viewX + ((i * 173 + Math.floor(viewX * 0.08)) % (viewW + 1));
        const sy = viewY + ((i * 97 + Math.floor(t * 40)) % Math.floor(viewH * 0.45));
        ctx.fillRect(sx, sy, 2, 2);
      }

      ctx.restore();
    },

    /** Pavimento con profondità prospettica (bande che convergono verso nord) */
    drawDepthFloor(ctx, level, viewX, viewY, viewW, viewH, worldH) {
      ctx.save();
      ctx.imageSmoothingEnabled = false;

      const bands = 18;
      for (let i = 0; i < bands; i++) {
        const t0 = i / bands;
        const t1 = (i + 1) / bands;
        const wy0 = viewY + (viewH * 0.08) + t0 * viewH * 0.92;
        const wy1 = viewY + (viewH * 0.08) + t1 * viewH * 0.92;
        const worldY = viewY + t0 * viewH;
        const depthT = Math.max(0, Math.min(1, worldY / (viewY + viewH)));
        const parity = i % 2 === 0;

        ctx.globalAlpha = 0.35 + depthT * 0.45;
        ctx.fillStyle = parity ? level.floor : level.bg[1];
        ctx.fillRect(viewX - 20, wy0, viewW + 40, wy1 - wy0 + 1);

        // Linee orizzontali di profondità
        ctx.globalAlpha = 0.08 + depthT * 0.12;
        ctx.strokeStyle = level.accent;
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.moveTo(viewX - 20, wy1);
        ctx.lineTo(viewX + viewW + 20, wy1);
        ctx.stroke();
      }

      // Linee prospettiche verticali (convergenza verso nord)
      const vanishX = viewX + viewW / 2;
      const vanishY = viewY + viewH * 0.05;
      const cols = 14;
      ctx.globalAlpha = 0.06;
      ctx.strokeStyle = level.accent;
      for (let c = 0; c <= cols; c++) {
        const bx = viewX + (viewW / cols) * c;
        ctx.beginPath();
        ctx.moveTo(vanishX, vanishY);
        ctx.lineTo(bx, viewY + viewH + 20);
        ctx.stroke();
      }

      // Vignette profondità ai bordi
      const vig = ctx.createRadialGradient(
        viewX + viewW / 2, viewY + viewH / 2, Math.min(viewW, viewH) * 0.2,
        viewX + viewW / 2, viewY + viewH / 2, Math.max(viewW, viewH) * 0.75
      );
      vig.addColorStop(0, "rgba(0,0,0,0)");
      vig.addColorStop(1, "rgba(0,0,0,0.35)");
      ctx.fillStyle = vig;
      ctx.globalAlpha = 1;
      ctx.fillRect(viewX - 20, viewY - 20, viewW + 40, viewH + 40);

      ctx.restore();
    },

    /** Oscuramento per entità lontane dal giocatore */
    applyDepthFog(ctx, x, y, px, py) {
      const dist = Math.hypot(x - px, y - py);
      const fog = Math.min(0.42, (dist / this.FOG_DIST) * 0.42);
      if (fog > 0.02) {
        ctx.globalAlpha *= 1 - fog;
      }
    },

    sortByY(items, yKey = "y") {
      return [...items].sort((a, b) => a[yKey] - b[yKey]);
    },
  };

  let gameTime = 0;
  DepthRender.setGameTime = (t) => { gameTime = t; };

  window.DepthRender = DepthRender;
})();
