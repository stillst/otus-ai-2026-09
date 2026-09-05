import { JsonNode, SearchMatch } from './json-node.model';
import { displayValue } from './json-tree';

/** Case-insensitive substring search over keys and primitive values. */
export function searchJsonNodes(nodes: readonly JsonNode[], query: string): readonly SearchMatch[] {
  const needle = query.trim().toLowerCase();
  if (!needle) return [];
  const out: SearchMatch[] = [];
  for (const node of nodes) {
    const inKey = node.key !== null && String(node.key).toLowerCase().includes(needle);
    const inValue = node.children === undefined && displayValue(node).toLowerCase().includes(needle);
    if (inKey || inValue) {
      out.push({ path: node.path, inKey, inValue });
    }
  }
  return out;
}
