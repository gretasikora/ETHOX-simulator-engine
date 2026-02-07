import { useCallback, useRef, useMemo } from "react";
import ForceGraph3D from "react-force-graph-3d";
import * as THREE from "three";
import { RotateCcw } from "lucide-react";
import { getAgeColor, getGenderShape, getGradientColor } from "../../utils/color";
import type { FGNode, FGLink } from "../../utils/graphExport";

const BASE_NODE_SCALE = 3;
const SELECTED_NODE_SCALE = 4.5;
const EDGE_COLOR_DIM = "rgba(234,242,242,0.15)";
const EDGE_COLOR_HIGHLIGHT = "rgba(38,198,255,0.55)";

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
  maxCentrality: number;
}

function getNodeColor(
  node: FGNode,
  showAge: boolean,
  colorBy: string,
  selectedTrait: string,
  maxCentrality: number
): string {
  if (colorBy === "centrality") {
    const v = node.degree_centrality ?? 0;
    return getGradientColor(v, 0, Math.max(1, maxCentrality));
  }
  if (colorBy === "trait" && selectedTrait) {
    const v = node.traits?.[selectedTrait] ?? 0.5;
    return getGradientColor(v, 0, 1);
  }
  if (!showAge || colorBy !== "age") {
    return getAgeColor(undefined);
  }
  return getAgeColor(node.age);
}

function createNodeGeometry(
  gender: string | undefined,
  showGender: boolean
): THREE.BufferGeometry {
  const shape = showGender ? getGenderShape(gender) : "circle";
  const size = 0.5;
  switch (shape) {
    case "circle":
      return new THREE.SphereGeometry(size, 16, 16);
    case "square":
      return new THREE.BoxGeometry(size * 2, size * 2, size * 2);
    case "triangle":
      return new THREE.ConeGeometry(size, size * 2, 3);
    case "diamond":
      return new THREE.OctahedronGeometry(size, 0);
    default:
      return new THREE.SphereGeometry(size, 16, 16);
  }
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
  maxCentrality,
}: Graph3DProps) {
  const fgRef = useRef<{ cameraPosition: (pos: { x: number; y: number; z: number }, lookAt?: { x: number; y: number; z: number }, ms?: number) => void } | null>(null);

  const graphData = useMemo(
    () => ({ nodes, links }),
    [nodes, links]
  );

  const nodeThreeObject = useCallback(
    (node: FGNode) => {
      const isSelected = selectedNodeId === node.id;
      const color = getNodeColor(
        node,
        showAgeEncoding,
        colorBy,
        selectedTrait,
        maxCentrality
      );
      const geometry = createNodeGeometry(node.gender, showGenderEncoding);
      const material = new THREE.MeshStandardMaterial({
        color,
        metalness: 0.2,
        roughness: 0.6,
        emissive: isSelected ? color : "#000000",
        emissiveIntensity: isSelected ? 0.4 : 0,
      });
      const mesh = new THREE.Mesh(geometry, material);
      const scale = isSelected ? SELECTED_NODE_SCALE : BASE_NODE_SCALE;
      mesh.scale.setScalar(scale);
      return mesh;
    },
    [
      selectedNodeId,
      showAgeEncoding,
      showGenderEncoding,
      colorBy,
      selectedTrait,
      maxCentrality,
    ]
  );

  const nodeColor = useCallback(
    (node: FGNode) =>
      getNodeColor(
        node,
        showAgeEncoding,
        colorBy,
        selectedTrait,
        maxCentrality
      ),
    [showAgeEncoding, colorBy, selectedTrait, maxCentrality]
  );

  const linkColor = useCallback(
    (link: FGLink) => {
      const s = typeof link.source === "object" ? (link.source as FGNode).id : link.source;
      const t = typeof link.target === "object" ? (link.target as FGNode).id : link.target;
      const highlight =
        s === hoveredNodeId ||
        t === hoveredNodeId ||
        s === selectedNodeId ||
        t === selectedNodeId;
      return highlight ? EDGE_COLOR_HIGHLIGHT : EDGE_COLOR_DIM;
    },
    [hoveredNodeId, selectedNodeId]
  );

  const handleResetCamera = useCallback(() => {
    if (fgRef.current?.cameraPosition) {
      const dist = Math.max(200, Math.cbrt(nodes.length) * 30);
      fgRef.current.cameraPosition({ x: dist, y: dist, z: dist }, { x: 0, y: 0, z: 0 }, 800);
    }
  }, [nodes.length]);

  return (
    <div className="relative h-full w-full bg-aurora-bg0">
      <ForceGraph3D
        ref={fgRef as never}
        graphData={graphData}
        nodeThreeObject={nodeThreeObject}
        nodeColor={nodeColor}
        linkColor={linkColor}
        linkWidth={0.5}
        linkOpacity={0.6}
        onNodeClick={(n) => onNodeClick((n as FGNode).id)}
        onNodeHover={(n) => onNodeHover(n ? (n as FGNode).id : null)}
        nodeLabel={(node) => {
          const id = (node as FGNode).id;
          if (id === selectedNodeId || id === hoveredNodeId) {
            return `Agent ${id}`;
          }
          return "";
        }}
        enableNodeDrag={false}
        showNavInfo={false}
        onEngineStop={() => {
          if (fgRef.current?.cameraPosition && nodes.length > 0) {
            const dist = Math.max(200, Math.cbrt(nodes.length) * 30);
            fgRef.current.cameraPosition({ x: dist, y: dist, z: dist }, { x: 0, y: 0, z: 0 }, 0);
          }
        }}
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
