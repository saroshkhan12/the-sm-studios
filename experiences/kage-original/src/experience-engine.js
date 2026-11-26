import * as THREE from "three";

export function mountExperience(root) {
const mount = root.querySelector("#scene");
const fallback = root.querySelector("#fallback");
const chapters = [...root.querySelectorAll(".chapter")];
const navLinks = [...root.querySelectorAll(".chapter-nav a")];
const motionButton = root.querySelector("#motion-toggle");
const isDocumentRoot = root === document.body;
const scrollTarget = isDocumentRoot ? window : root;
const viewportWidth = () => isDocumentRoot ? window.innerWidth : (root.clientWidth || window.innerWidth);
const viewportHeight = () => isDocumentRoot ? window.innerHeight : (root.clientHeight || window.innerHeight);
const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
let paused = reduceMotion, scrollProgress = 0, targetProgress = 0, frame = 0;
let renderer, scene, camera, clock, resizeObserver, observer;

motionButton.setAttribute("aria-pressed", String(paused));
motionButton.textContent = paused ? "RESUME MOTION" : "PAUSE MOTION";

const rand = (min, max) => min + Math.random() * (max - min);
const material = (color, roughness = 0.9, metalness = 0.02) =>
  new THREE.MeshStandardMaterial({ color, roughness, metalness });
const add = (parent, geometry, mat, position, rotation) => {
  const mesh = new THREE.Mesh(geometry, mat);
  if (position) mesh.position.set(...position);
  if (rotation) mesh.rotation.set(...rotation);
  parent.add(mesh);
  return mesh;
};

// Shared static geometry/materials reduce GPU resource duplication across repeated foliage.
const sharedTreeTrunkGeometry = new THREE.CylinderGeometry(.12, .28, 3.7, 9);
const sharedTreeCrownGeometry = new THREE.IcosahedronGeometry(.62, 1);
const sharedTreeBranchMaterial = material("#40382d");
const sharedShrubGeometry = new THREE.IcosahedronGeometry(.29, 1);
const sharedFernGeometry = new THREE.ConeGeometry(.12, .85, 5);
const sharedRockGeometry = new THREE.DodecahedronGeometry(.4, 0);
const sharedEdgeGeometry = new THREE.DodecahedronGeometry(.175, 0);
const sharedMossGeometry = new THREE.IcosahedronGeometry(.17, 0);
const sharedGrassGeometry = new THREE.ConeGeometry(.035, .4, 4);
sharedGrassGeometry.translate(0, .12, 0);

function makeGroundTexture() {
  const canvas = document.createElement("canvas");
  canvas.width = canvas.height = 256;
  const ctx = canvas.getContext("2d");
  ctx.fillStyle = "#263329";
  ctx.fillRect(0, 0, 256, 256);
  for (let i = 0; i < 8500; i++) {
    const shade = Math.random() > 0.5 ? 1 : 0;
    ctx.fillStyle = shade ? "rgba(119,132,91,.16)" : "rgba(8,18,12,.22)";
    ctx.fillRect(Math.random() * 256, Math.random() * 256, rand(1, 4), rand(1, 4));
  }
  const texture = new THREE.CanvasTexture(canvas);
  texture.wrapS = texture.wrapT = THREE.RepeatWrapping;
  texture.repeat.set(9, 9);
  texture.colorSpace = THREE.SRGBColorSpace;
  return texture;
}


function makeStoneBumpTexture() {
  const canvas = document.createElement("canvas");
  canvas.width = canvas.height = 128;
  const ctx = canvas.getContext("2d");
  ctx.fillStyle = "#858585";
  ctx.fillRect(0, 0, 128, 128);
  for (let i = 0; i < 3200; i++) {
    const shade = Math.random() > .5 ? 1 : 0;
    const value = shade ? rand(145, 220) : rand(35, 105);
    ctx.fillStyle = `rgba(${value},${value},${value},.16)`;
    const size = rand(.35, 2.2);
    ctx.fillRect(rand(0, 128), rand(0, 128), size, size);
  }
  for (let i = 0; i < 34; i++) {
    ctx.strokeStyle = "rgba(30,30,30,.12)";
    ctx.lineWidth = rand(.3, .8);
    ctx.beginPath();
    const x = rand(0, 128), y = rand(0, 128);
    ctx.moveTo(x, y);
    ctx.lineTo(x + rand(-8, 8), y + rand(-3, 3));
    ctx.stroke();
  }
  const texture = new THREE.CanvasTexture(canvas);
  texture.wrapS = texture.wrapT = THREE.RepeatWrapping;
  texture.repeat.set(1.5, 1.5);
  return texture;
}

function makeBarkTexture() {
  const canvas = document.createElement("canvas");
  canvas.width = 128;
  canvas.height = 256;
  const ctx = canvas.getContext("2d");
  ctx.fillStyle = "#594632";
  ctx.fillRect(0, 0, 128, 256);
  for (let i = 0; i < 180; i++) {
    const x = rand(0, 128);
    const width = rand(.4, 2.2);
    const shade = Math.random() > .5 ? "rgba(190,151,103,.18)" : "rgba(20,14,9,.24)";
    ctx.strokeStyle = shade;
    ctx.lineWidth = width;
    ctx.beginPath();
    ctx.moveTo(x, 0);
    ctx.bezierCurveTo(x + rand(-8, 8), 72, x + rand(-10, 10), 180, x + rand(-6, 6), 256);
    ctx.stroke();
  }
  for (let i = 0; i < 12; i++) {
    const x = rand(0, 128), y = rand(0, 256);
    ctx.strokeStyle = "rgba(22,16,11,.2)";
    ctx.lineWidth = rand(.6, 1.4);
    ctx.beginPath();
    ctx.ellipse(x, y, rand(2, 5), rand(5, 12), rand(-.2, .2), 0, Math.PI * 2);
    ctx.stroke();
  }
  const texture = new THREE.CanvasTexture(canvas);
  texture.wrapS = texture.wrapT = THREE.RepeatWrapping;
  texture.repeat.set(1, 1.5);
  texture.colorSpace = THREE.SRGBColorSpace;
  return texture;
}

function createTree(parent, x, z, scale, leafMaterials, trunkMat) {
  const group = new THREE.Group();
  group.position.set(x, 0, z);
  group.scale.setScalar(scale);
  parent.add(group);
  add(group, sharedTreeTrunkGeometry, trunkMat, [0, 1.85, 0]);
  const branchMat = sharedTreeBranchMaterial;
  for (let b = 0; b < 5; b++) {
    const angle = b * 2.399;
    const start = new THREE.Vector3(0, rand(1.4, 2.8), 0);
    const end = new THREE.Vector3(Math.cos(angle) * rand(1.1, 1.8), start.y + rand(.45, 1.3), Math.sin(angle) * rand(1.1, 1.8));
    const mid = start.clone().lerp(end, .55);
    mid.y += .25;
    const curve = new THREE.CatmullRomCurve3([start, mid, end]);
    add(group, new THREE.TubeGeometry(curve, 8, .055, 5, false), branchMat);
    for (let l = 0; l < 2; l++) {
      const t = .45 + l * .12;
      const p = curve.getPoint(Math.min(t, .95));
      const crown = add(group, sharedTreeCrownGeometry,
        leafMaterials[Math.floor(Math.random() * leafMaterials.length)],
        [p.x + rand(-.35, .35), p.y + rand(-.1, .48), p.z + rand(-.35, .35)]);
      const size = rand(.38, .72) / .62;
      crown.scale.set(size * rand(1, 1.45), size * rand(.65, 1.05), size * rand(.8, 1.3));
      crown.rotation.set(rand(-.28, .28), rand(0, Math.PI), rand(-.24, .24));
    }
  }
  for (let i = 0; i < 6; i++) {
    const crown = add(group, sharedTreeCrownGeometry,
      leafMaterials[i % leafMaterials.length],
      [rand(-1.2, 1.2), rand(2.7, 4.5), rand(-1.1, 1.1)]);
    const size = rand(.45, .85) / .62;
    crown.scale.set(size * rand(.9, 1.35), size * rand(.62, .92), size * rand(.82, 1.24));
    crown.rotation.set(rand(-.22, .22), rand(0, Math.PI), rand(-.2, .2));
  }
  return group;
}

function createStone(parent, x, z, width, depth, mat) {
  const shape = new THREE.Shape();
  const points = Array.from({ length: 7 }, (_, i) => {
    const a = (i / 7) * Math.PI * 2;
    const r = rand(.82, 1.08);
    return [Math.cos(a) * width * .5 * r, Math.sin(a) * depth * .5 * r];
  });
  shape.moveTo(points[0][0], points[0][1]);
  points.slice(1).forEach(([px, py]) => shape.lineTo(px, py));
  shape.closePath();
  const geo = new THREE.ExtrudeGeometry(shape, { depth: rand(.12, .2), bevelEnabled: true, bevelSegments: 2, steps: 1, bevelSize: .035, bevelThickness: .025 });
  const stone = add(parent, geo, mat, [x, .02, z], [-Math.PI / 2, rand(-.08, .08), rand(-.08, .08)]);
  stone.castShadow = stone.receiveShadow = true;
}

function createArchitecture(parent) {
  const stone = material("#77796d", .94);
  const darkStone = material("#4a554b", .96);
  const trim = material("#a49a7e", .82);
  const z = -4.1;
  for (const x of [-2.25, 2.25]) {
    add(parent, new THREE.BoxGeometry(.72, 4.3, .72), stone, [x, 2.15, z]);
    add(parent, new THREE.CylinderGeometry(.48, .54, .22, 12), trim, [x, .28, z]);
    add(parent, new THREE.CylinderGeometry(.42, .42, .18, 12), trim, [x, 4.25, z]);
    for (let k = 0; k < 4; k++) {
      add(parent, new THREE.BoxGeometry(.78, .055, .78), darkStone, [x, .65 + k * .9, z]);
    }
    add(parent, new THREE.BoxGeometry(.92, .22, .92), trim, [x, 4.48, z]);
  }
  const arch = add(parent, new THREE.TorusGeometry(2.25, .22, 16, 72, Math.PI), stone, [0, 4.35, z]);
  arch.castShadow = true;
  add(parent, new THREE.BoxGeometry(5.1, .28, .85), darkStone, [0, 4.48, z]);
  for (let i = 0; i < 11; i++) {
    const a = Math.PI - (i / 10) * Math.PI;
    const x = Math.cos(a) * 2.25, y = 4.35 + Math.sin(a) * 2.25;
    add(parent, new THREE.BoxGeometry(.12, .34, .9), trim, [x, y, z], [0, 0, -a + Math.PI / 2]);
  }
  // Original carved relief panels and weathered wall fragments.
  for (const side of [-1, 1]) {
    add(parent, new THREE.BoxGeometry(1.2, 2.2, .24), darkStone, [side * 3.35, 1.5, z - .3]);
    for (let row = 0; row < 5; row++) {
      add(parent, new THREE.BoxGeometry(.72, .035, .035), trim, [side * 3.35, .8 + row * .3, z - .14]);
    }
  }
}

const lanternResources = {
  bronze: material("#51483a", .5, .42),
  warm: new THREE.MeshStandardMaterial({
    color: "#a8753c",
    emissive: "#ffbd6b",
    emissiveIntensity: 1.35,
    roughness: .38,
    metalness: .12
  }),
  glow: new THREE.MeshBasicMaterial({ color: "#ffd69a", transparent: true, opacity: .22, depthWrite: false }),
  baseGeometry: new THREE.CylinderGeometry(.28, .36, .16, 8),
  bodyGeometry: new THREE.BoxGeometry(.48, .52, .48),
  coreGeometry: new THREE.BoxGeometry(.3, .42, .3),
  capGeometry: new THREE.CylinderGeometry(.34, .25, .14, 8),
  roofGeometry: new THREE.ConeGeometry(.38, .3, 8),
  glowGeometry: new THREE.SphereGeometry(.19, 10, 8)
};

function createLantern(parent, x, z, lights) {
  const { bronze, warm, glow: glowMaterial } = lanternResources;
  const base = add(parent, lanternResources.baseGeometry, bronze, [x, .12, z]);
  add(parent, lanternResources.bodyGeometry, bronze, [x, .48, z]);
  add(parent, lanternResources.coreGeometry, warm, [x, .5, z]);
  add(parent, lanternResources.capGeometry, bronze, [x, .82, z]);
  add(parent, lanternResources.roofGeometry, bronze, [x, 1.02, z]);
  const glow = add(parent, lanternResources.glowGeometry, glowMaterial, [x, .52, z]);
  glow.scale.set(1, 1.35, 1);
  const light = new THREE.PointLight("#ffc77e", 11, 12, 1.7);
  light.position.set(x, .72, z);
  parent.add(light);
  lights.push(light);
  return base;
}


function createPathDetail(parent) {
  const moss = [material("#40513b"), material("#566348"), material("#303f32")];
  const pebble = [material("#65695e"), material("#777568"), material("#4b574e")];
  // Broken, offset edging gives the walkway a deliberate, hand-laid silhouette.
  for (let side of [-1, 1]) {
    for (let i = 0; i < 34; i++) {
      const z = 5.3 - i * .78 + rand(-.12, .12);
      const x = side * rand(1.08, 1.52);
      const edge = add(parent, sharedEdgeGeometry,
        pebble[i % pebble.length], [x, rand(.025, .09), z], [rand(-.2,.2), rand(0,Math.PI), rand(-.12,.12)]);
      const edgeSize = rand(.12, .23) / .175;
      edge.scale.set(edgeSize * rand(1.1,1.7), edgeSize * .48, edgeSize * rand(.75,1.2));
      if (i % 3 === 0) {
        const mossPatch = add(parent, sharedMossGeometry,
          moss[i % moss.length], [x + side * .22, .045, z + .16]);
        const mossSize = rand(.12, .22) / .17;
        mossPatch.scale.set(mossSize * 1.7, mossSize * .22, mossSize);
      }
    }
  }
  // Small grass blades are grouped into tufts to add scale without excessive draw calls.
  for (let i = 0; i < 42; i++) {
    const x = (Math.random() > .5 ? 1 : -1) * rand(1.8,4.8), z = rand(-21,7);
    const tuft = new THREE.Group();
    tuft.position.set(x,0,z);
    parent.add(tuft);
    for (let blade = 0; blade < 3; blade++) {
      const stem = add(tuft, sharedGrassGeometry,
        moss[(i + blade) % moss.length],
        [rand(-.12,.12), .16, rand(-.12,.12)], [rand(-.22,.22), rand(0,Math.PI), rand(-.3,.3)]);
      stem.scale.y = rand(.7, 1.3);
    }
  }
}

function createGardenAccents(parent) {
  const paleStone = material("#8b8978", .88);
  const bronze = material("#756044", .48, .38);
  // Low carved markers make the approach feel designed rather than randomly populated.
  for (const side of [-1,1]) {
    for (let i = 0; i < 3; i++) {
      const z = -2.4 - i * 6.1;
      add(parent, new THREE.CylinderGeometry(.19,.24,.62,8), paleStone, [side * 3.15,.31,z]);
      add(parent, new THREE.CylinderGeometry(.28,.28,.09,8), bronze, [side * 3.15,.64,z]);
      add(parent, new THREE.SphereGeometry(.075,8,6), material("#c9a36d",.42,.35), [side * 3.15,.73,z]);
    }
  }
  // A restrained circular stone inlay anchors the final approach.
  const inlay = add(parent, new THREE.TorusGeometry(1.25,.045,8,64),
    paleStone, [0,.035,-19.2], [Math.PI/2,0,0]);
  inlay.scale.set(1.15,1,1);
}


function createChapterLandmarks(parent, leafMaterials, trunkMat) {
  // Five deliberately composed landmarks align with the five narrative beats.
  // Each remains part of the same continuous garden rather than a set of disconnected rooms.
  const stone = material("#77796d", .94);
  const pale = material("#9b967f", .88);
  const bronze = material("#766044", .48, .36);

  // Arrival: a low, weathered threshold in the foreground frames the first view.
  const arrivalRing = add(parent, new THREE.TorusGeometry(2.05, .075, 10, 72),
    pale, [0, .055, 1.5], [Math.PI / 2, 0, 0]);
  arrivalRing.scale.set(1.25, 1, 1);
  for (let i = 0; i < 7; i++) {
    const a = (i / 7) * Math.PI * 2;
    add(parent, new THREE.BoxGeometry(.42, .22, .32), stone,
      [Math.cos(a) * 2.35, .08, 1.5 + Math.sin(a) * 1.55],
      [0, -a, rand(-.08, .08)]);
  }

  // Still Water: a broken outer coping and stepping stones make the basin a focal court.
  for (let i = 0; i < 12; i++) {
    const a = (i / 12) * Math.PI * 2;
    const coping = add(parent, new THREE.BoxGeometry(.72, .18, .28), pale,
      [Math.cos(a) * 2.85, .12, -10.6 + Math.sin(a) * 2.85], [0, -a, 0]);
    coping.rotation.y = -a;
  }
  for (let i = 0; i < 5; i++) {
    createStone(parent, (i % 2 ? 1 : -1) * (.9 + i * .18), -7.4 - i * .65,
      .85, .55, i % 2 ? pale : stone);
  }

  // Last Light: a small grove gives the lanterns a distinct enclosing silhouette.
  for (const [x, z, scale] of [[-5.4, -14.2, 1.18], [5.3, -15.8, 1.12], [-4.8, -19.1, .9], [4.9, -20.1, .92]]) {
    createTree(parent, x, z, scale, leafMaterials, trunkMat);
  }
  for (const [x, z] of [[-2.2, -14.1], [2.25, -17.4]]) {
    add(parent, new THREE.CylinderGeometry(.12, .2, 1.15, 8), stone, [x, .56, z]);
    add(parent, new THREE.CylinderGeometry(.24, .24, .12, 8), bronze, [x, 1.18, z]);
  }

  // Return: a quiet, open court and a smaller freestanding portal resolve the journey.
  const court = add(parent, new THREE.CylinderGeometry(3.1, 3.25, .16, 48),
    material("#4a554b", .96), [0, -.015, -23.4]);
  court.receiveShadow = true;
  for (let i = 0; i < 9; i++) {
    createStone(parent, rand(-1.8, 1.8), -19.7 - i * .58, rand(.8, 1.25), .48, i % 2 ? pale : stone);
  }
  const portal = new THREE.Group();
  portal.position.set(0, 0, -25.2);
  parent.add(portal);
  for (const x of [-1.65, 1.65]) {
    add(portal, new THREE.BoxGeometry(.34, 3.15, .38), pale, [x, 1.57, 0]);
    add(portal, new THREE.BoxGeometry(.58, .18, .56), bronze, [x, 3.2, 0]);
  }
  add(portal, new THREE.TorusGeometry(1.65, .16, 12, 48, Math.PI),
    pale, [0, 3.1, 0]);
  add(portal, new THREE.BoxGeometry(3.55, .2, .48), stone, [0, 3.12, 0]);
  portal.scale.setScalar(.82);
}

function createScene() {
  scene = new THREE.Scene();
  scene.background = new THREE.Color("#111713");
  scene.fog = new THREE.FogExp2("#1a2821", .026);
  camera = new THREE.PerspectiveCamera(42, viewportWidth() / viewportHeight(), .1, 130);
  camera.position.set(0, 3.6, 13);

  renderer = new THREE.WebGLRenderer({ antialias: viewportWidth() > 700, powerPreference: "high-performance" });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, viewportWidth() < 700 ? 1 : 1.25));
  renderer.setSize(viewportWidth(), viewportHeight());
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.28;
  renderer.shadowMap.enabled = viewportWidth() > 700;
  renderer.shadowMap.type = THREE.PCFSoftShadowMap;
  mount.appendChild(renderer.domElement);

  const hemisphere = new THREE.HemisphereLight("#c6d4c9", "#111a14", 1.25);
  scene.add(hemisphere);
  const moon = new THREE.DirectionalLight("#c3d2df", 2.6);
  moon.position.set(-7, 12, 8);
  moon.castShadow = viewportWidth() > 700;
  moon.shadow.mapSize.set(viewportWidth() < 1100 ? 768 : 1536, viewportWidth() < 1100 ? 768 : 1536);
  moon.shadow.camera.near = .5;
  moon.shadow.camera.far = 48;
  moon.shadow.bias = -0.00018;
  moon.shadow.normalBias = 0.035;
  moon.shadow.radius = 4;
  moon.shadow.camera.left = moon.shadow.camera.bottom = -18;
  moon.shadow.camera.right = moon.shadow.camera.top = 18;
  scene.add(moon);
  const fill = new THREE.DirectionalLight("#d3a875", .55);
  fill.position.set(6, 4, -10);
  scene.add(fill);

  const garden = new THREE.Group();
  scene.add(garden);
  const groundMat = new THREE.MeshStandardMaterial({ color: "#66705a", map: makeGroundTexture(), roughness: 1 });
  const groundGeo = new THREE.PlaneGeometry(100, 100, 70, 70);
  const pos = groundGeo.attributes.position;
  for (let i = 0; i < pos.count; i++) {
    const x = pos.getX(i), y = pos.getY(i);
    pos.setZ(i, Math.sin(x * .22) * .08 + Math.cos(y * .18) * .07 + rand(-.035, .035));
  }
  groundGeo.computeVertexNormals();
  const ground = add(garden, groundGeo, groundMat, [0, -.12, 0], [-Math.PI / 2, 0, 0]);
  ground.receiveShadow = true;
  ground.castShadow = false;

  const stoneBump = makeStoneBumpTexture();
  const pathMats = [material("#858477"), material("#696e64"), material("#a09a84"), material("#5d665e")];
  pathMats.forEach((mat) => {
    mat.bumpMap = stoneBump;
    mat.bumpScale = .035;
  });
  for (let i = 0; i < 15; i++) createStone(garden, rand(-.22, .22), 5 - i * 1.12, rand(1.55, 2.25), rand(.72, 1.08), pathMats[i % pathMats.length]);

  const walls = material("#34443a");
  for (const side of [-1, 1]) {
    add(garden, new THREE.BoxGeometry(.4, 2.1, 24), walls, [side * 5.4, .92, -5]);
    for (let i = 0; i < 12; i++) {
      const post = add(garden, new THREE.BoxGeometry(.5, rand(.7, 1.5), .55), material("#536052"), [side * rand(4.9, 5.8), rand(.35, .75), -15 + i * 1.85]);
      post.rotation.y = rand(-.15, .15);
    }
  }
  createArchitecture(garden);
  createPathDetail(garden);
  createGardenAccents(garden);
  const leafMaterials = [material("#203b2d"), material("#294733"), material("#36513a"), material("#1b3027")];
  const trunkMat = new THREE.MeshStandardMaterial({
    color: "#9a805f",
    map: makeBarkTexture(),
    roughness: .98
  });
  createChapterLandmarks(garden, leafMaterials, trunkMat);

  // Layered woodland canopy: foreground, mid-ground and distant silhouettes.

  const treeGroups = [];
  for (let i = 0; i < (viewportWidth() < 700 ? 9 : 14); i++) {
    const side = i % 2 ? 1 : -1;
    const z = 4 - Math.floor(i / 2) * 2.15 + rand(-.8, .8);
    const x = side * rand(4.2, 8.5);
    treeGroups.push(createTree(garden, x, z, rand(.72, 1.55), leafMaterials, trunkMat));
  }
  // Low shrubs and fern-like foliage along the walk.
  const shrubMats = [material("#38523a"), material("#4a6241"), material("#273d30")];
  for (let i = 0; i < (viewportWidth() < 700 ? 34 : 54); i++) {
    const side = Math.random() > .5 ? 1 : -1;
    const x = side * rand(2.4, 5.3), z = rand(-19, 7);
    const shrub = add(garden, sharedShrubGeometry,
      shrubMats[i % shrubMats.length], [x, rand(.12, .35), z]);
    const shrubSize = rand(.16, .42) / .29;
    shrub.scale.set(shrubSize * 1.6, shrubSize * .65, shrubSize);
    if (i % 4 === 0) {
      const fern = add(garden, sharedFernGeometry,
        shrubMats[(i + 1) % shrubMats.length], [x + rand(-.25, .25), .5, z]);
      fern.scale.y = rand(.6, 1.1) / .85;
      fern.rotation.z = rand(-.5, .5);
    }
  }
  // Mossy stones and roots give the ground a readable foreground scale.
  const rockMats = [material("#656957"), material("#515d4b")];
  for (let i = 0; i < (viewportWidth() < 700 ? 14 : 22); i++) {
    const x = (Math.random() > .5 ? 1 : -1) * rand(2.5, 6.5), z = rand(-21, 8);
    const rock = add(garden, sharedRockGeometry,
      rockMats[i % rockMats.length], [x, rand(.08, .3), z]);
    const rockSize = rand(.18, .62) / .4;
    rock.scale.set(rockSize, rockSize * .55, rockSize);
  }

  const lights = [];
  [[-3.5, -1.2], [3.55, -5.8], [-3.45, -10.2], [3.4, -15.2], [-2.8, -18.5]].forEach(([x, z]) => createLantern(garden, x, z, lights));

  const basin = add(garden, new THREE.CylinderGeometry(2.45, 2.7, .42, 64), material("#46544c"), [0, .16, -10.6]);
  basin.castShadow = basin.receiveShadow = true;
  const waterMaterial = new THREE.ShaderMaterial({
    transparent: true,
    uniforms: { uTime: { value: 0 }, uColor: { value: new THREE.Color("#547b79") } },
    vertexShader: `varying vec3 vWorld; varying vec3 vView; void main(){ vec4 world=modelMatrix*vec4(position,1.0); vec4 view=viewMatrix*world; vWorld=world.xyz; vView=-view.xyz; gl_Position=projectionMatrix*view; }`,
    fragmentShader: `uniform float uTime; uniform vec3 uColor; varying vec3 vWorld; varying vec3 vView; void main(){
      vec2 p=vWorld.xz;
      float radius=length(p);
      float broad=sin(radius*5.2-uTime*1.35);
      float fine=sin(p.x*13.0+p.y*8.0-uTime*1.9)*0.12;
      float crossWave=sin(p.x*4.2-p.y*3.6+uTime*.42)*0.16;
      float wave=broad*.5+fine+crossWave;
      float slope=cos(radius*5.2-uTime*1.35)*.18;
      vec3 normal=normalize(vec3(-slope*(p.x/max(radius,.001)),1.0,-slope*(p.y/max(radius,.001))));
      vec3 viewDir=normalize(vView);
      float fresnel=pow(1.0-max(dot(normal,viewDir),0.0),2.0);
      float glint=pow(max(dot(reflect(normalize(vec3(-.35,-.8,-.25)),normal),viewDir),0.0),20.0);
      float rippleLine=smoothstep(.78,.98,abs(broad));
      vec3 deep=uColor*mix(.78,1.12,.5+.5*wave);
      vec3 highlight=vec3(.72,.82,.76)*(fresnel*.32+glint*.28+rippleLine*.09);
      vec3 col=deep+highlight;
      gl_FragColor=vec4(col,.9);
    }`
  });
  const water = add(garden, new THREE.CircleGeometry(2.23, 96), waterMaterial, [0, .405, -10.6], [-Math.PI / 2, 0, 0]);
  const rippleRings = [];
  for (let i = 0; i < 3; i++) {
    const ring = add(garden, new THREE.TorusGeometry(.25 + i * .48, .012, 5, 72),
      new THREE.MeshBasicMaterial({ color: "#b1c9b4", transparent: true, opacity: .2, depthWrite: false }),
      [rand(-.45, .45), .425 + i * .001, -10.6 + rand(-.45, .45)], [Math.PI / 2, 0, 0]);
    ring.userData.ripple = i;
    rippleRings.push(ring);
  }

  // A distant, softly lit second threshold gives the later chapters a new focal point.
  const farArch = new THREE.Group();
  farArch.position.set(0, 0, -21);
  garden.add(farArch);
  createArchitecture(farArch);
  farArch.scale.setScalar(.52);

  const starPositions = [];
  const starCount = viewportWidth() < 700 ? 420 : 900;
  for (let i = 0; i < starCount; i++) starPositions.push(rand(-42, 42), rand(5, 28), rand(-42, 15));
  const starsGeo = new THREE.BufferGeometry();
  starsGeo.setAttribute("position", new THREE.Float32BufferAttribute(starPositions, 3));
  const stars = new THREE.Points(starsGeo, new THREE.PointsMaterial({ color: "#c3d4c4", size: .045, transparent: true, opacity: .52 }));
  scene.add(stars);

  const moteCount = viewportWidth() < 700 ? 90 : 180;
  const motePositions = new Float32Array(moteCount * 3);
  for (let i = 0; i < moteCount; i++) {
    motePositions[i * 3] = rand(-8, 8);
    motePositions[i * 3 + 1] = rand(.1, 5);
    motePositions[i * 3 + 2] = rand(-24, 9);
  }
  const moteGeo = new THREE.BufferGeometry();
  moteGeo.setAttribute("position", new THREE.BufferAttribute(motePositions, 3));
  const motes = new THREE.Points(moteGeo, new THREE.PointsMaterial({ color: "#f1d3a0", size: .065, transparent: true, opacity: .72 }));
  scene.add(motes);

  const fogCards = [];
  const fogCardCount = viewportWidth() < 700 ? 4 : 7;
  for (let i = 0; i < fogCardCount; i++) {
    const fog = new THREE.Mesh(new THREE.PlaneGeometry(12, 2.8),
      new THREE.MeshBasicMaterial({ color: "#a6b7a6", transparent: true, opacity: .035, depthWrite: false, side: THREE.DoubleSide }));
    fog.position.set(rand(-3, 3), .7 + i * .18, -3 - i * 3.2);
    fog.rotation.x = -.12;
    scene.add(fog);
    fogCards.push(fog);
  }
  return { garden, lights, motes, stars, water, rippleRings, fogCards, treeGroups, hemisphere, moon, fill };
}

