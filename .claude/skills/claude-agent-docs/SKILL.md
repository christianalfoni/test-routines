---
name: claude-agent-docs
description: Knowledge about this repo's "/claude" GitHub coding agent — the dispatcher workflow and the Claude Code routine-fire API. Load before editing .github/workflows/claude-agent.yml or touching the routine wiring.
---
# Claude agent (mention-driven coding agent)

This repo has a "/claude" agent: an issue comment `/claude ...` kicks off a cloud
Claude Code **routine** that implements the request and opens a PR; the routine's
**Auto-fix** then owns that PR's lifecycle (CI + review comments). A small GitHub
Actions **dispatcher** exists only to bridge issue-comment events to the routine,
because routines have native triggers only for `pull_request`/`release`.

| doc | covers |
|-----|--------|
| dispatcher.md | architecture, the dispatcher's gates/sanitise/fire/ack logic, and the manual web-UI setup it depends on |
| routine-fire-api.md | the `/fire` endpoint contract (verified): method, URL, headers, request/response shape, error codes |
