# Concepts

Shared vocabulary for the CE/gstack hybrid baseline.

## Compound Engineering Loop

The six-step workflow used in Phase 1:
`ce-brainstorm`, `ce-plan`, `ce-work`, `ce-simplify-code`, `ce-code-review`, and
`ce-compound`.

## Unified Plan

The durable CE artifact in `docs/plans/` that starts as requirements-only and is
enriched in place into an implementation-ready plan.

## Requirements Traceability

The connection from user intent and product requirements to implementation units,
affected files, and test scenarios. Traceability is owned by CE in Phase 1.

## Review Result Schema

The structured output contract used by `ce-code-review` so findings can be
merged, deduplicated, routed, and consumed by follow-on workflows.

## Repository Knowledge

Durable learnings captured by `ce-compound` under `docs/solutions/`, plus the
project vocabulary in this file.

## Skill Orchestration

The skill-owned delegation and reference-loading rules that let CE workflows use
subagents or local helper scripts without a global runtime preamble.

## Runtime Preamble

An always-run global setup block that gathers environment and user state before a
skill does its job. gstack uses this heavily. Phase 1 explicitly excludes it.
