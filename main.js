const canvas = document.getElementById("solarCanvas");
const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(
  75,
  window.innerWidth / window.innerHeight,
  0.1,
  2000
);
const renderer = new THREE.WebGLRenderer({ canvas, antialias: true });
renderer.setSize(window.innerWidth, window.innerHeight);

const tooltip = document.getElementById("tooltip");
const raycaster = new THREE.Raycaster();
const mouse = new THREE.Vector2();

const defaultCameraPos = new THREE.Vector3();
let zoomed = false;
let selectedPlanet = null;
let isPaused = false;

const planetData = [
  { name: "Mercury", size: 0.8, distance: 12, speed: 0.04, color: 0xaaaaaa },
  { name: "Venus", size: 1.2, distance: 17, speed: 0.035, color: 0xffcc99 },
  { name: "Earth", size: 1.3, distance: 22, speed: 0.03, color: 0x3399ff },
  { name: "Mars", size: 1.0, distance: 27, speed: 0.028, color: 0xff6633 },
  { name: "Jupiter", size: 2.5, distance: 34, speed: 0.02, color: 0xff9966 },
  { name: "Saturn", size: 2.2, distance: 42, speed: 0.018, color: 0xffcc66 },
  { name: "Uranus", size: 1.9, distance: 50, speed: 0.015, color: 0x66ccff },
  { name: "Neptune", size: 1.8, distance: 58, speed: 0.012, color: 0x3366ff },
];

 const planets = [];

// Sun
const sun = new THREE.Mesh(
  new THREE.SphereGeometry(4, 32, 32),
  new THREE.MeshBasicMaterial({ color: 0xffcc00 })
);
scene.add(sun);

// Light
const light = new THREE.PointLight(0xffffff, 2, 300);
scene.add(light);

// Stars
function createStars() {
  const starGeometry = new THREE.BufferGeometry();
  const starVertices = [];
  for (let i = 0; i < 1000; i++) {
    const x = (Math.random() - 0.5) * 2000;
    const y = (Math.random() - 0.5) * 2000;
    const z = (Math.random() - 0.5) * 2000;
    starVertices.push(x, y, z);
  }
  starGeometry.setAttribute(
    "position",
    new THREE.Float32BufferAttribute(starVertices, 3)
  );
  const starMaterial = new THREE.PointsMaterial({ color: 0xffffff, size: 0.5 });
  const starField = new THREE.Points(starGeometry, starMaterial);
  scene.add(starField);
}
createStars();

// Orbits
function createOrbit(distance) {
  const points = [];
  for (let i = 0; i <= 64; i++) {
    const angle = (i / 64) * Math.PI * 2;
    points.push(new THREE.Vector3(Math.cos(angle) * distance, 0, Math.sin(angle) * distance));
  }

  const geometry = new THREE.BufferGeometry().setFromPoints(points);
  const material = new THREE.LineBasicMaterial({
    color: 0xffffff,
    transparent: true,
    opacity: 0.25,
  });

  const orbit = new THREE.LineLoop(geometry, material);
  scene.add(orbit);
}

// Planets
planetData.forEach((p) => {
  const mesh = new THREE.Mesh(
    new THREE.SphereGeometry(p.size, 32, 32),
    new THREE.MeshStandardMaterial({ color: p.color })
  );
  mesh.userData = { angle: 0, distance: p.distance };
  mesh.position.x = p.distance;

  scene.add(mesh);
  planets.push({ name: p.name, mesh, speed: p.speed });

  createSlider(p.name, p.speed);
  createOrbit(p.distance);
});

// Sliders
function createSlider(name, defaultSpeed) {
  const container = document.getElementById("controls");

  const label = document.createElement("label");
  label.innerText = `${name}: `;
  const slider = document.createElement("input");
  slider.type = "range";
  slider.min = "0";
  slider.max = "0.1";
  slider.step = "0.001";
  slider.value = defaultSpeed;

  slider.addEventListener("input", () => {
    const planet = planets.find((p) => p.name === name);
    if (planet) planet.speed = parseFloat(slider.value);
  });

  label.appendChild(slider);
  container.appendChild(label);
}

// Pause
document.getElementById("pauseBtn").addEventListener("click", () => {
  isPaused = !isPaused;
  document.getElementById("pauseBtn").innerText = isPaused ? "Resume" : "Pause";
});

// Responsive camera zoom
function adjustCameraForScreen() {
  const width = window.innerWidth;

  if (width <= 480) {
    camera.position.set(0, 170, 0);
  } else if (width <= 768) {
    camera.position.set(0, 150, 0);
  } else {
    camera.position.set(0, 100, 0);
  }

  defaultCameraPos.copy(camera.position);
  camera.lookAt(0, 0, 0);
}
adjustCameraForScreen();

// Animate
function animate() {
  requestAnimationFrame(animate);
  if (!isPaused) {
    planets.forEach((p) => {
      p.mesh.userData.angle += p.speed;
      const angle = p.mesh.userData.angle;
      const distance = p.mesh.userData.distance;
      p.mesh.position.x = Math.cos(angle) * distance;
      p.mesh.position.z = Math.sin(angle) * distance;
    });
  }
  renderer.render(scene, camera);
}
animate();

// Resize
window.addEventListener("resize", () => {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
  adjustCameraForScreen();
});

// Tooltip on hover
window.addEventListener("mousemove", (event) => {
  mouse.x = (event.clientX / window.innerWidth) * 2 - 1;
  mouse.y = -(event.clientY / window.innerHeight) * 2 + 1;

  raycaster.setFromCamera(mouse, camera);
  const intersects = raycaster.intersectObjects(planets.map(p => p.mesh));

  if (intersects.length > 0) {
    const planet = planets.find(p => p.mesh === intersects[0].object);
    if (planet) {
      tooltip.style.display = "block";
      tooltip.style.left = `${event.clientX + 10}px`;
      tooltip.style.top = `${event.clientY + 10}px`;
      tooltip.innerText = planet.name;
    }
  } else {
    tooltip.style.display = "none";
  }
});

// Click-to-zoom
window.addEventListener("click", (event) => {
  mouse.x = (event.clientX / window.innerWidth) * 2 - 1;
  mouse.y = -(event.clientY / window.innerHeight) * 2 + 1;

  raycaster.setFromCamera(mouse, camera);
  const intersects = raycaster.intersectObjects(planets.map(p => p.mesh));

  if (intersects.length > 0) {
    const clicked = intersects[0].object;
    const target = clicked.position.clone().add(new THREE.Vector3(5, 5, 5));

    gsap.to(camera.position, {
      duration: 1.5,
      x: target.x,
      y: target.y,
      z: target.z,
      onUpdate: () => {
        camera.lookAt(clicked.position);
      }
    });

    selectedPlanet = clicked;
    zoomed = true;
  } else if (zoomed) {
    gsap.to(camera.position, {
      duration: 1.5,
      x: defaultCameraPos.x,
      y: defaultCameraPos.y,
      z: defaultCameraPos.z,
      onUpdate: () => {
        camera.lookAt(0, 0, 0);
      }
    });

    selectedPlanet = null;
    zoomed = false;
  }
});
