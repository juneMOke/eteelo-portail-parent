import {
  ChangeDetectionStrategy,
  Component,
  ElementRef,
  LOCALE_ID,
  afterNextRender,
  computed,
  inject,
  input,
} from '@angular/core';
import { RouterLink } from '@angular/router';
import { TimetableCourse, TimetableDay } from '../../../../../core/api/timetable.contract';
import { timeLabel } from '../../../../../shared/format/time-labels';
import { IconComponent } from '../../../../../shared/ui/icon/icon.component';
import { SchoolInstant, dayContent, isNow, shortDayLabel } from '../../data-access/timetable-view';
import { CourseCardComponent } from '../course-card/course-card.component';

/** Un créneau prêt à afficher : un cours ou une pause, et s'il est en cours. */
interface Slot {
  readonly key: string;
  /** « 7 h 30 ». */
  readonly start: string;
  readonly end: string;
  readonly now: boolean;
  readonly course: TimetableCourse | null;
  /** Libellé de la pause. */
  readonly label: string;
}

/**
 * Carte « Cours de la journée » (spec 04 · détail, section D) : chaque créneau est une règle
 * horaire et sa carte, de hauteur fixe. Les créneaux ne s'ouvrent pas ; seule la ligne d'une
 * épreuve mène à sa fiche. Un jour sans cours montre à la place pourquoi (H1, H2).
 */
@Component({
  selector: 'app-day-schedule',
  imports: [CourseCardComponent, IconComponent, RouterLink],
  templateUrl: './day-schedule.component.html',
  styleUrl: './day-schedule.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class DayScheduleComponent {
  readonly childId = input.required<string>();
  readonly day = input.required<TimetableDay>();
  /** L'heure de l'école ; « En ce moment » ne se pose qu'aujourd'hui. */
  readonly now = input<SchoolInstant | null>(null);

  private readonly locale = inject(LOCALE_ID);
  private readonly host = inject<ElementRef<HTMLElement>>(ElementRef);

  protected readonly content = computed(() => dayContent(this.day()));
  protected readonly count = computed(() => {
    const count = this.day().courseCount;
    return count ? `${count} cours` : 'aucun cours';
  });
  protected readonly nextDay = computed(() => {
    const next = this.day().nextSchoolDay;
    return next ? { date: next, label: shortDayLabel(next, this.locale) } : null;
  });

  protected readonly slots = computed<Slot[]>(() => {
    const day = this.day();
    const now = this.now();
    return day.items.map((item) => ({
      key: `${item.kind}-${item.start}`,
      start: timeLabel(item.start),
      end: timeLabel(item.end),
      now: isNow(item, day.date, now),
      course: item.kind === 'COURSE' ? item : null,
      label: item.kind === 'BREAK' ? item.label : '',
    }));
  });

  constructor() {
    // Ouverture (spec 04 §4) : sans animation sur « En ce moment », le créneau précédent au-dessus.
    // Calé en bas de l'écran, il ne dépend pas de la hauteur de la barre haute collante.
    afterNextRender(() => {
      const current = this.host.nativeElement.querySelector('.slot.now');
      if (!current || current.getBoundingClientRect().bottom <= window.innerHeight) return;
      current.scrollIntoView({ block: 'end' });
    });
  }
}
