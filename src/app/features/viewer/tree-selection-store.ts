import { computed, inject, Service, signal } from '@angular/core';
import { JsonDocumentStore } from '../../core/json-document-store';

/** The node the user last focused or clicked in the tree. */
@Service()
export class TreeSelectionStore {
  private readonly doc = inject(JsonDocumentStore);

  readonly selectedPath = signal<string | null>(null);
  readonly selectedNode = computed(() => {
    const path = this.selectedPath();
    return path === null ? null : (this.doc.nodeByPath().get(path) ?? null);
  });

  select(path: string | null): void {
    this.selectedPath.set(path);
  }
}
