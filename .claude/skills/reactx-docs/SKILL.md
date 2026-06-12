---
name: reactx-docs
description: Knowledge about reactx — transparent reactive state for React. Load before using or modifying reactx state, or before adding it to a new project.
---
# reactx

Transparent reactive state management for React. Class instances become lazily
observable; components re-render only when properties they actually *access* change.
No providers, no hooks, no wrapping — just import and use state directly.

- **npm**: `reactx` (v1.x) — `npm install reactx`
- **Source**: https://github.com/christianalfoni/reactx

## Setup (Vite)

`vite.config.ts` — **reactx plugin MUST come before the React plugin**:
```ts
import { reactx } from 'reactx/vite-plugin'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [reactx(), react()],  // order matters
})
```

The plugin auto-wraps every exported React component with `observer` and injects
devtools. No manual `observer()` calls needed.

## Defining state

```ts
// src/state.ts
import { reactive } from 'reactx'

class AppState {
  count = 0
  increment() { this.count++ }
  get doubled() { return this.count * 2 }
}

export const appState = reactive(new AppState())
```

- Call `reactive()` once at module level; export the result.
- Regular class — no decorators, no special base class.
- Getters become computed values (cached, re-evaluated when dependencies change).

## Using state in components

```tsx
// src/App.tsx
import { appState } from './state'

function App() {
  return <button onClick={() => appState.increment()}>{appState.count}</button>
}
export default App  // Vite plugin wraps this with observer automatically
```

- Access state properties directly — no `useSelector`, no hooks.
- Only properties read during render trigger re-renders when they change.

## Gotchas

- Plugin order: `reactx()` before `react()` in `vite.config.ts` — wrong order silently
  breaks reactivity.
- The Vite plugin wraps **exported default** components; named exports also work if
  they are exported React functions.
- No React Context / Provider needed; state is module-level singleton.
