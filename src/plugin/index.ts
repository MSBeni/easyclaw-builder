import { defineFeaturePlugin } from "openclaw/plugin-sdk/feature-plugin";
import { contract } from "./contract.js";
import { getCatalog, previewTemplate, proposeFromBrief } from "./handlers.js";

export default defineFeaturePlugin({
  contract,
  name: "EasyClaw Builder",
  description: "Review agent briefs and preview portable Claw packages.",
  setup() {
    return {
      catalog: getCatalog,
      propose: ({ brief }) => proposeFromBrief(brief),
      preview: previewTemplate,
    };
  },
});
