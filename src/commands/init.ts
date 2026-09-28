import { cp, mkdir, rm, stat, writeFile } from "node:fs/promises";
import { homedir } from "node:os";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { parseStrict } from "../args.ts";

type InitScope = "project" | "global";

interface InitResult {
  action: "initialized-agentic-load-skill-skill";
  agent: "codex";
  scope: InitScope;
  targetRoot: string;
  skillDir: string;
  skillMdPath: string;
  cliPath: string;
}

const SKILL_NAME = "agentic-load-skill";

export async function cmdInit(argv: string[]): Promise<number> {
  if (argv.includes("-h") || argv.includes("--help")) {
    process.stdout.write(
      "usage: agentic-load-skill init [codex] [project|global|all] [--cwd=<dir>] [--cli=<path>] [--force] [--json]\n",
    );
    return 0;
  }

  const { values, positionals } = parseStrict({
    commandName: "agentic-load-skill init",
    config: {
      args: argv,
      options: {
        agent: { type: "string" },
        scope: { type: "string" },
        cwd: { type: "string" },
        cli: { type: "string" },
        force: { type: "boolean" },
        json: { type: "boolean" },
      },
      allowPositionals: true,
    },
  });

  const inputs = [...positionals];
  if (inputs[0] === "codex") inputs.shift();
  const agent = values.agent ?? "codex";
  if (agent !== "codex" || inputs.includes("claude-code") || inputs.includes("claude")) {
    process.stderr.write("only Codex is supported\n");
    return 2;
  }
  if (inputs.length > 1 || (inputs.length === 1 && values.scope)) {
    process.stderr.write("usage: agentic-load-skill init [codex] [project|global|all]\n");
    return 2;
  }
  const scopeRaw = values.scope ?? inputs[0] ?? "project";
  if (!["project", "global", "all"].includes(scopeRaw)) {
    process.stderr.write("scope must be project, global, or all\n");
    return 2;
  }
  const scopes: InitScope[] = scopeRaw === "all" ? ["project", "global"] : [scopeRaw as InitScope];
  const projectRoot = resolve(values.cwd ?? process.cwd());

  try {
    const packageRoot = await findPackageRoot(dirname(fileURLToPath(import.meta.url)));
    const sourceDir = join(packageRoot, "skills", SKILL_NAME);
    if (!await fileExists(join(sourceDir, "SKILL.md"))) {
      throw new Error("could not locate bundled agentic-load-skill skill");
    }
    const cliPath = resolve(expandHome(values.cli ?? process.env.AGENTIC_LOAD_SKILL_CLI ?? join(packageRoot, "bin", SKILL_NAME)));
    const targets = scopes.map((scope) => {
      const targetRoot = scope === "project"
        ? join(projectRoot, ".agents")
        : resolve(process.env.AGENTS_HOME ?? join(homedir(), ".agents"));
      return { scope, targetRoot, skillDir: join(targetRoot, "skills", SKILL_NAME) };
    });

    for (const target of targets) {
      if (await pathExists(target.skillDir) && !values.force) {
        throw new Error(`${target.skillDir} already exists; re-run with --force to replace it`);
      }
    }

    const results: InitResult[] = [];
    for (const target of targets) {
      if (await pathExists(target.skillDir)) {
        await rm(target.skillDir, { recursive: true, force: true });
      }
      await mkdir(dirname(target.skillDir), { recursive: true });
      await cp(sourceDir, target.skillDir, { recursive: true });
      await writeLocalCliReference(target.skillDir, cliPath);
      results.push({
        action: "initialized-agentic-load-skill-skill",
        agent: "codex",
        scope: target.scope,
        targetRoot: target.targetRoot,
        skillDir: target.skillDir,
        skillMdPath: join(target.skillDir, "SKILL.md"),
        cliPath,
      });
    }

    if (values.json) {
      process.stdout.write(JSON.stringify(results.length === 1 ? results[0] : {
        action: "initialized-agentic-load-skill",
        results,
      }, null, 2) + "\n");
    } else {
      for (const result of results) {
        process.stdout.write(`initialized Codex ${result.scope} skill: ${result.skillMdPath}\n`);
      }
    }
    return 0;
  } catch (err) {
    process.stderr.write(`${(err as Error).message}\n`);
    return 1;
  }
}

async function writeLocalCliReference(skillDir: string, cliPath: string): Promise<void> {
  const referenceDir = join(skillDir, "references");
  await mkdir(referenceDir, { recursive: true });
  const quoted = cliPath.replace(/'/g, "''");
  await writeFile(join(referenceDir, "local-cli.md"), [
    "# Local CLI",
    "",
    "Use this PowerShell helper for the installed Codex skill:",
    "",
    "~~~powershell",
    `function agentic_load_skill { $env:AGENTIC_LOAD_SKILL_HOST = 'codex'; node '${quoted}' @args }`,
    "~~~",
    "",
  ].join("\n"));
}

async function findPackageRoot(start: string): Promise<string> {
  let current = resolve(start);
  while (true) {
    if (await fileExists(join(current, "skills", SKILL_NAME, "SKILL.md"))) return current;
    const parent = dirname(current);
    if (parent === current) throw new Error("could not find package root");
    current = parent;
  }
}

async function pathExists(path: string): Promise<boolean> {
  try {
    await stat(path);
    return true;
  } catch (err) {
    if ((err as NodeJS.ErrnoException).code === "ENOENT") return false;
    throw err;
  }
}

async function fileExists(path: string): Promise<boolean> {
  try {
    return (await stat(path)).isFile();
  } catch (err) {
    if ((err as NodeJS.ErrnoException).code === "ENOENT") return false;
    throw err;
  }
}

function expandHome(path: string): string {
  if (path === "~") return homedir();
  if (path.startsWith("~/")) return join(homedir(), path.slice(2));
  return path;
}
