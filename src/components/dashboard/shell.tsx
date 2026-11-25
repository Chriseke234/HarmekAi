"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useState } from "react";
import {
  BarChart3,
  BookOpen,
  Bot,
  CreditCard,
  LayoutDashboard,
  LogOut,
  Menu,
  MessageSquare,
  Plug,
  Settings,
  Shield,
  Users,
  UserSquare2,
  Workflow,
  X,
} from "lucide-react";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";
import { Badge } from "@/components/ui/badge";
import { HarmekLogo } from "@/components/brand/harmek-logo";
import { cn } from "@/lib/utils";
import type { IntelligenceMode, TrialStatus } from "@/types/database";

const NAV_ITEMS = [
  { href: "/dashboard", label: "Overview", icon: LayoutDashboard },
  { href: "/dashboard/assistant", label: "AI Assistant", icon: Bot },
  { href: "/dashboard/conversations", label: "Conversations", icon: MessageSquare },
  { href: "/dashboard/contacts", label: "Contacts", icon: UserSquare2 },
  { href: "/dashboard/knowledge", label: "Knowledge Base", icon: BookOpen },
  { href: "/dashboard/automations", label: "Automations", icon: Workflow },
  { href: "/dashboard/integrations", label: "Integrations", icon: Plug },
  { href: "/dashboard/analytics", label: "Analytics", icon: BarChart3 },
  { href: "/dashboard/team", label: "Team", icon: Users },
  { href: "/dashboard/settings", label: "Settings", icon: Settings },
  { href: "/dashboard/billing", label: "Billing & Trial", icon: CreditCard },
];

interface DashboardShellProps {
  workspaceName: string;
  userEmail: string;
  intelligenceMode: IntelligenceMode;
  trialStatus: TrialStatus;
  trialDaysRemaining: number;
  isPlatformAdmin: boolean;
  children: React.ReactNode;
}

export function DashboardShell({
  workspaceName,
  userEmail,
  intelligenceMode,
  trialStatus,
  trialDaysRemaining,
  isPlatformAdmin,
  children,
}: DashboardShellProps) {
  const pathname = usePathname();
  const router = useRouter();
  const [drawerOpen, setDrawerOpen] = useState(false);

  async function handleSignOut() {
    const supabase = createSupabaseBrowserClient();
    await supabase.auth.signOut();
    router.push("/sign-in");
    router.refresh();
  }

  const sidebarContent = (
    <div className="flex h-full flex-col bg-[#141210]">
      <div className="flex h-16 items-center justify-between border-b border-[#2B2722] px-4">
        <Link href="/dashboard" className="flex items-center gap-2.5">
          <HarmekLogo className="h-8 w-8" />
          <div className="min-w-0">
            <p className="truncate font-display text-base font-medium text-[#F5F2EB]">Harmek AI</p>
            <p className="truncate text-[11px] text-[#968E82]">{workspaceName}</p>
          </div>
        </Link>
        <button
          type="button"
          className="rounded-lg p-1.5 text-[#968E82] hover:bg-[#211E1A] hover:text-[#F5F2EB] lg:hidden"
          onClick={() => setDrawerOpen(false)}
          aria-label="Close navigation"
        >
          <X className="h-5 w-5" />
        </button>
      </div>

      <nav className="flex-1 space-y-1 overflow-y-auto px-3 py-4">
        {NAV_ITEMS.map((item) => {
          const Icon = item.icon;
          const active =
            item.href === "/dashboard"
              ? pathname === "/dashboard"
              : pathname.startsWith(item.href);

          return (
            <Link
              key={item.href}
              href={item.href}
              onClick={() => setDrawerOpen(false)}
              className={cn(
                "flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors",
                active
                  ? "bg-[#D97745]/15 text-[#F5F2EB] border border-[#D97745]/35"
                  : "text-[#B5AEA2] hover:bg-[#211E1A] hover:text-[#F5F2EB]"
              )}
            >
              <Icon className={cn("h-4 w-4 shrink-0", active ? "text-[#D97745]" : "")} />
              <span>{item.label}</span>
            </Link>
          );
        })}

        {isPlatformAdmin ? (
          <Link
            href="/admin"
            onClick={() => setDrawerOpen(false)}
            className="mt-4 flex items-center gap-3 rounded-lg border border-[#D9A05B]/35 bg-[#D9A05B]/10 px-3 py-2 text-sm font-medium text-[#ECC28A] hover:bg-[#D9A05B]/20"
          >
            <Shield className="h-4 w-4 shrink-0" />
            <span>Platform Admin</span>
          </Link>
        ) : null}
      </nav>

      <div className="border-t border-[#2B2722] p-3">
        <div className="mb-2.5 rounded-lg border border-[#2B2722] bg-[#181613] px-3 py-2">
          <p className="truncate text-xs font-medium text-[#F5F2EB]">{userEmail}</p>
          <p className="mt-0.5 text-[11px] text-[#968E82]">
            {trialStatus === "active"
              ? `14-Day Trial: ${trialDaysRemaining}d left`
              : trialStatus === "not_started"
                ? "Trial starts on activation"
                : trialStatus === "expired"
                  ? "Trial expired"
                  : "Active subscription"}
          </p>
        </div>
        <button
          type="button"
          onClick={handleSignOut}
          className="flex w-full items-center gap-2.5 rounded-lg px-3 py-2 text-xs font-medium text-[#968E82] hover:bg-[#211E1A] hover:text-[#F5F2EB] cursor-pointer"
        >
          <LogOut className="h-4 w-4" />
          Sign Out
        </button>
      </div>
    </div>
  );

  return (
    <div className="flex min-h-screen bg-[#11100E]">
      {/* Desktop Sidebar */}
      <aside className="hidden w-64 shrink-0 border-r border-[#2B2722] lg:block">
        <div className="sticky top-0 h-screen">{sidebarContent}</div>
      </aside>

      {/* Mobile Drawer */}
      {drawerOpen ? (
        <div className="fixed inset-0 z-50 flex lg:hidden">
          <div
            className="fixed inset-0 bg-black/75"
            onClick={() => setDrawerOpen(false)}
          />
          <div className="relative z-10 w-64 border-r border-[#2B2722]">
            {sidebarContent}
          </div>
        </div>
      ) : null}

      {/* Main Content */}
      <div className="flex min-w-0 flex-1 flex-col">
        <header className="sticky top-0 z-30 flex h-16 items-center justify-between border-b border-[#2B2722] bg-[#11100E]/95 px-4 backdrop-blur-sm sm:px-6">
          <div className="flex items-center gap-3">
            <button
              type="button"
              className="rounded-lg p-2 text-[#B5AEA2] hover:bg-[#211E1A] lg:hidden"
              onClick={() => setDrawerOpen(true)}
              aria-label="Open menu"
            >
              <Menu className="h-5 w-5" />
            </button>
            <span className="text-sm font-medium text-[#F5F2EB]">{workspaceName}</span>
          </div>

          <div className="flex items-center gap-2.5">
            <Badge variant={intelligenceMode === "enhanced" ? "default" : "success"}>
              {intelligenceMode === "enhanced" ? "Enhanced AI Active" : "Native Engine Active"}
            </Badge>
            {trialStatus === "active" ? (
              <Link href="/dashboard/billing">
                <Badge variant={trialDaysRemaining <= 3 ? "warning" : "secondary"}>
                  {trialDaysRemaining}d trial left
                </Badge>
              </Link>
            ) : null}
          </div>
        </header>

        <main className="flex-1 p-4 sm:p-6 lg:p-8">{children}</main>
      </div>
    </div>
  );
}
