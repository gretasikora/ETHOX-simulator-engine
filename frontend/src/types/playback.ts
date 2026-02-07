export interface AgentFrameState {
  opinion: number;   // -1..+1
  sentiment: number; // 0..1
  adoption: number;  // 0..1
}

export interface Frame {
  t: number;
  agents: Record<string, AgentFrameState>;
  notes?: string;
}

export interface PlaybackRunMeta {
  timesteps: number;
  seed?: number;
  description?: string;
  targetedAgentIds?: string[];
}

export interface PlaybackRun {
  id: string;
  name: string;
  createdAt: string;
  frames: Frame[];
  meta: PlaybackRunMeta;
}
