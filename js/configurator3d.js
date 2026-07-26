/* ==========================================================================
   AURA 75 - PHOTOREALISTIC 3D KEYBOARD ENGINE WITH DYNAMIC KEYCAP LEGENDS
   Replicates user reference image in 3D:
   - Matte Anodized Dark Slate Case with Top-Right Rotary Knob
   - High-Res Canvas Texture Key Legends (Q, W, E, R, T, Y, Esc, Enter, Shift, etc.)
   - Rose Pink Accents (#e87a82) on Esc, Enter, Spacebar
   - 3D Volumetric Soft Cloud Bed with Warm Directional Sun Lighting
   - 360° Rotation, Exploded Layer View in Clouds, Smooth Camera Reset
   ========================================================================== */

let scene, camera, renderer, controls;
let keyboardGroup, cloudsGroup;
let topCaseMesh, plateMesh, switchesGroup, keycapsGroup, pcbMesh, bottomCaseMesh, foamMesh, weightPlateMesh;
let guideLinesGroup;

let isRotating = true;
let isExploded = false;

// Exploded Y positions
const EXPLODED_Y = {
  keycaps: 3.4,
  switches: 2.2,
  plate: 1.3,
  foam: 0.5,
  pcb: -0.4,
  bottomCase: -1.5,
  topCase: 0.2
};

const ORIGINAL_Y = {
  keycaps: 0.48,
  switches: 0.30,
  plate: 0.18,
  foam: 0.08,
  pcb: 0.0,
  bottomCase: -0.22,
  topCase: 0.22
};

// Colors matching user reference image
const COLOR_PRESETS = {
  caseDark: 0x22252a,       // Matte Charcoal Case
  caseSilver: 0xd1d5db,     // Moonlight Silver
  casePurple: 0x4c1d95,     // Deep Purple

  keyDark: 0x2b2e35,       // Slate Charcoal Keycaps
  keyRose: 0xe87a82,       // Rose Pink Accent (Esc, Enter, Spacebar)
  keyCream: 0xfef08a,      // Retro Cream
  keyTextWhite: '#f8fafc',
  keyTextDark: '#1e293b'
};

// 75% Compact Keycap Layout Grid Definition (15 cols x 5 rows)
const KEYBOARD_LAYOUT = [
  // Row 0: Esc + Numbers + Backspace + Knob
  [
    { label: 'Esc', accent: true }, { label: '1 !' }, { label: '2 @' }, { label: '3 #' }, { label: '4 $' },
    { label: '5 %' }, { label: '6 ^' }, { label: '7 &' }, { label: '8 *' }, { label: '9 (' }, { label: '0 )' },
    { label: '- _' }, { label: '= +' }, { label: '← Back', w: 1.5 }, { label: 'Del' }
  ],
  // Row 1: Tab + QWERTYUIOP + Brackets + PgUp
  [
    { label: 'Tab', w: 1.25 }, { label: 'Q' }, { label: 'W' }, { label: 'E' }, { label: 'R' },
    { label: 'T' }, { label: 'Y' }, { label: 'U' }, { label: 'I' }, { label: 'O' }, { label: 'P' },
    { label: '[ {' }, { label: '] }' }, { label: '\\ |', w: 1.25 }, { label: 'PgUp' }
  ],
  // Row 2: Caps + ASDFGHJKL + Enter + PgDn
  [
    { label: 'Caps', w: 1.5 }, { label: 'A' }, { label: 'S' }, { label: 'D' }, { label: 'F' },
    { label: 'G' }, { label: 'H' }, { label: 'J' }, { label: 'K' }, { label: 'L' }, { label: '; :' },
    { label: '\' "' }, { label: '↵ Enter', w: 1.75, accent: true }, { label: 'PgDn' }
  ],
  // Row 3: Shift + ZXCVBNM + Arrow Up
  [
    { label: '⇧ Shift', w: 1.75 }, { label: 'Z' }, { label: 'X' }, { label: 'C' }, { label: 'V' },
    { label: 'B' }, { label: 'N' }, { label: 'M' }, { label: ', <' }, { label: '. >' }, { label: '/ ?' },
    { label: '⇧ Shift', w: 1.25 }, { label: '↑' }
  ],
  // Row 4: Modifiers + Spacebar + Arrows
  [
    { label: 'Ctrl', w: 1.25 }, { label: 'Win', w: 1.25 }, { label: 'Alt', w: 1.25 },
    { label: '', w: 5.5, space: true, accent: true }, // Spacebar
    { label: 'Alt', w: 1.25 }, { label: 'Fn', w: 1.0 }, { label: '←' }, { label: '↓' }, { label: '→' }
  ]
];

