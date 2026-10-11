
import type { FeatureVector, ScoreResult } from "../schemas.js";
import { ScoreSchema } from "../schemas.js";

export function calculateScore(
  features: FeatureVector
): ScoreResult {
  const candidateSkills = new Set(
    features.skills.map((s) => s.toLowerCase())
  );

  const requiredSkills = [
    ...new Set(
      features.requiredSkills.map((s) => s.toLowerCase())
    ),
  ];

  const matchedSkills = requiredSkills.filter((skill) =>
    candidateSkills.has(skill)
  );

  const skillMatchScore =
    requiredSkills.length === 0
      ? 1
      : matchedSkills.length / requiredSkills.length;

  let experienceMatchScore = 1;

  if (features.experienceYears < features.experienceMin) {
    experienceMatchScore = 0;
  } else if (
    features.experienceMax !== null &&
    features.experienceYears > features.experienceMax
  ) {
    experienceMatchScore = 0.8;
  }

  const candidateLocation = features.location
    .trim()
    .toLowerCase();

  const jobLocation = features.jobLocation
    .trim()
    .toLowerCase();

  let locationMatchScore = 0.5;

  if (
    !jobLocation ||
    jobLocation === "remote" ||
    jobLocation === "work from anywhere"
  ) {
    locationMatchScore = 1;
  } else if (
    candidateLocation &&
    candidateLocation === jobLocation
  ) {
    locationMatchScore = 1;
  }

  const finalScore =
    0.5 * skillMatchScore +
    0.3 * experienceMatchScore +
    0.2 * locationMatchScore;

  return ScoreSchema.parse({
    skillMatchScore,
    experienceMatchScore,
    locationMatchScore,
    finalScore: Math.round(finalScore * 10000) / 10000,
  });
}

export function getRecommendation(score: number) {
  if (score >= 0.75) return "RECOMMENDED";
  if (score >= 0.5) return "BORDERLINE";
  return "NOT_RECOMMENDED";
}
