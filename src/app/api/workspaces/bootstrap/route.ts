import { NextResponse } from "next/server";
import { z } from "zod";
import { getAuthenticatedContext } from "@/lib/security/auth";
import { bootstrapWorkspaceForUser } from "@/lib/workspaces/bootstrap";

const BootstrapSchema = z.object({
  businessName: z.string().min(2, "Business name must be at least 2 characters").max(120),
  industry: z.string().max(80).optional(),
  description: z.string().max(1000).optional(),
});

export async function POST(request: Request) {
  try {
    const ctx = await getAuthenticatedContext();
    if (!ctx) {
      return NextResponse.json({ error: "Authentication required." }, { status: 401 });
    }

    if (ctx.workspace) {
      return NextResponse.json({ workspace: ctx.workspace, created: false });
    }

    const body = await request.json();
    const parsed = BootstrapSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.issues[0]?.message ?? "Invalid input." },
        { status: 400 }
      );
    }

    const workspace = await bootstrapWorkspaceForUser({
      userId: ctx.userId,
      businessName: parsed.data.businessName,
      industry: parsed.data.industry,
      description: parsed.data.description,
    });

    return NextResponse.json({ workspace, created: true }, { status: 201 });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unable to create workspace.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
