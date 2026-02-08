import * as THREE from "three";

/** Theme: dark teal/ink to match app (--bg-0). Use low density so zooming in doesn't fog out the graph. */
const FOG_COLOR = 0x050b10;
const FOG_DENSITY = 0.00004;
const HALO_COLOR = 0x26c6ff; // accent-1 cyan
const HALO_OPACITY = 0.45;

const geometryCache: Record<string, THREE.BufferGeometry> = {};

export function getCachedGeometry(
  shape: "sphere" | "box" | "cone" | "octahedron",
  size: number
): THREE.BufferGeometry {
  const key = `${shape}-${size}`;
  if (!geometryCache[key]) {
    switch (shape) {
      case "sphere":
        geometryCache[key] = new THREE.SphereGeometry(size, 20, 20);
        break;
      case "box":
        geometryCache[key] = new THREE.BoxGeometry(size * 2, size * 2, size * 2);
        break;
      case "cone":
        geometryCache[key] = new THREE.ConeGeometry(size, size * 2, 8);
        break;
      case "octahedron":
        geometryCache[key] = new THREE.OctahedronGeometry(size, 0);
        break;
      default:
        geometryCache[key] = new THREE.SphereGeometry(size, 20, 20);
    }
  }
  return geometryCache[key];
}

export function createNodeMesh(
  shape: "sphere" | "box" | "cone" | "octahedron",
  color: string,
  opts: { hovered?: boolean; selected?: boolean; sizeScale?: number }
): THREE.Mesh {
  const size = 0.75;
  const geometry = getCachedGeometry(shape, size);
  const isHighlight = opts.hovered || opts.selected;
  const material = new THREE.MeshStandardMaterial({
    color,
    metalness: 0.08,
    roughness: 0.5,
    emissive: color,
    emissiveIntensity: opts.selected ? 0.5 : opts.hovered ? 0.35 : 0.22,
  });
  const mesh = new THREE.Mesh(geometry, material);
  mesh.castShadow = false;
  mesh.receiveShadow = false;
  const baseScale = opts.selected ? 5.5 : opts.hovered ? 4.2 : 3.8;
  const sizeScale = opts.sizeScale ?? 1;
  mesh.scale.setScalar(baseScale * sizeScale);
  return mesh;
}

export function createHaloRing(): THREE.Mesh {
  const geometry = new THREE.TorusGeometry(0.85, 0.06, 8, 24);
  const material = new THREE.MeshBasicMaterial({
    color: HALO_COLOR,
    transparent: true,
    opacity: HALO_OPACITY,
    depthWrite: false,
  });
  const torus = new THREE.Mesh(geometry, material);
  torus.rotation.x = Math.PI / 2;
  return torus;
}

const labelTextureCache: Record<string, THREE.CanvasTexture> = {};

const LABEL_CACHE_KEY = "noshadow-v1";
function createLabelCanvasTexture(text: string): THREE.CanvasTexture {
  const key = `${text}-${LABEL_CACHE_KEY}`;
  if (labelTextureCache[key]) return labelTextureCache[key];
  const padding = 10;
  const fontSize = 12;
  const font = `${fontSize}px Inter, system-ui, sans-serif`;
  const canvas = document.createElement("canvas");
  const ctx = canvas.getContext("2d")!;
  ctx.font = font;
  const metrics = ctx.measureText(text);
  const w = Math.ceil(metrics.width + padding * 2);
  const h = Math.ceil(fontSize + padding * 2);
  canvas.width = w;
  canvas.height = h;
  ctx.font = font;
  ctx.fillStyle = "rgba(5, 11, 16, 0.88)";
  const r = h / 2;
  ctx.beginPath();
  ctx.moveTo(r, 0);
  ctx.lineTo(w - r, 0);
  ctx.quadraticCurveTo(w, 0, w, r);
  ctx.lineTo(w, h - r);
  ctx.quadraticCurveTo(w, h, w - r, h);
  ctx.lineTo(r, h);
  ctx.quadraticCurveTo(0, h, 0, h - r);
  ctx.lineTo(0, r);
  ctx.quadraticCurveTo(0, 0, r, 0);
  ctx.closePath();
  ctx.fill();
  ctx.strokeStyle = "rgba(38, 198, 255, 0.4)";
  ctx.lineWidth = 1;
  ctx.stroke();
  ctx.fillStyle = "#EAF2F2";
  ctx.shadowColor = "transparent";
  ctx.shadowBlur = 0;
  ctx.shadowOffsetX = 0;
  ctx.shadowOffsetY = 0;
  ctx.fillText(text, padding, padding + fontSize * 0.8);
  const tex = new THREE.CanvasTexture(canvas);
  tex.needsUpdate = true;
  labelTextureCache[key] = tex;
  return tex;
}

