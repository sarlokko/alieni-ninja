(() => {
  "use strict";

  const CFG = window.DRGConfig;
  const PHASE = CFG.MISSION_PHASE;
  const UI = CFG.UI;

  let game = null;
  let phase = PHASE.DEPLOY;
  let deployTimer = 180;
  let threatLevel = 1;
  let threatTimer = 0;
  let gold = 0;
  let nitra = 0;
  let resourceNodes = [];
  let secondaryWeapons = [];
  let maxSecondarySlots = 1;
  let shopPurchases = {};
  let nitraBuff = 0;
  let hordeWarning = 0;
  let hordeMessage = "";
  let extractionPod = null;
  let extractionProgress = 0;
  let eliteSpawned = false;
  let sectorComplete = false;
  let shopSelected = 0;
  let overclockPending = null;

  function bind(g) {
    game = g;
  }

  function resetRun() {
    gold = 0;
    nitra = 0;
    secondaryWeapons = [];
    maxSecondarySlots = 1;
    shopPurchases = {};
    nitraBuff = 0;
    overclockPending = null;
    resetLevel();
  }

  function resetLevel() {
    phase = PHASE.DEPLOY;
    deployTimer = 180;
    threatLevel = 1;
    threatTimer = 0;
    hordeWarning = 0;
    hordeMessage = "";
    extractionPod = null;
    extractionProgress = 0;
    eliteSpawned = false;
    sectorComplete = false;
    resourceNodes = generateResourceNodes();
  }

  function generateResourceNodes() {
    const nodes = [];
    const n = CFG.MINING.nodeCount;
    for (let i = 0; i < n; i++) {
      const isNitra = Math.random() < 0.22;
      nodes.push({
        x: 120 + Math.random() * (game.worldW - 240),
        y: 120 + Math.random() * (game.worldH - 240),
        type: isNitra ? "nitra" : "gold",
        progress: 0,
        mined: false,
        pulse: Math.random() * Math.PI * 2,
      });
    }
    return nodes;
  }

  function getPhase() { return phase; }
  function getGold() { return gold; }
  function getNitra() { return nitra; }
  function getThreatLevel() { return threatLevel; }
  function isExtraction() { return phase === PHASE.EXTRACTION; }
  function isDeploy() { return phase === PHASE.DEPLOY; }
  function isShopOpen() { return game && game.state === "shop"; }

  function spawnExtractionPod() {
    const angle = Math.random() * Math.PI * 2;
    const dist = 180 + Math.random() * 220;
    extractionPod = {
      x: Math.max(100, Math.min(game.worldW - 100, game.player.x + Math.cos(angle) * dist)),
      y: Math.max(100, Math.min(game.worldH - 100, game.player.y + Math.sin(angle) * dist)),
    };
    extractionProgress = 0;
    phase = PHASE.EXTRACTION;
    game.showBanner("CAPSULA DI ESTRAZIONE", "Raggiungi il punto arancione e resta nella zona!", UI.orange);
    game.addScreenShake(10);
  }

  function onBossKilled() {
    if (sectorComplete) return;
    sectorComplete = true;
    gold += CFG.ELITE.goldDrop;
    spawnExtractionPod();
  }

  function update() {
    if (!game || game.state !== "playing") return;

    if (phase === PHASE.DEPLOY) {
      deployTimer--;
      if (deployTimer <= 0) {
        phase = PHASE.SURVIVE;
        game.showBanner("MINING & SURVIVE", "Estrai cristalli · Sopravvivi · Elimina l'elite", UI.cyan);
      }
      return;
    }

    updateThreat();
    updateMining();
    updateSecondaryWeapons();
    updateExtraction();
  }

  function updateThreat() {
    if (phase === PHASE.EXTRACTION) return;
    threatTimer++;
    if (threatTimer >= CFG.THREAT.intervalFrames) {
      threatTimer = 0;
      if (threatLevel < CFG.THREAT.maxLevel) {
        threatLevel++;
        hordeWarning = 180;
        hordeMessage = CFG.HORDE_MESSAGES[Math.floor(Math.random() * CFG.HORDE_MESSAGES.length)];
        game.showBanner(`THREAT LV.${threatLevel}`, hordeMessage.replace("⚠ ", ""), UI.red);
        for (let i = 0; i < 2 + threatLevel; i++) game.spawnEnemy(false, null, { near: true });
      }
    }
    if (hordeWarning > 0) hordeWarning--;
  }

  function getThreatSpawnBonus() {
    return (threatLevel - 1) * CFG.THREAT.spawnReduction;
  }

  function getThreatHpMult() {
    return 1 + (threatLevel - 1) * CFG.THREAT.hpBonusPerLevel;
  }

  function updateMining() {
    const p = game.player;
    const radius = CFG.MINING.mineRadius;
    resourceNodes.forEach((node) => {
      if (node.mined) return;
      node.pulse += 0.06;
      const dist = Math.hypot(p.x - node.x, p.y - node.y);
      if (dist < radius) {
        node.progress += CFG.MINING.mineSpeed;
        if (node.progress >= 1) {
          node.mined = true;
          if (node.type === "gold") {
            gold += CFG.MINING.goldValue;
            game.addFloatText(node.x, node.y - 20, `+${CFG.MINING.goldValue} Oro`, UI.gold);
          } else {
            nitra += CFG.MINING.nitraValue;
            game.addFloatText(node.x, node.y - 20, `+${CFG.MINING.nitraValue} Nitra`, UI.nitra);
          }
          game.addBurst(node.x, node.y, node.type === "gold" ? UI.cyan : UI.nitra, 14, "spark");
        }
      } else {
        node.progress = Math.max(0, node.progress - 0.004);
      }
    });
  }

  function addSecondaryWeapon(id) {
    const def = CFG.SECONDARY_WEAPONS.find((w) => w.id === id);
    if (!def) return false;
    const existing = secondaryWeapons.find((w) => w.id === id);
    if (existing) {
      if (existing.level < def.maxLevel) existing.level++;
      return true;
    }
    if (secondaryWeapons.length >= maxSecondarySlots) return false;
    secondaryWeapons.push({ id, level: 1, timer: 0, def });
    return true;
  }

  function updateSecondaryWeapons() {
    if (phase === PHASE.DEPLOY) return;
    const p = game.player;
    secondaryWeapons.forEach((w) => {
      w.timer--;
      if (w.timer > 0) return;
      const lv = w.level;
      const d = w.def;
      switch (w.id) {
        case "plasma_turret": {
          const targets = game.nearestEnemies(Math.min(d.amount + lv - 1, 5));
          targets.forEach((e, i) => {
            const angle = Math.atan2(e.y - p.y, e.x - p.x) + (i - targets.length / 2) * 0.08;
            game.addProjectile({
              x: p.x, y: p.y,
              vx: Math.cos(angle) * 6,
              vy: Math.sin(angle) * 6,
              damage: game.getDamage(d.damage * (1 + lv * 0.1)),
              type: "plasma",
              life: 55,
              size: 7,
            });
          });
          w.timer = Math.max(30, d.cooldown - lv * 4);
          break;
        }
        case "star_grenade": {
          const target = game.nearestEnemy();
          const tx = target ? target.x : p.x + Math.cos(p.aimAngle) * 120;
          const ty = target ? target.y : p.y + Math.sin(p.aimAngle) * 120;
          game.addWave(tx, ty, d.area + lv * 8, game.getDamage(d.damage * (1 + lv * 0.12)), "#ff8c00");
          w.timer = Math.max(60, d.cooldown - lv * 6);
          break;
        }
        case "void_coil": {
          game.enemies.forEach((e) => {
            const dist = Math.hypot(e.x - p.x, e.y - p.y);
            if (dist < d.radius + lv * 10) {
              game.hurtEnemy(e, game.getDamage(d.damage * (1 + lv * 0.08)), UI.cyan);
            }
          });
          w.timer = Math.max(20, d.cooldown - lv * 3);
          break;
        }
        case "crystal_laser": {
          const target = game.nearestEnemy();
          if (target) {
            game.hurtEnemy(target, game.getDamage(d.damage * (1 + lv * 0.15)), UI.cyan);
            game.addProjectile({
              type: "arc_slash", x: p.x, y: p.y,
              angle: Math.atan2(target.y - p.y, target.x - p.x),
              arc: 0.15, range: Math.hypot(target.x - p.x, target.y - p.y),
              life: 8, damage: 0,
            });
          }
          w.timer = Math.max(25, d.cooldown - lv * 4);
          break;
        }
        case "shuriken_storm": {
          for (let i = 0; i < d.amount + lv - 1; i++) {
            const angle = p.aimAngle + (i - (d.amount + lv - 2) / 2) * 0.25;
            game.addProjectile({
              x: p.x, y: p.y,
              vx: Math.cos(angle) * 5.5,
              vy: Math.sin(angle) * 5.5,
              damage: game.getDamage(d.damage),
              type: "shuriken",
              life: 65,
            });
          }
          w.timer = Math.max(40, d.cooldown - lv * 5);
          break;
        }
        default:
          w.timer = 60;
      }
    });
  }

  function updateExtraction() {
    if (phase !== PHASE.EXTRACTION || !extractionPod) return;
    const p = game.player;
    const dist = Math.hypot(p.x - extractionPod.x, p.y - extractionPod.y);
    if (dist < CFG.EXTRACTION.podRadius) {
      extractionProgress += 1 / CFG.EXTRACTION.durationFrames;
      if (extractionProgress >= 1) {
        phase = PHASE.SURVIVE;
        extractionPod = null;
        if (game.currentLevel >= game.levelCount - 1) {
          game.setState("victory");
        } else {
          game.setState("shop");
          shopSelected = 0;
        }
      }
    } else {
      extractionProgress = Math.max(0, extractionProgress - 0.003);
    }
  }

  function getSecondaryChoices() {
    const owned = new Set(secondaryWeapons.map((w) => w.id));
    const pool = CFG.SECONDARY_WEAPONS.filter((w) => {
      if (owned.has(w.id)) {
        const sw = secondaryWeapons.find((s) => s.id === w.id);
        return sw && sw.level < w.maxLevel;
      }
      return secondaryWeapons.length < maxSecondarySlots;
    });
    return pool.slice(0, 3).map((w) => ({
      id: `sec_${w.id}`,
      name: w.name,
      desc: w.desc,
      icon: w.icon,
      kind: "secondary",
      secId: w.id,
      category: "offense",
    }));
  }

  function applySecondaryChoice(choice) {
    if (!choice || !choice.secId) return;
    addSecondaryWeapon(choice.secId);
  }

  function checkOverclock(weaponLevel) {
    if (weaponLevel === 3 || weaponLevel === 5) {
      overclockPending = weaponLevel;
      return true;
    }
    return false;
  }

  function applyOverclock(key) {
    const oc = CFG.OVERCLOCKS[key];
    if (!oc || !game.player) return;
    game.player.stats.damage *= oc.dmg;
    game.player.stats.cooldownMult *= oc.cd;
    game.player.stats.area *= oc.area;
    game.player.overclock = key;
    overclockPending = null;
  }

  function getShopItems() {
    return CFG.SHOP_ITEMS.filter((item) => {
      const bought = shopPurchases[item.id] || 0;
      return bought < item.max;
    });
  }

  function buyShopItem(idx) {
    const items = getShopItems();
    const item = items[idx];
    if (!item) return false;
    const cost = item.cost;
    if (item.costType === "gold" && gold < cost) return false;
    if (item.costType === "nitra" && nitra < cost) return false;
    if (item.costType === "gold") gold -= cost;
    else nitra -= cost;
    shopPurchases[item.id] = (shopPurchases[item.id] || 0) + 1;
    applyShopEffect(item);
    return true;
  }

  function applyShopEffect(item) {
    const p = game.player;
    switch (item.id) {
      case "hp_boost": p.maxHp += 20; p.hp += 20; break;
      case "dmg_boost": p.stats.damage *= 1.08; break;
      case "speed_boost": p.stats.speed *= 1.06; break;
      case "magnet_boost": p.stats.magnet *= 1.25; break;
      case "heal_pack": p.hp = Math.min(p.maxHp, p.hp + 50); break;
      case "nitra_boost": nitraBuff++; break;
      case "extra_weapon": maxSecondarySlots = Math.min(3, maxSecondarySlots + 1); break;
      default: break;
    }
  }

  function finishShop() {
    resetLevel();
    game.advanceSector();
  }

  function drawResourceNode(ctx, node) {
    const DR = window.DepthRender;
    const sx = node.x;
    const sy = node.y;
    const pulse = 1 + Math.sin(node.pulse) * 0.12;
    const h = (node.type === "nitra" ? 22 : 18) * pulse;
    ctx.save();
    if (DR) {
      DR.drawGroundShadow(ctx, sx, sy, 12, { alpha: 0.3 });
      DR.drawCrystal3D(ctx, sx, sy, h, node.type === "gold" ? UI.cyan : UI.nitra);
    }
    if (node.progress > 0) {
      ctx.fillStyle = "rgba(255,255,255,0.8)";
      ctx.fillRect(sx - 16, sy + 10, 32 * node.progress, 4);
    }
    ctx.restore();
  }

  function drawExtractionPod(ctx) {
    if (!extractionPod || phase !== PHASE.EXTRACTION) return;
    const DR = window.DepthRender;
    const { x, y } = extractionPod;
    ctx.save();
    if (DR) {
      DR.drawGroundShadow(ctx, x, y, CFG.EXTRACTION.podRadius * 0.45, { alpha: 0.25, ryMult: 0.35 });
      DR.drawExtrudedBox(ctx, x, y - 8, 44, 36, 18, {
        front: UI.orangeDim,
        top: UI.orange,
        side: "#994400",
      });
    }
    ctx.strokeStyle = UI.orange;
    ctx.lineWidth = 3;
    ctx.setLineDash([8, 6]);
    ctx.beginPath();
    ctx.arc(x, y, CFG.EXTRACTION.podRadius, 0, Math.PI * 2);
    ctx.stroke();
    ctx.setLineDash([]);
    ctx.fillStyle = UI.orange;
    ctx.font = "bold 11px monospace";
    ctx.textAlign = "center";
    ctx.fillText("DROP POD", x, y - 28);
    ctx.restore();
  }

  function getDepthDrawables(drawCtx, camera) {
    const items = [];
    resourceNodes.forEach((node) => {
      if (node.mined) return;
      if (node.x < camera.x - 60 || node.x > camera.x + game.viewW + 60) return;
      if (node.y < camera.y - 60 || node.y > camera.y + game.viewH + 60) return;
      items.push({ sortY: node.y, draw: () => drawResourceNode(drawCtx, node) });
    });
    if (extractionPod && phase === PHASE.EXTRACTION) {
      items.push({ sortY: extractionPod.y, draw: () => drawExtractionPod(drawCtx) });
    }
    return items;
  }

  function drawWorld(drawCtx, camera) {
    getDepthDrawables(drawCtx, camera).forEach((item) => item.draw());
  }

  function drawHUD(ctx, viewW) {
    ctx.fillStyle = "rgba(12,12,14,0.85)";
    ctx.fillRect(0, 58, viewW, 28);
    ctx.font = "bold 12px monospace";
    ctx.textAlign = "left";
    ctx.fillStyle = UI.orange;
    ctx.fillText(`THREAT ${threatLevel}`, 14, 76);
    ctx.fillStyle = UI.gold;
    ctx.fillText(`ORO ${gold}`, 110, 76);
    ctx.fillStyle = UI.nitra;
    ctx.fillText(`NITRA ${nitra}`, 200, 76);

    const phaseLabels = {
      [PHASE.DEPLOY]: "DEPLOY",
      [PHASE.SURVIVE]: "SURVIVE",
      [PHASE.ELITE]: "ELITE",
      [PHASE.EXTRACTION]: "ESTRAZIONE",
    };
    ctx.textAlign = "center";
    ctx.fillStyle = phase === PHASE.EXTRACTION ? UI.orange : UI.cyan;
    ctx.fillText(phaseLabels[phase] || "MISSION", viewW / 2, 76);

    if (secondaryWeapons.length) {
      ctx.textAlign = "right";
      ctx.fillStyle = UI.textDim;
      ctx.font = "11px monospace";
      ctx.fillText(
        secondaryWeapons.map((w) => `${w.def.icon}${w.level}`).join(" "),
        viewW - 14, 76
      );
    }

    if (phase === PHASE.EXTRACTION) {
      ctx.fillStyle = "rgba(0,0,0,0.6)";
      ctx.fillRect(viewW / 2 - 120, 88, 240, 14);
      ctx.fillStyle = UI.orange;
      ctx.fillRect(viewW / 2 - 120, 88, 240 * extractionProgress, 14);
      ctx.strokeStyle = UI.orangeDim;
      ctx.strokeRect(viewW / 2 - 120, 88, 240, 14);
      ctx.fillStyle = UI.text;
      ctx.font = "11px monospace";
      ctx.textAlign = "center";
      ctx.fillText("Estrazione in corso — resta nella capsula", viewW / 2, 84);
    }

    if (hordeWarning > 0) {
      ctx.fillStyle = `rgba(255,68,68,${0.5 + Math.sin(hordeWarning * 0.2) * 0.3})`;
      ctx.font = "bold 16px monospace";
      ctx.textAlign = "center";
      ctx.fillText(hordeMessage, viewW / 2, 110);
    }

    if (phase === PHASE.DEPLOY && deployTimer > 0) {
      ctx.fillStyle = UI.cyan;
      ctx.font = "bold 18px monospace";
      ctx.textAlign = "center";
      ctx.fillText(`DEPLOY IN ${Math.ceil(deployTimer / 60)}...`, viewW / 2, 130);
    }
  }

  function drawShop(ctx, viewW, viewH, level, player) {
    ctx.fillStyle = UI.bg;
    ctx.fillRect(0, 0, viewW, viewH);
    ctx.fillStyle = UI.orange;
    ctx.font = "bold 28px monospace";
    ctx.textAlign = "center";
    ctx.fillText("TERMINALE MISSIONE — BAR", viewW / 2, 50);
    ctx.fillStyle = UI.textDim;
    ctx.font="14px sans-serif";
    ctx.fillText(`Settore ${game.currentLevel + 1} completato · ${level.name}`, viewW / 2, 78);
    ctx.fillStyle = UI.gold;
    ctx.fillText(`Oro: ${gold}`, viewW / 2 - 80, 108);
    ctx.fillStyle = UI.nitra;
    ctx.fillText(`Nitra: ${nitra}`, viewW / 2 + 80, 108);

    const items = getShopItems();
    items.forEach((item, i) => {
      const y = 140 + i * 72;
      const selected = i === shopSelected;
      ctx.fillStyle = selected ? "rgba(255,140,0,0.25)" : UI.panel;
      ctx.strokeStyle = selected ? UI.orange : UI.panelBorder;
      ctx.lineWidth = selected ? 2 : 1;
      ctx.fillRect(viewW / 2 - 300, y, 600, 62);
      ctx.strokeRect(viewW / 2 - 300, y, 600, 62);
      ctx.textAlign = "left";
      ctx.fillStyle = UI.text;
      ctx.font = "bold 16px sans-serif";
      ctx.fillText(item.name, viewW / 2 - 280, y + 24);
      ctx.fillStyle = UI.textDim;
      ctx.font = "13px sans-serif";
      ctx.fillText(item.desc, viewW / 2 - 280, y + 44);
      ctx.textAlign = "right";
      ctx.fillStyle = item.costType === "nitra" ? UI.nitra : UI.gold;
      ctx.font = "bold 14px monospace";
      ctx.fillText(`${item.cost} ${item.costType === "nitra" ? "NITRA" : "ORO"}`, viewW / 2 + 280, y + 34);
    });

    ctx.fillStyle = UI.cyan;
    ctx.textAlign = "center";
    ctx.font="14px sans-serif";
    ctx.fillText("↑↓ seleziona · INVIO acquista · SPAZIO continua missione", viewW / 2, viewH - 40);
  }

  function drawOverclock(ctx, viewW, viewH) {
    ctx.fillStyle = "rgba(0,0,0,0.85)";
    ctx.fillRect(0, 0, viewW, viewH);
    ctx.fillStyle = UI.orange;
    ctx.font = "bold 26px monospace";
    ctx.textAlign = "center";
    ctx.fillText(`OVERCLOCK ARMA — Livello ${overclockPending}`, viewW / 2, 80);
    const keys = Object.keys(CFG.OVERCLOCKS);
    keys.forEach((key, i) => {
      const oc = CFG.OVERCLOCKS[key];
      const y = 160 + i * 90;
      ctx.fillStyle = UI.panel;
      ctx.strokeStyle = UI.orange;
      ctx.fillRect(viewW / 2 - 280, y, 560, 72);
      ctx.strokeRect(viewW / 2 - 280, y, 560, 72);
      ctx.fillStyle = UI.text;
      ctx.font = "bold 18px sans-serif";
      ctx.textAlign = "left";
      ctx.fillText(`${i + 1}. ${oc.name}`, viewW / 2 - 250, y + 28);
      ctx.fillStyle = UI.textDim;
      ctx.font = "14px sans-serif";
      ctx.fillText(oc.desc, viewW / 2 - 250, y + 50);
    });
    ctx.fillStyle = UI.textDim;
    ctx.textAlign = "center";
    ctx.fillText("Premi 1, 2 o 3 per scegliere l'overclock", viewW / 2, viewH - 50);
  }

  function handleShopInput(code) {
    const items = getShopItems();
    if (code === "ArrowUp" || code === "KeyW") shopSelected = Math.max(0, shopSelected - 1);
    if (code === "ArrowDown" || code === "KeyS") shopSelected = Math.min(items.length - 1, shopSelected + 1);
    if (code === "Enter" || code.startsWith("Digit")) {
      const idx = code.startsWith("Digit") ? parseInt(code.replace("Digit", ""), 10) - 1 : shopSelected;
      if (idx >= 0 && idx < items.length) buyShopItem(idx);
    }
    if (code === "Space") finishShop();
  }

  function handleOverclockInput(code) {
    const keys = Object.keys(CFG.OVERCLOCKS);
    if (code.startsWith("Digit")) {
      const idx = parseInt(code.replace("Digit", ""), 10) - 1;
      if (idx >= 0 && idx < keys.length) {
        applyOverclock(keys[idx]);
        game.setState("playing");
      }
    }
  }

  function getNitraDamageMult() {
    return nitraBuff > 0 ? 1.2 : 1;
  }

  function consumeNitraBuff() {
    if (nitraBuff > 0) nitraBuff--;
  }

  window.DRGSystems = {
    bind,
    resetRun,
    resetLevel,
    update,
    drawWorld,
    getDepthDrawables,
    drawHUD,
    drawShop,
    drawOverclock,
    onBossKilled,
    getPhase,
    getGold,
    getNitra,
    getThreatLevel,
    getThreatSpawnBonus,
    getThreatHpMult,
    getSecondaryChoices,
    applySecondaryChoice,
    checkOverclock,
    applyOverclock,
    handleShopInput,
    handleOverclockInput,
    getNitraDamageMult,
    consumeNitraBuff,
    isExtraction,
    isDeploy,
    get overclockPending() { return overclockPending; },
    get shopSelected() { return shopSelected; },
    set shopSelected(v) { shopSelected = v; },
  };
})();
