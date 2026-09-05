import { Component, computed, DestroyRef, ElementRef, inject, linkedSignal, output, signal, viewChild } from '@angular/core';
import { JsonDocumentStore } from '../../core/json-document-store';
import { offsetToLineColumn } from '../../core/json-parse';
import { formatBytes } from '../../core/text-file';
import { FileDrop } from './file-drop';

const PARSE_DEBOUNCE_MS = 300;

@Component({
  selector: 'app-source-editor',
  imports: [FileDrop],
  template: `
    <div class="editor" appFileDrop (fileDropped)="fileDropped.emit($event)">
      <label class="visually-hidden" for="json-source">JSON source</label>
      <textarea
        #area
        id="json-source"
        class="mono"
        wrap="off"
        spellcheck="false"
        autocapitalize="off"
        autocomplete="off"
        placeholder="Paste JSON here or drop a file"
        [value]="draft()"
        [attr.aria-invalid]="error() ? 'true' : null"
        aria-describedby="source-status"
        (input)="onInput($event)"
        (keyup)="updateCaret()"
        (click)="updateCaret()"
        (select)="updateCaret()"
      ></textarea>
      <div class="drop-hint" aria-hidden="true">Drop the file to open it</div>
    </div>
    <div class="status" id="source-status" role="status">
      @if (error(); as error) {
        <p class="message error">
          <span class="where">Line {{ error.line }}, column {{ error.column }}:</span>
          {{ error.message }}.
          @if (error.hint) {
            <span class="hint">{{ error.hint }}</span>
          }
          <button type="button" class="btn btn-quiet jump" (click)="jumpToError()">Go to error</button>
        </p>
      } @else if (doc.parseResult().status === 'ok') {
        <p class="message">Valid JSON · {{ stats().lines }} {{ stats().lines === 1 ? 'line' : 'lines' }} · {{ size() }}</p>
      } @else {
        <p class="message muted">Paste JSON or drop a file to get started</p>
      }
      <p class="caret mono"><span class="visually-hidden">Cursor position: </span>Ln {{ caret().line }}, Col {{ caret().column }}</p>
    </div>
  `,
  styles: `
    :host {
      display: flex;
      flex-direction: column;
      min-height: 0;
      flex: 1;
    }
    .editor {
      position: relative;
      display: flex;
      flex: 1;
      min-height: 0;
    }
    textarea {
      flex: 1;
      width: 100%;
      min-height: 0;
      resize: none;
      border: 0;
      padding: 0.75rem 1rem;
      background: var(--surface);
      color: var(--ink);
      font-size: 13px;
      line-height: 1.6;
      tab-size: 2;
    }
    textarea::placeholder {
      color: var(--muted);
    }
    textarea:focus-visible {
      outline-offset: -2px;
    }
    .drop-hint {
      position: absolute;
      inset: 0.5rem;
      display: none;
      place-items: center;
      border: 2px dashed var(--signal);
      border-radius: var(--radius);
      background: color-mix(in srgb, var(--signal-soft) 85%, transparent);
      color: var(--signal);
      font-weight: 600;
      pointer-events: none;
    }
    .editor.drop-active .drop-hint {
      display: grid;
    }
    .status {
      display: flex;
      align-items: baseline;
      gap: 1rem;
      min-height: 2.25rem;
      padding: 0.375rem 1rem;
      border-top: 1px solid var(--rail-soft);
      background: var(--surface-2);
      font-size: 12px;
    }
    .message {
      flex: 1;
      margin: 0;
    }
    .muted {
      color: var(--muted);
    }
    .error {
      color: var(--error);
    }
    .where {
      font-weight: 600;
    }
    .hint {
      color: var(--ink);
    }
    .jump {
      min-height: 1.5rem;
      margin-left: 0.25rem;
      padding: 0 0.5rem;
      font-size: 12px;
      color: var(--signal);
    }
    .caret {
      margin: 0;
      color: var(--muted);
      white-space: nowrap;
    }
  `,
})
export class SourceEditor {
  protected readonly doc = inject(JsonDocumentStore);
  private readonly destroyRef = inject(DestroyRef);
  private readonly area = viewChild.required<ElementRef<HTMLTextAreaElement>>('area');
  private timer: ReturnType<typeof setTimeout> | undefined;

  readonly fileDropped = output<File>();

  /** What the user is typing. Resets when the document changes from elsewhere (Beautify, file load). */
  protected readonly draft = linkedSignal(() => this.doc.source());
  protected readonly caret = signal({ line: 1, column: 1 });
  protected readonly error = this.doc.error;
  protected readonly stats = this.doc.stats;
  protected readonly size = computed(() => formatBytes(this.stats().bytes));

  constructor() {
    this.destroyRef.onDestroy(() => clearTimeout(this.timer));
  }

  protected onInput(event: Event): void {
    const value = (event.target as HTMLTextAreaElement).value;
    this.draft.set(value);
    clearTimeout(this.timer);
    this.timer = setTimeout(() => this.doc.setSource(this.draft()), PARSE_DEBOUNCE_MS);
    this.updateCaret();
  }

  protected updateCaret(): void {
    const el = this.area().nativeElement;
    this.caret.set(offsetToLineColumn(el.value, el.selectionStart));
  }

  protected jumpToError(): void {
    const error = this.error();
    if (!error) return;
    const el = this.area().nativeElement;
    const offset = Math.min(error.offset, el.value.length);
    el.focus();
    el.setSelectionRange(offset, Math.min(offset + 1, el.value.length));
    const lineHeight = parseFloat(getComputedStyle(el).lineHeight) || 20;
    el.scrollTop = Math.max(0, (error.line - 1) * lineHeight - el.clientHeight / 2);
    el.scrollLeft = 0;
    this.caret.set({ line: error.line, column: error.column });
  }
}
