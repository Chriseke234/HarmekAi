/**
 * Deterministic single- and multi-intent classifier for the Native Harmek Engine.
 * Supports compound questions, buying/order intent, comparisons, budget queries,
 * catalog browsing, and natural conversational acknowledgements.
 */

export type NativeIntent =
  | "greeting"
  | "farewell"
  | "gratitude"
  | "acknowledgement"
  | "human_handoff"
  | "complaint_urgent"
  | "order_intent"
  | "compare_items"
  | "budget_query"
  | "catalog_browse"
  | "recommendation"
  | "product_price"
  | "product_availability"
  | "product_info"
  | "service_info"
  | "business_hours"
  | "location_contact"
  | "delivery_info"
  | "booking_info"
  | "policy_query"
  | "lead_submission"
  | "faq_query"
  | "unknown";

export interface IntentResult {
  intent: NativeIntent;
  confidence: number;
  matchedSignals: string[];
}

interface IntentRule {
  intent: NativeIntent;
  priority: number;
  patterns: RegExp[];
}

const INTENT_RULES: IntentRule[] = [
  {
    intent: "human_handoff",
    priority: 100,
    patterns: [
      /\b(human|real person|live agent|support agent|representative|manager|staff|someone real)\b/i,
      /\b(talk to|speak to|speak with|connect me|transfer me)\s+(a\s+)?(human|person|agent|staff|manager|someone)\b/i,
    ],
  },
  {
    intent: "complaint_urgent",
    priority: 95,
    patterns: [
      /\b(scam|fraud|lawyer|chargeback|furious|unacceptable|terrible service|never arrived|damaged item|wrong order)\b/i,
      /\b(urgent|emergency|complaint|refund dispute)\b/i,
    ],
  },
  {
    intent: "order_intent",
    priority: 92,
    patterns: [
      /\b(i want to buy|i'd like to buy|want to order|how do i order|place an order|i'll take|ill take|add to cart|checkout|buy \d+|order \d+|purchase)\b/i,
    ],
  },
  {
    intent: "compare_items",
    priority: 90,
    patterns: [
      /\b(compare|comparison|difference between|better between|\bvs\b|versus)\b/i,
    ],
  },
  {
    intent: "budget_query",
    priority: 89,
    patterns: [
      /\b(cheaper|cheapest|most affordable|budget|under \$?\d+|below \$?\d+|less than \$?\d+)\b/i,
    ],
  },
  {
    intent: "recommendation",
    priority: 88,
    patterns: [
      /\b(recommend|recommendation|suggest|which one|what should i (buy|get|choose|try)|best for|help me choose)\b/i,
    ],
  },
  {
    intent: "catalog_browse",
    priority: 86,
    patterns: [
      /\b(what do you sell|what else do you (sell|have|offer)|show me your (products|services|catalog|menu)|list your (products|services)|view prices|see your catalog)\b/i,
    ],
  },
  {
    intent: "product_price",
    priority: 85,
    patterns: [
      /\b(how much|price|cost|pricing|rate|rates|fee|fees|expensive|cheap|charge for)\b/i,
      /\$\d+/,
    ],
  },
  {
    intent: "product_availability",
    priority: 82,
    patterns: [
      /\b(in stock|out of stock|available|availability|do you have|do you carry|do you sell|still have)\b/i,
    ],
  },
  {
    intent: "delivery_info",
    priority: 80,
    patterns: [
      /\b(deliver|delivery|shipping|ship|dispatch|courier|waybill|pickup|pick up|how long.*take|same day|next day)\b/i,
    ],
  },
  {
    intent: "booking_info",
    priority: 78,
    patterns: [
      /\b(book|booking|appointment|schedule|reserve|reservation|slot|walk-in|walk in)\b/i,
    ],
  },
  {
    intent: "business_hours",
    priority: 76,
    patterns: [
      /\b(open|opening|hours|closing|close|when are you open|working hours|business hours|weekend|sunday|saturday)\b/i,
    ],
  },
  {
    intent: "location_contact",
    priority: 74,
    patterns: [
      /\b(where are you|location|address|located|phone number|email|contact|directions|branch|store)\b/i,
    ],
  },
  {
    intent: "policy_query",
    priority: 72,
    patterns: [
      /\b(return|refund|exchange|warranty|policy|policies|cancel|cancellation|terms|privacy)\b/i,
    ],
  },
  {
    intent: "service_info",
    priority: 65,
    patterns: [
      /\b(service|services|treatment|treatments|package|packages|session|consultation|offer|cleaning|wash|ironing)\b/i,
    ],
  },
  {
    intent: "product_info",
    priority: 60,
    patterns: [
      /\b(product|products|item|items|serum|cream|lotion|catalog|catalogue|ingredients|details|tell me about)\b/i,
    ],
  },
  {
    intent: "greeting",
    priority: 50,
    patterns: [
      /^(hi|hello|hey|good morning|good afternoon|good evening|greetings|howdy|yo)[\s!.,?]*$/i,
    ],
  },
  {
    intent: "acknowledgement",
    priority: 48,
    patterns: [
      /^(ok|okay|alright|got it|sounds good|cool|nice|great|awesome|perfect)[\s!.,?]*$/i,
      /\b(are you there|anyone there|still there)\b/i,
    ],
  },
  {
    intent: "gratitude",
    priority: 45,
    patterns: [
      /^(thanks|thank you|thx|appreciate it|much appreciated|cheers)[\s!.,?]*$/i,
    ],
  },
  {
    intent: "farewell",
    priority: 40,
    patterns: [
      /^(bye|goodbye|see you|take care|have a good day|talk later)[\s!.,?]*$/i,
    ],
  },
];

export function detectMultipleIntents(
  message: string,
  customEscalationKeywords: string[] = []
): IntentResult[] {
  const trimmed = message.trim();
  const lower = trimmed.toLowerCase();

  for (const rawKw of customEscalationKeywords) {
    const kw = rawKw.trim().toLowerCase();
    if (kw && lower.includes(kw)) {
      return [
        {
          intent: "human_handoff",
          confidence: 0.95,
          matchedSignals: [`escalation_keyword:${rawKw}`],
        },
      ];
    }
  }

  const matched: IntentResult[] = [];
  for (const rule of INTENT_RULES) {
    const signals: string[] = [];
    for (const pattern of rule.patterns) {
      const m = trimmed.match(pattern);
      if (m) signals.push(m[0]);
    }
    if (signals.length > 0) {
      matched.push({
        intent: rule.intent,
        confidence: Math.min(0.95, 0.72 + signals.length * 0.1),
        matchedSignals: signals,
      });
    }
  }

  if (matched.length > 0) return matched;

  if (
    /\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}\b/.test(trimmed) ||
    /(?:\+?\d{1,3}[\s.-]?)?(?:\(?\d{3}\)?[\s.-]?)\d{3}[\s.-]?\d{4}\b/.test(trimmed)
  ) {
    return [
      {
        intent: "lead_submission",
        confidence: 0.85,
        matchedSignals: ["contact_detail_provided"],
      },
    ];
  }

  return [
    {
      intent: "faq_query",
      confidence: 0.45,
      matchedSignals: [],
    },
  ];
}

export function detectIntent(
  message: string,
  customEscalationKeywords: string[] = []
): IntentResult {
  return detectMultipleIntents(message, customEscalationKeywords)[0];
}
