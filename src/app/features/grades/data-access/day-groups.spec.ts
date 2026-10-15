import { groupByDay } from './day-groups';

describe('groupByDay', () => {
  it('regroupe par jour sans retrier', () => {
    const items = [
      { date: '2026-09-14', id: 'a' },
      { date: '2026-09-16', id: 'b' },
      { date: '2026-09-16', id: 'c' },
      { date: '2026-09-18', id: 'd' },
    ];

    expect(groupByDay(items)).toEqual([
      { date: '2026-09-14', items: [items[0]] },
      { date: '2026-09-16', items: [items[1], items[2]] },
      { date: '2026-09-18', items: [items[3]] },
    ]);
    expect(groupByDay([])).toEqual([]);
  });
});
