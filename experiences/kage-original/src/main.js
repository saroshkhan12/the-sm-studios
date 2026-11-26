import * as THREE from "three";
import "./style.css";

const mount = document.querySelector("#scene");
const fallback = document.querySelector("#fallback");
const chapters = [...document.querySelectorAll(".chapter")];
const navLinks = [...document.querySelectorAll(".chapter-nav a")];
const motionButton = document.querySelector("#motion-toggle");
const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
let paused = reduceMotion, scrollProgress = 0, targetProgress = 0, frame = 0;
let renderer, scene, camera, clock, resizeObserver;

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

function createTree(parent, x, z, scale, leafMaterials, trunkMat) {
  const group = new THREE.Group();
  group.position.set(x, 0, z);
  group.scale.setScalar(scale);
  parent.add(group);
  add(group, new THREE.CylinderGeometry(.12, .28, 3.7, 9), trunkMat, [0, 1.85, 0]);
  const branchMat = material("#40382d");
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
      const crown = add(group, new THREE.IcosahedronGeometry(rand(.38, .72), 1),
        leafMaterials[Math.floor(Math.random() * leafMaterials.length)],
        [p.x + rand(-.35, .35), p.y + rand(-.1, .48), p.z + rand(-.35, .35)]);
      crown.scale.set(rand(1, 1.45), rand(.65, 1.05), rand(.8, 1.3));
    }
  }
  for (let i = 0; i < 6; i++) {
    const crown = add(group, new THREE.IcosahedronGeometry(rand(.45, .85), 1),
      leafMaterials[i % leafMaterials.length],
      [rand(-1.2, 1.2), rand(2.7, 4.5), rand(-1.1, 1.1)]);
    crown.scale.set(1.15, .75, 1);
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

function createLantern(parent, x, z, lights) {
  const bronze = material("#51483a", .5, .42);
  const warm = new THREE.MeshBasicMaterial({ color: "#ffd89a" });
  const base = add(parent, new THREE.CylinderGeometry(.28, .36, .16, 8), bronze, [x, .12, z]);
  add(parent, new THREE.BoxGeometry(.48, .52, .48), bronze, [x, .48, z]);
  add(parent, new THREE.BoxGeometry(.3, .42, .3), warm, [x, .5, z]);
  add(parent, new THREE.CylinderGeometry(.34, .25, .14, 8), bronze, [x, .82, z]);
  add(parent, new THREE.ConeGeometry(.38, .3, 8), bronze, [x, 1.02, z]);
  const light = new THREE.PointLight("#ffc77e", 11, 12, 1.7);
  light.position.set(x, .72, z);
  parent.add(light);
  lights.push(light);
  return base;
}

function createScene() {
  scene = new THREE.Scene();
  scene.background = new THREE.Color("#111713");
  scene.fog = new THREE.FogExp2("#1a2821", .026);
  camera = new THREE.PerspectiveCamera(42, innerWidth / innerHeight, .1, 130);
  camera.position.set(0, 3.6, 13);

  renderer = new THREE.WebGLRenderer({ antialias: innerWidth > 700, powerPreference: "high-performance" });
  renderer.setPixelRatio(Math.min(devicePixelRatio, innerWidth < 700 ? 1.2 : 1.65));
  renderer.setSize(innerWidth, innerHeight);
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.28;
  renderer.shadowMap.enabled = innerWidth > 700;
  renderer.shadowMap.type = THREE.PCFSoftShadowMap;
  mount.appendChild(renderer.domElement);

  scene.add(new THREE.HemisphereLight("#c6d4c9", "#111a14", 1.25));
  const moon = new THREE.DirectionalLight("#c3d2df", 2.6);
  moon.position.set(-7, 12, 8);
  moon.castShadow = innerWidth > 700;
  moon.shadow.mapSize.set(1024, 1024);
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

  const pathMats = [material("#858477"), material("#696e64"), material("#a09a84"), material("#5d665e")];
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

  // Layered woodland canopy: foreground, mid-ground and distant silhouettes.
  const leafMaterials = [material("#203b2d"), material("#294733"), material("#36513a"), material("#1b3027")];
  const trunkMat = material("#42372b");
  const treeGroups = [];
  for (let i = 0; i < (innerWidth < 700 ? 10 : 18); i++) {
    const side = i % 2 ? 1 : -1;
    const z = 4 - Math.floor(i / 2) * 2.15 + rand(-.8, .8);
    const x = side * rand(4.2, 8.5);
    treeGroups.push(createTree(garden, x, z, rand(.72, 1.55), leafMaterials, trunkMat));
  }
  // Low shrubs and fern-like foliage along the walk.
  const shrubMats = [material("#38523a"), material("#4a6241"), material("#273d30")];
  for (let i = 0; i < (innerWidth < 700 ? 48 : 82); i++) {
    const side = Math.random() > .5 ? 1 : -1;
    const x = side * rand(2.4, 5.3), z = rand(-19, 7);
    const shrub = add(garden, new THREE.IcosahedronGeometry(rand(.16, .42), 1),
      shrubMats[i % shrubMats.length], [x, rand(.12, .35), z]);
    shrub.scale.set(1.6, .65, 1);
    if (i % 4 === 0) {
      const fern = add(garden, new THREE.ConeGeometry(.12, rand(.6, 1.1), 5),
        shrubMats[(i + 1) % shrubMats.length], [x + rand(-.25, .25), .5, z]);
      fern.rotation.z = rand(-.5, .5);
    }
  }
  // Mossy stones and roots give the ground a readable foreground scale.
  for (let i = 0; i < (innerWidth < 700 ? 18 : 30); i++) {
    const x = (Math.random() > .5 ? 1 : -1) * rand(2.5, 6.5), z = rand(-21, 8);
    const rock = add(garden, new THREE.DodecahedronGeometry(rand(.18, .62), 0),
      material(i % 2 ? "#515d4b" : "#656957"), [x, rand(.08, .3), z]);
    rock.scale.y = .55;
  }

  const lights = [];
  [[-3.5, -1.2], [3.55, -5.8], [-3.45, -10.2], [3.4, -15.2], [-2.8, -18.5]].forEach(([x, z]) => createLantern(garden, x, z, lights));

  const basin = add(garden, new THREE.CylinderGeometry(2.45, 2.7, .42, 64), material("#46544c"), [0, .16, -10.6]);
  basin.castShadow = basin.receiveShadow = true;
  const waterMaterial = new THREE.ShaderMaterial({
    transparent: true,
    uniforms: { uTime: { value: 0 }, uColor: { value: new THREE.Color("#547b79") } },
    vertexShader: `varying vec2 vUv; varying vec3 vWorld; void main(){ vUv=uv; vec4 world=modelMatrix*vec4(position,1.0); vWorld=world.xyz; gl_Position=projectionMatrix*viewMatrix*world; }`,
    fragmentShader: `uniform float uTime; uniform vec3 uColor; varying vec2 vUv; varying vec3 vWorld; void main(){ vec2 p=vWorld.xz; float r=length(p)*5.0-uTime*1.4; float ripple=sin(r)*0.5+sin(r*1.7+1.2)*0.18; float rings=smoothstep(0.86,1.0,abs(ripple)); float sheen=0.5+0.5*sin(p.x*3.0+p.y*2.0+uTime*.35); vec3 col=mix(uColor,uColor*1.65,sheen*.22+rings*.16); gl_FragColor=vec4(col,0.88); }`
  });
  const water = add(garden, new THREE.CircleGeometry(2.23, 96), waterMaterial, [0, .405, -10.6], [-Math.PI / 2, 0, 0]);
  for (let i = 0; i < 3; i++) {
    const ring = add(garden, new THREE.TorusGeometry(.25 + i * .48, .012, 5, 72),
      new THREE.MeshBasicMaterial({ color: "#b1c9b4", transparent: true, opacity: .23, depthWrite: false }),
      [rand(-.45, .45), .425 + i * .001, -10.6 + rand(-.45, .45)], [Math.PI / 2, 0, 0]);
    ring.userData.ripple = i;
  }

  // A distant, softly lit second threshold gives the later chapters a new focal point.
  const farArch = new THREE.Group();
  farArch.position.set(0, 0, -21);
  garden.add(farArch);
  createArchitecture(farArch);
  farArch.scale.setScalar(.52);

  const starPositions = [];
  for (let i = 0; i < 900; i++) starPositions.push(rand(-42, 42), rand(5, 28), rand(-42, 15));
  const starsGeo = new THREE.BufferGeometry();
  starsGeo.setAttribute("position", new THREE.Float32BufferAttribute(starPositions, 3));
  const stars = new THREE.Points(starsGeo, new THREE.PointsMaterial({ color: "#c3d4c4", size: .045, transparent: true, opacity: .52 }));
  scene.add(stars);

  const motePositions = new Float32Array(180 * 3);
  for (let i = 0; i < 180; i++) {
    motePositions[i * 3] = rand(-8, 8);
    motePositions[i * 3 + 1] = rand(.1, 5);
    motePositions[i * 3 + 2] = rand(-24, 9);
  }
  const moteGeo = new THREE.BufferGeometry();
  moteGeo.setAttribute("position", new THREE.BufferAttribute(motePositions, 3));
  const motes = new THREE.Points(moteGeo, new THREE.PointsMaterial({ color: "#f1d3a0", size: .065, transparent: true, opacity: .72 }));
  scene.add(motes);

  const fogCards = [];
  for (let i = 0; i < 7; i++) {
    const fog = new THREE.Mesh(new THREE.PlaneGeometry(12, 2.8),
      new THREE.MeshBasicMaterial({ color: "#a6b7a6", transparent: true, opacity: .035, depthWrite: false, side: THREE.DoubleSide }));
    fog.position.set(rand(-3, 3), .7 + i * .18, -3 - i * 3.2);
    fog.rotation.x = -.12;
    scene.add(fog);
    fogCards.push(fog);
  }
  return { garden, lights, motes, stars, water, fogCards, treeGroups };
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
  const maxScroll = document.documentElement.scrollHeight - innerHeight;
  targetProgress = maxScroll > 0 ? Math.min(1, Math.max(0, scrollY / maxScroll)) : 0;
  const activeIndex = Math.min(4, Math.round(targetProgress * 4));
  navLinks.forEach((link, index) => {
    const active = index === activeIndex;
    link.classList.toggle("is-active", active);
    if (active) link.setAttribute("aria-current", "location");
    else link.removeAttribute("aria-current");
  });
}
addEventListener("scroll", updateScroll, { passive: true });
updateScroll();

const observer = new IntersectionObserver((entries) => {
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
}, { threshold: .48 });
chapters.forEach((chapter) => observer.observe(chapter));

motionButton.addEventListener("click", () => {
  paused = !paused;
  motionButton.setAttribute("aria-pressed", String(paused));
  motionButton.textContent = paused ? "RESUME MOTION" : "PAUSE MOTION";
});

function resize() {
  if (!renderer || !camera) return;
  camera.aspect = innerWidth / innerHeight;
  camera.fov = innerWidth < 650 ? 54 : 42;
  camera.updateProjectionMatrix();
  renderer.setPixelRatio(Math.min(devicePixelRatio, innerWidth < 700 ? 1.1 : 1.65));
  renderer.setSize(innerWidth, innerHeight);
  renderer.shadowMap.enabled = innerWidth > 700;
}
resizeObserver = new ResizeObserver(resize);
resizeObserver.observe(document.documentElement);

function animate() {
  frame = requestAnimationFrame(animate);
  if (!renderer || !world) return;
  if (!clock) clock = new THREE.Clock();
  const elapsed = clock.getElapsedTime();
  scrollProgress += (targetProgress - scrollProgress) * (paused ? .035 : .045);
  const p = scrollProgress, mobile = innerWidth < 650;
  const cameraZ = 12.5 - p * 29;
  const cameraX = Math.sin(p * Math.PI * 1.3) * (mobile ? .3 : 1.1);
  const cameraY = 3.35 + Math.sin(p * Math.PI) * .9;
  camera.position.x += (cameraX - camera.position.x) * .025;
  camera.position.y += (cameraY - camera.position.y) * .025;
  camera.position.z += (cameraZ - camera.position.z) * .025;
  camera.lookAt(0, 1.25, -5 - p * 18);
  if (!paused) {
    world.garden.rotation.y = Math.sin(elapsed * .08) * .006;
    world.lights.forEach((light, i) => { light.intensity = 9.5 + Math.sin(elapsed * 1.3 + i * 1.7) * 1.2; });
    world.water.material.uniforms.uTime.value = elapsed;
    const positions = world.motes.geometry.attributes.position;
    for (let i = 0; i < positions.count; i++) {
      positions.array[i * 3 + 1] += .003;
      if (positions.array[i * 3 + 1] > 5.5) positions.array[i * 3 + 1] = .08;
    }
    positions.needsUpdate = true;
    world.fogCards.forEach((fog, i) => { fog.position.x = Math.sin(elapsed * .12 + i) * 2.4; });
  }
  renderer.render(scene, camera);
}
if (world) animate();

document.addEventListener("visibilitychange", () => {
  if (document.hidden) cancelAnimationFrame(frame);
  else if (world) animate();
});
addEventListener("beforeunload", () => {
  cancelAnimationFrame(frame);
  observer.disconnect();
  resizeObserver?.disconnect();
  renderer?.dispose();
});
