import { TreeItem, TreeItemGroup } from '@angular/aria/tree';
import { afterRenderEffect, Component, computed, ElementRef, inject, input } from '@angular/core';
import { ClipboardWriter } from '../../core/clipboard';
import { JsonNode as JsonNodeModel } from '../../core/json-node.model';
import { displayValue, serializeValue } from '../../core/json-tree';
import { Highlight } from '../../shared/highlight/highlight';
import { ToastStore } from '../../shared/toast/toast-store';
import { SearchStore } from './search-store';
import { TreeExpansionStore } from './tree-expansion-store';

/**
 * One row of the tree. The host is the `<li>` so the ARIA tree structure stays
 * `tree > treeitem > group > treeitem` without wrapper elements.
 */
@Component({
  selector: 'li[appJsonNode]',
  imports: [TreeItemGroup, Highlight],
  hostDirectives: [{ directive: TreeItem, inputs: ['value', 'parent', 'expanded', 'label'], outputs: ['expandedChange'] }],
  host: {
    class: 'node',
    '[class.is-match]': 'isMatch()',
    '[class.is-active-match]': 'isActiveMatch()',
    '[attr.data-kind]': 'node().kind',
  },
  template: `
    <div class="row">
      <span class="marker" [class.chevron]="isContainer()" [class.station]="!isContainer()" aria-hidden="true"></span>
      @if (node().key !== null) {
        <span class="key" [class.index]="isIndex()"><app-highlight [text]="keyText()" [query]="search.query()" /><span class="colon" aria-hidden="true">:</span></span>
      } @else {
        <span class="key root-key">$<span class="colon" aria-hidden="true">:</span></span>
      }
      @if (isContainer()) {
        <span class="badge">{{ badge() }}</span>
      } @else {
        <span class="value" [class]="'value value-' + node().kind"><app-highlight [text]="valueText()" [query]="search.query()" /></span>
      }
      <span class="actions">
        <button type="button" class="btn btn-quiet btn-icon" tabindex="-1" aria-label="Copy path" (click)="copyPath($event)">
          <svg aria-hidden="true" width="14" height="14" viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.5"><path d="M2 8h3l2-4 3 8 2-4h2" /></svg>
        </button>
        <button type="button" class="btn btn-quiet btn-icon" tabindex="-1" aria-label="Copy value" (click)="copyValue($event)">
          <svg aria-hidden="true" width="14" height="14" viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.5"><rect x="5.5" y="5.5" width="8" height="8" rx="1.5" /><path d="M10.5 5.5v-2a1 1 0 0 0-1-1h-6a1 1 0 0 0-1 1v6a1 1 0 0 0 1 1h2" /></svg>
        </button>
      </span>
    </div>
    @if (node().children; as children) {
      <ul role="group" class="group">
        <ng-template ngTreeItemGroup [ownedBy]="item" #group="ngTreeItemGroup">
          @for (child of children; track child.path) {
            <li
              appJsonNode
              [node]="child"
              [parent]="group"
              [value]="child.path"
              [label]="child.key === null ? '' : '' + child.key"
              [expanded]="expansion.isExpanded(child.path)"
              (expandedChange)="expansion.setExpanded(child.path, $event)"
            ></li>
          }
        </ng-template>
      </ul>
    }
  `,
  styles: `
    :host {
      position: relative;
      display: block;
      list-style: none;
      margin: 0;
      padding: 0;
      outline: none;
    }
    /* Railroad track: a vertical rail down the left of every sibling... */
    :host::before {
      content: '';
      position: absolute;
      left: calc(var(--indent) * -1 + 0.5rem);
      top: 0;
      bottom: 0;
      border-left: 2px solid var(--rail);
    }
    /* ...that curves into the last station instead of running past it. */
    :host(:last-child)::before {
      bottom: auto;
      height: calc(var(--row) / 2 + 1px);
      width: 0.75rem;
      border-bottom: 2px solid var(--rail);
      border-bottom-left-radius: 10px;
    }
    /* The root has no rail. */
    :host(.root)::before,
    :host(.root) > .row::before {
      display: none;
    }
    .row {
      position: relative;
      display: flex;
      align-items: center;
      gap: 0.375rem;
      height: var(--row);
      padding: 0 0.375rem 0 0.25rem;
      border-radius: var(--radius);
      font-family: var(--font-mono);
      font-size: 13px;
      white-space: nowrap;
    }
    /* Horizontal stub from the rail to the station. */
    .row::before {
      content: '';
      position: absolute;
      left: calc(var(--indent) * -1 + 0.5rem);
      top: calc(var(--row) / 2);
      width: 0.75rem;
      border-top: 2px solid var(--rail);
    }
    :host(:last-child) > .row::before {
      display: none;
    }
    .row:hover {
      background: var(--surface-2);
    }
    :host([aria-selected='true']) > .row {
      background: var(--signal-soft);
    }
    :host(:focus-visible) > .row {
      outline: 2px solid var(--focus);
      outline-offset: -2px;
    }
    .marker {
      flex: none;
      width: 1rem;
      height: 1rem;
      display: grid;
      place-items: center;
    }
    .station::before {
      content: '';
      width: 8px;
      height: 8px;
      border-radius: 50%;
      border: 2px solid var(--rail);
      background: var(--surface);
    }
    .chevron::before {
      content: '';
      width: 0;
      height: 0;
      border-left: 5px solid var(--muted);
      border-top: 4px solid transparent;
      border-bottom: 4px solid transparent;
      transition: transform 120ms ease;
    }
    :host([aria-expanded='true']) > .row .chevron::before {
      transform: rotate(90deg);
    }
    :host(.is-active-match) > .row .station::before {
      border-color: var(--match-active);
      background: var(--match-active);
    }
    .key {
      color: var(--ink);
      font-weight: 500;
    }
    .key.index {
      color: var(--muted);
      font-weight: 400;
    }
    .colon {
      color: var(--muted);
      margin-left: 1px;
    }
    .root-key {
      color: var(--signal);
    }
    .badge {
      color: var(--muted);
      font-size: 12px;
    }
    .value-string {
      color: var(--str);
    }
    .value-number {
      color: var(--num);
    }
    .value-boolean {
      color: var(--bool);
    }
    .value-null {
      color: var(--nil);
      font-style: italic;
    }
    .value {
      overflow: hidden;
      text-overflow: ellipsis;
      max-width: 40ch;
    }
    :host(.is-active-match) > .row .value,
    :host(.is-active-match) > .row .key {
      text-decoration: underline;
      text-decoration-color: var(--match-active);
      text-underline-offset: 3px;
    }
    .actions {
      display: none;
      margin-left: auto;
      gap: 0.125rem;
    }
    .actions .btn {
      min-height: 1.5rem;
      padding-inline: 0.25rem;
      color: var(--muted);
    }
    .actions .btn:hover {
      color: var(--ink);
    }
    .row:hover > .actions,
    :host(:focus-visible) > .row > .actions,
    :host([aria-selected='true']) > .row > .actions {
      display: inline-flex;
    }
    .group {
      margin: 0;
      padding: 0 0 0 var(--indent);
      list-style: none;
    }
  `,
})
export class JsonNode {
  protected readonly item = inject(TreeItem<string>, { self: true });
  protected readonly expansion = inject(TreeExpansionStore);
  protected readonly search = inject(SearchStore);
  private readonly clipboard = inject(ClipboardWriter);
  private readonly toast = inject(ToastStore);
  private readonly host = inject<ElementRef<HTMLElement>>(ElementRef);

