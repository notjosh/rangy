const globalCache = new WeakMap();

export default function Memoize() {
  return (target: any, propertyName: string, descriptor: TypedPropertyDescriptor<any>) => {
    if (descriptor.value != null) {
      descriptor.value = getNewFunction(descriptor.value);
    } else if (descriptor.get != null) {
      descriptor.get = getNewFunction(descriptor.get);
    } else {
      throw new Error('Only put a Memoize decorator on a method or get accessor.');
    }
  };
}

class MixedMap {

  map: Map<any, any> = new Map();
  weakMap: WeakMap<any, any> = new WeakMap();

  has(key: any) {
    return this.getCorrespondingMap(key).has(key);
  }

  get(key: any) {
    return this.getCorrespondingMap(key).get(key);
  }

  set(key: any, value: any) {
    this.getCorrespondingMap(key).set(key, value);

    return this;
  }

  clear() {
    this.map.clear();
    this.map = new Map();
    this.weakMap = new WeakMap();
  }

  private getCorrespondingMap(key: any) {
    return key instanceof Object ? this.weakMap : this.map;
  }

}

function getNewFunction(originalFunction: (...params: any[]) => void) {
  return function (this: any, ...args: any[]) {
    const thisCache = cache(globalCache, this, () => new WeakMap());
    const fnCache = cache(thisCache, originalFunction, () => new MixedMap());

    return cache(fnCache, args[0], () => originalFunction.apply(this, args));
  };
}

function cache<V>(wm: MixedMap | WeakMap<any, any>, key: any, createValue: () => V) {
  let value: V;

  if (!wm.has(key)) {
    wm.set(key, value = createValue());
  } else {
    value = wm.get(key);
  }

  return value;
}