let world;
try {
  world = createScene();
} catch (error) {
  console.warn("WebGL scene unavailable:", error);
  fallback.hidden = false;
  mount.hidden = true;
}

function updateScroll() {
  const maxScroll = (isDocumentRoot ? document.documentElement.scrollHeight : root.scrollHeight) - viewportHeight();
  const currentScroll = isDocumentRoot ? window.scrollY : root.scrollTop;
  targetProgress = maxScroll > 0 ? Math.min(1, Math.max(0, currentScroll / maxScroll)) : 0;
  const activeIndex = Math.min(4, Math.round(targetProgress * 4));
  navLinks.forEach((link, index) => {
    const active = index === activeIndex;
    link.classList.toggle("is-active", active);
    if (active) link.setAttribute("aria-current", "location");
    else link.removeAttribute("aria-current");
  });
}
scrollTarget.addEventListener("scroll", updateScroll, { passive: true });
window.addEventListener("resize", resize);
updateScroll();

observer = new IntersectionObserver((entries) => {
  entries.forEach((entry) => {
    if (entry.isIntersecting) {
      const index = Number(entry.target.dataset.chapter || 0);
      navLinks.forEach((link, i) => {
        link.classList.toggle("is-active", i === index);
        if (i === index) link.setAttribute("aria-current", "location");
        else link.removeAttribute("aria-current");
      });
    }
  });
}, { root: isDocumentRoot ? null : root, threshold: .48 });
chapters.forEach((chapter) => observer.observe(chapter));

