import { parseJson } from './json-parse';

/** Returns the pretty-printed document, or null when the text is not valid JSON. */
export function beautifyJson(text: string, indent = 2): string | null {
  const result = parseJson(text);
  return result.status === 'ok' ? JSON.stringify(result.value, null, indent) : null;
}

/** Returns the compact document, or null when the text is not valid JSON. */
export function minifyJson(text: string): string | null {
  const result = parseJson(text);
  return result.status === 'ok' ? JSON.stringify(result.value) : null;
}
