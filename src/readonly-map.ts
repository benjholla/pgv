export function toReadonlyMap<K, V>(source: ReadonlyMap<K, V>): ReadonlyMap<K, V> {
  const snapshot = new Map(source);
  let readonlyMap!: ReadonlyMap<K, V>;

  const view = {
    get size(): number {
      return snapshot.size;
    },
    get(key: K): V | undefined {
      return snapshot.get(key);
    },
    has(key: K): boolean {
      return snapshot.has(key);
    },
    forEach(
      callbackfn: (value: V, key: K, map: ReadonlyMap<K, V>) => void,
      thisArg?: unknown,
    ): void {
      snapshot.forEach((value, key) => {
        callbackfn.call(thisArg, value, key, readonlyMap);
      });
    },
    entries(): IterableIterator<[K, V]> {
      return snapshot.entries();
    },
    keys(): IterableIterator<K> {
      return snapshot.keys();
    },
    values(): IterableIterator<V> {
      return snapshot.values();
    },
    [Symbol.iterator](): IterableIterator<[K, V]> {
      return snapshot[Symbol.iterator]();
    },
    get [Symbol.toStringTag](): string {
      return "ReadonlyMap";
    },
  } satisfies ReadonlyMap<K, V>;

  readonlyMap = Object.freeze(view);

  return readonlyMap;
}
