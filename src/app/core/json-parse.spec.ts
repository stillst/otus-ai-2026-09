import { lineToOffset, locateJsonError, offsetToLineColumn, parseJson } from './json-parse';

function errorOf(text: string) {
  const result = parseJson(text);
  if (result.status !== 'error') throw new Error(`expected error for ${JSON.stringify(text)}`);
  return result.error;
}

describe('parseJson', () => {
  it('reports empty input', () => {
    expect(parseJson('')).toEqual({ status: 'empty' });
    expect(parseJson('  \n\t')).toEqual({ status: 'empty' });
  });

  it('parses valid documents', () => {
    expect(parseJson('{"a": [1, 2.5, -3e2, true, null, "x"]}')).toEqual({
      status: 'ok',
      value: { a: [1, 2.5, -300, true, null, 'x'] },
    });
    expect(parseJson(' "root string" ')).toEqual({ status: 'ok', value: 'root string' });
  });

  it('locates a trailing comma in an object', () => {
    const error = errorOf('{\n  "a": 1,\n}');
    expect(error).toMatchObject({ line: 3, column: 1, hint: 'Remove the trailing comma before }.' });
  });

  it('locates a trailing comma in an array', () => {
    const error = errorOf('[1, 2, ]');
    expect(error).toMatchObject({ line: 1, column: 8, hint: 'Remove the trailing comma before ].' });
  });

  it('explains single-quoted strings and keys', () => {
    expect(errorOf("{'a': 1}")).toMatchObject({ line: 1, column: 2, message: 'Single-quoted key' });
    expect(errorOf("{\"a\": 'x'}")).toMatchObject({ line: 1, column: 7, message: 'Single-quoted string' });
  });

  it('explains unquoted keys', () => {
    expect(errorOf('{a: 1}')).toMatchObject({ column: 2, hint: 'Object keys must be strings in double quotes: "key": value.' });
  });

  it('locates a missing comma between members', () => {
    const error = errorOf('{\n  "a": 1\n  "b": 2\n}');
    expect(error).toMatchObject({ line: 3, column: 3 });
    expect(error.message).toContain("Expected ',' or '}'");
  });

  it('locates a missing comma between elements', () => {
    expect(errorOf('[1 2]')).toMatchObject({ column: 4, hint: 'Separate elements with a comma or close the array with ].' });
  });

  it('rejects comments', () => {
    expect(errorOf('{\n  // note\n  "a": 1\n}')).toMatchObject({ line: 2, column: 3, message: 'Comment' });
  });

  it('rejects JavaScript-only literals', () => {
    expect(errorOf('{"a": undefined}')).toMatchObject({ column: 7, message: "'undefined' is not valid JSON" });
    expect(errorOf('[NaN]')).toMatchObject({ column: 2, hint: 'Use null or a number instead.' });
    expect(errorOf('[True]')).toMatchObject({ column: 2, hint: 'Literals are lowercase: true.' });
  });

  it('locates an unterminated string at its opening quote', () => {
    expect(errorOf('{"a": "oops}')).toMatchObject({ column: 7, message: 'Unterminated string', hint: 'Add the closing double quote.' });
  });

  it('rejects raw line breaks inside strings', () => {
    expect(errorOf('{"a": "line\nbreak"}')).toMatchObject({ line: 1, column: 12, message: 'Line break inside a string' });
  });

  it('rejects content after the root value', () => {
    expect(errorOf('{} {}')).toMatchObject({ column: 4 });
    expect(errorOf('{} {}').message).toContain('after the end of the document');
  });

  it('rejects bad numbers', () => {
    expect(errorOf('[01]')).toMatchObject({ hint: 'Leading zeros are not allowed.' });
    expect(errorOf('[1.2.3]')).toMatchObject({ hint: 'Only one decimal point is allowed.' });
  });

  it('reports a missing closing brace at the end of input', () => {
    const error = errorOf('{"a": 1');
    expect(error).toMatchObject({ column: 8, hint: 'Close the object with }.' });
  });

  it('reports an unexpected end of input', () => {
    expect(errorOf('{"a": ')).toMatchObject({ message: 'Unexpected end of input' });
  });
});

describe('offset helpers', () => {
  it('converts offsets to 1-based line and column', () => {
    const text = 'ab\ncd\nef';
    expect(offsetToLineColumn(text, 0)).toEqual({ line: 1, column: 1 });
    expect(offsetToLineColumn(text, 3)).toEqual({ line: 2, column: 1 });
    expect(offsetToLineColumn(text, 7)).toEqual({ line: 3, column: 2 });
    expect(offsetToLineColumn(text, 99)).toEqual({ line: 3, column: 3 });
  });

  it('converts a line number to the offset of its first character', () => {
    const text = 'ab\ncd\nef';
    expect(lineToOffset(text, 1)).toBe(0);
    expect(lineToOffset(text, 2)).toBe(3);
    expect(lineToOffset(text, 3)).toBe(6);
    expect(lineToOffset(text, 9)).toBe(text.length);
  });

  it('never throws from the locator on arbitrary garbage', () => {
    for (const text of ['}', ']', '{"a"}', '{"a":}', 'nul', '"\\x"', '"\\u12"', '-', '[,]', '{,}']) {
      expect(() => locateJsonError(text)).not.toThrow();
    }
  });
});
