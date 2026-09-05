import { childPath, ROOT_PATH } from './json-path';

describe('childPath', () => {
  it('uses dot notation for identifier keys', () => {
    expect(childPath(ROOT_PATH, 'name')).toBe('$.name');
    expect(childPath('$.user', '_id$2')).toBe('$.user._id$2');
  });

  it('uses bracket notation for array indexes', () => {
    expect(childPath('$.items', 2)).toBe('$.items[2]');
  });

  it('quotes keys that are not identifiers', () => {
    expect(childPath(ROOT_PATH, 'first name')).toBe("$['first name']");
    expect(childPath(ROOT_PATH, '1st')).toBe("$['1st']");
    expect(childPath(ROOT_PATH, '')).toBe("$['']");
  });

  it('escapes quotes and backslashes inside quoted keys', () => {
    expect(childPath(ROOT_PATH, "it's")).toBe("$['it\\'s']");
    expect(childPath(ROOT_PATH, 'a\\b')).toBe("$['a\\\\b']");
  });
});
