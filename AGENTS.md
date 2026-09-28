# agentic-load-skill development guide

## Scope

- Maintain the CLI for Windows PowerShell and Codex only.
- Keep README.md as a short, executable user SOP. Put design and implementation notes in DEVELOPMENT.md, and repair procedures in docs/troubleshooting.zh-CN.md.
- Do not present old experiment scripts or reports as current product behavior.
- Keep the npm package limited to the CLI, Codex assets, and their required files.

## Verification

Run `npm run typecheck`, `npm run build`, `npm run check:pack`, and `npm run test:e2e:offline` after executable changes. Use targeted unit tests for the changed behavior. Windows tests that create directory symlinks require OS privileges and may fail on machines without them.

Do not create a Git commit unless the user explicitly asks for one.
