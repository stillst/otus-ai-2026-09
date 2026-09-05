export interface TextSegment {
  readonly text: string;
  readonly match: boolean;
}

/** Splits `text` into segments, marking case-insensitive occurrences of `query`. */
export function splitHighlight(text: string, query: string): readonly TextSegment[] {
  const needle = query.trim().toLowerCase();
  if (!needle || !text) return [{ text, match: false }];
  const lower = text.toLowerCase();
  const out: TextSegment[] = [];
  let cursor = 0;
  for (;;) {
    const at = lower.indexOf(needle, cursor);
    if (at === -1) break;
    if (at > cursor) out.push({ text: text.slice(cursor, at), match: false });
    out.push({ text: text.slice(at, at + needle.length), match: true });
    cursor = at + needle.length;
  }
  if (cursor < text.length) out.push({ text: text.slice(cursor), match: false });
  return out;
}
