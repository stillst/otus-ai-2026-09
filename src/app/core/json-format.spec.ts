import { beautifyJson, minifyJson } from './json-format';

describe('json format', () => {
  it('beautifies valid JSON with two spaces', () => {
    expect(beautifyJson('{"a":[1,2]}')).toBe('{\n  "a": [\n    1,\n    2\n  ]\n}');
  });

  it('minifies valid JSON', () => {
    expect(minifyJson('{\n  "a": [ 1, 2 ]\n}')).toBe('{"a":[1,2]}');
  });

  it('returns null for invalid or empty input', () => {
    expect(beautifyJson('{')).toBeNull();
    expect(minifyJson('')).toBeNull();
  });
});
