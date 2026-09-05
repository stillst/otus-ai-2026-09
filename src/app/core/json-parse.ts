import { ParseError, ParseResult } from './json-node.model';

/**
 * Parses JSON text. Uses the native parser for the happy path and a small
 * recursive-descent scanner to locate the error, because only V8 reports a
 * position in its `JSON.parse` messages.
 */
export function parseJson(text: string): ParseResult {
  if (text.trim() === '') {
    return { status: 'empty' };
  }
  try {
    return { status: 'ok', value: JSON.parse(text) };
  } catch {
    return { status: 'error', error: locateJsonError(text) };
  }
}

export function offsetToLineColumn(text: string, offset: number): { line: number; column: number } {
  const clamped = Math.max(0, Math.min(offset, text.length));
  let line = 1;
  let lineStart = 0;
  for (let i = 0; i < clamped; i++) {
    if (text.charCodeAt(i) === 10) {
      line++;
      lineStart = i + 1;
    }
  }
  return { line, column: clamped - lineStart + 1 };
}

export function lineToOffset(text: string, line: number): number {
  let current = 1;
  for (let i = 0; i < text.length; i++) {
    if (current === line) return i;
    if (text.charCodeAt(i) === 10) current++;
  }
  return text.length;
}

class JsonSyntaxError extends Error {
  constructor(
    readonly offset: number,
    message: string,
    readonly hint?: string,
  ) {
    super(message);
  }
}

const WHITESPACE = new Set([' ', '\t', '\n', '\r']);

/** Scans the text and returns a located, explained error. Assumes the text is invalid. */
export function locateJsonError(text: string): ParseError {
  try {
    const scanner = new Scanner(text);
    scanner.parseDocument();
    return toParseError(text, new JsonSyntaxError(text.length, 'Invalid JSON'));
  } catch (e) {
    if (e instanceof JsonSyntaxError) {
      return toParseError(text, e);
    }
    throw e;
  }
}

function toParseError(text: string, e: JsonSyntaxError): ParseError {
  const { line, column } = offsetToLineColumn(text, e.offset);
  return { message: e.message, line, column, offset: e.offset, hint: e.hint };
}

class Scanner {
  private pos = 0;

  constructor(private readonly text: string) {}

  parseDocument(): void {
    this.skipWhitespace();
    if (this.pos >= this.text.length) {
      throw new JsonSyntaxError(this.pos, 'Document is empty', 'Add a JSON value such as {} or [].');
    }
    this.parseValue();
    this.skipWhitespace();
    if (this.pos < this.text.length) {
      throw new JsonSyntaxError(
        this.pos,
        `Unexpected ${this.describe()} after the end of the document`,
        'A JSON document holds exactly one value. Remove the extra content or wrap the values in an array.',
      );
    }
  }

  private parseValue(): void {
    this.skipWhitespace();
    const ch = this.peek();
    switch (ch) {
      case '{':
        return this.parseObject();
      case '[':
        return this.parseArray();
      case '"':
        return this.parseString('value');
      case "'":
        throw new JsonSyntaxError(
          this.pos,
          'Single-quoted string',
          'JSON strings must use double quotes: "text".',
        );
      case undefined:
        throw new JsonSyntaxError(this.pos, 'Unexpected end of input', 'The document ends before the value is complete.');
      default:
        if (ch === '-' || (ch >= '0' && ch <= '9')) {
          return this.parseNumber();
        }
        return this.parseLiteral();
    }
  }

  private parseObject(): void {
    this.pos++; // {
    this.skipWhitespace();
    if (this.peek() === '}') {
      this.pos++;
      return;
    }
    for (;;) {
      this.skipWhitespace();
      const ch = this.peek();
      if (ch === '}') {
        throw new JsonSyntaxError(this.pos, "Unexpected '}' after a comma", 'Remove the trailing comma before }.');
      }
      if (ch === "'") {
        throw new JsonSyntaxError(this.pos, 'Single-quoted key', 'Object keys must use double quotes: "key".');
      }
      if (ch !== '"') {
        throw new JsonSyntaxError(
          this.pos,
          `Expected a string key but found ${this.describe()}`,
          'Object keys must be strings in double quotes: "key": value.',
        );
      }
      this.parseString('key');
      this.skipWhitespace();
      if (this.peek() !== ':') {
        throw new JsonSyntaxError(this.pos, `Expected ':' but found ${this.describe()}`, 'Put a colon between the key and its value.');
      }
      this.pos++;
      this.parseValue();
      this.skipWhitespace();
      const next = this.peek();
      if (next === ',') {
        this.pos++;
        continue;
      }
      if (next === '}') {
        this.pos++;
        return;
      }
      throw new JsonSyntaxError(
        this.pos,
        `Expected ',' or '}' but found ${this.describe()}`,
        next === undefined ? 'Close the object with }.' : 'Separate members with a comma or close the object with }.',
      );
    }
  }

