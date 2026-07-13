(() => {
  "use strict";

  const canvas = document.getElementById("game-canvas");
  const ctx = canvas.getContext("2d");
  const W = canvas.width;
  const H = canvas.height;
  const WORLD_W = 9600;
  const WORLD_H = 7200;
  const { SPRITES, drawSpriteCentered, PX } = window.PixelSprites;

  const ENEMY_TYPES = {
    kitten:   { id: "kitten",   sprite: "cat_kitten",   name: "Gattino Mannaro", hpMult: 0.55, speedMult: 0.5,  damage: 2, size: 12, xp: 2, weight: 40 },
    tabby:    { id: "tabby",    sprite: "cat_tabby",    name: "Gatto Tigrato",   hpMult: 0.9,  speedMult: 0.65, damage: 3, size: 14, xp: 3, weight: 35 },
    hunter:   { id: "hunter",   sprite: "cat_hunter",   name: "Cacciatore",      hpMult: 0.75, speedMult: 0.85, damage: 4, size: 15, xp: 4, weight: 22 },
    werewolf: { id: "werewolf", sprite: "cat_werewolf", name: "Gatto Mannaro",   hpMult: 1.6,  speedMult: 0.55, damage: 6, size: 18, xp: 7, weight: 18 },
    shadow:   { id: "shadow",   sprite: "cat_shadow",   name: "Ombra Felina",    hpMult: 0.5,  speedMult: 1.0,  damage: 5, size: 13, xp: 5, weight: 12 },
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
      hp: 100,
      baseDamage: 10,
      baseCooldown: 72,
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
      hp: 110,
      baseDamage: 14,
      baseCooldown: 65,
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
      hp: 160,
      baseDamage: 18,
      baseCooldown: 95,
      baseArea: 1.2,
      baseAmount: 1,
    },
    {
      id: "nia",
      name: "Nia",
      color: "#c0c0c0",
      accent: "#ff69b4",
      emoji: "🎯",
      desc: "Dardi verso il cursore con auto-mira",
      weapon: "homing_dart",
      weaponName: "Dardi Cercatori",
      speed: 2.3,
      hp: 85,
      baseDamage: 8,
      baseCooldown: 42,
      baseArea: 1,
      baseAmount: 2,
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
      hp: 90,
      baseDamage: 12,
      baseCooldown: 78,
      baseArea: 1.15,
      baseAmount: 1,
    },
  ];

  const POWERUP_POOL = [
    { id: "potenza", name: "Potenza", desc: "Danno +12%", max: 5, icon: "💥" },
    { id: "celerita", name: "Celerità", desc: "Attacco +10% veloce", max: 5, icon: "⚡" },
    { id: "quantita", name: "Quantità", desc: "+1 proiettile/colpo", max: 4, icon: "🔢" },
    { id: "area", name: "Area", desc: "Raggio attacco +15%", max: 4, icon: "🌀" },
    { id: "velocita", name: "Agilità", desc: "Movimento +8%", max: 4, icon: "💨" },
    { id: "cuore", name: "Cuore Alieno", desc: "HP massimi +25", max: 5, icon: "💚" },
    { id: "magnete", name: "Magnete XP", desc: "Raggio raccolta +35%", max: 3, icon: "🧲" },
    { id: "rigenerazione", name: "Rigenerazione", desc: "+0.4 HP/frame", max: 3, icon: "♻️" },
  ];

  const WEAPON_UPGRADES = {
    orbit_shuriken: { name: "Shuriken Affilati", desc: "Orbitanti +1, danno +15%" },
    laser_arc: { name: "Spada Estesa", desc: "Arco più ampio, danno +15%" },
    plasma_burst: { name: "Plasma Concentrato", desc: "Esplosione più grande, danno +20%" },
    homing_dart: { name: "Dardi Veloci", desc: "+1 dardo, cadenza +10%" },
    arcane_wave: { name: "Onda Potenziata", desc: "Onde +1, raggio +20%" },
  };

  const LEVELS = [
    {
      name: "Addestramento",
      theme: "training",
      story: "Campo olografico di addestramento. Sopravvivi 45 secondi ai gatti mannari simulati.",
      bg: ["#0d1b2a", "#1b263b"],
      floor: "#152238",
      accent: "#00f5ff",
      duration: 45 * 60,
      spawnRate: 150,
      enemyHp: 25,
      enemySpeed: 0.55,
      boss: null,
      fragment: false,
    },
    {
      name: "Città Alienigena",
      theme: "alien_city",
      story: "Grattacieli neon sotto assedio. Resisti 50 secondi nell'area urbana.",
      bg: ["#1a0a2e", "#2d1b4e"],
      floor: "#1e1040",
      accent: "#b026ff",
      duration: 50 * 60,
      spawnRate: 135,
      enemyHp: 35,
      enemySpeed: 0.65,
      boss: null,
      fragment: false,
    },
    {
      name: "Bosco Infestato",
      theme: "forest",
      story: "Un bosco bioluminescente infestato. Sopravvivi 55 secondi tra gli alberi.",
      bg: ["#0a1f0a", "#1a3a1a"],
      floor: "#0f2a12",
      accent: "#39ff14",
      duration: 55 * 60,
      spawnRate: 125,
      enemyHp: 40,
      enemySpeed: 0.72,
      boss: null,
      fragment: false,
    },
    {
      name: "Tempio Antico",
      theme: "temple",
      story: "Pilastri millenari e torce aliene. Sconfiggi il Custode delle Stelle.",
      bg: ["#2a1a0a", "#4a3020"],
      floor: "#3a2818",
      accent: "#ffd700",
      duration: 60 * 60,
      spawnRate: 115,
      enemyHp: 45,
      enemySpeed: 0.78,
      boss: { name: "Custode delle Stelle", hp: 350, speed: 0.7, size: 38, color: "#ffd700", sprite: "cat_boss" },
      fragment: true,
    },
    {
      name: "Sottomondo Felino",
      theme: "underworld",
      story: "Gallerie laviche e cristalli rossi. Affronta la Matrona degli Arcani.",
      bg: ["#1a0a0a", "#3a1515"],
      floor: "#2a1010",
      accent: "#ff4466",
      duration: 60 * 60,
      spawnRate: 110,
      enemyHp: 50,
      enemySpeed: 0.82,
      boss: { name: "Matrona degli Arcani", hp: 400, speed: 0.75, size: 36, color: "#ff4466", sprite: "cat_boss" },
      fragment: true,
    },
    {
      name: "Tempio delle Stelle",
      theme: "star_temple",
      story: "Portali dimensionali e rune stellari. Batti il Guardiano Dimensionale.",
      bg: ["#0a0a2a", "#1a1a5a"],
      floor: "#12124a",
      accent: "#7b68ee",
      duration: 65 * 60,
      spawnRate: 105,
      enemyHp: 55,
      enemySpeed: 0.86,
      boss: { name: "Guardiano Dimensionale", hp: 450, speed: 0.8, size: 40, color: "#7b68ee", sprite: "cat_boss" },
      fragment: true,
    },
    {
      name: "Battaglia sulla Luna",
      theme: "moon",
      story: "Crateri e cielo stellato. Il Drago Stellare attacca dalla superficie lunare.",
      bg: ["#1a1a2a", "#2a2a4a"],
      floor: "#3a3a4a",
      accent: "#ff6347",
      duration: 65 * 60,
      spawnRate: 100,
      enemyHp: 60,
      enemySpeed: 0.88,
      boss: { name: "Drago Stellare", hp: 500, speed: 0.65, size: 44, color: "#ff6347", sprite: "cat_boss" },
      fragment: true,
    },
    {
      name: "Città Maledetta",
      theme: "cursed_city",
      story: "Rovine corrotte e nebbia viola. Il Signore del Caos domina le strade.",
      bg: ["#1a0a1a", "#3a1a3a"],
      floor: "#2a1530",
      accent: "#9400d3",
      duration: 70 * 60,
      spawnRate: 95,
      enemyHp: 65,
      enemySpeed: 0.92,
      boss: { name: "Signore del Caos", hp: 520, speed: 0.85, size: 42, color: "#9400d3", sprite: "cat_boss" },
      fragment: true,
    },
    {
      name: "Rifugio delle Stelle",
      theme: "star_refuge",
      story: "Cristalli di luce e energia cosmica. La Matriarca del Mondo Felino attende.",
      bg: ["#0a1a2a", "#1a3a5a"],
      floor: "#102840",
      accent: "#ff8c00",
      duration: 70 * 60,
      spawnRate: 90,
      enemyHp: 70,
      enemySpeed: 0.95,
      boss: { name: "Matriarca del Mondo Felino", hp: 550, speed: 0.88, size: 40, color: "#ff8c00", sprite: "cat_boss" },
      fragment: true,
    },
    {
      name: "Confronto Finale",
      theme: "final",
      story: "La Luna. Il Re dei Gatti Mannari e il Guardiano dell'Universo proteggono la Lancia.",
      bg: ["#0a0a1a", "#1a0a2a"],
      floor: "#2a2a35",
      accent: "#ff2200",
      duration: 75 * 60,
      spawnRate: 85,
      enemyHp: 75,
      enemySpeed: 0.98,
      boss: { name: "Re dei Gatti Mannari", hp: 600, speed: 0.72, size: 46, color: "#ff2200", sprite: "cat_boss" },
      finalBoss: { name: "Guardiano dell'Universo", hp: 400, speed: 0.9, size: 42, color: "#00f5ff", sprite: "cat_boss" },
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
  let particles = [];
  let xpGems = [];
  let pickups = [];
  let waves = [];
  let orbiters = [];
  let decor = [];
  let levelTimer = 0;
  let spawnTimer = 0;
  let pickupTimer = 0;
  let bossSpawned = false;
  let finalBossSpawned = false;
  let bossPhase = false;
  let kills = 0;
  let camera = { x: 0, y: 0 };

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

  const joy = { active: false, id: null, ox: 0, oy: 0, x: 0, y: 0 };

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
    if (!joy.active) return;
    const dx = joy.x - joy.ox;
    const dy = joy.y - joy.oy;
    const t = 14;
    if (dy < -t) keys.KeyW = true;
    if (dy > t) keys.KeyS = true;
    if (dx < -t) keys.KeyA = true;
    if (dx > t) keys.KeyD = true;
  }

  canvas.addEventListener("touchstart", (e) => {
    e.preventDefault();
    for (const t of e.changedTouches) {
      const c = canvasCoords(t);
      if (c.x < W * 0.42 && c.y > H * 0.45 && !joy.active) {
        joy.active = true;
        joy.id = t.identifier;
        joy.ox = c.x;
        joy.oy = c.y;
        joy.x = c.x;
        joy.y = c.y;
      }
      mouse.screenX = c.x;
      mouse.screenY = c.y;
    }
  }, { passive: false });

  canvas.addEventListener("touchmove", (e) => {
    e.preventDefault();
    for (const t of e.changedTouches) {
      const c = canvasCoords(t);
      if (joy.active && t.identifier === joy.id) {
        joy.x = c.x;
        joy.y = c.y;
      } else {
        mouse.screenX = c.x;
        mouse.screenY = c.y;
      }
    }
  }, { passive: false });

  canvas.addEventListener("touchend", (e) => {
    for (const t of e.changedTouches) {
      if (joy.active && t.identifier === joy.id) {
        joy.active = false;
        joy.id = null;
      }
    }
  });

  canvas.addEventListener("touchcancel", (e) => {
    for (const t of e.changedTouches) {
      if (joy.active && t.identifier === joy.id) {
        joy.active = false;
        joy.id = null;
      }
    }
  });

  function updateMouseWorld() {
    mouse.worldX = mouse.screenX + camera.x;
    mouse.worldY = mouse.screenY + camera.y;
  }

  function getAimAngle() {
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
    };
  }

  function selectHero(idx) {
    selectedHero = HEROES[idx];
    currentLevel = 0;
    fragments = 0;
    state = STATE.LEVEL_INTRO;
    introTimer = 150;
    initLevel(true);
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
    xpGems = [];
    pickups = [];
    waves = [];
    orbiters = [];
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
        upgrades: {},
        xp: 0,
        level: 1,
        xpToNext: 8,
        tempBuff: 0,
        tempSpeed: 0,
      };
    } else {
      player.x = WORLD_W / 2;
      player.y = WORLD_H / 2;
      player.invulnerable = 60;
    }

    camera.x = player.x - W / 2;
    camera.y = player.y - H / 2;

    enemies = [];
    projectiles = [];
    particles = [];
    xpGems = [];
    pickups = [];
    waves = [];
    orbiters = initOrbiters();
    decor = generateDecor(level.theme);
    levelTimer = level.duration;
    spawnTimer = 30;
    pickupTimer = 600;
    bossSpawned = false;
    finalBossSpawned = false;
    bossPhase = false;
    kills = 0;
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
    const count = { training: 80, alien_city: 70, forest: 110, temple: 60, underworld: 90,
      star_temple: 80, moon: 100, cursed_city: 90, star_refuge: 95, final: 70 };
    const n = count[theme] || 30;

    switch (theme) {
      case "training":
        for (let i = 0; i < n; i++) items.push({ type: "holo_ring", x: rnd(WORLD_W), y: rnd(WORLD_H), r: 15 + rnd(25) });
        break;
      case "alien_city":
        for (let i = 0; i < n; i++) {
          const windows = [];
          for (let wy = 0; wy < 5; wy++) for (let wx = 0; wx < 3; wx++) windows.push(Math.random() > 0.4);
          items.push({ type: "building", x: rnd(WORLD_W), y: rnd(WORLD_H), w: 50 + rnd(50), h: 70 + rnd(90), windows });
        }
        break;
      case "forest":
        for (let i = 0; i < n; i++) items.push({ type: "tree", x: rnd(WORLD_W), y: rnd(WORLD_H), r: 18 + rnd(28) });
        break;
      case "temple":
        for (let i = 0; i < n; i++) items.push({ type: "pillar", x: rnd(WORLD_W), y: rnd(WORLD_H), h: 80 + rnd(100) });
        break;
      case "underworld":
        for (let i = 0; i < n; i++) items.push({ type: "stalactite", x: rnd(WORLD_W), y: rnd(WORLD_H * 0.4), h: 25 + rnd(55) });
        break;
      case "star_temple":
        for (let i = 0; i < n; i++) items.push({ type: "rune", x: rnd(WORLD_W), y: rnd(WORLD_H), r: 10 + rnd(18) });
        break;
      case "moon":
        for (let i = 0; i < n; i++) items.push({ type: "crater", x: rnd(WORLD_W), y: rnd(WORLD_H), r: 12 + rnd(35) });
        break;
      case "cursed_city":
        for (let i = 0; i < n; i++) items.push({ type: "ruin", x: rnd(WORLD_W), y: rnd(WORLD_H), w: 25 + rnd(55), h: 18 + rnd(45) });
        break;
      case "star_refuge":
        for (let i = 0; i < n; i++) items.push({ type: "crystal", x: rnd(WORLD_W), y: rnd(WORLD_H), h: 18 + rnd(45) });
        break;
      case "final":
        for (let i = 0; i < n; i++) items.push({ type: "moon_rock", x: rnd(WORLD_W), y: rnd(WORLD_H), r: 12 + rnd(30) });
        break;
    }
    return items;
  }

  function updateCamera() {
    const tx = player.x - W / 2;
    const ty = player.y - H / 2;
    camera.x += (tx - camera.x) * 0.08;
    camera.y += (ty - camera.y) * 0.08;
    camera.x = Math.max(0, Math.min(WORLD_W - W, camera.x));
    camera.y = Math.max(0, Math.min(WORLD_H - H, camera.y));
  }

  function isOnScreen(wx, wy, margin = 80) {
    return wx > camera.x - margin && wx < camera.x + W + margin &&
           wy > camera.y - margin && wy < camera.y + H + margin;
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
    introTimer = 150;
    initLevel(false);
  }

  function getCooldown() {
    return Math.max(12, Math.floor(player.hero.baseCooldown * player.stats.cooldownMult));
  }

  function getDamage(mult = 1) {
    const buff = player.tempBuff > 0 ? 1.4 : 1;
    return player.stats.damage * mult * buff * (1 + (player.stats.weaponLevel - 1) * 0.12);
  }

  function nearestEnemy() {
    let best = null;
    let bestDist = Infinity;
    enemies.forEach((e) => {
      const d = Math.hypot(e.x - player.x, e.y - player.y);
      if (d < bestDist) { bestDist = d; best = e; }
    });
    return best;
  }

  function nearestEnemies(count) {
    return [...enemies]
      .map((e) => ({ e, d: Math.hypot(e.x - player.x, e.y - player.y) }))
      .sort((a, b) => a.d - b.d)
      .slice(0, count)
      .map((x) => x.e);
  }

  function pickEnemyType() {
    const level = LEVELS[currentLevel];
    const progress = 1 - levelTimer / level.duration;
    const pool = [];

    const add = (id, w) => {
      const t = ENEMY_TYPES[id];
      if (t) pool.push({ type: t, weight: w });
    };

    if (progress < 0.25) {
      add("kitten", 55); add("tabby", 45);
    } else if (progress < 0.5) {
      add("kitten", 30); add("tabby", 40); add("hunter", 20); add("werewolf", 10);
    } else if (progress < 0.75) {
      add("tabby", 25); add("hunter", 30); add("werewolf", 25); add("shadow", 20);
    } else {
      add("hunter", 20); add("werewolf", 35); add("shadow", 30); add("tabby", 15);
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
            e.hp -= getDamage(1.2);
            addParticles(e.x, e.y, "#39ff14", 4);
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
          });
        }
        addParticles(player.x, player.y, "#ffd700", 8);
        break;
      }
      case "homing_dart": {
        for (let i = 0; i < amount; i++) {
          const spread = (i - (amount - 1) / 2) * 0.1;
          const angle = aim + spread;
          const target = nearestEnemy();
          projectiles.push({
            x: player.x, y: player.y,
            vx: Math.cos(angle) * (projSpeed + 1),
            vy: Math.sin(angle) * (projSpeed + 1),
            damage: getDamage(),
            type: "dart",
            life: 75,
            homing: !!target,
            target: target || null,
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
            vx: Math.cos(angle) * 3,
            vy: Math.sin(angle) * 3,
            damage: getDamage(),
            type: "arcane_orb",
            life: 90,
            expand: 2.5 * area,
            maxR: 50 * area,
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
      enemies.forEach((e) => {
        if (Math.hypot(e.x - ox, e.y - oy) < e.size + 8) {
          e.hp -= getDamage(0.3);
        }
      });
    });
  }

  function spawnEnemy(isBoss = false, bossData = null) {
    const level = LEVELS[currentLevel];

    if (isBoss && bossData) {
      enemies.push({
        x: player.x,
        y: Math.max(80, player.y - 220),
        hp: bossData.hp, maxHp: bossData.hp,
        speed: bossData.speed, size: bossData.size,
        color: bossData.color, isBoss: true, name: bossData.name,
        sprite: bossData.sprite || "cat_boss",
        damage: 8,
      });
      addParticles(player.x, player.y - 220, bossData.color, 25);
      bossPhase = true;
      return;
    }

    const angle = Math.random() * Math.PI * 2;
    const dist = Math.max(W, H) * 0.52 + 50 + Math.random() * 100;
    let x = player.x + Math.cos(angle) * dist;
    let y = player.y + Math.sin(angle) * dist;
    x = Math.max(50, Math.min(WORLD_W - 50, x));
    y = Math.max(50, Math.min(WORLD_H - 50, y));

    const etype = pickEnemyType();
    const scale = 1 + (level.duration - levelTimer) / level.duration * 0.4;
    enemies.push({
      x, y,
      hp: Math.floor(level.enemyHp * etype.hpMult * scale),
      maxHp: Math.floor(level.enemyHp * etype.hpMult * scale),
      speed: level.enemySpeed * etype.speedMult * (0.92 + Math.random() * 0.16),
      size: etype.size,
      color: "#cc8844",
      isBoss: false,
      typeId: etype.id,
      typeName: etype.name,
      sprite: etype.sprite,
      damage: etype.damage,
      xp: etype.xp,
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
    xpGems.push({ x, y, value: amount, vx: (Math.random() - 0.5) * 2, vy: (Math.random() - 0.5) * 2 });
  }

  function applyPowerUp(choice) {
    if (!choice) return;
    const up = player.upgrades;
    up[choice.id] = (up[choice.id] || 0) + 1;

    switch (choice.id) {
      case "potenza": player.stats.damage *= 1.12; break;
      case "celerita": player.stats.cooldownMult *= 0.9; break;
      case "quantita": player.stats.amount += 1; orbiters = initOrbiters(); break;
      case "area": player.stats.area *= 1.15; orbiters = initOrbiters(); break;
      case "velocita": player.stats.speed *= 1.08; break;
      case "cuore": player.maxHp += 25; player.hp = Math.min(player.hp + 25, player.maxHp); break;
      case "magnete": player.stats.magnet *= 1.35; break;
      case "rigenerazione": player.stats.regen += 0.4; break;
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
      if ((owned[p.id] || 0) < p.max) pool.push({ ...p, kind: "passive" });
    });

    const wUp = WEAPON_UPGRADES[player.hero.weapon];
    if (player.stats.weaponLevel < 5) {
      pool.push({ id: "weapon_up", name: wUp.name, desc: wUp.desc, icon: "🗡️", kind: "weapon" });
    }

    levelUpChoices = [];
    const shuffled = pool.sort(() => Math.random() - 0.5);
    for (let i = 0; i < Math.min(3, shuffled.length); i++) {
      levelUpChoices.push(shuffled[i]);
    }

    levelUpSelected = 0;
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
    for (let i = 0; i < count; i++) {
      const a = Math.random() * Math.PI * 2;
      const s = 1 + Math.random() * 3;
      particles.push({ x, y, vx: Math.cos(a) * s, vy: Math.sin(a) * s, life: 25 + Math.random() * 15, color, size: 2 + Math.random() * 3 });
    }
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

    updateCamera();

    if (player.invulnerable > 0) player.invulnerable--;
    if (player.tempBuff > 0) player.tempBuff--;
    if (player.tempSpeed > 0) player.tempSpeed--;
    if (player.stats.regen > 0 && player.hp < player.maxHp) {
      player.hp = Math.min(player.maxHp, player.hp + player.stats.regen);
    }

    player.weaponTimer--;
    if (player.weaponTimer <= 0) {
      autoAttack();
      player.weaponTimer = getCooldown();
    }

    updateOrbiters();

    if (!bossPhase) {
      levelTimer--;
      if (spawnTimer > 0) spawnTimer--;
      else {
        spawnEnemy();
        const rate = Math.max(60, level.spawnRate - Math.floor((level.duration - levelTimer) / 90));
        spawnTimer = rate;
      }
    }

    if (!bossSpawned && levelTimer <= 0 && level.boss) {
      spawnEnemy(true, level.boss);
      bossSpawned = true;
    } else if (!bossSpawned && levelTimer <= 0 && !level.boss) {
      state = STATE.LEVEL_CLEAR;
      return;
    }

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
            e.hp -= p.damage * 0.35;
            addParticles(e.x, e.y, "#00f5ff", 3);
          }
        });
        return;
      }
      if (p.homing && p.target && enemies.includes(p.target)) {
        const angle = Math.atan2(p.target.y - p.y, p.target.x - p.x);
        p.vx = Math.cos(angle) * 6.5;
        p.vy = Math.sin(angle) * 6.5;
      }
      p.x += p.vx;
      p.y += p.vy;
      p.life--;
      enemies.forEach((e) => {
        const hitR = (p.size || 5) + e.size * 0.5;
        if (p.life > 0 && Math.hypot(p.x - e.x, p.y - e.y) < hitR) {
          e.hp -= p.damage;
          if (!p.piercing) p.life = 0;
          addParticles(e.x, e.y, e.color, 3);
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
            e.hp -= w.damage;
            addParticles(e.x, e.y, w.color, 4);
          }
        });
      }
      w.life--;
    });
    waves = waves.filter((w) => w.life > 0);

    enemies.forEach((e) => {
      const angle = Math.atan2(player.y - e.y, player.x - e.x);
      e.x += Math.cos(angle) * e.speed;
      e.y += Math.sin(angle) * e.speed;
      if (Math.hypot(player.x - e.x, player.y - e.y) < e.size + 14 && player.invulnerable <= 0) {
        const dmg = e.isBoss ? 8 : (e.damage || 3);
        player.hp -= dmg;
        player.invulnerable = 25;
        addParticles(player.x, player.y, "#ff0000", 6);
      }
    });

    const dead = enemies.filter((e) => e.hp <= 0);
    dead.forEach((e) => {
      addParticles(e.x, e.y, e.color, e.isBoss ? 35 : 8);
      kills++;
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
          state = STATE.LEVEL_CLEAR;
        }
      }
    });
    enemies = enemies.filter((e) => e.hp > 0);

    xpGems.forEach((g) => {
      g.x += g.vx;
      g.y += g.vy;
      g.vx *= 0.9;
      g.vy *= 0.9;
      const dist = Math.hypot(player.x - g.x, player.y - g.y);
      if (dist < player.stats.magnet) {
        const a = Math.atan2(player.y - g.y, player.x - g.x);
        g.x += Math.cos(a) * 4;
        g.y += Math.sin(a) * 4;
      }
      if (dist < 18) {
        addXp(g.value);
        g.collected = true;
        addParticles(g.x, g.y, "#00f5ff", 4);
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

    particles.forEach((p) => { p.x += p.vx; p.y += p.vy; p.life--; p.vx *= 0.94; p.vy *= 0.94; });
    particles = particles.filter((p) => p.life > 0);

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
    ctx.fillStyle = level.bg[0];
    ctx.fillRect(0, 0, WORLD_W, WORLD_H);

    ctx.fillStyle = level.floor;
    ctx.globalAlpha = 0.4;
    for (let x = 0; x < WORLD_W; x += 64) {
      for (let y = 0; y < WORLD_H; y += 64) {
        if ((x / 64 + y / 64) % 2 === 0) ctx.fillRect(x, y, 64, 64);
      }
    }
    ctx.globalAlpha = 1;

    ctx.strokeStyle = level.accent;
    ctx.lineWidth = 6;
    ctx.globalAlpha = 0.25;
    ctx.strokeRect(30, 30, WORLD_W - 60, WORLD_H - 60);
    ctx.globalAlpha = 1;
  }

  function drawLevelBackground(level) {
    drawMenuBackground(level);
  }

  function drawDecor(d, level) {
    if (!isOnScreen(d.x, d.y, 120)) return;
    ctx.save();
    ctx.globalAlpha = 0.35;
    switch (d.type) {
      case "holo_ring":
        ctx.strokeStyle = level.accent;
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.arc(d.x, d.y, d.r, 0, Math.PI * 2);
        ctx.stroke();
        break;
      case "building":
        ctx.fillStyle = "#0a0520";
        ctx.fillRect(d.x, d.y, d.w, d.h);
        if (d.windows) {
          let idx = 0;
          for (let wy = d.y + 10; wy < d.y + d.h - 10; wy += 18) {
            for (let wx = d.x + 8; wx < d.x + d.w - 8; wx += 14) {
              ctx.fillStyle = d.windows[idx++] ? level.accent : "#1a1040";
              ctx.globalAlpha = 0.6;
              ctx.fillRect(wx, wy, 8, 10);
            }
          }
        }
        break;
      case "tree":
        ctx.fillStyle = "#0a3a0a";
        ctx.beginPath();
        ctx.arc(d.x, d.y, d.r, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = "#2a1a0a";
        ctx.fillRect(d.x - 4, d.y, 8, d.r);
        break;
      case "pillar":
        ctx.fillStyle = "#5a4a30";
        ctx.fillRect(d.x, d.y, 20, d.h);
        ctx.fillStyle = level.accent;
        ctx.globalAlpha = 0.5;
        ctx.fillRect(d.x - 2, d.y, 24, 8);
        break;
      case "stalactite":
        ctx.fillStyle = "#4a2020";
        ctx.beginPath();
        ctx.moveTo(d.x, 0);
        ctx.lineTo(d.x - 8, d.h);
        ctx.lineTo(d.x + 8, d.h);
        ctx.fill();
        break;
      case "rune":
        ctx.strokeStyle = level.accent;
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.arc(d.x, d.y, d.r, 0, Math.PI * 2);
        ctx.stroke();
        ctx.fillStyle = level.accent;
        ctx.font = "14px serif";
        ctx.fillText("✦", d.x - 5, d.y + 5);
        break;
      case "crater":
        ctx.fillStyle = "#2a2a35";
        ctx.beginPath();
        ctx.arc(d.x, d.y, d.r, 0, Math.PI * 2);
        ctx.fill();
        ctx.strokeStyle = "#4a4a55";
        ctx.stroke();
        break;
      case "ruin":
        ctx.fillStyle = "#3a2540";
        ctx.fillRect(d.x, d.y, d.w, d.h);
        break;
      case "crystal":
        ctx.fillStyle = level.accent;
        ctx.beginPath();
        ctx.moveTo(d.x, d.y - d.h);
        ctx.lineTo(d.x - 8, d.y);
        ctx.lineTo(d.x + 8, d.y);
        ctx.fill();
        break;
      case "moon_rock":
        ctx.fillStyle = "#4a4a55";
        ctx.beginPath();
        ctx.arc(d.x, d.y, d.r, 0, Math.PI * 2);
        ctx.fill();
        break;
    }
    ctx.restore();
  }

  function drawPlayer() {
    const p = player;
    const facingLeft = Math.cos(p.aimAngle) < 0;

    if (p.hero.weapon === "orbit_shuriken") {
      orbiters.forEach((o) => {
        const ox = p.x + Math.cos(o.angle) * o.dist;
        const oy = p.y + Math.sin(o.angle) * o.dist;
        ctx.fillStyle = p.hero.accent;
        ctx.beginPath();
        ctx.moveTo(ox, oy - 7);
        ctx.lineTo(ox + 6, oy);
        ctx.lineTo(ox, oy + 7);
        ctx.lineTo(ox - 6, oy);
        ctx.fill();
      });
    }

    drawSpriteCentered(ctx, SPRITES[p.hero.id], p.x, p.y, PX, facingLeft);

    if (p.invulnerable > 0 && p.invulnerable % 6 < 3) {
      ctx.strokeStyle = "#fff";
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.arc(p.x, p.y, 30, 0, Math.PI * 2);
      ctx.stroke();
    }
  }

  function drawEnemies() {
    enemies.forEach((e) => {
      if (!isOnScreen(e.x, e.y, 80)) return;
      const spriteKey = e.sprite || (e.isBoss ? "cat_boss" : "cat_tabby");
      const sprite = SPRITES[spriteKey] || SPRITES.cat_tabby;
      const scale = e.isBoss ? PX + 2 : PX;
      const facingLeft = e.x > player.x;
      drawSpriteCentered(ctx, sprite, e.x, e.y, scale, facingLeft);

      if (e.isBoss) {
        const barW = 140;
        ctx.fillStyle = "#222";
        ctx.fillRect(e.x - barW / 2, e.y - 55, barW, 8);
        ctx.fillStyle = e.color;
        ctx.fillRect(e.x - barW / 2, e.y - 55, barW * (e.hp / e.maxHp), 8);
        ctx.fillStyle = "#fff";
        ctx.font = "bold 11px monospace";
        ctx.textAlign = "center";
        ctx.fillText(e.name, e.x, e.y - 64);
      }
    });
  }

  function drawProjectiles() {
    const colors = { shuriken: "#c0c0c0", dart: "#ff69b4", plasma: "#ff6347", laser: "#39ff14" };
    projectiles.forEach((p) => {
      if (p.type === "arc_slash") {
        ctx.save();
        ctx.translate(p.x, p.y);
        ctx.rotate(p.angle);
        ctx.strokeStyle = "rgba(57,255,20,0.75)";
        ctx.lineWidth = 5;
        ctx.beginPath();
        ctx.arc(0, 0, p.range, -p.arc / 2, p.arc / 2);
        ctx.stroke();
        ctx.restore();
        return;
      }
      if (p.type === "arcane_orb") {
        ctx.strokeStyle = "rgba(0,245,255,0.6)";
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
        ctx.stroke();
        ctx.fillStyle = "rgba(0,245,255,0.25)";
        ctx.fill();
        return;
      }
      const r = p.size || 5;
      ctx.fillStyle = colors[p.type] || "#fff";
      ctx.beginPath();
      ctx.arc(p.x, p.y, r, 0, Math.PI * 2);
      ctx.fill();
    });
  }

  function drawCrosshair() {
    if (joy.active) {
      const maxR = 50;
      const dx = Math.max(-maxR, Math.min(maxR, joy.x - joy.ox));
      const dy = Math.max(-maxR, Math.min(maxR, joy.y - joy.oy));
      ctx.fillStyle = "rgba(255,255,255,0.15)";
      ctx.beginPath();
      ctx.arc(joy.ox, joy.oy, 55, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = "rgba(0,245,255,0.5)";
      ctx.beginPath();
      ctx.arc(joy.ox + dx, joy.oy + dy, 22, 0, Math.PI * 2);
      ctx.fill();
    }
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
      ctx.fillStyle = "#00f5ff";
      ctx.beginPath();
      ctx.moveTo(g.x, g.y - 5);
      ctx.lineTo(g.x + 4, g.y);
      ctx.lineTo(g.x, g.y + 5);
      ctx.lineTo(g.x - 4, g.y);
      ctx.fill();
    });
  }

  function drawPickups() {
    const icons = { heal: "💚", damage: "💥", speed: "💨", magnet: "🧲" };
    const colors = { heal: "#39ff14", damage: "#ff6347", speed: "#00f5ff", magnet: "#ffd700" };
    pickups.forEach((p) => {
      ctx.fillStyle = colors[p.type];
      ctx.globalAlpha = 0.3 + (p.life % 30) / 60;
      ctx.beginPath();
      ctx.arc(p.x, p.y, 16, 0, Math.PI * 2);
      ctx.fill();
      ctx.globalAlpha = 1;
      ctx.font = "16px serif";
      ctx.textAlign = "center";
      ctx.fillText(icons[p.type], p.x, p.y + 5);
    });
  }

  function drawParticles() {
    particles.forEach((p) => {
      ctx.globalAlpha = p.life / 35;
      ctx.fillStyle = p.color;
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
      ctx.fill();
    });
    ctx.globalAlpha = 1;
  }

  function drawHUD() {
    const level = LEVELS[currentLevel];
    ctx.fillStyle = "rgba(0,0,0,0.6)";
    ctx.fillRect(0, 0, W, 56);

    ctx.fillStyle = level.accent;
    ctx.font = "bold 15px sans-serif";
    ctx.textAlign = "left";
    ctx.fillText(`${level.name}`, 14, 20);
    ctx.fillStyle = "#aaa";
    ctx.font = "12px sans-serif";
    ctx.fillText(`${player.hero.name} | Lv.${player.level} | Uccisi: ${kills}`, 14, 38);

    const secs = Math.max(0, Math.ceil(levelTimer / 60));
    ctx.textAlign = "center";
    ctx.fillStyle = bossPhase ? "#ff4444" : "#fff";
    ctx.font = "bold 14px sans-serif";
    ctx.fillText(bossPhase ? "⚔️ FASE BOSS" : `⏱ ${secs}s`, W / 2, 22);

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
    ctx.fillText("WASD muovi | Mouse mira | Armi automatiche verso il cursore", W / 2, H - 8);
  }

  function drawLevelUp() {
    ctx.fillStyle = "#000";
    ctx.fillRect(0, 0, W, H);

    ctx.save();
    ctx.translate(-Math.floor(camera.x), -Math.floor(camera.y));
    drawWorldBackground(LEVELS[currentLevel]);
    decor.forEach((d) => drawDecor(d, LEVELS[currentLevel]));
    drawEnemies();
    drawPlayer();
    ctx.restore();

    ctx.fillStyle = "rgba(0,0,0,0.75)";
    ctx.fillRect(0, 0, W, H);

    ctx.fillStyle = "#ffd700";
    ctx.font = "bold 32px sans-serif";
    ctx.textAlign = "center";
    ctx.fillText(`LEVEL UP! — Livello ${player.level}`, W / 2, 80);

    levelUpChoices.forEach((c, i) => {
      const y = 180 + i * 110;
      const selected = i === levelUpSelected;
      ctx.fillStyle = selected ? "rgba(176,38,255,0.4)" : "rgba(20,20,50,0.8)";
      ctx.strokeStyle = selected ? "#b026ff" : "#444";
      ctx.lineWidth = selected ? 3 : 1;
      ctx.fillRect(W / 2 - 280, y - 40, 560, 90);
      ctx.strokeRect(W / 2 - 280, y - 40, 560, 90);

      ctx.font = "28px serif";
      ctx.fillText(c.icon || "✨", W / 2 - 240, y + 5);
      ctx.fillStyle = selected ? "#fff" : "#ccc";
      ctx.font = "bold 18px sans-serif";
      ctx.textAlign = "left";
      ctx.fillText(`${i + 1}. ${c.name}`, W / 2 - 190, y - 8);
      ctx.fillStyle = "#888";
      ctx.font = "14px sans-serif";
      ctx.fillText(c.desc, W / 2 - 190, y + 18);
    });

    ctx.fillStyle = "#aaa";
    ctx.textAlign = "center";
    ctx.font = "14px sans-serif";
    ctx.fillText("↑↓ seleziona — INVIO / 1-3 per scegliere il power-up", W / 2, H - 40);
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

  function drawTitle() {
    drawTextScreen("Ninja Alieni vs Gatti Mannari", [
      "Sopravvivi alle orde di Gatti Mannari!",
      "Muoviti, le armi attaccano da sole.",
      "Raccogli XP, potenzia il tuo ninja.",
      "", "Recupera la Lancia delle Stelle!",
    ], "INVIO per iniziare");
  }

  function drawStory() {
    drawTextScreen("La Trama", [
      "Zara, Kael, Vex, Nia e Ryn — l'élite ninja aliena.",
      "I Gatti Mannari invadono il pianeta.",
      "Attraversa 10 location fino alla Luna.",
      "Ogni arma è unica. Ogni livello ha il suo boss.",
    ], "INVIO per scegliere l'eroe");
  }

  function drawSelect() {
    drawMenuBackground(LEVELS[0]);
    ctx.fillStyle = "#00f5ff";
    ctx.font = "bold 26px sans-serif";
    ctx.textAlign = "center";
    ctx.fillText("Scegli il tuo Ninja — Sprite pixel unici", W / 2, 45);
    ctx.fillStyle = "#888";
    ctx.font = "13px sans-serif";
    ctx.fillText("Premi 1-5 | Mondo 9600×7200 | Mouse per mirare", W / 2, 72);

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

      drawSpriteCentered(ctx, SPRITES[h.id], cx - cw / 2 + 50, cy - 10, PX + 1, false);

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
      level.boss ? `Boss: ${level.boss.name}` : `Sopravvivi ${Math.ceil(level.duration / 60)} secondi`,
    ], introTimer > 0 ? "..." : "INVIO per iniziare");
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
    ctx.fillText("INVIO — prossimo livello", W / 2, H / 2 + 75);
  }

  function drawGameOver() {
    drawTextScreen("Game Over", [
      `${selectedHero?.name} è caduto.`,
      `Hai raggiunto il livello ${player?.level || 1}.`,
      "I Gatti Mannari dominano ancora...",
    ], "INVIO per riprovare");
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
    ctx.fillText("INVIO — menu principale", W / 2, H - 50);
  }

  function drawPlaying() {
    const level = LEVELS[currentLevel];

    ctx.fillStyle = "#000";
    ctx.fillRect(0, 0, W, H);

    ctx.save();
    ctx.translate(-Math.floor(camera.x), -Math.floor(camera.y));

    drawWorldBackground(level);
    decor.forEach((d) => drawDecor(d, level));
    drawWaves();
    drawXpGems();
    drawPickups();
    drawParticles();
    drawProjectiles();
    drawEnemies();
    drawPlayer();

    ctx.restore();
    drawCrosshair();
    drawHUD();
  }

  function update() {
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
