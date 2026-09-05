import { computed, inject, linkedSignal, Service } from '@angular/core';
import { JsonDocumentStore } from '../../core/json-document-store';
import { containerPaths, containerPathsUpToDepth } from '../../core/json-tree';
import { ToastStore } from '../../shared/toast/toast-store';

export const DEFAULT_EXPAND_DEPTH = 2;
/** Above this many containers, "Expand all" stops at a depth limit to keep the page responsive. */
export const EXPAND_ALL_LIMIT = 5000;
const LARGE_EXPAND_DEPTH = 4;

/** Which containers are open. Resets to the default whenever a new document is parsed. */
@Service()
export class TreeExpansionStore {
  private readonly doc = inject(JsonDocumentStore);
  private readonly toast = inject(ToastStore);

  readonly expandedPaths = linkedSignal<ReadonlySet<string>>(() => {
    const root = this.doc.root();
    return new Set(root ? containerPathsUpToDepth(root, DEFAULT_EXPAND_DEPTH) : []);
  });

  readonly count = computed(() => this.expandedPaths().size);

  isExpanded(path: string): boolean {
    return this.expandedPaths().has(path);
  }

  setExpanded(path: string, expanded: boolean): void {
    if (this.expandedPaths().has(path) === expanded) return;
    this.expandedPaths.update((current) => {
      const next = new Set(current);
      if (expanded) next.add(path);
      else next.delete(path);
      return next;
    });
  }

  toggle(path: string): void {
    this.setExpanded(path, !this.isExpanded(path));
  }

  expandPaths(paths: readonly string[]): void {
    if (paths.every((path) => this.expandedPaths().has(path))) return;
    this.expandedPaths.update((current) => {
      const next = new Set(current);
      for (const path of paths) next.add(path);
      return next;
    });
  }

  expandAll(): void {
    const root = this.doc.root();
    if (!root) return;
    const all = containerPaths(root);
    if (all.length > EXPAND_ALL_LIMIT) {
      this.expandedPaths.set(new Set(containerPathsUpToDepth(root, LARGE_EXPAND_DEPTH)));
      this.toast.show(`Large document: expanded to depth ${LARGE_EXPAND_DEPTH}`);
      return;
    }
    this.expandedPaths.set(new Set(all));
  }

  collapseAll(): void {
    const root = this.doc.root();
    this.expandedPaths.set(new Set(root ? [root.path] : []));
  }
}
