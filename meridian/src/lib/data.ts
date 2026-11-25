import type {
  ApplicationRecord,
  FeedPost,
  IntentMessage,
  JobListing,
  NotificationItem,
  Organisation,
  Profile,
} from "./types";

/**
 * Rich, realistic dataset with real Unsplash photography for Meridian.
 * Mirrors the PostgreSQL + pgvector schema in supabase/migrations/0001_initial_schema.sql.
 */

export const ORGANISATIONS: Organisation[] = [
  {
    id: "org-northstar",
    slug: "northstar-labs",
    name: "Northstar Labs",
    domain: "northstarlabs.io",
    domainVerified: true,
    industry: "Developer Infrastructure & AI",
    sizeBand: "51-200",
    hqLocation: "London, UK (Remote-First)",
    logoUrl:
      "https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?auto=format&fit=crop&w=160&q=80",
    coverUrl:
      "https://images.unsplash.com/photo-1497366216548-37526070297c?auto=format&fit=crop&w=1400&q=80",
    description:
      "Northstar Labs builds observable, low-latency Postgres and vector infrastructure for global engineering teams. Every role publishes full compensation and guarantees human review within 48 hours.",
    avgResponseHours: 24,
    responseRatePct: 96,
  },
  {
    id: "org-kestrel",
    slug: "kestrel-fintech",
    name: "Kestrel Financial",
    domain: "kestrel.finance",
    domainVerified: true,
    industry: "Cross-Border Payments",
    sizeBand: "201-500",
    hqLocation: "Lagos & New York",
    logoUrl:
      "https://images.unsplash.com/photo-1614850523459-c2f4c699c52e?auto=format&fit=crop&w=160&q=80",
    coverUrl:
      "https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?auto=format&fit=crop&w=1400&q=80",
    description:
      "Kestrel Financial powers instant multi-currency treasury settlement across Africa, Europe, and North America with auditable compliance tooling.",
    avgResponseHours: 36,
    responseRatePct: 93,
  },
  {
    id: "org-verve",
    slug: "verve-health",
    name: "Verve Health Systems",
    domain: "vervehealth.ai",
    domainVerified: true,
    industry: "Clinical AI & Diagnostics",
    sizeBand: "51-200",
    hqLocation: "Toronto, Canada",
    logoUrl:
      "https://images.unsplash.com/photo-1557683316-973673baf926?auto=format&fit=crop&w=160&q=80",
    coverUrl:
      "https://images.unsplash.com/photo-1504384308090-c894fdcc538d?auto=format&fit=crop&w=1400&q=80",
    description:
      "Building clinician-first diagnostic copilots and patient workflow tools designed for safety, auditability, and speed.",
    avgResponseHours: 42,
    responseRatePct: 91,
  },
  {
    id: "org-solstice",
    slug: "solstice-energy",
    name: "Solstice Grid",
    domain: "solsticegrid.com",
    domainVerified: true,
    industry: "Climate & Grid Intelligence",
    sizeBand: "51-200",
    hqLocation: "Berlin & San Francisco",
    logoUrl:
      "https://images.unsplash.com/photo-1509391366360-2e959784a276?auto=format&fit=crop&w=160&q=80",
    coverUrl:
      "https://images.unsplash.com/photo-1473341304170-971dccb5ac1e?auto=format&fit=crop&w=1400&q=80",
    description:
      "Real-time battery dispatch and renewable forecasting software operating across 14 national power grids.",
    avgResponseHours: 30,
    responseRatePct: 94,
  },
];

