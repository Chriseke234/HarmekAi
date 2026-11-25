import type { AssistantSettings, EnhancedProviderName } from "@/types/database";
import type { KnowledgeMatchCandidate, WorkspaceKnowledgeBundle } from "../native/knowledge-matcher";

export interface EnhancedAIRequest {
  apiKey: string;
  model?: string | null;
  customerMessage: string;
  assistantName: string;
  settings: AssistantSettings;
  knowledge: WorkspaceKnowledgeBundle;
  topMatches: KnowledgeMatchCandidate[];
  recentHistory: Array<{ role: "user" | "assistant"; content: string }>;
}

export interface EnhancedAIResponse {
  reply: string;
  tokensUsed: number;
  estimatedCostUsd: number;
  modelUsed: string;
}

export interface ProviderTestResult {
  ok: boolean;
  provider: EnhancedProviderName;
  model: string;
  message: string;
}

export interface EnhancedAIProvider {
  readonly name: EnhancedProviderName;
  readonly defaultModel: string;
  generateResponse(request: EnhancedAIRequest): Promise<EnhancedAIResponse>;
  testConnection(apiKey: string, model?: string | null): Promise<ProviderTestResult>;
}
