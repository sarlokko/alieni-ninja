(() => {
  "use strict";

  const T = window.THREE;
  if (!T) {
    window.WorldRenderer3D = { active: false, init: () => false };
    return;
  }

  const S = 16 * 1.3; // ~30% più grande rispetto a v46
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
    const scale = (isBoss ? 2.4 : 1) * S;
    const colors = {
      kitten: { b: 0xcc8844, h: 0xdd9955, e: 0xff4400 },
      tabby: { b: 0xb07030, h: 0xc08040, e: 0xff3300 },
      hunter: { b: 0x886644, h: 0x997755, e: 0xff2200 },
      archer: { b: 0x6a7040, h: 0x7a8050, e: 0xaaff44 },
      werewolf: { b: 0x662222, h: 0x883333, e: 0xff1100 },
      shadow: { b: 0x442266, h: 0x553388, e: 0xcc44ff },
    };
    const c = isBoss ? { b: 0x881100, h: 0xcc2200, e: 0xff6600 } : (colors[typeId] || colors.tabby);

    const body = box(1.4 * scale, 0.9 * scale, 2 * scale, c.b);
    body.position.y = 0.55 * scale;
    g.add(body);

    const head = box(1.1 * scale, 0.85 * scale, 1.1 * scale, c.h);
    head.position.set(0, 1.05 * scale, 1.05 * scale);
    g.add(head);

    [-0.45, 0.45].forEach((x) => {
      const ear = new T.Mesh(new T.ConeGeometry(0.22 * scale, 0.45 * scale, 4), mat(c.h));
      ear.position.set(x * scale, 1.45 * scale, 1.15 * scale);
      ear.castShadow = true;
      g.add(ear);
    });

    [[-0.35, 0.25], [0.35, 0.25]].forEach(([x, z]) => {
      const eye = box(0.18 * scale, 0.14 * scale, 0.08 * scale, c.e, { emissive: c.e, emissiveIntensity: 0.9 });
      eye.position.set(x * scale, 1.08 * scale, 1.62 * scale);
      g.add(eye);
    });

    const tail = new T.Mesh(new T.CylinderGeometry(0.12 * scale, 0.08 * scale, 1.2 * scale, 5), mat(c.b));
    tail.rotation.x = Math.PI / 2.5;
    tail.position.set(0, 0.75 * scale, -1.35 * scale);
    tail.castShadow = true;
    g.add(tail);

    [[-0.5, 0.4], [0.5, 0.4], [-0.35, -0.35], [0.35, -0.35]].forEach(([x, z]) => {
      const leg = box(0.28 * scale, 0.55 * scale, 0.28 * scale, 0x333333);
      leg.position.set(x * scale, 0.28 * scale, z * scale);
      g.add(leg);
    });

    if (isBoss) {
      body.material.emissive = new T.Color(0x440000);
      body.material.emissiveIntensity = 0.45;
      const ring = new T.Mesh(
        new T.TorusGeometry(2.2 * scale, 0.15 * scale, 6, 24),
        mat(0xff4400, { emissive: 0xff4400, emissiveIntensity: 0.5 })
      );
      ring.rotation.x = Math.PI / 2;
      ring.position.y = 0.2 * scale;
      g.add(ring);
    }

    return g;
  }

  function createNinjaMesh(heroId) {
    const g = new T.Group();
    const col = COL[heroId] || 0x1e90ff;
    const dark = new T.Color(col).multiplyScalar(0.45).getHex();

    const torso = box(1.1 * S, 1.2 * S, 0.65 * S, col, { metalness: 0.4 });
    torso.position.y = 1.1 * S;
    g.add(torso);

    const head = new T.Mesh(new T.BoxGeometry(0.75 * S, 0.75 * S, 0.75 * S), mat(0x222233));
    head.position.y = 2 * S;
    head.castShadow = true;
    g.add(head);

    const visor = box(0.78 * S, 0.18 * S, 0.12 * S, col, { emissive: col, emissiveIntensity: 0.75 });
    visor.position.set(0, 2.02 * S, 0.42 * S);
    g.add(visor);

    const scarf = new T.Mesh(new T.CylinderGeometry(0.5 * S, 0.55 * S, 0.15 * S, 6), mat(col));
    scarf.position.y = 1.65 * S;
    scarf.castShadow = true;
    g.add(scarf);

    [-0.75, 0.75].forEach((x) => {
      const arm = box(0.28 * S, 0.85 * S, 0.28 * S, dark);
      arm.position.set(x * S, 1.15 * S, 0);
      g.add(arm);
    });

    [-0.35, 0.35].forEach((x) => {
      const leg = box(0.32 * S, 0.9 * S, 0.32 * S, dark);
      leg.position.set(x * S, 0.45 * S, 0);
      g.add(leg);
    });

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
      new T.RingGeometry(1.2 * S, 1.8 * S, 20),
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
    const camBack = 620;
    const camSide = -340;
    const camH = 780;
    camera.position.set(
      p.x + Math.cos(aim + Math.PI / 2) * camSide * 0.3 + Math.cos(aim + Math.PI) * camBack * 0.15,
      camH,
      p.z + Math.sin(aim + Math.PI / 2) * camSide * 0.3 + Math.sin(aim + Math.PI) * camBack * 0.15 + camBack
    );
    camera.lookAt(p.x + Math.cos(aim) * 40, 12 * S, p.z + Math.sin(aim) * 40);

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
      mesh.position.set(pos.x, wobble, pos.z);
      mesh.rotation.y = Math.atan2(player.x - e.x, player.y - e.y);
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
