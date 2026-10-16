import { ChangeDetectionStrategy, Component, computed, input, output, signal } from '@angular/core';
import { GradePart, GradePeriod, GradeSelection } from '../../../../core/api/grades.contract';
import { WIDE_SCREEN, mediaQuery } from '../../../../shared/layout/media-query';
import {
  FilterMenuComponent,
  FilterOption,
} from '../../../../shared/ui/filter-menu/filter-menu.component';
import { capitalized, periodUnit } from '../../data-access/grade-formats';
import { TermChoice } from '../../data-access/term-selection';
import { TermOptionsComponent } from '../term-options/term-options.component';

type Menu = 'term' | 'part';

/**
 * ③ Choix trimestre · période, partagé par Mes cours et Mon bulletin. Au grand écran, deux
 * rangées de pilules ; au téléphone, deux menus déroulants empilés, le même composant que les
 * filtres de Mes devoirs (un seul ouvert à la fois). Choisir un trimestre l'affiche en entier.
 * Le serveur ne compte pas les évaluations d'une portion : les menus n'ont pas de compteur.
 */
@Component({
  selector: 'app-term-picker',
  imports: [FilterMenuComponent, TermOptionsComponent],
  templateUrl: './term-picker.component.html',
  styleUrl: './term-picker.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class TermPickerComponent {
  readonly periods = input.required<readonly GradePeriod[]>();
  readonly selection = input.required<GradeSelection>();
  readonly selectionChange = output<TermChoice>();

  protected readonly wide = mediaQuery(WIDE_SCREEN);
  protected readonly openMenu = signal<Menu | null>(null);

  private readonly unit = computed(() => periodUnit(this.periods()));
  protected readonly unitLabel = computed(() => capitalized(this.unit()));
  protected readonly termOptions = computed(() =>
    this.periods().map((period) => option(period.periodId, period.label)),
  );
  protected readonly partOptions = computed(() => {
    const period = this.periods().find((p) => p.periodId === this.selection().periodId);
    return [
      option('ALL', `Tout le ${this.unit()}`),
      ...(period?.parts ?? []).map((part) => option(part.part, part.label)),
    ];
  });

  protected setMenu(menu: Menu, open: boolean): void {
    this.openMenu.set(open ? menu : null);
  }

  protected pickTerm(periodId: string | null): void {
    if (periodId) this.choose({ periodId, part: 'ALL' });
  }

  protected pickPart(part: GradePart | null): void {
    if (part) this.choose({ periodId: this.selection().periodId, part });
  }

  private choose(choice: TermChoice): void {
    const { periodId, part } = this.selection();
    if (choice.periodId !== periodId || choice.part !== part) this.selectionChange.emit(choice);
  }
}

function option(id: string, label: string): FilterOption {
  return { id, label, count: null, tone: null };
}
