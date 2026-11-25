"use client";

import { useMemo, useState, type ReactNode } from "react";
import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import {
  Bell,
  Briefcase,
  Building2,
  CheckCheck,
  Compass,
  Home,
  MessageSquare,
  Search,
  ShieldCheck,
  UserCheck,
  X,
} from "lucide-react";
import {
  INITIAL_NOTIFICATIONS,
  JOBS,
  ORGANISATIONS,
  PROFILES,
  formatSalaryRange,
} from "@/lib/data";
import type { NotificationItem } from "@/lib/types";

interface NavItem {
  href: string;
  label: string;
  mobileLabel: string;
  icon: typeof Home;
  matchExact?: boolean;
  matchPrefix: string;
}

const PRIMARY_NAV: NavItem[] = [
  { href: "/", label: "Feed", mobileLabel: "Feed", icon: Home, matchExact: true, matchPrefix: "/" },
  { href: "/jobs", label: "Jobs", mobileLabel: "Jobs", icon: Briefcase, matchPrefix: "/jobs" },
  { href: "/u/amara-okafor", label: "Profile", mobileLabel: "Profile", icon: UserCheck, matchPrefix: "/u" },
  { href: "/messages", label: "Messages", mobileLabel: "Inbox", icon: MessageSquare, matchPrefix: "/messages" },
  { href: "/employer", label: "Hire", mobileLabel: "Hire", icon: ShieldCheck, matchPrefix: "/employer" },
];

