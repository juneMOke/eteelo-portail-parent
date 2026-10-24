import {
  ChangeDetectionStrategy,
  Component,
  computed,
  input,
  output,
  viewChild,
} from '@angular/core';
import { RouterLink } from '@angular/router';
import { ParentAnnouncement } from '../../../../core/api/announcements.contract';
import { childLink, navEntry } from '../../../../core/navigation/nav';
import { BadgeComponent } from '../../../../shared/ui/badge/badge.component';
import { IconComponent } from '../../../../shared/ui/icon/icon.component';
import { SheetComponent } from '../../../../shared/ui/sheet/sheet.component';
import { categoryView } from '../../data-access/announcement-formats';

/**
 * La fiche d'une annonce, en feuille au téléphone et en panneau de 560 px au-delà : catégorie,
 * titre, date d'envoi, puis le message entier, sauts de ligne respectés. Lecture seule : on ne
 * répond pas à l'école depuis le portail. Un message qui cite le reste dû (`mentionsBalance`)
 * rappelle que ce montant date de l'envoi et mène à Mes frais, qui est à jour.
 */
@Component({
  selector: 'app-announcement-sheet',
  imports: [BadgeComponent, IconComponent, RouterLink, SheetComponent],
  templateUrl: './announcement-sheet.component.html',
  styleUrl: './announcement-sheet.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AnnouncementSheetComponent {
  readonly childId = input.required<string>();
  readonly announcement = input.required<ParentAnnouncement | undefined>();
  /** « Samedi 24 octobre · 9 h 30 ». */
  readonly sentAt = input<string | null>(null);
  readonly closed = output<void>();

  private readonly sheet = viewChild.required(SheetComponent);

  protected readonly category = computed(() => {
    const announcement = this.announcement();
    return announcement ? categoryView(announcement.category) : null;
  });
  protected readonly feesLink = computed(() => childLink(this.childId(), navEntry('fees').path));

  open(): void {
    this.sheet().open();
  }

  close(): void {
    this.sheet().close();
  }
}