export const PROFILES: Profile[] = [
  {
    id: "prof-amara",
    handle: "amara-okafor",
    fullName: "Amara Okafor",
    headline: "Staff Full-Stack Engineer · Distributed Systems, Next.js & Postgres",
    bio: "I build fast, resilient web platforms and developer tools. Over the past 7 years I have led payment ledger migrations, sub-50ms search engines, and zero-downtime Postgres architectures across global remote teams.",
    location: "Lagos, Nigeria · Open to Global Remote",
    avatarUrl:
      "https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&w=256&q=80",
    coverUrl:
      "https://images.unsplash.com/photo-1519389950473-47ba0277781c?auto=format&fit=crop&w=1400&q=80",
    openToWork: true,
    workEmailVerified: true,
    verifiedDomain: "kestrel.finance",
    connectionsCount: 642,
    profileViews30d: 184,
    skills: [
      { id: "sk-1", skillName: "TypeScript", proficiency: "expert", linkedArtifactCount: 3 },
      { id: "sk-2", skillName: "Next.js", proficiency: "expert", linkedArtifactCount: 2 },
      { id: "sk-3", skillName: "PostgreSQL", proficiency: "expert", linkedArtifactCount: 2 },
      { id: "sk-4", skillName: "Supabase", proficiency: "proficient", linkedArtifactCount: 2 },
      { id: "sk-5", skillName: "System Design", proficiency: "expert", linkedArtifactCount: 3 },
      { id: "sk-6", skillName: "Tailwind CSS", proficiency: "proficient", linkedArtifactCount: 1 },
    ],
    artifacts: [
      {
        id: "art-1",
        profileId: "prof-amara",
        artifactType: "repo",
        title: "pg-ledger-kit — Idempotent Multi-Currency Ledger on Postgres",
        url: "https://github.com/meridian-examples/pg-ledger-kit",
        summary:
          "Open-source double-entry accounting primitives with serializable isolation, RLS policies, and sub-15ms settlement benchmarks.",
        skillsTags: ["PostgreSQL", "TypeScript", "System Design"],
        verifiedSource: "GitHub Verified",
        thumbnailUrl:
          "https://images.unsplash.com/photo-1555066931-4365d14bab8c?auto=format&fit=crop&w=640&q=80",
        metricsLabel: "1.4k stars · 99.98% pass",
      },
      {
        id: "art-2",
        profileId: "prof-amara",
        artifactType: "case_study",
        title: "Cutting Cross-Border Checkout Latency by 62% with Edge Caching",
        url: "https://meridian.example/case-studies/checkout-latency",
        summary:
          "Architectural breakdown of migrating a legacy monolith to Next.js App Router, Supabase Realtime, and regional read replicas.",
        skillsTags: ["Next.js", "Supabase", "System Design"],
        verifiedSource: "Domain Verified",
        thumbnailUrl:
          "https://images.unsplash.com/photo-1460925895917-afdab827c52f?auto=format&fit=crop&w=640&q=80",
        metricsLabel: "-62% p95 latency · 12M req/d",
      },
      {
        id: "art-3",
        profileId: "prof-amara",
        artifactType: "live_product",
        title: "VectorJobs — Hybrid SQL + pgvector Role Matching Engine",
        url: "https://meridian.example/projects/vector-jobs",
        summary:
          "Production hybrid search combining strict salary/location SQL filters with 1536-dim semantic embeddings.",
        skillsTags: ["TypeScript", "PostgreSQL", "Supabase", "Next.js"],
        verifiedSource: "Live Deployment Verified",
        thumbnailUrl:
          "https://images.unsplash.com/photo-1551288049-bebda4e38f71?auto=format&fit=crop&w=640&q=80",
        metricsLabel: "38ms median query",
      },
    ],
    experiences: [
      {
        id: "exp-1",
        companyName: "Kestrel Financial",
        title: "Staff Software Engineer",
        employmentType: "full_time",
        location: "Lagos · Remote",
        startDate: "2023-03",
        endDate: null,
        summary:
          "Lead architect for treasury settlement APIs and developer dashboard. Mentored 9 engineers across 4 time zones.",
      },
      {
        id: "exp-2",
        companyName: "Paybridge Global",
        title: "Senior Full-Stack Engineer",
        employmentType: "full_time",
        location: "London · Hybrid",
        startDate: "2020-01",
        endDate: "2023-02",
        summary:
          "Built merchant onboarding and real-time payout reconciliation in TypeScript, React, and PostgreSQL.",
      },
    ],
  },
  {
    id: "prof-daniel",
    handle: "daniel-keller",
    fullName: "Daniel Keller",
    headline: "Principal Product Designer · Design Systems & AI Workflows",
    bio: "Designing calm, high-craft enterprise software and transparent AI interfaces. Obsessed with responsive ergonomics, accessibility, and eliminating dark patterns.",
    location: "Berlin, Germany · Remote",
    avatarUrl:
      "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=256&q=80",
    coverUrl:
      "https://images.unsplash.com/photo-1497215842964-222b430dc094?auto=format&fit=crop&w=1400&q=80",
    openToWork: false,
    workEmailVerified: true,
    verifiedDomain: "northstarlabs.io",
    connectionsCount: 890,
    profileViews30d: 312,
    skills: [
      { id: "sk-10", skillName: "Figma", proficiency: "expert", linkedArtifactCount: 2 },
      { id: "sk-11", skillName: "Product Strategy", proficiency: "expert", linkedArtifactCount: 2 },
      { id: "sk-12", skillName: "Tailwind CSS", proficiency: "proficient", linkedArtifactCount: 1 },
    ],
    artifacts: [
      {
        id: "art-10",
        profileId: "prof-daniel",
        artifactType: "design",
        title: "Northstar UI — Accessible Multi-Density Enterprise Design System",
        url: "https://meridian.example/design/northstar-ui",
        summary:
          "WCAG AAA token architecture, keyboard-first master-detail patterns, and zero-dependency SVG icon system.",
        skillsTags: ["Figma", "Tailwind CSS", "Product Strategy"],
        verifiedSource: "Work Email Verified",
        thumbnailUrl:
          "https://images.unsplash.com/photo-1545235617-9465d2a55698?auto=format&fit=crop&w=640&q=80",
        metricsLabel: "14 squads · WCAG AAA",
      },
    ],
    experiences: [
      {
        id: "exp-10",
        companyName: "Northstar Labs",
        title: "Principal Product Designer",
        employmentType: "full_time",
        location: "Berlin · Remote",
        startDate: "2022-06",
        endDate: null,
        summary:
          "Leading product craft and design systems across Northstar's developer console and AI observability suite.",
      },
    ],
  },
];

