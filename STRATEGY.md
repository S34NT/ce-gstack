# Strategy

Phase 1 is a dogfooding baseline, not a feature-porting project.

The goal is to run several real features through the CE loop and observe where it
frustrates us:

```text
ce-brainstorm -> ce-plan -> ce-work -> ce-simplify-code -> ce-code-review -> ce-compound
```

Only friction observed during real use should justify changing the baseline.
Do not port gstack behavior because it looks powerful in isolation.

## Product Stance

- Keep the CE plan contract intact until real usage proves which parts are heavy.
- Prefer one durable artifact per work unit over scattered runtime memory.
- Treat review output as a schema-bearing decision surface, not casual prose.
- Keep configuration explicit, repo-local, and small.
- Add orchestration only where the workflow needs independent context or bounded delegation.

## Phase 1 Non-Goals

- No gstack global runtime preamble.
- No telemetry or update-check prompting.
- No session-kind, checkpoint-mode, model-overlay, question-tuning, or project-history state.
- No browser/QA/runtime tools from gstack.
- No shipping automation until the baseline loop has been exercised manually.
