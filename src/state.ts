import { reactive } from 'reactx'
import { browserServices } from './services'
import type { Services } from './services'

const COUNT_KEY = 'app_count'

class AppState {
  count: number

  constructor(private services: Services) {
    this.count = services.persistence.get<number>(COUNT_KEY) ?? 0
  }

  increment() {
    this.count++
    this.services.persistence.set(COUNT_KEY, this.count)
  }
}

export const appState = reactive(new AppState(browserServices))
