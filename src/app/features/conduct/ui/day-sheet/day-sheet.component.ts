import {
  ChangeDetectionStrategy,
  Component,
  LOCALE_ID,
  computed,
  inject,
  input,
  output,
  viewChild,
} from '@angular/core';
import { AttendanceDay } from '../../../../core/api/conduct.contract';
import { CivilDate } from '../../../../shared/date/civil-date';
import { spokenDay } from '../../../../shared/format/day-labels';
import { SheetComponent } from '../../../../shared/ui/sheet/sheet.component';
import { DayDetailComponent } from '../day-detail/day-detail.component';

/**
 * ④ La fiche du jour, en feuille au téléphone et en fenêtre au bureau. Fermer rend le focus à
 * la cellule ou à la ligne qui l'a ouverte (élément <dialog> natif).
 */
@Component({
  selector: 'app-day-sheet',
  imports: [DayDetailComponent, SheetComponent],
  template: `
    <ui-sheet [heading]="heading()">
      <app-day-detail [childId]="childId()" [day]="day()" (justify)="justify.emit($event)" />
    </ui-sheet>
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class DaySheetComponent {
  readonly childId = input.required<string>();
  readonly date = input.required<CivilDate | null>();
  readonly day = input.required<AttendanceDay | undefined>();
  readonly justify = output<string>();

  private readonly locale = inject(LOCALE_ID);
  private readonly sheet = viewChild.required(SheetComponent);

  protected readonly heading = computed(() => {
    const date = this.date();
    return date ? spokenDay(date, this.locale) : '';
  });

  open(): void {
    this.sheet().open();
  }

  close(): void {
    this.sheet().close();
  }
}
