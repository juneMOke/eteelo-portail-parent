import { registerLocaleData } from '@angular/common';
import localeFr from '@angular/common/locales/fr';
import {
  ANNOUNCEMENT_ID,
  announcementsFixture,
  readResultFixture,
} from '../../../../testing/announcements.fixture';
import { categoryView, sentAtLabel, sentAtLong, withRead } from './announcement-formats';

registerLocaleData(localeFr);

describe('announcement-formats', () => {
  const zone = 'Africa/Kinshasa';
  const [meeting] = announcementsFixture().items;

  it('nomme chaque catégorie comme l’école, une inconnue de façon neutre', () => {
    expect(categoryView('URGENT')).toEqual({ label: 'Urgent', tone: 'alert' });
    expect(categoryView('EVENT').label).toBe('Événement');
    expect(categoryView('ADMINISTRATIVE').label).toBe('Administratif');
    expect(categoryView('INFO').label).toBe('Information');
    expect(categoryView('SONDAGE')).toEqual({ label: 'Annonce', tone: 'neutral' });
  });

  it('date une carte par rapport au jour de l’école', () => {
    // Envoyée le 24/10 à 9 h 30, heure de Kinshasa.
    expect(sentAtLabel(meeting, zone, new Date('2026-10-24T20:00:00Z'), 'fr')).toBe(
      'Aujourd’hui · 9 h 30',
    );
    expect(sentAtLabel(meeting, zone, new Date('2026-10-25T10:00:00Z'), 'fr')).toBe(
      'Hier · 9 h 30',
    );
    // 23 h 30 UTC le 24 : déjà le 25 à Kinshasa, l'annonce est d'hier.
    expect(sentAtLabel(meeting, zone, new Date('2026-10-24T23:30:00Z'), 'fr')).toBe(
      'Hier · 9 h 30',
    );
    expect(sentAtLabel(meeting, zone, new Date('2026-10-28T10:00:00Z'), 'fr')).toBe(
      'Sam. 24/10 · 9 h 30',
    );
  });

  it('date la fiche en toutes lettres', () => {
    expect(sentAtLong(meeting, zone, 'fr')).toBe('Samedi 24 octobre · 9 h 30');
  });

  it('reprend l’annonce lue et le compte rendus par le serveur', () => {
    const list = announcementsFixture();
    const { result } = readResultFixture(list, ANNOUNCEMENT_ID.meeting)!;

    const next = withRead(list, result);

    expect(next.unreadCount).toBe(1);
    expect(next.items[0].readAt).toBe(result.announcement.readAt);
    expect(next.items.slice(1)).toEqual(list.items.slice(1));
  });
});
