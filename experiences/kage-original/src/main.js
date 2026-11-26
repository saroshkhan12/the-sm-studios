import * as THREE from "three";
import "./style.css";

const mount = document.querySelector("#scene");
const fallback = document.querySelector("#fallback");
const chapters = [...document.querySelectorAll(".chapter")];
const navLinks = [...document.querySelectorAll(".chapter-nav a")];
const motionButton = document.querySelector("#motion-toggle");
const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
let paused = reduceMotion;
let scrollProgress = 0;
let targetProgress = 0;
let frame = 0;
let renderer;
let scene;
let camera;
let clock;
let resizeObserver;

motionButton.setAttribute("aria-pressed", String(paused));
motionButton.textContent = paused ? "RESUME MOTION" : "PAUSE MOTION";

function makeMaterial(color, roughness = 0.9) {
  return new THREE.MeshStandardMaterial({ color, roughness, metalness: 0.02 });
}

function createPillar(group, x, z, height, material) {
  const geometry = new THREE.CylinderGeometry(0.12, 0.16, height, 8);
  const pillar = new THREE.Mesh(geometry, material);
  pillar.position.set(x, height / 2, z);
  group.add(pillar);
}

function createScene() {
  scene = new THREE.Scene();
  scene.background = new THREE.Color("#111512");
  scene.fog = new THREE.FogExp2("#18211d", 0.035);

  camera = new THREE.PerspectiveCamera(42, innerWidth / innerHeight, 0.1, 100);
  camera.position.set(0, 3.6, 13);

  renderer = new THREE.WebGLRenderer({ antialias: innerWidth > 700, alpha: false, powerPreference: "high-performance" });
  renderer.setPixelRatio(Math.min(devicePixelRatio, innerWidth < 700 ? 1.35 : 1.8));
  renderer.setSize(innerWidth, innerHeight);
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.18;
  mount.appendChild(renderer.domElement);

  const ambient = new THREE.HemisphereLight("#b9c7bb", "#182019", 1.15);
  scene.add(ambient);
  const moon = new THREE.DirectionalLight("#b8c9d5", 2.1);
  moon.position.set(-5, 9, 5);
  scene.add(moon);

  const garden = new THREE.Group();
  scene.add(garden);
  const ground = new THREE.Mesh(new THREE.PlaneGeometry(90, 90), makeMaterial("#26312a"));
  ground.rotation.x = -Math.PI / 2;
  ground.position.y = -0.08;
  garden.add(ground);

  const pathMaterial = makeMaterial("#77766a");
  for (let i = 0; i < 9; i++) {
    const stone = new THREE.Mesh(new THREE.BoxGeometry(2.25 - i * 0.06, 0.13, 0.82), pathMaterial);
    stone.position.set(0, 0.02, 3.8 - i * 1.15);
    stone.rotation.y = (i % 2 ? 1 : -1) * 0.025;
    garden.add(stone);
  }

  const wallMaterial = makeMaterial("#414b42");
  for (const side of [-1, 1]) {
    const wall = new THREE.Mesh(new THREE.BoxGeometry(0.45, 2.6, 18), wallMaterial);
    wall.position.set(side * 5.2, 1.25, -2.5);
    garden.add(wall);
    for (let i = 0; i < 7; i++) {
      createPillar(garden, side * (3.6 + (i % 2) * 0.35), -9 + i * 2.1, 0.8 + (i % 3) * 0.35, wallMaterial);
    }
  }

  const archMaterial = makeMaterial("#697469");
  const arch = new THREE.Group();
  const left = new THREE.Mesh(new THREE.BoxGeometry(0.32, 4.4, 0.38), archMaterial);
  left.position.set(-2.2, 2.2, -3.5);
  const right = left.clone();
  right.position.x = 2.2;
  const lintel = new THREE.Mesh(new THREE.BoxGeometry(4.95, 0.42, 0.55), archMaterial);
  lintel.position.set(0, 4.35, -3.5);
  arch.add(left, right, lintel);
  garden.add(arch);

  const basin = new THREE.Mesh(new THREE.CylinderGeometry(2.2, 2.45, 0.35, 48), makeMaterial("#3c4946"));
  basin.position.set(0, 0.13, -8.2);
  garden.add(basin);
  const water = new THREE.Mesh(
    new THREE.CircleGeometry(2.03, 64),
    new THREE.MeshStandardMaterial({ color: "#536d70", roughness: 0.22, metalness: 0.22, transparent: true, opacity: 0.88 })
  );
  water.rotation.x = -Math.PI / 2;
  water.position.set(0, 0.34, -8.2);
  garden.add(water);

  const lanterns = [];
  for (const [x, z] of [[-3.4, -1], [3.4, -4.8], [-3.1, -8.8], [3.2, -11.5]]) {
    const housing = new THREE.Mesh(new THREE.BoxGeometry(0.62, 0.9, 0.62), makeMaterial("#625c4c"));
    housing.position.set(x, 1.3, z);
    garden.add(housing);
    const light = new THREE.PointLight("#f0bd76", 5, 8, 2);
    light.position.set(x, 1.65, z);
    garden.add(light);
    lanterns.push(light);
    const core = new THREE.Mesh(new THREE.SphereGeometry(0.19, 12, 12), new THREE.MeshBasicMaterial({ color: "#ffd9a0" }));
    core.position.copy(light.position);
    garden.add(core);
  }

  const trees = new THREE.Group();
  const trunkMaterial = makeMaterial("#3d332b");
  const leafMaterial = makeMaterial("#263e32");
  for (const [x, z, scale] of [[-4.1, -3, 1.2], [4.25, -1.5, 1.5], [-4.3, -9, 1.4], [4.1, -11, 1.15]]) {
    const trunk = new THREE.Mesh(new THREE.CylinderGeometry(0.12, 0.22, 2.8 * scale, 7), trunkMaterial);
    trunk.position.set(x, 1.4 * scale, z);
    trees.add(trunk);
    for (let j = 0; j < 5; j++) {
      const crown = new THREE.Mesh(new THREE.IcosahedronGeometry(0.95 * scale, 1), leafMaterial);
      crown.position.set(x + Math.sin(j * 2.4) * 0.62 * scale, (2.5 + j * 0.35) * scale, z + Math.cos(j * 2.4) * 0.5 * scale);
      crown.scale.set(1.25, 0.68, 1);
      trees.add(crown);
    }
  }
  garden.add(trees);

  const starsGeometry = new THREE.BufferGeometry();
  const starPositions = [];
  for (let i = 0; i < 520; i++) {
    starPositions.push((Math.random() - 0.5) * 70, 4 + Math.random() * 22, -35 + Math.random() * 45);
  }
  starsGeometry.setAttribute("position", new THREE.Float32BufferAttribute(starPositions, 3));
  const stars = new THREE.Points(starsGeometry, new THREE.PointsMaterial({ color: "#b6c5b7", size: 0.045, transparent: true, opacity: 0.55 }));
  scene.add(stars);

  const moteGeometry = new THREE.BufferGeometry();
  const motePositions = new Float32Array(90 * 3);
  for (let i = 0; i < 90; i++) {
    motePositions[i * 3] = (Math.random() - 0.5) * 9;
    motePositions[i * 3 + 1] = Math.random() * 4.5;
    motePositions[i * 3 + 2] = -13 + Math.random() * 16;
  }
  moteGeometry.setAttribute("position", new THREE.BufferAttribute(motePositions, 3));
  const motes = new THREE.Points(moteGeometry, new THREE.PointsMaterial({ color: "#e7c58d", size: 0.055, transparent: true, opacity: 0.65 }));
  scene.add(motes);

  return { garden, lanterns, motes, stars, water };
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
}, { threshold: 0.48 });
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
  renderer.setPixelRatio(Math.min(devicePixelRatio, innerWidth < 700 ? 1.25 : 1.8));
  renderer.setSize(innerWidth, innerHeight);
}
resizeObserver = new ResizeObserver(resize);
resizeObserver.observe(document.documentElement);

