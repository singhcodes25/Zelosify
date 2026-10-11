
import type {
  ResumeData,
  FeatureVector,
  ScoreResult,
} from "./schemas.js";

export interface AgentContext {
  profileId: number;
  openingId: string;
  tenantId: string;
  triggeredBy: string;
}

export interface AgentState {
  context: AgentContext;
  currentStep: string;
  completedTools: string[];
  attempts: number;
  inputTokens: number;
  outputTokens: number;
  startedAt: number;

  resume?: ResumeData;
  features?: FeatureVector;
  score?: ScoreResult;

  toolLog: Array<{
    name: string;
    startedAt: string;
    durationMs: number;
    ok: boolean;
    error?: string;
  }>;
}