  readonly node = input.required<JsonNodeModel>();

  protected readonly isContainer = computed(() => this.node().children !== undefined);
  protected readonly isIndex = computed(() => typeof this.node().key === 'number');
  protected readonly keyText = computed(() => String(this.node().key));
  protected readonly valueText = computed(() => displayValue(this.node()));
  protected readonly badge = computed(() => {
    const node = this.node();
    const n = node.size;
    if (node.kind === 'array') return `[${n}]`;
    return `{${n}}`;
  });
  protected readonly isMatch = computed(() => this.search.matchByPath().has(this.node().path));
  protected readonly isActiveMatch = computed(() => this.search.activeMatch()?.path === this.node().path);

  constructor() {
    afterRenderEffect(() => {
      if (this.isActiveMatch()) {
        this.host.nativeElement.scrollIntoView({ block: 'nearest' });
      }
    });
  }

  protected async copyPath(event: Event): Promise<void> {
    event.stopPropagation();
    const ok = await this.clipboard.copy(this.node().path);
    this.toast.show(ok ? 'Path copied' : 'Copy failed');
  }

  protected async copyValue(event: Event): Promise<void> {
    event.stopPropagation();
    const ok = await this.clipboard.copy(serializeValue(this.node()));
    this.toast.show(ok ? 'Value copied' : 'Copy failed');
  }
}
