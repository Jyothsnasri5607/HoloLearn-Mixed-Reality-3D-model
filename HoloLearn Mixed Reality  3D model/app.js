// Select the scene container
const container = document.getElementById("scene-container");

// Scene setup
const scene = new THREE.Scene();
scene.background = new THREE.Color(0x000000); // black background

// Camera setup
const camera = new THREE.PerspectiveCamera(
  75,
  container.clientWidth / container.clientHeight,
  0.1,
  1000
);
camera.position.z = 6;

// Renderer setup
const renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setSize(container.clientWidth, container.clientHeight);
container.appendChild(renderer.domElement);

// Orbit controls
const controls = new THREE.OrbitControls(camera, renderer.domElement);

// Store objects for animation
let activeObjects = [];

// Utility: clear old objects
function clearScene() {
  activeObjects.forEach(obj => scene.remove(obj));
  activeObjects = [];
}

// Default Cube
function addCube() {
  const geometry = new THREE.BoxGeometry();
  const material = new THREE.MeshBasicMaterial({ color: 0x00ff00, wireframe: true });
  const cube = new THREE.Mesh(geometry, material);
  scene.add(cube);
  activeObjects.push(cube);

  cube.animate = () => {
    cube.rotation.x += 0.01;
    cube.rotation.y += 0.01;
  };
}

// Solar System
function addSolarSystem() {
  // Sun
  const sunGeo = new THREE.SphereGeometry(1, 32, 32);
  const sunMat = new THREE.MeshBasicMaterial({ color: 0xffcc00 });
  const sun = new THREE.Mesh(sunGeo, sunMat);
  scene.add(sun);
  activeObjects.push(sun);

  // Planets
  const planets = [];
  const colors = [0x3399ff, 0xff3300, 0x00ffcc];
  const distances = [2, 3.5, 5];

  distances.forEach((dist, i) => {
    const planetGeo = new THREE.SphereGeometry(0.3, 16, 16);
    const planetMat = new THREE.MeshBasicMaterial({ color: colors[i] });
    const planet = new THREE.Mesh(planetGeo, planetMat);
    planet.userData = { angle: 0, distance: dist, speed: 0.01 + i * 0.01 };
    scene.add(planet);
    planets.push(planet);
    activeObjects.push(planet);
  });

  sun.animate = () => {
    planets.forEach(p => {
      p.userData.angle += p.userData.speed;
      p.position.x = Math.cos(p.userData.angle) * p.userData.distance;
      p.position.z = Math.sin(p.userData.angle) * p.userData.distance;
    });
  };
}

// Volcano
function addVolcano() {
  // Cone for volcano
  const coneGeo = new THREE.ConeGeometry(1, 2, 32);
  const coneMat = new THREE.MeshBasicMaterial({ color: 0x663300 });
  const cone = new THREE.Mesh(coneGeo, coneMat);
  scene.add(cone);
  activeObjects.push(cone);

  // Lava particles
  const particles = [];
  for (let i = 0; i < 50; i++) {
    const particleGeo = new THREE.SphereGeometry(0.05, 8, 8);
    const particleMat = new THREE.MeshBasicMaterial({ color: 0xff3300 });
    const particle = new THREE.Mesh(particleGeo, particleMat);
    particle.position.set(0, 1, 0);
    particle.userData = { speedY: Math.random() * 0.05 + 0.02 };
    scene.add(particle);
    particles.push(particle);
    activeObjects.push(particle);
  }

  cone.animate = () => {
    particles.forEach(p => {
      p.position.y += p.userData.speedY;
      if (p.position.y > 3) p.position.y = 1; // reset
    });
  };
}

// Heart Anatomy (placeholder)
function addHeart() {
  const heartGeo = new THREE.SphereGeometry(1, 32, 32);
  const heartMat = new THREE.MeshBasicMaterial({ color: 0xff0000, wireframe: false });
  const heart = new THREE.Mesh(heartGeo, heartMat);
  scene.add(heart);
  activeObjects.push(heart);

  heart.animate = () => {
    heart.scale.setScalar(1 + 0.1 * Math.sin(Date.now() * 0.005)); // heartbeat
  };
}

// Animation loop
function animate() {
  requestAnimationFrame(animate);
  activeObjects.forEach(obj => obj.animate && obj.animate());
  controls.update();
  renderer.render(scene, camera);
}
animate();

// Resize handling
window.addEventListener("resize", () => {
  camera.aspect = container.clientWidth / container.clientHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(container.clientWidth, container.clientHeight);
});

// Load default cube first
addCube();

// Topic buttons
document.querySelectorAll(".topic-btn").forEach(btn => {
  btn.addEventListener("click", () => {
    clearScene();
    const topic = btn.getAttribute("data-topic");
    if (topic === "solar-system") addSolarSystem();
    else if (topic === "volcano") addVolcano();
    else if (topic === "heart-anatomy") addHeart();
    else addCube();
  });
});

