"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import {
  BadgeCheck,
  Bookmark,
  CheckCircle2,
  Clock,
  DollarSign,
  ExternalLink,
  FileCode2,
  MapPin,
  Search,
  Send,
  SlidersHorizontal,
  Sparkles,
  X,
} from "lucide-react";
import type { JobListing, Profile, WorkplaceType } from "@/lib/types";
import { formatSalaryRange } from "@/lib/data";
import { computeJobFit } from "@/lib/ai";

interface JobsBoardClientProps {
  jobs: JobListing[];
  activeProfile: Profile;
  initialQuery?: string;
  initialSelectedId?: string;
}

export function JobsBoardClient({
  jobs,
  activeProfile,
  initialQuery = "",
  initialSelectedId,
}: JobsBoardClientProps) {
  const [query, setQuery] = useState(initialQuery);
  const [workplace, setWorkplace] = useState<WorkplaceType | "all">("all");
  const [minSalary, setMinSalary] = useState<number>(0);
  const [experience, setExperience] = useState<string>("all");
  const [selectedJobId, setSelectedJobId] = useState<string>(
    initialSelectedId && jobs.some((j) => j.id === initialSelectedId)
      ? initialSelectedId
      : jobs[0]?.id ?? "",
  );
  const [detailTab, setDetailTab] = useState<"overview" | "coach">("overview");
  const [mobileDetailOpen, setMobileDetailOpen] = useState<boolean>(false);
  const [savedIds, setSavedIds] = useState<string[]>(["job-1"]);

  // Smart Match Apply Drawer state
  const [applyOpen, setApplyOpen] = useState<boolean>(false);
  const [selectedArtifacts, setSelectedArtifacts] = useState<string[]>(
    activeProfile.artifacts.slice(0, 2).map((a) => a.id),
  );
  const [coverNote, setCoverNote] = useState<string>("");
  const [appliedJobIds, setAppliedJobIds] = useState<string[]>([]);

  const filteredJobs = useMemo(() => {
    const q = query.trim().toLowerCase();
    return jobs.filter((job) => {
      if (workplace !== "all" && job.workplaceType !== workplace) return false;
      if (minSalary > 0 && job.salaryMax < minSalary) return false;
      if (experience !== "all" && job.experienceLevel !== experience) return false;
      if (!q) return true;
      const haystack = [
        job.title,
        job.org.name,
        job.location,
        job.workplaceType,
        ...job.requiredSkills,
      ]
        .join(" ")
        .toLowerCase();
      return q.split(/\s+/).every((token) => haystack.includes(token));
    });
  }, [jobs, query, workplace, minSalary, experience]);

  const selectedJob =
    filteredJobs.find((j) => j.id === selectedJobId) ?? filteredJobs[0] ?? null;

  const fit = useMemo(() => {
    if (!selectedJob) return null;
    return computeJobFit(activeProfile, selectedJob);
  }, [activeProfile, selectedJob]);

  function toggleArtifact(id: string) {
    setSelectedArtifacts((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id],
    );
  }

  function toggleSaved(id: string) {
    setSavedIds((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id],
    );
  }

  function handleApplySubmit() {
    if (!selectedJob) return;
    setAppliedJobIds((prev) =>
      prev.includes(selectedJob.id) ? prev : [...prev, selectedJob.id],
    );
    setApplyOpen(false);
    setCoverNote("");
  }

  const hasApplied = selectedJob ? appliedJobIds.includes(selectedJob.id) : false;

  return (
    <div className="mx-auto max-w-[1340px] px-4 py-6 sm:px-6 lg:px-8">
      {/* Editorial Header */}
      <div className="mb-5 flex flex-col sm:flex-row sm:items-end justify-between gap-3">
        <div>
          <h1 className="font-display text-3xl font-semibold tracking-tight text-[#141413]">
            Verified Transparent Roles
          </h1>
          <p className="mt-0.5 text-xs text-[#57534e]">
            Every role publishes its compensation band, interview stages, and verified employer reply SLA.
          </p>
        </div>
        <span className="font-mono-num text-xs font-semibold text-[#0f5132]">
          {filteredJobs.length} of {jobs.length} active roles
        </span>
      </div>

      {/* Hybrid Search & Mandatory Salary Filter Bar */}
      <div className="rounded-2xl border border-[#e5dfd6] bg-white p-3.5">
        <div className="flex flex-col gap-3 lg:flex-row lg:items-center">
          <div className="relative flex-1">
            <Search
              className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-[#78716c]"
              aria-hidden="true"
            />
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search by role, stack, company, or location (e.g., Remote Postgres)..."
              className="w-full rounded-full border border-[#e5dfd6] bg-[#f6f3ee] py-2 pl-10 pr-4 text-xs text-[#141413] placeholder:text-[#78716c] focus:border-[#0f5132] focus:bg-white focus:outline-none"
            />
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <div className="inline-flex items-center gap-1.5 rounded-full border border-[#e5dfd6] bg-[#f6f3ee] px-3 py-1.5 text-xs font-semibold text-[#141413]">
              <DollarSign className="h-3.5 w-3.5 text-[#0f5132]" aria-hidden="true" />
              <select
                aria-label="Minimum salary"
                value={minSalary}
                onChange={(e) => setMinSalary(Number(e.target.value))}
                className="bg-transparent focus:outline-none cursor-pointer"
              >
                <option value={0}>Any salary</option>
                <option value={120000}>$120k+ USD</option>
                <option value={150000}>$150k+ USD</option>
                <option value={180000}>$180k+ USD</option>
              </select>
            </div>

            <div className="inline-flex items-center gap-1.5 rounded-full border border-[#e5dfd6] bg-[#f6f3ee] px-3 py-1.5 text-xs font-semibold text-[#141413]">
              <MapPin className="h-3.5 w-3.5 text-[#0f5132]" aria-hidden="true" />
              <select
                aria-label="Workplace type"
                value={workplace}
                onChange={(e) => setWorkplace(e.target.value as WorkplaceType | "all")}
                className="bg-transparent focus:outline-none cursor-pointer"
              >
                <option value="all">All workplaces</option>
                <option value="remote">Remote</option>
                <option value="hybrid">Hybrid</option>
                <option value="onsite">On-site</option>
              </select>
            </div>

            <div className="inline-flex items-center gap-1.5 rounded-full border border-[#e5dfd6] bg-[#f6f3ee] px-3 py-1.5 text-xs font-semibold text-[#141413]">
              <SlidersHorizontal className="h-3.5 w-3.5 text-[#57534e]" aria-hidden="true" />
              <select
                aria-label="Experience level"
                value={experience}
                onChange={(e) => setExperience(e.target.value)}
                className="bg-transparent focus:outline-none cursor-pointer"
              >
                <option value="all">All levels</option>
                <option value="entry">Entry</option>
                <option value="mid">Mid</option>
                <option value="senior">Senior</option>
                <option value="lead">Lead</option>
              </select>
            </div>

            {(query || workplace !== "all" || minSalary > 0 || experience !== "all") && (
              <button
                type="button"
                onClick={() => {
                  setQuery("");
                  setWorkplace("all");
                  setMinSalary(0);
                  setExperience("all");
                }}
                className="rounded-full px-3 py-1.5 text-xs font-semibold text-[#0f5132] hover:bg-[#e6f2ec] transition cursor-pointer"
              >
                Reset
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Master-Detail Workspace */}
      <div className="mt-6 grid grid-cols-1 gap-6 lg:grid-cols-12 items-start">
        {/* Left Job List */}
        <div className="lg:col-span-5 space-y-2.5">
          {filteredJobs.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-[#d6cec2] bg-white p-10 text-center">
              <p className="text-sm font-bold text-[#141413]">
                No verified roles match your current filters.
              </p>
              <p className="mt-1 text-xs text-[#78716c]">
                Try lowering your minimum salary or clearing a search keyword.
              </p>
            </div>
          ) : (
            filteredJobs.map((job) => {
              const active = selectedJob?.id === job.id;
              const jobFit = computeJobFit(activeProfile, job);
              return (
                <button
                  key={job.id}
                  type="button"
                  onClick={() => {
                    setSelectedJobId(job.id);
                    setDetailTab("overview");
                    setMobileDetailOpen(true);
                  }}
                  className={`w-full text-left rounded-2xl border p-4 transition cursor-pointer ${
                    active
                      ? "border-[#141413] bg-white shadow-sm"
                      : "border-[#e5dfd6] bg-white/80 hover:border-[#a8a29e] hover:bg-white"
                  }`}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-center gap-3 min-w-0">
                      <Image
                        src={job.org.logoUrl}
                        alt={job.org.name}
                        width={40}
                        height={40}
                        className="h-10 w-10 rounded-xl object-cover border border-[#e5dfd6] shrink-0"
                      />
                      <div className="min-w-0">
                        <h2 className="text-sm font-bold text-[#141413] truncate">
                          {job.title}
                        </h2>
                        <div className="flex items-center gap-1 text-xs text-[#57534e] min-w-0">
                          <span className="truncate">{job.org.name}</span>
                          <BadgeCheck className="h-3.5 w-3.5 text-[#0f5132] shrink-0" aria-hidden="true" />
                          <span className="truncate">· {job.location}</span>
                        </div>
                      </div>
                    </div>

                    <span className="shrink-0 whitespace-nowrap rounded-full bg-[#e6f2ec] px-2.5 py-0.5 font-mono-num text-[11px] font-bold text-[#0f5132]">
                      {jobFit.matchScore}% fit
                    </span>
                  </div>

                  <div className="mt-3 flex flex-wrap items-center justify-between gap-2 text-xs">
                    <span className="font-mono-num font-bold text-[#0f5132]">
                      {formatSalaryRange(job.salaryMin, job.salaryMax, job.salaryCurrency)}
                    </span>
                    <div className="flex items-center gap-2 text-[11px] text-[#78716c]">
                      <span className="capitalize">{job.workplaceType}</span>
                      <span>·</span>
                      <span>{job.org.responseRatePct}% reply</span>
                      <span>·</span>
                      <span>{job.applicantCount} applied</span>
                    </div>
                  </div>
                </button>
              );
            })
          )}
        </div>

        {/* Right Detail Pane */}
        {selectedJob && fit && (
          <div
            className={`${
              mobileDetailOpen
                ? "fixed inset-0 z-50 overflow-y-auto bg-[#f6f3ee] p-4 lg:static lg:inset-auto lg:z-auto lg:bg-transparent lg:p-0"
                : "hidden lg:block"
            } lg:col-span-7`}
          >
            <div className="rounded-2xl border border-[#e5dfd6] bg-white p-5 sm:p-7 lg:sticky lg:top-22">
              <div className="flex items-start justify-between gap-4">
                <div className="flex items-start gap-3.5 min-w-0">
                  <Image
                    src={selectedJob.org.logoUrl}
                    alt={selectedJob.org.name}
                    width={52}
                    height={52}
                    className="h-13 w-13 rounded-xl object-cover border border-[#e5dfd6] shrink-0"
                  />
                  <div className="min-w-0">
                    <h2 className="font-display text-2xl font-semibold text-[#141413] leading-tight">
                      {selectedJob.title}
                    </h2>
                    <div className="mt-1 flex flex-wrap items-center gap-2 text-xs text-[#57534e]">
                      <Link
                        href={`/org/${selectedJob.org.slug}`}
                        className="inline-flex items-center gap-1 font-bold text-[#0f5132] hover:underline"
                      >
                        <span>{selectedJob.org.name}</span>
                        <BadgeCheck className="h-3.5 w-3.5" aria-hidden="true" />
                      </Link>
                      <span>· {selectedJob.location}</span>
                      <span className="capitalize">· {selectedJob.workplaceType}</span>
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-1.5 shrink-0">
                  <button
                    type="button"
                    onClick={() => toggleSaved(selectedJob.id)}
                    aria-label="Save role"
                    className={`rounded-full border p-2 transition cursor-pointer ${
                      savedIds.includes(selectedJob.id)
                        ? "border-[#0f5132] bg-[#e6f2ec] text-[#0f5132]"
                        : "border-[#e5dfd6] text-[#57534e] hover:border-[#141413]"
                    }`}
                  >
                    <Bookmark className="h-4 w-4" />
                  </button>
                  <button
                    type="button"
                    onClick={() => setMobileDetailOpen(false)}
                    className="lg:hidden rounded-full border border-[#e5dfd6] p-2 text-[#57534e]"
                    aria-label="Close job detail"
                  >
                    <X className="h-4 w-4" />
                  </button>
                </div>
              </div>

              {/* Mandatory Transparency Strip */}
              <div className="mt-5 grid grid-cols-1 sm:grid-cols-3 gap-3 border-y border-[#efeae2] py-4 text-xs">
                <div>
                  <span className="text-[#78716c] block">Verified Compensation</span>
                  <span className="font-mono-num text-sm font-bold text-[#0f5132]">
                    {formatSalaryRange(
                      selectedJob.salaryMin,
                      selectedJob.salaryMax,
                      selectedJob.salaryCurrency,
                    )}
                  </span>
                </div>
                <div>
                  <span className="text-[#78716c] block">Employer Response SLA</span>
                  <span className="font-semibold text-[#141413]">
                    {selectedJob.org.responseRatePct}% reply rate (~{selectedJob.org.avgResponseHours}h)
                  </span>
                </div>
                <div>
                  <span className="text-[#78716c] block">Freshness Policy</span>
                  <span className="inline-flex items-center gap-1 font-semibold text-[#141413]">
                    <Clock className="h-3.5 w-3.5 text-[#0f5132]" aria-hidden="true" />
                    Auto-expires Dec 2026
                  </span>
                </div>
              </div>

              {/* Primary CTAs + Detail Mode Tabs */}
              <div className="mt-5 flex flex-wrap items-center justify-between gap-3">
                <div className="flex flex-wrap items-center gap-2.5">
                  {hasApplied ? (
                    <span className="inline-flex items-center gap-2 rounded-full bg-[#e6f2ec] px-4 py-2 text-xs font-bold text-[#0f5132]">
                      <CheckCircle2 className="h-4 w-4" aria-hidden="true" />
                      Application Submitted
                    </span>
                  ) : (
                    <button
                      type="button"
                      onClick={() => setApplyOpen(true)}
                      className="inline-flex items-center gap-2 rounded-full bg-[#0f5132] px-5 py-2.5 text-xs font-semibold text-white hover:bg-[#0a3b24] transition cursor-pointer"
                    >
                      <Send className="h-3.5 w-3.5" aria-hidden="true" />
                      <span>Smart Match Apply</span>
                    </button>
                  )}

                  <Link
                    href={`/org/${selectedJob.org.slug}`}
                    className="inline-flex items-center gap-1.5 rounded-full border border-[#e5dfd6] px-4 py-2.5 text-xs font-semibold text-[#141413] hover:border-[#141413] transition"
                  >
                    <span>Company Hub</span>
                    <ExternalLink className="h-3.5 w-3.5" aria-hidden="true" />
                  </Link>
                </div>

                <div className="inline-flex rounded-full border border-[#e5dfd6] bg-[#f6f3ee] p-1 text-xs">
                  <button
                    type="button"
                    onClick={() => setDetailTab("overview")}
                    className={`rounded-full px-3 py-1 font-semibold transition cursor-pointer ${
                      detailTab === "overview"
                        ? "bg-white text-[#141413] shadow-xs"
                        : "text-[#57534e]"
                    }`}
                  >
                    Role &amp; Fit
                  </button>
                  <button
                    type="button"
                    onClick={() => setDetailTab("coach")}
                    className={`inline-flex items-center gap-1 rounded-full px-3 py-1 font-semibold transition cursor-pointer ${
                      detailTab === "coach"
                        ? "bg-[#141413] text-white"
                        : "text-[#57534e]"
                    }`}
                  >
                    <Sparkles className="h-3 w-3" aria-hidden="true" />
                    <span>AI Interview Coach</span>
                  </button>
                </div>
              </div>

              {detailTab === "overview" ? (
                <div className="mt-5 space-y-5">
                  {/* Free AI Job-Fit Breakdown */}
                  <div className="rounded-xl border border-[#d6cec2] bg-[#f6f3ee] p-4">
                    <div className="flex items-center justify-between gap-2">
                      <div className="flex items-center gap-2">
                        <Sparkles className="h-4 w-4 text-[#0f5132]" aria-hidden="true" />
                        <h3 className="text-xs font-bold text-[#141413]">
                          Free AI Job-Fit Breakdown ({activeProfile.fullName})
                        </h3>
                      </div>
                      <span className="shrink-0 whitespace-nowrap rounded-full bg-[#0f5132] px-2.5 py-0.5 font-mono-num text-xs font-bold text-white">
                        {fit.matchScore}% Match
                      </span>
                    </div>

                    <div className="mt-3 flex flex-wrap gap-1.5">
                      {fit.matchedSkills.map((skill) => (
                        <span
                          key={skill}
                          className="inline-flex items-center gap-1 rounded-full bg-[#e6f2ec] px-2.5 py-0.5 text-xs font-semibold text-[#0f5132]"
                        >
                          <CheckCircle2 className="h-3 w-3" aria-hidden="true" />
                          {skill}
                        </span>
                      ))}
                      {fit.missingSkills.map((skill) => (
                        <span
                          key={skill}
                          className="rounded-full bg-amber-100 px-2.5 py-0.5 text-xs font-semibold text-amber-900"
                        >
                          Gap: {skill}
                        </span>
                      ))}
                    </div>

                    <ul className="mt-3 space-y-1 text-xs text-[#44403c]">
                      {fit.recommendations.map((rec) => (
                        <li key={rec}>• {rec}</li>
                      ))}
                    </ul>
                  </div>

                  {/* Role Details */}
                  <div className="space-y-4 text-sm text-[#292524]">
                    <div>
                      <h3 className="text-xs font-bold uppercase tracking-wider text-[#78716c]">
                        About the role
                      </h3>
                      <p className="mt-1.5 leading-relaxed">{selectedJob.description}</p>
                    </div>
                    <div>
                      <h3 className="text-xs font-bold uppercase tracking-wider text-[#78716c]">
                        What you will own
                      </h3>
                      <ul className="mt-1.5 list-disc pl-5 space-y-1.5">
                        {selectedJob.responsibilities.map((item) => (
                          <li key={item}>{item}</li>
                        ))}
                      </ul>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="mt-5 space-y-4 text-xs">
                  <div className="rounded-xl border border-[#e5dfd6] bg-[#f6f3ee] p-4 space-y-2.5">
                    <h3 className="text-sm font-bold text-[#141413]">
                      Published Interview Loop ({selectedJob.interviewStages.length} Stages)
                    </h3>
                    <ol className="space-y-2">
                      {selectedJob.interviewStages.map((stage, i) => (
                        <li key={stage} className="flex items-center gap-2.5 text-[#292524]">
                          <span className="flex h-5 w-5 items-center justify-center rounded-full bg-[#141413] font-mono-num text-[10px] font-bold text-white">
                            {i + 1}
                          </span>
                          <span className="font-medium">{stage}</span>
                        </li>
                      ))}
                    </ol>
                  </div>

                  <div className="rounded-xl border border-[#e5dfd6] bg-white p-4 space-y-2">
                    <h3 className="text-sm font-bold text-[#141413]">
                      AI Tailoring Strategy for {activeProfile.fullName}
                    </h3>
                    <p className="text-[#57534e] leading-relaxed">
                      Lead the first stage by sharing your{" "}
                      <span className="font-semibold text-[#141413]">
                        {activeProfile.artifacts[0]?.title}
                      </span>{" "}
                      artifact. Prepare to discuss how you validated performance and handled edge
                      cases for{" "}
                      <span className="font-semibold text-[#0f5132]">
                        {selectedJob.requiredSkills.slice(0, 3).join(", ")}
                      </span>
                      .
                    </p>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Smart Match Apply Modal */}
      {applyOpen && selectedJob && (
        <div
          role="dialog"
          aria-modal="true"
          aria-labelledby="apply-modal-title"
          className="fixed inset-0 z-50 flex items-center justify-center bg-[#141413]/55 p-4 backdrop-blur-xs"
        >
          <div className="w-full max-w-lg rounded-2xl border border-[#e5dfd6] bg-white p-6 shadow-2xl">
            <div className="flex items-start justify-between gap-3">
              <div>
                <h3 id="apply-modal-title" className="font-display text-xl font-semibold text-[#141413]">
                  Smart Match Apply — {selectedJob.org.name}
                </h3>
                <p className="text-xs text-[#57534e]">{selectedJob.title}</p>
              </div>
              <button
                type="button"
                onClick={() => setApplyOpen(false)}
                className="rounded-full p-1.5 text-[#78716c] hover:bg-[#f6f3ee] hover:text-[#141413] cursor-pointer"
                aria-label="Close modal"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="mt-4">
              <p className="text-xs font-bold text-[#141413]">
                Attach Proof-of-Work Artifacts
              </p>
              <div className="mt-2 space-y-2">
                {activeProfile.artifacts.map((art) => {
                  const checked = selectedArtifacts.includes(art.id);
                  return (
                    <label
                      key={art.id}
                      className={`flex items-start gap-2.5 rounded-xl border p-3 text-xs cursor-pointer transition ${
                        checked
                          ? "border-[#0f5132] bg-[#e6f2ec]/40"
                          : "border-[#e5dfd6] hover:border-[#a8a29e]"
                      }`}
                    >
                      <input
                        type="checkbox"
                        checked={checked}
                        onChange={() => toggleArtifact(art.id)}
                        className="mt-0.5 accent-[#0f5132]"
                      />
                      <div>
                        <span className="font-semibold text-[#141413] flex items-center gap-1.5">
                          <FileCode2 className="h-3.5 w-3.5 text-[#0f5132]" aria-hidden="true" />
                          {art.title}
                        </span>
                        <span className="font-mono-num text-[11px] text-[#57534e] block mt-0.5">
                          {art.metricsLabel}
                        </span>
                      </div>
                    </label>
                  );
                })}
              </div>
            </div>

            <div className="mt-4">
              <label htmlFor="cover-note" className="block text-xs font-bold text-[#141413]">
                Direct context note to hiring team (always free)
              </label>
              <textarea
                id="cover-note"
                rows={3}
                value={coverNote}
                onChange={(e) => setCoverNote(e.target.value)}
                placeholder="Share why this role excites you and which shipped artifact is most relevant..."
                className="mt-1.5 w-full rounded-xl border border-[#e5dfd6] bg-[#f6f3ee] p-3 text-xs focus:border-[#0f5132] focus:bg-white focus:outline-none"
              />
            </div>

            <div className="mt-5 flex items-center justify-end gap-2">
              <button
                type="button"
                onClick={() => setApplyOpen(false)}
                className="rounded-full px-4 py-2 text-xs font-semibold text-[#57534e] hover:bg-[#f6f3ee] cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleApplySubmit}
                className="inline-flex items-center gap-1.5 rounded-full bg-[#0f5132] px-5 py-2 text-xs font-semibold text-white hover:bg-[#0a3b24] cursor-pointer"
              >
                <Send className="h-3.5 w-3.5" aria-hidden="true" />
                <span>Submit Proof Application</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
