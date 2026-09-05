import { TestBed } from '@angular/core/testing';
import { JsonDocumentStore } from '../../core/json-document-store';
import { TreeExpansionStore } from './tree-expansion-store';

describe('TreeExpansionStore', () => {
  let doc: JsonDocumentStore;
  let store: TreeExpansionStore;

  beforeEach(() => {
    localStorage.clear();
    doc = TestBed.inject(JsonDocumentStore);
    store = TestBed.inject(TreeExpansionStore);
    doc.setSource('{"a": {"b": {"c": {"d": 1}}}, "list": [[1]]}');
  });

  it('expands containers up to depth 2 by default', () => {
    expect([...store.expandedPaths()].sort()).toEqual(['$', '$.a', '$.a.b', '$.list', '$.list[0]']);
    expect(store.isExpanded('$.a.b.c')).toBe(false);
  });

  it('toggles single paths and resets on a new document', () => {
    store.setExpanded('$.a.b.c', true);
    expect(store.isExpanded('$.a.b.c')).toBe(true);
    store.toggle('$.a');
    expect(store.isExpanded('$.a')).toBe(false);

    doc.setSource('{"x": {"y": 1}}');
    expect([...store.expandedPaths()].sort()).toEqual(['$', '$.x']);
  });

  it('expands and collapses everything', () => {
    store.collapseAll();
    expect([...store.expandedPaths()]).toEqual(['$']);
    store.expandAll();
    expect(store.isExpanded('$.a.b.c')).toBe(true);
  });

  it('expands a list of ancestor paths', () => {
    store.collapseAll();
    store.expandPaths(['$.a', '$.a.b']);
    expect(store.isExpanded('$.a.b')).toBe(true);
    expect(store.isExpanded('$.list')).toBe(false);
  });
});
