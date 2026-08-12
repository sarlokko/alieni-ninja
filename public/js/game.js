(() => {
  "use strict";

  const canvas = document.getElementById("game-canvas");
  const ctx = canvas.getContext("2d");
  let W = 1600;
  let H = 900;
  const WORLD_W = 20000;
  const WORLD_H = 15000;
  const { SPRITES, drawSpriteCentered, drawSprite, drawPixelCircle, PX } = window.PixelSprites;
  const DR = window.DepthRender || {
    depthScaleY: () => 1,
    spriteDrawY: (y) => y,
    drawGroundShadow: () => {},
    applyDepthFog: () => {},
    setGameTime: () => {},
  };
  const PLAYER_SCALE = 1.95;
  const ENEMY_SPRITE_SCALE = 2.15;
  const BOSS_SPRITE_SCALE = 2.5;
  const TILE_SCALE = 4;
  const DECOR_SCALE = 2.5;
  const MOVE_MULT = 0.75;
  const MAX_VIEW_W = 1920;
  const MAX_VIEW_H = 1080;

  const gameLogo = new Image();
  gameLogo.src = "img/logo.png";
  let logoReady = false;
  gameLogo.onload = () => { logoReady = true; };

  const ENEMY_TYPES = {
    kitten:   { id: "kitten",   sprite: "cat_kitten",   name: "Cucciolo Feroce", hpMult: 0.5,  speedMult: 0.62, damage: 2, size: 14, xp: 2, weight: 40 },
    tabby:    { id: "tabby",    sprite: "cat_tabby",    name: "Predatore Tigrato", hpMult: 0.85, speedMult: 0.75, damage: 3, size: 16, xp: 3, weight: 35 },
    hunter:   { id: "hunter",   sprite: "cat_hunter",   name: "Cacciatore Sanguinario", hpMult: 0.7,  speedMult: 0.95, damage: 3, size: 17, xp: 4, weight: 22 },
    archer:   { id: "archer",   sprite: "cat_archer",   name: "Arcere Oscuro", hpMult: 0.65, speedMult: 0.6,  damage: 2, size: 16, xp: 5, weight: 18, ranged: true, preferDist: 220, shootCd: 95, arrowDamage: 4, arrowSpeed: 4.6 },
    werewolf: { id: "werewolf", sprite: "cat_werewolf", name: "Gatto Mannaro", hpMult: 1.4,  speedMult: 0.68, damage: 5, size: 20, xp: 7, weight: 18 },
    shadow:   { id: "shadow",   sprite: "cat_shadow",   name: "Ombra Devastatrice", hpMult: 0.45, speedMult: 1.1,  damage: 4, size: 15, xp: 5, weight: 12 },
  };

  const STATE = {
    TITLE: "title",
    STORY: "story",
    SELECT: "select",
    LEVEL_INTRO: "level_intro",
    PLAYING: "playing",
    LEVEL_UP: "level_up",
    RESUME_PAUSE: "resume_pause",
    LEVEL_CLEAR: "level_clear",
    SHOP: "shop",
    OVERCLOCK: "overclock",
    GAME_OVER: "game_over",
    VICTORY: "victory",
  };

  const drg = window.DRGSystems;

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
      story: "Campo olografico. Elimina 40 simulacri, poi il Simulacro Alfa.",
      bg: ["#0d1b2a", "#1b263b"],
      floor: "#152238",
      accent: "#00f5ff",
      killQuota: 40,
      spawnRate: 92,
      enemyHp: 8,
      enemySpeed: 0.55,
      boss: { name: "Simulacro Alfa", hp: 280, speed: 0.78, size: 34, color: "#00f5ff", sprite: "cat_boss", damage: 5 },
      fragment: false,
    },
    {
      name: "Città Alienigena",
      theme: "alien_city",
      story: "Neon e grattacieli. Uccidi 60 predatori, poi il Capo Distretto.",
      bg: ["#1a0a2e", "#2d1b4e"],
      floor: "#1e1040",
      accent: "#b026ff",
      killQuota: 60,
      spawnRate: 82,
      enemyHp: 11,
      enemySpeed: 0.64,
      boss: { name: "Capo Distretto Neon", hp: 420, speed: 0.86, size: 36, color: "#b026ff", sprite: "cat_boss", damage: 6 },
      fragment: false,
    },
    {
      name: "Bosco Infestato",
      theme: "forest",
      story: "Bosco bioluminescente. Abbatti 85 predatori, poi il Signore del Bosco.",
      bg: ["#0a1f0a", "#1a3a1a"],
      floor: "#0f2a12",
      accent: "#39ff14",
      killQuota: 85,
      spawnRate: 74,
      enemyHp: 14,
      enemySpeed: 0.72,
      boss: { name: "Signore del Bosco", hp: 620, speed: 0.9, size: 36, color: "#39ff14", sprite: "cat_boss", damage: 7 },
      fragment: false,
    },
    {
      name: "Tempio Antico",
      theme: "temple",
      story: "Pietra e torce. Uccidi 110 gatti, poi il Custode.",
      bg: ["#1a140e", "#261c14"],
      floor: "#22180f",
      accent: "#b8954a",
      killQuota: 110,
      spawnRate: 66,
      enemyHp: 17,
      enemySpeed: 0.8,
      boss: { name: "Custode delle Stelle", hp: 900, speed: 0.92, size: 38, color: "#b8954a", sprite: "cat_boss", damage: 8 },
      fragment: true,
    },
    {
      name: "Sottomondo Felino",
      theme: "underworld",
      story: "Gallerie laviche. Elimina 145 nemici e la Matrona.",
      bg: ["#1a0a0a", "#3a1515"],
      floor: "#2a1010",
      accent: "#ff4466",
      killQuota: 145,
      spawnRate: 56,
      enemyHp: 22,
      enemySpeed: 0.92,
      boss: { name: "Matrona degli Arcani", hp: 1300, speed: 1.0, size: 36, color: "#ff4466", sprite: "cat_boss", damage: 10 },
      fragment: true,
    },
    {
      name: "Tempio delle Stelle",
      theme: "star_temple",
      story: "Portali dimensionali. Uccidi 185 gatti, poi il Guardiano.",
      bg: ["#0a0a2a", "#1a1a5a"],
      floor: "#12124a",
      accent: "#7b68ee",
      killQuota: 185,
      spawnRate: 46,
      enemyHp: 27,
      enemySpeed: 1.04,
      boss: { name: "Guardiano Dimensionale", hp: 1750, speed: 1.08, size: 40, color: "#7b68ee", sprite: "cat_boss", damage: 12 },
      fragment: true,
    },
    {
      name: "Battaglia sulla Luna",
      theme: "moon",
      story: "Crateri e stelle. Elimina 230 predatori, poi il Drago.",
      bg: ["#1a1a2a", "#2a2a4a"],
      floor: "#3a3a4a",
      accent: "#ff6347",
      killQuota: 230,
      spawnRate: 38,
      enemyHp: 33,
      enemySpeed: 1.16,
      boss: { name: "Drago Stellare", hp: 2400, speed: 1.0, size: 44, color: "#ff6347", sprite: "cat_boss", damage: 14 },
      fragment: true,
    },
    {
      name: "Città Maledetta",
      theme: "cursed_city",
      story: "Rovine e nebbia. Uccidi 290 gatti e il Signore del Caos.",
      bg: ["#1a0a1a", "#3a1a3a"],
      floor: "#2a1530",
      accent: "#9400d3",
      killQuota: 290,
      spawnRate: 32,
      enemyHp: 40,
      enemySpeed: 1.28,
      boss: { name: "Signore del Caos", hp: 3200, speed: 1.12, size: 42, color: "#9400d3", sprite: "cat_boss", damage: 15 },
      fragment: true,
    },
    {
      name: "Rifugio delle Stelle",
      theme: "star_refuge",
      story: "Cristalli cosmici. Elimina 350 nemici e la Matriarca.",
      bg: ["#0a1a2a", "#1a3a5a"],
      floor: "#102840",
      accent: "#ff8c00",
      killQuota: 350,
      spawnRate: 28,
      enemyHp: 48,
      enemySpeed: 1.38,
      boss: { name: "Matriarca del Mondo Felino", hp: 4100, speed: 1.18, size: 40, color: "#ff8c00", sprite: "cat_boss", damage: 17 },
      fragment: true,
    },
    {
      name: "Confronto Finale",
      theme: "final",
      story: "La Luna. Uccidi 420 gatti, poi il Re e il Guardiano.",
      bg: ["#0a0a1a", "#1a0a2a"],
      floor: "#2a2a35",
      accent: "#ff2200",
      killQuota: 420,
      spawnRate: 24,
      enemyHp: 56,
      enemySpeed: 1.5,
      boss: { name: "Re dei Gatti Mannari", hp: 5200, speed: 1.15, size: 46, color: "#ff2200", sprite: "cat_boss", damage: 18 },
      finalBoss: { name: "Guardiano dell'Universo", hp: 3900, speed: 1.25, size: 42, color: "#00f5ff", sprite: "cat_boss", damage: 17 },
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
  let resumePauseTimer = 0;
  let lastPickedUpgrade = null;
  let levelUpChoices = [];
  let levelUpSelected = 0;
  let pendingLevelUps = 0;
  const COMBO_WINDOW = 210;
  const FEVER_DURATION = 240;

  let combo = 0;
  let comboTimer = 0;
  let comboBest = 0;
  let feverTimer = 0;
  let bountyTimer = 420;
  let styleFlash = 0;
  let funCooldown = 0;

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
    DR.drawGroundShadow(ctx, x, y, radius);
  }

  const MENU_STATES = new Set([
    STATE.TITLE, STATE.STORY, STATE.SELECT, STATE.LEVEL_INTRO,
    STATE.LEVEL_UP, STATE.LEVEL_CLEAR, STATE.SHOP, STATE.OVERCLOCK,
    STATE.GAME_OVER, STATE.VICTORY,
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
    // Riquadro grande a schermo: risoluzione ampia (max 1920x1080)
    const rect = canvas.getBoundingClientRect();
    let cssW = Math.max(960, Math.floor(rect.width || window.innerWidth || 1600));
    let cssH = Math.max(540, Math.floor(rect.height || window.innerHeight || 900));
    if (rect.width < 40) {
      cssW = Math.floor((window.innerWidth || 1600) * 0.985);
      cssH = Math.floor((window.innerHeight || 900) * 0.985);
    }
    // Scala solo se lo schermo supera il cap (evita lag estremi su 4K)
    const scale = Math.min(1, MAX_VIEW_W / cssW, MAX_VIEW_H / cssH);
    W = Math.max(960, Math.floor(cssW * scale));
    H = Math.max(540, Math.floor(cssH * scale));
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
  // Doppio pass: dopo il layout CSS del riquadro
  resizeGame();
  requestAnimationFrame(() => resizeGame());
  setTimeout(resizeGame, 50);

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
    if (state === STATE.RESUME_PAUSE) {
      if (code === "Enter" || code === "Space") resumePauseTimer = 0;
      return;
    }

    if (state === STATE.SHOP) {
      drg.handleShopInput(code);
      return;
    }

    if (state === STATE.OVERCLOCK) {
      drg.handleOverclockInput(code);
      return;
    }

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
    if (state === STATE.SHOP) { drg.handleShopInput("Space"); return; }
    if (state === STATE.GAME_OVER || state === STATE.VICTORY) { resetGame(); return; }
    if (state === STATE.LEVEL_UP && levelUpChoices.length) {
      applyPowerUp(levelUpChoices[levelUpSelected]);
    }
  }

  function getSelectLayout() {
    const cols = W < 1100 ? 2 : 3;
    const cardW = Math.min(340, Math.floor((W - 72) / cols) - 14);
    const cardH = 340;
    const gapX = 16;
    const gapY = 14;
    const gridW = cols * cardW + (cols - 1) * gapX;
    const rows = Math.ceil(HEROES.length / cols);
    const gridH = rows * cardH + (rows - 1) * gapY;
    const startX = Math.floor((W - gridW) / 2);
    const startY = Math.max(72, Math.floor((H - gridH) / 2) - 4);
    return { cols, cardW, cardH, gapX, gapY, startX, startY };
  }

  function getHeroCardRect(i) {
    const layout = getSelectLayout();
    const col = i % layout.cols;
    const row = Math.floor(i / layout.cols);
    return {
      x: layout.startX + col * (layout.cardW + layout.gapX),
      y: layout.startY + row * (layout.cardH + layout.gapY),
      w: layout.cardW,
      h: layout.cardH,
    };
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

    if (state === STATE.SHOP) {
      handleMenuConfirm();
      return;
    }

    if (state === STATE.OVERCLOCK) {
      drg.applyOverclock("balanced");
      state = STATE.PLAYING;
      return;
    }

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
    // Non sovrascrivere un Fever ancora fresco con eventi minori
    if (
      levelBanner &&
      feverTimer > 90 &&
      levelBanner.title === "FEVER TIME!" &&
      level.name !== "FEVER TIME!" &&
      !(level.name || "").includes("BOSS") &&
      levelBanner.life > 40
    ) {
      return;
    }
    levelBanner = {
      title: level.name,
      subtitle: `Settore ${currentLevel + 1} / ${LEVELS.length}`,
      life: 140,
      maxLife: 140,
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
    resetFunState();
    decor = generateDecor(level.theme);
    ambience = generateAmbience(level.theme);
    worldShift = 1;
    player.invulnerable = Math.max(player.invulnerable, 40);
    spawnTimer = 8;
    showLevelBanner(level);
    const openCount = Math.min(14, 3 + Math.floor(getHeroLevel() * 0.7));
    for (let i = 0; i < openCount; i++) spawnEnemy();
    addShockwave(player.x, player.y, level.accent, 110);
    addBurst(player.x, player.y, level.accent, 18, "spark");
    addScreenShake(8);
  }

  function selectHero(idx) {
    selectedHero = HEROES[idx];
    currentLevel = 0;
    fragments = 0;
    drg.resetRun();
    initLevel(true);
    state = STATE.PLAYING;
    showLevelBanner(LEVELS[0]);
  }

  function resetGame() {
    state = STATE.TITLE;
    selectedHero = null;
    currentLevel = 0;
    fragments = 0;
    drg.resetRun();
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
        xpToNext: 16,
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
    pickupTimer = 780;
    bossSpawned = false;
    finalBossSpawned = false;
    bossPhase = false;
    levelKills = 0;
    pendingLevelUps = 0;
    resetFunState();
    drg.resetLevel();
    const openCount = Math.min(14, 3 + Math.floor(getHeroLevel() * 0.7));
    for (let i = 0; i < openCount; i++) spawnEnemy();
  }

  function startLevel() {
    state = STATE.PLAYING;
    showLevelBanner(LEVELS[currentLevel]);
    if (enemies.length < 8) {
      const openCount = Math.min(14, 3 + Math.floor(getHeroLevel() * 0.7));
      for (let i = 0; i < openCount; i++) spawnEnemy();
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
      training: 140, alien_city: 120, forest: 160, temple: 58, underworld: 120,
      star_temple: 120, moon: 130, cursed_city: 120, star_refuge: 130, final: 120,
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
          items.push({ type: "pillar", ...at(), h: 70 + rnd(70) });
          if (i % 6 === 0) items.push({ type: "torch", ...at() });
          if (i % 8 === 0) items.push({ type: "statue", ...at() });
          if (i % 5 === 0) items.push({ type: "debris", ...at() });
          if (i % 9 === 0) items.push({ type: "crate", ...at() });
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
      training: "#00f5ff", alien_city: "#b026ff", forest: "#39ff14", temple: "#8a7040",
      underworld: "#ff4466", star_temple: "#7b68ee", moon: "#c0c0ff", cursed_city: "#9400d3",
      star_refuge: "#ff8c00", final: "#ff2200",
    };
    const color = colors[theme] || "#ffffff";
    const count = theme === "temple" ? 10 : 36;
    for (let i = 0; i < count; i++) {
      items.push({
        x: Math.random() * WORLD_W,
        y: Math.random() * WORLD_H,
        vx: (Math.random() - 0.5) * (theme === "temple" ? 0.12 : 0.35),
        vy: (Math.random() - 0.5) * (theme === "temple" ? 0.12 : 0.35),
        r: 1 + Math.random() * (theme === "temple" ? 1.4 : 2.5),
        phase: Math.random() * Math.PI * 2,
        color,
        calm: theme === "temple",
      });
    }
    return items;
  }

  function updateAmbience() {
    ambience.forEach((a) => {
      a.x += a.vx;
      a.y += a.vy;
      a.phase += a.calm ? 0.015 : 0.04;
      if (a.x < 0) a.x = WORLD_W;
      if (a.x > WORLD_W) a.x = 0;
      if (a.y < 0) a.y = WORLD_H;
      if (a.y > WORLD_H) a.y = 0;
    });
  }

  function updateCamera() {
    const tx = player.x - W / 2;
    const ty = player.y - H / 2;
    camera.x += (tx - camera.x) * 0.18;
    camera.y += (ty - camera.y) * 0.18;
    camera.x = Math.max(0, Math.min(WORLD_W - W, camera.x));
    camera.y = Math.max(0, Math.min(WORLD_H - H, camera.y));
    updateShake();
  }

  function isOnScreen(wx, wy, margin = 80) {
    return wx > camera.x - margin && wx < camera.x + W + margin &&
           wy > camera.y - margin && wy < camera.y + H + margin;
  }

  function xpForLevel(level) {
    // Curve più morbida: meno pause all'inizio, progressione leggibile
    return 14 + level * 9;
  }

  function getComboMult() {
    return 1 + Math.min(0.55, Math.floor(combo / 5) * 0.1);
  }

  function comboRank(n) {
    if (n >= 40) return "LEGGENDARIO!";
    if (n >= 25) return "INFERNALE!";
    if (n >= 15) return "FANTASTICO!";
    if (n >= 10) return "GRANDE!";
    if (n >= 5) return "BELLO!";
    return null;
  }

  function resetFunState() {
    combo = 0;
    comboTimer = 0;
    feverTimer = 0;
    bountyTimer = 720 + Math.floor(Math.random() * 240);
    styleFlash = 0;
    funCooldown = 0;
  }

  function hasActiveBounty() {
    return enemies.some((e) => e.isBounty && e.hp > 0);
  }

  function startFever(reason) {
    // Un solo momento "wow" alla volta: no Fever se c'è già una taglia o un cooldown
    if (feverTimer > 40) return;
    if (hasActiveBounty() || funCooldown > 0 || bossPhase) return;
    feverTimer = FEVER_DURATION;
    funCooldown = FEVER_DURATION + 240;
    styleFlash = 40;
    showLevelBanner({ name: "FEVER TIME!", accent: "#ffd700" });
    if (levelBanner) levelBanner.subtitle = reason || "Più danno, più velocità!";
    addShockwave(player.x, player.y, "#ffd700", 140);
    addBurst(player.x, player.y, "#ffd700", 18, "spark");
    addScreenShake(8);
    enemies.forEach((e) => {
      if (e.isBoss) return;
      const d = Math.hypot(e.x - player.x, e.y - player.y);
      if (d < 150) hurtEnemy(e, Math.max(3, getDamage(0.28)), "#ffd700");
    });
  }

  function registerKill(e) {
    combo++;
    comboTimer = COMBO_WINDOW;
    if (combo > comboBest) comboBest = combo;
    styleFlash = Math.max(styleFlash, 10);

    const rank = comboRank(combo);
    if (rank && (combo === 5 || combo === 10 || combo === 15 || combo === 25 || combo === 40)) {
      addFloatText(player.x, player.y - 50, rank, "#ffd700", 18);
    }

    // Fever raro e chiaro: solo a traguardi alti
    if (combo === 20 || combo === 40) {
      startFever(`Combo x${combo}`);
    }

    if (e.isBounty) {
      const bonus = 14 + getHeroLevel() * 2;
      dropXp(e.x, e.y, bonus);
      const types = ["heal", "damage", "speed", "magnet"];
      pickups.push({
        x: e.x + (Math.random() - 0.5) * 28,
        y: e.y + (Math.random() - 0.5) * 28,
        type: types[Math.floor(Math.random() * types.length)],
        life: 780,
        bob: Math.random() * Math.PI * 2,
      });
      addShockwave(e.x, e.y, "#ff8c42", 90);
      addFloatText(e.x, e.y - 30, "TAGLIA!", "#ff8c42", 18);
      showLevelBanner({ name: "Taglia riscossa!", accent: "#ff8c42" });
      if (levelBanner) levelBanner.subtitle = `+${bonus} XP e un potenziamento`;
      funCooldown = Math.max(funCooldown, 300);
      // Niente Fever automatico: la taglia è già il premio
    }
  }

  function breakCombo(reason) {
    if (combo >= 8) {
      addFloatText(player.x, player.y - 40, `Combo x${combo} rotta`, "#ff8866", 14);
    }
    combo = 0;
    comboTimer = 0;
  }

  function markBounty() {
    // Niente taglia durante Fever / cooldown / boss: un evento alla volta
    if (feverTimer > 0 || funCooldown > 0 || bossPhase) {
      bountyTimer = 180;
      return;
    }
    const candidates = enemies.filter((e) => !e.isBoss && !e.isBounty && e.hp > 0);
    if (!candidates.length) {
      bountyTimer = 120;
      return;
    }
    candidates.sort((a, b) => {
      const da = Math.hypot(a.x - player.x, a.y - player.y);
      const db = Math.hypot(b.x - player.x, b.y - player.y);
      return Math.abs(da - 280) - Math.abs(db - 280);
    });
    const target = candidates[0];
    target.isBounty = true;
    target.hp = Math.floor(target.hp * 1.4);
    target.maxHp = Math.floor(target.maxHp * 1.4);
    target.speed *= 1.08;
    target.xp = Math.floor((target.xp || 4) * 2.5);
    addFloatText(target.x, target.y - 28, "CACCIA!", "#ff8c42", 16);
    showLevelBanner({ name: `Caccia: ${target.typeName || "Predatore"}`, accent: "#ff8c42" });
    if (levelBanner) levelBanner.subtitle = "Segui la freccia arancione";
    funCooldown = 200;
    bountyTimer = 960 + Math.floor(Math.random() * 360);
  }

  function getCooldown() {
    const fever = feverTimer > 0 ? 0.7 : 1;
    return Math.max(12, Math.floor(player.hero.baseCooldown * player.stats.cooldownMult * fever));
  }

  function getDamage(mult = 1) {
    const buff = player.tempBuff > 0 ? 1.3 : 1;
    const fever = feverTimer > 0 ? 1.2 : 1;
    const comboBonus = 1 + Math.min(0.25, Math.floor(combo / 10) * 0.05);
    const nitraMult = drg.getNitraDamageMult();
    return player.stats.damage * mult * buff * fever * comboBonus * nitraMult * (1 + (player.stats.weaponLevel - 1) * 0.12);
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

  function getHeroLevel() {
    return (player && player.level) || 1;
  }

  function pickEnemyType() {
    const hl = getHeroLevel();
    const progress = getKillProgress();
    // Progressione legata al livello eroe (+ un po' di avanzamento quota mappa)
    const p = Math.max(0, Math.min(1, (hl - 1) * 0.09 + progress * 0.28));
    const pool = [];

    const add = (id, w) => {
      const t = ENEMY_TYPES[id];
      if (t) pool.push({ type: t, weight: w });
    };

    if (hl <= 2) {
      add("kitten", 72); add("tabby", 28);
      if (hl >= 2 && progress > 0.5) add("hunter", 10);
    } else if (p < 0.22) {
      add("kitten", 55); add("tabby", 45);
    } else if (p < 0.42) {
      add("kitten", 25); add("tabby", 35); add("hunter", 20); add("archer", 20);
    } else if (p < 0.62) {
      add("tabby", 18); add("hunter", 24); add("archer", 28); add("werewolf", 18); add("shadow", 12);
    } else if (p < 0.82) {
      add("hunter", 16); add("archer", 30); add("werewolf", 30); add("shadow", 24);
    } else {
      add("archer", 26); add("werewolf", 32); add("shadow", 28); add("hunter", 14);
    }

    const total = pool.reduce((s, entry) => s + entry.weight, 0);
    let roll = Math.random() * total;
    for (const entry of pool) {
      roll -= entry.weight;
      if (roll <= 0) return entry.type;
    }
    return ENEMY_TYPES.tabby;
  }

  function autoAttack() {
    const weapon = player.hero.weapon;
    const amount = Math.floor(player.stats.amount);
    const area = player.stats.area;
    const aim = player.aimAngle;
    const projSpeed = 7.2;

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
            spin: Math.random() * Math.PI * 2,
            spinSpeed: 0.45,
            size: 7,
          });
        }
        orbiters = initOrbiters();
        addBurst(player.x, player.y, player.hero.accent, 6, "spark");
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
        projectiles.push({
          type: "arc_slash",
          x: player.x, y: player.y,
          angle: aim, arc, range: 140 * area,
          life: 16, maxLife: 16, damage: 0,
        });
        addBurst(
          player.x + Math.cos(aim) * 40,
          player.y + Math.sin(aim) * 40,
          "#39ff14", 10, "spark"
        );
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
            spin: Math.random() * Math.PI * 2,
            spinSpeed: 0.18,
          });
        }
        addParticles(player.x, player.y, "#ffd700", 10);
        addBurst(player.x, player.y, "#ff6347", 8, "spark");
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
            size: 5,
            piercing: false,
            homing: !!target,
            target,
            turnRate: 0.11,
            homingSpeed: 4.6,
            spin: angle,
          });
        }
        addBurst(player.x, player.y, "#ff69b4", 6, "spark");
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
            maxR: 52 * area,
            r: 10,
            hit: new Set(),
            spin: Math.random() * Math.PI * 2,
          });
        }
        addBurst(player.x, player.y, "#00f5ff", 8, "spark");
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
    const hl = getHeroLevel();
    const threatMult = drg.getThreatHpMult();
    const scale = bossPhase
      ? 1.06 + (hl - 1) * 0.025
      : (1 + getKillProgress() * 0.08 + (hl - 1) * 0.04) * threatMult;
    const dmgScale = 0.7 + (hl - 1) * 0.055;
    const spdMult = 1 + (hl - 1) * 0.02;
    enemies.push({
      x, y,
      hp: Math.floor(level.enemyHp * etype.hpMult * scale),
      maxHp: Math.floor(level.enemyHp * etype.hpMult * scale),
      speed: level.enemySpeed * etype.speedMult * spdMult * (0.95 + Math.random() * 0.16),
      size: etype.size,
      color: etype.id === "archer" ? "#c8a060" : "#cc8844",
      isBoss: false,
      typeId: etype.id,
      typeName: etype.name,
      sprite: etype.sprite,
      damage: Math.max(1, Math.round(etype.damage * dmgScale)),
      xp: etype.xp,
      ranged: !!etype.ranged,
      preferDist: etype.preferDist || 0,
      shootCd: etype.shootCd || 0,
      shootTimer: etype.ranged ? 40 + Math.random() * 40 : 0,
      arrowDamage: Math.max(1, Math.round((etype.arrowDamage || 0) * dmgScale)),
      arrowSpeed: etype.arrowSpeed || 0,
      wobblePhase: Math.random() * Math.PI * 2,
      hitFlash: 0,
      knockVx: 0,
      knockVy: 0,
    });
  }

  const PICKUP_META = {
    heal: { label: "CURA", hint: "+30 Vita", color: "#39ff14" },
    damage: { label: "POTENZA", hint: "Danno x1.4", color: "#ff6347" },
    speed: { label: "VELOCE", hint: "Più veloce", color: "#00f5ff" },
    magnet: { label: "CALAMITA", hint: "Aspira tutto l'XP", color: "#ffd700" },
  };
  const PICKUP_ATTRACT = 130;
  const PICKUP_COLLECT = 52;

  function spawnPickup() {
    const types = ["heal", "damage", "speed", "magnet"];
    const type = types[Math.floor(Math.random() * types.length)];
    const angle = Math.random() * Math.PI * 2;
    const dist = 120 + Math.random() * 280;
    pickups.push({
      x: Math.max(60, Math.min(WORLD_W - 60, player.x + Math.cos(angle) * dist)),
      y: Math.max(60, Math.min(WORLD_H - 60, player.y + Math.sin(angle) * dist)),
      type,
      life: 720,
      bob: Math.random() * Math.PI * 2,
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

    if (choice.kind === "secondary") {
      drg.applySecondaryChoice(choice);
      lastPickedUpgrade = choice;
      levelUpChoices = [];
      if (pendingLevelUps > 0) {
        pendingLevelUps--;
        triggerLevelUp();
        return;
      }
      resumeAfterLevelUp();
      return;
    }

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
      case "weapon_up":
        player.stats.weaponLevel++;
        if (drg.checkOverclock(player.stats.weaponLevel)) {
          lastPickedUpgrade = choice;
          levelUpChoices = [];
          state = STATE.OVERCLOCK;
          return;
        }
        break;
    }

    lastPickedUpgrade = choice;
    levelUpChoices = [];

    // Se hai salito più livelli insieme (es. calamita), scegli a catena senza ripause
    if (pendingLevelUps > 0) {
      pendingLevelUps--;
      triggerLevelUp();
      return;
    }

    resumeAfterLevelUp();
  }

  function resumeAfterLevelUp() {
    moveJoy.active = false;
    moveJoy.id = null;
    aimJoy.active = false;
    aimJoy.id = null;
    if (player) {
      player.vx = 0;
      player.vy = 0;
      player.invulnerable = Math.max(player.invulnerable, 70);
    }
    Object.keys(keys).forEach((k) => { keys[k] = false; });
    // Desktop: ripresa rapida. Touch: un secondo per rimettere le dita.
    resumePauseTimer = isTouchDevice ? 60 : 24;
    state = STATE.RESUME_PAUSE;
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

    const secChoices = drg.getSecondaryChoices();
    secChoices.forEach((c) => {
      if (levelUpChoices.length < 3 && !levelUpChoices.find((x) => x.secId === c.secId)) {
        levelUpChoices.push(c);
      }
    });

    levelUpSelected = 0;
    addBurst(player.x, player.y, "#ffd700", 16, "spark");
    addShockwave(player.x, player.y, "#b026ff", 55);
    state = STATE.LEVEL_UP;
  }

  function tryOpenLevelUp() {
    if (pendingLevelUps <= 0) return;
    if (state !== STATE.PLAYING) return;
    pendingLevelUps--;
    triggerLevelUp();
  }

  function addXp(amount) {
    player.xp += amount;
    let gained = 0;
    while (player.xp >= player.xpToNext) {
      player.xp -= player.xpToNext;
      player.level++;
      player.xpToNext = xpForLevel(player.level);
      pendingLevelUps++;
      gained++;
    }
    if (gained > 1 && state === STATE.PLAYING) {
      addFloatText(player.x, player.y - 56, `+${gained} LIVELLI`, "#00f5ff", 16);
    }
    tryOpenLevelUp();
  }

  function addParticles(x, y, color, count) {
    addBurst(x, y, color, count, "spark");
  }

  function updatePlaying() {
    const level = LEVELS[currentLevel];

    drg.update();

    updateMouseWorld();
    player.aimAngle = getAimAngle();
    setTouchKeys();

    let dx = 0, dy = 0;
    if (keys.ArrowLeft || keys.KeyA) dx -= 1;
    if (keys.ArrowRight || keys.KeyD) dx += 1;
    if (keys.ArrowUp || keys.KeyW) dy -= 1;
    if (keys.ArrowDown || keys.KeyS) dy += 1;

    const spd = player.stats.speed * MOVE_MULT
      * (player.tempSpeed > 0 ? 1.35 : 1)
      * (feverTimer > 0 ? 1.15 : 1);
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
    if (feverTimer > 0) feverTimer--;
    if (styleFlash > 0) styleFlash--;
    if (funCooldown > 0) funCooldown--;
    if (comboTimer > 0) {
      comboTimer--;
      if (comboTimer <= 0 && combo > 0) breakCombo("timeout");
    }
    if (bountyTimer > 0) bountyTimer--;
    else if (!bossPhase) markBounty();

    if (player.stats.regen > 0 && player.hp < player.maxHp) {
      player.hp = Math.min(player.maxHp, player.hp + player.stats.regen / 60 * (feverTimer > 0 ? 1.35 : 1));
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
    const hl = getHeroLevel();
    const enemyCap = bossPhase
      ? Math.min(42, 16 + Math.floor(hl * 1.2))
      : Math.min(62, 16 + Math.floor(hl * 2.2));

    if (spawnTimer > 0) spawnTimer--;
    else if (trashCount < enemyCap) {
      if (bossPhase) {
        const burst = trashCount < 10 ? (hl < 4 ? 2 : 3) : trashCount < 22 ? 2 : 1;
        for (let i = 0; i < burst; i++) spawnEnemy(false, null, { near: true });
        spawnTimer = hl < 4 ? 24 : 16;
      } else {
        const soft = hl <= 4;
        const burst = trashCount < (soft ? 8 : 12 + hl)
          ? (soft ? 1 : hl < 8 ? 2 : 2)
          : trashCount < (soft ? 16 : 22 + hl) ? 1 : 1;
        for (let i = 0; i < burst; i++) spawnEnemy();
        const accel = 8 + hl * 1.2;
        const floor = Math.max(14, 34 - hl * 1.4);
        spawnTimer = Math.max(
          floor,
          level.spawnRate - Math.floor(getKillProgress() * accel) - Math.floor(hl * 1.1) - drg.getThreatSpawnBonus()
        );
      }
    } else {
      spawnTimer = 12;
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
    else { spawnPickup(); pickupTimer = 720 + Math.random() * 360; }

    projectiles.forEach((p) => {
      if (p.type === "arc_slash") { p.life--; return; }
      if (p.type === "arcane_orb") {
        p.x += p.vx;
        p.y += p.vy;
        p.r = Math.min((p.r || 8) + p.expand, p.maxR || 52);
        p.spin = (p.spin || 0) + 0.08;
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
      if (p.spinSpeed) p.spin = (p.spin || 0) + p.spinSpeed;
      else if (p.type === "dart") p.spin = Math.atan2(p.vy, p.vx);
      if (!p.trail) p.trail = [];
      if (p.type !== "arc_slash" && p.type !== "arcane_orb" && p.life % 2 === 0) {
        p.trail.push({
          x: p.x, y: p.y,
          life: 16,
          size: (p.size || 6) * (0.5 + Math.random() * 0.4),
          spin: p.spin || 0,
        });
        if (p.trail.length > 12) p.trail.shift();
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
        breakCombo("hit");
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
        breakCombo("hit");
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
      registerKill(e);
      if (!e.isBoss) {
        const xp = Math.ceil((e.xp || (3 + Math.floor(getHeroLevel() / 2))) * getComboMult());
        dropXp(e.x, e.y, xp);
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
          drg.onBossKilled();
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
      const magnetR = player.stats.magnet * (feverTimer > 0 ? 1.55 : 1);
      const dist = Math.hypot(player.x - g.x, player.y - g.y);
      if (dist < magnetR) {
        const a = Math.atan2(player.y - g.y, player.x - g.x);
        const pull = feverTimer > 0 ? (dist < 50 ? 8 : 5.5) : (dist < 40 ? 7 : 4.5);
        g.x += Math.cos(a) * pull;
        g.y += Math.sin(a) * pull;
      }
      if (dist < 18) {
        addXp(g.value);
        g.collected = true;
        addBurst(g.x, g.y, feverTimer > 0 ? "#ffd700" : "#00f5ff", 5, "spark");
      }
    });
    xpGems = xpGems.filter((g) => !g.collected);

    pickups.forEach((p) => {
      p.life--;
      p.bob = (p.bob || 0) + 0.12;
      const dist = Math.hypot(player.x - p.x, player.y - p.y);
      if (dist < PICKUP_ATTRACT && dist > 1) {
        const a = Math.atan2(player.y - p.y, player.x - p.x);
        const pull = dist < PICKUP_COLLECT + 20 ? 5.5 : 3.2;
        p.x += Math.cos(a) * pull;
        p.y += Math.sin(a) * pull;
      }
      if (dist < PICKUP_COLLECT) {
        const meta = PICKUP_META[p.type];
        if (p.type === "heal") player.hp = Math.min(player.maxHp, player.hp + 30);
        if (p.type === "damage") player.tempBuff = 360;
        if (p.type === "speed") player.tempSpeed = 360;
        if (p.type === "magnet") {
          // Accumula XP in un colpo: i livelli in coda si aprono a catena dopo
          let sucked = 0;
          xpGems.forEach((g) => {
            sucked += g.value;
            g.collected = true;
          });
          if (sucked > 0) addXp(sucked);
        }
        addFloatText(p.x, p.y - 18, `${meta.label}!`, meta.color, 16);
        addParticles(p.x, p.y, meta.color, 12);
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
    const pad = 64;
    const left = viewX - pad;
    const top = viewY - pad;
    const right = viewX + W + pad;
    const bottom = viewY + H + pad;

    ctx.imageSmoothingEnabled = false;

    if (DR && DR.drawWorldDepthFloor) {
      DR.drawWorldDepthFloor(ctx, level, left, top, right, bottom, WORLD_W, WORLD_H);
    } else {
      ctx.fillStyle = level.floor;
      ctx.fillRect(left, top, right - left, bottom - top);
    }

    const stamp = SPRITES["tile_" + level.theme] || SPRITES.tile_training;
    const stampEvery = level.theme === "temple" ? 384 : 256;
    ctx.globalAlpha = 0.28;
    for (let x = Math.floor(left / stampEvery) * stampEvery; x < right; x += stampEvery) {
      for (let y = Math.floor(top / stampEvery) * stampEvery; y < bottom; y += stampEvery) {
        const depthSc = DR ? DR.depthScaleY(y, WORLD_H) : 1;
        drawSprite(ctx, stamp, x + 16, y + 16, 2.2 * depthSc, false);
      }
    }
    ctx.globalAlpha = 1;

    const gx = player.x;
    const gy = player.y;
    const grad = ctx.createRadialGradient(gx, gy, 40, gx, gy, Math.max(W, H) * 0.7);
    grad.addColorStop(0, level.bg[1] + "66");
    grad.addColorStop(0.55, level.bg[1] + "22");
    grad.addColorStop(1, "rgba(0,0,0,0.2)");
    ctx.fillStyle = grad;
    ctx.fillRect(left, top, right - left, bottom - top);

    ctx.save();
    drawThemeOverlay(level, left, top, right, bottom, viewX, viewY);
    ctx.restore();

    if (worldShift > 0) {
      ctx.fillStyle = level.accent;
      ctx.globalAlpha = worldShift * (level.theme === "temple" ? 0.06 : 0.18);
      ctx.fillRect(left, top, right - left, bottom - top);
      ctx.globalAlpha = 1;
    }

    // Bordo mondo solo se visibile in camera
    ctx.fillStyle = level.accent;
    ctx.globalAlpha = 0.4;
    const b = 30;
    if (top < b + 8 && bottom > b) {
      const x0 = Math.max(left, b);
      const x1 = Math.min(right, WORLD_W - b);
      for (let x = Math.floor(x0 / 12) * 12; x < x1; x += 12) ctx.fillRect(x, b, 5, 5);
    }
    if (bottom > WORLD_H - 40 && top < WORLD_H - 26) {
      const y = WORLD_H - 34;
      const x0 = Math.max(left, b);
      const x1 = Math.min(right, WORLD_W - b);
      for (let x = Math.floor(x0 / 12) * 12; x < x1; x += 12) ctx.fillRect(x, y, 5, 5);
    }
    if (left < b + 8 && right > b) {
      const y0 = Math.max(top, b);
      const y1 = Math.min(bottom, WORLD_H - b);
      for (let y = Math.floor(y0 / 12) * 12; y < y1; y += 12) ctx.fillRect(b, y, 5, 5);
    }
    if (right > WORLD_W - 40 && left < WORLD_W - 26) {
      const x = WORLD_W - 34;
      const y0 = Math.max(top, b);
      const y1 = Math.min(bottom, WORLD_H - b);
      for (let y = Math.floor(y0 / 12) * 12; y < y1; y += 12) ctx.fillRect(x, y, 5, 5);
    }
    ctx.globalAlpha = 1;
  }

  function drawThemeOverlay(level, left, top, right, bottom, viewX, viewY) {
    ctx.imageSmoothingEnabled = false;
    switch (level.theme) {
      case "training": {
        for (let x = Math.floor(left / 280) * 280; x < right; x += 280) {
          for (let y = Math.floor(top / 220) * 220; y < bottom; y += 220) {
            ctx.globalAlpha = 0.2;
            ctx.strokeStyle = level.accent;
            ctx.lineWidth = 2;
            ctx.strokeRect(x + 24, y + 24, 160, 120);
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
        // Colonne di pietra soft, niente bande oro che "strobano" con la camera
        for (let x = Math.floor(left / 300) * 300; x < right; x += 300) {
          ctx.globalAlpha = 0.14;
          ctx.fillStyle = "#3a2a1c";
          ctx.fillRect(x + 54, top, 20, bottom - top);
          ctx.globalAlpha = 0.1;
          ctx.fillStyle = "#4a3a28";
          ctx.fillRect(x + 60, top, 5, bottom - top);
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
      const pulse = a.calm
        ? 0.16 + Math.sin(a.phase) * 0.05
        : 0.35 + Math.sin(a.phase) * 0.25;
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
    const calm = level.theme === "temple";
    const fever = feverTimer > 0;

    const light = ctx.createRadialGradient(px, py, 20, px, py, calm ? 180 : 220);
    light.addColorStop(0, (fever ? "#ffd700" : level.accent) + (calm ? "18" : fever ? "44" : "33"));
    light.addColorStop(0.5, (fever ? "#ffd700" : level.accent) + (calm ? "08" : fever ? "18" : "11"));
    light.addColorStop(1, "rgba(0,0,0,0)");
    ctx.fillStyle = light;
    ctx.fillRect(0, 0, W, H);

    const vig = ctx.createRadialGradient(W / 2, H / 2, H * 0.2, W / 2, H / 2, H * 0.85);
    vig.addColorStop(0, "rgba(0,0,0,0)");
    vig.addColorStop(1, calm ? "rgba(0,0,0,0.48)" : "rgba(0,0,0,0.62)");
    ctx.fillStyle = vig;
    ctx.fillRect(0, 0, W, H);

    // Gradiente profondità: nord più scuro (orizzonte lontano)
    const horizon = ctx.createLinearGradient(0, 0, 0, H * 0.45);
    horizon.addColorStop(0, "rgba(0,0,0,0.35)");
    horizon.addColorStop(1, "rgba(0,0,0,0)");
    ctx.fillStyle = horizon;
    ctx.fillRect(0, 0, W, H);

    if (fever) {
      const edge = 0.18 + Math.sin(gameTime * 0.2) * 0.08;
      ctx.strokeStyle = `rgba(255,215,0,${edge})`;
      ctx.lineWidth = 10;
      ctx.strokeRect(8, 8, W - 16, H - 16);
      ctx.fillStyle = "rgba(255,215,0,0.08)";
      ctx.fillRect(0, 0, W, H);
    }
  }

  function drawLevelBackground(level) {
    drawMenuBackground(level);
  }

  function drawAnimatedSprite(sprite, x, y, scale, facingLeft, opts = {}) {
    const bob = opts.bob || 0;
    const squash = opts.squash || 1;
    const flash = opts.flash || 0;
    const groundY = y;
    const lift = (sprite.h * scale) * 0.38;
    const drawY = DR.spriteDrawY(groundY, lift) + bob;
    const depthSc = DR.depthScaleY(groundY, WORLD_H) * (opts.depthScale || 1);

    ctx.save();
    DR.applyDepthFog(ctx, x, groundY, player.x, player.y);
    ctx.translate(x, drawY);
    ctx.scale(squash * depthSc, (2 - squash) * depthSc);
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

  function getDecorSortY(d) {
    switch (d.type) {
      case "building": return d.y + (d.h || 80);
      case "pillar": return d.y + (d.h || 80);
      case "tree": return d.y + (d.r || 20) * 0.5;
      case "crystal": return d.y;
      default: return d.y;
    }
  }

  function drawDecor(d, level) {
    if (!isOnScreen(d.x, d.y, 160)) return;
    ctx.save();
    ctx.imageSmoothingEnabled = false;
    ctx.globalAlpha = 0.92;
    DR.applyDepthFog(ctx, d.x, d.y, player.x, player.y);
    const s = DECOR_SCALE;
    const depthSc = DR.depthScaleY(d.y, WORLD_H);
    switch (d.type) {
      case "holo_ring":
        drawSpriteCentered(ctx, SPRITES.decor_holo, d.x, d.y - 8 * depthSc, s * (d.r / 18) * depthSc, false);
        break;
      case "target_marker":
        drawSpriteCentered(ctx, SPRITES.decor_target, d.x, d.y, s * (d.r / 12) * depthSc, false);
        break;
      case "building": {
        const bw = d.w || 60;
        const bh = d.h || 90;
        const dep = Math.min(36, bh * 0.28);
        DR.drawExtrudedBox(ctx, d.x + bw / 2, d.y + bh * 0.15, bw * depthSc, bh * depthSc, dep, {
          front: "#0c0620",
          top: level.accent + "44",
          side: "#08041a",
        });
        for (let wy = d.y - bh * 0.75; wy < d.y - bh * 0.1; wy += 14) {
          for (let wx = d.x + 8; wx < d.x + bw - 8; wx += 12) {
            if (((wx * 7 + wy * 13 + Math.floor(d.x)) | 0) % 3 === 0) continue;
            ctx.fillStyle = level.accent;
            ctx.globalAlpha = 0.5;
            ctx.fillRect(wx, wy, 5, 7);
          }
        }
        break;
      }
      case "neon_sign":
        drawSpriteCentered(ctx, SPRITES.decor_neon, d.x + d.w / 2, d.y - 12, s * depthSc, false);
        break;
      case "tree": {
        DR.drawGroundShadow(ctx, d.x, d.y, d.r * 0.9, { alpha: 0.28, rxMult: 1.4 });
        drawSpriteCentered(ctx, SPRITES["decor_tree" + (d.variant || 0)] || SPRITES.decor_tree0, d.x, DR.spriteDrawY(d.y, d.r * 1.2), s * (d.r / 22) * depthSc, false);
        break;
      }
      case "mushroom":
        drawSpriteCentered(ctx, SPRITES.decor_mushroom, d.x, DR.spriteDrawY(d.y, 12), s * (d.r / 8) * depthSc, false);
        break;
      case "vine":
        drawSpriteCentered(ctx, SPRITES.decor_vine, d.x, d.y + d.h / 2 - 8, s * depthSc, false);
        break;
      case "pillar":
        DR.drawExtrudedPillar(ctx, d.x + 12, d.y + 8, 22 * depthSc, (d.h || 80) * depthSc, "#5a4a30");
        break;
      case "torch":
        drawSpriteCentered(ctx, SPRITES.decor_torch, d.x, DR.spriteDrawY(d.y, 18), s * depthSc, false);
        break;
      case "stalactite":
        drawSpriteCentered(ctx, SPRITES.decor_stalactite, d.x, d.h / 2, s * (d.h / 40) * depthSc, false);
        break;
      case "lava_pool":
        DR.drawGroundShadow(ctx, d.x, d.y, d.r, { alpha: 0.5, ryMult: 0.55 });
        drawSpriteCentered(ctx, SPRITES.decor_lava, d.x, d.y, s * (d.r / 14) * depthSc, false);
        break;
      case "rune":
        drawSpriteCentered(ctx, SPRITES.decor_rune, d.x, d.y - 4, s * (d.r / 12) * depthSc, false);
        break;
      case "portal":
        drawSpriteCentered(ctx, SPRITES.decor_portal, d.x, DR.spriteDrawY(d.y, 24), s * (d.r / 16) * depthSc, false);
        break;
      case "crater":
        DR.drawGroundShadow(ctx, d.x, d.y, d.r * 1.1, { alpha: 0.45 });
        drawSpriteCentered(ctx, SPRITES.decor_crater, d.x, d.y, s * (d.r / 16) * depthSc, false);
        break;
      case "moon_flag":
        drawSpriteCentered(ctx, SPRITES.decor_flag, d.x, DR.spriteDrawY(d.y, 28), s * depthSc, false);
        break;
      case "ruin":
        DR.drawExtrudedBox(ctx, d.x + d.w / 2, d.y + d.h * 0.2, d.w * depthSc, d.h * depthSc, 14, {
          front: "#3a2540", top: "#4a3550", side: "#2a1830",
        });
        break;
      case "fog_patch":
        ctx.globalAlpha = 0.35;
        drawSpriteCentered(ctx, SPRITES.decor_fog, d.x, d.y, s * (d.r / 18) * depthSc, false);
        break;
      case "crystal":
        DR.drawCrystal3D(ctx, d.x, d.y, (d.h || 30) * depthSc, level.accent);
        break;
      case "star_altar":
        DR.drawExtrudedBox(ctx, d.x, d.y + 8, 40 * depthSc, 18 * depthSc, 10, {
          front: level.accent + "aa", top: level.accent, side: "#333",
        });
        break;
      case "moon_rock":
        DR.drawGroundShadow(ctx, d.x, d.y, d.r);
        drawSpriteCentered(ctx, SPRITES.decor_rock, d.x, d.y - d.r * 0.2, s * (d.r / 14) * depthSc, false);
        break;
      case "lunar_spire":
        DR.drawExtrudedPillar(ctx, d.x, d.y, 18 * depthSc, (d.h || 50) * depthSc, "#6a6a75");
        break;
      case "grass":
        drawSpriteCentered(ctx, SPRITES.decor_grass || SPRITES.decor_vine, d.x, d.y, s * 0.9 * depthSc, false);
        break;
      case "bush":
        DR.drawGroundShadow(ctx, d.x, d.y, 14);
        drawSpriteCentered(ctx, SPRITES.decor_bush || SPRITES.decor_tree0, d.x, DR.spriteDrawY(d.y, 16), s * 0.7 * depthSc, false);
        break;
      case "flower":
        drawSpriteCentered(ctx, SPRITES.decor_flower || SPRITES.decor_mushroom, d.x, d.y - 4, s * depthSc, false);
        break;
      case "fern":
        drawSpriteCentered(ctx, SPRITES.decor_fern || SPRITES.decor_vine, d.x, d.y, s * depthSc, false);
        break;
      case "crate":
        DR.drawExtrudedBox(ctx, d.x, d.y + 4, 28 * depthSc, 24 * depthSc, 10, {
          front: "#6a5030", top: "#8a7050", side: "#4a3820",
        });
        break;
      case "barrel":
        DR.drawExtrudedPillar(ctx, d.x, d.y + 4, 20 * depthSc, 22 * depthSc, "#5a4030");
        break;
      case "bones":
        drawSpriteCentered(ctx, SPRITES.decor_bones || SPRITES.decor_rock, d.x, d.y, s * 0.85 * depthSc, false);
        break;
      case "lamp":
        drawSpriteCentered(ctx, SPRITES.decor_lamp || SPRITES.decor_torch, d.x, DR.spriteDrawY(d.y, 20), s * depthSc, false);
        break;
      case "debris":
        drawSpriteCentered(ctx, SPRITES.decor_debris || SPRITES.decor_rock, d.x, d.y, s * 0.85 * depthSc, false);
        break;
      case "statue":
        DR.drawExtrudedPillar(ctx, d.x, d.y + 6, 26 * depthSc, 48 * depthSc, "#7a7060");
        drawSpriteCentered(ctx, SPRITES.decor_statue || SPRITES.decor_pillar, d.x, DR.spriteDrawY(d.y, 40), s * 0.9 * depthSc, false);
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
      orbiters.forEach((o, idx) => {
        const ox = p.x + Math.cos(o.angle) * o.dist;
        const oy = p.y + Math.sin(o.angle) * o.dist;
        drawFancyShuriken(ox, oy, o.angle * 3 + idx, 8, "#d8e4ff", p.hero.accent || "#00f5ff");
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
    if (feverTimer > 0) {
      ctx.strokeStyle = `rgba(255,215,0,${0.35 + Math.sin(gameTime * 0.3) * 0.2})`;
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.arc(p.x, p.y, 40 + Math.sin(gameTime * 0.25) * 4, 0, Math.PI * 2);
      ctx.stroke();
    }
  }

  function drawEnemyWerewolfFx(e, facingLeft) {
    // Aura minacciosa + occhi brillanti
    const hostile = e.typeId === "werewolf" || e.typeId === "shadow" || e.typeId === "hunter" || e.typeId === "kitten" || e.typeId === "tabby" || e.typeId === "archer";
    if (!hostile && !e.isBoss) return;

    const pulse = 0.2 + Math.sin(gameTime * 0.2 + (e.wobblePhase || 0)) * 0.12;
    const aura = e.typeId === "shadow" ? "#aa22ff" : e.typeId === "archer" ? "#66aa22" : "#ff2200";

    ctx.globalAlpha = pulse;
    ctx.fillStyle = aura;
    ctx.fillRect(Math.round(e.x - e.size * 0.7), Math.round(e.y + e.size * 0.35), Math.round(e.size * 1.4), 4);

    // occhi luminosi sopra lo sprite
    ctx.globalAlpha = 0.55 + Math.sin(gameTime * 0.25 + e.x) * 0.25;
    ctx.fillStyle = e.typeId === "shadow" ? "#ff66ff" : "#ff3300";
    const eyeY = Math.round(e.y - 8);
    const leftEye = Math.round(e.x + (facingLeft ? 4 : -8));
    const rightEye = Math.round(e.x + (facingLeft ? -8 : 4));
    ctx.fillRect(leftEye, eyeY, 4, 3);
    ctx.fillRect(rightEye, eyeY, 4, 3);
    ctx.fillStyle = "#120000";
    ctx.fillRect(leftEye + 1, eyeY, 1, 3);
    ctx.fillRect(rightEye + 1, eyeY, 1, 3);
    ctx.globalAlpha = 1;
  }

  function drawSingleEnemy(e) {
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
      ctx.globalAlpha = 0.25 + Math.sin(gameTime * 0.12) * 0.1;
      ctx.fillStyle = "#ff2200";
      ctx.beginPath();
      ctx.arc(e.x, e.y, e.size + 18, 0, Math.PI * 2);
      ctx.fill();
      ctx.globalAlpha = 0.15;
      ctx.fillStyle = e.color;
      ctx.beginPath();
      ctx.arc(e.x, e.y, e.size + 28, 0, Math.PI * 2);
      ctx.fill();
      ctx.globalAlpha = 1;
    }

    if (e.isBounty) {
      const pulse = 0.35 + Math.sin(gameTime * 0.25) * 0.2;
      ctx.globalAlpha = pulse;
      ctx.strokeStyle = "#ff8c42";
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.arc(e.x, e.y, e.size + 16 + Math.sin(gameTime * 0.2) * 3, 0, Math.PI * 2);
      ctx.stroke();
      ctx.globalAlpha = pulse * 0.4;
      ctx.fillStyle = "#ff8c42";
      ctx.beginPath();
      ctx.arc(e.x, e.y, e.size + 10, 0, Math.PI * 2);
      ctx.fill();
      ctx.globalAlpha = 1;
      ctx.fillStyle = "#ffb07a";
      ctx.font = "bold 11px sans-serif";
      ctx.textAlign = "center";
      ctx.fillText("★ TAGLIA", e.x, e.y - e.size - 28);
    }

    const wobbleY = Math.sin(gameTime * 0.16 + (e.wobblePhase || 0)) * 1.5;
    drawEntityShadow(e.x, e.y, e.size * 0.55);
    drawAnimatedSprite(sprite, e.x, e.y + wobbleY, scale, facingLeft, {
      squash: 1 + (e.hitFlash > 0 ? 0.12 : 0),
      flash: e.hitFlash || 0,
    });
    drawEnemyWerewolfFx(e, facingLeft);

    if (!e.isBoss && e.typeName && (e.typeId === "werewolf" || e.typeId === "hunter" || e.typeId === "shadow" || e.typeId === "archer")) {
      ctx.fillStyle = "rgba(40,0,0,0.65)";
      ctx.fillRect(e.x - 42, e.y - e.size - 24, 84, 13);
      ctx.fillStyle = e.typeId === "shadow" ? "#dd66ff" : "#ff6644";
      ctx.font = "bold 9px monospace";
      ctx.textAlign = "center";
      ctx.fillText(e.typeName, e.x, e.y - e.size - 14);
    }

    if (e.isBoss) {
      const barW = 160;
      const barY = e.y - 70;
      ctx.fillStyle = "#111";
      ctx.fillRect(e.x - barW / 2, barY, barW, 10);
      ctx.fillStyle = "#333";
      ctx.fillRect(e.x - barW / 2 + 1, barY + 1, barW - 2, 8);
      ctx.fillStyle = "#ff3300";
      ctx.fillRect(e.x - barW / 2 + 1, barY + 1, (barW - 2) * (e.hp / e.maxHp), 8);
      ctx.fillStyle = "#ffccaa";
      ctx.font = "bold 11px monospace";
      ctx.textAlign = "center";
      ctx.fillText(e.name, e.x, barY - 8);
    }
  }

  function drawEnemies() {
    enemies.forEach((e) => drawSingleEnemy(e));
  }

  function buildDepthDrawQueue(level) {
    const queue = [];

    decor.forEach((d) => {
      if (!isOnScreen(d.x, d.y, 160)) return;
      queue.push({ sortY: getDecorSortY(d), draw: () => drawDecor(d, level) });
    });

    enemies.forEach((e) => {
      queue.push({ sortY: e.y, draw: () => drawSingleEnemy(e) });
    });

    pickups.forEach((p) => {
      if (!isOnScreen(p.x, p.y, 40)) return;
      queue.push({ sortY: p.y, draw: () => drawSinglePickup(p) });
    });

    xpGems.forEach((g) => {
      if (!isOnScreen(g.x, g.y, 30)) return;
      queue.push({ sortY: g.y, draw: () => drawSingleXpGem(g) });
    });

    if (player) {
      queue.push({ sortY: player.y + 1, draw: () => drawPlayer() });
    }

    drg.getDepthDrawables(ctx, camera).forEach((item) => queue.push(item));

    queue.sort((a, b) => a.sortY - b.sortY);
    return queue;
  }

  function drawSinglePickup(p) {
    const meta = PICKUP_META[p.type];
    const bob = Math.sin((p.bob || 0)) * 4;
    DR.drawGroundShadow(ctx, p.x, p.y, 14, { alpha: 0.22 });
    ctx.save();
    DR.applyDepthFog(ctx, p.x, p.y, player.x, player.y);
    ctx.globalAlpha = 0.35 + (p.life % 30) / 60;
    ctx.fillStyle = meta.color;
    ctx.beginPath();
    ctx.arc(p.x, p.y + bob - 8, 16, 0, Math.PI * 2);
    ctx.fill();
    ctx.globalAlpha = 1;
    ctx.font = "16px serif";
    ctx.textAlign = "center";
    ctx.fillText({ heal: "💚", damage: "💥", speed: "💨", magnet: "🧲" }[p.type], p.x, p.y + bob - 4);
    ctx.restore();
  }

  function drawSingleXpGem(g) {
    ctx.save();
    DR.applyDepthFog(ctx, g.x, g.y, player.x, player.y);
    const bob = Math.sin(g.phase || 0) * 3;
    ctx.fillStyle = feverTimer > 0 ? "#ffd700" : "#00f5ff";
    ctx.beginPath();
    ctx.moveTo(g.x, g.y + bob - 5);
    ctx.lineTo(g.x + 4, g.y + bob);
    ctx.lineTo(g.x, g.y + bob + 5);
    ctx.lineTo(g.x - 4, g.y + bob);
    ctx.fill();
    ctx.restore();
  }

  function drawFancyShuriken(x, y, angle, size, color, accent) {
    const blade = size || 8;
    const fill = color || "#d8e4ff";
    const glow = accent || "#9eb6ff";
    ctx.save();
    ctx.translate(x, y);
    ctx.rotate(angle || 0);
    ctx.shadowColor = glow;
    ctx.shadowBlur = blade * 1.35;
    const aura = ctx.createRadialGradient(0, 0, 0, 0, 0, blade * 1.35);
    aura.addColorStop(0, "rgba(200,220,255,0.5)");
    aura.addColorStop(1, "rgba(120,150,255,0)");
    ctx.fillStyle = aura;
    ctx.beginPath();
    ctx.arc(0, 0, blade * 1.35, 0, Math.PI * 2);
    ctx.fill();
    for (let i = 0; i < 4; i++) {
      ctx.rotate(Math.PI / 2);
      ctx.fillStyle = fill;
      ctx.beginPath();
      ctx.moveTo(0, -blade * 0.18);
      ctx.lineTo(blade, 0);
      ctx.lineTo(0, blade * 0.18);
      ctx.lineTo(-blade * 0.28, 0);
      ctx.closePath();
      ctx.fill();
      ctx.fillStyle = "rgba(60,70,100,0.45)";
      ctx.beginPath();
      ctx.moveTo(0, 0);
      ctx.lineTo(blade, 0);
      ctx.lineTo(0, blade * 0.18);
      ctx.closePath();
      ctx.fill();
    }
    ctx.fillStyle = "#1a2030";
    ctx.beginPath();
    ctx.arc(0, 0, blade * 0.28, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = "#ffffff";
    ctx.beginPath();
    ctx.arc(0, 0, blade * 0.14, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  }

  function drawFancyDart(x, y, angle, size, color) {
    const s = (size || 5) / 5;
    const bodyCol = color || "#ff69b4";
    ctx.save();
    ctx.translate(x, y);
    ctx.rotate(angle || 0);
    ctx.shadowColor = bodyCol;
    ctx.shadowBlur = 14 * s;
    const body = ctx.createLinearGradient(-10 * s, 0, 13 * s, 0);
    body.addColorStop(0, "#5a1040");
    body.addColorStop(0.45, bodyCol);
    body.addColorStop(1, "#ffe8f6");
    ctx.fillStyle = body;
    ctx.beginPath();
    ctx.moveTo(13 * s, 0);
    ctx.lineTo(-2 * s, -3.4 * s);
    ctx.lineTo(-9 * s, -1.5 * s);
    ctx.lineTo(-9 * s, 1.5 * s);
    ctx.lineTo(-2 * s, 3.4 * s);
    ctx.closePath();
    ctx.fill();
    ctx.fillStyle = "#ffb6d9";
    ctx.beginPath();
    ctx.moveTo(-6 * s, 0);
    ctx.lineTo(-12 * s, -5 * s);
    ctx.lineTo(-8.5 * s, 0);
    ctx.lineTo(-12 * s, 5 * s);
    ctx.closePath();
    ctx.fill();
    ctx.fillStyle = "#ffffff";
    ctx.globalAlpha = 0.9;
    ctx.beginPath();
    ctx.moveTo(13 * s, 0);
    ctx.lineTo(7 * s, -1.3 * s);
    ctx.lineTo(7 * s, 1.3 * s);
    ctx.closePath();
    ctx.fill();
    ctx.restore();
  }

  function drawFancyPlasma(x, y, angle, size, spin, color) {
    const s = (size || 8) / 8;
    const col = color || "#ff6347";
    const t = (spin || 0);
    ctx.save();
    ctx.translate(x, y);
    ctx.rotate(angle || 0);
    ctx.shadowColor = col;
    ctx.shadowBlur = 20 * s;
    const aura = ctx.createRadialGradient(0, 0, 0, 0, 0, 14 * s);
    aura.addColorStop(0, "rgba(255,230,160,0.95)");
    aura.addColorStop(0.4, "rgba(255,140,50,0.55)");
    aura.addColorStop(1, "rgba(255,60,20,0)");
    ctx.fillStyle = aura;
    ctx.beginPath();
    ctx.arc(0, 0, 14 * s, 0, Math.PI * 2);
    ctx.fill();
    ctx.rotate(t);
    for (let i = 0; i < 3; i++) {
      ctx.rotate((Math.PI * 2) / 3);
      ctx.fillStyle = "rgba(255,210,90,0.55)";
      ctx.beginPath();
      ctx.ellipse(6 * s, 0, 6 * s, 2.2 * s, 0, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.fillStyle = "#fff4c8";
    ctx.beginPath();
    ctx.arc(0, 0, 4.6 * s, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = "#ffffff";
    ctx.beginPath();
    ctx.arc(-1.2 * s, -1.4 * s, 1.7 * s, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  }

  function drawFancyLaserArc(p) {
    const life = p.life / (p.maxLife || 16);
    const pulse = 0.78 + Math.sin(Date.now() * 0.055) * 0.22;
    const half = (p.arc || 1.2) / 2;
    const range = p.range || 140;
    ctx.save();
    ctx.translate(p.x, p.y);
    ctx.rotate(p.angle || 0);
    ctx.globalAlpha = Math.max(0.28, life) * pulse;
    const fan = ctx.createRadialGradient(0, 0, 6, 0, 0, range);
    fan.addColorStop(0, "rgba(180,255,140,0.5)");
    fan.addColorStop(0.45, "rgba(57,255,20,0.32)");
    fan.addColorStop(1, "rgba(40,180,20,0)");
    ctx.fillStyle = fan;
    ctx.beginPath();
    ctx.moveTo(0, 0);
    ctx.arc(0, 0, range, -half, half);
    ctx.closePath();
    ctx.fill();
    ctx.strokeStyle = "#b8ff7a";
    ctx.lineWidth = 9;
    ctx.shadowColor = "#39ff14";
    ctx.shadowBlur = 24;
    ctx.lineCap = "round";
    ctx.beginPath();
    ctx.arc(0, 0, range * 0.92, -half * 0.95, half * 0.95);
    ctx.stroke();
    ctx.strokeStyle = "#ffffff";
    ctx.lineWidth = 2.8;
    ctx.shadowBlur = 10;
    ctx.globalAlpha = Math.max(0.35, life * 0.95);
    ctx.beginPath();
    ctx.arc(0, 0, range * 0.92, -half * 0.72, half * 0.72);
    ctx.stroke();
    for (const side of [-half * 0.95, half * 0.95]) {
      const sx = Math.cos(side) * range * 0.92;
      const sy = Math.sin(side) * range * 0.92;
      ctx.fillStyle = "#ffffff";
      ctx.globalAlpha = life * 0.95;
      ctx.beginPath();
      ctx.arc(sx, sy, 3.5, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.restore();
  }

  function drawFancyArcaneOrb(p) {
    const rr = Math.max(8, p.r || 8);
    const fade = Math.max(0.2, Math.min(0.9, p.life / 75));
    const pulse = 0.82 + Math.sin(Date.now() * 0.06 + (p.spin || 0)) * 0.18;
    ctx.save();
    ctx.globalAlpha = 0.2 * fade * pulse;
    const wash = ctx.createRadialGradient(p.x, p.y, rr * 0.15, p.x, p.y, rr);
    wash.addColorStop(0, "rgba(160,255,255,0.5)");
    wash.addColorStop(1, "rgba(0,180,255,0)");
    ctx.fillStyle = wash;
    ctx.beginPath();
    ctx.arc(p.x, p.y, rr, 0, Math.PI * 2);
    ctx.fill();
    ctx.globalAlpha = 0.95 * fade * pulse;
    ctx.strokeStyle = "#00f5ff";
    ctx.lineWidth = Math.max(4, 10 - rr * 0.05);
    ctx.shadowColor = "#00f5ff";
    ctx.shadowBlur = 22;
    ctx.beginPath();
    ctx.arc(p.x, p.y, rr, 0, Math.PI * 2);
    ctx.stroke();
    ctx.globalAlpha = 0.6 * fade;
    ctx.strokeStyle = "#ffffff";
    ctx.lineWidth = 2.2;
    ctx.shadowBlur = 8;
    ctx.beginPath();
    ctx.arc(p.x, p.y, Math.max(5, rr * 0.68), 0, Math.PI * 2);
    ctx.stroke();
    const ticks = 8;
    ctx.fillStyle = "#c8ffff";
    ctx.globalAlpha = 0.75 * fade;
    for (let i = 0; i < ticks; i++) {
      const a = (i / ticks) * Math.PI * 2 + (p.spin || 0) + Date.now() * 0.002;
      ctx.beginPath();
      ctx.arc(p.x + Math.cos(a) * rr, p.y + Math.sin(a) * rr, 2.6, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.restore();
  }

  function drawProjectiles() {
    projectiles.forEach((p) => {
      if (p.trail && p.trail.length) {
        p.trail.forEach((t) => {
          t.life--;
          const a = (t.life / 16) * 0.5;
          const r = (t.size || 3) * (0.4 + (t.life / 16) * 0.7);
          ctx.save();
          ctx.globalAlpha = Math.max(0, a);
          if (p.type === "shuriken") {
            ctx.fillStyle = "#b8c8e8";
            ctx.beginPath();
            ctx.arc(t.x, t.y, r * 0.65, 0, Math.PI * 2);
            ctx.fill();
          } else if (p.type === "dart") {
            ctx.fillStyle = "#ff69b4";
            ctx.beginPath();
            ctx.arc(t.x, t.y, r * 0.55, 0, Math.PI * 2);
            ctx.fill();
          } else if (p.type === "plasma") {
            const g = ctx.createRadialGradient(t.x, t.y, 0, t.x, t.y, r * 1.5);
            g.addColorStop(0, "rgba(255,210,90,0.85)");
            g.addColorStop(1, "rgba(255,80,30,0)");
            ctx.fillStyle = g;
            ctx.beginPath();
            ctx.arc(t.x, t.y, r * 1.5, 0, Math.PI * 2);
            ctx.fill();
          }
          ctx.restore();
        });
        p.trail = p.trail.filter((t) => t.life > 0);
      }

      if (p.type === "arc_slash") {
        drawFancyLaserArc(p);
        return;
      }
      if (p.type === "arcane_orb") {
        drawFancyArcaneOrb(p);
        return;
      }
      if (p.type === "shuriken") {
        drawFancyShuriken(p.x, p.y, p.spin || 0, (p.size || 7) + 2, "#e8eefc", "#9eb6ff");
      } else if (p.type === "dart") {
        const ang = p.spin != null ? p.spin : Math.atan2(p.vy || 0, p.vx || 1);
        drawFancyDart(p.x, p.y, ang, p.size || 5, "#ff69b4");
      } else if (p.type === "plasma") {
        drawFancyPlasma(p.x, p.y, Math.atan2(p.vy || 0, p.vx || 1), p.size || 8, p.spin || 0, "#ff6347");
      }
    });
    ctx.globalAlpha = 1;
    ctx.shadowBlur = 0;
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

  function drawPickupIcon(type, x, y, color) {
    ctx.fillStyle = color;
    if (type === "heal") {
      // croce medica
      ctx.fillRect(x - 2, y - 8, 4, 16);
      ctx.fillRect(x - 8, y - 2, 16, 4);
      ctx.fillStyle = "#fff";
      ctx.fillRect(x - 1, y - 6, 2, 12);
      ctx.fillRect(x - 6, y - 1, 12, 2);
    } else if (type === "damage") {
      // lama / potenza
      ctx.fillRect(x - 2, y - 9, 4, 14);
      ctx.fillRect(x - 5, y + 4, 10, 3);
      ctx.fillStyle = "#fff";
      ctx.fillRect(x - 1, y - 7, 2, 8);
    } else if (type === "speed") {
      // freccia / boost
      ctx.fillRect(x - 7, y - 1, 10, 3);
      ctx.beginPath();
      ctx.moveTo(x + 4, y - 6);
      ctx.lineTo(x + 10, y);
      ctx.lineTo(x + 4, y + 6);
      ctx.closePath();
      ctx.fill();
      ctx.fillStyle = "#fff";
      ctx.fillRect(x - 5, y, 7, 1);
    } else if (type === "magnet") {
      // calamita a U
      ctx.fillRect(x - 8, y - 7, 5, 14);
      ctx.fillRect(x + 3, y - 7, 5, 14);
      ctx.fillRect(x - 8, y + 4, 16, 5);
      ctx.fillStyle = "#ff3355";
      ctx.fillRect(x - 8, y - 7, 5, 5);
      ctx.fillStyle = "#4488ff";
      ctx.fillRect(x + 3, y - 7, 5, 5);
    }
  }

  function drawPickups() {
    pickups.forEach((p) => {
      const meta = PICKUP_META[p.type];
      const bobY = Math.sin(p.bob || 0) * 3;
      const x = Math.round(p.x);
      const y = Math.round(p.y + bobY);
      const pulse = 0.55 + (Math.sin((p.life || 0) * 0.18) + 1) * 0.2;

      // alone di raccolta
      ctx.globalAlpha = 0.18 * pulse;
      ctx.fillStyle = meta.color;
      ctx.beginPath();
      ctx.arc(x, y, 28, 0, Math.PI * 2);
      ctx.fill();

      // base
      ctx.globalAlpha = 0.9;
      ctx.fillStyle = "rgba(8,10,18,0.85)";
      ctx.fillRect(x - 16, y - 16, 32, 32);
      ctx.strokeStyle = meta.color;
      ctx.lineWidth = 2;
      ctx.strokeRect(x - 16, y - 16, 32, 32);

      ctx.globalAlpha = 1;
      drawPickupIcon(p.type, x, y, meta.color);

      // etichetta chiara
      ctx.font = "bold 11px sans-serif";
      ctx.textAlign = "center";
      ctx.lineWidth = 3;
      ctx.strokeStyle = "rgba(0,0,0,0.85)";
      ctx.fillStyle = meta.color;
      ctx.strokeText(meta.label, x, y - 24);
      ctx.fillText(meta.label, x, y - 24);
      ctx.font = "9px sans-serif";
      ctx.fillStyle = "#e8e8e8";
      ctx.strokeText(meta.hint, x, y + 30);
      ctx.fillText(meta.hint, x, y + 30);
    });
    ctx.globalAlpha = 1;
    ctx.textAlign = "left";
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
    ctx.fillText(`${player.hero.name}  ·  Lv.${player.level}`, 14, 38);

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

    // Combo / Fever: un solo pannello chiaro con timer
    if (combo >= 2 || feverTimer > 0) {
      ctx.textAlign = "left";
      const cx = 14;
      const cy = 70;
      const boxH = feverTimer > 0 ? 48 : 36;
      ctx.fillStyle = "rgba(0,0,0,0.55)";
      ctx.fillRect(cx, cy, 176, boxH);
      if (feverTimer > 0) {
        ctx.fillStyle = "#ffd700";
        ctx.font = "bold 13px sans-serif";
        ctx.fillText(`FEVER ${Math.ceil(feverTimer / 60)}s`, cx + 8, cy + 16);
        ctx.fillStyle = "#ffe8a0";
        ctx.font = "12px sans-serif";
        ctx.fillText(`Combo x${combo}  ·  XP x${getComboMult().toFixed(1)}`, cx + 8, cy + 32);
        ctx.fillStyle = "#554400";
        ctx.fillRect(cx + 8, cy + 38, 160, 5);
        ctx.fillStyle = "#ffd700";
        ctx.fillRect(cx + 8, cy + 38, 160 * (feverTimer / FEVER_DURATION), 5);
      } else {
        ctx.fillStyle = styleFlash > 0 ? "#fff0a0" : "#ffcc66";
        ctx.font = "bold 13px sans-serif";
        ctx.fillText(`COMBO x${combo}`, cx + 8, cy + 16);
        ctx.fillStyle = "#443300";
        ctx.fillRect(cx + 8, cy + 24, 160, 5);
        ctx.fillStyle = "#ffcc66";
        ctx.fillRect(cx + 8, cy + 24, 160 * Math.max(0, comboTimer / COMBO_WINDOW), 5);
      }
    }

    // Bounty arrow — arancione (diverso dal Fever oro)
    const bounty = enemies.find((e) => e.isBounty);
    if (bounty) {
      const sx = bounty.x - camera.x;
      const sy = bounty.y - camera.y;
      if (sx < 20 || sx > W - 20 || sy < 70 || sy > H - 20) {
        const ax = Math.max(24, Math.min(W - 24, sx));
        const ay = Math.max(74, Math.min(H - 24, sy));
        ctx.fillStyle = "#ff8c42";
        ctx.beginPath();
        ctx.moveTo(ax, ay - 8);
        ctx.lineTo(ax + 7, ay + 5);
        ctx.lineTo(ax - 7, ay + 5);
        ctx.closePath();
        ctx.fill();
      }
    }

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
    if (pendingLevelUps > 0) {
      ctx.fillStyle = "#00f5ff";
      ctx.font = "bold 14px sans-serif";
      ctx.fillText(`Ancora ${pendingLevelUps} scelt${pendingLevelUps === 1 ? "a" : "e"} in coda — poi riparti`, W / 2, 112);
    }

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

    // Scala contenuti al riquadro grande
    const logoSize = Math.min(260, Math.floor(H * 0.28));
    const titleY = Math.floor(H * 0.42);
    drawGameLogo(W / 2, Math.floor(H * 0.22), logoSize);

    ctx.fillStyle = `rgba(0,245,255,${0.55 + Math.sin(titlePulse) * 0.3})`;
    ctx.font = `bold ${Math.max(42, Math.floor(W * 0.035))}px sans-serif`;
    ctx.textAlign = "center";
    ctx.fillText("Alieni Ninja", W / 2, titleY);

    ctx.fillStyle = "#e8e8ff";
    ctx.font = `${Math.max(16, Math.floor(W * 0.014))}px sans-serif`;
    const lines = [
      "Survivor tattico stile Deep Rock Galactic!",
      "Estrai cristalli · Sopravvivi · Elimina l'elite.",
      "Raccogli Oro e Nitra al bar tra i settori.",
      "", "Recupera la Lancia delle Stelle!",
    ];
    const lineStart = titleY + Math.floor(H * 0.06);
    const lineStep = Math.max(26, Math.floor(H * 0.035));
    lines.forEach((line, i) => {
      if (!line) return;
      ctx.fillText(line, W / 2, lineStart + i * lineStep);
    });

    ctx.fillStyle = "#b026ff";
    ctx.font = `${Math.max(17, Math.floor(W * 0.015))}px sans-serif`;
    ctx.fillText("Tocca lo schermo per iniziare", W / 2, H - Math.max(40, H * 0.06));
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

  function drawWeaponPreview(weapon, cx, cy, boxW, boxH, color, accent, t) {
    const left = cx - boxW / 2;
    const top = cy - boxH / 2;
    ctx.save();
    ctx.beginPath();
    ctx.rect(left, top, boxW, boxH);
    ctx.clip();

    // sfondo ben visibile
    ctx.fillStyle = "rgba(0,0,0,0.72)";
    ctx.fillRect(left, top, boxW, boxH);
    ctx.strokeStyle = accent;
    ctx.lineWidth = 2;
    ctx.strokeRect(left + 1, top + 1, boxW - 2, boxH - 2);

    ctx.fillStyle = accent;
    ctx.font = "bold 10px sans-serif";
    ctx.textAlign = "left";
    ctx.fillText("ATTACCO", left + 8, top + 14);

    // mini ninja
    const hx = left + boxW * 0.26;
    const hy = cy + 4;
    ctx.fillStyle = color;
    ctx.fillRect(hx - 6, hy - 8, 12, 16);
    ctx.fillStyle = "#fff";
    ctx.fillRect(hx - 3, hy - 5, 2, 2);
    ctx.fillRect(hx + 1, hy - 5, 2, 2);

    // mini bersaglio
    const ex = left + boxW * 0.78;
    const ey = cy + 4 + Math.sin(t * 0.05) * 2;
    ctx.fillStyle = "#a06030";
    ctx.fillRect(ex - 8, ey - 8, 16, 16);
    ctx.fillStyle = "#ff4422";
    ctx.fillRect(ex - 3, ey - 3, 6, 6);

    const phase = (t % 90) / 90;

    if (weapon === "orbit_shuriken") {
      for (let i = 0; i < 3; i++) {
        const a = t * 0.14 + i * (Math.PI * 2 / 3);
        const r = 18;
        const x = hx + Math.cos(a) * r;
        const y = hy + Math.sin(a) * r;
        drawFancyShuriken(x, y, a * 3 + i, 6, "#e8eefc", accent);
      }
    } else if (weapon === "laser_arc") {
      const sweep = -0.2 + phase * 0.4;
      drawFancyLaserArc({
        x: hx, y: hy,
        angle: sweep,
        arc: 1.35,
        range: 28,
        life: 14,
        maxLife: 16,
      });
    } else if (weapon === "plasma_burst") {
      for (let i = 0; i < 3; i++) {
        const p = (phase + i * 0.28) % 1;
        const x = hx + (ex - hx) * p;
        const y = hy + Math.sin(p * Math.PI) * -8;
        drawFancyPlasma(x, y, 0, 5 + p * 4, t * 0.2 + i, accent);
      }
    } else if (weapon === "homing_dart") {
      for (let i = 0; i < 2; i++) {
        const p = (phase + i * 0.45) % 1;
        const curve = Math.sin(p * Math.PI) * (i === 0 ? 14 : -14);
        const x = hx + (ex - hx) * p;
        const y = hy + curve * (1 - p);
        const ang = Math.atan2(ey - y, ex - x);
        drawFancyDart(x, y, ang, 4.2, accent);
      }
    } else if (weapon === "arcane_wave") {
      const p = phase;
      const r = 8 + p * 36;
      drawFancyArcaneOrb({
        x: hx, y: hy,
        r,
        life: Math.max(8, 75 * (1 - p)),
        spin: t * 0.05,
      });
      const p2 = (phase + 0.45) % 1;
      const r2 = 8 + p2 * 36;
      drawFancyArcaneOrb({
        x: hx, y: hy,
        r: r2,
        life: Math.max(8, 55 * (1 - p2)),
        spin: t * 0.05 + 1.2,
      });
    }

    ctx.restore();
  }

  function drawSelect() {
    drawMenuBackground(LEVELS[0]);
    drawGameLogo(70, 44, 52);
    ctx.fillStyle = "#00f5ff";
    ctx.font = "bold 24px sans-serif";
    ctx.textAlign = "center";
    ctx.fillText("Scegli il tuo Ninja", W / 2, 34);
    ctx.fillStyle = "#9ab";
    ctx.font = "13px sans-serif";
    ctx.fillText("Sotto ogni eroe c’è l’attacco animato — così capisci cosa scegli", W / 2, 56);

    const layout = getSelectLayout();

    HEROES.forEach((h, i) => {
      const r = getHeroCardRect(i);
      const x = r.x;
      const y = r.y;
      const cardW = r.w;
      const cardH = r.h;

      ctx.fillStyle = "rgba(12,16,40,0.94)";
      ctx.strokeStyle = h.color;
      ctx.lineWidth = 2;
      ctx.fillRect(x, y, cardW, cardH);
      ctx.strokeRect(x, y, cardW, cardH);

      // Sprite piccolo, ritagliato in alto (non copre l'anteprima)
      const spriteAreaH = 78;
      ctx.save();
      ctx.beginPath();
      ctx.rect(x + 6, y + 6, cardW - 12, spriteAreaH);
      ctx.clip();
      const spriteScale = Math.min(1.05, (spriteAreaH - 8) / (SPRITES[h.id].h || 72));
      drawSpriteCentered(ctx, SPRITES[h.id], x + cardW / 2, y + 6 + spriteAreaH / 2, spriteScale, false);
      ctx.restore();

      // Anteprima attacco ben separata
      drawWeaponPreview(
        h.weapon,
        x + cardW / 2,
        y + 128,
        cardW - 18,
        68,
        h.color,
        h.accent,
        gameTime + i * 17
      );

      const textTop = y + 178;
      ctx.textAlign = "center";
      ctx.fillStyle = h.color;
      ctx.font = "bold 17px sans-serif";
      ctx.fillText(`${i + 1}. ${h.name}`, x + cardW / 2, textTop);

      ctx.fillStyle = h.accent;
      ctx.font = "bold 12px sans-serif";
      ctx.fillText(`⚔ ${h.weaponName}`, x + cardW / 2, textTop + 20);

      ctx.fillStyle = "#aaa";
      ctx.font = "11px sans-serif";
      wrapSelectText(h.desc, x + 12, textTop + 40, cardW - 24, 14);

      ctx.fillStyle = "#777";
      ctx.font = "11px sans-serif";
      ctx.fillText(`HP ${h.hp}  ·  SPD ${h.speed}`, x + cardW / 2, y + cardH - 12);
    });
  }

  function wrapSelectText(text, x, y, maxW, lineH) {
    const words = String(text || "").split(" ");
    let line = "";
    let yy = y;
    let lines = 0;
    ctx.textAlign = "center";
    const cx = x + maxW / 2;
    for (let i = 0; i < words.length; i++) {
      const test = line ? `${line} ${words[i]}` : words[i];
      if (ctx.measureText(test).width > maxW && line) {
        ctx.fillText(line, cx, yy);
        line = words[i];
        yy += lineH;
        lines++;
        if (lines >= 2) {
          ctx.fillText(line.length > 28 ? line.slice(0, 26) + "…" : line, cx, yy);
          return;
        }
      } else {
        line = test;
      }
    }
    if (line) ctx.fillText(line, cx, yy);
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

    // Cielo parallax (schermo, prima del mondo)
    if (DR && DR.drawParallaxSkyScreen) {
      DR.drawParallaxSkyScreen(ctx, level, camera.x, camera.y, W, H);
    }

    ctx.save();
    ctx.imageSmoothingEnabled = false;
    ctx.translate(-Math.floor(camera.x + shake.x), -Math.floor(camera.y + shake.y));

    drawWorldBackground(level);
    drawAmbience(level);

    // Y-sort 2.5D: decor, nemici, pickup, XP e player per profondità
    buildDepthDrawQueue(level).forEach((item) => item.draw());

    drawShockwaves();
    drawWaves();
    drawParticles();
    drawProjectiles();
    drawEnemyShots();
    drawFloatTexts();

    ctx.restore();
    drawScreenFX(level);
    drawCrosshair();
    drawHUD();
    drg.drawHUD(ctx, W);
    drawLevelBanner();
  }

  function drawResumePause() {
    drawPlaying();

    ctx.fillStyle = "rgba(0,0,0,0.42)";
    ctx.fillRect(0, 0, W, H);

    const secs = Math.max(1, Math.ceil(resumePauseTimer / 60));
    ctx.textAlign = "center";
    ctx.fillStyle = "#ffd700";
    ctx.font = "bold 26px sans-serif";
    ctx.fillText(isTouchDevice ? "Riposiziona le dita" : "Di nuovo in azione", W / 2, H * 0.38);
    ctx.fillStyle = "#e8e8e8";
    ctx.font = "16px sans-serif";
    if (lastPickedUpgrade) {
      ctx.fillText(`${lastPickedUpgrade.icon || "✨"} ${lastPickedUpgrade.name}`, W / 2, H * 0.38 + 36);
    }
    if (isTouchDevice) {
      ctx.fillStyle = "#00f5ff";
      ctx.font = "bold 48px sans-serif";
      ctx.fillText(String(secs), W / 2, H * 0.38 + 96);
      ctx.fillStyle = "#aaa";
      ctx.font = "14px sans-serif";
      ctx.fillText("Il gioco riparte tra un attimo…", W / 2, H * 0.38 + 126);
      drawJoyGhost(touchJoyAnchors.move, "rgba(0,245,255,0.35)");
      drawJoyGhost(touchJoyAnchors.aim, "rgba(255,120,80,0.35)");
      drawJoy(moveJoy, "rgba(0,245,255,0.7)");
      drawJoy(aimJoy, "rgba(255,120,80,0.75)");
    } else {
      ctx.fillStyle = "#aaa";
      ctx.font = "14px sans-serif";
      ctx.fillText("Spazio per saltare", W / 2, H * 0.38 + 70);
    }
  }

  function update() {
    gameTime++;
    DR.setGameTime(gameTime);
    if (state === STATE.PLAYING) updatePlaying();
    if (state === STATE.LEVEL_INTRO && introTimer > 0) introTimer--;
    if (state === STATE.RESUME_PAUSE) {
      if (resumePauseTimer > 0) resumePauseTimer--;
      else {
        lastPickedUpgrade = null;
        state = STATE.PLAYING;
        tryOpenLevelUp();
      }
    }
  }

  function draw() {
    switch (state) {
      case STATE.TITLE: drawTitle(); break;
      case STATE.STORY: drawStory(); break;
      case STATE.SELECT: drawSelect(); break;
      case STATE.LEVEL_INTRO: drawLevelIntro(); break;
      case STATE.PLAYING: drawPlaying(); break;
      case STATE.LEVEL_UP: drawLevelUp(); break;
      case STATE.RESUME_PAUSE: drawResumePause(); break;
      case STATE.LEVEL_CLEAR: drawLevelClear(); break;
      case STATE.SHOP: drawShop(); break;
      case STATE.OVERCLOCK: drawOverclock(); break;
      case STATE.GAME_OVER: drawGameOver(); break;
      case STATE.VICTORY: drawVictory(); break;
    }
  }

  function drawShop() {
    drg.drawShop(ctx, W, H, LEVELS[currentLevel], player);
  }

  function drawOverclock() {
    drg.drawOverclock(ctx, W, H);
  }

  function loop() {
    update();
    draw();
    requestAnimationFrame(loop);
  }

  drg.bind({
    get player() { return player; },
    get enemies() { return enemies; },
    worldW: WORLD_W,
    worldH: WORLD_H,
    viewW: W,
    viewH: H,
    get currentLevel() { return currentLevel; },
    levelCount: LEVELS.length,
    get state() { return state; },
    addFloatText,
    addBurst,
    addScreenShake,
    spawnEnemy,
    nearestEnemy,
    nearestEnemies,
    hurtEnemy,
    getDamage,
    addProjectile: (p) => projectiles.push(p),
    addWave: (x, y, maxR, damage, color) => {
      waves.push({ x, y, r: 8, maxR, expand: 6, damage, color, life: 22, hit: new Set() });
    },
    showBanner: (title, subtitle, accent) => {
      levelBanner = { title, subtitle, life: 140, maxLife: 140, accent: accent || "#ff8c00" };
    },
    setState: (s) => {
      if (s === "shop") state = STATE.SHOP;
      else if (s === "victory") state = STATE.VICTORY;
      else if (s === "playing") state = STATE.PLAYING;
    },
    advanceSector: () => {
      drg.consumeNitraBuff();
      advanceWorldContinuous();
    },
  });

  loop();
})();