export const JOBS: JobListing[] = [
  {
    id: "job-1",
    orgId: "org-northstar",
    org: ORGANISATIONS[0],
    title: "Staff Full-Stack Engineer (Next.js & Postgres)",
    description:
      "Own the developer console and real-time query inspector for Northstar Labs. You will architect clean, responsive interfaces backed by PostgreSQL, pgvector, and Supabase Edge Functions.",
    responsibilities: [
      "Architect end-to-end features across Next.js App Router, TypeScript, and PostgreSQL.",
      "Design strict Row-Level Security boundaries and sub-50ms semantic search endpoints.",
      "Collaborate directly with design and founding engineers without bloated ceremony.",
    ],
    workplaceType: "remote",
    employmentType: "full_time",
    experienceLevel: "senior",
    location: "Global Remote (UTC-5 to UTC+3)",
    salaryMin: 165000,
    salaryMax: 205000,
    salaryCurrency: "USD",
    requiredSkills: ["TypeScript", "Next.js", "PostgreSQL", "Supabase", "System Design"],
    status: "active",
    expiresAt: "2026-12-24T00:00:00Z",
    createdAt: "2026-11-22T09:00:00Z",
    applicantCount: 14,
    interviewStages: ["Proof-of-Work Review (24h)", "Architecture Pairing (60m)", "Founder Chat (30m)"],
  },
  {
    id: "job-2",
    orgId: "org-kestrel",
    org: ORGANISATIONS[1],
    title: "Senior Backend Engineer — Treasury & Ledgers",
    description:
      "Build high-integrity multi-currency settlement systems powering real-time cross-border transfers across 25+ corridors.",
    responsibilities: [
      "Design idempotent ledger pipelines with strict audit trails in PostgreSQL and Go/TypeScript.",
      "Partner with compliance and partner banks to cut settlement times under 30 seconds.",
      "Maintain 99.99% uptime with clear runbooks and automated chaos testing.",
    ],
    workplaceType: "hybrid",
    employmentType: "full_time",
    experienceLevel: "senior",
    location: "Lagos or London (Hybrid)",
    salaryMin: 135000,
    salaryMax: 170000,
    salaryCurrency: "USD",
    requiredSkills: ["PostgreSQL", "TypeScript", "Go", "System Design", "AWS"],
    status: "active",
    expiresAt: "2026-12-20T00:00:00Z",
    createdAt: "2026-11-20T14:00:00Z",
    applicantCount: 9,
    interviewStages: ["Repo Walkthrough (30m)", "Ledger Systems Design (60m)", "VP Eng Chat"],
  },
  {
    id: "job-3",
    orgId: "org-verve",
    org: ORGANISATIONS[2],
    title: "AI Systems Engineer — Clinical Retrieval & Evals",
    description:
      "Develop grounded retrieval pipelines, citation verification, and automated evaluation harnesses for clinician decision-support tools.",
    responsibilities: [
      "Build hybrid lexical + vector search pipelines with strict provenance tracking.",
      "Run continuous red-teaming and latency benchmarks across open-weight and frontier models.",
      "Ship production Python and TypeScript services with full HIPAA-ready logging.",
    ],
    workplaceType: "remote",
    employmentType: "full_time",
    experienceLevel: "mid",
    location: "North America & Europe (Remote)",
    salaryMin: 150000,
    salaryMax: 185000,
    salaryCurrency: "USD",
    requiredSkills: ["Python", "PostgreSQL", "LLM Engineering", "TypeScript", "System Design"],
    status: "active",
    expiresAt: "2026-12-18T00:00:00Z",
    createdAt: "2026-11-18T11:30:00Z",
    applicantCount: 19,
    interviewStages: ["Eval Design Screen", "Live Retrieval Debug", "Clinical Safety Panel"],
  },
  {
    id: "job-4",
    orgId: "org-northstar",
    org: ORGANISATIONS[0],
    title: "Senior Product Designer — Developer Experience",
    description:
      "Shape the visual clarity and interaction craft of Northstar's observability console, onboarding flows, and mobile companion views.",
    responsibilities: [
      "Craft responsive desktop, tablet, and mobile interfaces with strong accessibility defaults.",
      "Prototype directly in Figma and Tailwind CSS alongside engineering.",
      "Conduct weekly customer interviews and translate insights into shipped iterations.",
    ],
    workplaceType: "remote",
    employmentType: "contract",
    experienceLevel: "senior",
    location: "Europe / UK (Remote)",
    salaryMin: 120000,
    salaryMax: 150000,
    salaryCurrency: "USD",
    requiredSkills: ["Figma", "Product Strategy", "Tailwind CSS", "React"],
    status: "active",
    expiresAt: "2026-12-22T00:00:00Z",
    createdAt: "2026-11-23T16:15:00Z",
    applicantCount: 7,
    interviewStages: ["Portfolio Deep Dive", "Live Critique & Pairing", "Team Alignment"],
  },
  {
    id: "job-5",
    orgId: "org-solstice",
    org: ORGANISATIONS[3],
    title: "Principal Frontend Architect — Real-Time Grid Telemetry",
    description:
      "Lead the mission-critical telemetry web interface used by grid operators to dispatch utility-scale batteries in real time.",
    responsibilities: [
      "Architect 60fps canvas/SVG time-series visualizations in React and TypeScript.",
      "Design resilient WebSocket state recovery for intermittent field connections.",
      "Establish frontend performance budgets and automated visual regression tests.",
    ],
    workplaceType: "remote",
    employmentType: "full_time",
    experienceLevel: "lead",
    location: "EU / UK / Africa (Remote)",
    salaryMin: 175000,
    salaryMax: 215000,
    salaryCurrency: "USD",
    requiredSkills: ["TypeScript", "Next.js", "React", "System Design", "Tailwind CSS"],
    status: "active",
    expiresAt: "2026-12-25T00:00:00Z",
    createdAt: "2026-11-24T08:00:00Z",
    applicantCount: 11,
    interviewStages: ["Artifact Review", "Frontend Architecture", "Executive Sync"],
  },
  {
    id: "job-6",
    orgId: "org-kestrel",
    org: ORGANISATIONS[1],
    title: "Founding Developer Advocate & Solutions Engineer",
    description:
      "Partner with enterprise FinTech CTOs integrating Kestrel's settlement APIs, author technical reference architectures, and shape SDK ergonomics.",
    responsibilities: [
      "Ship production starter kits in TypeScript and Next.js for enterprise customers.",
      "Host technical workshops and publish reproducible latency benchmarks.",
      "Channel developer friction directly into core API roadmap priorities.",
    ],
    workplaceType: "hybrid",
    employmentType: "full_time",
    experienceLevel: "mid",
    location: "London or Remote UK",
    salaryMin: 115000,
    salaryMax: 145000,
    salaryCurrency: "USD",
    requiredSkills: ["TypeScript", "Next.js", "Supabase", "Product Strategy"],
    status: "active",
    expiresAt: "2026-12-19T00:00:00Z",
    createdAt: "2026-11-21T10:00:00Z",
    applicantCount: 16,
    interviewStages: ["Technical Writing Review", "Live Integration Demo", "Leadership Chat"],
  },
];

