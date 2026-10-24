import {
  AnnouncementCategory,
  ParentAnnouncement,
  ParentAnnouncementList,
  ParentAnnouncementReadResult,
} from '../../../core/api/announcements.contract';
import { addDays } from '../../../shared/date/civil-date';
import { compactDayLabel, spokenDay } from '../../../shared/format/day-labels';
import { zonedDay, zonedTime } from '../../../shared/format/zoned-time';
import { Tone } from '../../../shared/ui/tone';

/** Mise en forme des annonces : catégorie, date d'envoi au fuseau de l'école. */

export interface CategoryView {
  readonly label: string;
  readonly tone: Tone;
}

const CATEGORIES: Record<string, CategoryView> = {
  INFO: { label: 'Information', tone: 'info' },
  URGENT: { label: 'Urgent', tone: 'alert' },
  EVENT: { label: 'Événement', tone: 'pending' },
  ADMINISTRATIVE: { label: 'Administratif', tone: 'neutral' },
};

/** Les libellés de l'écran Communication de l'école ; une catégorie inconnue reste neutre. */
export function categoryView(category: AnnouncementCategory): CategoryView {
  return CATEGORIES[category] ?? { label: 'Annonce', tone: 'neutral' };
}

/** « Aujourd’hui · 9 h 30 », « Hier · 17 h 05 », « Sam. 24/10 · 9 h 30 » : la date d'une carte. */
export function sentAtLabel(
  announcement: ParentAnnouncement,
  timeZone: string,
  now: Date,
  locale: string,
): string {
  const day = zonedDay(announcement.sentAt, timeZone);
  const today = zonedDay(now, timeZone);
  const label =
    day === today
      ? 'Aujourd’hui'
      : day === addDays(today, -1)
        ? 'Hier'
        : compactDayLabel(day, locale);
  return `${label} · ${zonedTime(announcement.sentAt, timeZone)}`;
}

/** « Samedi 24 octobre · 9 h 30 » : la date sous le titre de la fiche. */
export function sentAtLong(
  announcement: ParentAnnouncement,
  timeZone: string,
  locale: string,
): string {
  const day = zonedDay(announcement.sentAt, timeZone);
  return `${spokenDay(day, locale)} · ${zonedTime(announcement.sentAt, timeZone)}`;
}

/** La liste après la lecture d'une annonce : l'annonce et le compte, tels que rendus par le serveur. */
export function withRead(
  list: ParentAnnouncementList,
  { announcement, unreadAnnouncements }: ParentAnnouncementReadResult,
): ParentAnnouncementList {
  return {
    ...list,
    unreadCount: unreadAnnouncements,
    items: list.items.map((item) => (item.id === announcement.id ? announcement : item)),
  };
}
