import { Component, computed, inject, output } from '@angular/core';
import { JsonDocumentStore } from '../../core/json-document-store';
import { ThemeToggle } from '../../shared/theme-toggle/theme-toggle';
import { TreeExpansionStore } from '../viewer/tree-expansion-store';

@Component({
  selector: 'app-toolbar',
  imports: [ThemeToggle],
  template: `
    <div class="toolbar" role="toolbar" aria-label="Document actions">
      <label class="btn btn-primary file">
        <input type="file" class="visually-hidden" accept=".json,application/json,text/plain" (change)="onFileChange($event)" />
        Open file
      </label>
      <button type="button" class="btn" [disabled]="!valid()" (click)="doc.beautify()">Beautify</button>
      <button type="button" class="btn" [disabled]="!valid()" (click)="doc.minify()">Minify</button>
      <span class="divider" aria-hidden="true"></span>
      <button type="button" class="btn btn-quiet" [disabled]="!valid()" (click)="expansion.expandAll()">Expand all</button>
      <button type="button" class="btn btn-quiet" [disabled]="!valid()" (click)="expansion.collapseAll()">Collapse all</button>
      <span class="spacer"></span>
      <app-theme-toggle />
    </div>
  `,
  styles: `
    .toolbar {
      display: flex;
      flex-wrap: wrap;
      align-items: center;
      gap: 0.5rem;
    }
    .file {
      position: relative;
    }
    .file:has(input:focus-visible) {
      outline: 2px solid var(--focus);
      outline-offset: 2px;
    }
    .divider {
      width: 1px;
      height: 1.25rem;
      background: var(--rail);
      margin-inline: 0.25rem;
    }
    .spacer {
      flex: 1;
    }
  `,
})
export class Toolbar {
  protected readonly doc = inject(JsonDocumentStore);
  protected readonly expansion = inject(TreeExpansionStore);
  protected readonly valid = computed(() => this.doc.parseResult().status === 'ok');

  readonly fileSelected = output<File>();

  protected onFileChange(event: Event): void {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0];
    if (file) this.fileSelected.emit(file);
    input.value = '';
  }
}
