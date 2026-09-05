import { TestBed } from '@angular/core/testing';
import { JsonDocumentStore } from '../../core/json-document-store';
import { SearchStore } from './search-store';
import { TreeExpansionStore } from './tree-expansion-store';

describe('SearchStore', () => {
  let search: SearchStore;
  let expansion: TreeExpansionStore;

  beforeEach(() => {
    localStorage.clear();
    TestBed.inject(JsonDocumentStore).setSource('{"a": {"b": {"c": {"target": "x"}}}, "target": 1}');
    search = TestBed.inject(SearchStore);
    expansion = TestBed.inject(TreeExpansionStore);
  });

  it('finds matches and points at the first one', () => {
    search.setQuery('target');
    expect(search.matches().map((m) => m.path)).toEqual(['$.a.b.c.target', '$.target']);
    expect(search.activeIndex()).toBe(0);
    expect(search.activeMatch()?.path).toBe('$.a.b.c.target');
  });

  it('expands ancestors of the active match', () => {
    expansion.collapseAll();
    search.setQuery('target');
    expect(expansion.isExpanded('$.a.b.c')).toBe(true);
  });

  it('cycles through matches with wrap-around', () => {
    search.setQuery('target');
    search.next();
    expect(search.activeMatch()?.path).toBe('$.target');
    search.next();
    expect(search.activeMatch()?.path).toBe('$.a.b.c.target');
    search.prev();
    expect(search.activeMatch()?.path).toBe('$.target');
  });

  it('resets the active index when the query changes', () => {
    search.setQuery('target');
    search.next();
    search.setQuery('nothing-here');
    expect(search.activeIndex()).toBe(-1);
    expect(search.activeMatch()).toBeNull();
  });
});
