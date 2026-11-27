"use client";

import { useEffect, useState } from "react";
import { Loader2, Mail, UserPlus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

interface MemberRow {
  id: string;
  role: "owner" | "admin" | "agent";
  profiles?: { full_name?: string; email?: string } | null;
}

interface InviteRow {
  id: string;
  email: string;
  role: string;
  status: string;
}

export default function TeamPage() {
  const [members, setMembers] = useState<MemberRow[]>([]);
  const [invitations, setInvitations] = useState<InviteRow[]>([]);
  const [currentRole, setCurrentRole] = useState<string>("agent");
  const [loading, setLoading] = useState(true);

  const [inviteEmail, setInviteEmail] = useState("");
  const [inviteRole, setInviteRole] = useState<"admin" | "agent">("agent");
  const [sending, setSending] = useState(false);
  const [notice, setNotice] = useState<string | null>(null);

  async function loadTeam() {
    setLoading(true);
    const res = await fetch("/api/team");
    if (res.ok) {
      const d = await res.json();
      setMembers(d.members ?? []);
      setInvitations(d.invitations ?? []);
      setCurrentRole(d.currentRole ?? "agent");
    }
    setLoading(false);
  }

  useEffect(() => {
    loadTeam();
  }, []);

  async function handleInvite(e: React.FormEvent) {
    e.preventDefault();
    setSending(true);
    setNotice(null);
    const res = await fetch("/api/team", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email: inviteEmail.trim(), role: inviteRole }),
    });
    setSending(false);
    if (res.ok) {
      setInviteEmail("");
      setNotice("Team invitation created.");
      loadTeam();
    } else {
      const err = (await res.json().catch(() => ({}))) as { error?: string };
      setNotice(err.error ?? "Failed to create invitation.");
    }
  }

  if (loading) {
    return (
      <div className="flex h-48 items-center justify-center text-[#A3A3A3]">
        <Loader2 className="h-5 w-5 animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-white">Team</h1>
        <p className="mt-1 text-sm text-[#A3A3A3]">
          Manage workspace members and role-based permissions (Owner, Administrator, Agent).
        </p>
      </div>

      {currentRole === "owner" || currentRole === "admin" ? (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Invite Team Member</CardTitle>
            <CardDescription>
              Agents can handle conversations and contacts. Administrators can also configure
              knowledge, automations, and assistant settings.
            </CardDescription>
          </CardHeader>
          <CardContent>
            {notice ? (
              <p className="mb-3 text-xs text-[#E5E5E5]">{notice}</p>
            ) : null}
            <form onSubmit={handleInvite} className="flex flex-col gap-3 sm:flex-row">
              <Input
                type="email"
                required
                placeholder="teammate@yourbusiness.com"
                value={inviteEmail}
                onChange={(e) => setInviteEmail(e.target.value)}
              />
              <Select
                className="sm:w-44"
                value={inviteRole}
                onChange={(e) => setInviteRole(e.target.value as "admin" | "agent")}
              >
                <option value="agent">Agent</option>
                <option value="admin">Administrator</option>
              </Select>
              <Button type="submit" disabled={sending}>
                <UserPlus className="h-4 w-4" />
                Invite
              </Button>
            </form>
          </CardContent>
        </Card>
      ) : null}

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Workspace Members ({members.length})</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2.5">
          {members.map((m) => (
            <div
              key={m.id}
              className="flex items-center justify-between rounded-lg border border-[#262626] bg-[#0E0E0E] px-4 py-3"
            >
              <div>
                <p className="text-sm font-medium text-white">
                  {m.profiles?.full_name || "Team Member"}
                </p>
                <p className="text-xs text-[#A3A3A3]">{m.profiles?.email}</p>
              </div>
              <Badge variant={m.role === "owner" ? "default" : "secondary"}>{m.role}</Badge>
            </div>
          ))}
        </CardContent>
      </Card>

      {invitations.length > 0 ? (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Pending Invitations</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {invitations.map((inv) => (
              <div
                key={inv.id}
                className="flex items-center justify-between rounded-lg border border-[#262626] bg-[#0E0E0E] px-4 py-2.5 text-sm"
              >
                <span className="flex items-center gap-2 text-[#FAFAFA]">
                  <Mail className="h-4 w-4 text-[#8F8F8F]" />
                  {inv.email}
                </span>
                <Badge variant="warning">{inv.role} (pending)</Badge>
              </div>
            ))}
          </CardContent>
        </Card>
      ) : null}
    </div>
  );
}
