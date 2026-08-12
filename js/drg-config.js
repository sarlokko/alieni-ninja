(() => {
  "use strict";

  window.DRGConfig = {
    MISSION_PHASE: {
      DEPLOY: "deploy",
      SURVIVE: "survive",
      ELITE: "elite",
      EXTRACTION: "extraction",
    },

    UI: {
      bg: "#0c0c0e",
      panel: "#1a1a1f",
      panelBorder: "#2a2a32",
      orange: "#ff8c00",
      orangeDim: "#cc7000",
      cyan: "#00d4aa",
      cyanDim: "#009977",
      red: "#ff4444",
      gold: "#ffd700",
      nitra: "#e04040",
      text: "#e8e8ec",
      textDim: "#888890",
    },

    THREAT: {
      intervalFrames: 45 * 60,
      maxLevel: 8,
      spawnReduction: 8,
      hpBonusPerLevel: 0.12,
    },

    EXTRACTION: {
      durationFrames: 12 * 60,
      podRadius: 70,
      podColor: "#ff8c00",
    },

    MINING: {
      nodeCount: 22,
      mineRadius: 48,
      mineSpeed: 0.018,
      goldValue: 8,
      nitraValue: 1,
    },

    ELITE: {
      name: "Alfa Mannaro",
      hpMult: 4.5,
      speedMult: 0.75,
      size: 28,
      damage: 10,
      xp: 25,
      goldDrop: 35,
    },

    SECONDARY_WEAPONS: [
      {
        id: "plasma_turret",
        name: "Torretta Plasma",
        desc: "Plasma a raffica verso i nemici",
        icon: "🔫",
        cooldown: 75,
        damage: 9,
        amount: 2,
        maxLevel: 7,
      },
      {
        id: "star_grenade",
        name: "Granata Stellare",
        desc: "Esplosione ad area ogni pochi secondi",
        icon: "💣",
        cooldown: 140,
        damage: 28,
        area: 90,
        maxLevel: 7,
      },
      {
        id: "void_coil",
        name: "Bobina del Vuoto",
        desc: "Danno elettrico ai nemici vicini",
        icon: "⚡",
        cooldown: 45,
        damage: 6,
        radius: 110,
        maxLevel: 7,
      },
      {
        id: "crystal_laser",
        name: "Laser di Cristallo",
        desc: "Raggio continuo verso il bersaglio",
        icon: "🔦",
        cooldown: 55,
        damage: 14,
        maxLevel: 7,
      },
      {
        id: "shuriken_storm",
        name: "Tempesta Shuriken",
        desc: "Shuriken rotanti extra",
        icon: "🌀",
        cooldown: 90,
        damage: 7,
        amount: 4,
        maxLevel: 7,
      },
    ],

    OVERCLOCKS: {
      balanced: { name: "Bilanciato", desc: "Danno +15%, nessun malus", dmg: 1.15, cd: 1, area: 1 },
      overcharged: { name: "Sovraccarico", desc: "Danno +35%, cooldown +20%", dmg: 1.35, cd: 1.2, area: 1 },
      expanded: { name: "Area Estesa", desc: "Area +30%, danno -10%", dmg: 0.9, cd: 1, area: 1.3 },
    },

    SHOP_ITEMS: [
      { id: "hp_boost", name: "Scudo Alieno", desc: "HP max +20", cost: 40, costType: "gold", max: 5 },
      { id: "dmg_boost", name: "Amplificatore", desc: "Danno globale +8%", cost: 55, costType: "gold", max: 4 },
      { id: "speed_boost", name: "Propulsori", desc: "Velocità +6%", cost: 45, costType: "gold", max: 3 },
      { id: "magnet_boost", name: "Campo XP", desc: "Magnete +25%", cost: 35, costType: "gold", max: 3 },
      { id: "heal_pack", name: "Kit Medico", desc: "Cura 50 HP subito", cost: 25, costType: "gold", max: 99, consumable: true },
      { id: "nitra_boost", name: "Potenza Nitra", desc: "Danno +20% prossima missione", cost: 2, costType: "nitra", max: 2 },
      { id: "extra_weapon", name: "Slot Arma", desc: "Sblocca slot arma secondaria", cost: 4, costType: "nitra", max: 2 },
    ],

    HORDE_MESSAGES: [
      "⚠ ORDA FELINA IN ARRIVO!",
      "⚠ SWARM DETECTED — GATTI MANNARI!",
      "⚠ ALLARME — ONDATA MASSICCIA!",
    ],
  };
})();