export const INITIAL_POSTS: FeedPost[] = [
  {
    id: "post-1",
    authorName: "Daniel Keller",
    authorHandle: "daniel-keller",
    authorAvatar: PROFILES[1].avatarUrl,
    authorHeadline: "Principal Product Designer at Northstar Labs",
    authorVerified: true,
    category: "shipped",
    createdAt: "2h ago",
    title: "Why we eliminated 1-click resume applications at Northstar Labs",
    body: "Last quarter, a single Senior Engineer posting received 640 generic applications in 48 hours—and 92% never mentioned Postgres once. We switched to Proof-of-Work applications where candidates attach 1–2 shipped artifacts and get a guaranteed human reply within 28 hours. Result: 78% fewer applications, 3.4x higher onsite pass rate, and zero ghosted candidates.",
    imageUrl:
      "https://images.unsplash.com/photo-1522071820081-009f0129c71c?auto=format&fit=crop&w=1000&q=80",
    linkedJobId: "job-1",
    tags: ["Hiring", "ProofOfWork", "Transparency"],
    reactions: { insightful: 128, shipped: 44, support: 31 },
    reposts: 29,
    comments: [
      {
        id: "c-1",
        authorName: "Amara Okafor",
        authorHandle: "amara-okafor",
        authorAvatar: PROFILES[0].avatarUrl,
        authorRole: "Staff Engineer · Kestrel Financial",
        body: "Attaching an actual repo or architecture memo immediately shifts the first conversation from resume trivia to real systems trade-offs.",
        createdAt: "1h ago",
      },
    ],
  },
  {
    id: "post-2",
    authorName: "Amara Okafor",
    authorHandle: "amara-okafor",
    authorAvatar: PROFILES[0].avatarUrl,
    authorHeadline: "Staff Full-Stack Engineer · Distributed Systems, Next.js & Postgres",
    authorVerified: true,
    category: "engineering",
    createdAt: "5h ago",
    title: "Benchmarking Hybrid SQL + pgvector at 12M daily requests",
    body: "Everyone reaches for a separate vector database too early. By combining partial B-tree indexes on mandatory salary/freshness columns with HNSW pgvector indexes inside Supabase Postgres, we cut p95 search latency to 38ms and eliminated dual-write drift completely. Full benchmark and reproducible SQL schema attached below.",
    linkedArtifact: {
      title: "VectorJobs — Hybrid SQL + pgvector Role Matching Engine",
      metrics: "38ms median · 0 dual-write drift",
      url: "https://meridian.example/projects/vector-jobs",
      source: "Live Deployment Verified",
    },
    tags: ["PostgreSQL", "pgvector", "Supabase"],
    reactions: { insightful: 214, shipped: 96, support: 18 },
    reposts: 64,
    comments: [
      {
        id: "c-2",
        authorName: "Tomiwa Adeyemi",
        authorHandle: "tomiwa-adeyemi",
        authorAvatar:
          "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=256&q=80",
        authorRole: "Staff Infra Engineer · Kestrel",
        body: "Filtering by active status + expires_at before vector distance scoring was the biggest latency win for us too.",
        createdAt: "3h ago",
      },
    ],
  },
  {
    id: "post-3",
    authorName: "Elena Vance",
    authorHandle: "elena-vance",
    authorAvatar:
      "https://images.unsplash.com/photo-1580489944761-15a19d654956?auto=format&fit=crop&w=256&q=80",
    authorHeadline: "Engineering Manager at Verve Health Systems",
    authorVerified: true,
    category: "hiring",
    createdAt: "9h ago",
    title: "We are hiring an AI Systems Engineer ($150k–$185k, Remote) — here is our exact rubric",
    body: "No whiteboard inversions. Our entire interview loop is 3 stages: an eval design screen, a live retrieval debugging session on synthetic clinical notes, and a safety panel. Full compensation band and verified response SLA are live on our Meridian hub.",
    linkedJobId: "job-3",
    tags: ["ClinicalAI", "Hiring", "Remote"],
    reactions: { insightful: 87, shipped: 22, support: 41 },
    reposts: 19,
    comments: [],
  },
];

