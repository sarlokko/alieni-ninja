(() => {
  "use strict";

  const T = window.THREE;
  if (!T) {
    window.WorldRenderer3D = { active: false, init: () => false };
    return;
  }

  const S = 20;
  const CHAR = 1.35;
  let renderer = null;
  let scene = null;
  let camera = null;
  let container = null;
  let canvas3d = null;
  let ground = null;
  let sun = null;
  let fill = null;
  let rim = null;
  let active = false;

  const pools = {
    enemies: new Map(),
    projectiles: [],
    gems: [],
    pickups: [],
    decor: new Map(),
    resources: new Map(),
  };
  let playerGroup = null;
  let aimMarker = null;
  let podGroup = null;

  const COL = {
    kael: 0x1e90ff,
    zara: 0x9b30ff,
    vex: 0x708090,
    nia: 0xc0c0c0,
    ryn: 0x00f5ff,
  };

  function mat(color, opts = {}) {
    return new T.MeshStandardMaterial({
      color,
      roughness: opts.roughness ?? 0.58,
      metalness: opts.metalness ?? 0.22,
      emissive: opts.emissive ?? 0x000000,
      emissiveIntensity: opts.emissiveIntensity ?? 0,
      flatShading: true,
    });
  }

  function box(w, h, d, color, opts) {
    const m = new T.Mesh(new T.BoxGeometry(w, h, d), mat(color, opts));
    m.castShadow = m.receiveShadow = true;
    return m;
  }

  function createCatMesh(typeId, isBoss) {
    const g = new T.Group();
    const base = (isBoss ? 2.8 : 1.15) * S * CHAR;
    const colors = {
      kitten: { b: 0xcc8844, h: 0xdd9955, e: 0xff4400, a: 0xffaa66, stripe: 0xaa6633 },
      tabby: { b: 0xb07030, h: 0xc08040, e: 0xff3300, a: 0xcc8844, stripe: 0x7a5020 },
      hunter: { b: 0x886644, h: 0x997755, e: 0xff2200, a: 0xaa5533, stripe: 0x553322 },
      archer: { b: 0x6a7040, h: 0x7a8050, e: 0xaaff44, a: 0x889944, stripe: 0x445528 },
      werewolf: { b: 0x662222, h: 0x883333, e: 0xff1100, a: 0x991111, stripe: 0x440000 },
      shadow: { b: 0x442266, h: 0x553388, e: 0xcc44ff, a: 0x331144, stripe: 0x220033 },
    };
    const c = isBoss ? { b: 0x881100, h: 0xcc2200, e: 0xff6600, a: 0xff2200, stripe: 0x550000 } : (colors[typeId] || colors.tabby);
    const u = base / S;

    const body = box(1.5 * u, 1.05 * u, 2.15 * u, c.b);
    body.position.y = 0.62 * u;
    g.add(body);

    const chest = box(1.1 * u, 0.55 * u, 0.85 * u, c.a, { roughness: 0.72 });
    chest.position.set(0, 0.78 * u, 0.55 * u);
    g.add(chest);

    const head = box(1.2 * u, 0.95 * u, 1.15 * u, c.h);
    head.position.set(0, 1.12 * u, 1.08 * u);
    g.add(head);

    const snout = box(0.55 * u, 0.38 * u, 0.45 * u, c.a);
    snout.position.set(0, 0.95 * u, 1.62 * u);
    g.add(snout);

    const nose = box(0.18 * u, 0.12 * u, 0.08 * u, 0x221111);
    nose.position.set(0, 1.02 * u, 1.88 * u);
    g.add(nose);

    [-0.48, 0.48].forEach((x) => {
      const ear = new T.Mesh(new T.ConeGeometry(0.26 * u, 0.52 * u, 4), mat(c.h));
      ear.position.set(x * u, 1.52 * u, 1.12 * u);
      ear.rotation.z = x * 0.15;
      ear.castShadow = true;
      g.add(ear);
      const inner = new T.Mesh(new T.ConeGeometry(0.14 * u, 0.28 * u, 4), mat(c.a));
      inner.position.set(x * u, 1.48 * u, 1.15 * u);
      g.add(inner);
    });

    [[-0.38, 0.22], [0.38, 0.22]].forEach(([x, z]) => {
      const eye = box(0.22 * u, 0.17 * u, 0.1 * u, c.e, { emissive: c.e, emissiveIntensity: 1.0 });
      eye.position.set(x * u, 1.15 * u, 1.72 * u);
      g.add(eye);
      const pupil = box(0.08 * u, 0.12 * u, 0.06 * u, 0x110000);
      pupil.position.set(x * u, 1.14 * u, 1.78 * u);
      g.add(pupil);
    });

    [-1, 1].forEach((side) => {
      for (let i = 0; i < 3; i++) {
        const whisker = box(0.55 * u, 0.04 * u, 0.04 * u, 0xcccccc, { metalness: 0.1 });
        whisker.position.set(side * 0.55 * u, (0.92 + i * 0.12) * u, 1.75 * u);
        whisker.rotation.z = side * (0.25 + i * 0.08);
        g.add(whisker);
      }
    });

    if (typeId === "tabby" || typeId === "kitten") {
      for (let i = 0; i < 4; i++) {
        const stripe = box(1.35 * u, 0.1 * u, 0.18 * u, c.stripe);
        stripe.position.set(0, (0.55 + i * 0.22) * u, 0.1 * u);
        stripe.rotation.y = (i % 2) * 0.2;
        g.add(stripe);
      }
    }

    const tail = new T.Group();
    const seg1 = new T.Mesh(new T.CylinderGeometry(0.14 * u, 0.12 * u, 0.7 * u, 5), mat(c.b));
    seg1.rotation.x = Math.PI / 2.8;
    seg1.position.set(0, 0.82 * u, -1.05 * u);
    tail.add(seg1);
    const seg2 = new T.Mesh(new T.CylinderGeometry(0.11 * u, 0.07 * u, 0.65 * u, 5), mat(c.h));
    seg2.rotation.x = Math.PI / 2.2;
    seg2.position.set(0, 1.05 * u, -1.55 * u);
    tail.add(seg2);
    tail.castShadow = true;
    g.add(tail);

    [[-0.55, 0.42], [0.55, 0.42], [-0.38, -0.38], [0.38, -0.38]].forEach(([x, z]) => {
      const leg = box(0.32 * u, 0.62 * u, 0.32 * u, 0x2a2a2a);
      leg.position.set(x * u, 0.31 * u, z * u);
      g.add(leg);
      const paw = box(0.36 * u, 0.12 * u, 0.42 * u, 0x1a1a1a);
      paw.position.set(x * u, 0.06 * u, (z + 0.08) * u);
      g.add(paw);
      [-0.12, 0, 0.12].forEach((cx) => {
        const claw = box(0.06 * u, 0.08 * u, 0.1 * u, 0xeeddcc);
        claw.position.set(x * u + cx * u, 0.02 * u, (z + 0.22) * u);
        g.add(claw);
      });
    });

    if (typeId === "werewolf" || isBoss) {
      const mane = new T.Mesh(new T.ConeGeometry(0.75 * u, 0.45 * u, 6), mat(c.a, { roughness: 0.8 }));
      mane.rotation.x = Math.PI;
      mane.position.set(0, 1.35 * u, 0.55 * u);
      g.add(mane);
      [-0.55, 0.55].forEach((x) => {
        const horn = new T.Mesh(new T.ConeGeometry(0.14 * u, 0.45 * u, 4), mat(0x331111));
        horn.position.set(x * u, 1.62 * u, 0.85 * u);
        horn.rotation.z = x * 0.4;
        g.add(horn);
      });
    }

    if (typeId === "archer") {
      const bow = new T.Mesh(new T.TorusGeometry(0.45 * u, 0.06 * u, 4, 10, Math.PI), mat(0x5a4030));
      bow.rotation.y = Math.PI / 2;
      bow.position.set(0.75 * u, 0.95 * u, 0.2 * u);
      g.add(bow);
      const quiver = box(0.28 * u, 0.7 * u, 0.22 * u, 0x443322);
      quiver.position.set(-0.72 * u, 1.05 * u, -0.35 * u);
      g.add(quiver);
    }

    if (typeId === "hunter") {
      const hood = new T.Mesh(new T.ConeGeometry(0.85 * u, 0.55 * u, 6), mat(0x332211, { roughness: 0.85 }));
      hood.position.set(0, 1.45 * u, 0.95 * u);
      g.add(hood);
      const blade = box(0.08 * u, 0.55 * u, 0.18 * u, 0xcccccc, { metalness: 0.7 });
      blade.position.set(0.82 * u, 0.75 * u, 0.45 * u);
      g.add(blade);
    }

    if (typeId === "shadow") {
      const cloak = box(1.65 * u, 1.1 * u, 1.4 * u, 0x220033, { roughness: 0.9 });
      cloak.position.set(0, 0.75 * u, -0.15 * u);
      g.add(cloak);
      const aura = new T.Mesh(
        new T.TorusGeometry(1.1 * u, 0.08 * u, 6, 20),
        mat(0xaa22ff, { emissive: 0xaa22ff, emissiveIntensity: 0.35, transparent: true })
      );
      aura.rotation.x = Math.PI / 2;
      aura.position.y = 0.15 * u;
      g.add(aura);
    }

    if (typeId === "kitten") {
      const bell = new T.Mesh(new T.SphereGeometry(0.14 * u, 6, 6), mat(0xffd700, { metalness: 0.6, emissive: 0xffaa00, emissiveIntensity: 0.2 }));
      bell.position.set(0, 0.55 * u, 0.95 * u);
      g.add(bell);
    }

    if (isBoss) {
      body.material.emissive = new T.Color(0x440000);
      body.material.emissiveIntensity = 0.5;
      const ring = new T.Mesh(
        new T.TorusGeometry(2.5 * u, 0.18 * u, 6, 28),
        mat(0xff4400, { emissive: 0xff4400, emissiveIntensity: 0.55 })
      );
      ring.rotation.x = Math.PI / 2;
      ring.position.y = 0.25 * u;
      g.add(ring);
      const crown = new T.Mesh(new T.ConeGeometry(0.35 * u, 0.55 * u, 4), mat(0xffd700, { metalness: 0.55 }));
      crown.position.set(0, 1.75 * u, 1.05 * u);
      g.add(crown);
    }

    g.userData.typeId = typeId;
    g.userData.isBoss = isBoss;
    return g;
  }

  function addHeroGear(g, heroId, col, dark, accent) {
    const u = S * CHAR;
    const a = parseInt(String(accent || "#ffffff").replace("#", "0x"), 16) || 0xffffff;

    const belt = box(1.15 * u, 0.14 * u, 0.72 * u, 0x222222, { metalness: 0.35 });
    belt.position.y = 0.62 * u;
    g.add(belt);

    const buckle = box(0.22 * u, 0.18 * u, 0.1 * u, col, { emissive: col, emissiveIntensity: 0.25, metalness: 0.5 });
    buckle.position.set(0, 0.62 * u, 0.4 * u);
    g.add(buckle);

    [-0.38, 0.38].forEach((x) => {
      const knee = box(0.38 * u, 0.22 * u, 0.38 * u, dark, { metalness: 0.35 });
      knee.position.set(x * u, 0.55 * u, 0.08 * u);
      g.add(knee);
      const boot = box(0.36 * u, 0.22 * u, 0.48 * u, 0x1a1a22);
      boot.position.set(x * u, 0.12 * u, 0.12 * u);
      g.add(boot);
    });

    const pack = box(0.55 * u, 0.75 * u, 0.35 * u, 0x1a1a28, { metalness: 0.3 });
    pack.position.set(0, 1.25 * u, -0.42 * u);
    g.add(pack);

    const thruster = new T.Mesh(new T.CylinderGeometry(0.12 * u, 0.16 * u, 0.28 * u, 6), mat(col, { emissive: col, emissiveIntensity: 0.4 }));
    thruster.position.set(0, 1.05 * u, -0.62 * u);
    g.add(thruster);

    switch (heroId) {
      case "kael": {
        const guard = box(0.22 * u, 0.35 * u, 0.22 * u, col, { metalness: 0.45 });
        guard.position.set(0.92 * u, 1.35 * u, 0.15 * u);
        g.add(guard);
        const shuriken = new T.Mesh(new T.CylinderGeometry(0.28 * u, 0.28 * u, 0.06 * u, 4), mat(accent, { metalness: 0.65, emissive: a, emissiveIntensity: 0.2 }));
        shuriken.rotation.x = Math.PI / 2;
        shuriken.position.set(-0.55 * u, 1.55 * u, -0.35 * u);
        g.add(shuriken);
        [0, Math.PI / 2].forEach((r) => {
          const blade = box(0.45 * u, 0.06 * u, 0.12 * u, 0xd8e4ff, { metalness: 0.55 });
          blade.rotation.y = r;
          blade.position.set(0.95 * u, 1.2 * u, 0.35 * u);
          g.add(blade);
        });
        break;
      }
      case "zara": {
        const hilt = box(0.14 * u, 0.35 * u, 0.14 * u, 0x333344, { metalness: 0.5 });
        hilt.position.set(0.88 * u, 1.05 * u, 0.35 * u);
        g.add(hilt);
        const blade = box(0.1 * u, 1.15 * u, 0.22 * u, col, { emissive: col, emissiveIntensity: 0.65, metalness: 0.4 });
        blade.position.set(0.88 * u, 1.55 * u, 0.55 * u);
        g.add(blade);
        const scarfTail = box(0.35 * u, 0.55 * u, 0.12 * u, 0x39ff14, { emissive: 0x39ff14, emissiveIntensity: 0.15 });
        scarfTail.position.set(-0.35 * u, 1.45 * u, -0.55 * u);
        scarfTail.rotation.z = 0.35;
        g.add(scarfTail);
        break;
      }
      case "vex": {
        const pauldronL = box(0.55 * u, 0.42 * u, 0.55 * u, 0x556677, { metalness: 0.55 });
        pauldronL.position.set(-0.88 * u, 1.55 * u, 0);
        g.add(pauldronL);
        const pauldronR = pauldronL.clone();
        pauldronR.position.set(0.88 * u, 1.55 * u, 0);
        g.add(pauldronR);
        const cannon = new T.Mesh(new T.CylinderGeometry(0.22 * u, 0.28 * u, 0.75 * u, 8), mat(0x8899aa, { metalness: 0.6 }));
        cannon.rotation.z = Math.PI / 2;
        cannon.position.set(1.05 * u, 1.25 * u, 0.25 * u);
        g.add(cannon);
        const core = new T.Mesh(new T.SphereGeometry(0.18 * u, 8, 8), mat(0xff6347, { emissive: 0xff6347, emissiveIntensity: 0.7 }));
        core.position.set(1.35 * u, 1.25 * u, 0.25 * u);
        g.add(core);
        break;
      }
      case "nia": {
        const pouchL = box(0.28 * u, 0.38 * u, 0.2 * u, 0x444455);
        pouchL.position.set(-0.62 * u, 0.72 * u, 0.28 * u);
        g.add(pouchL);
        const pouchR = pouchL.clone();
        pouchR.position.set(0.62 * u, 0.72 * u, 0.28 * u);
        g.add(pouchR);
        const dart = new T.Mesh(new T.ConeGeometry(0.08 * u, 0.45 * u, 4), mat(0xff69b4, { emissive: 0xff69b4, emissiveIntensity: 0.45 }));
        dart.rotation.x = -Math.PI / 2;
        dart.position.set(0.82 * u, 1.15 * u, 0.45 * u);
        g.add(dart);
        const scope = box(0.12 * u, 0.12 * u, 0.22 * u, 0x00f5ff, { emissive: 0x00f5ff, emissiveIntensity: 0.35 });
        scope.position.set(0, 2.08 * u, 0.48 * u);
        g.add(scope);
        break;
      }
      case "ryn": {
        const staff = new T.Mesh(new T.CylinderGeometry(0.08 * u, 0.1 * u, 1.45 * u, 6), mat(0x553399));
        staff.position.set(0.78 * u, 1.35 * u, 0.1 * u);
        staff.rotation.z = 0.25;
        g.add(staff);
        const orb = new T.Mesh(new T.SphereGeometry(0.22 * u, 10, 10), mat(col, { emissive: col, emissiveIntensity: 0.75 }));
        orb.position.set(0.95 * u, 2.05 * u, 0.25 * u);
        g.add(orb);
        const ring = new T.Mesh(new T.TorusGeometry(0.35 * u, 0.05 * u, 6, 16), mat(0xffd700, { emissive: 0xffd700, emissiveIntensity: 0.35 }));
        ring.rotation.x = Math.PI / 2;
        ring.position.set(0, 1.35 * u, 0.38 * u);
        g.add(ring);
        break;
      }
      default:
        break;
    }
  }

  function createNinjaMesh(heroId) {
    const g = new T.Group();
    const col = COL[heroId] || 0x1e90ff;
    const dark = new T.Color(col).multiplyScalar(0.45).getHex();
    const u = S * CHAR;
    const heroAccents = { kael: 0xc0c0c0, zara: 0x39ff14, vex: 0xffd700, nia: 0xff69b4, ryn: 0xffd700 };
    const accent = heroAccents[heroId] || col;

    const torso = box(1.25 * u, 1.35 * u, 0.75 * u, col, { metalness: 0.42 });
    torso.position.y = 1.15 * u;
    g.add(torso);

    const chestPlate = box(0.85 * u, 0.65 * u, 0.15 * u, dark, { metalness: 0.5 });
    chestPlate.position.set(0, 1.25 * u, 0.42 * u);
    g.add(chestPlate);

    const head = new T.Mesh(new T.BoxGeometry(0.85 * u, 0.85 * u, 0.85 * u), mat(0x222233));
    head.position.y = 2.12 * u;
    head.castShadow = true;
    g.add(head);

    const helmet = box(0.92 * u, 0.28 * u, 0.92 * u, dark, { metalness: 0.45 });
    helmet.position.y = 2.38 * u;
    g.add(helmet);

    const visor = box(0.88 * u, 0.22 * u, 0.14 * u, col, { emissive: col, emissiveIntensity: 0.85 });
    visor.position.set(0, 2.1 * u, 0.48 * u);
    g.add(visor);

    const antenna = new T.Mesh(new T.CylinderGeometry(0.04 * u, 0.04 * u, 0.35 * u, 4), mat(0x888899, { metalness: 0.6 }));
    antenna.position.set(0.32 * u, 2.55 * u, 0);
    g.add(antenna);
    const tip = new T.Mesh(new T.SphereGeometry(0.07 * u, 6, 6), mat(col, { emissive: col, emissiveIntensity: 0.5 }));
    tip.position.set(0.32 * u, 2.75 * u, 0);
    g.add(tip);

    const scarf = new T.Mesh(new T.CylinderGeometry(0.55 * u, 0.62 * u, 0.18 * u, 8), mat(col));
    scarf.position.y = 1.78 * u;
    scarf.castShadow = true;
    g.add(scarf);

    [-0.82, 0.82].forEach((x) => {
      const shoulder = box(0.42 * u, 0.32 * u, 0.42 * u, dark, { metalness: 0.4 });
      shoulder.position.set(x * u, 1.62 * u, 0);
      g.add(shoulder);
      const arm = box(0.32 * u, 0.95 * u, 0.32 * u, dark);
      arm.position.set(x * u, 1.15 * u, 0);
      g.add(arm);
      const gauntlet = box(0.36 * u, 0.28 * u, 0.36 * u, col, { metalness: 0.45 });
      gauntlet.position.set(x * u, 0.72 * u, 0.05 * u);
      g.add(gauntlet);
    });

    [-0.38, 0.38].forEach((x) => {
      const leg = box(0.36 * u, 1.05 * u, 0.36 * u, dark);
      leg.position.set(x * u, 0.52 * u, 0);
      g.add(leg);
    });

    addHeroGear(g, heroId, col, dark, accent);

    g.userData.heroId = heroId;
    return g;
  }

  function createTree() {
    const g = new T.Group();
    const trunk = new T.Mesh(new T.CylinderGeometry(0.35 * S, 0.5 * S, 2.2 * S, 6), mat(0x4a3020));
    trunk.position.y = 1.1 * S;
    trunk.castShadow = true;
    g.add(trunk);
    [1.6, 1.25, 0.9].forEach((y, i) => {
      const leafScale = (1.5 - i * 0.25) * S;
      const leaf = new T.Mesh(new T.ConeGeometry(leafScale, 1.1 * S, 6), mat(0x1a7a28 + i * 0x050505));
      leaf.position.y = (y + 1.2) * S;
      leaf.castShadow = true;
      g.add(leaf);
    });
    return g;
  }

  function createBuilding(w, h) {
    const g = new T.Group();
    const bw = Math.max(3 * S, (w / 25) * S);
    const bh = Math.max(4 * S, (h / 20) * S);
    const body = box(bw, bh, bw * 0.8, 0x0c0620);
    body.position.y = bh / 2;
    g.add(body);
    const roof = box(bw * 1.05, 0.4 * S, bw * 0.85, 0x2a1840);
    roof.position.y = bh + 0.2 * S;
    g.add(roof);
    for (let row = 0; row < 4; row++) {
      for (let col = 0; col < 3; col++) {
        if ((row + col) % 2 === 0) continue;
        const win = box(0.35 * S, 0.35 * S, 0.1 * S, 0xff8c00, { emissive: 0xff8c00, emissiveIntensity: 0.35 });
        win.position.set((col - 1) * bw * 0.28, bh * 0.35 + row * bh * 0.18, bw * 0.42);
        g.add(win);
      }
    }
    return g;
  }

  function createRock(r) {
    const g = new T.Group();
    const rad = Math.max(2 * S, (r || 14) * 0.55);
    const rock = new T.Mesh(new T.DodecahedronGeometry(rad, 0), mat(0x3a3548, { roughness: 0.95 }));
    rock.rotation.set(Math.random(), Math.random(), Math.random());
    rock.position.y = rad * 0.55;
    rock.castShadow = rock.receiveShadow = true;
    g.add(rock);
    return g;
  }

  function createCrystal(accent) {
    const g = new T.Group();
    const col = accent || 0x00d4aa;
    const crystal = new T.Mesh(new T.OctahedronGeometry(1.8 * S, 0), mat(col, { emissive: col, emissiveIntensity: 0.45 }));
    crystal.position.y = 1.4 * S;
    crystal.castShadow = true;
    g.add(crystal);
    const light = new T.PointLight(col, 0.6, 80 * S);
    light.position.y = 2 * S;
    g.add(light);
    return g;
  }

  function createResourceNode(type) {
    const g = new T.Group();
    const col = type === "nitra" ? 0xff3366 : type === "gold" ? 0xffd700 : 0x00f5ff;
    const base = new T.Mesh(new T.CylinderGeometry(2.2 * S, 2.8 * S, 1.2 * S, 6), mat(0x2a2535));
    base.position.y = 0.6 * S;
    base.receiveShadow = true;
    g.add(base);
    const ore = new T.Mesh(new T.OctahedronGeometry(2.4 * S, 0), mat(col, { emissive: col, emissiveIntensity: 0.55 }));
    ore.position.y = 3 * S;
    ore.castShadow = true;
    g.add(ore);
    const glow = new T.PointLight(col, 0.9, 120 * S);
    glow.position.y = 3.5 * S;
    g.add(glow);
    g.userData.type = type;
    return g;
  }

  function createDropPod() {
    const g = new T.Group();
    const hull = new T.Mesh(new T.CylinderGeometry(2.8 * S, 2.2 * S, 6 * S, 10), mat(0x994400, { metalness: 0.5 }));
    hull.position.y = 3 * S;
    hull.castShadow = true;
    g.add(hull);
    const nose = new T.Mesh(new T.ConeGeometry(2.2 * S, 2.5 * S, 10), mat(0xcc5500, { metalness: 0.45 }));
    nose.position.y = 7.2 * S;
    nose.castShadow = true;
    g.add(nose);
    const ring = new T.Mesh(
      new T.TorusGeometry(8 * S, 0.25 * S, 8, 32),
      mat(0xff8c00, { emissive: 0xff8c00, emissiveIntensity: 0.4 })
    );
    ring.rotation.x = Math.PI / 2;
    ring.position.y = 0.3 * S;
    g.add(ring);
    const beacon = new T.PointLight(0xff8c00, 1.2, 200 * S);
    beacon.position.y = 6 * S;
    g.add(beacon);
    return g;
  }

  function scatterCaveRocks() {
    for (let i = 0; i < 180; i++) {
      const rock = createRock(8 + (i % 5) * 3);
      rock.position.set(
        (Math.random() - 0.5) * 18000,
        0,
        (Math.random() - 0.5) * 14000
      );
      rock.rotation.y = Math.random() * Math.PI * 2;
      scene.add(rock);
    }
  }

  function initRenderer3D(parent, width, height) {
    if (active) return true;
    container = parent;

    canvas3d = document.createElement("canvas");
    canvas3d.id = "game-gl";
    canvas3d.style.cssText = "position:absolute;inset:0;width:100%;height:100%;display:block;z-index:1;";
    parent.insertBefore(canvas3d, parent.firstChild);

    renderer = new T.WebGLRenderer({ canvas: canvas3d, antialias: true, alpha: false });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.setSize(width, height);
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = T.PCFSoftShadowMap;
    renderer.setClearColor(0x06060c);

    scene = new T.Scene();
    scene.fog = new T.FogExp2(0x0a0812, 0.00022);

    camera = new T.PerspectiveCamera(48, width / height, 20, 12000);

    scene.add(new T.HemisphereLight(0x446688, 0x1a0a04, 0.45));
    fill = new T.DirectionalLight(0x6688aa, 0.35);
    fill.position.set(-300, 400, -200);
    scene.add(fill);

    sun = new T.DirectionalLight(0xffcc88, 1.15);
    sun.position.set(500, 1100, 400);
    sun.castShadow = true;
    sun.shadow.mapSize.set(2048, 2048);
    sun.shadow.camera.near = 100;
    sun.shadow.camera.far = 2800;
    const sh = 1100;
    sun.shadow.camera.left = -sh;
    sun.shadow.camera.right = sh;
    sun.shadow.camera.top = sh;
    sun.shadow.camera.bottom = -sh;
    scene.add(sun);
    sun.target = new T.Object3D();
    scene.add(sun.target);

    rim = new T.PointLight(0xff8c00, 1.1, 1600);
    scene.add(rim);

    ground = new T.Mesh(
      new T.PlaneGeometry(24000, 24000),
      new T.MeshStandardMaterial({ color: 0x1a2838, roughness: 0.94, metalness: 0.08 })
    );
    ground.rotation.x = -Math.PI / 2;
    ground.receiveShadow = true;
    scene.add(ground);

    const grid = new T.GridHelper(24000, 80, 0x00d4aa, 0x152030);
    grid.material.opacity = 0.14;
    grid.material.transparent = true;
    grid.position.y = 1;
    scene.add(grid);

    scatterCaveRocks();

    playerGroup = createNinjaMesh("kael");
    scene.add(playerGroup);

    aimMarker = new T.Mesh(
      new T.RingGeometry(1.6 * S, 2.2 * S, 24),
      new T.MeshBasicMaterial({ color: 0x00f5ff, transparent: true, opacity: 0.75, side: T.DoubleSide })
    );
    aimMarker.rotation.x = -Math.PI / 2;
    aimMarker.position.y = 2;
    scene.add(aimMarker);

    podGroup = createDropPod();
    podGroup.visible = false;
    scene.add(podGroup);

    active = true;
    return true;
  }

  function resize(w, h) {
    if (!renderer || !camera) return;
    renderer.setSize(w, h);
    camera.aspect = w / h;
    camera.updateProjectionMatrix();
  }

  function worldTo3(x, y) {
    return { x, z: y };
  }

  function syncFrame(data) {
    if (!active || !scene) return;
    const {
      player, enemies, projectiles, xpGems, pickups, decor, level,
      gameTime, selectedHero, drgWorld,
    } = data;
    if (!player) return;

    const p = worldTo3(player.x, player.y);
    const aim = player.aimAngle || 0;
    const camBack = 500;
    const camSide = -300;
    const camH = 700;
    camera.position.set(
      p.x + Math.cos(aim + Math.PI / 2) * camSide * 0.3 + Math.cos(aim + Math.PI) * camBack * 0.15,
      camH,
      p.z + Math.sin(aim + Math.PI / 2) * camSide * 0.3 + Math.sin(aim + Math.PI) * camBack * 0.15 + camBack
    );
    camera.lookAt(p.x + Math.cos(aim) * 50, 18 * S, p.z + Math.sin(aim) * 50);

    sun.target.position.set(p.x, 0, p.z);
    sun.target.updateMatrixWorld();
    sun.position.set(p.x + 500, 1100, p.z + 400);
    rim.position.set(p.x, 140, p.z);

    const heroId = selectedHero?.id || player.hero?.id || "kael";
    if (playerGroup.userData.heroId !== heroId) {
      scene.remove(playerGroup);
      playerGroup = createNinjaMesh(heroId);
      scene.add(playerGroup);
      playerGroup.userData.heroId = heroId;
    }

    const bob = Math.sin(gameTime * 0.14) * 0.8 * S;
    playerGroup.position.set(p.x, bob, p.z);
    playerGroup.rotation.y = aim;

    if (aimMarker) {
      const d = 22 * S * 0.08;
      aimMarker.position.set(
        p.x + Math.cos(aim) * d,
        1.5 * S,
        p.z + Math.sin(aim) * d
      );
    }

    if (ground && level) {
      const floorCol = parseInt(String(level.floor || "#152238").replace("#", "0x"), 16) || 0x152238;
      ground.material.color.setHex(floorCol);
      scene.fog.color.setHex(parseInt(String(level.bg?.[0] || "#0a0812").replace("#", "0x"), 16) || 0x0a0812);
    }

    const seenEnemies = new Set();
    enemies.forEach((e) => {
      const key = e._uid != null ? `e_${e._uid}` : `e_${Math.floor(e.x)}_${Math.floor(e.y)}`;
      seenEnemies.add(key);
      let mesh = pools.enemies.get(key);
      if (!mesh) {
        mesh = createCatMesh(e.typeId || "tabby", !!e.isBoss);
        scene.add(mesh);
        pools.enemies.set(key, mesh);
      }
      const pos = worldTo3(e.x, e.y);
      const wobble = Math.sin(gameTime * 0.16 + (e.wobblePhase || 0)) * 1.5;
      const sizeMult = e.isBoss ? 1 : Math.max(0.75, (e.size || 16) / 14);
      mesh.position.set(pos.x, wobble, pos.z);
      mesh.rotation.y = Math.atan2(player.x - e.x, player.y - e.y);
      mesh.scale.set(sizeMult, sizeMult, sizeMult);
      if (e.hitFlash > 0) {
        mesh.traverse((c) => {
          if (c.material && c.material.emissive) {
            c.material.emissive.setHex(0xffffff);
            c.material.emissiveIntensity = 0.6;
          }
        });
      } else {
        mesh.traverse((c) => {
          if (c.material && c.material.emissive && c.material.emissiveIntensity > 0.5) return;
          if (c.material && c.material.emissive) c.material.emissiveIntensity = 0;
        });
      }
      mesh.visible = true;
    });
    pools.enemies.forEach((mesh, key) => {
      if (!seenEnemies.has(key)) {
        scene.remove(mesh);
        pools.enemies.delete(key);
      }
    });

    while (pools.projectiles.length < projectiles.length) {
      const m = new T.Mesh(
        new T.SphereGeometry(0.55 * S, 8, 8),
        mat(0x00f5ff, { emissive: 0x00f5ff, emissiveIntensity: 0.65 })
      );
      m.castShadow = true;
      scene.add(m);
      pools.projectiles.push(m);
    }
    projectiles.forEach((pr, i) => {
      const m = pools.projectiles[i];
      m.visible = true;
      const pos = worldTo3(pr.x, pr.y);
      m.position.set(pos.x, 1.4 * S, pos.z);
      const col = pr.type === "plasma" ? 0xff6347 : pr.type === "dart" ? 0xff69b4 : pr.type === "arrow" ? 0xc8a060 : 0xc0c0c0;
      m.material.color.setHex(col);
      m.material.emissive.setHex(col);
    });
    for (let i = projectiles.length; i < pools.projectiles.length; i++) {
      pools.projectiles[i].visible = false;
    }

    while (pools.gems.length < xpGems.length) {
      const m = new T.Mesh(new T.OctahedronGeometry(0.55 * S, 0), mat(0x00f5ff, { emissive: 0x00f5ff, emissiveIntensity: 0.5 }));
      scene.add(m);
      pools.gems.push(m);
    }
    xpGems.forEach((g, i) => {
      const m = pools.gems[i];
      m.visible = true;
      const pos = worldTo3(g.x, g.y);
      m.position.set(pos.x, (0.9 + Math.sin((gameTime + i) * 0.1) * 0.25) * S, pos.z);
      m.rotation.y = gameTime * 0.06;
    });
    for (let i = xpGems.length; i < pools.gems.length; i++) pools.gems[i].visible = false;

    const pickupList = pickups || [];
    while (pools.pickups.length < pickupList.length) {
      const m = new T.Mesh(new T.BoxGeometry(1.2 * S, 1.2 * S, 1.2 * S), mat(0x39ff14, { emissive: 0x39ff14, emissiveIntensity: 0.35 }));
      scene.add(m);
      pools.pickups.push(m);
    }
    pickupList.forEach((pk, i) => {
      const m = pools.pickups[i];
      m.visible = true;
      const pos = worldTo3(pk.x, pk.y);
      const bob = Math.sin((pk.bob || 0)) * 0.3 * S;
      m.position.set(pos.x, (1 + bob) * S, pos.z);
      m.rotation.y = gameTime * 0.04 + i;
      const cols = { heal: 0x39ff14, damage: 0xff6347, speed: 0x00f5ff, magnet: 0xffd700 };
      const c = cols[pk.type] || 0xffffff;
      m.material.color.setHex(c);
      m.material.emissive.setHex(c);
    });
    for (let i = pickupList.length; i < pools.pickups.length; i++) pools.pickups[i].visible = false;

    const decorSeen = new Set();
    (decor || []).filter((_, idx) => idx % 2 === 0).slice(0, 120).forEach((d) => {
      const key = `d_${Math.floor(d.x / 80)}_${Math.floor(d.y / 80)}_${d.type}`;
      decorSeen.add(key);
      let mesh = pools.decor.get(key);
      if (!mesh) {
        if (d.type === "tree") mesh = createTree();
        else if (d.type === "building") mesh = createBuilding(d.w || 60, d.h || 90);
        else if (d.type === "crystal") mesh = createCrystal(0x00d4aa);
        else if (d.type === "rock") mesh = createRock(d.r || 14);
        else if (d.type === "pillar") {
          mesh = new T.Group();
          const pillar = new T.Mesh(new T.CylinderGeometry(1.1 * S, 1.4 * S, (d.h || 80) * 0.08 * S, 6), mat(0x5a4a30));
          pillar.position.y = ((d.h || 80) * 0.08 * S) / 2;
          pillar.castShadow = true;
          mesh.add(pillar);
        } else return;
        scene.add(mesh);
        pools.decor.set(key, mesh);
      }
      const pos = worldTo3(d.x, d.y);
      mesh.position.set(pos.x, 0, pos.z);
      mesh.visible = true;
    });
    pools.decor.forEach((mesh, key) => {
      if (!decorSeen.has(key)) {
        scene.remove(mesh);
        pools.decor.delete(key);
      }
    });

    const resSeen = new Set();
    if (drgWorld && drgWorld.resourceNodes) {
      drgWorld.resourceNodes.forEach((node, idx) => {
        if (node.mined) return;
        const key = `r_${idx}_${Math.floor(node.x / 10)}`;
        resSeen.add(key);
        let mesh = pools.resources.get(key);
        if (!mesh) {
          mesh = createResourceNode(node.type);
          scene.add(mesh);
          pools.resources.set(key, mesh);
        }
        const pos = worldTo3(node.x, node.y);
        const pulse = 1 + Math.sin(node.pulse || 0) * 0.1;
        mesh.position.set(pos.x, 0, pos.z);
        mesh.scale.setScalar(pulse);
        mesh.visible = true;
      });
    }
    pools.resources.forEach((mesh, key) => {
      if (!resSeen.has(key)) {
        scene.remove(mesh);
        pools.resources.delete(key);
      }
    });

    if (podGroup) {
      if (drgWorld && drgWorld.extractionPod && drgWorld.showPod) {
        const pos = worldTo3(drgWorld.extractionPod.x, drgWorld.extractionPod.y);
        podGroup.position.set(pos.x, 0, pos.z);
        podGroup.visible = true;
        podGroup.rotation.y = gameTime * 0.02;
      } else {
        podGroup.visible = false;
      }
    }
  }

  function render3D() {
    if (!active || !renderer) return;
    renderer.render(scene, camera);
  }

  window.WorldRenderer3D = {
    get active() { return active; },
    init: initRenderer3D,
    resize,
    sync: syncFrame,
    render: render3D,
  };
})();
