import { describe, it, expect, vi } from 'vitest';
import { toReadonlyMap } from '../src/readonly-map';

describe('toReadonlyMap', () => {
  it('should return a map with correct size', () => {
    const original = new Map<string, number>([
      ['a', 1],
      ['b', 2],
    ]);
    const readonlyMap = toReadonlyMap(original);
    expect(readonlyMap.size).toBe(2);
  });

  it('should get elements correctly', () => {
    const original = new Map<string, number>([
      ['a', 1],
      ['b', 2],
    ]);
    const readonlyMap = toReadonlyMap(original);
    expect(readonlyMap.get('a')).toBe(1);
    expect(readonlyMap.get('b')).toBe(2);
    expect(readonlyMap.get('c')).toBeUndefined();
  });

  it('should check if elements exist using has', () => {
    const original = new Map<string, number>([
      ['a', 1],
      ['b', 2],
    ]);
    const readonlyMap = toReadonlyMap(original);
    expect(readonlyMap.has('a')).toBe(true);
    expect(readonlyMap.has('b')).toBe(true);
    expect(readonlyMap.has('c')).toBe(false);
  });

  it('should iterate over elements using forEach', () => {
    const original = new Map<string, number>([
      ['a', 1],
      ['b', 2],
    ]);
    const readonlyMap = toReadonlyMap(original);

    const callback = vi.fn();
    readonlyMap.forEach(callback);

    expect(callback).toHaveBeenCalledTimes(2);
    expect(callback).toHaveBeenCalledWith(1, 'a', readonlyMap);
    expect(callback).toHaveBeenCalledWith(2, 'b', readonlyMap);
  });

  it('should respect thisArg in forEach', () => {
    const original = new Map<string, number>([
      ['a', 1],
    ]);
    const readonlyMap = toReadonlyMap(original);

    const context = { multiplier: 2 };
    const results: number[] = [];

    readonlyMap.forEach(function(this: { multiplier: number }, value) {
      results.push(value * this.multiplier);
    }, context);

    expect(results).toEqual([2]);
  });

  it('should return correct entries iterator', () => {
    const original = new Map<string, number>([
      ['a', 1],
      ['b', 2],
    ]);
    const readonlyMap = toReadonlyMap(original);
    const entries = Array.from(readonlyMap.entries());
    expect(entries).toEqual([['a', 1], ['b', 2]]);
  });

  it('should return correct keys iterator', () => {
    const original = new Map<string, number>([
      ['a', 1],
      ['b', 2],
    ]);
    const readonlyMap = toReadonlyMap(original);
    const keys = Array.from(readonlyMap.keys());
    expect(keys).toEqual(['a', 'b']);
  });

  it('should return correct values iterator', () => {
    const original = new Map<string, number>([
      ['a', 1],
      ['b', 2],
    ]);
    const readonlyMap = toReadonlyMap(original);
    const values = Array.from(readonlyMap.values());
    expect(values).toEqual([1, 2]);
  });

  it('should return correct Symbol.iterator', () => {
    const original = new Map<string, number>([
      ['a', 1],
      ['b', 2],
    ]);
    const readonlyMap = toReadonlyMap(original);
    const entries = Array.from(readonlyMap);
    expect(entries).toEqual([['a', 1], ['b', 2]]);
  });

  it('should act as a snapshot (immutability)', () => {
    const original = new Map<string, number>([
      ['a', 1],
    ]);
    const readonlyMap = toReadonlyMap(original);

    // Modify original map after creating readonly view
    original.set('b', 2);
    original.set('a', 99);
    original.delete('a');

    // Readonly map should remain unchanged (snapshot behavior)
    expect(readonlyMap.size).toBe(1);
    expect(readonlyMap.get('a')).toBe(1);
    expect(readonlyMap.has('b')).toBe(false);
  });

  it('should return a frozen object', () => {
    const original = new Map<string, number>();
    const readonlyMap = toReadonlyMap(original);
    expect(Object.isFrozen(readonlyMap)).toBe(true);
  });
});
