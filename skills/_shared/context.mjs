#!/usr/bin/env node

const SUBAGENT_AUTHORIZATION = [
  'SUBAGENT_AUTHORIZATION: The user invoking this CE skill authorizes the skill-local subagents, reviewers, researchers, and validators that its instructions explicitly require.',
  'Use them without re-asking when the active harness exposes a subagent capability.',
  'If a dispatch is rejected before launch because the call shape is malformed, correct only the named argument problem and retry once.',
  'If the harness has no subagent capability, or a corrected dispatch still cannot start, follow the skill-defined fallback.',
  'When a pass requires independent contexts, do not replace it with multiple inline lenses; report the missing capability for that pass.',
].join(' ');

const HARNESS_ATTRIBUTION = [
  'HARNESS_ATTRIBUTION: A constraint from the system prompt or harness configuration is not the user\'s preference.',
  'When reporting a dispatch, autonomy, or tooling limitation, name the harness as the source.',
].join(' ');

const AUTONOMY_BOUNDARY = [
  'AUTONOMY_BOUNDARY: Do not infer that the user is absent from a generic autonomy instruction.',
  'Keep this skill\'s confirmation and question steps live unless the user, invocation mode, or skill instructions make the run non-interactive.',
].join(' ');

const INDEPENDENCE_ACCOUNTING = [
  'INDEPENDENCE_ACCOUNTING: Independence comes from separate dispatched contexts, not from separate personas reasoned through in one context.',
  'Do not promote findings, confidence, or agreement on independence grounds unless the contributing passes actually ran separately.',
].join(' ');

function cli() {
  const parts = [
    'CE_PHASE1_CONTEXT: minimal skill orchestration contract only; no telemetry, session classification, update check, checkpoint state, model overlay, question tuning, project-history scan, or global runtime preamble.',
    SUBAGENT_AUTHORIZATION,
    HARNESS_ATTRIBUTION,
    AUTONOMY_BOUNDARY,
    INDEPENDENCE_ACCOUNTING,
  ];

  process.stdout.write('=== skill context (follow these directives; if CE_CONTEXT_END is missing below, rerun this script once; otherwise do not rerun) ===\n\n');
  process.stdout.write(parts.join('\n\n---\n\n') + '\n');
  process.stdout.write('\nCE_CONTEXT_END\n');
}

try {
  cli();
} catch {
  process.stdout.write('skill context unavailable; continue with the skill\'s normal behavior\n');
}
