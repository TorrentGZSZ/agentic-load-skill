import { execFile } from "node:child_process";
import { test } from "node:test";
import assert from "node:assert/strict";
import { mkdtemp, readFile, rm, stat } from "node:fs/promises";
import { tmpdir } from "node:os";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { promisify } from "node:util";

const execFileAsync = promisify(execFile);
const rootDir = dirname(dirname(fileURLToPath(import.meta.url)));
const cliPath = join(rootDir, "src", "cli.ts");

async function withSandbox(run: (root: string, env: NodeJS.ProcessEnv) => Promise<void>): Promise<void> {
  const root = await mkdtemp(join(tmpdir(), "agentic-load-skill-init-"));
  const env = {
    ...process.env,
    HOME: root,
    USERPROFILE: root,
    AGENTS_HOME: join(root, ".agents"),
    AGENTIC_LOAD_SKILL_STATE_DIR: join(root, ".agentic-load-skill"),
  };
  try {
    await run(root, env);
  } finally {
    await rm(root, { recursive: true, force: true });
  }
}

async function invoke(args: string[], env: NodeJS.ProcessEnv) {
  return execFileAsync(process.execPath, ["--import", "tsx", cliPath, "init", ...args], {
    cwd: rootDir,
    env,
  });
}

test("project init writes a Codex skill and PowerShell CLI helper", async () => {
  await withSandbox(async (root, env) => {
    const project = join(root, "project");
    const { stdout, stderr } = await invoke(["codex", "project", "--cwd", project, "--json"], env);
    assert.equal(stderr, "");
    const result = JSON.parse(stdout) as { agent: string; scope: string; skillMdPath: string };
    assert.equal(result.agent, "codex");
    assert.equal(result.scope, "project");
    const skill = await readFile(result.skillMdPath, "utf8");
    assert.match(skill, /agentic-load-skill.hosts: "codex"/);
    const helper = await readFile(join(project, ".agents", "skills", "agentic-load-skill", "references", "local-cli.md"), "utf8");
    assert.match(helper, /PowerShell/);
    assert.match(helper, /node '/);
  });
});

test("global init writes only under AGENTS_HOME", async () => {
  await withSandbox(async (root, env) => {
    const { stdout } = await invoke(["codex", "global", "--json"], env);
    const result = JSON.parse(stdout) as { scope: string; skillMdPath: string };
    assert.equal(result.scope, "global");
    assert.ok(result.skillMdPath.startsWith(join(root, ".agents")));
    assert.ok((await stat(result.skillMdPath)).isFile());
  });
});

test("init refuses to replace an existing skill without --force", async () => {
  await withSandbox(async (root, env) => {
    const args = ["codex", "project", "--cwd", join(root, "project")];
    await invoke(args, env);
    await assert.rejects(invoke(args, env), /already exists/);
    const { stdout } = await invoke([...args, "--force", "--json"], env);
    assert.equal((JSON.parse(stdout) as { agent: string }).agent, "codex");
  });
});

test("init rejects Claude Code and the CLI help lists Codex only", async () => {
  await withSandbox(async (_root, env) => {
    await assert.rejects(invoke(["claude-code", "project"], env), /only Codex is supported/);
    const { stdout } = await invoke(["--help"], env);
    assert.match(stdout, /init \[codex\]/);
    assert.doesNotMatch(stdout, /claude-code/);
  });
});

test("CLI help offers the local Web UI", async () => {
  await withSandbox(async (_root, env) => {
    const { stdout } = await execFileAsync(process.execPath, ["--import", "tsx", cliPath, "--help"], {
      cwd: rootDir,
      env,
    });
    assert.match(stdout, /^\s+web\s/m);
    const webHelp = await execFileAsync(process.execPath, ["--import", "tsx", cliPath, "web", "--help"], {
      cwd: rootDir,
      env,
    });
    assert.match(webHelp.stdout, /Starts a localhost web UI/);
  });
});