function init3DConfigurator() {
  const container = document.getElementById('canvas3dContainer');
  if (!container) return;

  const width = container.clientWidth || 600;
  const height = container.clientHeight || 450;

  // 1. Scene setup
  scene = new THREE.Scene();
  scene.background = new THREE.Color(0x111520); // Dark slate background matching container card

  // 2. Camera setup matching reference tilt angle
  camera = new THREE.PerspectiveCamera(36, width / height, 0.1, 1000);
  camera.position.set(-2.6, 3.2, 5.0);

  // 3. Renderer setup
  renderer = new THREE.WebGLRenderer({ antialias: true });
  renderer.setSize(width, height);
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = THREE.PCFSoftShadowMap;
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.2;

  // Remove previous canvas if any
  const existingCanvas = container.querySelector('canvas');
  if (existingCanvas) {
    existingCanvas.remove();
  }

  container.appendChild(renderer.domElement);

  // Remove Loader
  const loader = document.getElementById('canvasLoader');
  if (loader) {
    loader.style.opacity = '0';
    setTimeout(() => loader.style.display = 'none', 400);
  }

  // 4. Photorealistic Studio Lighting (Sunlight + Sky Fill)
  const ambientLight = new THREE.AmbientLight(0xf8fafc, 0.95);
  scene.add(ambientLight);

  const sunLight = new THREE.DirectionalLight(0xfff7ed, 1.5);
  sunLight.position.set(7, 12, 7);
  sunLight.castShadow = true;
  sunLight.shadow.mapSize.width = 2048;
  sunLight.shadow.mapSize.height = 2048;
  sunLight.shadow.bias = -0.0001;
  scene.add(sunLight);

  const skyLight = new THREE.DirectionalLight(0xe0f2fe, 0.75);
  skyLight.position.set(-7, -3, -5);
  scene.add(skyLight);

  const pinkSoftGlow = new THREE.PointLight(0xf472b6, 0.9, 8);
  pinkSoftGlow.position.set(0.5, 2.2, 1.5);
  scene.add(pinkSoftGlow);

  // 5. Controls
  controls = new THREE.OrbitControls(camera, renderer.domElement);
  controls.enableDamping = true;
  controls.dampingFactor = 0.05;
  controls.maxPolarAngle = Math.PI / 2.02;
  controls.minDistance = 2.2;
  controls.maxDistance = 12;

  // 6. Build Environment & Photorealistic Keyboard
  buildVolumetricCloudBed();
  buildPhotorealisticKeyboardModel();

  // 7. Event Listeners & Loop
  window.addEventListener('resize', onWindowResize);
  animate3D();
}

