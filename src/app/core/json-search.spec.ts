import { searchJsonNodes } from './json-search';
import { buildJsonTree, flattenJsonTree } from './json-tree';

const nodes = flattenJsonTree(buildJsonTree({ Name: 'Otus', items: [10, 'ten'], flag: true, nothing: null }));

describe('searchJsonNodes', () => {
  it('returns nothing for a blank query', () => {
    expect(searchJsonNodes(nodes, '')).toEqual([]);
    expect(searchJsonNodes(nodes, '   ')).toEqual([]);
  });

  it('matches keys and values case-insensitively', () => {
    expect(searchJsonNodes(nodes, 'otus')).toEqual([{ path: '$.Name', inKey: false, inValue: true }]);
    expect(searchJsonNodes(nodes, 'NAME')).toEqual([{ path: '$.Name', inKey: true, inValue: false }]);
  });

  it('matches numbers, booleans, null and array indexes as text', () => {
    expect(searchJsonNodes(nodes, '10').map((m) => m.path)).toEqual(['$.items[0]']);
    expect(searchJsonNodes(nodes, 'true').map((m) => m.path)).toEqual(['$.flag']);
    expect(searchJsonNodes(nodes, 'null').map((m) => m.path)).toEqual(['$.nothing']);
    expect(searchJsonNodes(nodes, '1').map((m) => m.path)).toEqual(['$.items[0]', '$.items[1]']);
  });

  it('does not match container values', () => {
    expect(searchJsonNodes(nodes, 'items')).toEqual([{ path: '$.items', inKey: true, inValue: false }]);
  });
});
