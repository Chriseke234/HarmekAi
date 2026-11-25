# Harmek AI — Standalone AI Customer Engagement Platform

**Your business, always within reach.** Built by **ChrisBuilds**.

Harmek AI is an independent, multi-tenant SaaS customer engagement platform built with **Next.js App Router**, **TypeScript**, **Tailwind CSS**, and **Supabase (Auth, PostgreSQL + RLS, Realtime)**.

## Core Architectural Highlights

1. **Zero-LLM Native Harmek Intelligence Engine (Default)**:
   - Operates completely without an external LLM API.
   - Deterministic intent detection, fuzzy/lexical product, service, FAQ, and policy matching, entity extraction, multi-turn conversation state tracking, configurable confidence thresholds, clarification workflows, prompt-injection defense, avoided-topic guardrails, and tone-aware grounded response rendering.
2. **Optional Enhanced AI Layer (Modular & Toggleable)**:
   - Supports OpenAI, Anthropic, and Google Gemini via clean server-side adapters.
   - Workspace API keys are encrypted at rest with AES-256-GCM in a server-only table (`workspace_ai_credentials`) and never exposed to browsers.
   - Automatic graceful fallback to the Native Harmek Engine whenever Enhanced AI is disabled, unconfigured, or encounters an error.
3. **Multi-Tenant Security**:
   - Strict `workspace_id` isolation enforced by PostgreSQL Row Level Security (`supabase/migrations/20261123000002_rls_policies.sql`) and server-side role guards (`owner`, `admin`, `agent`).
   - Separate Platform Administration layer at `/admin` restricted to `profiles.is_platform_admin = true`.
4. **Genuine Activation-Based 14-Day Free Trial**:
   - No credit card required; the 14-day clock starts only when the assistant is activated (not on registration).
   - Generates a real-data **Trial Performance Report** without fabricated metrics.

---

## Local Setup

### 1. Install Dependencies

```bash
npm install
```

### 2. Configure Environment Variables

Copy `.env.example` to `.env.local` and supply your Supabase project credentials:

```bash
cp .env.example .env.local
```

Generate a 32-byte hex encryption key for `SAGE_ENCRYPTION_KEY`:

```bash
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

### 3. Apply Supabase Database Migrations

Run both SQL migration files in your Supabase SQL Editor (or via Supabase CLI) in order:

1. `supabase/migrations/20261123000001_initial_schema.sql`
2. `supabase/migrations/20261123000002_rls_policies.sql`

### 4. Run Development Server & Tests

```bash
# Run automated test suite (Vitest)
npm run test

# Type check
npm run typecheck

# Start development server
npm run dev

# Production build
npm run build
```

---

## Embedding the Website Chat Widget

Once a workspace is created, copy the installation snippet from **Dashboard → Integrations** (or Onboarding Step 7) and paste it before `</body>` on any website:

```html
<script src="https://your-sage-domain.com/api/widget/loader.js" data-widget-key="YOUR_WIDGET_KEY" async></script>
```

---

## Deployment (Vercel)

1. Push this repository to GitHub/GitLab.
2. Import the project into Vercel.
3. Add all required environment variables from `.env.example` in Vercel Project Settings.
4. Set `NEXT_PUBLIC_APP_URL` to your production domain and add `https://your-domain.com/auth/callback` to Supabase Auth Redirect URLs.