function handleMotionToggle() {
  paused = !paused;
  motionButton.setAttribute("aria-pressed", String(paused));
  motionButton.textContent = paused ? "RESUME MOTION" : "PAUSE MOTION";
}
motionButton.addEventListener("click", handleMotionToggle);

function resize() {
  if (!renderer || !camera) return;
  camera.aspect = viewportWidth() / viewportHeight();
  camera.fov = viewportWidth() < 650 ? 54 : 42;
  camera.updateProjectionMatrix();
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, viewportWidth() < 700 ? 1 : 1.25));
  renderer.setSize(viewportWidth(), viewportHeight());
  renderer.shadowMap.enabled = viewportWidth() > 700;
}
resizeObserver = new ResizeObserver(resize);
resizeObserver.observe(root);

const chapterCamera = [
  { x: 0, y: 3.55, z: 12.5, tx: 0, ty: 1.35, tz: 1.2 },
  { x: -.65, y: 3.8, z: 6.2, tx: 0, ty: 2.05, tz: -4.4 },
  { x: .35, y: 3.25, z: -.2, tx: 0, ty: .45, tz: -10.6 },
  { x: -.45, y: 3.55, z: -6.6, tx: 0, ty: 1.65, tz: -16.8 },
  { x: 0, y: 4.05, z: -14.7, tx: 0, ty: 1.85, tz: -24.2 }
];
const chapterAtmosphere = [
  { sky: "#c6d4c9", ground: "#111a14", fog: "#1a2821", fill: "#d3a875", fillPower: .42, hemi: 1.18 },
  { sky: "#b8c8c4", ground: "#111a16", fog: "#1b2924", fill: "#c6ad89", fillPower: .48, hemi: 1.2 },
  { sky: "#a9c2c7", ground: "#10191a", fog: "#1b292b", fill: "#9dbfc1", fillPower: .38, hemi: 1.28 },
  { sky: "#d5b995", ground: "#171711", fog: "#30271d", fill: "#e4a65f", fillPower: .82, hemi: 1.12 },
  { sky: "#c5cfc4", ground: "#101711", fog: "#1a251e", fill: "#c8b18a", fillPower: .5, hemi: 1.16 }
];
const atmosphereColors = chapterAtmosphere.map((item) => ({
  sky: new THREE.Color(item.sky),
  ground: new THREE.Color(item.ground),
  fog: new THREE.Color(item.fog),
  fill: new THREE.Color(item.fill)
}));
const atmosphereScratch = {
  sky: new THREE.Color(),
  ground: new THREE.Color(),
  fog: new THREE.Color(),
  fill: new THREE.Color()
};

