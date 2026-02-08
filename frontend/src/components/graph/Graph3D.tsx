import { useCallback, useRef, useMemo, useEffect } from "react";
import ForceGraph3D from "react-force-graph-3d";
import * as THREE from "three";
import { RotateCcw } from "lucide-react";
import { getAgeColor, getGenderShape, getGradientColor } from "../../utils/color";
import type { FGNode, FGLink } from "../../utils/graphExport";
import {
  createNodeMesh,
  createHaloRing,
  createLabelSprite,
  configureSceneAtmosphere,
  addSceneLights,
  animateCameraToNode,
} from "./graph3dUtils";

// Keyboard movement: base speed (units per second), scale by deltaTime
const KEYBOARD_BASE_SPEED = 120;
const KEYBOARD_SPEED_SHIFT = 2;
const KEYBOARD_SPEED_ALT = 0.4;
const KEYBOARD_MAX_DISTANCE = 8000;

const MOVEMENT_KEYS = new Set([
  "ArrowUp", "ArrowDown", "ArrowLeft", "ArrowRight",
  "KeyW", "KeyA", "KeyS", "KeyD", "KeyQ", "KeyE",
]);
const IGNORE_TAG_NAMES = new Set(["INPUT", "TEXTAREA", "SELECT"]);

function shouldIgnoreKeyboard(ev: KeyboardEvent): boolean {
  const el = document.activeElement;
  if (el && (IGNORE_TAG_NAMES.has((el as HTMLElement).tagName) || (el as HTMLElement).isContentEditable)) return true;
  if (document.querySelector('[role="dialog"]')) return true;
  return false;
}

const EDGE_COLOR_DIM = "rgba(234,242,242,0.38)";
const EDGE_COLOR_HIGHLIGHT = "rgba(38,198,255,0.75)";
const LINK_WIDTH_DIM = 0.9;
const LINK_WIDTH_HIGHLIGHT = 1.8;
const MAX_LINK_WIDTH = 2.5;

type ShapeKey = "sphere" | "box" | "cone" | "octahedron";

function shapeForKey(gender: string | undefined, showGender: boolean): ShapeKey {
  if (!showGender) return "sphere";
  const s = getGenderShape(gender);
  if (s === "circle") return "sphere";
  if (s === "square") return "box";
  if (s === "triangle") return "cone";
  return "octahedron";
}

function scaleLinear(value: number, inMin: number, inMax: number, outMin: number, outMax: number): number {
  const t = inMax === inMin ? 0.5 : (value - inMin) / (inMax - inMin);
  return outMin + (outMax - outMin) * Math.max(0, Math.min(1, t));
}

interface Graph3DProps {
  nodes: FGNode[];
  links: FGLink[];
  selectedNodeId: string | null;
  hoveredNodeId: string | null;
  onNodeClick: (id: string) => void;
  onNodeHover: (id: string | null) => void;
  showAgeEncoding: boolean;
  showGenderEncoding: boolean;
  colorBy: "age" | "trait";
  selectedTrait: string;
  sizeBy: "degree" | "level_of_care";
}

function getNodeColor(
  node: FGNode,
  showAge: boolean,
  colorBy: string,
  selectedTrait: string
): string {
  if (colorBy === "trait" && selectedTrait) {
    const v = node.traits?.[selectedTrait] ?? 0.5;
    return getGradientColor(v, 0, 1);
  }
  if (colorBy === "age" && showAge && node.age != null && Number.isFinite(node.age)) {
    return getAgeColor(node.age);
  }
  const v = selectedTrait ? (node.traits?.[selectedTrait] ?? 0.5) : 0.5;
  return getGradientColor(v, 0, 1);
}