export const INITIAL_APPLICATIONS: ApplicationRecord[] = [
  {
    id: "app-1",
    jobId: "job-1",
    jobTitle: "Staff Full-Stack Engineer (Next.js & Postgres)",
    orgName: "Northstar Labs",
    applicantName: "Amara Okafor",
    applicantHandle: "amara-okafor",
    applicantAvatar: PROFILES[0].avatarUrl,
    selectedArtifactTitles: [
      "pg-ledger-kit — Idempotent Multi-Currency Ledger on Postgres",
      "VectorJobs — Hybrid SQL + pgvector Role Matching Engine",
    ],
    coverNote:
      "Built production multi-currency Postgres ledgers and sub-40ms pgvector search. Excited by Northstar's transparent engineering culture.",
    matchScore: 100,
    status: "shortlisted",
    createdAt: "2026-11-23T10:15:00Z",
  },
  {
    id: "app-2",
    jobId: "job-4",
    jobTitle: "Senior Product Designer — Developer Experience",
    orgName: "Northstar Labs",
    applicantName: "Daniel Keller",
    applicantHandle: "daniel-keller",
    applicantAvatar: PROFILES[1].avatarUrl,
    selectedArtifactTitles: [
      "Northstar UI — Accessible Multi-Density Enterprise Design System",
    ],
    coverNote:
      "Sharing my multi-density accessible design system built for developer consoles.",
    matchScore: 88,
    status: "interviewing",
    createdAt: "2026-11-24T08:45:00Z",
  },
];

