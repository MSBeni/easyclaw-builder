import { getAgentBlueprintTemplate, listAgentBlueprintCatalog } from "../blueprints/registry.js";
import { compileBlueprintToClawPreview } from "../claws/compile.js";
import { proposeTemplateFromBrief } from "../planning/brief.js";

export function getCatalog() {
  return {
    templates: listAgentBlueprintCatalog().map(({ templateId, displayName, summary, tier }) => ({
      templateId,
      displayName,
      summary,
      tier,
    })),
  };
}

export function proposeFromBrief(brief: string) {
  const candidate = proposeTemplateFromBrief(brief);
  if (!candidate) {
    return {
      matched: false,
      reasons: [],
      questions: ["Describe one agent role or choose a template directly."],
    };
  }
  return {
    matched: true,
    templateId: candidate.templateId,
    confidence: candidate.confidence,
    reasons: candidate.reasons,
    questions: candidate.questions,
    ...(candidate.approvalPosture ? { approvalPosture: candidate.approvalPosture } : {}),
  };
}

export function previewTemplate(input: { templateId: string; agentName?: string }) {
  const bundle = getAgentBlueprintTemplate(input.templateId);
  if (!bundle) {
    throw new Error(`Unknown template: ${input.templateId}`);
  }
  if (input.agentName) {
    const trimmed = input.agentName.trim();
    if (!trimmed || !/^[\p{L}\p{N} ._-]+$/u.test(trimmed)) {
      throw new Error("Agent name must contain only letters, numbers, spaces, dots, underscores, or hyphens.");
    }
    bundle.agent.name = trimmed;
  }
  const preview = compileBlueprintToClawPreview(bundle);
  return {
    templateId: input.templateId,
    displayName: bundle.agent.name,
    packageJson: preview.files["package.json"],
    clawMarkdown: preview.files["CLAW.md"],
    installReady: preview.installReady,
    manualSetup: preview.manualSetup,
  };
}
