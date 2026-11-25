import type { AssistantFormality, AssistantTone, ResponseLength } from "@/types/database";

interface ToneProfile {
  greetingPrefix: string;
  answerLeadIn: string;
  followUpOffer: string;
  clarifyPrefix: string;
  uncertaintyReply: string;
  handoffReply: string;
  avoidedTopicReply: string;
  gratitudeReply: string;
  farewellReply: string;
}

const TONE_PROFILES: Record<AssistantTone, ToneProfile> = {
  friendly: {
    greetingPrefix: "Hello! Thanks for reaching out.",
    answerLeadIn: "Here is what I found for you:",
    followUpOffer: "Would you like help with anything else?",
    clarifyPrefix: "I want to make sure I give you the exact information you need.",
    uncertaintyReply:
      "I do not have verified information on that right now, and I do not want to guess. Would you like me to connect you with a member of our team?",
    handoffReply:
      "Of course — I am notifying a member of our team right now so a human specialist can help you directly.",
    avoidedTopicReply:
      "I am not able to assist with that topic directly. If you would like, I can pass your message to our team for review.",
    gratitudeReply: "You are very welcome! Let me know if there is anything else I can help with.",
    farewellReply: "Thanks for chatting with us today. Feel free to reach back out anytime!",
  },
  professional: {
    greetingPrefix: "Welcome. Thank you for contacting us.",
    answerLeadIn: "Here are the details:",
    followUpOffer: "Please let me know if you require any further information.",
    clarifyPrefix: "To provide an accurate answer, could you please clarify?",
    uncertaintyReply:
      "I do not currently have verified information to answer that accurately. I can escalate your enquiry to a team member if you would like.",
    handoffReply:
      "I have escalated this conversation to our team. A staff member will follow up with you shortly.",
    avoidedTopicReply:
      "I am unable to comment on that subject. I can connect you with our team if you need further assistance.",
    gratitudeReply: "Thank you. Please let me know if there is anything else I can assist you with.",
    farewellReply: "Thank you for reaching out. Have a productive day.",
  },
  conversational: {
    greetingPrefix: "Hey there! Good to hear from you.",
    answerLeadIn: "Sure thing —",
    followUpOffer: "Anything else you are curious about?",
    clarifyPrefix: "Just so I get this right for you —",
    uncertaintyReply:
      "I do not have that detail on hand, and I would rather be upfront than guess. Want me to bring a team member in to help?",
    handoffReply:
      "No problem at all — I have flagged this for our team so someone can jump in and help you.",
    avoidedTopicReply:
      "That is outside what I can cover here, though I can loop in a team member if you need help.",
    gratitudeReply: "Anytime! Let me know if anything else comes up.",
    farewellReply: "Great chatting with you — reach out whenever you need us.",
  },
  luxury: {
    greetingPrefix: "Welcome. It is a pleasure to assist you.",
    answerLeadIn: "Allow me to share the details:",
    followUpOffer: "May I assist you with anything further?",
    clarifyPrefix: "To ensure we tailor our response to your request,",
    uncertaintyReply:
      "I do not have that specific detail verified at the moment. I would be delighted to connect you with a specialist on our team.",
    handoffReply:
      "Certainly. I have alerted our specialist team, who will personally attend to your enquiry shortly.",
    avoidedTopicReply:
      "I am unable to address that topic directly, though I would be pleased to arrange personal assistance from our team.",
    gratitudeReply: "It is my pleasure. Please let me know how else I may be of service.",
    farewellReply: "Thank you for visiting us. We look forward to assisting you again.",
  },
  supportive: {
    greetingPrefix: "Hello — I am here to help you.",
    answerLeadIn: "Here is the information that should help:",
    followUpOffer: "Does this answer your question, or would you like me to check anything else?",
    clarifyPrefix: "I want to make sure I understand your situation clearly.",
    uncertaintyReply:
      "I do not have the exact details for that right now, and I want to make sure you get the right answer. Would you like me to connect you with a team member?",
    handoffReply:
      "I understand — I am connecting you with a member of our team right away so you get personal support.",
    avoidedTopicReply:
      "I cannot advise on that topic, but I can connect you with our team so you are properly supported.",
    gratitudeReply: "Glad I could help. Reach out anytime if you need anything else.",
    farewellReply: "Take care, and thank you for reaching out to us.",
  },
  custom: {
    greetingPrefix: "Hello! How can I assist you today?",
    answerLeadIn: "Here are the details:",
    followUpOffer: "Is there anything else I can help you with?",
    clarifyPrefix: "Could you share a little more detail?",
    uncertaintyReply:
      "I do not have verified information on that yet. Would you like me to connect you with our team?",
    handoffReply:
      "I have notified our team so a human staff member can assist you directly.",
    avoidedTopicReply:
      "I am not configured to discuss that topic. Would you like to speak with our team instead?",
    gratitudeReply: "You are welcome. Let me know if you need anything else.",
    farewellReply: "Thank you for contacting us. Goodbye!",
  },
};

export interface RenderOptions {
  tone: AssistantTone;
  formality: AssistantFormality;
  responseLength: ResponseLength;
  assistantName: string;
  businessName: string;
  welcomeMessage?: string;
}

export function getToneProfile(tone: AssistantTone): ToneProfile {
  return TONE_PROFILES[tone] ?? TONE_PROFILES.friendly;
}

/**
 * Formats a grounded knowledge answer using the workspace's configured tone & length.
 */
export function renderGroundedAnswer(
  answerCore: string,
  options: RenderOptions
): string {
  const profile = getToneProfile(options.tone);

  if (options.responseLength === "brief") {
    return answerCore.trim();
  }

  if (options.responseLength === "detailed") {
    return `${profile.answerLeadIn} ${answerCore.trim()}\n\n${profile.followUpOffer}`;
  }

  // Concise default
  return `${answerCore.trim()} ${profile.followUpOffer}`;
}

export function renderClarification(
  candidateNames: string[],
  options: RenderOptions
): string {
  const profile = getToneProfile(options.tone);
  const uniqueNames = Array.from(new Set(candidateNames)).slice(0, 3);
  if (uniqueNames.length === 0) {
    return `${profile.clarifyPrefix} Could you tell me a bit more about what you are looking for?`;
  }
  const list = uniqueNames.join(", ");
  return `${profile.clarifyPrefix} Are you asking about one of these: ${list}?`;
}
