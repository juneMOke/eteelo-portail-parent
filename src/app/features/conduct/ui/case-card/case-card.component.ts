import {
  ChangeDetectionStrategy,
  Component,
  LOCALE_ID,
  computed,
  inject,
  input,
} from '@angular/core';
import { RouterLink } from '@angular/router';
import { DisciplineCase } from '../../../../core/api/conduct.contract';
import { BadgeComponent } from '../../../../shared/ui/badge/badge.component';
import { IconComponent } from '../../../../shared/ui/icon/icon.component';
import { attendanceLink, linkedAttendanceParams } from '../../data-access/conduct-links';
import {
  caseMeta,
  linkedAttendanceLabel,
  revisedLabel,
  sanctionLabel,
  severityView,
  spokenCase,
} from '../../data-access/discipline-formats';

/**
 * ⑧ Un fait consigné : filet et pastille au ton de la gravité, titre, date et auteur,
 * description entière, suite donnée, lien vers l'absence liée. ⑨ sépare ce que l'école a fait
 * de ce qu'elle attend du parent. La carte ne s'ouvre pas : tout y est. Une carte ciblée
 * (depuis Ma présence) est entourée un instant.
 */
@Component({
  selector: 'app-case-card',
  imports: [BadgeComponent, IconComponent, RouterLink],
  templateUrl: './case-card.component.html',
  styleUrl: './case-card.component.css',
  host: {
    '[class.targeted]': 'targeted()',
    '[style.--case-tone]': "'var(--color-tone-' + (severity()?.tone ?? 'neutral') + ')'",
  },
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CaseCardComponent {
  readonly item = input.required<DisciplineCase>();
  readonly childId = input.required<string>();
  readonly targeted = input(false);

  private readonly locale = inject(LOCALE_ID);

  protected readonly severity = computed(() => severityView(this.item().severity));
  protected readonly meta = computed(() => caseMeta(this.item(), this.locale));
  protected readonly revised = computed(() => revisedLabel(this.item(), this.locale));
  protected readonly sanction = computed(() => sanctionLabel(this.item().sanction));
  protected readonly spoken = computed(() => spokenCase(this.item(), this.locale));
  protected readonly linkLabel = computed(() => linkedAttendanceLabel(this.item(), this.locale));
  protected readonly linkParams = computed(() => linkedAttendanceParams(this.item()));
  protected readonly link = computed(() => attendanceLink(this.childId()));
}
