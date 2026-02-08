export type InterventionType = "message" | "feature" | "pricing" | "announcement";

export type TargetMode =
  | "all"
  | "top_influencers"
  | "bridge_nodes"
  | "manual";

export interface ExperimentContent {
  text?: string;
  featureName?: string;
  pricingNote?: string;
}

export interface ExperimentTargetParams {
  metric?: "social_influence" | "degree_centrality" | "betweenness_centrality";
  topN?: number;
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
