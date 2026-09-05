import { formatBytes, loadTextFile } from './text-file';

describe('loadTextFile', () => {
  it('reads the text of a file', async () => {
    const file = new File(['{"a":1}'], 'a.json', { type: 'application/json' });
    await expect(loadTextFile(file)).resolves.toBe('{"a":1}');
  });

  it('rejects files above the limit with a friendly message', async () => {
    const file = new File(['0123456789'], 'big.json');
    await expect(loadTextFile(file, 5)).rejects.toThrow('big.json is 10 B. Files up to 5 B are supported.');
  });
});

describe('formatBytes', () => {
  it('picks a readable unit', () => {
    expect(formatBytes(512)).toBe('512 B');
    expect(formatBytes(2048)).toBe('2.0 KB');
    expect(formatBytes(3 * 1024 * 1024)).toBe('3.0 MB');
  });
});
