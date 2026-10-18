import {
  ChangeDetectionStrategy,
  Component,
  LOCALE_ID,
  computed,
  inject,
  input,
} from '@angular/core';
import { RouterLink } from '@angular/router';
import { TimetableItem, TimetableWeek } from '../../../../../core/api/timetable.contract';
import { timeLabel } from '../../../../../shared/format/time-labels';
import { IconComponent } from '../../../../../shared/ui/icon/icon.component';
import { subjectTone } from '../../../../../shared/ui/subject-tone';
import { nearDay } from '../../../data-access/school-week';
import { columnHead, dayContent, evaluationLabel } from '../../data-access/timetable-view';

interface CompactSlot {
  readonly key: string;
  /** « 7 h 30 – 9 h 00 ». */
  readonly time: string;
  readonly label: string;
  readonly room: string | null;
  readonly isBreak: boolean;
  readonly cancelled: boolean;
  readonly exam: string | null;
  readonly color: string | null;
  readonly soft: string | null;
}

interface Column {
  readonly date: string;
  readonly weekday: string;
  readonly label: string;
  readonly near: string | null;
  readonly today: boolean;
  /** Ce que la colonne dit à la place des créneaux. */
  readonly empty: string | null;
  readonly slots: readonly CompactSlot[];
}

/**
 * Carte « Cours de la semaine » (spec 04 · détail, section F), au grand écran : une colonne par
 * jour, les créneaux en compact, sans enseignant. La tête de colonne ouvre ce jour en vue jour ;
 * les créneaux, y compris ceux d'une épreuve, ne s'ouvrent pas ici.
 */
@Component({
  selector: 'app-week-schedule',
  imports: [IconComponent, RouterLink],
  templateUrl: './week-schedule.component.html',
  styleUrl: './week-schedule.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class WeekScheduleComponent {
  readonly week = input.required<TimetableWeek>();

  private readonly locale = inject(LOCALE_ID);

  protected readonly count = computed(() => {
    const count = this.week().courseCount;
    return count ? `${count} cours` : 'aucun cours';
  });

  protected readonly columns = computed<Column[]>(() => {
    const { days, today } = this.week();
    return days.map((day) => {
      const head = columnHead(day.date, this.locale);
      const content = dayContent(day);
      return {
        date: day.date,
        weekday: head.weekday,
        label: head.date,
        near: nearDay(day.date, today),
        today: day.date === today,
        empty:
          content === 'courses'
            ? null
            : content === 'unpublished'
              ? 'Pas encore publié'
              : content === 'empty'
                ? 'Aucun cours'
                : day.holidayLabel
                  ? `Congé : ${day.holidayLabel}`
                  : 'Pas d’école',
        slots: day.items.map((item) => this.slot(item)),
      };
    });
  });

  private slot(item: TimetableItem): CompactSlot {
    const time = `${timeLabel(item.start)} – ${timeLabel(item.end)}`;
    if (item.kind === 'BREAK') {
      return {
        key: `BREAK-${item.start}`,
        time,
        label: item.label,
        room: null,
        isBreak: true,
        cancelled: false,
        exam: null,
        color: null,
        soft: null,
      };
    }
    const tone = subjectTone(item.subjectCode);
    const cancelled = item.status === 'CANCELLED';
    return {
      key: `COURSE-${item.start}`,
      time,
      label: item.subjectLabel,
      room: cancelled ? 'Annulé' : (item.newRoom ?? item.room),
      isBreak: false,
      cancelled,
      exam: item.evaluation && !cancelled ? evaluationLabel(item.evaluation) : null,
      color: tone.color,
      soft: tone.soft,
    };
  }
}