function animate() {
  frame = requestAnimationFrame(animate);
  if (!renderer || !world) return;
  if (!clock) clock = new THREE.Clock();
  const delta = Math.min(clock.getDelta(), .05);
  const elapsed = clock.elapsedTime;
  scrollProgress += (targetProgress - scrollProgress) * (1 - Math.exp(-delta * 3.4));
  const p = scrollProgress;
  const scaled = p * 4;
  const index = Math.min(3, Math.floor(scaled));
  const blend = THREE.MathUtils.smoothstep(scaled - index, 0, 1);
  const a = chapterCamera[index];
  const b = chapterCamera[index + 1];
  const mix = (key) => THREE.MathUtils.lerp(a[key], b[key], blend);
  const mobile = viewportWidth() < 650;
  const desiredX = mix("x") * (mobile ? .62 : 1);
  camera.position.x = THREE.MathUtils.damp(camera.position.x, desiredX, 3.1, delta);
  camera.position.y = THREE.MathUtils.damp(camera.position.y, mix("y"), 3.1, delta);
  camera.position.z = THREE.MathUtils.damp(camera.position.z, mix("z"), 3.1, delta);
  camera.lookAt(mix("tx"), mix("ty"), mix("tz"));

  const atmosphereA = chapterAtmosphere[index];
  const atmosphereB = chapterAtmosphere[index + 1];
  const colorsA = atmosphereColors[index];
  const colorsB = atmosphereColors[index + 1];
  const colorMix = (key) => atmosphereScratch[key].lerpColors(colorsA[key], colorsB[key], blend);
  scene.background.copy(colorMix("fog"));
  scene.fog.color.copy(atmosphereScratch.fog);
  world.hemisphere.color.copy(colorMix("sky"));
  world.hemisphere.groundColor.copy(colorMix("ground"));
  world.hemisphere.intensity = THREE.MathUtils.lerp(atmosphereA.hemi, atmosphereB.hemi, blend);
  world.fill.color.copy(colorMix("fill"));
  world.fill.intensity = THREE.MathUtils.lerp(atmosphereA.fillPower, atmosphereB.fillPower, blend);

  if (!paused) {
    world.garden.rotation.y = Math.sin(elapsed * .08) * .006;
    world.treeGroups.forEach((tree, i) => {
      tree.rotation.z = Math.sin(elapsed * .32 + i * 1.7) * .006;
    });
    const lanternChapter = THREE.MathUtils.smoothstep(p, .56, .82);
    world.lights.forEach((light, i) => {
      const pulse = Math.sin(elapsed * 1.3 + i * 1.7) * .55;
      const lanternFocus = i >= 3 ? lanternChapter : .35 + lanternChapter * .35;
      light.intensity = 7.6 + lanternFocus * 4.8 + pulse;
      light.distance = 10 + lanternFocus * 3;
    });
    world.water.material.uniforms.uTime.value = elapsed;
    world.rippleRings.forEach((ring, i) => {
      const phase = (elapsed * .22 + i / 3) % 1;
      const expansion = .82 + phase * .62;
      ring.scale.setScalar(expansion);
      ring.material.opacity = .2 * (1 - phase) * (1 - phase);
    });
    const positions = world.motes.geometry.attributes.position;
    for (let i = 0; i < positions.count; i++) {
      positions.array[i * 3 + 1] += .003;
      if (positions.array[i * 3 + 1] > 5.5) positions.array[i * 3 + 1] = .08;
    }
    positions.needsUpdate = true;
    world.fogCards.forEach((fog, i) => {
      fog.position.x = Math.sin(elapsed * .12 + i) * 2.4;
      fog.material.opacity = .025 + lanternChapter * .012;
    });
  }
  renderer.render(scene, camera);
}
if (world) animate();

const handleVisibility = () => {
  if (document.hidden) cancelAnimationFrame(frame);
  else if (world) animate();
};
document.addEventListener("visibilitychange", handleVisibility);

return () => {
  cancelAnimationFrame(frame);
  scrollTarget.removeEventListener("scroll", updateScroll);
  window.removeEventListener("resize", resize);
  motionButton?.removeEventListener("click", handleMotionToggle);
  document.removeEventListener("visibilitychange", handleVisibility);
  observer?.disconnect();
  resizeObserver?.disconnect();
  if (scene) scene.traverse((object) => {
    if (!object.isMesh && !object.isPoints) return;
    object.geometry?.dispose?.();
    const materials = Array.isArray(object.material) ? object.material : [object.material];
    materials.filter(Boolean).forEach((mat) => {
      Object.values(mat).forEach((value) => { if (value && value.isTexture) value.dispose(); });
      mat.dispose?.();
    });
  });
  renderer?.renderLists?.dispose?.();
  renderer?.dispose();
  renderer?.domElement?.remove();
};
}
