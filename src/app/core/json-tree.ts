import { JsonKind, JsonNode } from './json-node.model';
import { childPath, ROOT_PATH } from './json-path';

export function kindOf(value: unknown): JsonKind {
  if (value === null) return 'null';
  if (Array.isArray(value)) return 'array';
  switch (typeof value) {
    case 'string':
      return 'string';
    case 'number':
      return 'number';
    case 'boolean':
      return 'boolean';
    default:
      return 'object';
  }
}

export function buildJsonTree(value: unknown): JsonNode {
  return buildNode(value, ROOT_PATH, null, null, 0);
}

function buildNode(value: unknown, path: string, parentPath: string | null, key: string | number | null, depth: number): JsonNode {
  const kind = kindOf(value);
  if (kind === 'array') {
    const items = value as readonly unknown[];
    const children = items.map((item, index) => buildNode(item, childPath(path, index), path, index, depth + 1));
    return { path, parentPath, key, kind, value, children, size: children.length, depth };
  }
  if (kind === 'object') {
    const entries = Object.entries(value as Record<string, unknown>);
    const children = entries.map(([k, v]) => buildNode(v, childPath(path, k), path, k, depth + 1));
    return { path, parentPath, key, kind, value, children, size: children.length, depth };
  }
  return { path, parentPath, key, kind, value, size: 0, depth };
}

/** Pre-order traversal. */
export function flattenJsonTree(root: JsonNode): readonly JsonNode[] {
  const out: JsonNode[] = [];
  const stack: JsonNode[] = [root];
  while (stack.length) {
    const node = stack.pop()!;
    out.push(node);
    if (node.children) {
      for (let i = node.children.length - 1; i >= 0; i--) {
        stack.push(node.children[i]);
      }
    }
  }
  return out;
}

export function nodeIndex(nodes: readonly JsonNode[]): ReadonlyMap<string, JsonNode> {
  return new Map(nodes.map((node) => [node.path, node]));
}

/** Paths of all ancestors of `path`, nearest first. Excludes `path` itself. */
export function ancestorsOf(path: string, index: ReadonlyMap<string, JsonNode>): string[] {
  const out: string[] = [];
  let current = index.get(path)?.parentPath ?? null;
  while (current !== null) {
    out.push(current);
    current = index.get(current)?.parentPath ?? null;
  }
  return out;
}

/** Paths of container nodes whose depth is at most `maxDepth`. */
export function containerPathsUpToDepth(root: JsonNode, maxDepth: number): string[] {
  const out: string[] = [];
  const stack: JsonNode[] = [root];
  while (stack.length) {
    const node = stack.pop()!;
    if (!node.children || node.depth > maxDepth) continue;
    out.push(node.path);
    for (const child of node.children) stack.push(child);
  }
  return out;
}

export function containerPaths(root: JsonNode): string[] {
  return flattenJsonTree(root)
    .filter((node) => node.children !== undefined)
    .map((node) => node.path);
}

/** Text placed on the clipboard for "Copy value". */
export function serializeValue(node: JsonNode): string {
  if (node.kind === 'string') return node.value as string;
  if (node.children) return JSON.stringify(node.value, null, 2);
  return JSON.stringify(node.value);
}

/** Short display text of a primitive, as it appears in the tree. */
export function displayValue(node: JsonNode): string {
  return node.kind === 'string' ? JSON.stringify(node.value) : String(node.value);
}
