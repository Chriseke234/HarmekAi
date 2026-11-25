import { describe, expect, it } from "vitest";
import {
  buildTrialPerformanceReport,
  createTrialActivationWindow,
  evaluateTrialStatus,
} from "@/lib/billing/trial";
import { decryptSecret, encryptSecret, maskSecret } from "@/lib/security/crypto";
import { hasRequiredRole } from "@/lib/security/auth";
import { checkRateLimit, resetRateLimiterForTests } from "@/lib/security/rate-limit";
import { chunkKnowledgeText, computeContentHash } from "@/lib/knowledge/service";

describe("14-Day Trial & Performance Reporting", () => {
  it("keeps trial unstarted until assistant activation", () => {
    const status = evaluateTrialStatus({
      status: "not_started",
      duration_days: 14,
      activated_at: null,
      expires_at: null,
      conversation_limit: 500,
      message_limit: 2500,
    });

    expect(status.isActivated).toBe(false);
    expect(status.isExpired).toBe(false);
    expect(status.daysRemaining).toBe(14);
  });

  it("calculates remaining days and expiration accurately from activation timestamp", () => {
    const activationTime = new Date("2026-11-01T10:00:00Z");
    const window = createTrialActivationWindow(14, activationTime);

    const day12 = evaluateTrialStatus(
      {
        ...window,
        duration_days: 14,
        conversation_limit: 500,
        message_limit: 2500,
      },
      new Date("2026-11-13T10:00:00Z")
    );
    expect(day12.daysRemaining).toBe(2);
    expect(day12.expiringSoon).toBe(true);
    expect(day12.isExpired).toBe(false);

    const day15 = evaluateTrialStatus(
      {
        ...window,
        duration_days: 14,
        conversation_limit: 500,
        message_limit: 2500,
      },
      new Date("2026-11-16T10:00:00Z")
    );
    expect(day15.isExpired).toBe(true);
    expect(day15.status).toBe("expired");
    expect(day15.daysRemaining).toBe(0);
  });

  it("flags insufficient data honestly instead of fabricating report figures", () => {
    const report = buildTrialPerformanceReport({
      totalConversations: 0,
      aiHandledConversations: 0,
      humanEscalations: 0,
      resolvedConversations: 0,
      leadsCaptured: 0,
      unansweredQuestions: [],
      avgFirstResponseMs: null,
      nativeMessagesUsed: 0,
      enhancedMessagesUsed: 0,
      conversationLimit: 500,
      messageLimit: 2500,
      commonIntents: [],
    });

    expect(report.hasSufficientData).toBe(false);
    expect(report.insufficientDataMessage).toBeTruthy();
  });
});

describe("Security, Encryption, RBAC, Rate Limiting & Knowledge Hashing", () => {
  it("encrypts and decrypts optional LLM API keys cleanly with AES-256-GCM", () => {
    const raw = "sk-live-secret-api-key-987654";
    const encrypted = encryptSecret(raw);
    expect(encrypted).not.toContain(raw);
    expect(decryptSecret(encrypted)).toBe(raw);
    expect(maskSecret(raw)).toBe("7654");
  });

  it("enforces workspace role permissions accurately", () => {
    expect(hasRequiredRole("owner", ["owner", "admin"])).toBe(true);
    expect(hasRequiredRole("agent", ["owner", "admin"])).toBe(false);
    expect(hasRequiredRole(null, ["owner", "admin", "agent"])).toBe(false);
  });

  it("rate limits excessive public widget requests", () => {
    resetRateLimiterForTests();
    expect(checkRateLimit("widget:ip1", 2, 60_000).allowed).toBe(true);
    expect(checkRateLimit("widget:ip1", 2, 60_000).allowed).toBe(true);
    expect(checkRateLimit("widget:ip1", 2, 60_000).allowed).toBe(false);
  });

  it("detects duplicate knowledge documents via deterministic hash and chunks long text", () => {
    const h1 = computeContentHash("Return Policy", "Unopened items returned within 14 days.");
    const h2 = computeContentHash("return policy", "Unopened items   returned within 14 days.");
    expect(h1).toBe(h2);

    const longText = "Paragraph one. ".repeat(80) + "\n\n" + "Paragraph two. ".repeat(80);
    const chunks = chunkKnowledgeText(longText, 500);
    expect(chunks.length).toBeGreaterThan(2);
  });
});
