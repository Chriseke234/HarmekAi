/**
 * Guided Automation templates and deterministic rule evaluator.
 * Designed for non-technical business owners — clear toggles, no brittle drag-and-drop canvas required.
 */

export interface DefaultAutomationTemplate {
  template_key: string;
  name: string;
  description: string;
  trigger_event:
    | "conversation_started"
    | "message_received"
    | "unanswered_question"
    | "human_handoff"
    | "lead_captured"
    | "conversation_idle";
  conditions: Record<string, unknown>;
  actions: Record<string, unknown>;
  is_enabled: boolean;
}

export const DEFAULT_AUTOMATION_TEMPLATES: DefaultAutomationTemplate[] = [
  {
    template_key: "welcome_new_customer",
    name: "Welcome New Customer",
    description:
      "Automatically greets new website visitors with your configured welcome message when a chat starts.",
    trigger_event: "conversation_started",
    conditions: { channel: "website" },
    actions: { type: "send_welcome_message" },
    is_enabled: true,
  },
  {
    template_key: "capture_lead_details",
    name: "Capture Lead Information",
    description:
      "Automatically saves customer name, email, or phone number to Contacts whenever shared in chat.",
    trigger_event: "lead_captured",
    conditions: { require_contact_field: true },
    actions: { type: "upsert_contact_and_tag", tag: "lead" },
    is_enabled: true,
  },
  {
    template_key: "escalate_unanswered",
    name: "Escalate Unanswered Questions",
    description:
      "Logs unanswered questions to your Knowledge Gap report and flags the conversation when confidence stays low.",
    trigger_event: "unanswered_question",
    conditions: { log_gap: true },
    actions: { type: "record_knowledge_gap_and_notify" },
    is_enabled: true,
  },
  {
    template_key: "notify_team_handoff",
    name: "Notify Team on Human Handoff",
    description:
      "Creates a high-priority workspace notification whenever a customer requests a human or Sage escalates.",
    trigger_event: "human_handoff",
    conditions: { notify_roles: ["owner", "admin", "agent"] },
    actions: { type: "create_workspace_notification" },
    is_enabled: true,
  },
  {
    template_key: "categorize_enquiry",
    name: "Auto-Categorize Customer Enquiries",
    description:
      "Automatically labels conversations (Pricing, Delivery, Booking, Support, Policies) based on detected intent.",
    trigger_event: "message_received",
    conditions: { min_confidence: 0.6 },
    actions: { type: "assign_conversation_category" },
    is_enabled: true,
  },
  {
    template_key: "unanswered_staff_reminder",
    name: "Remind Staff About Waiting Enquiries",
    description:
      "Flags conversations waiting for a human response so no customer enquiry is forgotten.",
    trigger_event: "conversation_idle",
    conditions: { waiting_minutes: 30 },
    actions: { type: "create_staff_reminder" },
    is_enabled: false,
  },
  {
    template_key: "consent_followup",
    name: "Consent-Based Follow-Up",
    description:
      "Queues a polite follow-up only when the customer has explicitly opted in to follow-up messages.",
    trigger_event: "lead_captured",
    conditions: { require_followup_consent: true },
    actions: { type: "schedule_approved_followup" },
    is_enabled: false,
  },
];

/**
 * Maps a detected Native Engine intent to a plain-language business category.
 */
export function mapIntentToCategory(intent: string): string {
  switch (intent) {
    case "product_price":
    case "product_availability":
    case "product_info":
      return "Products & Pricing";
    case "service_info":
      return "Services";
    case "delivery_info":
      return "Delivery & Shipping";
    case "booking_info":
      return "Bookings & Appointments";
    case "policy_query":
      return "Policies & Returns";
    case "business_hours":
    case "location_contact":
      return "Business Info";
    case "human_handoff":
    case "complaint_urgent":
      return "Human Support";
    case "lead_submission":
      return "Lead Enquiry";
    default:
      return "General Enquiry";
  }
}