export function AppShell({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const [searchQuery, setSearchQuery] = useState("");
  const [searchFocused, setSearchFocused] = useState(false);
  const [notifOpen, setNotifOpen] = useState(false);
  const [notifications, setNotifications] = useState<NotificationItem[]>(INITIAL_NOTIFICATIONS);

  const activeUser = PROFILES[0];
  const unreadNotifCount = notifications.filter((n) => n.unread).length;

  const isActive = (item: NavItem) => {
    if (item.matchExact) return pathname === item.href;
    return pathname === item.matchPrefix || pathname.startsWith(`${item.matchPrefix}/`);
  };

  const searchResults = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    if (!q) return null;
    return {
      jobs: JOBS.filter(
        (j) =>
          j.title.toLowerCase().includes(q) ||
          j.org.name.toLowerCase().includes(q) ||
          j.requiredSkills.some((s) => s.toLowerCase().includes(q)),
      ).slice(0, 3),
      profiles: PROFILES.filter(
        (p) =>
          p.fullName.toLowerCase().includes(q) ||
          p.headline.toLowerCase().includes(q),
      ).slice(0, 2),
      orgs: ORGANISATIONS.filter(
        (o) =>
          o.name.toLowerCase().includes(q) ||
          o.industry.toLowerCase().includes(q),
      ).slice(0, 2),
    };
  }, [searchQuery]);

  function markAllRead() {
    setNotifications((prev) => prev.map((n) => ({ ...n, unread: false })));
  }

  return (
    <div className="min-h-screen flex flex-col bg-[#f6f3ee] text-[#141413]">
      {/* Editorial Executive Top Header */}
      <header className="sticky top-0 z-40 border-b border-[#e5dfd6] bg-white/95 backdrop-blur-sm">
        <div className="mx-auto flex h-16 max-w-[1340px] items-center justify-between gap-4 px-4 sm:px-6 lg:px-8">
          {/* Left: Brand + Global Search */}
          <div className="flex items-center gap-4 flex-1 max-w-md">
            <Link href="/" className="flex items-center gap-2.5 shrink-0 group">
              <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-[#0f5132] text-white transition group-hover:bg-[#0a3b24]">
                <Compass className="h-5 w-5" aria-hidden="true" />
              </span>
              <span className="font-display text-xl font-semibold tracking-tight text-[#141413]">
                Meridian
              </span>
            </Link>

            {/* Instant Global Search */}
            <div className="relative hidden sm:block flex-1">
              <Search
                className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[#78716c]"
                aria-hidden="true"
              />
              <input
                type="text"
                value={searchQuery}
                onFocus={() => setSearchFocused(true)}
                onBlur={() => setTimeout(() => setSearchFocused(false), 180)}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search jobs, proof, people, orgs..."
                className="w-full rounded-full border border-[#e5dfd6] bg-[#f6f3ee] py-1.5 pl-9 pr-8 text-xs text-[#141413] placeholder:text-[#78716c] focus:border-[#0f5132] focus:bg-white focus:outline-none transition"
              />
              {searchQuery && (
                <button
                  type="button"
                  onClick={() => setSearchQuery("")}
                  aria-label="Clear search"
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[#78716c] hover:text-[#141413] cursor-pointer"
                >
                  <X className="h-3.5 w-3.5" />
                </button>
              )}

              {/* Live Global Search Dropdown */}
              {searchFocused && searchResults && (
                <div className="absolute left-0 right-0 top-11 z-50 rounded-2xl border border-[#e5dfd6] bg-white p-3 shadow-lg space-y-3 text-xs">
                  {searchResults.jobs.length === 0 &&
                  searchResults.profiles.length === 0 &&
                  searchResults.orgs.length === 0 ? (
                    <p className="px-2 py-3 text-center text-[#78716c]">
                      No matches for &ldquo;{searchQuery}&rdquo;
                    </p>
                  ) : (
                    <>
                      {searchResults.jobs.length > 0 && (
                        <div>
                          <p className="px-2 pb-1 text-[10px] font-semibold uppercase tracking-wider text-[#78716c]">
                            Verified Roles
                          </p>
                          {searchResults.jobs.map((job) => (
                            <Link
                              key={job.id}
                              href={`/jobs?selected=${job.id}`}
                              className="flex items-center justify-between gap-2 rounded-lg px-2 py-1.5 hover:bg-[#f6f3ee]"
                            >
                              <span className="font-medium text-[#141413] truncate">
                                {job.title}
                              </span>
                              <span className="font-mono-num text-[11px] font-semibold text-[#0f5132] shrink-0">
                                {formatSalaryRange(job.salaryMin, job.salaryMax, job.salaryCurrency)}
                              </span>
                            </Link>
                          ))}
                        </div>
                      )}
                      {searchResults.profiles.length > 0 && (
                        <div>
                          <p className="px-2 pb-1 text-[10px] font-semibold uppercase tracking-wider text-[#78716c]">
                            People
                          </p>
                          {searchResults.profiles.map((p) => (
                            <Link
                              key={p.id}
                              href={`/u/${p.handle}`}
                              className="flex items-center gap-2 rounded-lg px-2 py-1.5 hover:bg-[#f6f3ee]"
                            >
                              <Image
                                src={p.avatarUrl}
                                alt={p.fullName}
                                width={22}
                                height={22}
                                className="h-5.5 w-5.5 rounded-full object-cover"
                              />
                              <span className="font-medium text-[#141413] truncate">
                                {p.fullName}
                              </span>
                            </Link>
                          ))}
                        </div>
                      )}
                      {searchResults.orgs.length > 0 && (
                        <div>
                          <p className="px-2 pb-1 text-[10px] font-semibold uppercase tracking-wider text-[#78716c]">
                            Verified Companies
                          </p>
                          {searchResults.orgs.map((o) => (
                            <Link
                              key={o.id}
                              href={`/org/${o.slug}`}
                              className="flex items-center gap-2 rounded-lg px-2 py-1.5 hover:bg-[#f6f3ee]"
                            >
                              <Building2 className="h-3.5 w-3.5 text-[#0f5132]" aria-hidden="true" />
                              <span className="font-medium text-[#141413]">{o.name}</span>
                            </Link>
                          ))}
                        </div>
                      )}
                    </>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* Center: Primary Navigation */}
          <nav aria-label="Primary" className="hidden md:flex items-center gap-1">
            {PRIMARY_NAV.map((item) => {
              const Icon = item.icon;
              const active = isActive(item);
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`inline-flex items-center gap-2 rounded-full px-3.5 py-2 text-xs font-semibold transition ${
                    active
                      ? "bg-[#141413] text-white"
                      : "text-[#57534e] hover:bg-[#f6f3ee] hover:text-[#141413]"
                  }`}
                >
                  <Icon className="h-4 w-4" aria-hidden="true" />
                  <span>{item.label}</span>
                </Link>
              );
            })}
          </nav>

          {/* Right: Notifications + Active Profile + Sign in */}
          <div className="flex items-center gap-2.5 shrink-0">
            <div className="relative">
              <button
                type="button"
                onClick={() => setNotifOpen((v) => !v)}
                aria-label="Notifications"
                className="relative flex h-9 w-9 items-center justify-center rounded-full border border-[#e5dfd6] bg-white text-[#57534e] hover:border-[#141413] hover:text-[#141413] transition cursor-pointer"
              >
                <Bell className="h-4 w-4" aria-hidden="true" />
                {unreadNotifCount > 0 && (
                  <span className="absolute -top-0.5 -right-0.5 flex h-4 w-4 items-center justify-center rounded-full bg-[#0f5132] text-[10px] font-bold text-white">
                    {unreadNotifCount}
                  </span>
                )}
              </button>

              {notifOpen && (
                <div className="absolute right-0 top-11 z-50 w-80 rounded-2xl border border-[#e5dfd6] bg-white p-3 shadow-xl">
                  <div className="flex items-center justify-between px-2 pb-2 border-b border-[#e5dfd6]">
                    <span className="text-xs font-bold text-[#141413]">
                      Signal Notifications
                    </span>
                    <button
                      type="button"
                      onClick={markAllRead}
                      className="inline-flex items-center gap-1 text-[11px] font-semibold text-[#0f5132] hover:underline cursor-pointer"
                    >
                      <CheckCheck className="h-3.5 w-3.5" aria-hidden="true" />
                      <span>Mark all read</span>
                    </button>
                  </div>
                  <div className="mt-1 divide-y divide-[#f0ebe3]">
                    {notifications.map((n) => (
                      <Link
                        key={n.id}
                        href={n.href}
                        onClick={() => setNotifOpen(false)}
                        className={`block rounded-xl p-2.5 transition hover:bg-[#f6f3ee] ${
                          n.unread ? "bg-[#e6f2ec]/40" : ""
                        }`}
                      >
                        <div className="flex items-start justify-between gap-2">
                          <p className="text-xs font-semibold text-[#141413] leading-snug">
                            {n.title}
                          </p>
                          <span className="text-[10px] text-[#78716c] shrink-0">
                            {n.timeAgo}
                          </span>
                        </div>
                        <p className="mt-0.5 text-[11px] text-[#57534e]">{n.detail}</p>
                      </Link>
                    ))}
                  </div>
                </div>
              )}
            </div>

            <Link
              href={`/u/${activeUser.handle}`}
              className="hidden sm:inline-flex items-center gap-2 rounded-full border border-[#e5dfd6] bg-white py-1 pl-1 pr-3 hover:border-[#141413] transition"
            >
              <Image
                src={activeUser.avatarUrl}
                alt={activeUser.fullName}
                width={28}
                height={28}
                className="h-7 w-7 rounded-full object-cover"
              />
              <span className="text-xs font-semibold text-[#141413]">
                {activeUser.fullName.split(" ")[0]}
              </span>
            </Link>

            <Link
              href="/login"
              className="rounded-full border border-[#e5dfd6] px-3 py-1.5 text-xs font-semibold text-[#57534e] hover:border-[#141413] hover:text-[#141413] transition"
            >
              Sign in
            </Link>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 pb-20 md:pb-12">{children}</main>

      {/* Editorial Footer (Desktop) */}
      <footer className="hidden md:block border-t border-[#e5dfd6] bg-white">
        <div className="mx-auto flex max-w-[1340px] items-center justify-between gap-4 px-8 py-5 text-xs text-[#78716c]">
          <div className="flex items-center gap-2">
            <Compass className="h-4 w-4 text-[#0f5132]" aria-hidden="true" />
            <span className="font-display text-sm font-semibold text-[#141413]">
              Meridian
            </span>
            <span>— Proof-of-Work Identity &amp; Verified Transparent Hiring</span>
          </div>
          <div className="flex items-center gap-5">
            <Link href="/jobs" className="hover:text-[#141413]">
              Transparent Jobs
            </Link>
            <Link href="/org/northstar-labs" className="hover:text-[#141413]">
              Verified Companies
            </Link>
            <Link href="/employer" className="hover:text-[#141413]">
              Employer Console
            </Link>
            <Link href="/signup" className="hover:text-[#141413]">
              Create Profile
            </Link>
          </div>
        </div>
      </footer>

      {/* Mobile Bottom Tab Bar */}
      <nav
        aria-label="Mobile Navigation"
        className="fixed bottom-0 inset-x-0 z-40 border-t border-[#e5dfd6] bg-white/95 backdrop-blur-sm md:hidden"
      >
        <div className="grid grid-cols-5 h-16">
          {PRIMARY_NAV.map((item) => {
            const Icon = item.icon;
            const active = isActive(item);
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`flex flex-col items-center justify-center gap-1 text-[11px] font-semibold transition ${
                  active ? "text-[#0f5132]" : "text-[#78716c] hover:text-[#141413]"
                }`}
              >
                <Icon className="h-5 w-5" aria-hidden="true" />
                <span>{item.mobileLabel}</span>
              </Link>
            );
          })}
        </div>
      </nav>
    </div>
  );
}
