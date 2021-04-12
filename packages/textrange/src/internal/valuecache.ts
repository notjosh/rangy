class ValueCache {
  private store: Record<string, any> = {};

  get(key: string) {
    return this.store.hasOwnProperty(key) ? this.store[key] : null;
  }

  set(key: string, value: any): any {
    return (this.store[key] = value);
  }
}

var cachedCount = 0,
  uncachedCount = 0;

function createCachingGetter(methodName, func, objProperty) {
  return function (args) {
    var cache = this.cache;
    if (cache.hasOwnProperty(methodName)) {
      cachedCount++;
      return cache[methodName];
    } else {
      uncachedCount++;
      var value = func.call(this, objProperty ? this[objProperty] : this, args);
      cache[methodName] = value;
      return value;
    }
  };
}