export function Graph3D({
  nodes,
  links,
  selectedNodeId,
  hoveredNodeId,
  onNodeClick,
  onNodeHover,
  showAgeEncoding,
  showGenderEncoding,
  colorBy,
  selectedTrait,
  sizeBy,
}: Graph3DProps) {
  const fgRef = useRef<{
    cameraPosition: (pos: { x: number; y: number; z: number }, lookAt?: { x: number; y: number; z: number }, ms?: number) => void;
    scene?: () => THREE.Scene;
    camera?: () => THREE.Camera;
    renderer?: () => THREE.WebGLRenderer;
    controls?: () => { target?: THREE.Vector3 };
    lights?: (lights: THREE.Light[]) => unknown;
  } | null>(null);

  const pressedKeys = useRef<Set<string>>(new Set());
  const shiftPressed = useRef(false);
  const altPressed = useRef(false);
  const animationFrameId = useRef<number | null>(null);
  const lastTime = useRef<number>(0);
  const forwardVec = useRef(new THREE.Vector3());
  const rightVec = useRef(new THREE.Vector3());
  const upVec = useRef(new THREE.Vector3());
  const deltaVec = useRef(new THREE.Vector3());

  const updateCameraPosition = useCallback((deltaTimeSec: number) => {
    const inst = fgRef.current;
    const camFn = inst?.camera;
    const controlsFn = inst?.controls;
    if (!camFn || !controlsFn) return;
    const camera = camFn();
    const controls = controlsFn();
    if (!camera || !(camera instanceof THREE.Object3D)) return;

    const speedMult = shiftPressed.current ? KEYBOARD_SPEED_SHIFT : (altPressed.current ? KEYBOARD_SPEED_ALT : 1);
    const speed = KEYBOARD_BASE_SPEED * speedMult * (deltaTimeSec || 1 / 60);

    camera.getWorldDirection(forwardVec.current);
    forwardVec.current.normalize();
    rightVec.current.crossVectors(forwardVec.current, camera.up).normalize();
    upVec.current.copy(camera.up).normalize();

    deltaVec.current.set(0, 0, 0);
    const keys = pressedKeys.current;
    if (keys.has("ArrowUp") || keys.has("KeyW")) deltaVec.current.add(forwardVec.current);
    if (keys.has("ArrowDown") || keys.has("KeyS")) deltaVec.current.sub(forwardVec.current);
    if (keys.has("ArrowLeft") || keys.has("KeyA")) deltaVec.current.sub(rightVec.current);
    if (keys.has("ArrowRight") || keys.has("KeyD")) deltaVec.current.add(rightVec.current);
    if (keys.has("KeyQ")) deltaVec.current.add(upVec.current);
    if (keys.has("KeyE")) deltaVec.current.sub(upVec.current);

    if (deltaVec.current.lengthSq() > 0) {
      deltaVec.current.normalize().multiplyScalar(speed);
      camera.position.add(deltaVec.current);
      const target = controls?.target;
      if (target && target instanceof THREE.Vector3) target.add(deltaVec.current);
      const dist = camera.position.length();
      if (dist > KEYBOARD_MAX_DISTANCE) {
        const scale = KEYBOARD_MAX_DISTANCE / dist;
        camera.position.multiplyScalar(scale);
        if (target && target instanceof THREE.Vector3) target.multiplyScalar(scale);
      }
    }
  }, []);

  const runLoop = useCallback(() => {
    const t = performance.now() / 1000;
    const prev = lastTime.current;
    lastTime.current = t;
    const deltaTimeSec = prev > 0 ? Math.min(t - prev, 1 / 15) : 1 / 60;
    updateCameraPosition(deltaTimeSec);
    if (pressedKeys.current.size > 0) {
      animationFrameId.current = requestAnimationFrame(runLoop);
    } else {
      animationFrameId.current = null;
    }
  }, [updateCameraPosition]);

  const handleKeyDown = useCallback((ev: KeyboardEvent) => {
    if (shouldIgnoreKeyboard(ev)) return;
    if (ev.key === "Shift") { shiftPressed.current = true; return; }
    if (ev.key === "Alt") { altPressed.current = true; return; }
    if (!MOVEMENT_KEYS.has(ev.code)) return;
    ev.preventDefault();
    const keys = pressedKeys.current;
    const wasEmpty = keys.size === 0;
    keys.add(ev.code);
    if (wasEmpty) {
      lastTime.current = performance.now() / 1000;
      animationFrameId.current = requestAnimationFrame(runLoop);
    }
  }, [runLoop]);

  const handleKeyUp = useCallback((ev: KeyboardEvent) => {
    if (ev.key === "Shift") { shiftPressed.current = false; return; }
    if (ev.key === "Alt") { altPressed.current = false; return; }
    if (!MOVEMENT_KEYS.has(ev.code)) return;
    ev.preventDefault();
    pressedKeys.current.delete(ev.code);
  }, []);

  useEffect(() => {
    window.addEventListener("keydown", handleKeyDown, { passive: false });
    window.addEventListener("keyup", handleKeyUp, { passive: false });
    return () => {
      window.removeEventListener("keydown", handleKeyDown);
      window.removeEventListener("keyup", handleKeyUp);
      if (animationFrameId.current != null) {
        cancelAnimationFrame(animationFrameId.current);
        animationFrameId.current = null;
      }
    };
  }, [handleKeyDown, handleKeyUp]);

  const graphData = useMemo(() => ({ nodes, links }), [nodes, links]);

  const nodeThreeObject = useCallback(
    (node: FGNode) => {
      const isSelected = selectedNodeId === node.id;
      const isHovered = hoveredNodeId === node.id;
      const color = getNodeColor(node, showAgeEncoding, colorBy, selectedTrait);
      const shape = shapeForKey(node.gender, showGenderEncoding);
      const loc = node.level_of_care ?? 0;
      const sizeScale =
        sizeBy === "level_of_care"
          ? scaleLinear(Math.max(0, Math.min(10, loc)), 0, 10, 0.6, 1.4)
          : 1;
      const mesh = createNodeMesh(shape, color, {
        hovered: isHovered,
        selected: isSelected,
        sizeScale,
      });
      const group = new THREE.Group();
      group.add(mesh);
      if (isSelected) {
        const halo = createHaloRing();
        group.add(halo);
      }
      if (isHovered || isSelected) {
        const label = createLabelSprite(`Agent ${node.id}`, 1.2);
        label.position.y = 1.8;
        group.add(label);
      }
      return group;
    },
    [selectedNodeId, hoveredNodeId, showAgeEncoding, showGenderEncoding, colorBy, selectedTrait, sizeBy]
  );

  const nodeColor = useCallback(
    (node: FGNode) =>
      getNodeColor(node, showAgeEncoding, colorBy, selectedTrait),
    [showAgeEncoding, colorBy, selectedTrait]
  );

  const linkColor = useCallback(
    (link: FGLink) => {
      const s = typeof link.source === "object" ? (link.source as FGNode).id : link.source;
      const t = typeof link.target === "object" ? (link.target as FGNode).id : link.target;
      const highlight =
        s === hoveredNodeId || t === hoveredNodeId || s === selectedNodeId || t === selectedNodeId;
      return highlight ? EDGE_COLOR_HIGHLIGHT : EDGE_COLOR_DIM;
    },
    [hoveredNodeId, selectedNodeId]
  );

  const linkWidth = useCallback(
    (link: FGLink) => {
      const s = typeof link.source === "object" ? (link.source as FGNode).id : link.source;
      const t = typeof link.target === "object" ? (link.target as FGNode).id : link.target;
      const highlight =
        s === hoveredNodeId || t === hoveredNodeId || s === selectedNodeId || t === selectedNodeId;
      if (highlight) return LINK_WIDTH_HIGHLIGHT;
      const w = link.value ?? 1;
      return Math.min(MAX_LINK_WIDTH, LINK_WIDTH_DIM + w * 0.5);
    },
    [hoveredNodeId, selectedNodeId]
  );

  const linkDirectionalParticles = useCallback(
    (link: FGLink) => {
      if (!selectedNodeId) return 0;
      const s = typeof link.source === "object" ? (link.source as FGNode).id : link.source;
      const t = typeof link.target === "object" ? (link.target as FGNode).id : link.target;
      return s === selectedNodeId || t === selectedNodeId ? 3 : 0;
    },
    [selectedNodeId]
  );

  const handleResetCamera = useCallback(() => {
    if (fgRef.current?.cameraPosition) {
      const dist = Math.max(200, Math.cbrt(nodes.length) * 30);
      fgRef.current.cameraPosition(
        { x: dist, y: dist, z: dist },
        { x: 0, y: 0, z: 0 },
        800
      );
    }
  }, [nodes.length]);

  const handleNodeClick = useCallback(
    (node: FGNode & { x?: number; y?: number; z?: number }) => {
      onNodeClick(node.id);
      const inst = fgRef.current;
      if (inst?.cameraPosition && typeof node.x === "number" && typeof node.y === "number" && typeof node.z === "number") {
        animateCameraToNode(inst.cameraPosition.bind(inst), node, 550);
      }
    },
    [onNodeClick]
  );

  const onEngineStop = useCallback(() => {
    const inst = fgRef.current;
    if (inst?.scene && inst?.renderer) {
      try {
        const scene = inst.scene();
        const renderer = inst.renderer();
        configureSceneAtmosphere(scene, renderer);
        const existingLights = scene.children.filter((c) => c instanceof THREE.Light);
        existingLights.forEach((l) => scene.remove(l));
        addSceneLights(scene);
      } catch {
        // ignore
      }
    }
    if (inst?.camera) {
      try {
        const cam = inst.camera();
        if (cam && "near" in cam && "far" in cam) {
          (cam as THREE.PerspectiveCamera).near = 0.1;
          (cam as THREE.PerspectiveCamera).far = 10000;
          (cam as THREE.PerspectiveCamera).updateProjectionMatrix();
        }
      } catch {
        // ignore
      }
    }
    // Force a re-render so scene config (lights, shadows) applies on first load.
    // Without this, shadows/lighting may not appear until camera moves (e.g. Reset camera).
    if (inst?.cameraPosition && nodes.length > 0) {
      const dist = Math.max(200, Math.cbrt(nodes.length) * 30);
      inst.cameraPosition(
        { x: dist, y: dist, z: dist },
        { x: 0, y: 0, z: 0 },
        0
      );
    }
  }, [nodes.length]);

  return (
    <div className="graph3d-container relative h-full w-full overflow-hidden rounded-2xl">
      <ForceGraph3D
        ref={fgRef as never}
        graphData={graphData}
        nodeThreeObject={nodeThreeObject}
        nodeColor={nodeColor}
        linkColor={linkColor}
        linkWidth={linkWidth}
        linkOpacity={0.75}
        linkDirectionalParticles={linkDirectionalParticles}
        linkDirectionalParticleWidth={0.8}
        linkDirectionalParticleColor={() => "rgba(38,198,255,0.5)"}
        onNodeClick={handleNodeClick}
        onNodeHover={(n) => onNodeHover(n ? (n as FGNode).id : null)}
        nodeLabel={() => ""}
        enableNodeDrag={false}
        showNavInfo={false}
        backgroundColor="rgba(5,11,16,0)"
        d3VelocityDecay={0.3}
        onEngineStop={onEngineStop}
      />
      <button
        type="button"
        onClick={handleResetCamera}
        className="absolute bottom-24 right-4 z-10 flex items-center gap-1.5 rounded-lg border border-aurora-border bg-aurora-surface1/95 px-2.5 py-2 text-xs font-medium text-aurora-text0 shadow-card backdrop-blur-sm hover:bg-aurora-surface2 focus:outline-none focus:ring-2 focus:ring-aurora-accent1"
        aria-label="Reset camera"
      >
        <RotateCcw className="h-4 w-4" />
        Reset camera
      </button>
      <p
        className="absolute bottom-4 right-4 z-10 text-[10px] text-aurora-text2/80 select-none pointer-events-none"
        aria-hidden
      >
        Move: WASD / Arrow keys · Q/E up-down · Shift/Alt speed
      </p>
    </div>
  );
}
