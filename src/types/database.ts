/**
 * Core domain types for Harmek AI.
 * Mirrors the normalized Supabase PostgreSQL schema.
 */

export type WorkspaceRole = "owner" | "admin" | "agent";
export type IntelligenceMode = "native" | "enhanced";
export type EnhancedProviderName = "openai" | "anthropic" | "gemini";
export type AssistantTone =
  | "friendly"
  | "professional"
  | "conversational"
  | "luxury"
  | "supportive"
  | "custom";
export type AssistantFormality = "casual" | "balanced" | "formal";
export type ResponseLength = "brief" | "concise" | "detailed";

export type ConversationChannel =
  | "website"
  | "whatsapp"
  | "instagram"
  | "messenger"
  | "simulator";

export type ConversationStatus =
  | "open"
  | "ai_handling"
  | "waiting_for_human"
  | "assigned"
  | "resolved";

export type MessageSenderType = "customer" | "assistant" | "agent" | "system";
export type ProductAvailability = "in_stock" | "out_of_stock" | "preorder" | "limited";
export type KnowledgeSourceType =
  | "policy"
  | "delivery"
  | "booking"
  | "business_info"
  | "document"
  | "url";
export type KnowledgeSourceStatus = "pending" | "processing" | "indexed" | "failed";
export type TrialStatus = "not_started" | "active" | "expired" | "converted";
export type IntegrationProvider =
  | "website_widget"
  | "whatsapp"
  | "instagram"
  | "messenger"
  | "webhook";
export type IntegrationStatus =
  | "disconnected"
  | "pending_verification"
  | "connected"
  | "error";

export interface Profile {
  id: string;
  email: string;
  full_name: string;
  avatar_url: string | null;
  is_platform_admin: boolean;
  created_at: string;
  updated_at: string;
}

export interface Workspace {
  id: string;
  owner_id: string;
  name: string;
  slug: string;
  widget_key: string;
  onboarding_completed: boolean;
  onboarding_step: number;
  created_at: string;
  updated_at: string;
}

export interface BusinessProfile {
  id: string;
  workspace_id: string;
  business_name: string;
  industry: string;
  description: string;
  website: string | null;
  business_email: string | null;
  business_phone: string | null;
  country: string | null;
  location_address: string | null;
  currency: string;
  operating_hours: Record<string, string>;
  delivery_info: string;
  booking_info: string;
  return_policy: string;
  created_at: string;
  updated_at: string;
}

export interface Assistant {
  id: string;
  workspace_id: string;
  name: string;
  avatar_url: string | null;
  is_active: boolean;
  activated_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface AssistantSettings {
  id: string;
  workspace_id: string;
  assistant_id: string;
  tone: AssistantTone;
  custom_tone_notes: string;
  formality: AssistantFormality;
  response_length: ResponseLength;
  welcome_message: string;
  supported_languages: string[];
  business_objectives: string;
  allowed_topics: string[];
  avoided_topics: string[];
  lead_capture_fields: string[];
  clarification_enabled: boolean;
  auto_answer_threshold: number;
  clarification_threshold: number;
  escalation_keywords: string[];
  max_consecutive_fallbacks: number;
  intelligence_mode: IntelligenceMode;
  enhanced_provider: EnhancedProviderName | null;
  enhanced_model: string | null;
  widget_primary_color: string;
  widget_position: "bottom-right" | "bottom-left";
  widget_require_consent: boolean;
  created_at: string;
  updated_at: string;
}

export interface Product {
  id: string;
  workspace_id: string;
  name: string;
  description: string;
  price: number | null;
  currency: string;
  category: string;
  availability: ProductAvailability;
  sku: string | null;
  keywords: string[];
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface Service {
  id: string;
  workspace_id: string;
  name: string;
  description: string;
  price: number | null;
  currency: string;
  duration_label: string | null;
  category: string;
  booking_required: boolean;
  keywords: string[];
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface FaqItem {
  id: string;
  workspace_id: string;
  question: string;
  answer: string;
  category: string;
  keywords: string[];
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface KnowledgeSource {
  id: string;
  workspace_id: string;
  source_type: KnowledgeSourceType;
  title: string;
  category: string;
  content: string;
  source_url: string | null;
  content_hash: string | null;
  status: KnowledgeSourceStatus;
  error_message: string | null;
  created_at: string;
  updated_at: string;
}

export interface Contact {
  id: string;
  workspace_id: string;
  visitor_token: string | null;
  full_name: string | null;
  email: string | null;
  phone: string | null;
  tags: string[];
  notes: string;
  consent_preferences: {
    chat_persistence?: boolean;
    follow_up_messages?: boolean;
  };
  first_interaction_at: string;
  last_interaction_at: string;
  created_at: string;
  updated_at: string;
}

export interface ConversationStateContext {
  lastIntent?: string;
  lastReferencedItem?: {
    type: "product" | "service" | "faq" | "source";
    id: string;
    name: string;
  };
  awaitingClarification?: boolean;
  clarificationCandidates?: Array<{ id: string; name: string; type: string }>;
  consecutiveFallbacks?: number;
  leadCaptureStep?: "name" | "email" | "phone" | "complete" | null;
}

export interface Conversation {
  id: string;
  workspace_id: string;
  contact_id: string | null;
  channel: ConversationChannel;
  status: ConversationStatus;
  human_takeover: boolean;
  assigned_to: string | null;
  subject: string | null;
  category: string | null;
  summary: string | null;
  unread_count: number;
  lead_captured: boolean;
  sale_completed: boolean;
  first_response_ms: number | null;
  state_context: ConversationStateContext;
  last_message_at: string;
  created_at: string;
  updated_at: string;
}

export interface KnowledgeSourceRef {
  type: "product" | "service" | "faq" | "knowledge_source" | "business_profile";
  id: string;
  title: string;
  score: number;
}

export interface Message {
  id: string;
  workspace_id: string;
  conversation_id: string;
  sender_type: MessageSenderType;
  sender_id: string | null;
  content: string;
  intelligence_mode: IntelligenceMode | null;
  intent: string | null;
  confidence: number | null;
  knowledge_source_refs: KnowledgeSourceRef[];
  created_at: string;
}

export interface TrialRecord {
  id: string;
  workspace_id: string;
  status: TrialStatus;
  duration_days: number;
  activated_at: string | null;
  expires_at: string | null;
  conversation_limit: number;
  message_limit: number;
  notified_expiring_3d: boolean;
  notified_expiring_1d: boolean;
  created_at: string;
  updated_at: string;
}

export interface AutomationRule {
  id: string;
  workspace_id: string;
  template_key: string;
  name: string;
  description: string;
  trigger_event: string;
  conditions: Record<string, unknown>;
  actions: Record<string, unknown>;
  is_enabled: boolean;
  created_at: string;
  updated_at: string;
}

export interface IntegrationRecord {
  id: string;
  workspace_id: string;
  provider: IntegrationProvider;
  status: IntegrationStatus;
  public_config: Record<string, unknown>;
  verified_at: string | null;
  last_error: string | null;
  created_at: string;
  updated_at: string;
}
