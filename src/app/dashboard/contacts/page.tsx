"use client";

import { useEffect, useState } from "react";
import { Loader2, Search, UserSquare2 } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import { formatRelativeTime } from "@/lib/utils";
import type { Contact } from "@/types/database";

export default function ContactsPage() {
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");

  useEffect(() => {
    fetch("/api/contacts")
      .then((r) => (r.ok ? r.json() : { contacts: [] }))
      .then((d) => setContacts(d.contacts ?? []))
      .finally(() => setLoading(false));
  }, []);

  const filtered = contacts.filter((c) => {
    const q = search.trim().toLowerCase();
    if (!q) return true;
    return (
      (c.full_name ?? "").toLowerCase().includes(q) ||
      (c.email ?? "").toLowerCase().includes(q) ||
      (c.phone ?? "").toLowerCase().includes(q)
    );
  });

  return (
    <div className="space-y-6">
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-white">Contacts</h1>
          <p className="mt-1 text-sm text-[#A3A3A3]">
            Customers who shared contact information during enquiries, with consent preferences.
          </p>
        </div>
        <div className="relative">
          <Search className="pointer-events-none absolute left-3 top-2.5 h-4 w-4 text-[#8F8F8F]" />
          <Input
            className="w-64 pl-9"
            placeholder="Search contacts..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
      </div>

      {loading ? (
        <div className="flex h-48 items-center justify-center text-[#A3A3A3]">
          <Loader2 className="h-5 w-5 animate-spin" />
        </div>
      ) : filtered.length === 0 ? (
        <EmptyState
          icon={<UserSquare2 className="h-6 w-6" />}
          title="No contacts captured yet"
          description="Harmek follows data minimization — contacts are stored only when visitors interact or voluntarily provide their details."
        />
      ) : (
        <div className="grid gap-4 md:grid-cols-2">
          {filtered.map((c) => (
            <Card key={c.id}>
              <CardContent className="p-5">
                <div className="flex items-start justify-between">
                  <div>
                    <h3 className="text-sm font-semibold text-white">
                      {c.full_name || "Anonymous Visitor"}
                    </h3>
                    <p className="mt-0.5 text-xs text-[#A3A3A3]">
                      {c.email || "No email provided"} &bull; {c.phone || "No phone provided"}
                    </p>
                  </div>
                  <Badge variant="secondary">
                    Last seen {formatRelativeTime(c.last_interaction_at)}
                  </Badge>
                </div>
                <div className="mt-3 flex flex-wrap gap-1.5">
                  {(c.tags ?? []).map((tag) => (
                    <Badge key={tag} variant="default">
                      {tag}
                    </Badge>
                  ))}
                  <Badge
                    variant={c.consent_preferences?.chat_persistence ? "success" : "outline"}
                  >
                    {c.consent_preferences?.chat_persistence
                      ? "Persistence Consent: Yes"
                      : "Session Only"}
                  </Badge>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
