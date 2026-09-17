import { resolveApprovalPostureFromText } from "../capabilities/approval-posture.js";
import { listAgentBlueprintCatalog } from "../blueprints/registry.js";

export type BriefCandidate = {
  templateId: string;
  confidence: "low" | "medium";
  reasons: string[];
  questions: string[];
  approvalPosture: ReturnType<typeof resolveApprovalPostureFromText>;
};

const TEMPLATE_RULES = [
  { templateId: "daily-briefing", pattern: /\b(brief|briefing|digest|newsletter|daily summary)\b/i, reason: "Briefing or digest requested." },
  { templateId: "support-responder", pattern: /\b(support|customer service|helpdesk|ticket)\b/i, reason: "Support workflow requested." },
  { templateId: "research-agent", pattern: /\b(research|investigate|compare sources)\b/i, reason: "Research workflow requested." },
  { templateId: "team-standup-reporter", pattern: /\b(standup|team update|status report)\b/i, reason: "Team reporting requested." },
  { templateId: "project-operator", pattern: /\b(project operator|coordinate tasks|manage project)\b/i, reason: "Project operation requested." },
  { templateId: "personal-assistant", pattern: /\b(personal assistant|help me organize|manage my day)\b/i, reason: "Personal assistance requested." },
] as const;

/** Candidate selection only: no model, channel, or automation is configured. */
export function proposeTemplateFromBrief(brief: string): BriefCandidate | null {
  const trimmed = brief.trim();
  if (!trimmed) {
    return null;
  }
  const matches = TEMPLATE_RULES.filter((rule) => rule.pattern.test(trimmed));
  if (matches.length !== 1) {
    return null;
  }
  const match = matches[0];
  if (!match || !listAgentBlueprintCatalog().some((entry) => entry.templateId === match.templateId)) {
    return null;
  }

  const approvalPosture = resolveApprovalPostureFromText(trimmed);
  const questions = ["Is this the agent template you want to use?"];
  if (!approvalPosture) {
    questions.push("Which actions require your approval?");
  }
  if (/\b(send|post|deliver|reply|respond)\b/i.test(trimmed)) {
    questions.push("Which connected channel and destination should be used after installation?");
  }
  if (/\b(daily|weekly|morning|evening|schedule|every)\b/i.test(trimmed)) {
    questions.push("What exact schedule and timezone should be used?");
  }

  return {
    templateId: match.templateId,
    confidence: "low",
    reasons: [match.reason],
    questions,
    approvalPosture,
  };
}
