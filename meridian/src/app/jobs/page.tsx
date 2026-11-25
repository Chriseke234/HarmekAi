import { JOBS, PROFILES } from "@/lib/data";
import { JobsBoardClient } from "@/components/JobsBoardClient";

interface JobsPageProps {
  searchParams: Promise<{ q?: string; selected?: string }>;
}

export default async function JobsPage({ searchParams }: JobsPageProps) {
  const params = await searchParams;

  return (
    <JobsBoardClient
      jobs={JOBS}
      activeProfile={PROFILES[0]}
      initialQuery={params.q ?? ""}
      initialSelectedId={params.selected}
    />
  );
}
