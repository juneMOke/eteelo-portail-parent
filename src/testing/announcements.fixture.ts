import type {
  ParentAnnouncement,
  ParentAnnouncementList,
  ParentAnnouncementReadResult,
} from '../app/core/api/announcements.contract';

/**
 * Annonces factices de Grâce (contrat « Annonces du portail parent » v2), partagées par les tests
 * unitaires, le serveur factice de développement et les parcours Playwright. Deux non lues, dont
 * une qui cite le reste dû.
 */
export const ANNOUNCEMENT_ID = {
  meeting: '9e3f1c22-7a5b-4d1e-8f60-3b2a1c0d9e84',
  balance: '0a7b6c5d-4e3f-4a2b-9c1d-8e7f6a5b4c3d',
  closure: '3c2b1a09-8f7e-4d6c-b5a4-9382716f5e4d',
  uniform: '5d4c3b2a-1f0e-4d9c-8b7a-6f5e4d3c2b1a',
} as const;

const YEAR_ID = '5f1e2d3c-4b5a-4c6d-8e7f-0a1b2c3d4e5f';

const ITEMS: readonly ParentAnnouncement[] = [
  {
    id: ANNOUNCEMENT_ID.meeting,
    announcementId: 'c41d8a07-2e6f-4b93-a5d2-8f1e0b7c6a35',
    category: 'EVENT',
    title: 'Réunion des parents de 5e primaire B',
    body:
      'Chers parents,\nla réunion aura lieu samedi à 9 h dans la salle polyvalente.\n' +
      'Merci d’y venir avec le carnet de Grâce MBALA.',
    mentionsBalance: false,
    sentAt: '2026-10-24T08:30:00Z',
    readAt: null,
  },
  {
    id: ANNOUNCEMENT_ID.balance,
    announcementId: '7f2e9d1c-0b4a-4e8d-b3c6-5a9f1e2d7c08',
    category: 'ADMINISTRATIVE',
    title: 'Rappel : minerval du 1er trimestre',
    body: 'Le reste dû pour Grâce MBALA est de 85,00 $ + 20 000,00 FC.\nMerci de passer au guichet.',
    mentionsBalance: true,
    sentAt: '2026-10-20T07:00:00Z',
    readAt: null,
  },
  {
    id: ANNOUNCEMENT_ID.closure,
    announcementId: '1b0a9f8e-7d6c-4b5a-9483-72615f4e3d2c',
    category: 'URGENT',
    title: 'École fermée lundi 13 octobre',
    body: 'En raison des pluies, l’école restera fermée lundi. Les cours reprennent mardi.',
    mentionsBalance: false,
    sentAt: '2026-10-12T15:45:00Z',
    readAt: '2026-10-12T17:02:11Z',
  },
  {
    id: ANNOUNCEMENT_ID.uniform,
    announcementId: '6e5d4c3b-2a1f-4e0d-9c8b-7a6f5e4d3c2b',
    category: 'INFO',
    title: 'Port de l’uniforme',
    body: 'L’uniforme complet est obligatoire à partir du lundi 6 octobre.',
    mentionsBalance: false,
    sentAt: '2026-10-01T06:15:00Z',
    readAt: '2026-10-01T09:40:00Z',
  },
];

export function announcementsFixture(
  items: readonly ParentAnnouncement[] = ITEMS,
): ParentAnnouncementList {
  return {
    academicYearId: YEAR_ID,
    unreadCount: items.filter((item) => item.readAt === null).length,
    items,
  };
}

/** Réponse de « marquer lue » : la première lecture est gardée, le compte suit la liste. */
export function readResultFixture(
  list: ParentAnnouncementList,
  id: string,
  readAt = '2026-10-25T10:00:00Z',
): { list: ParentAnnouncementList; result: ParentAnnouncementReadResult } | null {
  const target = list.items.find((item) => item.id === id);
  if (!target) return null;
  const announcement = { ...target, readAt: target.readAt ?? readAt };
  const next = announcementsFixture(
    list.items.map((item) => (item.id === id ? announcement : item)),
  );
  return { list: next, result: { announcement, unreadAnnouncements: next.unreadCount } };
}
