import { computed, inject, linkedSignal, Service, signal } from '@angular/core';
import { JsonDocumentStore } from '../../core/json-document-store';
import { SearchMatch } from '../../core/json-node.model';
import { searchJsonNodes } from '../../core/json-search';
import { ancestorsOf } from '../../core/json-tree';
import { TreeExpansionStore } from './tree-expansion-store';

/** Search state for the tree: query, matches and the active match. */
@Service()
export class SearchStore {
  private readonly doc = inject(JsonDocumentStore);
  private readonly expansion = inject(TreeExpansionStore);

  readonly query = signal('');
  readonly matches = computed<readonly SearchMatch[]>(() => searchJsonNodes(this.doc.flatNodes(), this.query()));
  readonly activeIndex = linkedSignal<number>(() => (this.matches().length ? 0 : -1));
  readonly activeMatch = computed<SearchMatch | null>(() => this.matches()[this.activeIndex()] ?? null);
  readonly matchByPath = computed(() => new Map(this.matches().map((m) => [m.path, m])));

  setQuery(query: string): void {
    this.query.set(query);
    this.revealActive();
  }

  next(): void {
    this.step(1);
  }

  prev(): void {
    this.step(-1);
  }

  private step(delta: number): void {
    const total = this.matches().length;
    if (!total) return;
    this.activeIndex.update((index) => (index + delta + total) % total);
    this.revealActive();
  }

  private revealActive(): void {
    const match = this.activeMatch();
    if (!match) return;
    this.expansion.expandPaths(ancestorsOf(match.path, this.doc.nodeByPath()));
  }
}
