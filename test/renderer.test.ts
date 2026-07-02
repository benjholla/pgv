import { describe, it, expect } from 'vitest';
import { tagToClassName } from '../src/renderer';

describe('tagToClassName', () => {
  it('converts basic alphanumeric tags correctly', () => {
    expect(tagToClassName('Entry')).toBe('tag-entry');
    expect(tagToClassName('Branch')).toBe('tag-branch');
    expect(tagToClassName('tag1')).toBe('tag-tag1');
  });

  it('preserves hyphens and underscores', () => {
    expect(tagToClassName('back-edge')).toBe('tag-back-edge');
    expect(tagToClassName('true_branch')).toBe('tag-true_branch');
  });

  it('converts multiple special characters to a single hyphen', () => {
    expect(tagToClassName('invalid!@#tag')).toBe('tag-invalid-tag');
    expect(tagToClassName('a.b.c')).toBe('tag-a-b-c');
    expect(tagToClassName('foo bar')).toBe('tag-foo-bar');
  });

  it('removes leading and trailing hyphens after processing', () => {
    expect(tagToClassName('---hello---')).toBe('tag-hello');
    expect(tagToClassName('!hello!')).toBe('tag-hello');
    expect(tagToClassName('-hello-world-')).toBe('tag-hello-world');
  });

  it('trims whitespace before processing', () => {
    expect(tagToClassName('   padded   ')).toBe('tag-padded');
    expect(tagToClassName('\t\nspaced\n\t')).toBe('tag-spaced');
  });

  it('handles entirely non-alphanumeric tags and empty strings', () => {
    expect(tagToClassName('')).toBe('tag-untagged');
    expect(tagToClassName('   ')).toBe('tag-untagged');
    expect(tagToClassName('!@#$')).toBe('tag-untagged');
    expect(tagToClassName('---')).toBe('tag-untagged');
  });

  it('evicts cache when exceeding 10,000 unique tags', () => {
    for (let i = 0; i <= 10000; i++) {
      tagToClassName(`cache-test-${i}`);
    }
    // Generating the 10,001st unique tag should trigger eviction.
    const result = tagToClassName('cache-test-overflow');
    expect(result).toBe('tag-cache-test-overflow');
  });
});
