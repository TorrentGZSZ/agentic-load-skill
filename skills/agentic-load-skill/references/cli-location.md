# CLI location on Windows

When references/local-cli.md exists next to this file, read it and use its PowerShell helper. The init command writes that file with the chosen CLI path and Codex host setting.

If the generated helper is missing, prefer the AGENTIC_LOAD_SKILL_CLI environment variable. Otherwise use a globally installed agentic-load-skill command, or run the bundled bin/agentic-load-skill through Node with an absolute path.

~~~powershell
function agentic_load_skill { $env:AGENTIC_LOAD_SKILL_HOST = "codex"; node "<absolute-path-to-bin/agentic-load-skill>" @args }
agentic_load_skill list --json
~~~
