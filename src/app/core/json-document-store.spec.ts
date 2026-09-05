import { TestBed } from '@angular/core/testing';
import { JsonDocumentStore } from './json-document-store';

describe('JsonDocumentStore', () => {
  let store: JsonDocumentStore;

  beforeEach(() => {
    localStorage.clear();
    store = TestBed.inject(JsonDocumentStore);
  });

  it('starts empty', () => {
    expect(store.source()).toBe('');
    expect(store.parseResult()).toEqual({ status: 'empty' });
    expect(store.root()).toBeNull();
    expect(store.stats()).toEqual({ chars: 0, bytes: 0, lines: 0, nodes: 0 });
  });

  it('derives the tree and index from the source', () => {
    store.setSource('{"a": [1, 2]}');
    expect(store.root()?.size).toBe(1);
    expect(store.flatNodes().map((n) => n.path)).toEqual(['$', '$.a', '$.a[0]', '$.a[1]']);
    expect(store.nodeByPath().get('$.a[1]')?.value).toBe(2);
    expect(store.stats().nodes).toBe(4);
  });

  it('exposes the parse error', () => {
    store.setSource('{"a": 1,}');
    expect(store.error()).toMatchObject({ line: 1, column: 9 });
    expect(store.root()).toBeNull();
  });

  it('beautifies and minifies only valid documents', () => {
    store.setSource('{"a":1}');
    store.beautify();
    expect(store.source()).toBe('{\n  "a": 1\n}');
    store.minify();
    expect(store.source()).toBe('{"a":1}');

    store.setSource('{');
    store.beautify();
    expect(store.source()).toBe('{');
  });

  it('persists the source to localStorage', () => {
    store.setSource('[1]');
    expect(localStorage.getItem('json-viewer.source')).toBe('[1]');
  });
});
