import { reactive } from 'reactx'

class AppState {
  count = 0

  increment() {
    this.count++
  }
}

export const appState = reactive(new AppState())
