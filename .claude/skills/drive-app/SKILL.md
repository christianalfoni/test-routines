---
name: drive-app
description: Drive the test-routines app in a real browser to validate behaviour end-to-end. Use to confirm UI changes work and to test features like localStorage persistence. Start dev server first with `npm run dev`.
---
# drive-app

A generic browser driver (`drive.mjs`) that exercises the real UI using Playwright
(globally installed). Chain commands with `--` to script multi-step flows.

## Prerequisites

Start the dev server first (or use a deployed preview URL):
```bash
npm run dev &   # starts at http://localhost:5173
```

## Commands

```
node .claude/skills/drive-app/drive.mjs <cmd> [args] [-- <cmd> [args] ...]
```

| command | args | what it does |
|---------|------|--------------|
| `navigate` | `<url>` | go to URL (waits for networkidle) |
| `click` | `<selector>` | click element |
| `read` | `<selector>` | print innerText |
| `assert` | `<selector> <text>` | assert exact innerText, exit 1 on fail |
| `reload` | — | reload page |
| `clear-storage` | — | clear localStorage then reload |

## Recipes

**Test localStorage persistence** (the count survives a refresh):
```bash
node .claude/skills/drive-app/drive.mjs \
  navigate http://localhost:5173 \
  -- clear-storage \
  -- click .counter \
  -- assert .counter "Count is 1" \
  -- reload \
  -- assert .counter "Count is 1"
```

**Reset and verify count starts at 0:**
```bash
node .claude/skills/drive-app/drive.mjs \
  navigate http://localhost:5173 \
  -- clear-storage \
  -- assert .counter "Count is 0"
```
