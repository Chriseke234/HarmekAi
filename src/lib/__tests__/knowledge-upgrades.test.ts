import { describe, expect, it } from "vitest";
import {
  auditKnowledgeHealth,
  extractReadableTextFromHtml,
  parseCsvRecords,
  validatePublicUrl,
} from "@/lib/knowledge/importer";
import { matchWorkspaceKnowledge } from "@/lib/intelligence/native/knowledge-matcher";

describe("Knowledge Importer, SSRF Guard, CSV Parser & Health Auditor", () => {
  it("blocks private, loopback, and non-HTTP URLs (SSRF protection)", () => {
    expect(validatePublicUrl("http://localhost:3000/admin").ok).toBe(false);
    expect(validatePublicUrl("http://127.0.0.1/secret").ok).toBe(false);
    expect(validatePublicUrl("http://169.254.169.254/latest/meta-data").ok).toBe(false);
    expect(validatePublicUrl("http://192.168.1.5/internal").ok).toBe(false);
    expect(validatePublicUrl("file:///etc/passwd").ok).toBe(false);
    expect(validatePublicUrl("https://luminaskincare.com/faq").ok).toBe(true);
  });

  it("extracts clean readable text and title from raw HTML", () => {
    const html = `
      <html>
        <head><title>Lumina FAQ</title><style>.x{color:red}</style></head>
        <body>
          <nav>Home Pricing Login</nav>
          <main><h1>Shipping</h1><p>We ship within 24 hours &amp; offer tracking.</p></main>
          <script>alert("xss")</script>
        </body>
      </html>
    `;
    const out = extractReadableTextFromHtml(html);
    expect(out.title).toBe("Lumina FAQ");
    expect(out.text).toContain("We ship within 24 hours & offer tracking.");
    expect(out.text).not.toContain("alert");
    expect(out.text).not.toContain("Home Pricing Login");
  });

  it("parses RFC-4180 CSV rows with quoted commas accurately", () => {
    const csv = `name,price,category,description
"Vitamin C Serum, 30ml",38,Serums,"Brightening, gentle daily formula"
"Hydra Mist",24,Toners,"Soothing rosewater mist"`;

    const records = parseCsvRecords(csv);
    expect(records).toHaveLength(2);
    expect(records[0].name).toBe("Vitamin C Serum, 30ml");
    expect(records[0].description).toBe("Brightening, gentle daily formula");
    expect(records[1].price).toBe("24");
  });

  it("detects conflicting product prices, missing operating hours, and failed sources", () => {
    const report = auditKnowledgeHealth({
      businessProfile: null,
      products: [
        {
          id: "p1",
          workspace_id: "w1",
          name: "Vitamin C Serum",
          description: "A",
          price: 38,
          currency: "USD",
          category: "Serums",
          availability: "in_stock",
          sku: null,
          keywords: [],
          is_active: true,
          created_at: "",
          updated_at: "",
        },
        {
          id: "p2",
          workspace_id: "w1",
          name: "vitamin c serum",
          description: "B",
          price: 45,
          currency: "USD",
          category: "Serums",
          availability: "in_stock",
          sku: null,
          keywords: [],
          is_active: true,
          created_at: "",
          updated_at: "",
        },
      ],
      services: [],
      faqs: [],
      knowledgeSources: [
        {
          id: "s1",
          workspace_id: "w1",
          source_type: "url",
          title: "Broken Page",
          category: "Website",
          content: "",
          source_url: "https://example.com/404",
          content_hash: null,
          status: "failed",
          error_message: "HTTP 404",
          created_at: "",
          updated_at: "",
        },
      ],
    });

    expect(report.score).toBeLessThan(70);
    expect(report.issues.some((i) => i.category === "conflict")).toBe(true);
    expect(report.issues.some((i) => i.category === "indexing")).toBe(true);
  });

  it("retrieves deep matching paragraphs from knowledge_chunks beyond the first 600 chars", () => {
    const filler = "General company introduction text. ".repeat(40);
    const deepParagraph =
      "International wholesale orders over 50 units qualify for a dedicated freight rate to London and Toronto.";

    const matches = matchWorkspaceKnowledge("Do you have international wholesale freight to Toronto?", "delivery_info", {
      businessProfile: null,
      products: [],
      services: [],
      faqs: [],
      knowledgeSources: [
        {
          id: "doc-1",
          workspace_id: "w1",
          source_type: "document",
          title: "Wholesale Handbook",
          category: "Operations",
          content: `${filler}\n\n${deepParagraph}`,
          source_url: null,
          content_hash: "abc",
          status: "indexed",
          error_message: null,
          created_at: "",
          updated_at: "",
        },
      ],
      knowledgeChunks: [
        { id: "c0", source_id: "doc-1", chunk_index: 0, content: filler },
        { id: "c1", source_id: "doc-1", chunk_index: 1, content: deepParagraph },
      ],
    });

    expect(matches.length).toBeGreaterThan(0);
    expect(matches[0].answerText).toContain("Toronto");
    expect(matches[0].score).toBeGreaterThanOrEqual(0.6);
  });
});
