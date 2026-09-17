import { Type } from "typebox";
import { defineFeatureContract } from "openclaw/plugin-sdk/feature-contract";

const TemplateSchema = Type.Object(
  {
    templateId: Type.String({ maxLength: 80 }),
    displayName: Type.String({ maxLength: 120 }),
    summary: Type.String({ maxLength: 1000 }),
    tier: Type.String({ maxLength: 20 }),
  },
  { additionalProperties: false },
);

export const contract = defineFeatureContract({
  pluginId: "easyclaw-builder",
  operations: {
    catalog: {
      kind: "query",
      description: "List local Blueprint templates without reading or changing Gateway state.",
      input: Type.Object({}, { additionalProperties: false }),
      output: Type.Object({ templates: Type.Array(TemplateSchema, { maxItems: 30 }) }, { additionalProperties: false }),
    },
    propose: {
      kind: "query",
      description: "Suggest one template from an operator brief and list questions to review.",
      input: Type.Object({ brief: Type.String({ minLength: 1, maxLength: 16000 }) }, { additionalProperties: false }),
      output: Type.Object(
        {
          matched: Type.Boolean(),
          templateId: Type.Optional(Type.String({ maxLength: 80 })),
          confidence: Type.Optional(Type.String({ maxLength: 20 })),
          reasons: Type.Array(Type.String({ maxLength: 500 }), { maxItems: 20 }),
          questions: Type.Array(Type.String({ maxLength: 500 }), { maxItems: 20 }),
          approvalPosture: Type.Optional(Type.String({ maxLength: 40 })),
        },
        { additionalProperties: false },
      ),
    },
    preview: {
      kind: "query",
      description: "Generate an in-memory Claw preview; never install or change Gateway configuration.",
      input: Type.Object(
        {
          templateId: Type.String({ minLength: 1, maxLength: 80 }),
          agentName: Type.Optional(Type.String({ minLength: 1, maxLength: 80 })),
        },
        { additionalProperties: false },
      ),
      output: Type.Object(
        {
          templateId: Type.String({ maxLength: 80 }),
          displayName: Type.String({ maxLength: 120 }),
          packageJson: Type.String({ maxLength: 32768 }),
          clawMarkdown: Type.String({ maxLength: 1048576 }),
          installReady: Type.Boolean(),
          manualSetup: Type.Array(
            Type.Object(
              { kind: Type.String({ maxLength: 40 }), detail: Type.String({ maxLength: 1000 }) },
              { additionalProperties: false },
            ),
            { maxItems: 50 },
          ),
        },
        { additionalProperties: false },
      ),
    },
  },
  events: {},
});