  private parseArray(): void {
    this.pos++; // [
    this.skipWhitespace();
    if (this.peek() === ']') {
      this.pos++;
      return;
    }
    for (;;) {
      this.skipWhitespace();
      if (this.peek() === ']') {
        throw new JsonSyntaxError(this.pos, "Unexpected ']' after a comma", 'Remove the trailing comma before ].');
      }
      this.parseValue();
      this.skipWhitespace();
      const next = this.peek();
      if (next === ',') {
        this.pos++;
        continue;
      }
      if (next === ']') {
        this.pos++;
        return;
      }
      throw new JsonSyntaxError(
        this.pos,
        `Expected ',' or ']' but found ${this.describe()}`,
        next === undefined ? 'Close the array with ].' : 'Separate elements with a comma or close the array with ].',
      );
    }
  }

  private parseString(role: 'key' | 'value'): void {
    const start = this.pos;
    this.pos++; // opening quote
    for (;;) {
      const ch = this.text[this.pos];
      if (ch === undefined) {
        throw new JsonSyntaxError(start, `Unterminated ${role === 'key' ? 'key' : 'string'}`, 'Add the closing double quote.');
      }
      if (ch === '"') {
        this.pos++;
        return;
      }
      if (ch === '\n' || ch === '\r') {
        throw new JsonSyntaxError(this.pos, 'Line break inside a string', 'Escape it as \\n or close the string first.');
      }
      if (ch === '\\') {
        const esc = this.text[this.pos + 1];
        if (esc === undefined) {
          throw new JsonSyntaxError(this.pos, 'Unterminated string', 'Add the closing double quote.');
        }
        if (esc === 'u') {
          const hex = this.text.slice(this.pos + 2, this.pos + 6);
          if (!/^[0-9a-fA-F]{4}$/.test(hex)) {
            throw new JsonSyntaxError(this.pos, 'Invalid unicode escape', 'Use four hex digits, for example \\u00e9.');
          }
          this.pos += 6;
          continue;
        }
        if (!'"\\/bfnrt'.includes(esc)) {
          throw new JsonSyntaxError(this.pos, `Invalid escape '\\${esc}'`, 'Valid escapes are \\" \\\\ \\/ \\b \\f \\n \\r \\t and \\uXXXX.');
        }
        this.pos += 2;
        continue;
      }
      if (ch.charCodeAt(0) < 0x20) {
        throw new JsonSyntaxError(this.pos, 'Control character inside a string', 'Escape control characters, for example \\t.');
      }
      this.pos++;
    }
  }

  private parseNumber(): void {
    const start = this.pos;
    const match = /^-?(0|[1-9]\d*)(\.\d+)?([eE][+-]?\d+)?/.exec(this.text.slice(this.pos));
    if (!match) {
      throw new JsonSyntaxError(start, `Invalid number`, 'Numbers look like -12, 3.5 or 1e10.');
    }
    this.pos += match[0].length;
    const next = this.peek();
    if (next !== undefined && /[\w.]/.test(next)) {
      const hint =
        next === '.' ? 'Only one decimal point is allowed.'
        : this.text[start] === '0' ? 'Leading zeros are not allowed.'
        : 'Numbers look like -12, 3.5 or 1e10.';
      throw new JsonSyntaxError(this.pos, `Invalid number`, hint);
    }
  }

  private parseLiteral(): void {
    const start = this.pos;
    const word = /^[A-Za-z_$][\w$]*/.exec(this.text.slice(this.pos))?.[0] ?? '';
    if (word === 'true' || word === 'false' || word === 'null') {
      this.pos += word.length;
      return;
    }
    if (word === 'undefined' || word === 'NaN' || word === 'Infinity') {
      throw new JsonSyntaxError(start, `'${word}' is not valid JSON`, 'Use null or a number instead.');
    }
    if (['True', 'False', 'Null', 'TRUE', 'FALSE', 'NULL'].includes(word)) {
      throw new JsonSyntaxError(start, `'${word}' is not valid JSON`, `Literals are lowercase: ${word.toLowerCase()}.`);
    }
    if (word) {
      throw new JsonSyntaxError(start, `Unexpected word '${word}'`, 'Strings must be in double quotes.');
    }
    throw new JsonSyntaxError(start, `Unexpected ${this.describe()}`, 'Expected a value: object, array, string, number, true, false or null.');
  }

  private skipWhitespace(): void {
    while (this.pos < this.text.length && WHITESPACE.has(this.text[this.pos])) {
      this.pos++;
    }
    if (this.text[this.pos] === '/' && (this.text[this.pos + 1] === '/' || this.text[this.pos + 1] === '*')) {
      throw new JsonSyntaxError(this.pos, 'Comment', 'JSON does not allow comments. Remove it.');
    }
  }

  private peek(): string | undefined {
    return this.text[this.pos];
  }

  private describe(): string {
    const ch = this.peek();
    if (ch === undefined) return 'end of input';
    if (ch === '\n') return 'line break';
    return `'${ch}'`;
  }
}
