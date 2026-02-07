export type InterventionType = "message" | "feature" | "pricing" | "announcement";

export type TargetMode =
  | "all"
  | "clusters"
  | "top_influencers"
  | "bridge_nodes"
  | "manual";

export interface ExperimentContent {
  text?: string;
  featureName?: string;
  pricingNote?: string;
}

export interface ExperimentTargetParams {
  clusters?: number[];
  metric?: "social_influence" | "degree_centrality" | "betweenness_centrality";
  topN?: number;
  bridgeMethod?: "betweenness" | "cross_cluster_edges";
  manualIds?: string[];
}

export interface Experiment {
  id: string;
  name: string;
  createdAt: string;
  interventionType: InterventionType;
  content: ExperimentContent;
  targetMode: TargetMode;
  targetParams: ExperimentTargetParams;
  intensity: number;
  computedTargets?: string[];
}