export function createLabelSprite(text: string, scale: number = 1): THREE.Sprite {
  const map = createLabelCanvasTexture(text);
  const material = new THREE.SpriteMaterial({
    map,
    transparent: true,
    depthWrite: false,
    sizeAttenuation: true,
  });
  const sprite = new THREE.Sprite(material);
  sprite.scale.set(24 * scale, 10 * scale, 1);
  return sprite;
}

export function configureSceneAtmosphere(
  scene: THREE.Scene,
  renderer: THREE.WebGLRenderer
): void {
  scene.fog = new THREE.FogExp2(FOG_COLOR, FOG_DENSITY);
  renderer.setClearColor(0x050b10, 0);
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
  renderer.shadowMap.enabled = false;
  if ("physicallyCorrectLights" in renderer) {
    (renderer as THREE.WebGLRenderer & { physicallyCorrectLights: boolean }).physicallyCorrectLights = true;
  }
  try {
    const SRGB = (THREE as unknown as { SRGBColorSpace?: number }).SRGBColorSpace;
    if (SRGB !== undefined && "outputColorSpace" in renderer) {
      (renderer as unknown as { outputColorSpace: number }).outputColorSpace = SRGB;
    }
  } catch {
    // ignore when outputColorSpace not supported
  }
}

export function addSceneLights(scene: THREE.Scene): void {
  // Hemisphere: sky (top) + ground (bottom) for even illumination at any camera angle
  const hemi = new THREE.HemisphereLight(0x6a8a9a, 0x2a3a45, 0.75);
  hemi.castShadow = false;
  scene.add(hemi);
  const ambient = new THREE.AmbientLight(0x3a4d54, 0.6);
  scene.add(ambient);
  const key = new THREE.DirectionalLight(0xe8f4f4, 0.7);
  key.position.set(120, 180, 100);
  key.castShadow = false;
  scene.add(key);
  const fill = new THREE.DirectionalLight(0xa8c4d0, 0.5);
  fill.position.set(-100, 60, -80);
  fill.castShadow = false;
  scene.add(fill);
  const rim = new THREE.PointLight(0x26c6ff, 0.4, 400);
  rim.position.set(-150, -80, 120);
  rim.castShadow = false;
  scene.add(rim);
}

/** Disable all WebGL shadowing - call every frame to override any library re-enabling */
export function disableAllShadows(renderer: THREE.WebGLRenderer): void {
  renderer.shadowMap.enabled = false;
}

export function animateCameraToNode(
  cameraPosition: (pos: { x: number; y: number; z: number }, lookAt?: { x: number; y: number; z: number }, ms?: number) => void,
  node: { x?: number; y?: number; z?: number },
  durationMs: number = 550
): void {
  const x = node.x ?? 0;
  const y = node.y ?? 0;
  const z = node.z ?? 0;
  const distance = 80;
  const distRatio = 1 + distance / Math.max(1e-6, Math.hypot(x, y, z));
  const newPos = { x: x * distRatio, y: y * distRatio, z: z * distRatio };
  const lookAt = { x, y, z };
  cameraPosition(newPos, lookAt, durationMs);
}
