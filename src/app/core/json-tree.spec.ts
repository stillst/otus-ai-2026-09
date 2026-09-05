import { ancestorsOf, buildJsonTree, containerPaths, containerPathsUpToDepth, displayValue, flattenJsonTree, nodeIndex, serializeValue } from './json-tree';

const sample = { name: 'otus', items: [1, { deep: null }], ok: true };

describe('buildJsonTree', () => {
  it('assigns paths, kinds, sizes and depths', () => {
    const root = buildJsonTree(sample);
    expect(root).toMatchObject({ path: '$', parentPath: null, key: null, kind: 'object', size: 3, depth: 0 });
    const items = root.children![1];
    expect(items).toMatchObject({ path: '$.items', parentPath: '$', key: 'items', kind: 'array', size: 2, depth: 1 });
    expect(items.children![1].children![0]).toMatchObject({ path: '$.items[1].deep', key: 'deep', kind: 'null', size: 0, depth: 3 });
  });

  it('handles primitive roots', () => {
    expect(buildJsonTree(42)).toMatchObject({ path: '$', kind: 'number', size: 0 });
    expect(buildJsonTree(42).children).toBeUndefined();
  });
});

describe('flattenJsonTree', () => {
  it('lists nodes in document order', () => {
    const flat = flattenJsonTree(buildJsonTree(sample)).map((n) => n.path);
    expect(flat).toEqual(['$', '$.name', '$.items', '$.items[0]', '$.items[1]', '$.items[1].deep', '$.ok']);
  });
});

describe('ancestorsOf', () => {
  it('returns ancestors nearest first', () => {
    const index = nodeIndex(flattenJsonTree(buildJsonTree(sample)));
    expect(ancestorsOf('$.items[1].deep', index)).toEqual(['$.items[1]', '$.items', '$']);
    expect(ancestorsOf('$', index)).toEqual([]);
    expect(ancestorsOf('$.missing', index)).toEqual([]);
  });
});

describe('container paths', () => {
  it('limits default expansion by depth', () => {
    const root = buildJsonTree({ a: { b: { c: { d: 1 } } }, list: [[1]] });
    expect(containerPathsUpToDepth(root, 1).sort()).toEqual(['$', '$.a', '$.list']);
    expect(containerPathsUpToDepth(root, 2).sort()).toEqual(['$', '$.a', '$.a.b', '$.list', '$.list[0]']);
    expect(containerPaths(root).sort()).toEqual(['$', '$.a', '$.a.b', '$.a.b.c', '$.list', '$.list[0]']);
  });
});

describe('value text', () => {
  it('serializes strings raw and containers pretty-printed', () => {
    const root = buildJsonTree(sample);
    expect(serializeValue(root.children![0])).toBe('otus');
    expect(serializeValue(root.children![1])).toBe('[\n  1,\n  {\n    "deep": null\n  }\n]');
    expect(serializeValue(root.children![2])).toBe('true');
  });

  it('displays strings quoted and other primitives plainly', () => {
    const root = buildJsonTree({ s: 'a "q"', n: 1.5, b: false, z: null });
    expect(root.children!.map(displayValue)).toEqual(['"a \\"q\\""', '1.5', 'false', 'null']);
  });
});