function animate() {
  frame = requestAnimationFrame(animate);
  if (!renderer || !world) return;
  const elapsed = clock ? clock.getElapsedTime() : 0;
  if (!clock) clock = new THREE.Clock();
  scrollProgress += (targetProgress - scrollProgress) * (paused ? 0.035 : 0.045);
  const p = scrollProgress;
  const mobile = innerWidth < 650;
  const cameraZ = 12.5 - p * 8.5;
  const cameraX = Math.sin(p * Math.PI * 1.3) * (mobile ? 0.35 : 1.15);
  const cameraY = 3.45 + Math.sin(p * Math.PI) * 0.85;
  camera.position.x += (cameraX - camera.position.x) * 0.025;
  camera.position.y += (cameraY - camera.position.y) * 0.025;
  camera.position.z += (cameraZ - camera.position.z) * 0.025;
  camera.lookAt(0, 1.1 + p * 0.12, -4.5 - p * 4);
  if (!paused) {
    world.garden.rotation.y = Math.sin(elapsed * 0.08) * 0.012;
    world.lanterns.forEach((light, i) => { light.intensity = 4.4 + Math.sin(elapsed * 1.4 + i) * 0.55; });
    const positions = world.motes.geometry.attributes.position;
    for (let i = 0; i < positions.count; i++) {
      positions.array[i * 3 + 1] += 0.0018;
      if (positions.array[i * 3 + 1] > 5) positions.array[i * 3 + 1] = 0.1;
    }
    positions.needsUpdate = true;
    world.water.material.opacity = 0.82 + Math.sin(elapsed * 0.7) * 0.045;
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
