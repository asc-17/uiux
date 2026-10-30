import('https://cdn.jsdelivr.net/npm/three@0.169.0/build/three.module.js').then((THREE) => {

const story = document.querySelector('#flight-story');
const canvas = document.querySelector('#flight-canvas');
const stepLabel = document.querySelector('#flight-step');
const progressBar = document.querySelector('#flight-progress-bar');
const chapters = document.querySelectorAll('[data-flight-chapter]');
const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(36, 1, 0.1, 100);
camera.position.set(9, 7, 13);
camera.lookAt(0, 1, 0);

const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true });
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
renderer.outputColorSpace = THREE.SRGBColorSpace;
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;

scene.add(new THREE.HemisphereLight(0xe9ffe4, 0x284234, 2.2));
const sunlight = new THREE.DirectionalLight(0xffffff, 3);
sunlight.position.set(-5, 10, 7);
sunlight.castShadow = true;
sunlight.shadow.mapSize.set(1024, 1024);
sunlight.shadow.camera.left = -10;
sunlight.shadow.camera.right = 10;
sunlight.shadow.camera.top = 10;
sunlight.shadow.camera.bottom = -10;
scene.add(sunlight);

const dark = new THREE.MeshStandardMaterial({ color: 0x263e34, roughness: 0.42, metalness: 0.45 });
const shell = new THREE.MeshStandardMaterial({ color: 0xd9e5d6, roughness: 0.43, metalness: 0.24 });
const accent = new THREE.MeshStandardMaterial({ color: 0xdfff70, roughness: 0.38, metalness: 0.1 });
const parcelMaterial = new THREE.MeshStandardMaterial({ color: 0xd2a879, roughness: 0.9 });
const tapeMaterial = new THREE.MeshStandardMaterial({ color: 0xf0dfbb, roughness: 0.9 });
const drone = new THREE.Group();
scene.add(drone);

function box(width, height, depth, material, x, y, z, parent = drone) {
  const mesh = new THREE.Mesh(new THREE.BoxGeometry(width, height, depth), material);
  mesh.position.set(x, y, z);
  mesh.castShadow = true;
  mesh.receiveShadow = true;
  parent.add(mesh);
  return mesh;
}

function rod(start, end, radius, material, parent = drone) {
  const direction = new THREE.Vector3().subVectors(end, start);
  const mesh = new THREE.Mesh(new THREE.CylinderGeometry(radius, radius, direction.length(), 12), material);
  mesh.position.copy(start).add(end).multiplyScalar(0.5);
  mesh.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), direction.normalize());
  mesh.castShadow = true;
  parent.add(mesh);
  return mesh;
}

box(1.7, 0.42, 1.2, shell, 0, 0, 0);
box(1.24, 0.16, 0.87, dark, 0, 0.29, 0);
box(0.48, 0.045, 0.52, accent, 0, 0.395, 0);
box(0.24, 0.08, 0.08, accent, 0, 0.03, 0.64);
const rotors = [];
for (const x of [-1, 1]) {
  for (const z of [-1, 1]) {
    rod(new THREE.Vector3(x * 0.55, 0, z * 0.38), new THREE.Vector3(x * 2.05, 0.04, z * 1.65), 0.105, dark);
    const motor = new THREE.Mesh(new THREE.CylinderGeometry(0.26, 0.22, 0.24, 20), shell);
    motor.position.set(x * 2.05, 0.14, z * 1.65);
    motor.castShadow = true;
    drone.add(motor);
    const rotor = new THREE.Group();
    rotor.position.set(x * 2.05, 0.3, z * 1.65);
    box(1.48, 0.045, 0.14, dark, 0, 0, 0, rotor);
    box(0.14, 0.045, 1.48, dark, 0, 0.01, 0, rotor);
    const hub = new THREE.Mesh(new THREE.CylinderGeometry(0.12, 0.12, 0.12, 16), accent);
    rotor.add(hub);
    drone.add(rotor);
    rotors.push(rotor);
    rod(new THREE.Vector3(x * 0.55, -0.18, z * 0.35), new THREE.Vector3(x * 0.43, -1.02, z * 0.36), 0.018, shell);
  }
}
box(1.05, 0.78, 0.82, parcelMaterial, 0, -1.4, 0);
box(0.16, 0.79, 0.83, tapeMaterial, 0, -1.4, 0);
box(1.06, 0.035, 0.14, tapeMaterial, 0, -0.99, 0);

