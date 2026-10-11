
import { z } from "zod";

export const ResumeSchema = z.object({
  experienceYears: z.number().finite().min(0).max(80),
  skills: z.array(z.string().trim().min(1).max(100)).max(200),
  normalizedSkills: z
    .array(z.string().trim().min(1).max(100))
    .max(200),
  location: z.string().max(200),
  education: z.array(z.string().max(300)).max(50),
  keywords: z.array(z.string().max(100)).max(200),
});

export const FeatureVectorSchema = z.object({
  experienceYears: z.number().finite().min(0).max(80),
  skills: z.array(z.string()).max(200),
  location: z.string().max(200),
  requiredSkills: z.array(z.string()).max(200),
  experienceMin: z.number().int().min(0).max(80),
  experienceMax: z.number().int().min(0).max(80).nullable(),
  jobLocation: z.string().max(200),
});

export const ScoreSchema = z.object({
  skillMatchScore: z.number().finite().min(0).max(1),
  experienceMatchScore: z.number().finite().min(0).max(1),
  locationMatchScore: z.number().finite().min(0).max(1),
  finalScore: z.number().finite().min(0).max(1),
});

export const FinalExplanationSchema = z.object({
  confidence: z.number().finite().min(0).max(1),
  reason: z.string().trim().min(1).max(2000),
});

export type ResumeData = z.infer<typeof ResumeSchema>;
export type FeatureVector = z.infer<typeof FeatureVectorSchema>;
export type ScoreResult = z.infer<typeof ScoreSchema>;
export type FinalExplanation = z.infer<
  typeof FinalExplanationSchema
>;
