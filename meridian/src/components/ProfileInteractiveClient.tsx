"use client";

import { useMemo, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import {
  BadgeCheck,
  Briefcase,
  CheckCircle2,
  ExternalLink,
  FileCode2,
  MapPin,
  MessageSquare,
} from "lucide-react";
import type { Profile } from "@/lib/types";
import { CvBuilderTrigger } from "@/components/CvBuilderModal";

export function ProfileInteractiveClient({ profile }: { profile: Profile }) {
  const [selectedSkill, setSelectedSkill] = useState<string | null>(null);

  const visibleArtifacts = useMemo(() => {
    if (!selectedSkill) return profile.artifacts;
    return profile.artifacts.filter((a) =>
      a.skillsTags.some((t) => t.toLowerCase() === selectedSkill.toLowerCase()),
    );
  }, [profile.artifacts, selectedSkill]);

  return (
    <div className="mx-auto max-w-5xl px-4 py-8 sm:px-6 lg:px-8 space-y-6">
      {/* Editorial Dossier Header */}
      <div className="overflow-hidden rounded-2xl border border-[#e5dfd6] bg-white">
        <div className="relative h-36 sm:h-48 w-full bg-[#141413]">
          <Image
            src={profile.coverUrl}
            alt={`${profile.fullName} cover`}
            fill
            className="object-cover opacity-85"
          />
        </div>

        <div className="p-5 sm:p-8">
          <div className="-mt-16 mb-5 flex flex-col sm:flex-row sm:items-end justify-between gap-4">
            <Image
              src={profile.avatarUrl}
              alt={profile.fullName}
              width={96}
              height={96}
              className="h-24 w-24 rounded-2xl border-4 border-white object-cover shadow-md bg-white"
            />

            <div className="flex flex-wrap items-center gap-2">
              <CvBuilderTrigger />
              <Link
                href="/messages"
                className="inline-flex items-center gap-1.5 rounded-full border border-[#d6cec2] px-4 py-2 text-xs font-semibold text-[#141413] hover:border-[#141413] transition"
              >
                <MessageSquare className="h-3.5 w-3.5" aria-hidden="true" />
                <span>Message with Intent</span>
              </Link>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2.5">
            <h1 className="font-display text-3xl font-semibold tracking-tight text-[#141413]">
              {profile.fullName}
            </h1>
            {profile.workEmailVerified && (
              <span className="inline-flex items-center gap-1 rounded-full bg-[#e6f2ec] px-2.5 py-0.5 text-xs font-semibold text-[#0f5132]">
                <BadgeCheck className="h-3.5 w-3.5" aria-hidden="true" />
                Verified ({profile.verifiedDomain})
              </span>
            )}
            {profile.openToWork && (
              <span className="rounded-full border border-[#0f5132]/30 bg-white px-2.5 py-0.5 text-xs font-semibold text-[#0f5132]">
                Open to Roles
              </span>
            )}
          </div>

          <p className="mt-1.5 text-sm font-medium text-[#292524]">{profile.headline}</p>
          <div className="mt-2 flex flex-wrap items-center gap-4 text-xs text-[#78716c]">
            <span className="inline-flex items-center gap-1">
              <MapPin className="h-3.5 w-3.5" aria-hidden="true" />
              {profile.location}
            </span>
            <span className="font-mono-num">
              {profile.connectionsCount} verified connections
            </span>
          </div>

          <p className="mt-4 text-sm text-[#44403c] leading-relaxed max-w-[68ch]">
            {profile.bio}
          </p>
        </div>
      </div>

      {/* Interactive Evidence-Backed Skills Filter Bar */}
      <section className="rounded-2xl border border-[#e5dfd6] bg-white p-5 sm:p-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-4">
          <div>
            <h2 className="font-display text-xl font-semibold text-[#141413]">
              Evidence-Backed Skills
            </h2>
            <p className="text-xs text-[#57534e]">
              Click any skill to filter the exact shipped artifacts that prove it.
            </p>
          </div>
          {selectedSkill && (
            <button
              type="button"
              onClick={() => setSelectedSkill(null)}
              className="text-xs font-semibold text-[#0f5132] hover:underline cursor-pointer"
            >
              Show all artifacts
            </button>
          )}
        </div>

        <div className="flex flex-wrap gap-2">
          {profile.skills.map((sk) => {
            const active = selectedSkill === sk.skillName;
            return (
              <button
                key={sk.id}
                type="button"
                onClick={() =>
                  setSelectedSkill((cur) => (cur === sk.skillName ? null : sk.skillName))
                }
                className={`inline-flex items-center gap-2 rounded-full border px-3.5 py-1.5 text-xs font-semibold transition cursor-pointer ${
                  active
                    ? "border-[#141413] bg-[#141413] text-white"
                    : "border-[#e5dfd6] bg-[#f6f3ee] text-[#141413] hover:border-[#0f5132]"
                }`}
              >
                <span>{sk.skillName}</span>
                <span
                  className={`font-mono-num text-[11px] ${
                    active ? "text-emerald-300" : "text-[#0f5132]"
                  }`}
                >
                  {sk.linkedArtifactCount} proof
                </span>
              </button>
            );
          })}
        </div>
      </section>

      {/* Proof-of-Work Artifact Showcase */}
      <section className="rounded-2xl border border-[#e5dfd6] bg-white p-5 sm:p-6">
        <div className="flex items-center justify-between gap-2 mb-5">
          <h2 className="font-display text-xl font-semibold text-[#141413] flex items-center gap-2">
            <FileCode2 className="h-5 w-5 text-[#0f5132]" aria-hidden="true" />
            <span>
              Verified Proof-of-Work Artifacts
              {selectedSkill ? ` · ${selectedSkill}` : ""}
            </span>
          </h2>
          <span className="font-mono-num text-xs font-semibold text-[#0f5132]">
            {visibleArtifacts.length} shown
          </span>
        </div>

        <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
          {visibleArtifacts.map((art) => (
            <a
              key={art.id}
              href={art.url}
              target="_blank"
              rel="noreferrer"
              className="group flex flex-col overflow-hidden rounded-xl border border-[#e5dfd6] bg-[#f6f3ee]/40 transition hover:border-[#141413] hover:bg-white"
            >
              <div className="relative h-36 w-full bg-[#e5dfd6]">
                <Image
                  src={art.thumbnailUrl}
                  alt={art.title}
                  fill
                  className="object-cover"
                />
                <span className="absolute top-2.5 left-2.5 rounded-full bg-[#141413]/85 px-2.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-white">
                  {art.artifactType.replace("_", " ")}
                </span>
              </div>
              <div className="flex flex-1 flex-col justify-between p-4">
                <div>
                  <div className="flex items-start justify-between gap-2">
                    <h3 className="text-sm font-bold text-[#141413] group-hover:text-[#0f5132] leading-snug">
                      {art.title}
                    </h3>
                    <ExternalLink
                      className="h-3.5 w-3.5 text-[#78716c] shrink-0 mt-0.5"
                      aria-hidden="true"
                    />
                  </div>
                  <p className="mt-2 text-xs text-[#57534e] leading-relaxed">
                    {art.summary}
                  </p>
                </div>

                <div className="mt-3 pt-3 border-t border-[#e5dfd6] space-y-2">
                  <div className="flex items-center justify-between text-[11px]">
                    <span className="inline-flex items-center gap-1 font-semibold text-[#0f5132]">
                      <CheckCircle2 className="h-3 w-3" aria-hidden="true" />
                      {art.verifiedSource}
                    </span>
                    <span className="font-mono-num text-[#57534e]">{art.metricsLabel}</span>
                  </div>
                </div>
              </div>
            </a>
          ))}
        </div>
      </section>

      {/* Experience Timeline */}
      <section className="rounded-2xl border border-[#e5dfd6] bg-white p-5 sm:p-6">
        <h2 className="font-display text-xl font-semibold text-[#141413] flex items-center gap-2">
          <Briefcase className="h-4 w-4 text-[#0f5132]" aria-hidden="true" />
          <span>Career Timeline</span>
        </h2>
        <div className="mt-4 divide-y divide-[#efeae2]">
          {profile.experiences.map((exp) => (
            <div key={exp.id} className="py-4 first:pt-0 last:pb-0 space-y-1">
              <div className="flex flex-col sm:flex-row sm:items-baseline justify-between gap-1">
                <h3 className="text-sm font-bold text-[#141413]">{exp.title}</h3>
                <span className="font-mono-num text-xs text-[#78716c]">
                  {exp.startDate} – {exp.endDate ?? "Present"}
                </span>
              </div>
              <p className="text-xs font-semibold text-[#0f5132]">
                {exp.companyName} · {exp.location}
              </p>
              <p className="text-xs text-[#44403c] leading-relaxed pt-1 max-w-[68ch]">
                {exp.summary}
              </p>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
