(() => {
  "use strict";

  const canvas = document.getElementById("game-canvas");
  const ctx = canvas.getContext("2d");
  let W = 1600;
  let H = 900;
  const WORLD_W = 20000;
  const WORLD_H = 15000;
  const { SPRITES, drawSpriteCentered, drawSprite, drawPixelCircle, PX } = window.PixelSprites;
  const PLAYER_SCALE = 2.25;
  const ENEMY_SPRITE_SCALE = 2.15;
  const BOSS_SPRITE_SCALE = 2.5;
  const TILE_SCALE = 3.5;
  const DECOR_SCALE = 2.75;

  const gameLogo = new Image();
  gameLogo.src = "img/logo.png";
  let logoReady = false;
  gameLogo.onload = () => { logoReady = true; };

  const ENEMY_TYPES = {
    kitten:   { id: "kitten",   sprite: "cat_kitten",   name: "Gattino Mannaro", hpMult: 0.5,  speedMult: 0.62, damage: 2, size: 14, xp: 2, weight: 40 },
    tabby:    { id: "tabby",    sprite: "cat_tabby",    name: "Gatto Tigrato",   hpMult: 0.85, speedMult: 0.75, damage: 3, size: 16, xp: 3, weight: 35 },
    hunter:   { id: "hunter",   sprite: "cat_hunter",   name: "Cacciatore",      hpMult: 0.7,  speedMult: 0.95, damage: 3, size: 17, xp: 4, weight: 22 },
    archer:   { id: "archer",   sprite: "cat_archer",   name: "Gatto Arcere",    hpMult: 0.65, speedMult: 0.6,  damage: 2, size: 16, xp: 5, weight: 18, ranged: true, preferDist: 220, shootCd: 95, arrowDamage: 4, arrowSpeed: 4.6 },
    werewolf: { id: "werewolf", sprite: "cat_werewolf", name: "Gatto Mannaro",   hpMult: 1.4,  speedMult: 0.68, damage: 5, size: 20, xp: 7, weight: 18 },
    shadow:   { id: "shadow",   sprite: "cat_shadow",   name: "Ombra Felina",    hpMult: 0.45, speedMult: 1.1,  damage: 4, size: 15, xp: 5, weight: 12 },
  };

  const STATE = {
    TITLE: "title",
    STORY: "story",
    SELECT: "select",
    LEVEL_INTRO: "level_intro",
    PLAYING: "playing",
    LEVEL_UP: "level_up",
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
      desc: "Shuriken verso il cursore del mouse",
      weapon: "orbit_shuriken",
      weaponName: "Shuriken Orbitale",
      speed: 2.1,
      hp: 120,
      baseDamage: 18,
      baseCooldown: 68,
      baseArea: 1,
      baseAmount: 2,
    },
    {
      id: "zara",
      name: "Zara",
      color: "#9b30ff",
      accent: "#39ff14",
      emoji: "⚔️",
      desc: "Arco laser verso il cursore",
      weapon: "laser_arc",
      weaponName: "Spada Laser",
      speed: 1.8,
      hp: 130,
      baseDamage: 22,
      baseCooldown: 60,
      baseArea: 1.1,
      baseAmount: 1,
    },
    {
      id: "vex",
      name: "Vex",
      color: "#708090",
      accent: "#ffd700",
      emoji: "🛡️",
      desc: "Sfere di plasma verso il cursore",
      weapon: "plasma_burst",
      weaponName: "Burst di Plasma",
      speed: 1.5,
      hp: 190,
      baseDamage: 26,
      baseCooldown: 88,
      baseArea: 1.2,
      baseAmount: 1,
    },
    {
      id: "nia",
      name: "Nia",
      color: "#c0c0c0",
      accent: "#ff69b4",
      emoji: "🎯",
      desc: "Dardi semi-automatici: mira soft verso i nemici vicini",
      weapon: "homing_dart",
      weaponName: "Dardi Cercatori",
      speed: 2.3,
      hp: 100,
      baseDamage: 14,
      baseCooldown: 52,
      baseArea: 1,
      baseAmount: 1,
    },
    {
      id: "ryn",
      name: "Ryn",
      color: "#00f5ff",
      accent: "#ffd700",
      emoji: "✨",
      desc: "Onda arcana verso il cursore",
      weapon: "arcane_wave",
      weaponName: "Onda Arcana",
      speed: 1.7,
      hp: 110,
      baseDamage: 17,
      baseCooldown: 78,
      baseArea: 1.1,
      baseAmount: 1,
    },
  ];

  const POWERUP_POOL = [
    { id: "potenza", name: "Potenza", desc: "Danno +15%", max: 5, icon: "💥", category: "offense" },
    { id: "celerita", name: "Celerità", desc: "Attacco +12% veloce", max: 5, icon: "⚡", category: "offense" },
    { id: "quantita", name: "Quantità", desc: "+1 proiettile/colpo", max: 4, icon: "🔢", category: "offense" },
    { id: "area", name: "Area", desc: "Raggio attacco +18%", max: 4, icon: "🌀", category: "offense" },
    { id: "velocita", name: "Agilità", desc: "Movimento +10%", max: 4, icon: "💨", category: "utility" },
    { id: "cuore", name: "Cuore Alieno", desc: "HP massimi +30", max: 5, icon: "💚", category: "defense" },
    { id: "magnete", name: "Magnete XP", desc: "Raggio raccolta +40%", max: 3, icon: "🧲", category: "utility" },
    { id: "rigenerazione", name: "Rigenerazione", desc: "+0.35 HP/sec", max: 3, icon: "♻️", category: "defense" },
    { id: "scudo", name: "Scudo Ninja", desc: "Riduce danni subiti del 8%", max: 3, icon: "🛡️", category: "defense" },
  ];

  const WEAPON_UPGRADES = {
    orbit_shuriken: { name: "Shuriken Affilati", desc: "Orbitanti +1, danno +12%" },
    laser_arc: { name: "Spada Estesa", desc: "Arco più ampio, danno +15%" },
    plasma_burst: { name: "Plasma Concentrato", desc: "Esplosione più grande, danno +20%" },
    homing_dart: { name: "Dardi Migliorati", desc: "+1 dardo, raggio acquisizione +15%" },
    arcane_wave: { name: "Onda Potenziata", desc: "Onde +1, raggio +15%" },
  };

  const LEVELS = [
    {
      name: "Addestramento",
      theme: "training",
      story: "Campo olografico. Elimina 20 simulacri, poi il Simulacro Alfa.",
      bg: ["#0d1b2a", "#1b263b"],
      floor: "#152238",
      accent: "#00f5ff",
      killQuota: 20,
      spawnRate: 69,
      enemyHp: 12,
      enemySpeed: 0.65,
      boss: { name: "Simulacro Alfa", hp: 520, speed: 0.88, size: 34, color: "#00f5ff", sprite: "cat_boss", damage: 7 },
      fragment: false,
    },
    {
      name: "Città Alienigena",
      theme: "alien_city",
      story: "Neon e grattacieli. Uccidi 28 predatori, poi il Capo Distretto.",
      bg: ["#1a0a2e", "#2d1b4e"],
      floor: "#1e1040",
      accent: "#b026ff",
      killQuota: 28,
      spawnRate: 63,
      enemyHp: 15,
      enemySpeed: 0.74,
      boss: { name: "Capo Distretto Neon", hp: 720, speed: 0.92, size: 36, color: "#b026ff", sprite: "cat_boss", damage: 8 },
      fragment: false,
    },
    {
      name: "Bosco Infestato",
      theme: "forest",
      story: "Bosco bioluminescente. Abbatti 36 predatori, poi il Signore del Bosco.",
      bg: ["#0a1f0a", "#1a3a1a"],
      floor: "#0f2a12",
      accent: "#39ff14",
      killQuota: 36,
      spawnRate: 59,
      enemyHp: 18,
      enemySpeed: 0.8,
      boss: { name: "Signore del Bosco", hp: 920, speed: 0.9, size: 36, color: "#39ff14", sprite: "cat_boss", damage: 9 },
      fragment: false,
    },
    {
      name: "Tempio Antico",
      theme: "temple",
      story: "Pilastri e torce. Uccidi 44 gatti, poi il Custode.",
      bg: ["#2a1a0a", "#4a3020"],
      floor: "#3a2818",
      accent: "#ffd700",
      killQuota: 44,
      spawnRate: 55,
      enemyHp: 21,
      enemySpeed: 0.86,
      boss: { name: "Custode delle Stelle", hp: 1150, speed: 0.88, size: 38, color: "#ffd700", sprite: "cat_boss", damage: 10 },
      fragment: true,
    },
    {
      name: "Sottomondo Felino",
      theme: "underworld",
      story: "Gallerie laviche. Elimina 52 nemici e la Matrona.",
      bg: ["#1a0a0a", "#3a1515"],
      floor: "#2a1010",
      accent: "#ff4466",
      killQuota: 52,
      spawnRate: 53,
      enemyHp: 24,
      enemySpeed: 0.92,
      boss: { name: "Matrona degli Arcani", hp: 1450, speed: 0.94, size: 36, color: "#ff4466", sprite: "cat_boss", damage: 10 },
      fragment: true,
    },
    {
      name: "Tempio delle Stelle",
      theme: "star_temple",
      story: "Portali dimensionali. Uccidi 60 gatti, poi il Guardiano.",
      bg: ["#0a0a2a", "#1a1a5a"],
      floor: "#12124a",
      accent: "#7b68ee",
      killQuota: 60,
      spawnRate: 50,
      enemyHp: 27,
      enemySpeed: 0.98,
      boss: { name: "Guardiano Dimensionale", hp: 1800, speed: 0.98, size: 40, color: "#7b68ee", sprite: "cat_boss", damage: 11 },
      fragment: true,
    },
    {
      name: "Battaglia sulla Luna",
      theme: "moon",
      story: "Crateri e stelle. Elimina 70 predatori, poi il Drago.",
      bg: ["#1a1a2a", "#2a2a4a"],
      floor: "#3a3a4a",
      accent: "#ff6347",
      killQuota: 70,
      spawnRate: 47,
      enemyHp: 30,
      enemySpeed: 1.02,
      boss: { name: "Drago Stellare", hp: 2200, speed: 0.85, size: 44, color: "#ff6347", sprite: "cat_boss", damage: 12 },
      fragment: true,
    },
    {
      name: "Città Maledetta",
      theme: "cursed_city",
      story: "Rovine e nebbia. Uccidi 80 gatti e il Signore del Caos.",
      bg: ["#1a0a1a", "#3a1a3a"],
      floor: "#2a1530",
      accent: "#9400d3",
      killQuota: 80,
      spawnRate: 45,
      enemyHp: 33,
      enemySpeed: 1.06,
      boss: { name: "Signore del Caos", hp: 2650, speed: 1.0, size: 42, color: "#9400d3", sprite: "cat_boss", damage: 13 },
      fragment: true,
    },
    {
      name: "Rifugio delle Stelle",
      theme: "star_refuge",
      story: "Cristalli cosmici. Elimina 90 nemici e la Matriarca.",
      bg: ["#0a1a2a", "#1a3a5a"],
      floor: "#102840",
      accent: "#ff8c00",
      killQuota: 90,
      spawnRate: 43,
      enemyHp: 36,
      enemySpeed: 1.1,
      boss: { name: "Matriarca del Mondo Felino", hp: 3100, speed: 1.05, size: 40, color: "#ff8c00", sprite: "cat_boss", damage: 14 },
      fragment: true,
    },
    {
      name: "Confronto Finale",
      theme: "final",
      story: "La Luna. Uccidi 100 gatti, poi il Re e il Guardiano.",
      bg: ["#0a0a1a", "#1a0a2a"],
      floor: "#2a2a35",
      accent: "#ff2200",
      killQuota: 100,
      spawnRate: 41,
      enemyHp: 40,
      enemySpeed: 1.14,
      boss: { name: "Re dei Gatti Mannari", hp: 3800, speed: 1.0, size: 46, color: "#ff2200", sprite: "cat_boss", damage: 15 },
      finalBoss: { name: "Guardiano dell'Universo", hp: 2800, speed: 1.1, size: 42, color: "#00f5ff", sprite: "cat_boss", damage: 14 },
      fragment: true,
    },
  ];

  const keys = {};
  let mouse = { screenX: W / 2, screenY: H / 2, worldX: WORLD_W / 2, worldY: WORLD_H / 2 };
  let state = STATE.TITLE;
  let selectedHero = null;
  let currentLevel = 0;
  let fragments = 0;
  let introTimer = 0;
  let titlePulse = 0;
  let levelUpChoices = [];
  let levelUpSelected = 0;

  let player = null;
  let enemies = [];
  let projectiles = [];
  let enemyShots = [];
  let particles = [];
  let xpGems = [];
  let pickups = [];
  let waves = [];
  let orbiters = [];
  let decor = [];
  let ambience = [];
  let spawnTimer = 0;
  let pickupTimer = 0;
  let bossSpawned = false;
  let finalBossSpawned = false;
  let bossPhase = false;
  let kills = 0;
  let levelKills = 0;
  let camera = { x: 0, y: 0 };
  let lastMenuTap = 0;
  let gameTime = 0;
  let shake = { x: 0, y: 0 };
  let floatTexts = [];
  let shockwaves = [];
  let levelBanner = null;
  let worldShift = 0;

  function addScreenShake(power) {
    shake.x += (Math.random() - 0.5) * power;
    shake.y += (Math.random() - 0.5) * power;
  }

  function updateShake() {
    shake.x *= 0.8;
    shake.y *= 0.8;
  }

  function addFloatText(x, y, text, color = "#fff", size = 13) {
    floatTexts.push({ x, y, text, color, size, life: 42, vy: -1.4 });
  }

  function addShockwave(x, y, color, maxR = 48) {
    shockwaves.push({ x, y, r: 6, maxR, color, life: 24 });
  }

  function addBurst(x, y, color, count = 10, kind = "spark") {
    for (let i = 0; i < count; i++) {
      const a = Math.random() * Math.PI * 2;
      const s = 1.5 + Math.random() * (kind === "smoke" ? 2.5 : 4.5);
      const life = 18 + Math.random() * (kind === "smoke" ? 30 : 20);
      particles.push({
        x, y,
        vx: Math.cos(a) * s,
        vy: Math.sin(a) * s,
        life,
        maxLife: life,
        color,
        size: kind === "smoke" ? 3 + Math.random() * 5 : 2 + Math.random() * 3,
        kind,
        gravity: kind === "smoke" ? -0.015 : 0.05,
      });
    }
  }

  function hurtEnemy(e, dmg, hitColor = "#ffcc88") {
    if (dmg <= 0) return;
    e.hp -= dmg;
    e.hitFlash = 12;
    const len = Math.hypot(e.x - player.x, e.y - player.y) || 1;
    e.knockVx = (e.x - player.x) / len * 3;
    e.knockVy = (e.y - player.y) / len * 3;
    addBurst(e.x, e.y, hitColor, 3 + Math.floor(dmg / 6), "spark");
    if (dmg >= 6 && Math.random() < 0.28) {
      addFloatText(e.x, e.y - e.size - 4, String(Math.round(dmg)), "#ffe8c8", 12);
    }
  }

  function drawEntityShadow(x, y, radius) {
    ctx.fillStyle = "rgba(0,0,0,0.35)";
    ctx.beginPath();
    ctx.ellipse(x, y + radius * 0.55, radius * 1.1, radius * 0.45, 0, 0, Math.PI * 2);
    ctx.fill();
  }

  const MENU_STATES = new Set([
    STATE.TITLE, STATE.STORY, STATE.SELECT, STATE.LEVEL_INTRO,
    STATE.LEVEL_UP, STATE.LEVEL_CLEAR, STATE.GAME_OVER, STATE.VICTORY,
  ]);

  function isMenuState() {
    return MENU_STATES.has(state);
  }

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
    const sx = W / rect.width;
    const sy = H / rect.height;
    mouse.screenX = (e.clientX - rect.left) * sx;
    mouse.screenY = (e.clientY - rect.top) * sy;
  });

  const moveJoy = { active: false, id: null, ox: 0, oy: 0, x: 0, y: 0 };
  const aimJoy = { active: false, id: null, ox: 0, oy: 0, x: 0, y: 0 };
  const JOY_MAX_R = 50;
  const JOY_DEAD_ZONE = 10;
  const isTouchDevice = "ontouchstart" in window || navigator.maxTouchPoints > 0;
  const touchJoyAnchors = {
    move: { x: W * 0.16, y: H * 0.82 },
    aim: { x: W * 0.84, y: H * 0.82 },
  };

  function resizeGame() {
    // Viewport grande: quasi tutto lo schermo, così si vede più mondo
    const vw = Math.max(960, window.innerWidth || 1600);
    const vh = Math.max(540, window.innerHeight || 900);
    W = Math.floor(vw);
    H = Math.floor(vh);
    canvas.width = W;
    canvas.height = H;
    touchJoyAnchors.move.x = W * 0.16;
    touchJoyAnchors.move.y = H * 0.82;
    touchJoyAnchors.aim.x = W * 0.84;
    touchJoyAnchors.aim.y = H * 0.82;
    if (mouse) {
      mouse.screenX = Math.min(mouse.screenX, W);
      mouse.screenY = Math.min(mouse.screenY, H);
    }
    if (player && state === STATE.PLAYING) {
      camera.x = Math.max(0, Math.min(WORLD_W - W, player.x - W / 2));
      camera.y = Math.max(0, Math.min(WORLD_H - H, player.y - H / 2));
    }
  }

  window.addEventListener("resize", resizeGame);
  window.addEventListener("orientationchange", () => setTimeout(resizeGame, 80));
  resizeGame();

  function canvasCoords(touch) {
    const rect = canvas.getBoundingClientRect();
    const sx = W / rect.width;
    const sy = H / rect.height;
    return {
      x: (touch.clientX - rect.left) * sx,
      y: (touch.clientY - rect.top) * sy,
    };
  }

  function setTouchKeys() {
    keys.KeyW = keys.KeyA = keys.KeyS = keys.KeyD = false;
    if (!moveJoy.active) return;
    const dx = moveJoy.x - moveJoy.ox;
    const dy = moveJoy.y - moveJoy.oy;
    const t = 14;
    if (dy < -t) keys.KeyW = true;
    if (dy > t) keys.KeyS = true;
    if (dx < -t) keys.KeyA = true;
    if (dx > t) keys.KeyD = true;
  }

  function isMoveJoyZone(x, y) {
    return x < W * 0.42 && y > H * 0.45;
  }

  function isAimJoyZone(x, y) {
    return x > W * 0.58 && y > H * 0.45;
  }

  function activateJoy(joy, touch, anchor) {
    joy.active = true;
    joy.id = touch.identifier;
    joy.ox = anchor.x;
    joy.oy = anchor.y;
    joy.x = anchor.x;
    joy.y = anchor.y;
  }

  function releaseJoy(joy, touchId) {
    if (joy.active && joy.id === touchId) {
      joy.active = false;
      joy.id = null;
    }
  }

  canvas.addEventListener("touchstart", (e) => {
    e.preventDefault();
    for (const t of e.changedTouches) {
      const c = canvasCoords(t);

      if (isMenuState()) {
        handleMenuTap(c.x, c.y);
        continue;
      }

      if (isMoveJoyZone(c.x, c.y) && !moveJoy.active) {
        activateJoy(moveJoy, t, touchJoyAnchors.move);
      } else if (isAimJoyZone(c.x, c.y) && !aimJoy.active) {
        activateJoy(aimJoy, t, touchJoyAnchors.aim);
      } else if (!moveJoy.active && !aimJoy.active) {
        mouse.screenX = c.x;
        mouse.screenY = c.y;
      }
    }
  }, { passive: false });

  canvas.addEventListener("click", (e) => {
    if (!isMenuState()) return;
    const rect = canvas.getBoundingClientRect();
    const sx = W / rect.width;
    const sy = H / rect.height;
    handleMenuTap((e.clientX - rect.left) * sx, (e.clientY - rect.top) * sy);
  });

  canvas.addEventListener("touchmove", (e) => {
    e.preventDefault();
    for (const t of e.changedTouches) {
      const c = canvasCoords(t);
      if (moveJoy.active && t.identifier === moveJoy.id) {
        moveJoy.x = c.x;
        moveJoy.y = c.y;
      } else if (aimJoy.active && t.identifier === aimJoy.id) {
        aimJoy.x = c.x;
        aimJoy.y = c.y;
      } else if (!aimJoy.active) {
        mouse.screenX = c.x;
        mouse.screenY = c.y;
      }
    }
  }, { passive: false });

  canvas.addEventListener("touchend", (e) => {
    for (const t of e.changedTouches) {
      releaseJoy(moveJoy, t.identifier);
      releaseJoy(aimJoy, t.identifier);
    }
  });

  canvas.addEventListener("touchcancel", (e) => {
    for (const t of e.changedTouches) {
      releaseJoy(moveJoy, t.identifier);
      releaseJoy(aimJoy, t.identifier);
    }
  });

  function updateMouseWorld() {
    mouse.worldX = mouse.screenX + camera.x;
    mouse.worldY = mouse.screenY + camera.y;
  }

  function getAimAngle() {
    if (aimJoy.active) {
      const dx = aimJoy.x - aimJoy.ox;
      const dy = aimJoy.y - aimJoy.oy;
      if (Math.hypot(dx, dy) > JOY_DEAD_ZONE) {
        return Math.atan2(dy, dx);
      }
      return player.aimAngle;
    }
    return Math.atan2(mouse.worldY - player.y, mouse.worldX - player.x);
  }

  function handleInput(code) {
    if (state === STATE.LEVEL_UP) {
      if (code === "ArrowUp" || code === "KeyW") levelUpSelected = (levelUpSelected + 2) % 3;
      if (code === "ArrowDown" || code === "KeyS") levelUpSelected = (levelUpSelected + 1) % 3;
      if (code === "Enter" || code === "Space" || code.startsWith("Digit")) {
        const idx = code.startsWith("Digit") ? parseInt(code.replace("Digit", ""), 10) - 1 : levelUpSelected;
        if (idx >= 0 && idx < levelUpChoices.length) applyPowerUp(levelUpChoices[idx]);
      }
      return;
    }

    if (code === "Enter" || code === "Space") {
      handleMenuConfirm();
    }
    if (state === STATE.SELECT && code.startsWith("Digit")) {
      const idx = parseInt(code.replace("Digit", ""), 10) - 1;
      if (idx >= 0 && idx < HEROES.length) selectHero(idx);
    }
  }

  function handleMenuConfirm() {
    if (state === STATE.TITLE) { state = STATE.STORY; return; }
    if (state === STATE.STORY) { state = STATE.SELECT; return; }
    if (state === STATE.LEVEL_INTRO && introTimer <= 0) { startLevel(); return; }
    if (state === STATE.LEVEL_CLEAR) { nextLevel(); return; }
    if (state === STATE.GAME_OVER || state === STATE.VICTORY) { resetGame(); return; }
    if (state === STATE.LEVEL_UP && levelUpChoices.length) {
      applyPowerUp(levelUpChoices[levelUpSelected]);
    }
  }

  function getHeroCardRect(i) {
    const col = i % 3;
    const row = Math.floor(i / 3);
    const cx = 200 + col * 340;
    const cy = 200 + row * 210;
    const cw = 290;
    const ch = 175;
    return { x: cx - cw / 2, y: cy - ch / 2, w: cw, h: ch };
  }

  function getLevelUpCardRect(i) {
    const y = 180 + i * 110;
    return { x: W / 2 - 280, y: y - 40, w: 560, h: 90 };
  }

  function pointInRect(px, py, r) {
    return px >= r.x && px <= r.x + r.w && py >= r.y && py <= r.y + r.h;
  }

  function handleMenuTap(x, y) {
    if (!isMenuState()) return;
    const now = Date.now();
    if (now - lastMenuTap < 400) return;
    lastMenuTap = now;

    if (state === STATE.LEVEL_UP) {
      for (let i = 0; i < levelUpChoices.length; i++) {
        if (pointInRect(x, y, getLevelUpCardRect(i))) {
          applyPowerUp(levelUpChoices[i]);
          return;
        }
      }
      handleMenuConfirm();
      return;
    }

    if (state === STATE.SELECT) {
      for (let i = 0; i < HEROES.length; i++) {
        if (pointInRect(x, y, getHeroCardRect(i))) {
          selectHero(i);
          return;
        }
      }
      return;
    }

    if (state === STATE.LEVEL_INTRO && introTimer > 0) return;
    handleMenuConfirm();
  }

  function createStats(hero) {
    return {
      damage: hero.baseDamage,
      cooldownMult: 1,
      area: hero.baseArea,
      amount: hero.baseAmount,
      speed: hero.speed,
      magnet: 90,
      regen: 0,
      weaponLevel: 1,
      damageReduction: 0,
    };
  }

  function getKillProgress() {
    const level = LEVELS[currentLevel];
    return Math.min(1, levelKills / level.killQuota);
  }

  function weightedPick(items) {
    const total = items.reduce((s, item) => s + (item.weight || 1), 0);
    let roll = Math.random() * total;
    for (const item of items) {
      roll -= item.weight || 1;
      if (roll <= 0) return item;
    }
    return items[items.length - 1];
  }

  function showLevelBanner(level) {
    levelBanner = {
      title: level.name,
      subtitle: `Settore ${currentLevel + 1} / ${LEVELS.length}`,
      life: 160,
      maxLife: 160,
      accent: level.accent,
    };
  }

  function advanceWorldContinuous() {
    if (currentLevel >= LEVELS.length - 1) {
      state = STATE.VICTORY;
      return;
    }

    currentLevel++;
    const level = LEVELS[currentLevel];
    levelKills = 0;
    bossSpawned = false;
    finalBossSpawned = false;
    bossPhase = false;
    decor = generateDecor(level.theme);
    ambience = generateAmbience(level.theme);
    worldShift = 1;
    player.invulnerable = Math.max(player.invulnerable, 40);
    spawnTimer = 8;
    showLevelBanner(level);
    for (let i = 0; i < 8; i++) spawnEnemy();
    addShockwave(player.x, player.y, level.accent, 110);
    addBurst(player.x, player.y, level.accent, 18, "spark");
    addScreenShake(8);
  }

  function selectHero(idx) {
    selectedHero = HEROES[idx];
    currentLevel = 0;
    fragments = 0;
    initLevel(true);
    state = STATE.PLAYING;
    showLevelBanner(LEVELS[0]);
  }

  function resetGame() {
    state = STATE.TITLE;
    selectedHero = null;
    currentLevel = 0;
    fragments = 0;
    player = null;
    enemies = [];
    projectiles = [];
    enemyShots = [];
    particles = [];
    xpGems = [];
    pickups = [];
    waves = [];
    orbiters = [];
    floatTexts = [];
    shockwaves = [];
    shake = { x: 0, y: 0 };
  }

  function initLevel(resetPlayer = false) {
    const level = LEVELS[currentLevel];
    const hero = selectedHero;

    if (resetPlayer || !player) {
      player = {
        x: WORLD_W / 2,
        y: WORLD_H / 2,
        hp: hero.hp,
        maxHp: hero.hp,
        angle: 0,
        aimAngle: 0,
        vx: 0,
        vy: 0,
        invulnerable: 0,
        weaponTimer: 0,
        hero,
        stats: createStats(hero),
        animPhase: 0,
        upgrades: {},
        xp: 0,
        level: 1,
        xpToNext: 8,
        tempBuff: 0,
        tempSpeed: 0,
      };
      camera.x = player.x - W / 2;
      camera.y = player.y - H / 2;
      enemies = [];
      projectiles = [];
      enemyShots = [];
      particles = [];
      floatTexts = [];
      shockwaves = [];
      shake = { x: 0, y: 0 };
      xpGems = [];
      pickups = [];
      waves = [];
      kills = 0;
    }

    orbiters = initOrbiters();
    decor = generateDecor(level.theme);
    ambience = generateAmbience(level.theme);
    spawnTimer = 8;
    pickupTimer = 600;
    bossSpawned = false;
    finalBossSpawned = false;
    bossPhase = false;
    levelKills = 0;
    for (let i = 0; i < 10; i++) spawnEnemy();
  }

  function startLevel() {
    state = STATE.PLAYING;
    showLevelBanner(LEVELS[currentLevel]);
    if (enemies.length < 8) {
      for (let i = 0; i < 10; i++) spawnEnemy();
    }
  }

  function nextLevel() {
    advanceWorldContinuous();
  }

  function initOrbiters() {
    if (selectedHero.weapon !== "orbit_shuriken") return [];
    const count = Math.floor(player.stats.amount);
    return Array.from({ length: count }, (_, i) => ({
      angle: (Math.PI * 2 * i) / count,
      dist: 45 * player.stats.area,
    }));
  }

  function generateDecor(theme) {
    const items = [];
    const rnd = (n) => Math.random() * n;
    const at = () => ({ x: rnd(WORLD_W), y: rnd(WORLD_H) });
    const count = {
      training: 380, alien_city: 360, forest: 480, temple: 340, underworld: 380,
      star_temple: 360, moon: 400, cursed_city: 370, star_refuge: 390, final: 360,
    };
    const n = count[theme] || 80;

    // micro-props di riempimento per ogni tema
    const scatter = (type, every, extra = {}) => {
      for (let i = 0; i < n; i++) {
        if (i % every === 0) items.push({ type, ...at(), ...extra });
      }
    };

    switch (theme) {
      case "training":
        for (let i = 0; i < n; i++) {
          items.push({ type: "holo_ring", ...at(), r: 12 + rnd(28) });
          if (i % 3 === 0) items.push({ type: "target_marker", ...at(), r: 8 + rnd(14) });
          if (i % 5 === 0) items.push({ type: "crate", ...at() });
          if (i % 7 === 0) items.push({ type: "lamp", ...at() });
          if (i % 4 === 0) items.push({ type: "debris", ...at() });
        }
        break;
      case "alien_city":
        for (let i = 0; i < n; i++) {
          const windows = [];
          for (let wy = 0; wy < 6; wy++) for (let wx = 0; wx < 4; wx++) windows.push(Math.random() > 0.35);
          items.push({ type: "building", ...at(), w: 50 + rnd(70), h: 80 + rnd(120), windows });
          if (i % 4 === 0) items.push({ type: "neon_sign", ...at(), w: 30 + rnd(40) });
          if (i % 5 === 0) items.push({ type: "lamp", ...at() });
          if (i % 6 === 0) items.push({ type: "crate", ...at() });
          if (i % 8 === 0) items.push({ type: "barrel", ...at() });
        }
        break;
      case "forest":
        for (let i = 0; i < n; i++) {
          items.push({ type: "tree", ...at(), r: 18 + rnd(34), variant: Math.floor(rnd(3)) });
          if (i % 2 === 0) items.push({ type: "grass", ...at() });
          if (i % 3 === 0) items.push({ type: "bush", ...at() });
          if (i % 4 === 0) items.push({ type: "mushroom", ...at(), r: 6 + rnd(10) });
          if (i % 5 === 0) items.push({ type: "flower", ...at() });
          if (i % 6 === 0) items.push({ type: "vine", ...at(), h: 20 + rnd(40) });
          if (i % 8 === 0) items.push({ type: "fern", ...at() });
        }
        break;
      case "temple":
        for (let i = 0; i < n; i++) {
          items.push({ type: "pillar", ...at(), h: 80 + rnd(120) });
          if (i % 3 === 0) items.push({ type: "torch", ...at() });
          if (i % 4 === 0) items.push({ type: "rune", ...at(), r: 10 + rnd(18) });
          if (i % 5 === 0) items.push({ type: "statue", ...at() });
          if (i % 6 === 0) items.push({ type: "debris", ...at() });
          if (i % 7 === 0) items.push({ type: "crate", ...at() });
        }
        break;
      case "underworld":
        for (let i = 0; i < n; i++) {
          items.push({ type: "stalactite", x: rnd(WORLD_W), y: rnd(WORLD_H * 0.4), h: 25 + rnd(55) });
          if (i % 2 === 0) items.push({ type: "lava_pool", ...at(), r: 12 + rnd(24) });
          if (i % 3 === 0) items.push({ type: "bones", ...at() });
          if (i % 4 === 0) items.push({ type: "debris", ...at() });
          if (i % 6 === 0) items.push({ type: "barrel", ...at() });
        }
        break;
      case "star_temple":
        for (let i = 0; i < n; i++) {
          items.push({ type: "rune", ...at(), r: 10 + rnd(18) });
          if (i % 3 === 0) items.push({ type: "portal", ...at(), r: 16 + rnd(20) });
          if (i % 4 === 0) items.push({ type: "statue", ...at() });
          if (i % 5 === 0) items.push({ type: "crystal", ...at(), h: 14 + rnd(30) });
          if (i % 6 === 0) items.push({ type: "lamp", ...at() });
        }
        break;
      case "moon":
        for (let i = 0; i < n; i++) {
          items.push({ type: "crater", ...at(), r: 12 + rnd(40) });
          if (i % 3 === 0) items.push({ type: "moon_rock", ...at(), r: 10 + rnd(28) });
          if (i % 4 === 0) items.push({ type: "moon_flag", ...at() });
          if (i % 5 === 0) items.push({ type: "debris", ...at() });
          if (i % 7 === 0) items.push({ type: "crate", ...at() });
        }
        break;
      case "cursed_city":
        for (let i = 0; i < n; i++) {
          items.push({ type: "ruin", ...at(), w: 25 + rnd(65), h: 18 + rnd(55) });
          if (i % 3 === 0) items.push({ type: "fog_patch", ...at(), r: 20 + rnd(35) });
          if (i % 4 === 0) items.push({ type: "bones", ...at() });
          if (i % 5 === 0) items.push({ type: "barrel", ...at() });
          if (i % 6 === 0) items.push({ type: "lamp", ...at() });
          if (i % 7 === 0) items.push({ type: "debris", ...at() });
        }
        break;
      case "star_refuge":
        for (let i = 0; i < n; i++) {
          items.push({ type: "crystal", ...at(), h: 18 + rnd(50) });
          if (i % 2 === 0) items.push({ type: "flower", ...at() });
          if (i % 3 === 0) items.push({ type: "star_altar", ...at(), r: 14 + rnd(18) });
          if (i % 4 === 0) items.push({ type: "grass", ...at() });
          if (i % 5 === 0) items.push({ type: "bush", ...at() });
          if (i % 6 === 0) items.push({ type: "lamp", ...at() });
        }
        break;
      case "final":
        for (let i = 0; i < n; i++) {
          items.push({ type: "moon_rock", ...at(), r: 12 + rnd(35) });
          if (i % 3 === 0) items.push({ type: "lunar_spire", ...at(), h: 40 + rnd(70) });
          if (i % 4 === 0) items.push({ type: "bones", ...at() });
          if (i % 5 === 0) items.push({ type: "crater", ...at(), r: 14 + rnd(30) });
          if (i % 6 === 0) items.push({ type: "debris", ...at() });
          if (i % 7 === 0) items.push({ type: "statue", ...at() });
        }
        break;
    }
    scatter("debris", 11);
    return items;
  }

  function generateAmbience(theme) {
    const items = [];
    const colors = {
      training: "#00f5ff", alien_city: "#b026ff", forest: "#39ff14", temple: "#ffd700",
      underworld: "#ff4466", star_temple: "#7b68ee", moon: "#c0c0ff", cursed_city: "#9400d3",
      star_refuge: "#ff8c00", final: "#ff2200",
    };
    const color = colors[theme] || "#ffffff";
    for (let i = 0; i < 90; i++) {
      items.push({
        x: Math.random() * WORLD_W,
        y: Math.random() * WORLD_H,
        vx: (Math.random() - 0.5) * 0.35,
        vy: (Math.random() - 0.5) * 0.35,
        r: 1 + Math.random() * 2.5,
        phase: Math.random() * Math.PI * 2,
        color,
      });
    }
    return items;
  }

  function updateAmbience() {
    ambience.forEach((a) => {
      a.x += a.vx;
      a.y += a.vy;
      a.phase += 0.04;
      if (a.x < 0) a.x = WORLD_W;
      if (a.x > WORLD_W) a.x = 0;
      if (a.y < 0) a.y = WORLD_H;
      if (a.y > WORLD_H) a.y = 0;
    });
  }

  function updateCamera() {
    const tx = player.x - W / 2;
    const ty = player.y - H / 2;
    camera.x += (tx - camera.x) * 0.11;
    camera.y += (ty - camera.y) * 0.11;
    camera.x = Math.max(0, Math.min(WORLD_W - W, camera.x));
    camera.y = Math.max(0, Math.min(WORLD_H - H, camera.y));
    updateShake();
  }

  function isOnScreen(wx, wy, margin = 80) {
    return wx > camera.x - margin && wx < camera.x + W + margin &&
           wy > camera.y - margin && wy < camera.y + H + margin;
  }

  function getCooldown() {
    return Math.max(12, Math.floor(player.hero.baseCooldown * player.stats.cooldownMult));
  }

  function getDamage(mult = 1) {
    const buff = player.tempBuff > 0 ? 1.4 : 1;
    return player.stats.damage * mult * buff * (1 + (player.stats.weaponLevel - 1) * 0.12);
  }

  function nearestEnemy(maxDist = Infinity) {
    let best = null;
    let bestDist = Infinity;
    enemies.forEach((e) => {
      const d = Math.hypot(e.x - player.x, e.y - player.y);
      if (d < bestDist && d <= maxDist) { bestDist = d; best = e; }
    });
    return best;
  }

  function nearestEnemies(count, maxDist = Infinity) {
    return [...enemies]
      .map((e) => ({ e, d: Math.hypot(e.x - player.x, e.y - player.y) }))
      .filter((x) => x.d <= maxDist)
      .sort((a, b) => a.d - b.d)
      .slice(0, count)
      .map((x) => x.e);
  }

  function pickEnemyType() {
    const progress = getKillProgress();
    const pool = [];

    const add = (id, w) => {
      const t = ENEMY_TYPES[id];
      if (t) pool.push({ type: t, weight: w });
    };

    if (progress < 0.2) {
      add("kitten", 55); add("tabby", 45);
    } else if (progress < 0.4) {
      add("kitten", 25); add("tabby", 35); add("hunter", 20); add("archer", 20);
    } else if (progress < 0.65) {
      add("tabby", 20); add("hunter", 22); add("archer", 28); add("werewolf", 18); add("shadow", 12);
    } else if (progress < 0.85) {
      add("hunter", 18); add("archer", 30); add("werewolf", 28); add("shadow", 24);
    } else {
      add("archer", 28); add("werewolf", 30); add("shadow", 27); add("hunter", 15);
    }

    const total = pool.reduce((s, p) => s + p.weight, 0);
    let roll = Math.random() * total;
    for (const p of pool) {
      roll -= p.weight;
      if (roll <= 0) return p.type;
    }
    return ENEMY_TYPES.tabby;
  }

  function autoAttack() {
    const weapon = player.hero.weapon;
    const amount = Math.floor(player.stats.amount);
    const area = player.stats.area;
    const aim = player.aimAngle;
    const projSpeed = 5.5;

    switch (weapon) {
      case "orbit_shuriken": {
        for (let i = 0; i < amount; i++) {
          const spread = (i - (amount - 1) / 2) * 0.12;
          const angle = aim + spread;
          projectiles.push({
            x: player.x, y: player.y,
            vx: Math.cos(angle) * projSpeed,
            vy: Math.sin(angle) * projSpeed,
            damage: getDamage(),
            type: "shuriken",
            life: 70,
            piercing: false,
          });
        }
        orbiters = initOrbiters();
        break;
      }
      case "laser_arc": {
        const arc = Math.PI * 0.5 * area;
        enemies.forEach((e) => {
          const angle = Math.atan2(e.y - player.y, e.x - player.x);
          let diff = angle - aim;
          while (diff > Math.PI) diff -= Math.PI * 2;
          while (diff < -Math.PI) diff += Math.PI * 2;
          if (Math.abs(diff) < arc / 2 && Math.hypot(e.x - player.x, e.y - player.y) < 140 * area) {
            hurtEnemy(e, getDamage(1.2), "#39ff14");
          }
        });
        projectiles.push({ type: "arc_slash", x: player.x, y: player.y, angle: aim, arc, range: 140 * area, life: 14, damage: 0 });
        break;
      }
      case "plasma_burst": {
        for (let i = 0; i < amount; i++) {
          const spread = (i - (amount - 1) / 2) * 0.18;
          const angle = aim + spread;
          projectiles.push({
            x: player.x, y: player.y,
            vx: Math.cos(angle) * (projSpeed - 1),
            vy: Math.sin(angle) * (projSpeed - 1),
            damage: getDamage(1.4),
            type: "plasma",
            life: 55,
            size: 8 + area * 2,
            piercing: true,
            hit: new Set(),
          });
        }
        addParticles(player.x, player.y, "#ffd700", 8);
        break;
      }
      case "homing_dart": {
        const acquireRange = 280 * area;
        const targets = nearestEnemies(amount, acquireRange);
        for (let i = 0; i < amount; i++) {
          const spread = (i - (amount - 1) / 2) * 0.14;
          const angle = aim + spread;
          const target = targets[i] || targets[0] || null;
          projectiles.push({
            x: player.x, y: player.y,
            vx: Math.cos(angle) * (projSpeed - 0.5),
            vy: Math.sin(angle) * (projSpeed - 0.5),
            damage: getDamage(0.95),
            type: "dart",
            life: 58,
            size: 4,
            piercing: false,
            homing: !!target,
            target,
            turnRate: 0.11,
            homingSpeed: 4.6,
          });
        }
        break;
      }
      case "arcane_wave": {
        for (let i = 0; i < amount; i++) {
          const spread = (i - (amount - 1) / 2) * 0.2;
          const angle = aim + spread;
          projectiles.push({
            x: player.x, y: player.y,
            vx: Math.cos(angle) * 2.8,
            vy: Math.sin(angle) * 2.8,
            damage: getDamage(1.0),
            type: "arcane_orb",
            life: 75,
            expand: 2.1 * area,
            maxR: 46 * area,
            r: 8,
            hit: new Set(),
          });
        }
        break;
      }
    }
  }

  function updateOrbiters() {
    if (player.hero.weapon !== "orbit_shuriken") return;
    orbiters.forEach((o) => {
      o.angle += 0.035;
      const ox = player.x + Math.cos(o.angle) * o.dist;
      const oy = player.y + Math.sin(o.angle) * o.dist;
      if (!o.hitCd) o.hitCd = new Map();
      enemies.forEach((e) => {
        const key = e;
        const cd = o.hitCd.get(key) || 0;
        if (cd > 0) {
          o.hitCd.set(key, cd - 1);
          return;
        }
        if (Math.hypot(e.x - ox, e.y - oy) < e.size + 8) {
          hurtEnemy(e, getDamage(0.28), player.hero.accent);
          o.hitCd.set(key, 14);
        }
      });
    });
  }

  function spawnEnemy(isBoss = false, bossData = null, opts = {}) {
    const level = LEVELS[currentLevel];

    if (isBoss && bossData) {
      enemies.push({
        x: player.x,
        y: Math.max(80, player.y - 220),
        hp: bossData.hp, maxHp: bossData.hp,
        speed: bossData.speed, size: bossData.size,
        color: bossData.color, isBoss: true, name: bossData.name,
        sprite: bossData.sprite || "cat_boss",
        damage: bossData.damage || 12,
        wobblePhase: 0,
        hitFlash: 0,
        knockVx: 0,
        knockVy: 0,
      });
      addShockwave(player.x, player.y - 220, bossData.color, 120);
      addScreenShake(14);
      addParticles(player.x, player.y - 220, bossData.color, 25);
      bossPhase = true;
      spawnTimer = 0;
      for (let i = 0; i < 12; i++) spawnEnemy(false, null, { near: true });
      return;
    }

    const angle = Math.random() * Math.PI * 2;
    const dist = opts.near
      ? 200 + Math.random() * 260
      : Math.max(W, H) * 0.42 + 40 + Math.random() * 160;
    let x = player.x + Math.cos(angle) * dist;
    let y = player.y + Math.sin(angle) * dist;
    x = Math.max(50, Math.min(WORLD_W - 50, x));
    y = Math.max(50, Math.min(WORLD_H - 50, y));

    const etype = pickEnemyType();
    const scale = bossPhase ? 1.05 : 1 + getKillProgress() * 0.18;
    enemies.push({
      x, y,
      hp: Math.floor(level.enemyHp * etype.hpMult * scale),
      maxHp: Math.floor(level.enemyHp * etype.hpMult * scale),
      speed: level.enemySpeed * etype.speedMult * (0.95 + Math.random() * 0.16),
      size: etype.size,
      color: etype.id === "archer" ? "#c8a060" : "#cc8844",
      isBoss: false,
      typeId: etype.id,
      typeName: etype.name,
      sprite: etype.sprite,
      damage: etype.damage,
      xp: etype.xp,
      ranged: !!etype.ranged,
      preferDist: etype.preferDist || 0,
      shootCd: etype.shootCd || 0,
      shootTimer: etype.ranged ? 40 + Math.random() * 40 : 0,
      arrowDamage: etype.arrowDamage || 0,
      arrowSpeed: etype.arrowSpeed || 0,
      wobblePhase: Math.random() * Math.PI * 2,
      hitFlash: 0,
      knockVx: 0,
      knockVy: 0,
    });
  }

  function spawnPickup() {
    const types = ["heal", "damage", "speed", "magnet"];
    const type = types[Math.floor(Math.random() * types.length)];
    const angle = Math.random() * Math.PI * 2;
    const dist = 120 + Math.random() * 280;
    pickups.push({
      x: Math.max(60, Math.min(WORLD_W - 60, player.x + Math.cos(angle) * dist)),
      y: Math.max(60, Math.min(WORLD_H - 60, player.y + Math.sin(angle) * dist)),
      type,
      life: 600,
    });
  }

  function dropXp(x, y, amount) {
    xpGems.push({
      x, y, value: amount,
      vx: (Math.random() - 0.5) * 3,
      vy: (Math.random() - 0.5) * 3,
      phase: Math.random() * Math.PI * 2,
      spin: 0.08 + Math.random() * 0.06,
    });
  }

  function applyPowerUp(choice) {
    if (!choice) return;
    const up = player.upgrades;
    up[choice.id] = (up[choice.id] || 0) + 1;

    switch (choice.id) {
      case "potenza": player.stats.damage *= 1.15; break;
      case "celerita": player.stats.cooldownMult *= 0.88; break;
      case "quantita": player.stats.amount += 1; orbiters = initOrbiters(); break;
      case "area": player.stats.area *= 1.18; orbiters = initOrbiters(); break;
      case "velocita": player.stats.speed *= 1.1; break;
      case "cuore": player.maxHp += 30; player.hp = Math.min(player.hp + 30, player.maxHp); break;
      case "magnete": player.stats.magnet *= 1.4; break;
      case "rigenerazione": player.stats.regen += 0.35; break;
      case "scudo": player.stats.damageReduction = Math.min(0.45, player.stats.damageReduction + 0.08); break;
      case "weapon_up": player.stats.weaponLevel++; break;
    }

    player.invulnerable = 45;
    state = STATE.PLAYING;
    levelUpChoices = [];
  }

  function triggerLevelUp() {
    const owned = player.upgrades;
    const pool = [];

    POWERUP_POOL.forEach((p) => {
      const rank = owned[p.id] || 0;
      if (rank < p.max) {
        pool.push({
          ...p,
          kind: "passive",
          rank,
          weight: (p.max - rank) * 2 + 1,
        });
      }
    });

    const wUp = WEAPON_UPGRADES[player.hero.weapon];
    if (player.stats.weaponLevel < 5) {
      pool.push({
        id: "weapon_up",
        name: wUp.name,
        desc: wUp.desc,
        icon: "🗡️",
        kind: "weapon",
        category: "offense",
        rank: player.stats.weaponLevel - 1,
        max: 5,
        weight: player.level % 3 === 0 ? 6 : 3,
      });
    }

    levelUpChoices = [];
    const categories = ["offense", "defense", "utility"];
    categories.forEach((cat) => {
      const inCat = pool.filter((p) => p.category === cat && !levelUpChoices.includes(p));
      if (inCat.length && levelUpChoices.length < 3) {
        levelUpChoices.push(weightedPick(inCat));
      }
    });

    while (levelUpChoices.length < 3) {
      const rest = pool.filter((p) => !levelUpChoices.includes(p));
      if (!rest.length) break;
      levelUpChoices.push(weightedPick(rest));
    }

    levelUpSelected = 0;
    addBurst(player.x, player.y, "#ffd700", 20, "spark");
    addShockwave(player.x, player.y, "#b026ff", 70);
    state = STATE.LEVEL_UP;
  }

  function addXp(amount) {
    player.xp += amount;
    while (player.xp >= player.xpToNext) {
      player.xp -= player.xpToNext;
      player.level++;
      player.xpToNext = 8 + player.level * 6;
      triggerLevelUp();
      return;
    }
  }

  function addParticles(x, y, color, count) {
    addBurst(x, y, color, count, "spark");
  }

  function updatePlaying() {
    const level = LEVELS[currentLevel];

    updateMouseWorld();
    player.aimAngle = getAimAngle();
    setTouchKeys();

    let dx = 0, dy = 0;
    if (keys.ArrowLeft || keys.KeyA) dx -= 1;
    if (keys.ArrowRight || keys.KeyD) dx += 1;
    if (keys.ArrowUp || keys.KeyW) dy -= 1;
    if (keys.ArrowDown || keys.KeyS) dy += 1;

    const spd = player.stats.speed * (player.tempSpeed > 0 ? 1.35 : 1);
    if (dx !== 0 || dy !== 0) {
      const len = Math.hypot(dx, dy);
      player.vx = (dx / len) * spd;
      player.vy = (dy / len) * spd;
    } else {
      player.vx *= 0.85;
      player.vy *= 0.85;
    }

    player.x = Math.max(40, Math.min(WORLD_W - 40, player.x + player.vx));
    player.y = Math.max(40, Math.min(WORLD_H - 40, player.y + player.vy));
    player.animPhase += Math.hypot(player.vx, player.vy) * 0.22;

    updateCamera();

    if (player.invulnerable > 0) player.invulnerable--;
    if (player.tempBuff > 0) player.tempBuff--;
    if (player.tempSpeed > 0) player.tempSpeed--;
    if (player.stats.regen > 0 && player.hp < player.maxHp) {
      player.hp = Math.min(player.maxHp, player.hp + player.stats.regen / 60);
    }

    player.weaponTimer--;
    if (player.weaponTimer <= 0) {
      autoAttack();
      player.weaponTimer = getCooldown();
    }

    updateOrbiters();
    updateAmbience();

    const quotaReached = levelKills >= level.killQuota;
    const trashCount = enemies.reduce((n, e) => n + (e.isBoss ? 0 : 1), 0);
    const enemyCap = bossPhase ? 40 : 70;

    if (spawnTimer > 0) spawnTimer--;
    else if (trashCount < enemyCap) {
      if (bossPhase) {
        const burst = trashCount < 14 ? 4 : trashCount < 26 ? 3 : 2;
        for (let i = 0; i < burst; i++) spawnEnemy(false, null, { near: true });
        spawnTimer = 14;
      } else {
        const burst = trashCount < 18 ? 3 : trashCount < 40 ? 2 : 1;
        for (let i = 0; i < burst; i++) spawnEnemy();
        spawnTimer = Math.max(18, level.spawnRate - Math.floor(getKillProgress() * 28));
      }
    } else {
      spawnTimer = 8;
    }

    if (!bossSpawned && quotaReached && level.boss) {
      spawnEnemy(true, level.boss);
      bossSpawned = true;
      showLevelBanner({ name: level.boss.name, accent: level.accent });
      if (levelBanner) levelBanner.subtitle = "BOSS";
    }

    if (levelBanner) {
      levelBanner.life--;
      if (levelBanner.life <= 0) levelBanner = null;
    }
    if (worldShift > 0) worldShift *= 0.92;
    if (worldShift < 0.01) worldShift = 0;

    if (pickupTimer > 0) pickupTimer--;
    else { spawnPickup(); pickupTimer = 480 + Math.random() * 240; }

    projectiles.forEach((p) => {
      if (p.type === "arc_slash") { p.life--; return; }
      if (p.type === "arcane_orb") {
        p.x += p.vx;
        p.y += p.vy;
        p.r += p.expand;
        p.life--;
        enemies.forEach((e) => {
          const d = Math.hypot(e.x - p.x, e.y - p.y);
          if (d < p.r && !p.hit.has(e)) {
            p.hit.add(e);
            hurtEnemy(e, p.damage * 0.4, "#00f5ff");
          }
        });
        return;
      }
      if (p.homing && p.target && enemies.includes(p.target)) {
        const desired = Math.atan2(p.target.y - p.y, p.target.x - p.x);
        const current = Math.atan2(p.vy, p.vx);
        let diff = desired - current;
        while (diff > Math.PI) diff -= Math.PI * 2;
        while (diff < -Math.PI) diff += Math.PI * 2;
        const turn = Math.max(-p.turnRate, Math.min(p.turnRate, diff));
        const next = current + turn;
        const spd = p.homingSpeed || 4.2;
        p.vx = Math.cos(next) * spd;
        p.vy = Math.sin(next) * spd;
      } else if (p.homing && (!p.target || !enemies.includes(p.target))) {
        p.homing = false;
      }
      p.x += p.vx;
      p.y += p.vy;
      p.life--;
      if (!p.trail) p.trail = [];
      if (p.type !== "arc_slash" && p.life % 2 === 0) {
        p.trail.push({ x: p.x, y: p.y, life: 10 });
        if (p.trail.length > 8) p.trail.shift();
      }
      enemies.forEach((e) => {
        const hitR = (p.size || 5) + e.size * 0.5;
        if (p.life > 0 && Math.hypot(p.x - e.x, p.y - e.y) < hitR) {
          if (p.piercing) {
            if (!p.hit) p.hit = new Set();
            if (p.hit.has(e)) return;
            p.hit.add(e);
            hurtEnemy(e, p.damage, e.color);
          } else {
            hurtEnemy(e, p.damage, e.color);
            p.life = 0;
          }
        }
      });
    });
    projectiles = projectiles.filter((p) => p.life > 0 && p.x > -80 && p.x < WORLD_W + 80 && p.y > -80 && p.y < WORLD_H + 80);

    waves.forEach((w) => {
      if (w.expand) {
        w.r += w.expand;
        enemies.forEach((e) => {
          const d = Math.hypot(e.x - w.x, e.y - w.y);
          if (d < w.r && d > w.r - w.expand - 2 && !w.hit.has(e)) {
            w.hit.add(e);
            hurtEnemy(e, w.damage, w.color);
          }
        });
      }
      w.life--;
    });
    waves = waves.filter((w) => w.life > 0);

    enemies.forEach((e) => {
      if (e.hitFlash > 0) e.hitFlash--;
      e.x += e.knockVx || 0;
      e.y += e.knockVy || 0;
      e.knockVx = (e.knockVx || 0) * 0.72;
      e.knockVy = (e.knockVy || 0) * 0.72;

      const dist = Math.hypot(player.x - e.x, player.y - e.y);
      const angle = Math.atan2(player.y - e.y, player.x - e.x);
      const wobble = Math.sin(gameTime * 0.14 + (e.wobblePhase || 0)) * 1.2;

      if (e.ranged && !e.isBoss) {
        // Mantieni distanza e spara frecce
        const prefer = e.preferDist || 220;
        if (dist < prefer - 40) {
          e.x -= Math.cos(angle) * e.speed * 1.1;
          e.y -= Math.sin(angle) * e.speed * 1.1;
        } else if (dist > prefer + 50) {
          e.x += Math.cos(angle) * e.speed * 0.85 + wobble * 0.1;
          e.y += Math.sin(angle) * e.speed * 0.85;
        } else {
          // Strafing laterale
          e.x += Math.cos(angle + Math.PI / 2) * e.speed * 0.55;
          e.y += Math.sin(angle + Math.PI / 2) * e.speed * 0.55;
        }

        if (e.shootTimer > 0) e.shootTimer--;
        else if (dist < 420) {
          const spd = e.arrowSpeed || 4.2;
          enemyShots.push({
            x: e.x,
            y: e.y,
            vx: Math.cos(angle) * spd,
            vy: Math.sin(angle) * spd,
            angle,
            damage: e.arrowDamage || 5,
            life: 110,
            size: 5,
          });
          e.shootTimer = e.shootCd || 90;
        }
      } else {
        e.x += Math.cos(angle) * e.speed + wobble * 0.15;
        e.y += Math.sin(angle) * e.speed;
      }

      if (dist < e.size + 14 && player.invulnerable <= 0) {
        const baseDmg = e.isBoss ? (e.damage || 12) : (e.damage || 3);
        const dmg = Math.max(1, Math.floor(baseDmg * (1 - player.stats.damageReduction)));
        player.hp -= dmg;
        player.invulnerable = 32;
        addBurst(player.x, player.y, "#ff3333", 8, "spark");
        addScreenShake(e.isBoss ? 12 : 6);
      }
    });

    enemyShots.forEach((a) => {
      a.x += a.vx;
      a.y += a.vy;
      a.life--;
      if (player.invulnerable <= 0 && Math.hypot(a.x - player.x, a.y - player.y) < 16 + (a.size || 5)) {
        const dmg = Math.max(1, Math.floor((a.damage || 5) * (1 - player.stats.damageReduction)));
        player.hp -= dmg;
        player.invulnerable = 22;
        a.life = 0;
        addBurst(player.x, player.y, "#ffaa44", 6, "spark");
        addScreenShake(5);
        addFloatText(player.x, player.y - 24, String(dmg), "#ff8866", 12);
      }
    });
    enemyShots = enemyShots.filter((a) => a.life > 0 && a.x > -80 && a.x < WORLD_W + 80 && a.y > -80 && a.y < WORLD_H + 80);

    const dead = enemies.filter((e) => e.hp <= 0);
    dead.forEach((e) => {
      addBurst(e.x, e.y, e.color || "#cc8844", e.isBoss ? 28 : 12, "smoke");
      addBurst(e.x, e.y, "#ffffff", e.isBoss ? 10 : 5, "spark");
      addShockwave(e.x, e.y, e.isBoss ? e.color : "#ffaa66", e.isBoss ? 90 : 36);
      if (e.isBoss) addScreenShake(16);
      kills++;
      if (!e.isBoss) levelKills++;
      if (!e.isBoss) {
        dropXp(e.x, e.y, e.xp || (3 + Math.floor(currentLevel / 2)));
      } else {
        dropXp(e.x, e.y, 30);
        if (level.fragment) fragments++;
        if (level.finalBoss && e.name === "Re dei Gatti Mannari" && !finalBossSpawned) {
          setTimeout(() => {
            if (state === STATE.PLAYING) {
              spawnEnemy(true, level.finalBoss);
              finalBossSpawned = true;
            }
          }, 2000);
        } else if (!level.finalBoss || finalBossSpawned) {
          if (currentLevel >= LEVELS.length - 1) {
            state = STATE.VICTORY;
          } else {
            advanceWorldContinuous();
          }
        }
      }
    });
    enemies = enemies.filter((e) => e.hp > 0);

    xpGems.forEach((g) => {
      g.phase += g.spin || 0.08;
      g.x += g.vx;
      g.y += g.vy;
      g.vx *= 0.9;
      g.vy *= 0.9;
      const dist = Math.hypot(player.x - g.x, player.y - g.y);
      if (dist < player.stats.magnet) {
        const a = Math.atan2(player.y - g.y, player.x - g.x);
        const pull = dist < 40 ? 7 : 4.5;
        g.x += Math.cos(a) * pull;
        g.y += Math.sin(a) * pull;
      }
      if (dist < 18) {
        addXp(g.value);
        g.collected = true;
        addBurst(g.x, g.y, "#00f5ff", 6, "spark");
      }
    });
    xpGems = xpGems.filter((g) => !g.collected);

    pickups.forEach((p) => {
      p.life--;
      if (Math.hypot(player.x - p.x, player.y - p.y) < 22) {
        if (p.type === "heal") player.hp = Math.min(player.maxHp, player.hp + 30);
        if (p.type === "damage") player.tempBuff = 600;
        if (p.type === "speed") player.tempSpeed = 600;
        if (p.type === "magnet") xpGems.forEach((g) => { g.x = player.x; g.y = player.y; g.collected = true; addXp(g.value); });
        addParticles(p.x, p.y, "#ffd700", 10);
        p.collected = true;
      }
    });
    pickups = pickups.filter((p) => !p.collected && p.life > 0);

    particles.forEach((p) => {
      p.x += p.vx;
      p.y += p.vy;
      p.vy += p.gravity || 0;
      p.life--;
      p.vx *= 0.94;
      p.vy *= 0.94;
    });
    particles = particles.filter((p) => p.life > 0);

    shockwaves.forEach((s) => {
      s.life--;
      s.r += (s.maxR - s.r) * 0.18;
    });
    shockwaves = shockwaves.filter((s) => s.life > 0);

    floatTexts.forEach((t) => {
      t.y += t.vy;
      t.life--;
    });
    floatTexts = floatTexts.filter((t) => t.life > 0);

    if (player.hp <= 0) state = STATE.GAME_OVER;
  }

  function drawMenuBackground(level) {
    ctx.fillStyle = level.bg[0];
    ctx.fillRect(0, 0, W, H);
    const grad = ctx.createRadialGradient(W / 2, H / 2, 0, W / 2, H / 2, W * 0.6);
    grad.addColorStop(0, level.bg[1] + "44");
    grad.addColorStop(1, level.bg[0]);
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, W, H);
  }

  function drawWorldBackground(level) {
    const viewX = camera.x + shake.x;
    const viewY = camera.y + shake.y;
    const pad = 80;
    const left = viewX - pad;
    const top = viewY - pad;
    const right = viewX + W + pad;
    const bottom = viewY + H + pad;

    ctx.imageSmoothingEnabled = false;
    ctx.fillStyle = level.bg[0];
    ctx.fillRect(left, top, right - left, bottom - top);

    const gx = player.x;
    const gy = player.y;
    const grad = ctx.createRadialGradient(gx, gy, 40, gx, gy, Math.max(W, H) * 0.85);
    grad.addColorStop(0, level.bg[1] + "aa");
    grad.addColorStop(0.55, level.bg[0] + "cc");
    grad.addColorStop(1, level.bg[0]);
    ctx.fillStyle = grad;
    ctx.fillRect(left, top, right - left, bottom - top);

    // Pixel tile floor
    const tileSprite = SPRITES["tile_" + level.theme] || SPRITES.tile_training;
    const tile = (tileSprite.w || 16) * TILE_SCALE;
    const startTX = Math.floor(left / tile) * tile;
    const startTY = Math.floor(top / tile) * tile;
    ctx.globalAlpha = 0.88;
    for (let x = startTX; x < right; x += tile) {
      for (let y = startTY; y < bottom; y += tile) {
        const parity = ((x / tile) + (y / tile)) % 2 === 0;
        ctx.globalAlpha = parity ? 0.95 : 0.72;
        drawSprite(ctx, tileSprite, x, y, TILE_SCALE, false);
        // micro-detail speckles
        if (parity) {
          ctx.globalAlpha = 0.18;
          ctx.fillStyle = level.accent;
          ctx.fillRect(x + 6, y + 6, 2, 2);
          ctx.fillRect(x + tile - 10, y + tile - 10, 2, 2);
        }
      }
    }
    ctx.globalAlpha = 1;

    // Soft ground noise (pixel blocks)
    ctx.fillStyle = level.accent;
    for (let i = 0; i < 120; i++) {
      const nx = Math.floor(left + ((i * 97 + Math.floor(viewX)) % Math.max(1, right - left)));
      const ny = Math.floor(top + ((i * 53 + Math.floor(viewY * 0.7)) % Math.max(1, bottom - top)));
      ctx.globalAlpha = 0.08 + (i % 5) * 0.015;
      ctx.fillRect(nx, ny, 2 + (i % 3), 2);
    }
    ctx.globalAlpha = 1;

    ctx.save();
    drawThemeOverlay(level, left, top, right, bottom, viewX, viewY);
    ctx.restore();

    if (worldShift > 0) {
      ctx.fillStyle = level.accent;
      ctx.globalAlpha = worldShift * 0.18;
      ctx.fillRect(left, top, right - left, bottom - top);
      ctx.globalAlpha = 1;
    }

    // Pixel world border
    ctx.fillStyle = level.accent;
    ctx.globalAlpha = 0.35;
    for (let x = 30; x < WORLD_W - 30; x += 8) {
      ctx.fillRect(x, 30, 4, 4);
      ctx.fillRect(x, WORLD_H - 34, 4, 4);
    }
    for (let y = 30; y < WORLD_H - 30; y += 8) {
      ctx.fillRect(30, y, 4, 4);
      ctx.fillRect(WORLD_W - 34, y, 4, 4);
    }
    ctx.globalAlpha = 1;
  }

  function drawThemeOverlay(level, left, top, right, bottom, viewX, viewY) {
    ctx.imageSmoothingEnabled = false;
    switch (level.theme) {
      case "training": {
        for (let x = Math.floor(left / 220) * 220; x < right; x += 220) {
          for (let y = Math.floor(top / 180) * 180; y < bottom; y += 180) {
            ctx.globalAlpha = 0.22;
            ctx.fillStyle = level.accent;
            // pixel frame
            for (let i = 0; i < 140; i += 4) {
              ctx.fillRect(x + 20 + i, y + 20, 2, 2);
              ctx.fillRect(x + 20 + i, y + 140, 2, 2);
              ctx.fillRect(x + 20, y + 20 + i * 0.85, 2, 2);
              ctx.fillRect(x + 160, y + 20 + i * 0.85, 2, 2);
            }
            drawPixelCircle(ctx, x + 90, y + 80, 10, level.accent);
          }
        }
        break;
      }
      case "alien_city": {
        for (let x = Math.floor(left / 140) * 140; x < right + 140; x += 140) {
          const h = 80 + ((x * 13) % 160);
          const y = bottom - h;
          ctx.globalAlpha = 0.28;
          ctx.fillStyle = "#0c0620";
          ctx.fillRect(Math.floor(x), Math.floor(y), 56 + (x % 28), h);
          ctx.globalAlpha = 0.55;
          for (let wy = y + 8; wy < bottom - 8; wy += 10) {
            for (let wx = x + 6; wx < x + 48; wx += 10) {
              if (((wx + wy) / 8) % 3 !== 0) {
                ctx.fillStyle = level.accent;
                ctx.fillRect(Math.floor(wx), Math.floor(wy), 4, 5);
              }
            }
          }
        }
        break;
      }
      case "forest": {
        for (let i = 0; i < 36; i++) {
          const fx = left + ((i * 73 + Math.floor(viewX * 0.3)) % (right - left + 1));
          const fy = top + ((i * 91 + Math.floor(viewY * 0.2)) % (bottom - top + 1));
          ctx.globalAlpha = 0.2;
          ctx.fillStyle = i % 2 ? "#0c3a12" : "#083018";
          // blocky canopy
          ctx.fillRect(fx - 40, fy - 18, 80, 24);
          ctx.fillRect(fx - 28, fy - 30, 56, 16);
          ctx.fillRect(fx - 16, fy - 40, 32, 12);
          ctx.globalAlpha = 0.35;
          ctx.fillStyle = level.accent;
          ctx.fillRect(fx + 10, fy - 8, 3, 3);
          ctx.fillRect(fx - 12, fy - 16, 2, 2);
        }
        break;
      }
      case "temple": {
        for (let x = Math.floor(left / 200) * 200; x < right; x += 200) {
          ctx.globalAlpha = 0.32;
          ctx.fillStyle = "#4a3420";
          ctx.fillRect(x + 40, top, 18, bottom - top);
          ctx.fillStyle = "#6a5040";
          ctx.fillRect(x + 44, top, 4, bottom - top);
          ctx.globalAlpha = 0.55;
          ctx.fillStyle = level.accent;
          for (let yy = top + 20; yy < bottom; yy += 48) {
            ctx.fillRect(x + 34, yy, 30, 6);
          }
        }
        break;
      }
      case "underworld": {
        for (let i = 0; i < 20; i++) {
          const lx = left + ((i * 111) % (right - left + 1));
          const ly = top + ((i * 67) % (bottom - top + 1));
          ctx.globalAlpha = 0.28;
          ctx.fillStyle = "#5a1510";
          ctx.fillRect(lx - 40, ly - 12, 80, 24);
          ctx.globalAlpha = 0.4;
          ctx.fillStyle = "#ff5522";
          ctx.fillRect(lx - 22, ly - 4, 44, 10);
          ctx.fillStyle = "#ffaa44";
          ctx.fillRect(lx - 8, ly - 2, 10, 4);
        }
        break;
      }
      case "star_temple": {
        for (let i = 0; i < 16; i++) {
          const sx = left + ((i * 97 + Math.floor(viewX * 0.15)) % (right - left + 1));
          const sy = top + ((i * 61) % (bottom - top + 1));
          ctx.globalAlpha = 0.28;
          ctx.fillStyle = level.accent;
          const r = 12 + (i % 4) * 6;
          // pixel ring
          for (let a = 0; a < 24; a++) {
            const ang = (a / 24) * Math.PI * 2;
            ctx.fillRect(sx + Math.cos(ang) * r, sy + Math.sin(ang) * r, 2, 2);
          }
        }
        break;
      }
      case "moon": {
        for (let i = 0; i < 70; i++) {
          const sx = left + ((i * 47 + Math.floor(viewX * 0.05)) % (right - left + 1));
          const sy = top + ((i * 89) % (bottom - top + 1));
          ctx.globalAlpha = 0.15 + (i % 4) * 0.05;
          ctx.fillStyle = "#ffffff";
          ctx.fillRect(sx, sy, 2, 2);
        }
        for (let i = 0; i < 10; i++) {
          const cx = left + ((i * 131) % (right - left + 1));
          const cy = top + ((i * 101) % (bottom - top + 1));
          ctx.globalAlpha = 0.2;
          ctx.fillStyle = "#2a2a38";
          const r = 12 + (i % 3) * 8;
          ctx.fillRect(cx - r, cy - r * 0.6, r * 2, r * 1.2);
        }
        break;
      }
      case "cursed_city": {
        for (let x = Math.floor(left / 160) * 160; x < right; x += 160) {
          const h = 50 + (x % 50);
          ctx.globalAlpha = 0.28;
          ctx.fillStyle = "#2a1038";
          ctx.fillRect(x, bottom - h, 84, h);
          ctx.fillStyle = "#5a2060";
          for (let wy = bottom - h + 8; wy < bottom - 8; wy += 12) {
            ctx.fillRect(x + 10, wy, 8, 6);
            ctx.fillRect(x + 30, wy, 8, 6);
            ctx.fillRect(x + 50, wy, 8, 6);
          }
        }
        break;
      }
      case "star_refuge": {
        for (let i = 0; i < 14; i++) {
          const cx = left + ((i * 109) % (right - left + 1));
          const cy = top + ((i * 79) % (bottom - top + 1));
          ctx.globalAlpha = 0.28;
          ctx.fillStyle = level.accent;
          ctx.fillRect(cx - 2, cy - 18, 4, 36);
          ctx.fillRect(cx - 14, cy - 2, 28, 4);
          ctx.fillRect(cx - 8, cy - 8, 16, 4);
          ctx.fillRect(cx - 8, cy + 4, 16, 4);
        }
        break;
      }
      case "final": {
        ctx.globalAlpha = 0.1;
        ctx.fillStyle = "#ff2200";
        ctx.fillRect(left, top, right - left, bottom - top);
        for (let i = 0; i < 10; i++) {
          const cx = left + ((i * 117) % (right - left + 1));
          const cy = top + ((i * 71) % (bottom - top + 1));
          ctx.globalAlpha = 0.28;
          ctx.fillStyle = "#ff6644";
          for (let a = 0; a < 20; a++) {
            const ang = (a / 20) * Math.PI * 2;
            ctx.fillRect(cx + Math.cos(ang) * 28, cy + Math.sin(ang) * 28, 3, 3);
          }
        }
        break;
      }
    }
    ctx.globalAlpha = 1;
  }

  function drawAmbience(level) {
    ambience.forEach((a) => {
      if (!isOnScreen(a.x, a.y, 40)) return;
      const pulse = 0.35 + Math.sin(a.phase) * 0.25;
      ctx.globalAlpha = pulse;
      ctx.fillStyle = a.color;
      const r = Math.max(1, Math.round(a.r));
      ctx.fillRect(Math.round(a.x) - r, Math.round(a.y) - r, r * 2, r * 2);
    });
    ctx.globalAlpha = 1;
  }

  function drawShockwaves() {
    shockwaves.forEach((s) => {
      ctx.strokeStyle = s.color;
      ctx.globalAlpha = (s.life / 24) * 0.65;
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.arc(s.x, s.y, s.r, 0, Math.PI * 2);
      ctx.stroke();
    });
    ctx.globalAlpha = 1;
  }

  function drawFloatTexts() {
    floatTexts.forEach((t) => {
      ctx.globalAlpha = Math.min(1, t.life / 20);
      ctx.fillStyle = t.color;
      ctx.font = `bold ${t.size}px sans-serif`;
      ctx.textAlign = "center";
      ctx.fillText(t.text, t.x, t.y);
    });
    ctx.globalAlpha = 1;
  }

  function drawScreenFX(level) {
    const px = player.x - camera.x + shake.x;
    const py = player.y - camera.y + shake.y;

    const light = ctx.createRadialGradient(px, py, 20, px, py, 220);
    light.addColorStop(0, level.accent + "33");
    light.addColorStop(0.5, level.accent + "11");
    light.addColorStop(1, "rgba(0,0,0,0)");
    ctx.fillStyle = light;
    ctx.fillRect(0, 0, W, H);

    const vig = ctx.createRadialGradient(W / 2, H / 2, H * 0.2, W / 2, H / 2, H * 0.85);
    vig.addColorStop(0, "rgba(0,0,0,0)");
    vig.addColorStop(1, "rgba(0,0,0,0.62)");
    ctx.fillStyle = vig;
    ctx.fillRect(0, 0, W, H);
  }

  function drawLevelBackground(level) {
    drawMenuBackground(level);
  }

  function drawAnimatedSprite(sprite, x, y, scale, facingLeft, opts = {}) {
    const bob = opts.bob || 0;
    const squash = opts.squash || 1;
    const flash = opts.flash || 0;
    ctx.save();
    ctx.translate(x, y + bob);
    ctx.scale(squash, 2 - squash);
    drawSpriteCentered(ctx, sprite, 0, 0, scale, facingLeft);
    if (flash > 0) {
      ctx.globalAlpha = Math.min(0.7, flash / 12);
      ctx.fillStyle = "#ffffff";
      const w = sprite.w * scale;
      const h = sprite.h * scale;
      ctx.fillRect(-w / 2, -h / 2, w, h);
    }
    ctx.restore();
  }

  function drawDecor(d, level) {
    if (!isOnScreen(d.x, d.y, 160)) return;
    ctx.save();
    ctx.imageSmoothingEnabled = false;
    ctx.globalAlpha = 0.92;
    const s = DECOR_SCALE;
    switch (d.type) {
      case "holo_ring":
        drawSpriteCentered(ctx, SPRITES.decor_holo, d.x, d.y, s * (d.r / 18), false);
        break;
      case "target_marker":
        drawSpriteCentered(ctx, SPRITES.decor_target, d.x, d.y, s * (d.r / 12), false);
        break;
      case "building": {
        const spr = SPRITES.decor_building;
        const scaleX = d.w / (spr.w * s);
        const scaleY = d.h / (spr.h * s);
        const scale = Math.max(1.2, Math.min(scaleX, scaleY) * s);
        drawSpriteCentered(ctx, spr, d.x + d.w / 2, d.y + d.h / 2, scale, false);
        break;
      }
      case "neon_sign":
        drawSpriteCentered(ctx, SPRITES.decor_neon, d.x + d.w / 2, d.y, s, false);
        break;
      case "tree":
        drawSpriteCentered(ctx, SPRITES["decor_tree" + (d.variant || 0)] || SPRITES.decor_tree0, d.x, d.y, s * (d.r / 22), false);
        break;
      case "mushroom":
        drawSpriteCentered(ctx, SPRITES.decor_mushroom, d.x, d.y, s * (d.r / 8), false);
        break;
      case "vine":
        drawSpriteCentered(ctx, SPRITES.decor_vine, d.x, d.y + d.h / 2, s, false);
        break;
      case "pillar":
        drawSpriteCentered(ctx, SPRITES.decor_pillar, d.x + 12, d.y + d.h / 2, s * (d.h / 100), false);
        break;
      case "torch":
        drawSpriteCentered(ctx, SPRITES.decor_torch, d.x, d.y, s, false);
        break;
      case "stalactite":
        drawSpriteCentered(ctx, SPRITES.decor_stalactite, d.x, d.h / 2, s * (d.h / 40), false);
        break;
      case "lava_pool":
        drawSpriteCentered(ctx, SPRITES.decor_lava, d.x, d.y, s * (d.r / 14), false);
        break;
      case "rune":
        drawSpriteCentered(ctx, SPRITES.decor_rune, d.x, d.y, s * (d.r / 12), false);
        break;
      case "portal":
        drawSpriteCentered(ctx, SPRITES.decor_portal, d.x, d.y, s * (d.r / 16), false);
        break;
      case "crater":
        drawSpriteCentered(ctx, SPRITES.decor_crater, d.x, d.y, s * (d.r / 16), false);
        break;
      case "moon_flag":
        drawSpriteCentered(ctx, SPRITES.decor_flag, d.x, d.y, s, false);
        break;
      case "ruin":
        drawSpriteCentered(ctx, SPRITES.decor_ruin, d.x + d.w / 2, d.y + d.h / 2, s * Math.max(d.w, d.h) / 40, false);
        break;
      case "fog_patch":
        ctx.globalAlpha = 0.35;
        drawSpriteCentered(ctx, SPRITES.decor_fog, d.x, d.y, s * (d.r / 18), false);
        break;
      case "crystal":
        drawSpriteCentered(ctx, SPRITES.decor_crystal, d.x, d.y - d.h / 3, s * (d.h / 30), false);
        break;
      case "star_altar":
        drawSpriteCentered(ctx, SPRITES.decor_altar, d.x, d.y, s * (d.r / 12), false);
        break;
      case "moon_rock":
        drawSpriteCentered(ctx, SPRITES.decor_rock, d.x, d.y, s * (d.r / 14), false);
        break;
      case "lunar_spire":
        drawSpriteCentered(ctx, SPRITES.decor_spire, d.x, d.y - d.h / 3, s * (d.h / 50), false);
        break;
      case "grass":
        drawSpriteCentered(ctx, SPRITES.decor_grass || SPRITES.decor_vine, d.x, d.y, s * 0.9, false);
        break;
      case "bush":
        drawSpriteCentered(ctx, SPRITES.decor_bush || SPRITES.decor_tree0, d.x, d.y, s * 0.7, false);
        break;
      case "flower":
        drawSpriteCentered(ctx, SPRITES.decor_flower || SPRITES.decor_mushroom, d.x, d.y, s, false);
        break;
      case "fern":
        drawSpriteCentered(ctx, SPRITES.decor_fern || SPRITES.decor_vine, d.x, d.y, s, false);
        break;
      case "crate":
        drawSpriteCentered(ctx, SPRITES.decor_crate || SPRITES.decor_ruin, d.x, d.y, s, false);
        break;
      case "barrel":
        drawSpriteCentered(ctx, SPRITES.decor_barrel || SPRITES.decor_rock, d.x, d.y, s, false);
        break;
      case "bones":
        drawSpriteCentered(ctx, SPRITES.decor_bones || SPRITES.decor_rock, d.x, d.y, s, false);
        break;
      case "lamp":
        drawSpriteCentered(ctx, SPRITES.decor_lamp || SPRITES.decor_torch, d.x, d.y, s, false);
        break;
      case "debris":
        drawSpriteCentered(ctx, SPRITES.decor_debris || SPRITES.decor_rock, d.x, d.y, s * 0.85, false);
        break;
      case "statue":
        drawSpriteCentered(ctx, SPRITES.decor_statue || SPRITES.decor_pillar, d.x, d.y, s * 0.9, false);
        break;
    }
    ctx.restore();
  }

  function drawPlayer() {
    const p = player;
    const facingLeft = Math.cos(p.aimAngle) < 0;
    const moving = Math.hypot(p.vx, p.vy) > 0.2;
    const bob = moving ? Math.sin(p.animPhase) * 2.5 : Math.sin(gameTime * 0.08) * 0.8;
    const squash = moving ? 1 + Math.sin(p.animPhase * 2) * 0.06 : 1;

    drawEntityShadow(p.x, p.y, 22);

    if (p.hero.weapon === "orbit_shuriken") {
      orbiters.forEach((o) => {
        const ox = Math.round(p.x + Math.cos(o.angle) * o.dist);
        const oy = Math.round(p.y + Math.sin(o.angle) * o.dist);
        ctx.fillStyle = p.hero.accent;
        ctx.fillRect(ox - 4, oy - 1, 8, 2);
        ctx.fillRect(ox - 1, oy - 4, 2, 8);
        ctx.fillStyle = "#ffffff";
        ctx.fillRect(ox - 1, oy - 1, 2, 2);
      });
    }

    drawAnimatedSprite(SPRITES[p.hero.id], p.x, p.y, PLAYER_SCALE, facingLeft, {
      bob,
      squash,
      flash: p.invulnerable > 0 && p.invulnerable % 4 < 2 ? 6 : 0,
    });

    if (p.tempBuff > 0) {
      ctx.strokeStyle = "rgba(255,99,71,0.6)";
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.arc(p.x, p.y, 34 + Math.sin(gameTime * 0.2) * 2, 0, Math.PI * 2);
      ctx.stroke();
    }
  }

  function drawEnemyWerewolfFx(e, facingLeft) {
    if (e.isBoss) return;
    const glow = e.typeId === "werewolf" || e.typeId === "shadow" || e.typeId === "hunter";
    if (!glow) return;
    ctx.globalAlpha = 0.35 + Math.sin(Date.now() / 180 + e.x) * 0.15;
    ctx.fillStyle = e.typeId === "shadow" ? "#cc44ff" : "#ff4422";
    ctx.beginPath();
    const eyeX = facingLeft ? e.x + 5 : e.x - 5;
    ctx.arc(eyeX, e.y - 4, 2.5, 0, Math.PI * 2);
    ctx.arc(e.x + (facingLeft ? -5 : 5), e.y - 4, 2.5, 0, Math.PI * 2);
    ctx.fill();
    ctx.globalAlpha = 1;
  }

  function drawEnemies() {
    enemies.forEach((e) => {
      if (!isOnScreen(e.x, e.y, 90)) return;
      const spriteKey = e.sprite || (e.isBoss ? "cat_boss" : "cat_tabby");
      const sprite = SPRITES[spriteKey] || SPRITES.cat_tabby;
      let scale = ENEMY_SPRITE_SCALE;
      if (e.typeId === "werewolf") scale = 2.35;
      if (e.typeId === "hunter" || e.typeId === "archer") scale = 2.15;
      if (e.typeId === "kitten") scale = 1.85;
      if (e.isBoss) scale = BOSS_SPRITE_SCALE;
      const facingLeft = e.x > player.x;

      if (e.isBoss) {
        ctx.globalAlpha = 0.2 + Math.sin(gameTime * 0.1) * 0.08;
        ctx.fillStyle = e.color;
        ctx.beginPath();
        ctx.arc(e.x, e.y, e.size + 14, 0, Math.PI * 2);
        ctx.fill();
        ctx.globalAlpha = 1;
      }

      const wobbleY = Math.sin(gameTime * 0.16 + (e.wobblePhase || 0)) * 1.5;
      drawEntityShadow(e.x, e.y, e.size * 0.55);
      drawAnimatedSprite(sprite, e.x, e.y + wobbleY, scale, facingLeft, {
        squash: 1 + (e.hitFlash > 0 ? 0.12 : 0),
        flash: e.hitFlash || 0,
      });
      drawEnemyWerewolfFx(e, facingLeft);

      if (!e.isBoss && e.typeName && (e.typeId === "werewolf" || e.typeId === "hunter" || e.typeId === "shadow" || e.typeId === "archer")) {
        ctx.fillStyle = "rgba(0,0,0,0.45)";
        ctx.fillRect(e.x - 34, e.y - e.size - 22, 68, 12);
        ctx.fillStyle = e.typeId === "archer" ? "#ffd080" : e.typeId === "werewolf" ? "#ff8866" : "#ffccaa";
        ctx.font = "9px monospace";
        ctx.textAlign = "center";
        ctx.fillText(e.typeName, e.x, e.y - e.size - 13);
      }

      if (e.isBoss) {
        const barW = 160;
        const barY = e.y - 70;
        ctx.fillStyle = "#111";
        ctx.fillRect(e.x - barW / 2, barY, barW, 10);
        ctx.fillStyle = "#333";
        ctx.fillRect(e.x - barW / 2 + 1, barY + 1, barW - 2, 8);
        ctx.fillStyle = e.color;
        ctx.fillRect(e.x - barW / 2 + 1, barY + 1, (barW - 2) * (e.hp / e.maxHp), 8);
        ctx.fillStyle = "#fff";
        ctx.font = "bold 11px monospace";
        ctx.textAlign = "center";
        ctx.fillText(e.name, e.x, barY - 8);
      }
    });
  }

  function drawProjectiles() {
    const colors = { shuriken: "#c0c0c0", dart: "#ff69b4", plasma: "#ff6347", laser: "#39ff14" };
    projectiles.forEach((p) => {
      if (p.trail) {
        p.trail.forEach((t) => {
          t.life--;
          ctx.globalAlpha = (t.life / 10) * 0.4;
          ctx.fillStyle = colors[p.type] || "#fff";
          ctx.fillRect(Math.round(t.x) - 2, Math.round(t.y) - 2, 4, 4);
        });
        p.trail = p.trail.filter((t) => t.life > 0);
      }

      if (p.type === "arc_slash") {
        ctx.save();
        ctx.translate(p.x, p.y);
        ctx.rotate(p.angle);
        const alpha = p.life / 14;
        ctx.fillStyle = `rgba(57,255,20,${0.25 + alpha * 0.55})`;
        const steps = 14;
        for (let i = 0; i <= steps; i++) {
          const a = -p.arc / 2 + (p.arc * i) / steps;
          const px = Math.cos(a) * p.range;
          const py = Math.sin(a) * p.range;
          ctx.fillRect(px - 3, py - 3, 6, 6);
          ctx.fillRect(Math.cos(a) * (p.range - 10) - 2, Math.sin(a) * (p.range - 10) - 2, 4, 4);
        }
        ctx.restore();
        return;
      }
      if (p.type === "arcane_orb") {
        ctx.globalAlpha = 0.85;
        ctx.fillStyle = "#00f5ff";
        const rr = Math.round(p.r);
        for (let a = 0; a < 20; a++) {
          const ang = (a / 20) * Math.PI * 2;
          ctx.fillRect(p.x + Math.cos(ang) * rr - 2, p.y + Math.sin(ang) * rr - 2, 4, 4);
        }
        ctx.globalAlpha = 0.35;
        ctx.fillRect(p.x - rr * 0.5, p.y - rr * 0.5, rr, rr);
        ctx.globalAlpha = 1;
        return;
      }
      const r = Math.max(3, Math.round(p.size || 5));
      const x = Math.round(p.x);
      const y = Math.round(p.y);
      ctx.fillStyle = colors[p.type] || "#fff";
      ctx.fillRect(x - r, y - r, r * 2, r * 2);
      ctx.fillStyle = "#ffffff";
      ctx.fillRect(x - Math.floor(r / 2), y - Math.floor(r / 2), Math.max(2, r), Math.max(2, r));
    });
    ctx.globalAlpha = 1;
  }

  function drawEnemyShots() {
    enemyShots.forEach((a) => {
      if (!isOnScreen(a.x, a.y, 40)) return;
      const ang = a.angle || Math.atan2(a.vy, a.vx);
      const x = Math.round(a.x);
      const y = Math.round(a.y);
      ctx.fillStyle = "#8b5a2b";
      ctx.fillRect(x - 6, y - 1, 10, 3);
      ctx.fillStyle = "#e8c090";
      ctx.fillRect(x + 2, y - 2, 6, 5);
      ctx.fillStyle = "#ff6644";
      ctx.fillRect(x + 6, y - 1, 4, 3);
      // tip direction nudge
      ctx.fillRect(x + Math.round(Math.cos(ang) * 8), y + Math.round(Math.sin(ang) * 8) - 1, 3, 3);
    });
  }

  function drawJoy(joy, knobColor) {
    if (!joy.active) return;
    const dx = Math.max(-JOY_MAX_R, Math.min(JOY_MAX_R, joy.x - joy.ox));
    const dy = Math.max(-JOY_MAX_R, Math.min(JOY_MAX_R, joy.y - joy.oy));
    ctx.fillStyle = "rgba(255,255,255,0.15)";
    ctx.beginPath();
    ctx.arc(joy.ox, joy.oy, 55, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = knobColor;
    ctx.beginPath();
    ctx.arc(joy.ox + dx, joy.oy + dy, 22, 0, Math.PI * 2);
    ctx.fill();
  }

  function drawJoyGhost(anchor, knobColor) {
    ctx.strokeStyle = "rgba(255,255,255,0.2)";
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.arc(anchor.x, anchor.y, 55, 0, Math.PI * 2);
    ctx.stroke();
    ctx.fillStyle = knobColor;
    ctx.beginPath();
    ctx.arc(anchor.x, anchor.y, 22, 0, Math.PI * 2);
    ctx.fill();
  }

  function drawCrosshair() {
    if (isTouchDevice && state === STATE.PLAYING) {
      if (!moveJoy.active) drawJoyGhost(touchJoyAnchors.move, "rgba(0,245,255,0.22)");
      if (!aimJoy.active) drawJoyGhost(touchJoyAnchors.aim, "rgba(255,120,80,0.22)");
    }

    drawJoy(moveJoy, "rgba(0,245,255,0.5)");
    drawJoy(aimJoy, "rgba(255,120,80,0.55)");

    if (aimJoy.active || isTouchDevice) return;

    const x = mouse.screenX;
    const y = mouse.screenY;
    ctx.strokeStyle = "rgba(0,245,255,0.7)";
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(x - 10, y);
    ctx.lineTo(x + 10, y);
    ctx.moveTo(x, y - 10);
    ctx.lineTo(x, y + 10);
    ctx.stroke();
    ctx.fillStyle = "rgba(0,245,255,0.5)";
    ctx.beginPath();
    ctx.arc(x, y, 4, 0, Math.PI * 2);
    ctx.fill();
  }

  function drawWaves() {
    waves.forEach((w) => {
      ctx.strokeStyle = w.color;
      ctx.globalAlpha = w.life / 30;
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.arc(w.x, w.y, w.r || w.maxR * (1 - w.life / 20), 0, Math.PI * 2);
      ctx.stroke();
    });
    ctx.globalAlpha = 1;
  }

  function drawXpGems() {
    xpGems.forEach((g) => {
      const pulse = 1 + Math.sin((g.phase || 0) + gameTime * 0.1) * 0.2;
      const size = Math.max(3, Math.round(5 * pulse));
      const x = Math.round(g.x);
      const y = Math.round(g.y);
      ctx.fillStyle = "#00f5ff";
      ctx.fillRect(x - size, y - 1, size * 2, 3);
      ctx.fillRect(x - 1, y - size, 3, size * 2);
      ctx.fillStyle = "#ffffff";
      ctx.fillRect(x - 1, y - 1, 3, 3);
    });
  }

  function drawPickups() {
    const colors = { heal: "#39ff14", damage: "#ff6347", speed: "#00f5ff", magnet: "#ffd700" };
    pickups.forEach((p) => {
      const x = Math.round(p.x);
      const y = Math.round(p.y);
      ctx.globalAlpha = 0.35 + (p.life % 30) / 60;
      ctx.fillStyle = colors[p.type];
      ctx.fillRect(x - 12, y - 12, 24, 24);
      ctx.globalAlpha = 1;
      ctx.fillStyle = "#111";
      ctx.fillRect(x - 8, y - 8, 16, 16);
      ctx.fillStyle = colors[p.type];
      ctx.fillRect(x - 4, y - 4, 8, 8);
      ctx.fillStyle = "#fff";
      ctx.fillRect(x - 2, y - 2, 4, 4);
    });
  }

  function drawParticles() {
    particles.forEach((p) => {
      const alpha = p.maxLife ? p.life / p.maxLife : p.life / 35;
      ctx.globalAlpha = alpha;
      const s = Math.max(1, Math.round(p.size));
      ctx.fillStyle = p.color;
      ctx.fillRect(Math.round(p.x) - s, Math.round(p.y) - s, s * 2, s * 2);
      if (p.kind !== "smoke") {
        ctx.fillStyle = "#ffffff";
        ctx.fillRect(Math.round(p.x) - 1, Math.round(p.y) - 1, 2, 2);
      }
    });
    ctx.globalAlpha = 1;
  }

  function drawHUD() {
    const level = LEVELS[currentLevel];
    ctx.fillStyle = "rgba(0,0,0,0.72)";
    ctx.fillRect(0, 0, W, 58);

    ctx.fillStyle = level.accent;
    ctx.font = "bold 15px sans-serif";
    ctx.textAlign = "left";
    ctx.fillText(`${level.name}`, 14, 20);
    ctx.fillStyle = "#aaa";
    ctx.font = "12px sans-serif";
    ctx.fillText(`${player.hero.name} | Lv.${player.level} | Nemici: ${levelKills}/${level.killQuota}`, 14, 38);

    ctx.textAlign = "center";
    ctx.fillStyle = bossPhase ? "#ff4444" : "#fff";
    ctx.font = "bold 14px sans-serif";
    ctx.fillText(
      bossPhase ? "⚔️ FASE BOSS" : `🎯 ${levelKills}/${level.killQuota}`,
      W / 2, 22
    );

    if (!bossPhase) {
      const barW = 180;
      ctx.fillStyle = "#222";
      ctx.fillRect(W / 2 - barW / 2, 30, barW, 8);
      ctx.fillStyle = level.accent;
      ctx.fillRect(W / 2 - barW / 2, 30, barW * getKillProgress(), 8);
    }

    ctx.textAlign = "right";
    ctx.fillStyle = "#ffd700";
    ctx.fillText(`⭐ Frammenti: ${fragments}/7`, W - 14, 20);

    const barX = W - 210;
    ctx.fillStyle = "#333";
    ctx.fillRect(barX, 34, 196, 14);
    ctx.fillStyle = player.hp > 30 ? "#39ff14" : "#ff4444";
    ctx.fillRect(barX, 34, 196 * (player.hp / player.maxHp), 14);
    ctx.strokeStyle = "#fff";
    ctx.strokeRect(barX, 34, 196, 14);

    const xpBarW = 196;
    const xpX = 14;
    ctx.fillStyle = "#222";
    ctx.fillRect(xpX, 44, xpBarW, 8);
    ctx.fillStyle = "#00f5ff";
    ctx.fillRect(xpX, 44, xpBarW * (player.xp / player.xpToNext), 8);

    const mapW = 100;
    const mapH = 70;
    const mapX = W - mapW - 14;
    const mapY = H - mapH - 14;
    ctx.fillStyle = "rgba(0,0,0,0.5)";
    ctx.fillRect(mapX, mapY, mapW, mapH);
    ctx.strokeStyle = level.accent;
    ctx.lineWidth = 1;
    ctx.strokeRect(mapX, mapY, mapW, mapH);
    const px = mapX + (player.x / WORLD_W) * mapW;
    const py = mapY + (player.y / WORLD_H) * mapH;
    ctx.fillStyle = player.hero.color;
    ctx.fillRect(px - 2, py - 2, 4, 4);
    ctx.fillStyle = "#666";
    ctx.textAlign = "center";
    ctx.font = "11px sans-serif";
    const hint = (moveJoy.active || aimJoy.active)
      ? "Stick sinistro muovi | Stick destro mira"
      : "WASD muovi | Mouse mira | Touch: stick sinistro + destro";
    ctx.fillText(hint, W / 2, H - 8);
  }

  function drawLevelUp() {
    ctx.fillStyle = "#000";
    ctx.fillRect(0, 0, W, H);

    ctx.save();
    ctx.translate(-Math.floor(camera.x), -Math.floor(camera.y));
    drawWorldBackground(LEVELS[currentLevel]);
    drawAmbience(LEVELS[currentLevel]);
    decor.forEach((d) => drawDecor(d, LEVELS[currentLevel]));
    drawEnemies();
    drawPlayer();
    ctx.restore();

    ctx.fillStyle = "rgba(0,0,0,0.75)";
    ctx.fillRect(0, 0, W, H);

    ctx.fillStyle = "#ffd700";
    ctx.font = "bold 32px sans-serif";
    ctx.textAlign = "center";
    ctx.fillText(`LEVEL UP! — Ninja Lv.${player.level}`, W / 2, 60);
    ctx.fillStyle = "#aaa";
    ctx.font = "13px sans-serif";
    ctx.fillText(`Danno ${Math.round(player.stats.damage)} | HP ${Math.floor(player.hp)}/${player.maxHp} | Arma Lv.${player.stats.weaponLevel}`, W / 2, 88);

    const catColors = { offense: "#ff6644", defense: "#44cc88", utility: "#44aaff", weapon: "#ffd700" };
    levelUpChoices.forEach((c, i) => {
      const y = 190 + i * 115;
      const selected = i === levelUpSelected;
      const cat = c.category || (c.kind === "weapon" ? "weapon" : "utility");
      ctx.fillStyle = selected ? "rgba(176,38,255,0.4)" : "rgba(20,20,50,0.8)";
      ctx.strokeStyle = selected ? catColors[cat] : "#444";
      ctx.lineWidth = selected ? 3 : 1;
      ctx.fillRect(W / 2 - 290, y - 42, 580, 96);
      ctx.strokeRect(W / 2 - 290, y - 42, 580, 96);

      ctx.font = "28px serif";
      ctx.fillText(c.icon || "✨", W / 2 - 250, y + 5);
      ctx.fillStyle = selected ? "#fff" : "#ccc";
      ctx.font = "bold 18px sans-serif";
      ctx.textAlign = "left";
      const rank = c.kind === "weapon"
        ? ` [${player.stats.weaponLevel}/5]`
        : c.max ? ` [${(c.rank || 0) + 1}/${c.max}]` : "";
      ctx.fillText(`${i + 1}. ${c.name}${rank}`, W / 2 - 200, y - 10);
      ctx.fillStyle = catColors[cat];
      ctx.font = "11px sans-serif";
      ctx.fillText(cat.toUpperCase(), W / 2 - 200, y + 10);
      ctx.fillStyle = "#888";
      ctx.font = "14px sans-serif";
      ctx.fillText(c.desc, W / 2 - 200, y + 30);
    });

    ctx.fillStyle = "#aaa";
    ctx.textAlign = "center";
    ctx.font = "14px sans-serif";
    ctx.fillText("Tocca un potenziamento per sceglierlo", W / 2, H - 40);
  }

  function drawTextScreen(title, lines, sub = "") {
    drawLevelBackground(LEVELS[0]);
    titlePulse += 0.05;
    ctx.fillStyle = `rgba(0,245,255,${0.5 + Math.sin(titlePulse) * 0.3})`;
    ctx.font = "bold 40px sans-serif";
    ctx.textAlign = "center";
    ctx.fillText(title, W / 2, 100);
    ctx.fillStyle = "#e8e8ff";
    ctx.font = "16px sans-serif";
    let y = 170;
    lines.forEach((line) => {
      if (!line) { y += 10; return; }
      ctx.fillText(line, W / 2, y);
      y += 28;
    });
    if (sub) {
      ctx.fillStyle = "#b026ff";
      ctx.font = "17px sans-serif";
      ctx.fillText(sub, W / 2, H - 50);
    }
  }

  function drawGameLogo(cx, cy, size = 160) {
    if (!logoReady) return;
    const s = size + Math.sin(titlePulse) * 4;
    ctx.save();
    ctx.shadowColor = "rgba(0,245,255,0.45)";
    ctx.shadowBlur = 24;
    ctx.drawImage(gameLogo, cx - s / 2, cy - s / 2, s, s);
    ctx.restore();
  }

  function drawTitle() {
    drawLevelBackground(LEVELS[0]);
    titlePulse += 0.05;
    drawGameLogo(W / 2, 150, 170);

    ctx.fillStyle = `rgba(0,245,255,${0.55 + Math.sin(titlePulse) * 0.3})`;
    ctx.font = "bold 38px sans-serif";
    ctx.textAlign = "center";
    ctx.fillText("Alieni Ninja", W / 2, 280);

    ctx.fillStyle = "#e8e8ff";
    ctx.font = "16px sans-serif";
    [
      "Elimina le orde di Gatti Mannari!",
      "Muoviti, le armi attaccano da sole.",
      "Raccogli XP, potenzia il tuo ninja.",
      "", "Recupera la Lancia delle Stelle!",
    ].forEach((line, i) => {
      if (!line) return;
      ctx.fillText(line, W / 2, 330 + i * 28);
    });

    ctx.fillStyle = "#b026ff";
    ctx.font = "17px sans-serif";
    ctx.fillText("Tocca lo schermo per iniziare", W / 2, H - 50);
  }

  function drawStory() {
    drawMenuBackground(LEVELS[0]);
    titlePulse += 0.05;

    // Logo in alto a sinistra, fuori dal titolo
    if (logoReady) {
      ctx.save();
      ctx.shadowColor = "rgba(0,245,255,0.35)";
      ctx.shadowBlur = 16;
      ctx.drawImage(gameLogo, 36, 28, 64, 64);
      ctx.restore();
    }

    ctx.fillStyle = `rgba(0,245,255,${0.55 + Math.sin(titlePulse) * 0.25})`;
    ctx.font = "bold 40px sans-serif";
    ctx.textAlign = "center";
    ctx.fillText("La Trama", W / 2, 120);

    ctx.fillStyle = "#e8e8ff";
    ctx.font = "16px sans-serif";
    [
      "Zara, Kael, Vex, Nia e Ryn — l'élite ninja aliena.",
      "I Gatti Mannari invadono il pianeta.",
      "Attraversa 10 location fino alla Luna.",
      "Ogni ambientazione ha il suo boss: sconfiggilo per avanzare.",
    ].forEach((line, i) => {
      ctx.fillText(line, W / 2, 190 + i * 32);
    });

    ctx.fillStyle = "#b026ff";
    ctx.font = "17px sans-serif";
    ctx.fillText("Tocca per scegliere l'eroe", W / 2, H - 50);
  }

  function drawSelect() {
    drawMenuBackground(LEVELS[0]);
    drawGameLogo(70, 48, 56);
    ctx.fillStyle = "#00f5ff";
    ctx.font = "bold 26px sans-serif";
    ctx.textAlign = "center";
    ctx.fillText("Scegli il tuo Ninja — Sprite pixel unici", W / 2, 45);
    ctx.fillStyle = "#888";
    ctx.font = "13px sans-serif";
    ctx.fillText("Tocca un eroe per selezionarlo", W / 2, 72);

    HEROES.forEach((h, i) => {
      const col = i % 3;
      const row = Math.floor(i / 3);
      const cx = 200 + col * 340;
      const cy = 200 + row * 210;
      const cw = 290, ch = 175;
      ctx.fillStyle = "rgba(20,20,50,0.85)";
      ctx.strokeStyle = h.color;
      ctx.lineWidth = 2;
      ctx.fillRect(cx - cw / 2, cy - ch / 2, cw, ch);
      ctx.strokeRect(cx - cw / 2, cy - ch / 2, cw, ch);

      drawSpriteCentered(ctx, SPRITES[h.id], cx - cw / 2 + 50, cy - 10, 2.2, false);

      ctx.fillStyle = h.color;
      ctx.font = "bold 18px sans-serif";
      ctx.textAlign = "left";
      ctx.fillText(`${i + 1}. ${h.name}`, cx - cw / 2 + 95, cy - 30);
      ctx.fillStyle = "#aaa";
      ctx.font = "12px sans-serif";
      ctx.fillText(h.desc, cx - cw / 2 + 15, cy + 15, cw - 30);
      ctx.fillStyle = h.accent;
      ctx.fillText(`⚔ ${h.weaponName}`, cx - cw / 2 + 15, cy + 40);
      ctx.fillStyle = "#666";
      ctx.fillText(`HP ${h.hp} | SPD ${h.speed}`, cx - cw / 2 + 15, cy + 62);
    });
  }

  function drawLevelIntro() {
    const level = LEVELS[currentLevel];
    drawTextScreen(`Livello ${currentLevel + 1}: ${level.name}`, [
      level.story,
      "",
      `Arma: ${selectedHero.weaponName}`,
      level.boss ? `Uccidi ${level.killQuota} gatti, poi sconfiggi: ${level.boss.name}` : `Obiettivo: uccidi ${level.killQuota} gatti mannari`,
    ], introTimer > 0 ? "..." : "Tocca per iniziare il livello");
    if (introTimer > 0) introTimer--;
  }

  function drawLevelClear() {
    const level = LEVELS[currentLevel];
    drawPlaying();
    ctx.fillStyle = "rgba(0,0,0,0.55)";
    ctx.fillRect(0, 0, W, H);
    ctx.fillStyle = "#39ff14";
    ctx.font = "bold 34px sans-serif";
    ctx.textAlign = "center";
    ctx.fillText("Livello Completato!", W / 2, H / 2 - 50);
    if (level.fragment) {
      ctx.fillStyle = "#ffd700";
      ctx.font = "18px sans-serif";
      ctx.fillText("⭐ Frammento della Lancia delle Stelle!", W / 2, H / 2);
    }
    ctx.fillStyle = "#aaa";
    ctx.fillText(`Livello personaggio: ${player.level} | Uccisi: ${kills}`, W / 2, H / 2 + 40);
    ctx.fillText("Tocca — prossimo livello", W / 2, H / 2 + 75);
  }

  function drawGameOver() {
    drawTextScreen("Game Over", [
      `${selectedHero?.name} è caduto.`,
      `Hai raggiunto il livello ${player?.level || 1}.`,
      "I Gatti Mannari dominano ancora...",
    ], "Tocca per riprovare");
  }

  function drawVictory() {
    drawLevelBackground(LEVELS[9]);
    ctx.fillStyle = "#ffd700";
    ctx.font = "bold 38px sans-serif";
    ctx.textAlign = "center";
    ctx.fillText("VITTORIA!", W / 2, 110);
    ctx.fillStyle = "#e8e8ff";
    ctx.font = "17px sans-serif";
    ["La Lancia delle Stelle è completa!", "Il pianeta è salvo.", "",
      `Frammenti: ${fragments}/7 | Livello finale: ${player.level}`,
    ].forEach((l, i) => ctx.fillText(l, W / 2, 180 + i * 30));
    ctx.fillStyle = "#00f5ff";
    ctx.fillText("Tocca — menu principale", W / 2, H - 50);
  }

  function drawLevelBanner() {
    if (!levelBanner) return;
    const t = levelBanner.life / levelBanner.maxLife;
    const alpha = t > 0.75 ? (1 - t) / 0.25 : t < 0.2 ? t / 0.2 : 1;
    const y = 120 + (1 - alpha) * 12;

    ctx.save();
    ctx.globalAlpha = alpha * 0.55;
    ctx.fillStyle = "#000";
    ctx.fillRect(W / 2 - 260, y - 52, 520, 96);
    ctx.globalAlpha = alpha;
    ctx.strokeStyle = levelBanner.accent || "#00f5ff";
    ctx.lineWidth = 2;
    ctx.strokeRect(W / 2 - 260, y - 52, 520, 96);

    ctx.fillStyle = levelBanner.accent || "#00f5ff";
    ctx.font = "bold 13px sans-serif";
    ctx.textAlign = "center";
    ctx.fillText(levelBanner.subtitle, W / 2, y - 18);
    ctx.fillStyle = "#fff";
    ctx.font = "bold 32px sans-serif";
    ctx.fillText(levelBanner.title, W / 2, y + 20);
    ctx.restore();
  }

  function drawPlaying() {
    const level = LEVELS[currentLevel];

    ctx.imageSmoothingEnabled = false;
    ctx.fillStyle = "#000";
    ctx.fillRect(0, 0, W, H);

    ctx.save();
    ctx.imageSmoothingEnabled = false;
    ctx.translate(-Math.floor(camera.x + shake.x), -Math.floor(camera.y + shake.y));

    drawWorldBackground(level);
    drawAmbience(level);
    decor.forEach((d) => drawDecor(d, level));
    drawShockwaves();
    drawWaves();
    drawXpGems();
    drawPickups();
    drawParticles();
    drawProjectiles();
    drawEnemyShots();
    drawEnemies();
    drawPlayer();
    drawFloatTexts();

    ctx.restore();
    drawScreenFX(level);
    drawCrosshair();
    drawHUD();
    drawLevelBanner();
  }

  function update() {
    gameTime++;
    if (state === STATE.PLAYING) updatePlaying();
    if (state === STATE.LEVEL_INTRO && introTimer > 0) introTimer--;
  }

  function draw() {
    switch (state) {
      case STATE.TITLE: drawTitle(); break;
      case STATE.STORY: drawStory(); break;
      case STATE.SELECT: drawSelect(); break;
      case STATE.LEVEL_INTRO: drawLevelIntro(); break;
      case STATE.PLAYING: drawPlaying(); break;
      case STATE.LEVEL_UP: drawLevelUp(); break;
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
