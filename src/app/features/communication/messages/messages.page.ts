import {
  ChangeDetectionStrategy,
  Component,
  LOCALE_ID,
  computed,
  effect,
  inject,
  input,
  untracked,
  viewChild,
} from '@angular/core';
import { ParentAnnouncement } from '../../../core/api/announcements.contract';
import { countLabel } from '../../../shared/format/count';
import { injectQueryParamSheet } from '../../../shared/navigation/query-param-sheet';
import { RefreshHighlightDirective } from '../../../shared/resource/refresh-highlight.directive';
import { latestValue } from '../../../shared/resource/latest-value';
import { EmptyStateComponent } from '../../../shared/ui/empty-state/empty-state.component';
import { LoadErrorComponent } from '../../../shared/ui/load-error/load-error.component';
import { SkeletonComponent } from '../../../shared/ui/skeleton/skeleton.component';
import { StaleNoticeComponent } from '../../../shared/ui/stale-notice/stale-notice.component';
import { sentAtLabel, sentAtLong, withRead } from '../data-access/announcement-formats';
import { AnnouncementReadStore } from '../data-access/announcement-read.store';
import { MessagesFacade } from '../data-access/messages.facade';
import { AnnouncementCardComponent } from '../ui/announcement-card/announcement-card.component';
import { AnnouncementSheetComponent } from '../ui/announcement-sheet/announcement-sheet.component';

/**
 * Mes messages : les communiqués de l'école pour l'enfant, année en cours, le plus récent en haut.
 * Lecture seule, on n'y répond pas (décision du 25/10/2026). La fiche d'une annonce vit dans
 * l'URL (`?announcement=`) : le lien « Lire dans le portail » de WhatsApp y mène. L'ouvrir la
 * marque lue ; le badge de l'enfant prend le compte rendu par le serveur.
 */
@Component({
  selector: 'app-messages-page',
  imports: [
    AnnouncementCardComponent,
    AnnouncementSheetComponent,
    EmptyStateComponent,
    LoadErrorComponent,
    RefreshHighlightDirective,
    SkeletonComponent,
    StaleNoticeComponent,
  ],
  templateUrl: './messages.page.html',
  styleUrl: './messages.page.css',
  providers: [AnnouncementReadStore],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export default class MessagesPage {
  readonly childId = input.required<string>();
  /** Annonce dont la fiche est ouverte (`?announcement=`). */
  readonly announcement = input<string>();

  private readonly facade = inject(MessagesFacade);
  private readonly reads = inject(AnnouncementReadStore);
  private readonly locale = inject(LOCALE_ID);
  private readonly sheet = viewChild(AnnouncementSheetComponent);
  private readonly now = new Date();

  protected readonly resource = this.facade.announcementsResource(this.childId);
  protected readonly data = latestValue(this.resource);

  protected readonly items = computed(() =>
    (this.data()?.items ?? []).map((announcement) => ({
      announcement,
      sentAt: sentAtLabel(announcement, this.facade.timeZone(), this.now, this.locale),
    })),
  );
  /** « 2 nouveaux », lu par les lecteurs d'écran en tête de liste. */
  protected readonly unreadLabel = computed(() =>
    countLabel(this.data()?.unreadCount ?? 0, 'nouveau message', 'nouveaux messages', ''),
  );

  protected readonly openAnnouncement = computed(() =>
    this.data()?.items.find((item) => item.id === this.announcement()),
  );
  protected readonly openSentAt = computed(() => {
    const announcement = this.openAnnouncement();
    return announcement ? sentAtLong(announcement, this.facade.timeZone(), this.locale) : null;
  });
  /** Un lien vers une annonce qui n'est pas (ou plus) dans la liste de l'année. */
  protected readonly missing = computed(
    () => !!this.announcement() && !!this.data() && !this.openAnnouncement(),
  );
  protected readonly fiche = injectQueryParamSheet('announcement', {
    selected: this.openAnnouncement,
    sheet: this.sheet,
  });

  // Effet de bord seul : une fiche non lue qui s'ouvre est marquée lue au serveur.
  private readonly reading = effect(() => {
    const open = this.openAnnouncement();
    if (open?.readAt === null) untracked(() => void this.markRead(open));
  });

  private async markRead(announcement: ParentAnnouncement): Promise<void> {
    const childId = this.childId();
    const result = await this.reads.markRead(childId, announcement);
    const list = this.resource.value();
    if (result && list && childId === this.childId()) this.resource.set(withRead(list, result));
  }
}
