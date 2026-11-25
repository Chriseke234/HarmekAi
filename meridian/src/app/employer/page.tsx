"use client";

import { useState, type FormEvent } from "react";
import Image from "next/image";
import Link from "next/link";
import {
  BadgeCheck,
  Briefcase,
  CheckCircle2,
  Clock,
  FileCode2,
  Plus,
  ShieldCheck,
} from "lucide-react";
import {
  INITIAL_APPLICATIONS,
  JOBS,
  ORGANISATIONS,
  formatSalaryRange,
} from "@/lib/data";
import type { ApplicationRecord, ApplicationStatus, JobListing, WorkplaceType } from "@/lib/types";

const STATUS_OPTIONS: ApplicationStatus[] = [
  "applied",
  "viewed",
  "shortlisted",
  "interviewing",
  "offer",
  "rejected",
];

export default function EmployerConsolePage() {
  const org = ORGANISATIONS[0];
  const [applications, setApplications] = useState<ApplicationRecord[]>(INITIAL_APPLICATIONS);
  const [postedJobs, setPostedJobs] = useState<JobListing[]>(
    JOBS.filter((j) => j.orgId === org.id),
  );
  const [showCreateForm, setShowCreateForm] = useState(false);

  // New transparent job form state
  const [title, setTitle] = useState("");
  const [location, setLocation] = useState("Global Remote");
  const [workplaceType, setWorkplaceType] = useState<WorkplaceType>("remote");
  const [salaryMin, setSalaryMin] = useState("140000");
  const [salaryMax, setSalaryMax] = useState("175000");
  const [skillsInput, setSkillsInput] = useState("TypeScript, Next.js, PostgreSQL");
  const [description, setDescription] = useState("");

  function updateStatus(appId: string, nextStatus: ApplicationStatus) {
    setApplications((prev) =>
      prev.map((app) => (app.id === appId ? { ...app, status: nextStatus } : app)),
    );
  }

  function handlePublishJob(e: FormEvent) {
    e.preventDefault();
    const min = Number(salaryMin);
    const max = Number(salaryMax);
    if (!title.trim() || !min || max < min) return;

    const newJob: JobListing = {
      id: `job-local-${Date.now()}`,
      orgId: org.id,
      org,
      title: title.trim(),
      description:
        description.trim() ||
        "Verified role published via Meridian Employer Console with mandatory salary transparency.",
      responsibilities: [
        "Collaborate with engineering and product teams to ship high-craft features.",
      ],
      workplaceType,
      employmentType: "full_time",
      experienceLevel: "senior",
      location: location.trim(),
      salaryMin: min,
      salaryMax: max,
      salaryCurrency: "USD",
      requiredSkills: skillsInput
        .split(",")
        .map((s) => s.trim())
        .filter(Boolean),
      status: "active",
      expiresAt: new Date(Date.now() + 30 * 86400 * 1000).toISOString(),
      createdAt: new Date().toISOString(),
      applicantCount: 0,
      interviewStages: ["Proof-of-Work Review (24h)", "Technical Pairing", "Team Chat"],
    };

    setPostedJobs((prev) => [newJob, ...prev]);
    setTitle("");
    setDescription("");
    setShowCreateForm(false);
  }

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 rounded-2xl border border-slate-200 bg-white p-5 sm:p-6 shadow-xs">
        <div className="flex items-center gap-3.5">
          <Image
            src={org.logoUrl}
            alt={org.name}
            width={48}
            height={48}
            className="h-12 w-12 rounded-xl object-cover border border-slate-200"
          />
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl font-bold text-slate-900">
                {org.name} — Hiring Console
              </h1>
              <span className="inline-flex items-center gap-1 rounded-full bg-teal-50 border border-teal-200 px-2.5 py-0.5 text-xs font-semibold text-teal-800">
                <BadgeCheck className="h-3.5 w-3.5" aria-hidden="true" />
                Domain Verified
              </span>
            </div>
            <p className="text-xs text-slate-500 mt-0.5">
              Response SLA: {org.responseRatePct}% reply rate (~{org.avgResponseHours}h median) · All roles require salary bands
            </p>
          </div>
        </div>

        <button
          type="button"
          onClick={() => setShowCreateForm((v) => !v)}
          className="inline-flex items-center justify-center gap-1.5 rounded-xl bg-teal-700 px-4 py-2.5 text-xs font-semibold text-white hover:bg-teal-800 transition cursor-pointer"
        >
          <Plus className="h-4 w-4" aria-hidden="true" />
          <span>{showCreateForm ? "Close Form" : "Post Verified Job"}</span>
        </button>
      </div>

      {/* Create Transparent Job Form */}
      {showCreateForm && (
        <form
          onSubmit={handlePublishJob}
          className="rounded-2xl border border-teal-200 bg-white p-5 sm:p-6 shadow-xs space-y-4"
        >
          <div className="flex items-center gap-2 text-sm font-bold text-slate-900">
            <ShieldCheck className="h-4 w-4 text-teal-700" aria-hidden="true" />
            <span>Publish Transparent Role (Auto-Expires in 30 Days)</span>
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <label className="block text-xs font-semibold text-slate-700">Role Title</label>
              <input
                type="text"
                required
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="e.g., Senior Frontend Engineer"
                className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2 text-xs focus:border-teal-600 focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700">Location</label>
              <input
                type="text"
                required
                value={location}
                onChange={(e) => setLocation(e.target.value)}
                className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2 text-xs focus:border-teal-600 focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700">
                Minimum Salary (USD — Mandatory)
              </label>
              <input
                type="number"
                required
                min={10000}
                value={salaryMin}
                onChange={(e) => setSalaryMin(e.target.value)}
                className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2 text-xs focus:border-teal-600 focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700">
                Maximum Salary (USD — Mandatory)
              </label>
              <input
                type="number"
                required
                min={10000}
                value={salaryMax}
                onChange={(e) => setSalaryMax(e.target.value)}
                className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2 text-xs focus:border-teal-600 focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700">Workplace Type</label>
              <select
                value={workplaceType}
                onChange={(e) => setWorkplaceType(e.target.value as WorkplaceType)}
                className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2 text-xs focus:border-teal-600 focus:outline-none"
              >
                <option value="remote">Remote</option>
                <option value="hybrid">Hybrid</option>
                <option value="onsite">On-site</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700">
                Required Skills (comma-separated)
              </label>
              <input
                type="text"
                value={skillsInput}
                onChange={(e) => setSkillsInput(e.target.value)}
                className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2 text-xs focus:border-teal-600 focus:outline-none"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700">Role Summary</label>
            <textarea
              rows={3}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Describe what this person will own in their first 90 days..."
              className="mt-1 w-full rounded-xl border border-slate-200 p-3 text-xs focus:border-teal-600 focus:outline-none"
            />
          </div>

          <div className="flex justify-end">
            <button
              type="submit"
              className="rounded-xl bg-teal-700 px-5 py-2 text-xs font-semibold text-white hover:bg-teal-800 cursor-pointer"
            >
              Publish Verified Role
            </button>
          </div>
        </form>
      )}

      {/* Two-Column Console: Active Roles + Proof-Ranked Applicants */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-12">
        <section className="lg:col-span-5 rounded-2xl border border-slate-200 bg-white p-5 shadow-xs space-y-3">
          <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
            <Briefcase className="h-4 w-4 text-teal-700" aria-hidden="true" />
            <span>Active Roles ({postedJobs.length})</span>
          </h2>
          {postedJobs.map((job) => (
            <div
              key={job.id}
              className="rounded-xl border border-slate-200 bg-slate-50 p-3.5 text-xs space-y-1.5"
            >
              <div className="flex items-start justify-between gap-2">
                <h3 className="font-semibold text-slate-900">{job.title}</h3>
                <span className="rounded-full bg-emerald-100 px-2 py-0.5 text-[10px] font-bold uppercase text-emerald-900">
                  {job.status}
                </span>
              </div>
              <p className="text-slate-600">
                {formatSalaryRange(job.salaryMin, job.salaryMax, job.salaryCurrency)} ·{" "}
                <span className="capitalize">{job.workplaceType}</span>
              </p>
              <div className="flex items-center justify-between text-[11px] text-slate-500 pt-1">
                <span className="inline-flex items-center gap-1">
                  <Clock className="h-3 w-3" aria-hidden="true" />
                  30-day freshness active
                </span>
                <span>{job.applicantCount} applicants</span>
              </div>
            </div>
          ))}
        </section>

        <section className="lg:col-span-7 rounded-2xl border border-slate-200 bg-white p-5 shadow-xs space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-base font-bold text-slate-900">
              Proof-of-Work Candidate Pipeline
            </h2>
            <span className="text-xs text-slate-500">
              Ranked by verified artifacts &amp; skill overlap
            </span>
          </div>

          <div className="space-y-3">
            {applications.map((app) => (
              <div
                key={app.id}
                className="rounded-xl border border-slate-200 p-4 space-y-3"
              >
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <Image
                      src={app.applicantAvatar}
                      alt={app.applicantName}
                      width={40}
                      height={40}
                      className="h-10 w-10 rounded-full object-cover border border-slate-200"
                    />
                    <div>
                      <Link
                        href={`/u/${app.applicantHandle}`}
                        className="text-sm font-bold text-slate-900 hover:text-teal-700 hover:underline"
                      >
                        {app.applicantName}
                      </Link>
                      <p className="text-xs text-slate-500">{app.jobTitle}</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <span className="rounded-full bg-teal-50 border border-teal-200 px-2.5 py-0.5 text-xs font-bold text-teal-800">
                      {app.matchScore}% Fit
                    </span>
                    <select
                      aria-label={`Update status for ${app.applicantName}`}
                      value={app.status}
                      onChange={(e) =>
                        updateStatus(app.id, e.target.value as ApplicationStatus)
                      }
                      className="rounded-lg border border-slate-200 bg-slate-50 px-2.5 py-1 text-xs font-semibold capitalize text-slate-800 focus:border-teal-600 focus:outline-none cursor-pointer"
                    >
                      {STATUS_OPTIONS.map((st) => (
                        <option key={st} value={st}>
                          {st}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                <p className="text-xs text-slate-600 leading-relaxed">{app.coverNote}</p>

                <div className="flex flex-wrap gap-1.5">
                  {app.selectedArtifactTitles.map((artTitle) => (
                    <span
                      key={artTitle}
                      className="inline-flex items-center gap-1 rounded-md bg-slate-100 px-2 py-1 text-[11px] font-medium text-slate-700"
                    >
                      <FileCode2 className="h-3 w-3 text-teal-700 shrink-0" aria-hidden="true" />
                      {artTitle}
                    </span>
                  ))}
                </div>

                <div className="flex items-center gap-1.5 text-[11px] text-emerald-700">
                  <CheckCircle2 className="h-3.5 w-3.5" aria-hidden="true" />
                  <span>Status updates notify the candidate automatically — no black holes.</span>
                </div>
              </div>
            ))}
          </div>
        </section>
      </div>
    </div>
  );
}