// Build 3D Volumetric Soft Cloud Bed
function buildVolumetricCloudBed() {
  cloudsGroup = new THREE.Group();

  const cloudMat = new THREE.MeshStandardMaterial({
    color: 0xf8fafc,
    roughness: 0.92,
    metalness: 0.0,
    transparent: true,
    opacity: 0.9,
    shadowSide: THREE.DoubleSide
  });

  const puffGeo = new THREE.SphereGeometry(0.7, 16, 16);

  const cloudPositions = [
    { x: -3.6, y: -1.8, z: 0, s: 2.3 },
    { x: -1.8, y: -1.7, z: 1.6, s: 2.6 },
    { x: 0.5, y: -1.9, z: 1.9, s: 2.9 },
    { x: 2.8, y: -1.8, z: 0.9, s: 2.5 },
    { x: 3.8, y: -1.7, z: -1.2, s: 2.7 },
    { x: 1.2, y: -2.0, z: -2.2, s: 3.0 },
    { x: -1.5, y: -1.9, z: -2.0, s: 2.8 },
    { x: -3.8, y: -1.8, z: -1.5, s: 2.4 },
    { x: -2.2, y: -1.2, z: 2.2, s: 1.6 },
    { x: 0.2, y: -1.3, z: 2.5, s: 1.8 },
    { x: 2.2, y: -1.2, z: 2.1, s: 1.7 }
  ];

  cloudPositions.forEach(pos => {
    const cloudCluster = new THREE.Group();
    const numPuffs = 6 + Math.floor(Math.random() * 4);
    for (let i = 0; i < numPuffs; i++) {
      const puff = new THREE.Mesh(puffGeo, cloudMat);
      puff.position.set(
        (Math.random() - 0.5) * 0.8 * pos.s,
        (Math.random() - 0.5) * 0.4 * pos.s,
        (Math.random() - 0.5) * 0.8 * pos.s
      );
      const scale = (0.6 + Math.random() * 0.5) * pos.s;
      puff.scale.set(scale, scale * 0.7, scale);
      puff.castShadow = true;
      puff.receiveShadow = true;
      cloudCluster.add(puff);
    }
    cloudCluster.position.set(pos.x, pos.y, pos.z);
    cloudsGroup.add(cloudCluster);
  });

  scene.add(cloudsGroup);
}

// Generate Canvas Texture for Printed Keycap Legends
function createKeyLegendTexture(label, isRoseAccent) {
  const canvas = document.createElement('canvas');
  canvas.width = 256;
  canvas.height = 256;
  const ctx = canvas.getContext('2d');

  // Background Fill
  ctx.fillStyle = isRoseAccent ? '#e87a82' : '#2b2e35';
  ctx.fillRect(0, 0, 256, 256);

  // Subtle Key Top Inset Border
  ctx.strokeStyle = isRoseAccent ? 'rgba(255,255,255,0.2)' : 'rgba(255,255,255,0.08)';
  ctx.lineWidth = 6;
  ctx.strokeRect(12, 12, 232, 232);

  // Printed Label
  if (label && label.length > 0) {
    ctx.fillStyle = '#ffffff';
    ctx.font = label.length > 4 ? 'bold 36px Inter, sans-serif' : 'bold 54px Inter, sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.shadowColor = 'rgba(0,0,0,0.4)';
    ctx.shadowBlur = 4;
    ctx.fillText(label, 128, 128);
  }

  const texture = new THREE.CanvasTexture(canvas);
  texture.anisotropy = 8;
  return texture;
}

// Sculpted Dish Keycap Geometry
function createKeycapMeshGeometry(width, height, depth) {
  const shape = new THREE.Shape();
  const w = width / 2;
  const d = depth / 2;

  shape.moveTo(-w, -d);
  shape.lineTo(w, -d);
  shape.lineTo(w, d);
  shape.lineTo(-w, d);
  shape.lineTo(-w, -d);

  const extrudeSettings = {
    steps: 1,
    depth: height,
    bevelEnabled: true,
    bevelThickness: 0.02,
    bevelSize: 0.02,
    bevelOffset: 0,
    bevelSegments: 3
  };

  const geo = new THREE.ExtrudeGeometry(shape, extrudeSettings);
  geo.rotateX(Math.PI / 2);
  geo.center();
  return geo;
}

