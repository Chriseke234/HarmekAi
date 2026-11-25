import type { JobFitResult, JobListing, Profile } from "./types";

/**
 * Computes transparent, free job-fit breakdown for a candidate against a job.
 * Mirrors the Supabase Edge Function `analyze-job-fit` so both server/edge and
 * interactive UI previews produce consistent, deterministic results.
 */
export function computeJobFit(profile: Profile, job: JobListing): JobFitResult {
  const candidateSkills = new Set(
    profile.skills.map((s) => s.skillName.trim().toLowerCase()),
  );

  const matchedSkills = job.requiredSkills.filter((skill) =>
    candidateSkills.has(skill.trim().toLowerCase()),
  );
  const missingSkills = job.requiredSkills.filter(
    (skill) => !candidateSkills.has(skill.trim().toLowerCase()),
  );

  const baseScore =
    job.requiredSkills.length === 0
      ? 80
      : Math.round((matchedSkills.length / job.requiredSkills.length) * 100);

  const relevantArtifacts = profile.artifacts.filter((artifact) =>
    artifact.skillsTags.some((tag) =>
      job.requiredSkills.some((req) => req.toLowerCase() === tag.toLowerCase()),
    ),
  );

  const artifactBonus = Math.min(12, relevantArtifacts.length * 4);
  const matchScore = Math.min(100, baseScore + artifactBonus);

  const recommendations: string[] = [];
  if (relevantArtifacts.length > 0) {
    recommendations.push(
      `Attach "${relevantArtifacts[0].title}" to directly verify your ${matchedSkills[0] ?? "core"} experience.`,
    );
  }
  if (missingSkills.length > 0) {
    recommendations.push(
      `Address ${missingSkills.slice(0, 2).join(" and ")} briefly in your intro note with adjacent systems you have shipped.`,
    );
  } else {
    recommendations.push(
      `You meet 100% of listed core skills for ${job.title} — highlight measurable production outcomes.`,
    );
  }

  return {
    matchScore,
    matchedSkills,
    missingSkills,
    recommendations,
  };
}

const KNOWN_SKILLS = [
  "TypeScript",
  "Next.js",
  "React",
  "PostgreSQL",
  "Supabase",
  "Node.js",
  "Python",
  "Go",
  "Rust",
  "Kubernetes",
  "AWS",
  "Tailwind CSS",
  "GraphQL",
  "Figma",
  "Product Strategy",
  "System Design",
  "Machine Learning",
  "LLM Engineering",
];

export interface ParsedCvDraft {
  suggestedHeadline: string;
  suggestedBio: string;
  detectedSkills: string[];
  detectedUrls: string[];
}

/**
 * Parses raw CV/resume text into a structured draft profile.
 * In production, invokes the `parse-cv-to-profile` Supabase Edge Function.
 */
export function parseCvTextLocally(rawText: string): ParsedCvDraft {
  const cleaned = rawText.trim();
  const lines = cleaned
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean);

  const detectedSkills = KNOWN_SKILLS.filter((skill) =>
    cleaned.toLowerCase().includes(skill.toLowerCase()),
  );
  const detectedUrls = Array.from(
    new Set(cleaned.match(/https?:\/\/[^\s)]+/g) ?? []),
  ).slice(0, 4);

  return {
    suggestedHeadline:
      lines[1]?.slice(0, 96) ??
      lines[0]?.slice(0, 96) ??
      "Full-Stack Engineer & Systems Builder",
    suggestedBio:
      lines.slice(0, 3).join(" ").slice(0, 260) ||
      "Builder focused on reliable, high-craft software products.",
    detectedSkills:
      detectedSkills.length > 0
        ? detectedSkills
        : ["TypeScript", "Next.js", "PostgreSQL", "System Design"],
    detectedUrls,
  };
}
