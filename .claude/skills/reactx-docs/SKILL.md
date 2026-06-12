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

## Services — accessing external systems (localStorage, HTTP, etc.)

reactx recommends a **services** pattern for anything that touches the environment:
localStorage, network, WebSockets, third-party SDKs. Services are plain interfaces
injected into state constructors. The state class calls them; it never touches
`localStorage` directly.

```ts
// src/services.ts
export interface Persistence {
  get<T>(key: string): T | undefined
  set<T>(key: string, value: T): void
  remove(key: string): void
}
export interface Services { persistence: Persistence }

export const browserServices: Services = {
  persistence: {
    get<T>(key: string) {
      const item = localStorage.getItem(key)
      return item === null ? undefined : (JSON.parse(item) as T)
    },
    set<T>(key: string, value: T) { localStorage.setItem(key, JSON.stringify(value)) },
    remove(key: string)           { localStorage.removeItem(key) },
  },
}
```

```ts
// src/state.ts
import { reactive } from 'reactx'
import { browserServices, Services } from './services'

class AppState {
  count: number
  constructor(private services: Services) {
    this.count = services.persistence.get<number>('app_count') ?? 0
  }
  increment() {
    this.count++
    this.services.persistence.set('app_count', this.count)
  }
}

export const appState = reactive(new AppState(browserServices))
```

- **`erasableSyntaxOnly` is enabled** in this project — TypeScript constructor parameter properties (`private services: Services`) are forbidden. Declare the property explicitly and assign in the constructor body instead.
- Services are **infrastructure verbs** (`get/set/post/subscribe`) — no domain logic.
- Domain operations (e.g. `signIn`, `increment`) live in the state class and call services internally.
- Swap in in-memory implementations for tests — no mocking needed.
- **Do NOT use getter/setter pairs for side effects** — reactx's proxy intercepts `[[Set]]` on the proxy and calls `Reflect.set` on the raw target, bypassing any custom setter on the prototype.

## External docs (unread — fetch before working on these areas)

| topic | url | covers |
|-------|-----|--------|
| architecture.md | https://raw.githubusercontent.com/christianalfoni/reactx/main/docs/architecture.md | services→state→components layering, full architecture guide |
| patterns.md | https://raw.githubusercontent.com/christianalfoni/reactx/main/docs/patterns.md | composing state, services, invariants, subscriptions |
| scaling.md | https://raw.githubusercontent.com/christianalfoni/reactx/main/docs/scaling.md | scaling patterns for larger apps |

## Gotchas

- Plugin order: `reactx()` before `react()` in `vite.config.ts` — wrong order silently
  breaks reactivity.
- The Vite plugin wraps **exported default** components; named exports also work if
  they are exported React functions.
- No React Context / Provider needed; state is module-level singleton.
