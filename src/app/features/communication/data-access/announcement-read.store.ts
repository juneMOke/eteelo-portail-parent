import { inject } from '@angular/core';
import { patchState, signalStore, withMethods, withState } from '@ngrx/signals';
import { firstValueFrom } from 'rxjs';
import {
  ParentAnnouncement,
  ParentAnnouncementReadResult,
} from '../../../core/api/announcements.contract';
import { ParentApi } from '../../../core/api/parent-api';
import { SessionStore } from '../../../core/session/session.store';

interface ReadState {
  /** Annonces dont la lecture est en cours d'envoi. */
  pending: readonly string[];
}

const initialState: ReadState = { pending: [] };

/**
 * La lecture des annonces : ouvrir une fiche non lue la marque lue au serveur (POST idempotent,
 * sous CSRF). Le badge de l'enfant prend le compte rendu par le serveur (A1), sans calcul. Un
 * échec ne se signale pas : l'annonce reste non lue et sa prochaine ouverture réessaie. Un store
 * par page.
 */
export const AnnouncementReadStore = signalStore(
  withState(initialState),
  withMethods((store, api = inject(ParentApi), session = inject(SessionStore)) => ({
    /** La réponse du serveur ; null si l'annonce était déjà lue, déjà en cours, ou en échec. */
    async markRead(
      childId: string,
      announcement: ParentAnnouncement,
    ): Promise<ParentAnnouncementReadResult | null> {
      const { id } = announcement;
      if (announcement.readAt !== null || store.pending().includes(id)) return null;
      patchState(store, { pending: [...store.pending(), id] });
      try {
        const result = await firstValueFrom(api.markAnnouncementRead(childId, id));
        session.setUnreadAnnouncements(childId, result.unreadAnnouncements);
        return result;
      } catch {
        return null;
      } finally {
        patchState(store, { pending: store.pending().filter((pending) => pending !== id) });
      }
    },
  })),
);