function buildPhotorealisticKeyboardModel() {
  keyboardGroup = new THREE.Group();

  const caseMat = new THREE.MeshStandardMaterial({
    color: COLOR_PRESETS.caseDark,
    roughness: 0.45,
    metalness: 0.25
  });

  const plateMat = new THREE.MeshStandardMaterial({
    color: 0xd97706, // Brass Plate
    roughness: 0.3,
    metalness: 0.8
  });

  const pcbMat = new THREE.MeshStandardMaterial({
    color: 0x042f2e,
    roughness: 0.4
  });

  const foamMat = new THREE.MeshStandardMaterial({
    color: 0x0f172a,
    roughness: 0.95
  });

  const brassWeightMat = new THREE.MeshStandardMaterial({
    color: 0xd97706,
    roughness: 0.2,
    metalness: 0.9
  });

  // A. Bottom Case Assembly
  const bottomGroup = new THREE.Group();
  const bottomGeo = new THREE.BoxGeometry(4.8, 0.3, 2.7);
  bottomCaseMesh = new THREE.Mesh(bottomGeo, caseMat);
  bottomCaseMesh.castShadow = true;
  bottomCaseMesh.receiveShadow = true;
  bottomGroup.add(bottomCaseMesh);

  // Brass Weight Inset
  const weightGeo = new THREE.BoxGeometry(3.2, 0.04, 1.2);
  weightPlateMesh = new THREE.Mesh(weightGeo, brassWeightMat);
  weightPlateMesh.position.set(0, -0.14, 0);
  bottomGroup.add(weightPlateMesh);

  bottomGroup.position.y = ORIGINAL_Y.bottomCase;
  keyboardGroup.add(bottomGroup);

  // B. PCB & Sound Foam
  const pcbGeo = new THREE.BoxGeometry(4.55, 0.06, 2.45);
  pcbMesh = new THREE.Mesh(pcbGeo, pcbMat);
  pcbMesh.position.y = ORIGINAL_Y.pcb;
  keyboardGroup.add(pcbMesh);

  const foamGeo = new THREE.BoxGeometry(4.57, 0.05, 2.47);
  foamMesh = new THREE.Mesh(foamGeo, foamMat);
  foamMesh.position.y = ORIGINAL_Y.foam;
  keyboardGroup.add(foamMesh);

  // C. Plate
  const plateGeo = new THREE.BoxGeometry(4.6, 0.08, 2.5);
  plateMesh = new THREE.Mesh(plateGeo, plateMat);
  plateMesh.position.y = ORIGINAL_Y.plate;
  plateMesh.castShadow = true;
  keyboardGroup.add(plateMesh);

  // D. Top Bezel Cover & Rotary Knob
  const topCaseGroup = new THREE.Group();
  const topOuterGeo = new THREE.BoxGeometry(4.9, 0.28, 2.8);
  topCaseMesh = new THREE.Mesh(topOuterGeo, caseMat);
  topCaseMesh.castShadow = true;
  topCaseGroup.add(topCaseMesh);

  // Rotary Knob
  const knobGeo = new THREE.CylinderGeometry(0.14, 0.14, 0.22, 24);
  const knobMat = new THREE.MeshStandardMaterial({ color: COLOR_PRESETS.caseDark, roughness: 0.35, metalness: 0.5 });
  const knobMesh = new THREE.Mesh(knobGeo, knobMat);
  knobMesh.position.set(2.15, 0.2, -1.1);
  topCaseGroup.add(knobMesh);

  topCaseGroup.position.y = ORIGINAL_Y.topCase;
  keyboardGroup.add(topCaseGroup);

  // E. Switches Group
  switchesGroup = new THREE.Group();
  switchesGroup.position.y = ORIGINAL_Y.switches;

  const switchHousingGeo = new THREE.BoxGeometry(0.20, 0.14, 0.20);
  const stemHorizGeo = new THREE.BoxGeometry(0.08, 0.08, 0.02);
  const stemVertGeo = new THREE.BoxGeometry(0.02, 0.08, 0.08);

  const switchHousingMat = new THREE.MeshStandardMaterial({ color: 0xfef08a, roughness: 0.3 });
  const stemMat = new THREE.MeshStandardMaterial({ color: 0xef4444, roughness: 0.2 });

  // F. Keycaps Group with Printed Canvas Legend Textures
  keycapsGroup = new THREE.Group();
  keycapsGroup.position.y = ORIGINAL_Y.keycaps;

  const unitW = 0.26;
  const unitD = 0.26;
  const startZ = -((5 * unitD) / 2) + (unitD / 2);

  KEYBOARD_LAYOUT.forEach((rowKeys, rowIndex) => {
    let currentX = -2.25;
    const posZ = startZ + rowIndex * unitD;

    rowKeys.forEach(keyDef => {
      const widthMultiplier = keyDef.w || 1.0;
      const keyW = unitW * widthMultiplier;

      const posX = currentX + (keyW / 2);
      currentX += keyW + 0.02;

      // Add Switch
      const swHousing = new THREE.Mesh(switchHousingGeo, switchHousingMat);
      swHousing.position.set(posX, 0, posZ);
      switchesGroup.add(swHousing);

      const stemH = new THREE.Mesh(stemHorizGeo, stemMat);
      const stemV = new THREE.Mesh(stemVertGeo, stemMat);
      stemH.position.set(posX, 0.09, posZ);
      stemV.position.set(posX, 0.09, posZ);
      switchesGroup.add(stemH);
      switchesGroup.add(stemV);

      // Create Keycap Mesh
      const isRose = !!keyDef.accent;
      const keyGeo = createKeycapMeshGeometry(keyW - 0.03, 0.16, unitD - 0.03);
      const texture = createKeyLegendTexture(keyDef.label, isRose);

      const baseMat = new THREE.MeshStandardMaterial({
        color: isRose ? COLOR_PRESETS.keyRose : COLOR_PRESETS.keyDark,
        roughness: 0.45,
        metalness: 0.05
      });
      baseMat.userData = { isRose, label: keyDef.label };

      const topFaceMat = new THREE.MeshStandardMaterial({
        map: texture,
        roughness: 0.45,
        metalness: 0.05
      });
      topFaceMat.userData = { isRose, label: keyDef.label };

      const materials = [baseMat, baseMat, topFaceMat, baseMat, baseMat, baseMat];
      const capMesh = new THREE.Mesh(keyGeo, materials);
      capMesh.position.set(posX, 0, posZ);
      capMesh.castShadow = true;
      keycapsGroup.add(capMesh);
    });
  });

  keyboardGroup.add(switchesGroup);
  keyboardGroup.add(keycapsGroup);

  // G. Blueprint Line Overlay
  guideLinesGroup = new THREE.Group();
  const cornerPositions = [
    [-2.2, -1.1],
    [2.2, -1.1],
    [-2.2, 1.1],
    [2.2, 1.1]
  ];

  const lineMat = new THREE.LineDashedMaterial({
    color: 0xe87a82,
    dashSize: 0.1,
    gapSize: 0.05,
    linewidth: 1,
    transparent: true,
    opacity: 0.0
  });

  cornerPositions.forEach(([x, z]) => {
    const points = [
      new THREE.Vector3(x, EXPLODED_Y.bottomCase, z),
      new THREE.Vector3(x, EXPLODED_Y.keycaps + 0.2, z)
    ];
    const lineGeo = new THREE.BufferGeometry().setFromPoints(points);
    const line = new THREE.Line(lineGeo, lineMat);
    line.computeLineDistances();
    guideLinesGroup.add(line);
  });

  keyboardGroup.add(guideLinesGroup);

  // Set Camera Tilt Rotation matching user reference image
  keyboardGroup.rotation.x = 0.34;
  keyboardGroup.rotation.y = -0.25;
  scene.add(keyboardGroup);
}

