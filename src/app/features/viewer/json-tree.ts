import { Tree } from '@angular/aria/tree';
import { Component, inject, input, signal } from '@angular/core';
import { ClipboardWriter } from '../../core/clipboard';
import { JsonNode as JsonNodeModel } from '../../core/json-node.model';
import { serializeValue } from '../../core/json-tree';
import { ToastStore } from '../../shared/toast/toast-store';
import { JsonNode } from './json-node';
import { TreeExpansionStore } from './tree-expansion-store';
import { TreeSelectionStore } from './tree-selection-store';

@Component({
  selector: 'app-json-tree',
  imports: [Tree, JsonNode],
  host: { '(keydown)': 'onKeydown($event)' },
  template: `
    <ul
      ngTree
      #tree="ngTree"
      class="tree"
      aria-label="JSON tree"
      selectionMode="follow"
      [value]="selectedPaths()"
      (valueChange)="onSelect($event)"
    >
      <li
        appJsonNode
        class="root"
        [node]="root()"
        [parent]="tree"
        [value]="root().path"
        label="$"
        [expanded]="expansion.isExpanded(root().path)"
        (expandedChange)="expansion.setExpanded(root().path, $event)"
      ></li>
    </ul>
  `,
  styles: `
    :host {
      display: block;
      --indent: 1.25rem;
    }
    .tree {
      margin: 0;
      padding: 0.5rem 0.75rem 1rem;
      list-style: none;
      min-width: max-content;
    }
    .tree:focus-visible {
      outline: none;
    }
  `,
})
export class JsonTree {
  protected readonly expansion = inject(TreeExpansionStore);
  private readonly selection = inject(TreeSelectionStore);
  private readonly clipboard = inject(ClipboardWriter);
  private readonly toast = inject(ToastStore);

  readonly root = input.required<JsonNodeModel>();
  protected readonly selectedPaths = signal<string[]>([]);

  protected onSelect(paths: string[]): void {
    this.selectedPaths.set(paths);
    this.selection.select(paths[0] ?? null);
  }

  /** Ctrl/Cmd+C copies the selected value, with Shift the path. */
  protected async onKeydown(event: KeyboardEvent): Promise<void> {
    if (!(event.ctrlKey || event.metaKey) || event.key.toLowerCase() !== 'c') return;
    const node = this.selection.selectedNode();
    if (!node || document.getSelection()?.toString()) return;
    event.preventDefault();
    const text = event.shiftKey ? node.path : serializeValue(node);
    const ok = await this.clipboard.copy(text);
    this.toast.show(ok ? (event.shiftKey ? 'Path copied' : 'Value copied') : 'Copy failed');
  }
}
