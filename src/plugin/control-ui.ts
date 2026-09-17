import { defineControlUiPlugin } from "openclaw/plugin-sdk/control-ui";
import { createFeatureClient } from "openclaw/plugin-sdk/feature-contract";
import { contract } from "./contract.js";
import "./control-ui.css";

export default defineControlUiPlugin({
  id: contract.pluginId,
  activate(host) {
    host.ui.registerNavigation({
      id: "builder",
      label: "EasyClaw Builder",
      page: { id: "builder" },
      icon: "sparkles",
    });
    host.ui.registerPage({
      id: "builder",
      label: "EasyClaw Builder",
      mount(container, context) {
        const feature = createFeatureClient(contract, context.host);
        const page = document.createElement("section");
        page.className = "easyclaw-builder-page";

        const heading = document.createElement("h1");
        heading.textContent = "Build an agent from a brief";
        const notice = document.createElement("p");
        notice.textContent = "Preview only. This page does not install agents, enable jobs, connect accounts, or write Gateway configuration.";

        const brief = document.createElement("textarea");
        brief.setAttribute("aria-label", "Agent brief");
        brief.maxLength = 4000;
        brief.placeholder = "Describe one agent role and what it should do.";
        const analyze = document.createElement("button");
        analyze.textContent = "Suggest template";

        const templateLabel = document.createElement("label");
        templateLabel.textContent = "Template";
        const template = document.createElement("select");
        template.setAttribute("aria-label", "Template");
        templateLabel.append(template);

        const nameLabel = document.createElement("label");
        nameLabel.textContent = "Agent name (optional)";
        const name = document.createElement("input");
        name.maxLength = 80;
        nameLabel.append(name);

        const previewButton = document.createElement("button");
        previewButton.textContent = "Review Claw preview";
        const status = document.createElement("output");
        status.setAttribute("aria-live", "polite");
        const setup = document.createElement("ul");
        const packageHeading = document.createElement("h2");
        packageHeading.textContent = "package.json";
        const packageText = document.createElement("pre");
        const clawHeading = document.createElement("h2");
        clawHeading.textContent = "CLAW.md";
        const clawText = document.createElement("pre");

        const showError = (error: unknown) => {
          if (!context.signal.aborted) status.textContent = `Unable to generate preview: ${String(error)}`;
        };

        analyze.onclick = async () => {
          analyze.disabled = true;
          status.textContent = "Analyzing brief…";
          try {
            const result = await feature.invoke("propose", { brief: brief.value });
            if (context.signal.aborted) return;
            if (result.matched && result.templateId) template.value = result.templateId;
            status.textContent = result.matched
              ? `Candidate: ${result.templateId}. ${result.questions.join(" ")}`
              : result.questions.join(" ");
          } catch (error) {
            showError(error);
          } finally {
            if (!context.signal.aborted) analyze.disabled = false;
          }
        };

        previewButton.onclick = async () => {
          previewButton.disabled = true;
          status.textContent = "Generating preview…";
          try {
            const result = await feature.invoke("preview", {
              templateId: template.value,
              ...(name.value.trim() ? { agentName: name.value.trim() } : {}),
            });
            if (context.signal.aborted) return;
            status.textContent = "Preview generated. Review every manual setup task before using the package.";
            setup.replaceChildren();
            for (const task of result.manualSetup) {
              const item = document.createElement("li");
              item.textContent = `${task.kind}: ${task.detail}`;
              setup.append(item);
            }
            packageText.textContent = result.packageJson;
            clawText.textContent = result.clawMarkdown;
          } catch (error) {
            showError(error);
          } finally {
            if (!context.signal.aborted) previewButton.disabled = false;
          }
        };

        page.append(heading, notice, brief, analyze, templateLabel, nameLabel, previewButton, status, setup, packageHeading, packageText, clawHeading, clawText);
        container.append(page);
        void feature.invoke("catalog", {}).then(
          (result) => {
            if (context.signal.aborted) return;
            for (const entry of result.templates) {
              const option = document.createElement("option");
              option.value = entry.templateId;
              option.textContent = `${entry.displayName} — ${entry.summary}`;
              template.append(option);
            }
          },
          showError,
        );
        return { dispose: () => page.remove() };
      },
    });
  },
});
