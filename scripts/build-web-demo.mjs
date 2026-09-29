#!/usr/bin/env node
import { readFile, mkdir, writeFile } from "node:fs/promises";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { renderWebPage } from "../src/commands/web.ts";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const check = process.argv.includes("--check");
const demoDir = resolve(root, "docs/demo");

const skill = (name, description, source = "user", isDisabled = false) => ({
  id: `${source}:codex:${name}`,
  instanceKey: `demo:${source}:${name}`,
  name,
  description,
  source,
  type: source,
  pluginKey: source === "plugin" ? "demo" : null,
  isDisabled,
  isPluginDisabled: false,
  canDisable: true,
  conflict: false,
  outOfRoot: false,
  lastUsed: null,
  callCount: 0,
});

// Entirely fictional examples. Never read or embed the build machine's skills.
const demoSkills = {
  global: [
    skill("api-reference", "Look up API endpoints, parameters, and response shapes."),
    skill("code-review", "Review changes for correctness, clarity, and regressions."),
    skill("data-analysis", "Explore a dataset and summarize useful patterns."),
    skill("design-assets", "Create visual assets for product and documentation pages.", "plugin"),
    skill("pdf-reader", "Extract and inspect text, tables, and figures in PDF files."),
    skill("release-notes", "Turn completed changes into concise release notes.", "user", true),
    skill("spreadsheet", "Build and check spreadsheet models and charts.", "plugin"),
    skill("web-testing", "Run browser checks on an interactive web page.", "plugin", true),
  ],
  project: [
    skill("architecture-notes", "Explain the demo project's modules and design decisions.", "project"),
    skill("issue-triage", "Group incoming issues and suggest priorities.", "project", true),
    skill("test-helper", "Find relevant tests and report failures in this project.", "project"),
  ],
};

const demoAdapter = `<script>
  // Standalone preview: API requests are answered in memory with sample data.
  const demoSkills = ${JSON.stringify(demoSkills)};
  document.getElementById("projectPath").value = "C:/demo-project";
  const demoResponse = (data, status = 200) => new Response(JSON.stringify(data), {
    status,
    headers: { "content-type": "application/json" },
  });
  window.fetch = async (input, options = {}) => {
    const url = new URL(String(input), window.location.href);
    const scope = url.searchParams.get("scope") === "project" ? "project" : "global";
    if (url.pathname === "/api/skills" && (!options.method || options.method === "GET")) {
      return demoResponse({ host: "codex", scope, projectPath: scope === "project" ? "C:/demo-project" : null, skills: demoSkills[scope] });
    }
    if (url.pathname === "/api/skills/disable" || url.pathname === "/api/skills/enable") {
      let body;
      try { body = JSON.parse(options.body); } catch { return demoResponse({ error: "Invalid request" }, 400); }
      const group = body.scope === "project" ? "project" : "global";
      const selected = demoSkills[group].find((item) => item.instanceKey === body.instanceKey);
      if (!selected) return demoResponse({ error: "Demo skill not found" }, 404);
      selected.isDisabled = url.pathname.endsWith("/disable");
      return demoResponse({ ok: true, skill: selected, skills: demoSkills[group] });
    }
    return demoResponse({ error: "Demo only: no backend is connected" }, 404);
  };
</script>`;

function replaceRequired(text, search, replacement) {
  if (!text.includes(search)) throw new Error(`Web page marker missing: ${search}`);
  return text.replace(search, replacement);
}

let html = renderWebPage("codex", "demo-only");
html = replaceRequired(html, "<title>Agentic Load Skill</title>", "<title>Agentic Load Skill · Interactive demo</title>");
html = replaceRequired(html, 'href="/logo.svg"', 'href="./logo.svg"');
html = replaceRequired(html, 'src="/logo.svg"', 'src="./logo.svg"');
html = replaceRequired(html, "</head>", `<style>
  .demo-banner { position: sticky; top: 0; z-index: 30; padding: 10px 18px; border-bottom: 1px solid #cbd3ef; background: #e9ecfb; color: #344389; font: 600 13px/1.4 system-ui, sans-serif; text-align: center; }
  body.dark .demo-banner { border-color: #3a4364; background: #252c44; color: #dce4ff; }
</style>
</head>`);
html = replaceRequired(html, "<body>", '<body>\n  <div class="demo-banner">Interactive preview · Example skills only · Changes stay in this browser tab</div>');
html = html.replace(/<script>\s*const savedTheme/, `${demoAdapter}\n<script>\n    const savedTheme`);
if (!html.includes(demoAdapter)) throw new Error("Could not insert demo adapter before the application script");

const output = resolve(demoDir, "index.html");
const iconOutput = resolve(demoDir, "logo.svg");
const icon = await readFile(resolve(root, "assets/agentic-load-skill-mark.svg"));

if (check) {
  const [currentHtml, currentIcon] = await Promise.all([readFile(output, "utf8"), readFile(iconOutput)]);
  if (currentHtml !== html || !currentIcon.equals(icon)) {
    throw new Error("docs/demo is out of date; run npm run build:web-demo");
  }
  console.log("Web demo is up to date");
} else {
  await mkdir(demoDir, { recursive: true });
  await Promise.all([writeFile(output, html), writeFile(iconOutput, icon)]);
  console.log(`Built ${output}`);
}
