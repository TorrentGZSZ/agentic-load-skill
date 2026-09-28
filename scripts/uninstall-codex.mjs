#!/usr/bin/env node
/**
 * Uninstall agentic-load-skill from Codex.
 *
 * - removes ~/.codex/plugins/cache/local/agentic-load-skill/
 * - sets [plugins."agentic-load-skill@local"].enabled = false in ~/.codex/config.toml
 * - removes ~/.codex/prompts/agentic-load-skill.md
 *
 * Does NOT touch ~/.agentic-load-skill/ unless --purge is passed.
 */
import { copyFile, readFile, rm } from "node:fs/promises";
import { homedir } from "node:os";
import { join } from "node:path";

import { atomicWrite } from "./lib/atomic-write.mjs";
import { PLUGIN_KEY, PLUGIN_NAME, MARKETPLACE, log } from "./lib/common.mjs";
import { warnAboutDisabledSkills } from "./lib/plugin-install.mjs";
import { setPluginEnabled } from "./lib/toml-plugin.mjs";
import { isManagedUnchanged } from "./prompt-marker.mjs";

const codexHome = process.env["CODEX_HOME"] || join(homedir(), ".codex");
const cacheDir = join(codexHome, "plugins/cache", MARKETPLACE, PLUGIN_NAME);
const configPath = join(codexHome, "config.toml");
const promptPath = join(codexHome, "prompts/agentic-load-skill.md");
const legacyPromptPath = join(codexHome, "prompts/agentic-load-skill-skills.md");
const stateDir = process.env["AGENTIC_LOAD_SKILL_STATE_DIR"] || join(homedir(), ".agentic-load-skill");
const statePath = join(stateDir, "state-codex.json");

const purge = process.argv.includes("--purge");

async function main() {
  log(`uninstalling ${PLUGIN_KEY}`);

  await warnAboutDisabledSkills({
    statePath,
    warnPrefix: "!",
    formatRestoreHint: () => [
      `  To restore them BEFORE uninstalling, run /agentic-load-skill enable <id...> or use the bundled CLI.`,
    ],
    log,
  });
  await removeCache();
  await disablePlugin();
  await removeSlashCommand();
  await removeLegacySlashCommand();
  if (purge) await purgeState();

  log("");
  log("✓ uninstalled.");
  log("Restart Codex for the change to take full effect.");
  if (!purge) log(`State preserved at ${stateDir}/. Pass --purge to remove it.`);
}

async function removeCache() {
  await rm(cacheDir, { recursive: true, force: true });
  log(`  removed ${cacheDir}`);
}

async function disablePlugin() {
  let config;
  try {
    config = await readFile(configPath, "utf8");
  } catch (err) {
    if (err && /** @type {NodeJS.ErrnoException} */(err).code === "ENOENT") return;
    throw err;
  }
  await atomicWrite(configPath, setPluginEnabled(config, PLUGIN_KEY, false));
  log(`  disabled in config.toml`);
}

async function removeSlashCommand() {
  let existing;
  try {
    existing = await readFile(promptPath, "utf8");
  } catch (err) {
    if (err && /** @type {NodeJS.ErrnoException} */(err).code === "ENOENT") {
      log(`  /agentic-load-skill prompt already absent`);
      return;
    }
    throw err;
  }

  if (!isManagedUnchanged(existing)) {
    process.stderr.write(
      `! ${promptPath} has local edits; keeping your version.\n` +
      `  Remove the file manually if you no longer need the /agentic-load-skill slash command.\n`,
    );
    log(`  skipped /agentic-load-skill prompt (user-modified)`);
    return;
  }

  await rm(promptPath, { force: true });
  log(`  removed /agentic-load-skill prompt`);
}

async function removeLegacySlashCommand() {
  let existing;
  try {
    existing = await readFile(legacyPromptPath, "utf8");
  } catch (err) {
    if (err && /** @type {NodeJS.ErrnoException} */(err).code === "ENOENT") return;
    throw err;
  }

  if (!isManagedUnchanged(existing)) {
    const backupPath = `${legacyPromptPath}.user-modified.bak`;
    await copyFile(legacyPromptPath, backupPath);
    await rm(legacyPromptPath, { force: true });
    process.stderr.write(
      `! ${legacyPromptPath} has local edits; removing the old slash command. ` +
      `Copy it back from ${backupPath} if you still need that custom prompt.\n`,
    );
    log(`  removed old /agentic-load-skill:skills prompt (user-modified)`);
    return;
  }

  await rm(legacyPromptPath, { force: true });
  log(`  removed old /agentic-load-skill:skills prompt`);
}

async function purgeState() {
  await rm(stateDir, { recursive: true, force: true });
  log(`  purged ${stateDir}`);
}

main().catch((err) => {
  console.error("uninstall failed:", err.message);
  process.exit(1);
});
