/**
 * Contrat des annonces du portail parent (Mes messages), recopié du contrat back « Annonces du
 * portail parent » v2, figé le 25/10/2026 (amendements A1 à A4 du front compris).
 *
 * À remplacer par les types générés (`npm run api:types`) dès que ces routes sont dans
 * l'OpenAPI de staging.
 */
import { Instant } from './assignments.contract';

/** Catégorie choisie par l'école ; une valeur inconnue s'affiche de façon neutre. */
export type AnnouncementCategory = 'INFO' | 'URGENT' | 'EVENT' | 'ADMINISTRATIVE' | (string & {});

/** Un communiqué de l'école, tel que reçu par ce parent pour cet enfant. */
export interface ParentAnnouncement {
  /** L'annonce de ce parent pour cet enfant : l'id des routes et de `?announcement=`. */
  readonly id: string;
  /** Le communiqué d'origine, commun aux enfants d'un même parent. Pour regrouper seulement. */
  readonly announcementId: string;
  readonly category: AnnouncementCategory;
  /** Titre rendu à l'envoi, jamais vide. */
  readonly title: string;
  /** Message rendu à l'envoi : texte brut, sauts de ligne à respecter. */
  readonly body: string;
  /** Le message cite le reste dû au jour de l'envoi (`{montant}`, « Retards de paiement »). */
  readonly mentionsBalance: boolean;
  readonly sentAt: Instant;
  /** Première lecture dans le portail ; null = non lue. */
  readonly readAt: Instant | null;
}

/** Les annonces de l'enfant pour l'année en cours, la plus récente d'abord, sans pagination. */
export interface ParentAnnouncementList {
  readonly academicYearId: string;
  /** Égal à `unreadAnnouncements` du bootstrap. */
  readonly unreadCount: number;
  readonly items: readonly ParentAnnouncement[];
}

/** Réponse de « marquer lue » (A1) : l'annonce et le nouveau compte de non-lues de l'enfant. */
export interface ParentAnnouncementReadResult {
  readonly announcement: ParentAnnouncement;
  readonly unreadAnnouncements: number;
}
