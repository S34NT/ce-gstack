# Agent Instructions

This repository is the Phase 1 CE/gstack hybrid baseline.

Use the Compound Engineering loop as the default workflow:

```text
ce-brainstorm -> ce-plan -> ce-work -> ce-simplify-code -> ce-code-review -> ce-compound
```

## Ownership

Compound Engineering owns:

- planning artifacts
- requirements traceability
- implementation workflow
- review result schema
- repository knowledge
- skill orchestration
- configuration

## Phase 1 Boundary

Do not introduce gstack's giant global runtime preamble. In particular, do not
add always-run probes for telemetry, session type, project history, question
preferences, repo mode, checkpoint mode, model overlays, upgrade status,
proactive routing, or `~/.gstack` learnings.

gstack influence belongs in `STRATEGY.md`, `CONCEPTS.md`, and this file until
real feature runs identify a specific frustration worth solving.

## Artifacts

- Plans live in `docs/plans/`.
- Learnings live in `docs/solutions/`.
- Team defaults live in `.compound-engineering/config.yaml`.
- Local preferences live in `.compound-engineering/config.local.yaml`.

## Validation

Run these checks after changing manifests, skill inventory, config, or top-level
guidance:

```bash
npm test
npm run plugin:validate
```

Use `npm run dev:install -- status` to inspect local Codex/Claude skill links.
`local` and `remove` manage only symlinks that point at this checkout; they must
not overwrite unrelated user skills.
