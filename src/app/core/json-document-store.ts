import { computed, Service, signal } from '@angular/core';
import { beautifyJson, minifyJson } from './json-format';
import { JsonNode, ParseError, ParseResult } from './json-node.model';
import { parseJson } from './json-parse';
import { buildJsonTree, flattenJsonTree, nodeIndex } from './json-tree';

const STORAGE_KEY = 'json-viewer.source';

/** Holds the source text and everything derived from it. */
@Service()
export class JsonDocumentStore {
  private readonly _source = signal(readStoredSource());

  readonly source = this._source.asReadonly();
  readonly parseResult = computed<ParseResult>(() => parseJson(this.source()));
  readonly root = computed<JsonNode | null>(() => {
    const result = this.parseResult();
    return result.status === 'ok' ? buildJsonTree(result.value) : null;
  });
  readonly flatNodes = computed<readonly JsonNode[]>(() => {
    const root = this.root();
    return root ? flattenJsonTree(root) : [];
  });
  readonly nodeByPath = computed(() => nodeIndex(this.flatNodes()));
  readonly error = computed<ParseError | null>(() => {
    const result = this.parseResult();
    return result.status === 'error' ? result.error : null;
  });
  readonly stats = computed(() => {
    const text = this.source();
    return {
      chars: text.length,
      bytes: byteLength(text),
      lines: text === '' ? 0 : text.split('\n').length,
      nodes: this.flatNodes().length,
    };
  });

  setSource(text: string): void {
    this._source.set(text);
    writeStoredSource(text);
  }

  /** Pretty-prints the document. Does nothing when the text is not valid JSON. */
  beautify(): void {
    const next = beautifyJson(this.source());
    if (next !== null) this.setSource(next);
  }

  /** Compacts the document. Does nothing when the text is not valid JSON. */
  minify(): void {
    const next = minifyJson(this.source());
    if (next !== null) this.setSource(next);
  }
}

function byteLength(text: string): number {
  return typeof TextEncoder === 'undefined' ? text.length : new TextEncoder().encode(text).length;
}

function readStoredSource(): string {
  try {
    return globalThis.localStorage?.getItem(STORAGE_KEY) ?? '';
  } catch {
    return '';
  }
}

function writeStoredSource(text: string): void {
  try {
    globalThis.localStorage?.setItem(STORAGE_KEY, text);
  } catch {
    // Storage may be full or disabled; the document still works in memory.
  }
}
