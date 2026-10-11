import { NAV_ENTRIES, NAV_GROUPS, navEntry } from './nav';

describe('catalogue de navigation', () => {
  it('range treize pages en cinq groupes de deux ou trois tuiles', () => {
    expect(NAV_GROUPS).toHaveLength(5);
    for (const group of NAV_GROUPS) {
      expect(group.entries.length).toBeGreaterThanOrEqual(2);
      expect(group.entries.length).toBeLessThanOrEqual(3);
    }
    expect(NAV_ENTRIES).toHaveLength(14);
  });

  it('donne à chaque page un identifiant et un chemin uniques', () => {
    expect(new Set(NAV_ENTRIES.map((e) => e.id)).size).toBe(NAV_ENTRIES.length);
    expect(new Set(NAV_ENTRIES.map((e) => e.path)).size).toBe(NAV_ENTRIES.length);
  });

  it('garde des titres de 20 caractères au plus', () => {
    for (const entry of NAV_ENTRIES) expect(entry.title.length).toBeLessThanOrEqual(20);
  });

  it('retrouve une entrée par son identifiant', () => {
    expect(navEntry('fees').path).toBe('finance/fees');
  });
});
