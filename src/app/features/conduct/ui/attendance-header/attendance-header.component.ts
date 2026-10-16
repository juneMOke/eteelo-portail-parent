import {
  ChangeDetectionStrategy,
  Component,
  LOCALE_ID,
  computed,
  inject,
  input,
} from '@angular/core';
import { AttendanceSummary } from '../../../../core/api/conduct.contract';
import {
  presenceDaysLabel,
  rateLabel,
  sinceSchoolStartLabel,
} from '../../data-access/attendance-formats';

/**
 * ① L'ordre de grandeur, une fois : « Taux de présence » depuis la rentrée, les jours qui le
 * font, puis trois compteurs au liseré de leur état (sans « Jours présents » ni « % d'absence »,
 * écarts du prototype relevés par la spec). Tout vient du serveur ; le taux reste vert savane, sans seuil d'alerte
 * (l'école n'en a donné aucun).
 */
@Component({
  selector: 'app-attendance-header',
  templateUrl: './attendance-header.component.html',
  styleUrl: './attendance-header.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AttendanceHeaderComponent {
  readonly summary = input.required<AttendanceSummary>();

  private readonly locale = inject(LOCALE_ID);

  protected readonly rate = computed(() => rateLabel(this.summary().presenceRate, this.locale));
  protected readonly days = computed(() => presenceDaysLabel(this.summary()));
  protected readonly since = computed(() => sinceSchoolStartLabel(this.summary()));
  protected readonly counters = computed(() => [
    { label: 'Absences justifiées', value: this.summary().justifiedAbsenceDays, tone: 'info' },
    { label: 'Non justifiées', value: this.summary().unjustifiedAbsenceDays, tone: 'alert' },
    { label: 'Retards', value: this.summary().lateDays, tone: 'pending' },
  ]);
}