// Swapping Materials
function update3dMaterials(options) {
  if (options.case && topCaseMesh && bottomCaseMesh) {
    const hex = COLOR_PRESETS[options.case === 'silver' ? 'caseSilver' : options.case === 'purple' ? 'casePurple' : 'caseDark'];
    topCaseMesh.material.color.setHex(hex);
    bottomCaseMesh.material.color.setHex(hex);
  }

  if (options.keycap && keycapsGroup) {
    keycapsGroup.children.forEach(capMesh => {
      const isRose = capMesh.material[0].userData.isRose;
      let hex = isRose ? COLOR_PRESETS.keyRose : COLOR_PRESETS.keyDark;
      if (options.keycap === 'retro' && !isRose) hex = COLOR_PRESETS.keyCream;

      if (Array.isArray(capMesh.material)) {
        capMesh.material.forEach(m => m.color.setHex(hex));
      }
    });
  }
}

// Toggle Exploded View
function toggleExplodedView() {
  isExploded = !isExploded;
  const btn = document.getElementById('btnExplode3d');
  if (btn) {
    btn.classList.toggle('active', isExploded);
  }
}

// Toggle 360 Auto Rotation
function toggle3dRotate() {
  isRotating = !isRotating;
  const btn = document.getElementById('btnRotate3d');
  if (btn) {
    btn.classList.toggle('active', isRotating);
  }
}

