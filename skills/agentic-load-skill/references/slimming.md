# Skill slimming

Use `suggest` for cleanup requests.

Use the `agentic_load_skill` helper from `SKILL.md`.

```powershell
agentic_load_skill suggest --json
```

Each suggestion includes `id`, `name`, `source`, `reason`, `confidence`, and
`details`.

Show a compact table and ask for explicit confirmation before disabling. The
CLI requires `--yes` for every disable command; without it no skill files are
renamed.
Supported disable forms:

```powershell
agentic_load_skill disable <id...> --yes
agentic_load_skill disable --all-suggested --yes
```

Other operations:

- `list --json` - full inventory with disabled state, last used time,
  and call count.
- `status --json` - disabled records, routed usage, reapplied records,
  orphaned records, conflicts, and orphan markers.
- `enable <id...>` - restore disabled skills.

After disabling, tell the user to restart the host or start a new session so the
visible skill list refreshes.
