import { reactive } from 'reactx'

const COUNT_KEY = 'app_count'

class AppState {
  count = Number(localStorage.getItem(COUNT_KEY) ?? 0)

  increment() {
    this.count++
    localStorage.setItem(COUNT_KEY, String(this.count))
  }
}

export const appState = reactive(new AppState())