// Reset View (Smooth lerp back to reference tilt position)
function reset3dCamera() {
  isExploded = false;
  isRotating = true;

  const btnExplode = document.getElementById('btnExplode3d');
  const btnRotate = document.getElementById('btnRotate3d');
  if (btnExplode) btnExplode.classList.remove('active');
  if (btnRotate) btnRotate.classList.add('active');

  const targetCamPos = new THREE.Vector3(-2.6, 3.2, 5.0);
  const startCamPos = camera.position.clone();
  let progress = 0;

  function resetStep() {
    progress += 0.05;
    camera.position.lerpVectors(startCamPos, targetCamPos, progress);
    controls.target.set(0, 0, 0);
    keyboardGroup.rotation.set(0.34, -0.25, 0);

    if (progress < 1.0) {
      requestAnimationFrame(resetStep);
    }
  }
  resetStep();
}

function animate3D() {
  requestAnimationFrame(animate3D);

  const lerpFactor = 0.08;

  // Lerp Exploded Layer Positions
  const targetKeycapsY = isExploded ? EXPLODED_Y.keycaps : ORIGINAL_Y.keycaps;
  const targetSwitchesY = isExploded ? EXPLODED_Y.switches : ORIGINAL_Y.switches;
  const targetPlateY = isExploded ? EXPLODED_Y.plate : ORIGINAL_Y.plate;
  const targetFoamY = isExploded ? EXPLODED_Y.foam : ORIGINAL_Y.foam;
  const targetPcbY = isExploded ? EXPLODED_Y.pcb : ORIGINAL_Y.pcb;
  const targetBottomY = isExploded ? EXPLODED_Y.bottomCase : ORIGINAL_Y.bottomCase;
  const targetTopCaseY = isExploded ? EXPLODED_Y.topCase : ORIGINAL_Y.topCase;

  if (keycapsGroup) keycapsGroup.position.y += (targetKeycapsY - keycapsGroup.position.y) * lerpFactor;
  if (switchesGroup) switchesGroup.position.y += (targetSwitchesY - switchesGroup.position.y) * lerpFactor;
  if (plateMesh) plateMesh.position.y += (targetPlateY - plateMesh.position.y) * lerpFactor;
  if (foamMesh) foamMesh.position.y += (targetFoamY - foamMesh.position.y) * lerpFactor;
  if (pcbMesh) pcbMesh.position.y += (targetPcbY - pcbMesh.position.y) * lerpFactor;
  if (bottomCaseMesh) bottomCaseMesh.parent.position.y += (targetBottomY - bottomCaseMesh.parent.position.y) * lerpFactor;
  if (topCaseMesh) topCaseMesh.parent.position.y += (targetTopCaseY - topCaseMesh.parent.position.y) * lerpFactor;

  // Fade Blueprint Guide Lines
  if (guideLinesGroup) {
    guideLinesGroup.children.forEach(line => {
      const targetOpacity = isExploded ? 0.7 : 0.0;
      line.material.opacity += (targetOpacity - line.material.opacity) * lerpFactor;
    });
  }

  // Floating Cloud Movement
  if (cloudsGroup) {
    const t = Date.now() * 0.001;
    cloudsGroup.children.forEach((cloud, idx) => {
      cloud.position.y += Math.sin(t + idx) * 0.0015;
    });
  }

  // 360° Floating Rotation
  if (isRotating && keyboardGroup) {
    keyboardGroup.rotation.y += 0.006;
  }

  if (controls) controls.update();
  if (renderer && scene && camera) renderer.render(scene, camera);
}

function onWindowResize() {
  const container = document.getElementById('canvas3dContainer');
  if (!container || !camera || !renderer) return;

  const width = container.clientWidth || 600;
  const height = container.clientHeight || 450;

  camera.aspect = width / height;
  camera.updateProjectionMatrix();
  renderer.setSize(width, height);
}

// Init when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
  init3DConfigurator();
});
