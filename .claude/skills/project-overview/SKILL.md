---
name: project-overview
description: What my-project3 is, where code lives, and how to run/build/lint it. Read at the start of any task in this project.
---
# my-project3

A web app scaffolded with **Vite + React + TypeScript** (Vite's `react-ts` template).

## Stack (versions as of 2026-06-12)
- React 19 + react-dom 19
- TypeScript ~6.0
- Vite 8 with `@vitejs/plugin-react`
- **reactx ^1.0.0** — transparent reactive state management (see `reactx-docs` skill)
- ESLint 10 (flat config in `eslint.config.js`), typescript-eslint
- Node 24, npm 11. Shell is **zsh** (no `shopt` — use `setopt`/zsh globbing or explicit moves).

## Layout
- `src/main.tsx` — entry, mounts `<App />`
- `src/App.tsx` — root component; `src/App.css`, `src/index.css` — styles
- `src/state.ts` — app-level reactive state (reactx `reactive()` class instance)
- `src/assets/` — static imports
- `index.html` — Vite HTML entry
- `vite.config.ts`, `tsconfig*.json` (`tsconfig.app.json` for app code, `tsconfig.node.json` for config files)
- `public/` — served as-is
- `.github/workflows/claude-agent.yml` — "/claude" issue-comment dispatcher (see the `claude-agent-docs` skill)

## Commands
- `npm run dev` — dev server (HMR)
- `npm run build` — `tsc -b && vite build` (type-checks then builds to `dist/`). Use this to verify a change compiles.
- `npm run preview` — serve the production build
- `npm run lint` — ESLint over the repo

## Gotchas
- `npm create vite@latest .` aborts ("Operation cancelled") when the directory is non-empty (e.g. existing `.git`/`.claude`). Scaffold into a temp subdir, then move files (including dotfiles like `.gitignore`) into the root. The package `name` will inherit the temp dir name — fix it in `package.json`.
