import { splitHighlight } from './split-highlight';

describe('splitHighlight', () => {
  it('returns the whole text when there is no query', () => {
    expect(splitHighlight('abc', '')).toEqual([{ text: 'abc', match: false }]);
  });

  it('marks every case-insensitive occurrence', () => {
    expect(splitHighlight('Banana', 'an')).toEqual([
      { text: 'B', match: false },
      { text: 'an', match: true },
      { text: 'an', match: true },
      { text: 'a', match: false },
    ]);
  });

  it('keeps the original casing of matched text', () => {
    expect(splitHighlight('ID', 'id')).toEqual([{ text: 'ID', match: true }]);
  });
});
