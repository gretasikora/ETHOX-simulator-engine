import { useCallback, useRef, useMemo } from "react";
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

const EDGE_COLOR_DIM = "rgba(234,242,242,0.12)";
const EDGE_COLOR_HIGHLIGHT = "rgba(38,198,255,0.6)";
const LINK_WIDTH_DIM = 0.4;
const LINK_WIDTH_HIGHLIGHT = 1.2;
const MAX_LINK_WIDTH = 1.8;

type ShapeKey = "sphere" | "box" | "cone" | "octahedron";

function shapeForKey(gender: string | undefined, showGender: boolean): ShapeKey {
  if (!showGender) return "sphere";
  const s = getGenderShape(gender);
  if (s === "circle") return "sphere";
  if (s === "square") return "box";
  if (s === "triangle") return "cone";
  return "octahedron";
}

interface CentralityScale {
  min: number;
  max: number;
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
  colorBy: "age" | "trait" | "centrality";
  selectedTrait: string;
  centralityScale: CentralityScale;
  sizeBy: "degree" | "centrality" | "level_of_care";
}

function getNodeColor(
  node: FGNode,
  showAge: boolean,
  colorBy: string,
  selectedTrait: string,
  centralityScale: CentralityScale
): string {
  const { min, max } = centralityScale;
  const range = Math.max(0.001, max - min);
  if (colorBy === "centrality") {
    const v = node.degree_centrality ?? 0;
    return getGradientColor(v, min, min + range);
  }
  if (colorBy === "trait" && selectedTrait) {
    const v = node.traits?.[selectedTrait] ?? 0.5;
    return getGradientColor(v, 0, 1);
  }
  if (colorBy === "age" && showAge && node.age != null && Number.isFinite(node.age)) {
    return getAgeColor(node.age);
  }
  const v = node.degree_centrality ?? 0;
  return getGradientColor(v, min, min + range);
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
  centralityScale,
  sizeBy,
}: Graph3DProps) {
  const fgRef = useRef<{
    cameraPosition: (pos: { x: number; y: number; z: number }, lookAt?: { x: number; y: number; z: number }, ms?: number) => void;
    scene?: () => THREE.Scene;
    camera?: () => THREE.Camera;
    renderer?: () => THREE.WebGLRenderer;
    lights?: (lights: THREE.Light[]) => unknown;
  } | null>(null);

  const graphData = useMemo(() => ({ nodes, links }), [nodes, links]);

  const nodeThreeObject = useCallback(
    (node: FGNode) => {
      const isSelected = selectedNodeId === node.id;
      const isHovered = hoveredNodeId === node.id;
      const color = getNodeColor(node, showAgeEncoding, colorBy, selectedTrait, centralityScale);
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
    [selectedNodeId, hoveredNodeId, showAgeEncoding, showGenderEncoding, colorBy, selectedTrait, centralityScale, sizeBy]
  );

  const nodeColor = useCallback(
    (node: FGNode) =>
      getNodeColor(node, showAgeEncoding, colorBy, selectedTrait, centralityScale),
    [showAgeEncoding, colorBy, selectedTrait, centralityScale]
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
      return Math.min(MAX_LINK_WIDTH, LINK_WIDTH_DIM + w * 0.4);
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
    if (inst?.cameraPosition && nodes.length > 0) {
      const dist = Math.max(200, Math.cbrt(nodes.length) * 30);
      inst.cameraPosition(
        { x: dist, y: dist, z: dist },
        { x: 0, y: 0, z: 0 },
        0
      );
    }
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
        linkOpacity={0.5}
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
    </div>
  );
}
