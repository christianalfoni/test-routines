# The dispatcher workflow

File: `.github/workflows/claude-agent.yml`. It does **zero Claude work** — it only bridges
an issue-comment event to the routine.

## Why it exists

Routines have native GitHub triggers for `pull_request` and `release` **only** — never
issue comments. Kicking work off from an `@claude` issue comment is the one thing Auto-fix
can't do, so this dispatcher exists solely for that. Once the routine opens a PR, Auto-fix
owns the PR lifecycle (CI failures + review comments) automatically — the dispatcher does
NOT listen for any PR/CI events.

Flow: `@claude ...` on an issue → dispatcher (gate, sanitise, fire, ack) → routine (clone,
implement, open PR) → Auto-fix takes over the PR.

## What the workflow does (single `actions/github-script@v7` step)

- **Events:** two triggers:
  - `issue_comment: [created]` — fires when `@claude` appears in a comment on an issue.
    Job-level `if` drops PR comments (`github.event.issue.pull_request == null`) and Bot
    comments (`...user.type != 'Bot'` — stops the dispatcher's own `github-actions[bot]`
    ack from re-triggering it).
  - `issues: [opened]` — fires when `@claude` appears in the original issue body. Uses
    `github.event.issue.author_association` for the write gate (no bot-type check needed —
    bots won't hold OWNER/MEMBER/COLLABORATOR). The dedupe marker is keyed to
    `issue-<number>` (not a numeric comment id) so it never collides.
- **Command match:** coarse `contains(body, '@claude')` in the job-level `if:` as a cheap
  pre-filter, then the authoritative `/@claude\b/` test in the step — `@claude` can appear
  anywhere in the body (mention style, not a slash-command).
- **Context label:** the fire payload uses `Comment URL:` for `issue_comment` events and
  `Issue URL:` for `issues` events; both point to the triggering URL.
- **Write gate (fails closed):** `author_association` ∈ {OWNER, MEMBER, COLLABORATOR}, in
  the job `if:`. There is deliberately **no `always()` step** — every post-gate action sits
  on default `success()`, so a short-circuited gate can never fire the routine.
- **Dedupe:** before firing, list the issue's comments and skip if one already carries the
  hidden marker `<!-- claude-dispatch:<comment_id> -->`. The success ack carries that
  marker. This is the only guard against the no-idempotency-key retry burning a daily run.
- **Sanitise (prompt-injection surface):** strip HTML comments then zero-width chars with
  these EXACT patterns — `body.replace(/<!--[\s\S]*?-->/g, '')` then
  `.replace(/[​-‍⁠﻿]/g, '')`.
- **Fire:** one `fetch` POST (see routine-fire-api.md), body `{"text": <context only>}`.
- **Ack:** 200 → post `🤖 On it — watch live: <claude_code_session_url>` (with marker);
  non-200 → post a human-readable reason mapped from the status code instead of failing
  silently in the Actions log.

Secrets it reads (set in repo settings, not committed):
`CLAUDE_ROUTINE_FIRE_URL` (full `/fire` URL) and `CLAUDE_ROUTINE_TOKEN` (`sk-ant-oat01-`).
`permissions:` is `issues: write, contents: read` — that's all it needs; the routine clones
and opens PRs via the Claude GitHub App, not this token.

## GOTCHA: writing `\u` escapes into the workflow

The sanitiser's zero-width regex must contain **literal `​` escape text** (backslash,
u, 2,0,0,B), not the actual invisible characters. Two ways this goes wrong:

1. **Tool-arg JSON escaping:** passing `​` in a Write/Edit argument — the JSON layer
   decodes `\uXXXX` to the real character, so the file gets an invisible char, not the
   escape. To land a literal backslash-u, the argument must contain `\\u200B`
   (double backslash).
2. **Verifying:** `grep ... | cat -v` shows the truth — a correct file shows the ASCII
   `​`; a broken one shows `M-bM-^@M-^K` (UTF-8 bytes of U+200B).

Reliable fix when an editor keeps decoding the escape: write the bytes with perl using
`chr(92)` for the backslash, e.g.
`perl -i -pe 'if($.==N){ $_ = q{...} . chr(92).q{u200B-} . chr(92).q{u200D} . ... }'`.

## Validating the workflow locally

No pyyaml on this machine; use ruby (ships with macOS):
```
ruby -ryaml -e 'd=YAML.load_file(".github/workflows/claude-agent.yml");
  File.write("/tmp/s.js","(async()=>{\n"+d["jobs"]["dispatch"]["steps"][0]["with"]["script"]+"\n})()")'
node --check /tmp/s.js
```
The async wrapper matters — github-script runs the body in an async fn, so top-level
`await` is valid there but `node --check` rejects it unwrapped. This only proves YAML+JS
syntax; true end-to-end validation needs the secrets, the routine, and a real issue comment
(can't be done locally).

## Routine behaviour (what the routine prompt must say)

The routine must NOT post a summary comment on the issue after opening the PR. The PR body
must include a closing reference (`Closes #N` or `Fixes #N`) so GitHub auto-links the issue.
The ack comment posted by the dispatcher (`🤖 On it…`) is sufficient — no follow-up comment
on the issue is needed.

Current expected routine prompt (paste into the web UI):

```
You are an autonomous coding agent, fired from a "@claude" mention on a GitHub issue or in
the original issue body. The run input gives you the repo, the issue number, the source URL,
and the request text.

1. Read the full issue thread with your GitHub tools.
2. Determine what is being asked. If it is unclear, ambiguous, or risky, post a comment
   asking for clarification instead of guessing.
3. Implement the change, run the tests, and open a PR whose body includes "Closes #N"
   referencing the issue. Never write the literal string "@claude" in any comment you post —
   it would re-trigger the dispatcher.

Once the PR is open you don't need to be re-triggered for follow-ups: Auto-fix watches the
PR and handles CI failures and review comments automatically.
```

## Manual web-UI setup this depends on

Routine created at https://claude.ai/code/routines/new pointed at this repo, trigger = API,
Behavior → "Auto-fix pull requests" ON (needs the Claude GitHub App installed), the
behaviour prompt pasted in, and the fire URL + token saved as the two repo secrets above.
The routine acts as the connected GitHub identity (commits/PRs appear as that user); use a
dedicated machine user for a clean human-vs-agent trail.