const padMaterial = new THREE.MeshStandardMaterial({ color: 0x42634e, roughness: 0.8, transparent: true, opacity: 0.75 });
const pad = new THREE.Mesh(new THREE.CylinderGeometry(2.4, 2.4, 0.08, 64), padMaterial);
pad.position.set(1.3, -0.45, 0);
pad.receiveShadow = true;
scene.add(pad);
for (const radius of [1.35, 2.25, 2.85]) {
  const ring = new THREE.Mesh(new THREE.TorusGeometry(radius, 0.014, 8, 100), new THREE.MeshBasicMaterial({ color: 0xb9e777, transparent: true, opacity: radius === 2.85 ? 0.35 : 0.75 }));
  ring.rotation.x = Math.PI / 2;
  ring.position.set(1.3, -0.39, 0);
  scene.add(ring);
}
box(0.8, 0.025, 0.08, accent, 1.3, -0.39, 0, scene);
box(0.08, 0.025, 0.8, accent, 1.3, -0.39, 0, scene);

let progress = 0;
let visible = false;
let frame = 0;
function updateProgress() {
  const rect = story.getBoundingClientRect();
  const distance = Math.max(1, rect.height - window.innerHeight);
  progress = THREE.MathUtils.clamp(-rect.top / distance, 0, 1);
  progressBar.style.width = `${Math.max(4, progress * 100)}%`;
  stepLabel.textContent = progress < 0.34 ? '01 / IN FLIGHT' : progress < 0.75 ? '02 / APPROACHING' : '03 / TOUCHDOWN';
  const activeChapter = progress < 0.34 ? 0 : progress < 0.75 ? 1 : 2;
  chapters.forEach((chapter, index) => {
    chapter.classList.toggle('is-active', index === activeChapter);
    chapter.setAttribute('aria-hidden', String(!reducedMotion && index !== activeChapter));
    chapter.querySelectorAll('button').forEach((button) => { button.tabIndex = reducedMotion || index === activeChapter ? 0 : -1; });
  });
}
function resize() {
  const width = canvas.clientWidth;
  const height = canvas.clientHeight;
  if (!width || !height) return;
  renderer.setSize(width, height, false);
  camera.aspect = width / height;
  camera.position.set(width < 600 ? 10 : 9, width < 600 ? 8 : 7, width < 600 ? 16 : 13);
  camera.lookAt(0, 1, 0);
  camera.updateProjectionMatrix();
  updateProgress();
}
function animate(time) {
  frame = 0;
  if (!visible) return;
  const eased = progress * progress * (3 - 2 * progress);
  drone.position.set(-1.1 + eased * 2.4, 3.2 - eased * 1.75 + (reducedMotion ? 0 : Math.sin(time * 0.0015) * 0.07), 0);
  drone.rotation.set(0.05 * (1 - eased), -0.18 + eased * 0.4, 0.1 * (1 - eased));
  rotors.forEach((rotor, index) => { rotor.rotation.y = reducedMotion ? 0.3 : time * 0.016 * (index % 2 ? 1 : -1); });
  renderer.render(scene, camera);
  if (!reducedMotion) frame = requestAnimationFrame(animate);
}
function renderOnChange() {
  updateProgress();
  if (visible && !frame) frame = requestAnimationFrame(animate);
}
const observer = new IntersectionObserver((entries) => {
  visible = entries[0].isIntersecting;
  if (visible) { resize(); renderOnChange(); }
  else if (frame) { cancelAnimationFrame(frame); frame = 0; }
});
observer.observe(story);
window.addEventListener('scroll', renderOnChange, { passive: true });
window.addEventListener('resize', resize);
window.addEventListener('hashchange', () => requestAnimationFrame(resize));
resize();
});