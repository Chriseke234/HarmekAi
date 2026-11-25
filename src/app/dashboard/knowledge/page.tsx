"use client";

import { useEffect, useState } from "react";
import {
  BookOpen,
  CheckCircle2,
  Loader2,
  Plus,
  Search,
  Trash2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import { formatCurrency } from "@/lib/utils";
import type { FaqItem, KnowledgeSource, Product, Service } from "@/types/database";

type TabKey = "products" | "services" | "faqs" | "sources";

export default function KnowledgeBasePage() {
  const [tab, setTab] = useState<TabKey>("products");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [notice, setNotice] = useState<string | null>(null);
  const [search, setSearch] = useState("");

  const [products, setProducts] = useState<Product[]>([]);
  const [services, setServices] = useState<Service[]>([]);
  const [faqs, setFaqs] = useState<FaqItem[]>([]);
  const [sources, setSources] = useState<KnowledgeSource[]>([]);

  // Form states
  const [name, setName] = useState("");
  const [price, setPrice] = useState("");
  const [description, setDescription] = useState("");
  const [category, setCategory] = useState("General");
  const [duration, setDuration] = useState("");
  const [faqQuestion, setFaqQuestion] = useState("");
  const [faqAnswer, setFaqAnswer] = useState("");
  const [sourceType, setSourceType] = useState<KnowledgeSource["source_type"]>("policy");
  const [sourceTitle, setSourceTitle] = useState("");
  const [sourceContent, setSourceContent] = useState("");

  // Knowledge tester
  const [testQuery, setTestQuery] = useState("");
  const [testReply, setTestReply] = useState<string | null>(null);
  const [testing, setTesting] = useState(false);

  async function loadAll() {
    setLoading(true);
    const res = await fetch("/api/knowledge");
    if (res.ok) {
      const data = await res.json();
      setProducts(data.products ?? []);
      setServices(data.services ?? []);
      setFaqs(data.faqs ?? []);
      setSources(data.sources ?? []);
    }
    setLoading(false);
  }

  useEffect(() => {
    loadAll();
  }, []);

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setNotice(null);

    let payload: Record<string, unknown> = {};
    if (tab === "products") {
      payload = {
        kind: "product",
        name,
        price: price ? Number(price) : null,
        description,
        category,
      };
    } else if (tab === "services") {
      payload = {
        kind: "service",
        name,
        price: price ? Number(price) : null,
        duration_label: duration || null,
        description,
        category,
      };
    } else if (tab === "faqs") {
      payload = {
        kind: "faq",
        question: faqQuestion,
        answer: faqAnswer,
        category,
      };
    } else {
      payload = {
        kind: "source",
        source_type: sourceType,
        title: sourceTitle,
        content: sourceContent,
        category,
      };
    }

    const res = await fetch("/api/knowledge", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    setSaving(false);

    if (res.ok) {
      setName("");
      setPrice("");
      setDescription("");
      setDuration("");
      setFaqQuestion("");
      setFaqAnswer("");
      setSourceTitle("");
      setSourceContent("");
      setNotice("Knowledge entry saved and indexed.");
      loadAll();
    } else {
      const err = (await res.json().catch(() => ({}))) as { error?: string };
      setNotice(err.error ?? "Failed to save knowledge item.");
    }
  }

  async function handleDelete(kind: string, id: string) {
    const res = await fetch(`/api/knowledge?kind=${kind}&id=${id}`, { method: "DELETE" });
    if (res.ok) loadAll();
  }

  async function runKnowledgeTest(e: React.FormEvent) {
    e.preventDefault();
    if (!testQuery.trim()) return;
    setTesting(true);
    const res = await fetch("/api/assistant/simulate", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ message: testQuery.trim() }),
    });
    setTesting(false);
    if (res.ok) {
      const data = await res.json();
      setTestReply(data.result?.reply ?? "No reply generated.");
    }
  }

  const q = search.trim().toLowerCase();

  return (
    <div className="space-y-6">
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-white">Knowledge Base</h1>
          <p className="mt-1 text-sm text-[#B5AEA2]">
            Your structured source of truth for Products, Services, FAQs, and Business Policies.
          </p>
        </div>
        <div className="relative">
          <Search className="pointer-events-none absolute left-3 top-2.5 h-4 w-4 text-[#968E82]" />
          <Input
            className="w-64 pl-9"
            placeholder="Filter knowledge..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
      </div>

      {/* Tabs */}
      <div className="flex flex-wrap gap-2">
        {(
          [
            ["products", `Products (${products.length})`],
            ["services", `Services (${services.length})`],
            ["faqs", `FAQs (${faqs.length})`],
            ["sources", `Policies & Docs (${sources.length})`],
          ] as Array<[TabKey, string]>
        ).map(([key, label]) => (
          <Button
            key={key}
            size="sm"
            variant={tab === key ? "default" : "secondary"}
            onClick={() => setTab(key)}
          >
            {label}
          </Button>
        ))}
      </div>

      {notice ? (
        <div className="flex items-center gap-2 rounded-lg border border-[#D97745]/40 bg-[#D97745]/10 px-4 py-2.5 text-sm text-[#F5F2EB]">
          <CheckCircle2 className="h-4 w-4 shrink-0" />
          <span>{notice}</span>
        </div>
      ) : null}

      <div className="grid gap-6 lg:grid-cols-12">
        {/* Add Form */}
        <Card className="lg:col-span-5">
          <CardHeader>
            <CardTitle className="text-base">
              Add{" "}
              {tab === "products"
                ? "Product"
                : tab === "services"
                  ? "Service"
                  : tab === "faqs"
                    ? "FAQ"
                    : "Policy or Document"}
            </CardTitle>
            <CardDescription>
              Indexed immediately for the Native Harmek Intelligence Engine.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleCreate} className="space-y-3">
              {tab === "products" || tab === "services" ? (
                <>
                  <Input
                    required
                    placeholder={tab === "products" ? "Product name" : "Service name"}
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                  />
                  <div className="grid gap-3 sm:grid-cols-2">
                    <Input
                      type="number"
                      step="0.01"
                      placeholder="Price (optional)"
                      value={price}
                      onChange={(e) => setPrice(e.target.value)}
                    />
                    <Input
                      placeholder="Category"
                      value={category}
                      onChange={(e) => setCategory(e.target.value)}
                    />
                  </div>
                  {tab === "services" ? (
                    <Input
                      placeholder="Duration (e.g. 45 mins)"
                      value={duration}
                      onChange={(e) => setDuration(e.target.value)}
                    />
                  ) : null}
                  <Textarea
                    placeholder="Verified description..."
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                  />
                </>
              ) : null}

              {tab === "faqs" ? (
                <>
                  <Input
                    required
                    placeholder="Customer question"
                    value={faqQuestion}
                    onChange={(e) => setFaqQuestion(e.target.value)}
                  />
                  <Textarea
                    required
                    placeholder="Verified answer..."
                    value={faqAnswer}
                    onChange={(e) => setFaqAnswer(e.target.value)}
                  />
                  <Input
                    placeholder="Category"
                    value={category}
                    onChange={(e) => setCategory(e.target.value)}
                  />
                </>
              ) : null}

              {tab === "sources" ? (
                <>
                  <Select
                    value={sourceType}
                    onChange={(e) =>
                      setSourceType(e.target.value as KnowledgeSource["source_type"])
                    }
                  >
                    <option value="policy">Business Policy</option>
                    <option value="delivery">Delivery Information</option>
                    <option value="booking">Booking Information</option>
                    <option value="business_info">General Business Info</option>
                    <option value="document">Uploaded Text Document</option>
                  </Select>
                  <Input
                    required
                    placeholder="Document title"
                    value={sourceTitle}
                    onChange={(e) => setSourceTitle(e.target.value)}
                  />
                  <Textarea
                    required
                    className="min-h-[140px]"
                    placeholder="Paste verified policy or document text..."
                    value={sourceContent}
                    onChange={(e) => setSourceContent(e.target.value)}
                  />
                </>
              ) : null}

              <Button type="submit" className="w-full" disabled={saving}>
                {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4" />}
                Save to Knowledge Base
              </Button>
            </form>

            {/* Quick Knowledge Tester */}
            <div className="mt-6 border-t border-[#2B2722] pt-5">
              <h4 className="text-xs font-semibold uppercase tracking-wider text-[#B5AEA2]">
                Test Knowledge Retrieval
              </h4>
              <form onSubmit={runKnowledgeTest} className="mt-2 flex gap-2">
                <Input
                  placeholder="Ask a sample question..."
                  value={testQuery}
                  onChange={(e) => setTestQuery(e.target.value)}
                />
                <Button type="submit" size="sm" variant="secondary" disabled={testing}>
                  {testing ? <Loader2 className="h-4 w-4 animate-spin" /> : "Test"}
                </Button>
              </form>
              {testReply ? (
                <div className="mt-3 rounded-lg border border-[#2B2722] bg-[#141210] p-3 text-xs leading-relaxed text-[#F5F2EB]">
                  {testReply}
                </div>
              ) : null}
            </div>
          </CardContent>
        </Card>

        {/* Items List */}
        <div className="space-y-3 lg:col-span-7">
          {loading ? (
            <div className="flex h-48 items-center justify-center text-[#B5AEA2]">
              <Loader2 className="h-5 w-5 animate-spin" />
            </div>
          ) : (
            <>
              {tab === "products" ? (
                products.filter((p) => p.name.toLowerCase().includes(q)).length === 0 ? (
                  <EmptyState
                    icon={<BookOpen className="h-5 w-5" />}
                    title="No products added yet"
                    description="Add products with verified prices so Harmek can answer pricing and availability questions accurately."
                  />
                ) : (
                  products
                    .filter((p) => p.name.toLowerCase().includes(q))
                    .map((p) => (
                      <Card key={p.id}>
                        <CardContent className="flex items-start justify-between gap-4 p-4">
                          <div>
                            <div className="flex items-center gap-2">
                              <h3 className="text-sm font-semibold text-white">{p.name}</h3>
                              <Badge variant="secondary">{p.category}</Badge>
                              <Badge variant="success">
                                {formatCurrency(p.price, p.currency)}
                              </Badge>
                            </div>
                            <p className="mt-1 text-xs text-[#B5AEA2]">
                              {p.description || "No description provided."}
                            </p>
                          </div>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleDelete("product", p.id)}
                            aria-label="Delete product"
                          >
                            <Trash2 className="h-4 w-4 text-[#B5AEA2] hover:text-rose-400" />
                          </Button>
                        </CardContent>
                      </Card>
                    ))
                )
              ) : null}

              {tab === "services" ? (
                services.filter((s) => s.name.toLowerCase().includes(q)).length === 0 ? (
                  <EmptyState
                    icon={<BookOpen className="h-5 w-5" />}
                    title="No services added yet"
                    description="Add services, durations, and pricing to guide customer enquiries."
                  />
                ) : (
                  services
                    .filter((s) => s.name.toLowerCase().includes(q))
                    .map((s) => (
                      <Card key={s.id}>
                        <CardContent className="flex items-start justify-between gap-4 p-4">
                          <div>
                            <div className="flex items-center gap-2">
                              <h3 className="text-sm font-semibold text-white">{s.name}</h3>
                              {s.duration_label ? (
                                <Badge variant="secondary">{s.duration_label}</Badge>
                              ) : null}
                              <Badge variant="success">
                                {formatCurrency(s.price, s.currency)}
                              </Badge>
                            </div>
                            <p className="mt-1 text-xs text-[#B5AEA2]">{s.description}</p>
                          </div>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleDelete("service", s.id)}
                            aria-label="Delete service"
                          >
                            <Trash2 className="h-4 w-4 text-[#B5AEA2] hover:text-rose-400" />
                          </Button>
                        </CardContent>
                      </Card>
                    ))
                )
              ) : null}

              {tab === "faqs" ? (
                faqs.filter((f) => f.question.toLowerCase().includes(q)).length === 0 ? (
                  <EmptyState
                    icon={<BookOpen className="h-5 w-5" />}
                    title="No FAQs added yet"
                    description="Add frequently asked customer questions and verified answers."
                  />
                ) : (
                  faqs
                    .filter((f) => f.question.toLowerCase().includes(q))
                    .map((f) => (
                      <Card key={f.id}>
                        <CardContent className="flex items-start justify-between gap-4 p-4">
                          <div>
                            <h3 className="text-sm font-semibold text-white">{f.question}</h3>
                            <p className="mt-1 text-xs leading-relaxed text-[#D6D0C4]">
                              {f.answer}
                            </p>
                          </div>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleDelete("faq", f.id)}
                            aria-label="Delete FAQ"
                          >
                            <Trash2 className="h-4 w-4 text-[#B5AEA2] hover:text-rose-400" />
                          </Button>
                        </CardContent>
                      </Card>
                    ))
                )
              ) : null}

              {tab === "sources" ? (
                sources.filter((s) => s.title.toLowerCase().includes(q)).length === 0 ? (
                  <EmptyState
                    icon={<BookOpen className="h-5 w-5" />}
                    title="No policy documents yet"
                    description="Add delivery rules, return policies, or text documents. Duplicate content is automatically detected."
                  />
                ) : (
                  sources
                    .filter((s) => s.title.toLowerCase().includes(q))
                    .map((s) => (
                      <Card key={s.id}>
                        <CardContent className="flex items-start justify-between gap-4 p-4">
                          <div>
                            <div className="flex items-center gap-2">
                              <h3 className="text-sm font-semibold text-white">{s.title}</h3>
                              <Badge variant="secondary">{s.source_type}</Badge>
                              <Badge variant={s.status === "indexed" ? "success" : "warning"}>
                                {s.status}
                              </Badge>
                            </div>
                            <p className="mt-1 line-clamp-3 text-xs text-[#B5AEA2]">{s.content}</p>
                          </div>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleDelete("source", s.id)}
                            aria-label="Delete source"
                          >
                            <Trash2 className="h-4 w-4 text-[#B5AEA2] hover:text-rose-400" />
                          </Button>
                        </CardContent>
                      </Card>
                    ))
                )
              ) : null}
            </>
          )}
        </div>
      </div>
    </div>
  );
}
