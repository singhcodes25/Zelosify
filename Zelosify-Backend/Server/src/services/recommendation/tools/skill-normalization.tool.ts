
const SKILL_ALIASES: Record<string, string> = {
  "reactjs": "react",
  "react.js": "react",
  "react js": "react",
  "nodejs": "node.js",
  "node js": "node.js",
  "node": "node.js",
  "nextjs": "next.js",
  "next js": "next.js",
  "expressjs": "express",
  "express.js": "express",
  "js": "javascript",
  "ts": "typescript",
  "postgres": "postgresql",
  "mongo": "mongodb",
  "amazon web services": "aws",
  "amazon s3": "s3",
  "amazon ec2": "ec2",
};

function cleanSkill(skill: string): string {
  return skill
    .trim()
    .toLowerCase()
    .replace(/\s+/g, " ");
}

export function normalizeSkills(
  skills: string[]
): string[] {
  const normalized = skills.map((skill) => {
    const cleaned = cleanSkill(skill);
    return SKILL_ALIASES[cleaned] ?? cleaned;
  });

  return [...new Set(normalized)].filter(Boolean);
}

export function normalizeSkillsTool(input: unknown) {
  if (
    !input ||
    typeof input !== "object" ||
    !("skills" in input) ||
    !Array.isArray(input.skills) ||
    !input.skills.every(
      (skill: unknown) => typeof skill === "string"
    )
  ) {
    throw new Error("Invalid skill normalization input");
  }

  return {
    normalizedSkills: normalizeSkills(input.skills),
  };
}