export const INITIAL_MESSAGES: IntentMessage[] = [
  {
    id: "msg-1",
    senderName: "Daniel Keller",
    senderHandle: "daniel-keller",
    senderAvatar: PROFILES[1].avatarUrl,
    senderHeadline: "Principal Product Designer at Northstar Labs",
    online: true,
    intentTag: "hiring",
    relatedJobTitle: "Staff Full-Stack Engineer (Next.js & Postgres)",
    attachedArtifact: "pg-ledger-kit — Idempotent Multi-Currency Ledger",
    body: "Hi Amara — we reviewed your pg-ledger-kit repo and VectorJobs write-up. Your architecture aligns closely with our Staff Full-Stack role ($165k–$205k). Are you free Thursday at 15:00 UTC for a 30-minute architecture walkthrough with our CTO?",
    createdAt: "11:20 AM",
    unread: true,
  },
  {
    id: "msg-2",
    senderName: "Tomiwa Adeyemi",
    senderHandle: "tomiwa-adeyemi",
    senderAvatar:
      "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=256&q=80",
    senderHeadline: "Staff Infrastructure Engineer at Kestrel Financial",
    online: true,
    intentTag: "collaboration",
    body: "Loved your checkout latency case study. We are publishing a joint benchmark on Postgres connection pooling next month—would love your feedback on the draft before we open-source the harness.",
    createdAt: "Yesterday",
    unread: false,
  },
  {
    id: "msg-3",
    senderName: "Elena Vance",
    senderHandle: "elena-vance",
    senderAvatar:
      "https://images.unsplash.com/photo-1580489944761-15a19d654956?auto=format&fit=crop&w=256&q=80",
    senderHeadline: "Engineering Manager at Verve Health Systems",
    online: false,
    intentTag: "advice",
    body: "Saw your note on Supabase RLS patterns for multi-tenant apps. Quick question: how did you structure automated policy regression tests in CI without slowing down PR checks?",
    createdAt: "Nov 23",
    unread: false,
  },
  {
    id: "msg-4",
    senderName: "Lukas Meyer",
    senderHandle: "lukas-meyer",
    senderAvatar:
      "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?auto=format&fit=crop&w=256&q=80",
    senderHeadline: "VP Engineering at Solstice Grid",
    online: false,
    intentTag: "hiring",
    relatedJobTitle: "Principal Frontend Architect — Real-Time Grid Telemetry",
    body: "Amara, your hybrid search and real-time UI benchmarks stood out. Even if you're focused on full-stack, I'd love to share our Principal Architect scope ($175k–$215k remote).",
    createdAt: "Nov 22",
    unread: true,
  },
];

