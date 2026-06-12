export interface Persistence {
  get<T>(key: string): T | undefined
  set<T>(key: string, value: T): void
  remove(key: string): void
}

export interface Services {
  persistence: Persistence
}

export const browserServices: Services = {
  persistence: {
    get<T>(key: string): T | undefined {
      const item = localStorage.getItem(key)
      return item === null ? undefined : (JSON.parse(item) as T)
    },
    set<T>(key: string, value: T): void {
      localStorage.setItem(key, JSON.stringify(value))
    },
    remove(key: string): void {
      localStorage.removeItem(key)
    },
  },
}
