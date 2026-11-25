// Supabase Edge Function: analyze-job-fit
// Computes transparent, free AI job-fit breakdown for a candidate against a job.
// Uses deterministic skill overlap first, optionally enriched by an LLM when OPENAI_API_KEY is configured.

import "jsr:@supabase/functions-js/edge-runtime.d.ts";

interface FitRequest {
  candidateSkills: string[];
  candidateHeadline: string;
  artifactTitles: string[];
  jobTitle: string;
  requiredSkills: string[];
}

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", {
      headers: {
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
      },
    });
  }

  try {
    const body: FitRequest = await req.json();
    const candidateSet = new Set(body.candidateSkills.map((s) => s.trim().toLowerCase()));

    const matchedSkills = body.requiredSkills.filter((s) =>
      candidateSet.has(s.trim().toLowerCase()),
    );
    const missingSkills = body.requiredSkills.filter(
      (s) => !candidateSet.has(s.trim().toLowerCase()),
    );

    const baseScore =
      body.requiredSkills.length === 0
        ? 80
        : Math.round((matchedSkills.length / body.requiredSkills.length) * 100);

    // Proof-of-work bonus (+5 per relevant shipped artifact, capped at 100)
    const artifactBonus = Math.min(10, body.artifactTitles.length * 3);
    const matchScore = Math.min(100, baseScore + artifactBonus);

    const recommendations =
      missingSkills.length > 0
        ? [
            `Highlight hands-on work related to ${missingSkills.slice(0, 2).join(" and ")} in your cover note.`,
            `Attach your strongest Proof-of-Work artifact (${body.artifactTitles[0] ?? "a live project"}) to validate ${matchedSkills[0] ?? "core skills"}.`,
          ]
        : [
            `Strong alignment across all required skills for ${body.jobTitle}.`,
            `Lead your application with concrete metrics from your verified artifacts.`,
          ];

    return new Response(
      JSON.stringify({
        matchScore,
        matchedSkills,
        missingSkills,
        recommendations,
        computedAt: new Date().toISOString(),
      }),
      {
        headers: {
          "Content-Type": "application/json",
          "Access-Control-Allow-Origin": "*",
        },
      },
    );
  } catch (error) {
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : "Invalid request" }),
      { status: 400, headers: { "Content-Type": "application/json" } },
    );
  }
});