export const INITIAL_NOTIFICATIONS: NotificationItem[] = [
  {
    id: "notif-1",
    type: "hiring",
    title: "Northstar Labs shortlisted your application",
    detail: "Staff Full-Stack Engineer · Responded in 18 hours",
    href: "/messages",
    timeAgo: "24m ago",
    unread: true,
  },
  {
    id: "notif-2",
    type: "artifact",
    title: "Your VectorJobs benchmark reached 214 Insightful marks",
    detail: "Tomiwa Adeyemi and 12 engineers commented",
    href: "/",
    timeAgo: "2h ago",
    unread: true,
  },
  {
    id: "notif-3",
    type: "connection",
    title: "Lukas Meyer (Solstice Grid) sent a Hiring intent intro",
    detail: "Principal Frontend Architect ($175k–$215k)",
    href: "/messages",
    timeAgo: "5h ago",
    unread: false,
  },
];

export function formatSalaryRange(min: number, max: number, currency: string): string {
  const formatter = new Intl.NumberFormat("en-US", {
    style: "currency",
    currency,
    maximumFractionDigits: 0,
  });
  return `${formatter.format(min)} – ${formatter.format(max)}`;
}

export function getProfileByHandle(handle: string): Profile | undefined {
  return PROFILES.find((p) => p.handle === handle);
}

export function getOrganisationBySlug(slug: string): Organisation | undefined {
  return ORGANISATIONS.find((o) => o.slug === slug);
}

export function getJobsByOrganisation(orgId: string): JobListing[] {
  return JOBS.filter((j) => j.orgId === orgId);
}
