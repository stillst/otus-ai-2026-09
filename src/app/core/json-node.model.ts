export type JsonKind = 'object' | 'array' | 'string' | 'number' | 'boolean' | 'null';

export interface JsonNode {
  /** JSONPath of this node, e.g. `$.items[2].name`. */
  readonly path: string;
  readonly parentPath: string | null;
  /** Object key, array index, or null for the root. */
  readonly key: string | number | null;
  readonly kind: JsonKind;
  readonly value: unknown;
  readonly children?: readonly JsonNode[];
  /** Number of direct children for containers, 0 for primitives. */
  readonly size: number;
  readonly depth: number;
}

export interface ParseError {
  readonly message: string;
  readonly line: number;
  readonly column: number;
  readonly offset: number;
  readonly hint?: string;
}

export type ParseResult =
  | { readonly status: 'empty' }
  | { readonly status: 'ok'; readonly value: unknown }
  | { readonly status: 'error'; readonly error: ParseError };

export interface SearchMatch {
  readonly path: string;
  readonly inKey: boolean;
  readonly inValue: boolean;
}
