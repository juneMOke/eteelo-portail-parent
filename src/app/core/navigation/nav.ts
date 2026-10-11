import { IconName } from '../../shared/ui/icon/icons';

export type NavEntryId =
  | 'home'
  | 'homework'
  | 'assessments'
  | 'timetable'
  | 'grades-week'
  | 'courses'
  | 'report-card'
  | 'attendance'
  | 'discipline'
  | 'fees'
  | 'receipts'
  | 'payments'
  | 'messages'
  | 'notifications';

export interface NavEntry {
  readonly id: NavEntryId;
  /** Libellé de la tuile et du menu : les mêmes mots partout, 20 caractères au plus. */
  readonly title: string;
  readonly icon: IconName;
  /** Chemin relatif à /c/:childId. */
  readonly path: string;
}

export interface NavGroup {
  readonly title: string;
  readonly entries: readonly NavEntry[];
}

export const HOME_ENTRY: NavEntry = { id: 'home', title: 'Accueil', icon: 'home', path: '' };

/**
 * Catalogue unique de la navigation : les cinq groupes de l'Accueil, dans l'ordre fixe de la
 * spec. Le menu latéral le lit à plat, l'Accueil groupé.
 */
export const NAV_GROUPS: readonly NavGroup[] = [
  {
    title: 'Préparer ma semaine',
    entries: [
      { id: 'homework', title: 'Mes devoirs', icon: 'file-text', path: 'homework' },
      { id: 'assessments', title: 'Mes évaluations', icon: 'clipboard-check', path: 'assessments' },
      { id: 'timetable', title: 'Mon emploi du temps', icon: 'clock', path: 'timetable' },
    ],
  },
  {
    title: 'Mes notes',
    entries: [
      { id: 'grades-week', title: 'Ma semaine', icon: 'calendar', path: 'grades/week' },
      { id: 'courses', title: 'Mes cours', icon: 'book', path: 'grades/courses' },
      { id: 'report-card', title: 'Mon bulletin', icon: 'award', path: 'grades/report-card' },
    ],
  },
  {
    title: 'Ma conduite',
    entries: [
      { id: 'attendance', title: 'Ma présence', icon: 'calendar', path: 'conduct/attendance' },
      { id: 'discipline', title: 'Ma discipline', icon: 'shield', path: 'conduct/discipline' },
    ],
  },
  {
    title: 'Mes finances',
    entries: [
      { id: 'fees', title: 'Mes frais', icon: 'wallet', path: 'finance/fees' },
      { id: 'receipts', title: 'Mes reçus', icon: 'file-text', path: 'finance/receipts' },
      { id: 'payments', title: 'Mes paiements', icon: 'dollar', path: 'finance/payments' },
    ],
  },
  {
    title: 'Ma communication',
    entries: [
      { id: 'messages', title: 'Mes messages', icon: 'mail', path: 'messages' },
      { id: 'notifications', title: 'Mes notifications', icon: 'bell', path: 'notifications' },
    ],
  },
];

/** Accueil puis toutes les pages, dans l'ordre des groupes : la liste du menu latéral. */
export const NAV_ENTRIES: readonly NavEntry[] = [
  HOME_ENTRY,
  ...NAV_GROUPS.flatMap((group) => group.entries),
];

export function navEntry(id: NavEntryId): NavEntry {
  const entry = NAV_ENTRIES.find((candidate) => candidate.id === id);
  if (!entry) throw new Error(`Entrée de navigation inconnue : ${id}`);
  return entry;
}
