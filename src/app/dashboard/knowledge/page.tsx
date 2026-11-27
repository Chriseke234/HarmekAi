"use client";

import { useEffect, useState } from "react";
import {
  AlertTriangle,
  BookOpen,
  CheckCircle2,
  FileUp,
  Globe,
  Loader2,
  Pencil,
  Plus,
  Search,
  ShieldCheck,
  Trash2,
  X,
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
import type { KnowledgeHealthReport } from "@/lib/knowledge/importer";

type TabKey = "products" | "services" | "faqs" | "sources" | "import";

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
  const [health, setHealth] = useState<KnowledgeHealthReport | null>(null);

  // Add Form states
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

  // Inline Edit state
  const [editing, setEditing] = useState<{
    kind: "product" | "service" | "faq" | "source";
    id: string;
    fields: Record<string, string>;
  } | null>(null);

  // URL & File/CSV Import states
  const [importUrl, setImportUrl] = useState("");
  const [csvTarget, setCsvTarget] = useState<"csv_products" | "csv_faqs">("csv_products");
  const [csvText, setCsvText] = useState("");
  const [importing, setImporting] = useState(false);

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
      setHealth(data.health ?? null);
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

  async function handleSaveEdit(e: React.FormEvent) {
    e.preventDefault();
    if (!editing) return;
    setSaving(true);
    setNotice(null);
    const res = await fetch("/api/knowledge", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        kind: editing.kind,
        id: editing.id,
        ...editing.fields,
      }),
    });
    setSaving(false);
    if (res.ok) {
      setEditing(null);
      setNotice("Knowledge entry updated and re-indexed.");
      loadAll();
    } else {
      const err = (await res.json().catch(() => ({}))) as { error?: string };
      setNotice(err.error ?? "Update failed.");
    }
  }

  async function handleDelete(kind: string, id: string) {
    const res = await fetch(`/api/knowledge?kind=${kind}&id=${id}`, { method: "DELETE" });
    if (res.ok) loadAll();
  }

  async function handleUrlImport(e: React.FormEvent) {
    e.preventDefault();
    if (!importUrl.trim()) return;
    setImporting(true);
    setNotice(null);
    const res = await fetch("/api/knowledge/import", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ mode: "url", url: importUrl.trim() }),
    });
    setImporting(false);
    const data = await res.json().catch(() => ({}));
    setNotice(data.message ?? data.error ?? "URL import finished.");
    if (res.ok) {
      setImportUrl("");
      loadAll();
    }
  }

  async function handleCsvImport(e: React.FormEvent) {
    e.preventDefault();
    if (!csvText.trim()) return;
    setImporting(true);
    setNotice(null);
    const res = await fetch("/api/knowledge/import", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ mode: csvTarget, csvText }),
    });
    setImporting(false);
    const data = await res.json().catch(() => ({}));
    setNotice(data.message ?? data.error ?? "CSV import finished.");
    if (res.ok) {
      setCsvText("");
      loadAll();
    }
  }

  async function handleFileUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    const text = await file.text();
    const ext = file.name.split(".").pop()?.toLowerCase();

    if (ext === "csv") {
      setCsvText(text);
      setNotice(`Loaded "${file.name}" into CSV importer. Click Import CSV to save.`);
      return;
    }

    setImporting(true);
    setNotice(null);
    const res = await fetch("/api/knowledge/import", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        mode: "file_document",
        title: file.name,
        content: text,
      }),
    });
    setImporting(false);
    const data = await res.json().catch(() => ({}));
    setNotice(data.message ?? data.error ?? "File uploaded.");
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
          <h1 className="font-display text-3xl font-normal text-[#FAFAFA]">Knowledge Base</h1>
          <p className="mt-1 text-sm text-[#A3A3A3]">
            Structured Products, Services, FAQs, Policies, Website URLs, and Bulk CSV Imports.
          </p>
        </div>
        <div className="relative">
          <Search className="pointer-events-none absolute left-3 top-2.5 h-4 w-4 text-[#8F8F8F]" />
          <Input
            className="w-64 pl-9"
            placeholder="Filter knowledge..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
      </div>

      {/* Knowledge Health Audit Banner */}
      {health ? (
        <Card className="border-[#262626]">
          <CardContent className="p-5">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg border border-[#262626] bg-[#1C1C1C] text-[#D4D4D4]">
                  <ShieldCheck className="h-5 w-5" />
                </div>
                <div>
                  <p className="text-sm font-semibold text-[#FAFAFA]">
                    Knowledge Health Score:{" "}
                    <span className="font-mono text-[#FFFFFF]">{health.score}/100</span>
                  </p>
                  <p className="text-xs text-[#A3A3A3]">
                    {health.totalEntries} indexed entries &bull; {health.issues.length} item
                    {health.issues.length === 1 ? "" : "s"} to review
                  </p>
                </div>
              </div>
              <Badge variant={health.issues.length === 0 ? "success" : "warning"}>
                {health.issues.length === 0 ? "Healthy & Grounded" : "Review Suggested"}
              </Badge>
            </div>
            {health.issues.length > 0 ? (
              <div className="mt-4 space-y-1.5 border-t border-[#262626] pt-3">
                {health.issues.map((iss, idx) => (
                  <div
                    key={idx}
                    className="flex items-start gap-2 text-xs text-[#D4D4D4]"
                  >
                    <AlertTriangle
                      className={`mt-0.5 h-3.5 w-3.5 shrink-0 ${
                        iss.severity === "error"
                          ? "text-[#EB9494]"
                          : iss.severity === "warning"
                            ? "text-[#ECC28A]"
                            : "text-[#D4D4D4]"
                      }`}
                    />
                    <span>{iss.message}</span>
                  </div>
                ))}
              </div>
            ) : null}
          </CardContent>
        </Card>
      ) : null}

      {/* Tabs */}
      <div className="flex flex-wrap gap-2">
        {(
          [
            ["products", `Products (${products.length})`],
            ["services", `Services (${services.length})`],
            ["faqs", `FAQs (${faqs.length})`],
            ["sources", `Policies & Docs (${sources.length})`],
            ["import", "URL & File Import"],
          ] as Array<[TabKey, string]>
        ).map(([key, label]) => (
          <Button
            key={key}
            size="sm"
            variant={tab === key ? "default" : "secondary"}
            onClick={() => {
              setTab(key);
              setEditing(null);
            }}
          >
            {label}
          </Button>
        ))}
      </div>

      {notice ? (
        <div className="flex items-center gap-2 rounded-lg border border-[#FFFFFF]/40 bg-[#FFFFFF]/10 px-4 py-2.5 text-sm text-[#FAFAFA]">
          <CheckCircle2 className="h-4 w-4 shrink-0 text-[#FFFFFF]" />
          <span>{notice}</span>
        </div>
      ) : null}

      {/* URL & FILE / CSV IMPORT TAB */}
      {tab === "import" ? (
        <div className="grid gap-6 lg:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base">
                <Globe className="h-4 w-4 text-[#FFFFFF]" />
                Import from Website URL
              </CardTitle>
              <CardDescription>
                Paste any public business webpage (About, FAQ, Delivery, or Pricing page).
                Harmek extracts clean text, splits it into searchable chunks, and indexes it
                safely.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleUrlImport} className="space-y-3">
                <Input
                  type="url"
                  required
                  placeholder="https://yourbusiness.com/faq"
                  value={importUrl}
                  onChange={(e) => setImportUrl(e.target.value)}
                />
                <Button type="submit" className="w-full" disabled={importing}>
                  {importing ? <Loader2 className="h-4 w-4 animate-spin" /> : <Globe className="h-4 w-4" />}
                  Fetch &amp; Index Webpage
                </Button>
              </form>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base">
                <FileUp className="h-4 w-4 text-[#D4D4D4]" />
                Upload File (.txt, .md, .json) or Bulk CSV
              </CardTitle>
              <CardDescription>
                Upload a business handbook or bulk-import Products / FAQs from a spreadsheet.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="rounded-lg border border-dashed border-[#383838] bg-[#0E0E0E] p-4">
                <label className="block text-xs font-medium text-[#D4D4D4]">
                  Choose a `.csv`, `.txt`, `.md`, or `.json` file
                </label>
                <input
                  type="file"
                  accept=".csv,.txt,.md,.json"
                  onChange={handleFileUpload}
                  className="mt-2 block w-full text-xs text-[#A3A3A3] file:mr-3 file:rounded-md file:border-0 file:bg-[#1C1C1C] file:px-3 file:py-1.5 file:text-xs file:font-medium file:text-[#FAFAFA] hover:file:bg-[#262626]"
                />
              </div>

              <form onSubmit={handleCsvImport} className="space-y-3 border-t border-[#262626] pt-4">
                <Select
                  value={csvTarget}
                  onChange={(e) =>
                    setCsvTarget(e.target.value as "csv_products" | "csv_faqs")
                  }
                >
                  <option value="csv_products">
                    Bulk Import Products (headers: name,price,category,description)
                  </option>
                  <option value="csv_faqs">
                    Bulk Import FAQs (headers: question,answer,category)
                  </option>
                </Select>
                <Textarea
                  className="min-h-[120px] font-mono text-xs"
                  placeholder={
                    csvTarget === "csv_products"
                      ? "name,price,category,description\nVitamin C Serum,38,Serums,Brightening botanical serum"
                      : "question,answer,category\nDo you deliver on Sundays?,Yes between 12 PM and 5 PM,Delivery"
                  }
                  value={csvText}
                  onChange={(e) => setCsvText(e.target.value)}
                />
                <Button type="submit" variant="secondary" className="w-full" disabled={importing}>
                  {importing ? <Loader2 className="h-4 w-4 animate-spin" /> : <FileUp className="h-4 w-4" />}
                  Import CSV Rows
                </Button>
              </form>
            </CardContent>
          </Card>
        </div>
      ) : (
        <div className="grid gap-6 lg:grid-cols-12">
          {/* Left Column: Add or Edit Form */}
          <Card className="lg:col-span-5">
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="text-base">
                  {editing
                    ? `Edit ${editing.kind}`
                    : `Add ${
                        tab === "products"
                          ? "Product"
                          : tab === "services"
                            ? "Service"
                            : tab === "faqs"
                              ? "FAQ"
                              : "Policy or Document"
                      }`}
                </CardTitle>
                {editing ? (
                  <Button variant="ghost" size="icon" onClick={() => setEditing(null)}>
                    <X className="h-4 w-4" />
                  </Button>
                ) : null}
              </div>
              <CardDescription>
                Indexed immediately for Deep Chunk-Level BM25 Retrieval.
              </CardDescription>
            </CardHeader>
            <CardContent>
              {editing ? (
                <form onSubmit={handleSaveEdit} className="space-y-3">
                  {editing.kind === "product" || editing.kind === "service" ? (
                    <>
                      <Input
                        required
                        value={editing.fields.name ?? ""}
                        onChange={(e) =>
                          setEditing({
                            ...editing,
                            fields: { ...editing.fields, name: e.target.value },
                          })
                        }
                        placeholder="Name"
                      />
                      <div className="grid gap-3 sm:grid-cols-2">
                        <Input
                          type="number"
                          step="0.01"
                          value={editing.fields.price ?? ""}
                          onChange={(e) =>
                            setEditing({
                              ...editing,
                              fields: { ...editing.fields, price: e.target.value },
                            })
                          }
                          placeholder="Price"
                        />
                        <Input
                          value={editing.fields.category ?? ""}
                          onChange={(e) =>
                            setEditing({
                              ...editing,
                              fields: { ...editing.fields, category: e.target.value },
                            })
                          }
                          placeholder="Category"
                        />
                      </div>
                      <Textarea
                        value={editing.fields.description ?? ""}
                        onChange={(e) =>
                          setEditing({
                            ...editing,
                            fields: { ...editing.fields, description: e.target.value },
                          })
                        }
                        placeholder="Description"
                      />
                    </>
                  ) : null}

                  {editing.kind === "faq" ? (
                    <>
                      <Input
                        required
                        value={editing.fields.question ?? ""}
                        onChange={(e) =>
                          setEditing({
                            ...editing,
                            fields: { ...editing.fields, question: e.target.value },
                          })
                        }
                      />
                      <Textarea
                        required
                        value={editing.fields.answer ?? ""}
                        onChange={(e) =>
                          setEditing({
                            ...editing,
                            fields: { ...editing.fields, answer: e.target.value },
                          })
                        }
                      />
                    </>
                  ) : null}

                  {editing.kind === "source" ? (
                    <>
                      <Input
                        required
                        value={editing.fields.title ?? ""}
                        onChange={(e) =>
                          setEditing({
                            ...editing,
                            fields: { ...editing.fields, title: e.target.value },
                          })
                        }
                      />
                      <Textarea
                        required
                        className="min-h-[140px]"
                        value={editing.fields.content ?? ""}
                        onChange={(e) =>
                          setEditing({
                            ...editing,
                            fields: { ...editing.fields, content: e.target.value },
                          })
                        }
                      />
                    </>
                  ) : null}

                  <Button type="submit" className="w-full" disabled={saving}>
                    {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : "Save Changes"}
                  </Button>
                </form>
              ) : (
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
              )}

              {/* Quick Knowledge Tester */}
              <div className="mt-6 border-t border-[#262626] pt-5">
                <h4 className="text-xs font-semibold uppercase tracking-wider text-[#A3A3A3]">
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
                  <div className="mt-3 rounded-lg border border-[#262626] bg-[#0E0E0E] p-3 text-xs leading-relaxed text-[#FAFAFA]">
                    {testReply}
                  </div>
                ) : null}
              </div>
            </CardContent>
          </Card>

          {/* Right Column: Items List */}
          <div className="space-y-3 lg:col-span-7">
            {loading ? (
              <div className="flex h-48 items-center justify-center text-[#A3A3A3]">
                <Loader2 className="h-5 w-5 animate-spin" />
              </div>
            ) : (
              <>
                {tab === "products" ? (
                  products.filter((p) => p.name.toLowerCase().includes(q)).length === 0 ? (
                    <EmptyState
                      icon={<BookOpen className="h-3.5 w-3.5" />}
                      title="No products added yet"
                      description="Add products manually or bulk-import them via CSV in the URL & File Import tab."
                    />
                  ) : (
                    products
                      .filter((p) => p.name.toLowerCase().includes(q))
                      .map((p) => (
                        <Card key={p.id}>
                          <CardContent className="flex items-start justify-between gap-4 p-4">
                            <div>
                              <div className="flex flex-wrap items-center gap-2">
                                <h3 className="text-sm font-semibold text-[#FAFAFA]">{p.name}</h3>
                                <Badge variant="secondary">{p.category}</Badge>
                                <Badge variant="success">
                                  {formatCurrency(p.price, p.currency)}
                                </Badge>
                              </div>
                              <p className="mt-1 text-xs text-[#A3A3A3]">
                                {p.description || "No description provided."}
                              </p>
                            </div>
                            <div className="flex shrink-0 items-center gap-1">
                              <Button
                                variant="ghost"
                                size="icon"
                                onClick={() =>
                                  setEditing({
                                    kind: "product",
                                    id: p.id,
                                    fields: {
                                      name: p.name,
                                      price: p.price !== null ? String(p.price) : "",
                                      category: p.category,
                                      description: p.description,
                                    },
                                  })
                                }
                                aria-label="Edit product"
                              >
                                <Pencil className="h-4 w-4 text-[#A3A3A3]" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => handleDelete("product", p.id)}
                                aria-label="Delete product"
                              >
                                <Trash2 className="h-4 w-4 text-[#A3A3A3] hover:text-rose-400" />
                              </Button>
                            </div>
                          </CardContent>
                        </Card>
                      ))
                  )
                ) : null}

                {tab === "services" ? (
                  services.filter((s) => s.name.toLowerCase().includes(q)).length === 0 ? (
                    <EmptyState
                      icon={<BookOpen className="h-3.5 w-3.5" />}
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
                              <div className="flex flex-wrap items-center gap-2">
                                <h3 className="text-sm font-semibold text-[#FAFAFA]">{s.name}</h3>
                                {s.duration_label ? (
                                  <Badge variant="secondary">{s.duration_label}</Badge>
                                ) : null}
                                <Badge variant="success">
                                  {formatCurrency(s.price, s.currency)}
                                </Badge>
                              </div>
                              <p className="mt-1 text-xs text-[#A3A3A3]">{s.description}</p>
                            </div>
                            <div className="flex shrink-0 items-center gap-1">
                              <Button
                                variant="ghost"
                                size="icon"
                                onClick={() =>
                                  setEditing({
                                    kind: "service",
                                    id: s.id,
                                    fields: {
                                      name: s.name,
                                      price: s.price !== null ? String(s.price) : "",
                                      category: s.category,
                                      description: s.description,
                                    },
                                  })
                                }
                                aria-label="Edit service"
                              >
                                <Pencil className="h-4 w-4 text-[#A3A3A3]" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => handleDelete("service", s.id)}
                                aria-label="Delete service"
                              >
                                <Trash2 className="h-4 w-4 text-[#A3A3A3] hover:text-rose-400" />
                              </Button>
                            </div>
                          </CardContent>
                        </Card>
                      ))
                  )
                ) : null}

                {tab === "faqs" ? (
                  faqs.filter((f) => f.question.toLowerCase().includes(q)).length === 0 ? (
                    <EmptyState
                      icon={<BookOpen className="h-3.5 w-3.5" />}
                      title="No FAQs added yet"
                      description="Add frequently asked questions manually or bulk-import via CSV."
                    />
                  ) : (
                    faqs
                      .filter((f) => f.question.toLowerCase().includes(q))
                      .map((f) => (
                        <Card key={f.id}>
                          <CardContent className="flex items-start justify-between gap-4 p-4">
                            <div>
                              <h3 className="text-sm font-semibold text-[#FAFAFA]">
                                {f.question}
                              </h3>
                              <p className="mt-1 text-xs leading-relaxed text-[#D4D4D4]">
                                {f.answer}
                              </p>
                            </div>
                            <div className="flex shrink-0 items-center gap-1">
                              <Button
                                variant="ghost"
                                size="icon"
                                onClick={() =>
                                  setEditing({
                                    kind: "faq",
                                    id: f.id,
                                    fields: {
                                      question: f.question,
                                      answer: f.answer,
                                      category: f.category,
                                    },
                                  })
                                }
                                aria-label="Edit FAQ"
                              >
                                <Pencil className="h-4 w-4 text-[#A3A3A3]" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => handleDelete("faq", f.id)}
                                aria-label="Delete FAQ"
                              >
                                <Trash2 className="h-4 w-4 text-[#A3A3A3] hover:text-rose-400" />
                              </Button>
                            </div>
                          </CardContent>
                        </Card>
                      ))
                  )
                ) : null}

                {tab === "sources" ? (
                  sources.filter((s) => s.title.toLowerCase().includes(q)).length === 0 ? (
                    <EmptyState
                      icon={<BookOpen className="h-3.5 w-3.5" />}
                      title="No policy documents or webpages yet"
                      description="Add policies manually, upload .txt/.md files, or import a public website URL."
                    />
                  ) : (
                    sources
                      .filter((s) => s.title.toLowerCase().includes(q))
                      .map((s) => (
                        <Card key={s.id}>
                          <CardContent className="flex items-start justify-between gap-4 p-4">
                            <div>
                              <div className="flex flex-wrap items-center gap-2">
                                <h3 className="text-sm font-semibold text-[#FAFAFA]">
                                  {s.title}
                                </h3>
                                <Badge variant="secondary">{s.source_type}</Badge>
                                <Badge
                                  variant={
                                    s.status === "indexed"
                                      ? "success"
                                      : s.status === "failed"
                                        ? "destructive"
                                        : "warning"
                                  }
                                >
                                  {s.status}
                                </Badge>
                              </div>
                              <p className="mt-1 line-clamp-3 text-xs text-[#A3A3A3]">
                                {s.status === "failed" && s.error_message
                                  ? `Failed: ${s.error_message}`
                                  : s.content}
                              </p>
                            </div>
                            <div className="flex shrink-0 items-center gap-1">
                              <Button
                                variant="ghost"
                                size="icon"
                                onClick={() =>
                                  setEditing({
                                    kind: "source",
                                    id: s.id,
                                    fields: {
                                      title: s.title,
                                      content: s.content,
                                    },
                                  })
                                }
                                aria-label="Edit source"
                              >
                                <Pencil className="h-4 w-4 text-[#A3A3A3]" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => handleDelete("source", s.id)}
                                aria-label="Delete source"
                              >
                                <Trash2 className="h-4 w-4 text-[#A3A3A3] hover:text-rose-400" />
                              </Button>
                            </div>
                          </CardContent>
                        </Card>
                      ))
                  )
                ) : null}
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
