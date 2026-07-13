(() => {
  "use strict";

  const canvas = document.getElementById("game-canvas");
  const ctx = canvas.getContext("2d");
  const W = canvas.width;
  const H = canvas.height;

  const STATE = {
    TITLE: "title",
    STORY: "story",
    SELECT: "select",
    PLAYING: "playing",
    LEVEL_INTRO: "level_intro",
    LEVEL_CLEAR: "level_clear",
    GAME_OVER: "game_over",
    VICTORY: "victory",
  };

  const HEROES = [
    {
      id: "kael",
      name: "Kael",
      color: "#1e90ff",
      accent: "#c0c0c0",
      emoji: "🥷",
      desc: "Ninja furtivo — shuriken e mimetizzazione",
      speed: 4.2,
      hp: 100,
      damage: 12,
      attackRate: 18,
      range: 120,
      projectile: "shuriken",
      special: { name: "Mimetizzazione", cooldown: 300, duration: 120 },
    },
    {
      id: "zara",
      name: "Zara",
      color: "#9b30ff",
      accent: "#39ff14",
      emoji: "⚔️",
      desc: "Leader coraggiosa — spade laser",
      speed: 3.6,
      hp: 110,
      damage: 18,
      attackRate: 22,
      range: 90,
      projectile: "laser",
      special: { name: "Raffica Laser", cooldown: 240, damage: 35 },
    },
    {
      id: "vex",
      name: "Vex",
      color: "#708090",
      accent: "#ffd700",
      emoji: "🛡️",
      desc: "Guerriero corazzato — armi futuristiche",
      speed: 2.8,
      hp: 160,
      damage: 22,
      attackRate: 30,
      range: 100,
      projectile: "plasma",
      special: { name: "Scudo Esplosivo", cooldown: 360, radius: 100 },
    },
    {
      id: "nia",
      name: "Nia",
      color: "#c0c0c0",
      accent: "#ff69b4",
      emoji: "🎯",
      desc: "Agile specialista — armi da lancio",
      speed: 4.5,
      hp: 85,
      damage: 14,
      attackRate: 14,
      range: 140,
      projectile: "dart",
      special: { name: "Tempesta di Dardi", cooldown: 200, count: 8 },
    },
    {
      id: "ryn",
      name: "Ryn",
      color: "#00f5ff",
      accent: "#ffd700",
      emoji: "✨",
      desc: "Saggio arcano — bastone telescopico",
      speed: 3.4,
      hp: 90,
      damage: 16,
      attackRate: 24,
      range: 110,
      projectile: "arcane",
      special: { name: "Onda Arcana", cooldown: 280, radius: 130 },
    },
  ];

  const LEVELS = [
    {
      name: "Addestramento",
      story: "I cinque ninja alieni si preparano alla guerra. Elimina i gatti mannari di addestramento.",
      bg: ["#0d1b2a", "#1b263b"],
      enemyCount: 5,
      enemyHp: 30,
      enemySpeed: 1.2,
      boss: null,
      fragment: false,
    },
    {
      name: "Città Alienigena",
      story: "Le città del pianeta sono sotto assedio. Libera il distretto centrale dagli invasori felini.",
      bg: ["#1a0a2e", "#2d1b4e"],
      enemyCount: 8,
      enemyHp: 40,
      enemySpeed: 1.5,
      boss: null,
      fragment: false,
    },
    {
      name: "Bosco Infestato",
      story: "Un bosco alieno infestato da gatti mannari. Avanza verso il tempio antico.",
      bg: ["#0a1f0a", "#1a3a1a"],
      enemyCount: 10,
      enemyHp: 45,
      enemySpeed: 1.6,
      boss: null,
      fragment: false,
    },
    {
      name: "Tempio Antico",
      story: "Nel tempio dorme il Custode delle Stelle. Sconfiggilo per avanzare nella missione.",
      bg: ["#2a1a0a", "#4a3020"],
      enemyCount: 6,
      enemyHp: 50,
      enemySpeed: 1.7,
      boss: { name: "Custode delle Stelle", hp: 280, speed: 1.4, size: 36, color: "#ffd700" },
      fragment: true,
    },
    {
      name: "Sottomondo Felino",
      story: "Scendi nelle gallerie sotterranee dei Gatti Mannari. La Matrona degli Arcani ti attende.",
      bg: ["#1a0a0a", "#3a1515"],
      enemyCount: 10,
      enemyHp: 55,
      enemySpeed: 1.8,
      boss: { name: "Matrona degli Arcani", hp: 320, speed: 1.5, size: 34, color: "#ff4466" },
      fragment: true,
    },
    {
      name: "Tempio delle Stelle",
      story: "Un tempio tra le dimensioni. Il Guardiano Dimensionale protegge un frammento della Lancia.",
      bg: ["#0a0a2a", "#1a1a5a"],
      enemyCount: 8,
      enemyHp: 60,
      enemySpeed: 1.9,
      boss: { name: "Guardiano Dimensionale", hp: 350, speed: 1.6, size: 38, color: "#7b68ee" },
      fragment: true,
    },
    {
      name: "Battaglia sulla Luna",
      story: "Sulla superficie lunare, il Drago Stellare sputa fuoco cosmico contro la squadra.",
      bg: ["#1a1a2a", "#2a2a4a"],
      enemyCount: 10,
      enemyHp: 65,
      enemySpeed: 2.0,
      boss: { name: "Drago Stellare", hp: 400, speed: 1.3, size: 42, color: "#ff6347" },
      fragment: true,
    },
    {
      name: "Città Maledetta",
      story: "Una città corrotta dal caos felino. Il Signore del Caos domina le rovine.",
      bg: ["#1a0a1a", "#3a1a3a"],
      enemyCount: 12,
      enemyHp: 70,
      enemySpeed: 2.1,
      boss: { name: "Signore del Caos", hp: 420, speed: 1.7, size: 40, color: "#9400d3" },
      fragment: true,
    },
    {
      name: "Rifugio delle Stelle",
      story: "L'ultimo rifugio prima del confronto. La Matriarca del Mondo Felino fa la guardia.",
      bg: ["#0a1a2a", "#1a3a5a"],
      enemyCount: 10,
      enemyHp: 75,
      enemySpeed: 2.2,
      boss: { name: "Matriarca del Mondo Felino", hp: 450, speed: 1.8, size: 38, color: "#ff8c00" },
      fragment: true,
    },
    {
      name: "Confronto Finale",
      story: "Sulla Luna, il Re dei Gatti Mannari e il Guardiano dell'Universo proteggono la Lancia delle Stelle. È ora della battaglia finale!",
      bg: ["#0a0a1a", "#1a0a2a"],
      enemyCount: 8,
      enemyHp: 80,
      enemySpeed: 2.3,
      boss: { name: "Re dei Gatti Mannari", hp: 500, speed: 1.5, size: 44, color: "#ff2200" },
      finalBoss: { name: "Guardiano dell'Universo", hp: 350, speed: 1.9, size: 40, color: "#00f5ff" },
      fragment: true,
    },
  ];

  const keys = {};
  let mouse = { x: W / 2, y: H / 2 };
  let state = STATE.TITLE;
  let selectedHero = null;
  let currentLevel = 0;
  let fragments = 0;
  let introTimer = 0;
  let clearTimer = 0;
  let titlePulse = 0;

  let player = null;
  let enemies = [];
  let projectiles = [];
  let particles = [];
  let obstacles = [];
  let bossSpawned = false;
  let finalBossSpawned = false;
  let enemiesKilled = 0;
  let enemiesToSpawn = 0;
  let spawnTimer = 0;

  document.addEventListener("keydown", (e) => {
    keys[e.code] = true;
    if (["Space", "ArrowUp", "ArrowDown", "ArrowLeft", "ArrowRight"].includes(e.code)) {
      e.preventDefault();
    }
    handleInput(e.code);
  });
  document.addEventListener("keyup", (e) => { keys[e.code] = false; });
  canvas.addEventListener("mousemove", (e) => {
    const rect = canvas.getBoundingClientRect();
    mouse.x = (e.clientX - rect.left) * (W / rect.width);
    mouse.y = (e.clientY - rect.top) * (H / rect.height);
  });

  function handleInput(code) {
    if (code === "Enter" || code === "Space") {
      if (state === STATE.TITLE) { state = STATE.STORY; return; }
      if (state === STATE.STORY) { state = STATE.SELECT; return; }
      if (state === STATE.LEVEL_INTRO && introTimer <= 0) { startLevel(); return; }
      if (state === STATE.LEVEL_CLEAR) { nextLevel(); return; }
      if (state === STATE.GAME_OVER || state === STATE.VICTORY) { resetGame(); return; }
    }
    if (state === STATE.SELECT && code.startsWith("Digit")) {
      const idx = parseInt(code.replace("Digit", ""), 10) - 1;
      if (idx >= 0 && idx < HEROES.length) selectHero(idx);
    }
    if (state === STATE.PLAYING && code === "KeyE") useSpecial();
  }

  function selectHero(idx) {
    selectedHero = HEROES[idx];
    currentLevel = 0;
    fragments = 0;
    state = STATE.LEVEL_INTRO;
    introTimer = 180;
    initLevel();
  }

  function resetGame() {
    state = STATE.TITLE;
    selectedHero = null;
    currentLevel = 0;
    fragments = 0;
    player = null;
    enemies = [];
    projectiles = [];
    particles = [];
  }

  function initLevel() {
    const level = LEVELS[currentLevel];
    const hero = selectedHero;
    player = {
      x: W / 2,
      y: H - 80,
      vx: 0,
      vy: 0,
      hp: hero.hp,
      maxHp: hero.hp,
      angle: -Math.PI / 2,
      attackCooldown: 0,
      specialCooldown: 0,
      stealthTimer: 0,
      invulnerable: 0,
      hero,
    };
    enemies = [];
    projectiles = [];
    particles = [];
    obstacles = generateObstacles(currentLevel);
    bossSpawned = false;
    finalBossSpawned = false;
    enemiesKilled = 0;
    enemiesToSpawn = level.enemyCount;
    spawnTimer = 0;
  }

  function generateObstacles(levelIdx) {
    const obs = [];
    const count = 3 + Math.floor(levelIdx / 2);
    for (let i = 0; i < count; i++) {
      obs.push({
        x: 80 + Math.random() * (W - 160),
        y: 80 + Math.random() * (H - 200),
        w: 40 + Math.random() * 60,
        h: 30 + Math.random() * 50,
      });
    }
    return obs;
  }

  function startLevel() {
    state = STATE.PLAYING;
  }

  function nextLevel() {
    if (currentLevel >= LEVELS.length - 1) {
      state = STATE.VICTORY;
      return;
    }
    currentLevel++;
    state = STATE.LEVEL_INTRO;
    introTimer = 180;
    initLevel();
  }

  function spawnEnemy(isBoss = false, bossData = null) {
    const level = LEVELS[currentLevel];
    const side = Math.floor(Math.random() * 4);
    let x, y;
    if (side === 0) { x = Math.random() * W; y = -20; }
    else if (side === 1) { x = W + 20; y = Math.random() * H; }
    else if (side === 2) { x = Math.random() * W; y = H + 20; }
    else { x = -20; y = Math.random() * H; }

    if (isBoss && bossData) {
      enemies.push({
        x: W / 2,
        y: 60,
        hp: bossData.hp,
        maxHp: bossData.hp,
        speed: bossData.speed,
        size: bossData.size,
        color: bossData.color,
        isBoss: true,
        name: bossData.name,
        attackTimer: 0,
        emoji: "🐱",
      });
      addParticles(W / 2, 60, bossData.color, 20);
      return;
    }

    enemies.push({
      x, y,
      hp: level.enemyHp,
      maxHp: level.enemyHp,
      speed: level.enemySpeed,
      size: 18,
      color: "#cc8844",
      isBoss: false,
      attackTimer: 0,
      emoji: "🐱",
    });
  }

  function useSpecial() {
    if (!player || player.specialCooldown > 0) return;
    const h = player.hero;
    player.specialCooldown = h.special.cooldown;

    switch (h.id) {
      case "kael":
        player.stealthTimer = h.special.duration;
        player.invulnerable = h.special.duration;
        addParticles(player.x, player.y, h.color, 15);
        break;
      case "zara":
        for (let i = -2; i <= 2; i++) {
          const angle = player.angle + i * 0.3;
          projectiles.push(makeProjectile(player.x, player.y, angle, h.damage * 2, h.projectile, true));
        }
        break;
      case "vex":
        enemies.forEach((e) => {
          const dist = Math.hypot(e.x - player.x, e.y - player.y);
          if (dist < h.special.radius) {
            e.hp -= 50;
            addParticles(e.x, e.y, "#ffd700", 8);
          }
        });
        addParticles(player.x, player.y, h.accent, 25);
        break;
      case "nia":
        for (let i = 0; i < h.special.count; i++) {
          const angle = (Math.PI * 2 * i) / h.special.count;
          projectiles.push(makeProjectile(player.x, player.y, angle, h.damage, h.projectile, true));
        }
        break;
      case "ryn":
        enemies.forEach((e) => {
          const dist = Math.hypot(e.x - player.x, e.y - player.y);
          if (dist < h.special.radius) {
            e.hp -= 40;
            addParticles(e.x, e.y, h.color, 6);
          }
        });
        addParticles(player.x, player.y, h.accent, 20);
        break;
    }
  }

  function makeProjectile(x, y, angle, damage, type, isSpecial = false) {
    const speed = isSpecial ? 8 : 7;
    return {
      x, y,
      vx: Math.cos(angle) * speed,
      vy: Math.sin(angle) * speed,
      damage,
      type,
      life: 80,
      isSpecial,
    };
  }

  function addParticles(x, y, color, count) {
    for (let i = 0; i < count; i++) {
      const angle = Math.random() * Math.PI * 2;
      const speed = 1 + Math.random() * 3;
      particles.push({
        x, y,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        life: 20 + Math.random() * 20,
        color,
        size: 2 + Math.random() * 3,
      });
    }
  }

  function rectCircleCollide(rx, ry, rw, rh, cx, cy, cr) {
    const closestX = Math.max(rx, Math.min(cx, rx + rw));
    const closestY = Math.max(ry, Math.min(cy, ry + rh));
    return Math.hypot(cx - closestX, cy - closestY) < cr;
  }

  function updatePlaying() {
    const level = LEVELS[currentLevel];
    const h = player.hero;

    let dx = 0;
    let dy = 0;
    if (keys.ArrowLeft || keys.KeyA) dx -= 1;
    if (keys.ArrowRight || keys.KeyD) dx += 1;
    if (keys.ArrowUp || keys.KeyW) dy -= 1;
    if (keys.ArrowDown || keys.KeyS) dy += 1;

    const speed = h.speed * (player.stealthTimer > 0 ? 1.5 : 1);
    if (dx !== 0 || dy !== 0) {
      const len = Math.hypot(dx, dy);
      player.vx = (dx / len) * speed;
      player.vy = (dy / len) * speed;
      player.angle = Math.atan2(dy, dx);
    } else {
      player.vx *= 0.8;
      player.vy *= 0.8;
      player.angle = Math.atan2(mouse.y - player.y, mouse.x - player.x);
    }

    player.x += player.vx;
    player.y += player.vy;
    player.x = Math.max(20, Math.min(W - 20, player.x));
    player.y = Math.max(20, Math.min(H - 20, player.y));

    obstacles.forEach((o) => {
      if (rectCircleCollide(o.x, o.y, o.w, o.h, player.x, player.y, 14)) {
        player.x -= player.vx;
        player.y -= player.vy;
      }
    });

    if (player.attackCooldown > 0) player.attackCooldown--;
    if (player.specialCooldown > 0) player.specialCooldown--;
    if (player.stealthTimer > 0) player.stealthTimer--;
    if (player.invulnerable > 0) player.invulnerable--;

    if ((keys.Space || keys.KeyJ) && player.attackCooldown <= 0) {
      projectiles.push(makeProjectile(player.x, player.y, player.angle, h.damage, h.projectile));
      player.attackCooldown = h.attackRate;
    }

    if (spawnTimer > 0) spawnTimer--;
    else if (enemiesToSpawn > 0) {
      spawnEnemy();
      enemiesToSpawn--;
      spawnTimer = 40;
    }

    if (enemiesToSpawn === 0 && enemiesKilled >= level.enemyCount && !bossSpawned && level.boss) {
      spawnEnemy(true, level.boss);
      bossSpawned = true;
    }

    projectiles.forEach((p) => {
      p.x += p.vx;
      p.y += p.vy;
      p.life--;
      enemies.forEach((e) => {
        if (p.life > 0 && Math.hypot(p.x - e.x, p.y - e.y) < e.size) {
          e.hp -= p.damage;
          p.life = 0;
          addParticles(e.x, e.y, e.color, 5);
        }
      });
    });
    projectiles = projectiles.filter((p) => p.life > 0 && p.x > -20 && p.x < W + 20 && p.y > -20 && p.y < H + 20);

    enemies.forEach((e) => {
      const angle = Math.atan2(player.y - e.y, player.x - e.x);
      e.x += Math.cos(angle) * e.speed;
      e.y += Math.sin(angle) * e.speed;

      obstacles.forEach((o) => {
        if (rectCircleCollide(o.x, o.y, o.w, o.h, e.x, e.y, e.size)) {
          e.x -= Math.cos(angle) * e.speed;
          e.y -= Math.sin(angle) * e.speed;
        }
      });

      e.attackTimer++;
      const dist = Math.hypot(player.x - e.x, player.y - e.y);
      if (dist < e.size + 14 && player.invulnerable <= 0) {
        const dmg = e.isBoss ? 12 : 5;
        player.hp -= dmg;
        player.invulnerable = 30;
        addParticles(player.x, player.y, "#ff0000", 8);
      }
    });

    const dead = enemies.filter((e) => e.hp <= 0);
    dead.forEach((e) => {
      addParticles(e.x, e.y, e.color, e.isBoss ? 30 : 10);
      if (!e.isBoss) enemiesKilled++;
      else {
        if (level.fragment) fragments++;
        if (level.finalBoss && e.name === "Re dei Gatti Mannari" && !finalBossSpawned) {
          setTimeout(() => {
            if (state === STATE.PLAYING) {
              spawnEnemy(true, level.finalBoss);
              finalBossSpawned = true;
            }
          }, 1500);
        }
      }
    });
    enemies = enemies.filter((e) => e.hp > 0);

    particles.forEach((p) => {
      p.x += p.vx;
      p.y += p.vy;
      p.life--;
      p.vx *= 0.95;
      p.vy *= 0.95;
    });
    particles = particles.filter((p) => p.life > 0);

    if (player.hp <= 0) {
      state = STATE.GAME_OVER;
    }

    const allCleared = enemiesToSpawn === 0 && enemies.length === 0 &&
      enemiesKilled >= level.enemyCount &&
      (!level.boss || bossSpawned) &&
      (!level.finalBoss || finalBossSpawned);

    if (allCleared) {
      state = STATE.LEVEL_CLEAR;
      clearTimer = 120;
    }
  }

  function drawStars(bg) {
    ctx.fillStyle = bg[0];
    ctx.fillRect(0, 0, W, H);
    for (let i = 0; i < 80; i++) {
      const sx = (i * 137 + currentLevel * 50) % W;
      const sy = (i * 89 + currentLevel * 30) % H;
      ctx.fillStyle = `rgba(255,255,255,${0.2 + (i % 5) * 0.1})`;
      ctx.fillRect(sx, sy, 1 + (i % 2), 1 + (i % 2));
    }
    const grad = ctx.createRadialGradient(W / 2, H / 2, 0, W / 2, H / 2, W * 0.7);
    grad.addColorStop(0, "transparent");
    grad.addColorStop(1, bg[1] + "88");
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, W, H);
  }

  function drawObstacles() {
    obstacles.forEach((o) => {
      ctx.fillStyle = "rgba(60,60,90,0.8)";
      ctx.strokeStyle = "rgba(0,245,255,0.3)";
      ctx.lineWidth = 2;
      ctx.fillRect(o.x, o.y, o.w, o.h);
      ctx.strokeRect(o.x, o.y, o.w, o.h);
    });
  }

  function drawPlayer() {
    const p = player;
    const h = p.hero;
    ctx.save();
    ctx.translate(p.x, p.y);
    ctx.rotate(p.angle);

    if (p.stealthTimer > 0) ctx.globalAlpha = 0.4;

    ctx.fillStyle = h.color;
    ctx.beginPath();
    ctx.arc(0, 0, 16, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = h.accent;
    ctx.lineWidth = 2;
    ctx.stroke();

    ctx.font = "18px serif";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText(h.emoji, 0, 0);

    ctx.restore();

    if (p.invulnerable > 0 && p.invulnerable % 6 < 3) {
      ctx.strokeStyle = "#fff";
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.arc(p.x, p.y, 20, 0, Math.PI * 2);
      ctx.stroke();
    }
  }

  function drawEnemies() {
    enemies.forEach((e) => {
      ctx.save();
      ctx.translate(e.x, e.y);
      ctx.fillStyle = e.color;
      ctx.beginPath();
      ctx.arc(0, 0, e.size, 0, Math.PI * 2);
      ctx.fill();
      ctx.font = `${e.size}px serif`;
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.fillText(e.isBoss ? "😾" : e.emoji, 0, 0);
      ctx.restore();

      if (e.isBoss) {
        const barW = e.size * 2;
        ctx.fillStyle = "#333";
        ctx.fillRect(e.x - barW / 2, e.y - e.size - 14, barW, 6);
        ctx.fillStyle = e.color;
        ctx.fillRect(e.x - barW / 2, e.y - e.size - 14, barW * (e.hp / e.maxHp), 6);
        ctx.fillStyle = "#fff";
        ctx.font = "11px sans-serif";
        ctx.textAlign = "center";
        ctx.fillText(e.name, e.x, e.y - e.size - 20);
      }
    });
  }

  function drawProjectiles() {
    projectiles.forEach((p) => {
      const colors = {
        shuriken: "#c0c0c0",
        laser: "#39ff14",
        plasma: "#ff6347",
        dart: "#ff69b4",
        arcane: "#00f5ff",
      };
      ctx.fillStyle = colors[p.type] || "#fff";
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.isSpecial ? 6 : 4, 0, Math.PI * 2);
      ctx.fill();
      if (p.isSpecial) {
        ctx.strokeStyle = "#fff";
        ctx.lineWidth = 1;
        ctx.stroke();
      }
    });
  }

  function drawParticles() {
    particles.forEach((p) => {
      ctx.globalAlpha = p.life / 40;
      ctx.fillStyle = p.color;
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
      ctx.fill();
    });
    ctx.globalAlpha = 1;
  }

  function drawHUD() {
    const level = LEVELS[currentLevel];
    ctx.fillStyle = "rgba(0,0,0,0.5)";
    ctx.fillRect(0, 0, W, 50);

    ctx.fillStyle = "#00f5ff";
    ctx.font = "bold 16px sans-serif";
    ctx.textAlign = "left";
    ctx.fillText(`${level.name} — ${player.hero.name}`, 16, 22);

    ctx.fillStyle = "#888";
    ctx.font = "12px sans-serif";
    ctx.fillText(`Frammenti Lancia: ${fragments}/7`, 16, 40);

    const barX = W - 220;
    ctx.fillStyle = "#333";
    ctx.fillRect(barX, 14, 200, 16);
    ctx.fillStyle = player.hp > 30 ? "#39ff14" : "#ff4444";
    ctx.fillRect(barX, 14, 200 * (player.hp / player.maxHp), 16);
    ctx.strokeStyle = "#fff";
    ctx.lineWidth = 1;
    ctx.strokeRect(barX, 14, 200, 16);
    ctx.fillStyle = "#fff";
    ctx.font = "11px sans-serif";
    ctx.textAlign = "center";
    ctx.fillText(`HP ${Math.max(0, Math.ceil(player.hp))}/${player.maxHp}`, barX + 100, 26);

    if (player.specialCooldown > 0) {
      ctx.fillStyle = "#666";
      ctx.textAlign = "right";
      ctx.fillText(`Speciale: ${Math.ceil(player.specialCooldown / 60)}s`, W - 16, 40);
    } else {
      ctx.fillStyle = "#b026ff";
      ctx.textAlign = "right";
      ctx.fillText("Speciale: [E] pronto!", W - 16, 40);
    }

    ctx.fillStyle = "#888";
    ctx.textAlign = "center";
    ctx.font = "11px sans-serif";
    ctx.fillText("WASD/↑↓←→ muovi | SPAZIO/J attacca | E speciale", W / 2, H - 10);
  }

  function drawTextScreen(title, lines, sub = "") {
    drawStars(["#050510", "#0a0a2a"]);
    titlePulse += 0.05;
    const glow = 0.5 + Math.sin(titlePulse) * 0.3;

    ctx.fillStyle = `rgba(0,245,255,${glow})`;
    ctx.font = "bold 42px sans-serif";
    ctx.textAlign = "center";
    ctx.fillText(title, W / 2, 100);

    ctx.fillStyle = "#e8e8ff";
    ctx.font = "16px sans-serif";
    let y = 180;
    lines.forEach((line) => {
      if (line === "") { y += 10; return; }
      const words = line.split(" ");
      let current = "";
      words.forEach((word) => {
        const test = current + word + " ";
        if (ctx.measureText(test).width > W - 120) {
          ctx.fillText(current, W / 2, y);
          y += 26;
          current = word + " ";
        } else {
          current = test;
        }
      });
      if (current) { ctx.fillText(current, W / 2, y); y += 26; }
    });

    if (sub) {
      ctx.fillStyle = "#b026ff";
      ctx.font = "18px sans-serif";
      ctx.fillText(sub, W / 2, H - 60);
    }
  }

  function drawTitle() {
    drawTextScreen("Ninja Alieni vs Gatti Mannari", [
      "Cinque ninja alieni difendono il loro pianeta",
      "dall'invasione dei Gatti Mannari.",
      "",
      "Recupera la Lancia delle Stelle!",
    ], "Premi INVIO o SPAZIO per iniziare");
  }

  function drawStory() {
    drawTextScreen("La Trama", [
      "Zara, Kael, Vex, Nia e Ryn sono l'élite ninja aliena.",
      "I Gatti Mannari, guidati dal loro Re, invadono il pianeta.",
      "",
      "La squadra deve attraversare città aliene, foreste, templi",
      "e dimensioni misteriose per recuperare la Lancia delle Stelle.",
      "",
      "Il viaggio termina con lo scontro finale sulla Luna.",
    ], "Premi INVIO per scegliere il tuo eroe");
  }

  function drawSelect() {
    drawStars(["#0a0a1a", "#1a0a2a"]);
    ctx.fillStyle = "#00f5ff";
    ctx.font = "bold 28px sans-serif";
    ctx.textAlign = "center";
    ctx.fillText("Scegli il tuo Ninja Alieno", W / 2, 50);
    ctx.fillStyle = "#888";
    ctx.font="14px sans-serif";
    ctx.fillText("Premi 1-5 per selezionare", W / 2, 80);

    HEROES.forEach((h, i) => {
      const col = i % 3;
      const row = Math.floor(i / 3);
      const cx = 160 + col * 320;
      const cy = 180 + row * 200;
      const cardW = 280;
      const cardH = 170;

      ctx.fillStyle = "rgba(20,20,50,0.8)";
      ctx.strokeStyle = h.color;
      ctx.lineWidth = 2;
      ctx.fillRect(cx - cardW / 2, cy - cardH / 2, cardW, cardH);
      ctx.strokeRect(cx - cardW / 2, cy - cardH / 2, cardW, cardH);

      ctx.font = "36px serif";
      ctx.fillText(h.emoji, cx - cardW / 2 + 40, cy - 20);
      ctx.fillStyle = h.color;
      ctx.font = "bold 20px sans-serif";
      ctx.textAlign = "left";
      ctx.fillText(`${i + 1}. ${h.name}`, cx - cardW / 2 + 70, cy - 30);
      ctx.fillStyle = "#aaa";
      ctx.font = "13px sans-serif";
      ctx.fillText(h.desc, cx - cardW / 2 + 20, cy + 10);
      ctx.fillText(`HP:${h.hp} SPD:${h.speed} DMG:${h.damage}`, cx - cardW / 2 + 20, cy + 35);
      ctx.fillStyle = h.accent;
      ctx.fillText(`Speciale: ${h.special.name}`, cx - cardW / 2 + 20, cy + 58);
    });
  }

  function drawLevelIntro() {
    const level = LEVELS[currentLevel];
    drawTextScreen(`Livello ${currentLevel + 1}: ${level.name}`, [
      level.story,
      "",
      `Eroe: ${selectedHero.name} ${selectedHero.emoji}`,
      level.boss ? `Boss: ${level.boss.name}` : "Nessun boss — addestramento",
      level.finalBoss ? `Boss finale: ${level.finalBoss.name}` : "",
    ], introTimer > 0 ? "..." : "Premi INVIO per iniziare");
    if (introTimer > 0) introTimer--;
  }

  function drawLevelClear() {
    const level = LEVELS[currentLevel];
    drawStars(level.bg);
    ctx.fillStyle = "#39ff14";
    ctx.font = "bold 36px sans-serif";
    ctx.textAlign = "center";
    ctx.fillText("Livello Completato!", W / 2, H / 2 - 40);
    if (level.fragment) {
      ctx.fillStyle = "#ffd700";
      ctx.font = "20px sans-serif";
      ctx.fillText("⭐ Frammento della Lancia delle Stelle recuperato!", W / 2, H / 2);
    }
    ctx.fillStyle = "#aaa";
    ctx.font = "16px sans-serif";
    if (currentLevel < LEVELS.length - 1) {
      ctx.fillText("Premi INVIO per il prossimo livello", W / 2, H / 2 + 50);
    } else {
      ctx.fillText("Premi INVIO per la schermata finale", W / 2, H / 2 + 50);
    }
    if (clearTimer > 0) clearTimer--;
  }

  function drawGameOver() {
    drawTextScreen("Game Over", [
      `${selectedHero?.name || "Ninja"} è stato sconfitto dai Gatti Mannari.`,
      "",
      "I felini mannari dominano ancora il pianeta...",
    ], "Premi INVIO per riprovare");
  }

  function drawVictory() {
    drawStars(["#0a0a2a", "#2a0a4a"]);
    ctx.fillStyle = "#ffd700";
    ctx.font = "bold 40px sans-serif";
    ctx.textAlign = "center";
    ctx.fillText("VITTORIA!", W / 2, 120);

    ctx.fillStyle = "#e8e8ff";
    ctx.font = "18px sans-serif";
    const lines = [
      "La Lancia delle Stelle è stata ricomposta!",
      "Il Re dei Gatti Mannari e il Guardiano dell'Universo",
      "sono stati sconfitti.",
      "",
      `${selectedHero.name} e la squadra ninja aliena`,
      "hanno salvato il pianeta!",
      "",
      `Frammenti recuperati: ${fragments}/7`,
      `Livelli completati: ${LEVELS.length}`,
    ];
    let y = 200;
    lines.forEach((l) => { ctx.fillText(l, W / 2, y); y += 30; });

    ctx.fillStyle = "#00f5ff";
    ctx.font = "16px sans-serif";
    ctx.fillText("Premi INVIO per tornare al menu", W / 2, H - 50);
  }

  function drawPlaying() {
    const level = LEVELS[currentLevel];
    drawStars(level.bg);
    drawObstacles();
    drawParticles();
    drawProjectiles();
    drawEnemies();
    drawPlayer();
    drawHUD();
  }

  function update() {
    switch (state) {
      case STATE.PLAYING:
        updatePlaying();
        break;
      case STATE.LEVEL_INTRO:
        if (introTimer > 0) introTimer--;
        break;
    }
  }

  function draw() {
    switch (state) {
      case STATE.TITLE: drawTitle(); break;
      case STATE.STORY: drawStory(); break;
      case STATE.SELECT: drawSelect(); break;
      case STATE.LEVEL_INTRO: drawLevelIntro(); break;
      case STATE.PLAYING: drawPlaying(); break;
      case STATE.LEVEL_CLEAR: drawLevelClear(); break;
      case STATE.GAME_OVER: drawGameOver(); break;
      case STATE.VICTORY: drawVictory(); break;
    }
  }

  function loop() {
    update();
    draw();
    requestAnimationFrame(loop);
  }

  loop();
})();
