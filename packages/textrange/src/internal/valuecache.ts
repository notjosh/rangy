class ValueCache {
  private store: Record<string, any> = {};

  get(key: string) {
    return this.store.hasOwnProperty(key) ? this.store[key] : null;
  }

  set(key: string, value: any): any {
    return (this.store[key] = value);
  }
}

export default ValueCache;
