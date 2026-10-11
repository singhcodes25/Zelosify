
import { parseResumeTool } from "./tools/resume-parser.tool.js";
import { normalizeSkillsTool } from "./tools/skill-normalization.tool.js";
import { extractFeaturesTool } from "./tools/feature-extraction.tool.js";
import { calculateScore } from "./tools/matching-scoring.tool.js";

export const toolRegistry = {
  parse_resume: async (args: {
    s3Key: string;
  }) => parseResumeTool(args),

  normalize_skills: async (args: {
    skills: string[];
  }) => normalizeSkillsTool(args),

  extract_features: async (args: {
    resume: Parameters<typeof extractFeaturesTool>[0]["resume"];
    opening: Parameters<typeof extractFeaturesTool>[0]["opening"];
  }) => extractFeaturesTool(args),

  calculate_score: async (args: {
    features: Parameters<typeof calculateScore>[0];
  }) => calculateScore(args.features),
};

export type ToolName = keyof typeof toolRegistry;

export async function executeRegisteredTool(
  name: string,
  args: unknown
): Promise<unknown> {
  switch (name) {
    case "parse_resume":
      return toolRegistry.parse_resume(
        args as Parameters<typeof toolRegistry.parse_resume>[0]
      );

    case "normalize_skills":
      return toolRegistry.normalize_skills(
        args as Parameters<typeof toolRegistry.normalize_skills>[0]
      );

    case "extract_features":
      return toolRegistry.extract_features(
        args as Parameters<typeof toolRegistry.extract_features>[0]
      );

    case "calculate_score":
      return toolRegistry.calculate_score(
        args as Parameters<typeof toolRegistry.calculate_score>[0]
      );

    default:
      throw new Error(`Tool not allowed: ${String(name)}`);
  }
}
