# Claude Code routine-fire API

**Research preview** (experimental). Canonical docs — re-fetch for the current shape:
https://platform.claude.com/docs/en/api/claude-code/routines-fire
Verified against those docs on 2026-06-12.

This is the **Claude Code** product surface, NOT the Claude Platform API. It uses a
per-routine bearer token (`sk-ant-oat01-...`), not an `x-api-key`. The token is scoped
to one routine, grants no read access, and is generated once in the web UI (shown once,
unretrievable; generating a new one revokes the old).

## Request

```
POST https://api.anthropic.com/v1/claude_code/routines/<trig_...>/fire
```
- The path id is prefixed `trig_`, not `routine_`. The web UI's API-trigger modal gives
  the full URL — store it verbatim and POST to it directly; do not reconstruct it.

Headers:
| header | value |
|--------|-------|
| `Authorization` | `Bearer <sk-ant-oat01-...>` |
| `anthropic-beta` | `experimental-cc-routine-2026-04-01` (required; missing → 400) |
| `anthropic-version` | `2023-06-01` |
| `Content-Type` | `application/json` |

Body (optional): `{"text": "<freeform context>"}` — max 65,536 chars, NOT parsed, appended
verbatim to the routine's saved prompt. Send context only (repo, issue #, links, request
text); behaviour lives in the routine's saved prompt, not here.

## Response (200)

```json
{
  "type": "routine_fire",
  "claude_code_session_id": "session_...",
  "claude_code_session_url": "https://claude.ai/code/session_..."
}
```
Returns as soon as the session is created — does not stream or wait for completion.

## Errors (standard Anthropic error envelope: `{type:"error", error:{type, message}}`)

| status | type | cause |
|--------|------|-------|
| 400 | invalid_request_error | missing/bad `anthropic-beta`, `text` too long, or **routine paused** |
| 401 | authentication_error | no token, or token doesn't match this routine |
| 403 | permission_error | account/org lacks access to the endpoint |
| 404 | not_found_error | routine doesn't exist |
| 429 | rate_limit_error | daily run cap or usage limit hit; includes `Retry-After` header |
| 500 | api_error | unexpected server error |
| 503 | overloaded_error | temporarily overloaded (note: 503 here, not 529) |

## Idempotency

**None.** No idempotency key — every successful POST creates a new session, and each run
counts against a per-account daily allowance. A blind retry burns a run. Callers must
dedupe themselves (this repo's dispatcher does, via a hidden marker on its ack comment).
