import { ChangeDetectionStrategy, Component, computed, input, output } from '@angular/core';
import { ParentAnnouncement } from '../../../../core/api/announcements.contract';
import { BadgeComponent } from '../../../../shared/ui/badge/badge.component';
import { IconComponent } from '../../../../shared/ui/icon/icon.component';
import { categoryView } from '../../data-access/announcement-formats';

/**
 * Une annonce dans la liste de Mes messages : catégorie et date d'envoi, titre, premières lignes
 * du message (trois au plus). Une annonce non lue porte un liseré Bleu Ardoise et « Nouveau ».
 * Toute la carte ouvre la fiche, où le message se lit en entier.
 */
@Component({
  selector: 'app-announcement-card',
  imports: [BadgeComponent, IconComponent],
  templateUrl: './announcement-card.component.html',
  styleUrl: './announcement-card.component.css',
  host: { '[class.unread]': 'unread()' },
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AnnouncementCardComponent {
  readonly announcement = input.required<ParentAnnouncement>();
  /** « Hier · 9 h 30 ». */
  readonly sentAt = input.required<string>();
  readonly activate = output<void>();

  protected readonly unread = computed(() => this.announcement().readAt === null);
  protected readonly category = computed(() => categoryView(this.announcement().category));
  /** « Nouveau. Événement · Réunion des parents · Hier · 9 h 30 ». */
  protected readonly spoken = computed(
    () =>
      `${this.unread() ? 'Nouveau. ' : ''}${this.category().label} · ${this.announcement().title} · ${this.sentAt()}`,
  );
}
