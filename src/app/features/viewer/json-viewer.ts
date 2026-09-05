import { Component, inject } from '@angular/core';
import { ClipboardWriter } from '../../core/clipboard';
import { JsonDocumentStore } from '../../core/json-document-store';
import { serializeValue } from '../../core/json-tree';
import { ToastStore } from '../../shared/toast/toast-store';
import { JsonTree } from './json-tree';
import { SAMPLE_JSON } from './sample';
import { SearchBar } from './search-bar';
import { TreeSelectionStore } from './tree-selection-store';

const BRANCHES = ['object', 'array', 'string', 'number', 'true', 'false', 'null'] as const;

@Component({
  selector: 'app-json-viewer',
  imports: [SearchBar, JsonTree],
  template: `
    @if (doc.root(); as root) {
      <app-search-bar />
      <div class="scroll">
        <app-json-tree [root]="root" />
      </div>
      <div class="node-bar">
        @if (selection.selectedNode(); as node) {
          <code class="path">{{ node.path }}</code>
          <button type="button" class="btn btn-quiet small" (click)="copy(node.path, 'Path copied')">Copy path</button>
          <button type="button" class="btn btn-quiet small" (click)="copy(serialize(node), 'Value copied')">Copy value</button>
        } @else {
          <span class="muted">Select a node to see its path</span>
        }
      </div>
    } @else {
      <div class="empty">
        <svg class="railroad" viewBox="0 0 340 232" aria-hidden="true" focusable="false">
          <path class="track" d="M0 20H40M298 20H340M40 20V196M298 20V196" />
          @for (branch of branches; track branch; let i = $index) {
            @if (i === 0) {
              <path class="track" d="M40 20H88M250 20H298" />
            } @else {
              <path class="track" [attr.d]="'M40 ' + (12 + 32 * i) + 'a8 8 0 0 0 8 8H88M250 ' + (20 + 32 * i) + 'H290a8 8 0 0 0 8 -8'" />
            }
            @if (i < 2) {
              <rect class="box nonterminal" x="88" [attr.y]="8 + 32 * i" width="162" height="24" />
            } @else {
              <rect class="box terminal" x="88" [attr.y]="8 + 32 * i" width="162" height="24" rx="12" />
            }
            <text class="label" x="169" [attr.y]="24 + 32 * i">{{ branch }}</text>
          }
        </svg>
        @if (doc.error()) {
          <p class="lead">Fix the error in the source to see the tree.</p>
        } @else {
          <p class="lead">Paste JSON or drop a file to see its structure.</p>
          <button type="button" class="btn" (click)="loadSample()">Load a sample</button>
        }
      </div>
    }
  `,
  styles: `
    :host {
      display: flex;
      flex-direction: column;
      flex: 1;
      min-height: 0;
    }
    .scroll {
      flex: 1;
      min-height: 0;
      overflow: auto;
    }
    .node-bar {
      display: flex;
      align-items: center;
      gap: 0.5rem;
      min-height: 2.25rem;
      padding: 0.25rem 0.75rem;
      border-top: 1px solid var(--rail-soft);
      background: var(--surface-2);
      font-size: 12px;
    }
    .path {
      flex: 1;
      min-width: 0;
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;
      font-family: var(--font-mono);
      color: var(--ink);
    }
    .muted {
      flex: 1;
      color: var(--muted);
    }
    .small {
      min-height: 1.5rem;
      padding-inline: 0.5rem;
      font-size: 12px;
      color: var(--signal);
    }
    .empty {
      flex: 1;
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      gap: 1rem;
      padding: 2rem 1rem;
      text-align: center;
    }
    .railroad {
      width: min(100%, 340px);
      height: auto;
    }
    .track {
      fill: none;
      stroke: var(--rail);
      stroke-width: 2;
    }
    .box {
      fill: var(--surface);
      stroke: var(--rail);
      stroke-width: 1.5;
    }
    .box.nonterminal {
      stroke: var(--signal);
    }
    .label {
      fill: var(--ink);
      font-family: var(--font-mono);
      font-size: 13px;
      text-anchor: middle;
    }
    .lead {
      margin: 0;
      color: var(--muted);
      max-width: 30ch;
    }
  `,
})
export class JsonViewer {
  protected readonly doc = inject(JsonDocumentStore);
  protected readonly selection = inject(TreeSelectionStore);
  private readonly clipboard = inject(ClipboardWriter);
  private readonly toast = inject(ToastStore);

  protected readonly branches = BRANCHES;
  protected readonly serialize = serializeValue;

  protected async copy(text: string, done: string): Promise<void> {
    const ok = await this.clipboard.copy(text);
    this.toast.show(ok ? done : 'Copy failed');
  }

  protected loadSample(): void {
    this.doc.setSource(SAMPLE_JSON);
  }
}
