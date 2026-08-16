# CE gstack

Phase 1 hybrid baseline for dogfooding a clean Compound Engineering loop before
porting any gstack runtime machinery.

The working loop is:

```text
ce-brainstorm -> ce-plan -> ce-work -> ce-simplify-code -> ce-code-review -> ce-compound
```

Compound Engineering owns the initial system surface:

- planning artifacts
- requirements traceability
- implementation workflow
- review result schema
- repository knowledge
- skill orchestration
- configuration

gstack contributes product pressure through `STRATEGY.md`, `CONCEPTS.md`, and
`AGENTS.md` only in Phase 1. Its global runtime preamble is intentionally absent:
no telemetry probe, session-kind probe, update prompt, model overlay, checkpoint
mode, proactive-routing state, project-history scan, or `~/.gstack` state root.

## Commands

```bash
node scripts/validate-baseline.mjs
node scripts/validate-manifests.mjs
npm test
```

The validation scripts are deliberately small. They protect the Phase 1 contract
without importing CE's full converter and release pipeline.
