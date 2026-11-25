import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import {
  ArrowRight,
  BadgeCheck,
  Building2,
  Clock,
  Globe,
  MapPin,
  ShieldCheck,
  Users,
} from "lucide-react";
import {
  formatSalaryRange,
  getJobsByOrganisation,
  getOrganisationBySlug,
} from "@/lib/data";

interface OrgPageProps {
  params: Promise<{ slug: string }>;
}

export default async function OrganisationPage({ params }: OrgPageProps) {
  const { slug } = await params;
  const org = getOrganisationBySlug(slug);

  if (!org) {
    notFound();
  }

  const openJobs = getJobsByOrganisation(org.id);

  return (
    <div className="mx-auto max-w-5xl px-4 py-8 sm:px-6 lg:px-8">
      {/* Open Verified Company Header (Zero Auth Wall) */}
      <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-xs">
        <div className="relative h-40 sm:h-52 w-full bg-slate-900">
          <Image
            src={org.coverUrl}
            alt={`${org.name} headquarters`}
            fill
            className="object-cover opacity-85"
          />
        </div>

        <div className="p-5 sm:p-7">
          <div className="-mt-14 mb-4 flex flex-col sm:flex-row sm:items-end justify-between gap-4">
            <div className="flex items-end gap-4">
              <Image
                src={org.logoUrl}
                alt={org.name}
                width={80}
                height={80}
                className="h-20 w-20 rounded-2xl border-4 border-white object-cover shadow-md bg-white"
              />
              <div className="pb-1">
                <div className="flex items-center gap-2">
                  <h1 className="text-2xl font-bold text-slate-900">{org.name}</h1>
                  {org.domainVerified && (
                    <span className="inline-flex items-center gap-1 rounded-full bg-teal-50 border border-teal-200 px-2.5 py-0.5 text-xs font-semibold text-teal-800">
                      <BadgeCheck className="h-3.5 w-3.5" aria-hidden="true" />
                      Domain Verified
                    </span>
                  )}
                </div>
                <p className="text-sm text-slate-600">{org.industry}</p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <Link
                href="/employer"
                className="rounded-xl border border-slate-200 px-4 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50 transition"
              >
                Employer Console
              </Link>
              <Link
                href="/jobs"
                className="rounded-xl bg-teal-700 px-4 py-2 text-xs font-semibold text-white hover:bg-teal-800 transition"
              >
                View Open Roles ({openJobs.length})
              </Link>
            </div>
          </div>

          <p className="text-sm text-slate-700 leading-relaxed max-w-3xl">
            {org.description}
          </p>

          {/* Transparent Employer Health Metrics */}
          <div className="mt-6 grid grid-cols-1 sm:grid-cols-4 gap-3 rounded-xl border border-slate-200 bg-slate-50 p-4 text-xs">
            <div className="flex items-center gap-2.5">
              <ShieldCheck className="h-4 w-4 text-teal-700 shrink-0" aria-hidden="true" />
              <div>
                <span className="text-slate-500 block">Response Rate</span>
                <span className="font-bold text-slate-900">{org.responseRatePct}% of applicants</span>
              </div>
            </div>
            <div className="flex items-center gap-2.5">
              <Clock className="h-4 w-4 text-teal-700 shrink-0" aria-hidden="true" />
              <div>
                <span className="text-slate-500 block">Median Reply Time</span>
                <span className="font-bold text-slate-900">~{org.avgResponseHours} hours</span>
              </div>
            </div>
            <div className="flex items-center gap-2.5">
              <Users className="h-4 w-4 text-slate-500 shrink-0" aria-hidden="true" />
              <div>
                <span className="text-slate-500 block">Company Size</span>
                <span className="font-semibold text-slate-900">{org.sizeBand} people</span>
              </div>
            </div>
            <div className="flex items-center gap-2.5">
              <Globe className="h-4 w-4 text-slate-500 shrink-0" aria-hidden="true" />
              <div>
                <span className="text-slate-500 block">Verified Domain</span>
                <span className="font-semibold text-slate-900">{org.domain}</span>
              </div>
            </div>
          </div>

          <div className="mt-4 flex flex-wrap items-center gap-4 text-xs text-slate-500">
            <span className="inline-flex items-center gap-1">
              <MapPin className="h-3.5 w-3.5" aria-hidden="true" />
              {org.hqLocation}
            </span>
            <span className="inline-flex items-center gap-1">
              <Building2 className="h-3.5 w-3.5" aria-hidden="true" />
              Publicly auditable hiring hub (no login required)
            </span>
          </div>
        </div>
      </div>

      {/* Open Verified Roles */}
      <section className="mt-8">
        <h2 className="text-lg font-bold text-slate-900 mb-4">
          Active Transparent Roles at {org.name}
        </h2>
        <div className="space-y-3">
          {openJobs.map((job) => (
            <Link
              key={job.id}
              href={`/jobs?selected=${job.id}`}
              className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 rounded-2xl border border-slate-200 bg-white p-5 hover:border-teal-400 hover:shadow-xs transition"
            >
              <div>
                <h3 className="text-base font-semibold text-slate-900">{job.title}</h3>
                <p className="mt-1 text-xs text-slate-600">
                  {job.location} · <span className="capitalize">{job.workplaceType}</span> ·{" "}
                  {job.applicantCount} applicants
                </p>
                <div className="mt-2.5 flex flex-wrap gap-1.5">
                  <span className="rounded-md bg-emerald-50 px-2.5 py-0.5 text-xs font-semibold text-emerald-800">
                    {formatSalaryRange(job.salaryMin, job.salaryMax, job.salaryCurrency)}
                  </span>
                  {job.requiredSkills.slice(0, 3).map((s) => (
                    <span
                      key={s}
                      className="rounded-full bg-slate-100 px-2.5 py-0.5 text-[11px] font-medium text-slate-700"
                    >
                      {s}
                    </span>
                  ))}
                </div>
              </div>
              <span className="inline-flex items-center gap-1 text-xs font-semibold text-teal-700 shrink-0">
                <span>Inspect &amp; Check Fit</span>
                <ArrowRight className="h-4 w-4" aria-hidden="true" />
              </span>
            </Link>
          ))}
        </div>
      </section>
    </div>
  );
}
