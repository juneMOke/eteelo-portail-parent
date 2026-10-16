import { ChangeDetectionStrategy, Component, computed, input, output } from '@angular/core';
import { GradePart, GradePeriod } from '../../../../core/api/grades.contract';
import {
  PillGroupComponent,
  PillOption,
} from '../../../../shared/ui/pill-group/pill-group.component';
import { capitalized, periodUnit } from '../../data-access/grade-formats';

/**
 * Les deux rangées de pilules de ③ : « Trimestre » puis « Période » (« Tout le trimestre », les
 * deux périodes, l'examen). Libellés et ordre viennent du serveur ; un cycle semestriel lit
 * « Semestre » et « Tout le semestre ».
 */
@Component({
  selector: 'app-term-options',
  imports: [PillGroupComponent],
  template: `
    <ui-pill-group
      [label]="unitLabel()"
      [options]="termOptions()"
      [checked]="periodId()"
      (pick)="pickTerm($event)"
    />
    <ui-pill-group
      label="Période"
      [options]="partOptions()"
      [checked]="part()"
      (pick)="pickPart($event)"
    />
  `,
  styles: `
    :host {
      display: flex;
      flex-direction: column;
      gap: var(--space-3);
    }
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class TermOptionsComponent {
  readonly periods = input.required<readonly GradePeriod[]>();
  /** Période scolaire dont on montre les parties. */
  readonly periodId = input.required<string>();
  /** Partie cochée ; undefined si aucune ne l'est. */
  readonly part = input<GradePart | undefined>(undefined);
  readonly termPick = output<string>();
  readonly partPick = output<GradePart>();

  private readonly unit = computed(() => periodUnit(this.periods()));
  protected readonly unitLabel = computed(() => capitalized(this.unit()));

  protected readonly termOptions = computed(() =>
    this.periods().map((period) => option(period.periodId, period.label)),
  );
  protected readonly partOptions = computed(() => {
    const period = this.periods().find((candidate) => candidate.periodId === this.periodId());
    if (!period) return [];
    return [
      option('ALL', `Tout le ${this.unit()}`),
      ...period.parts.map((part) => option(part.part, part.label)),
    ];
  });

  protected pickTerm(periodId: string | null): void {
    if (periodId) this.termPick.emit(periodId);
  }

  protected pickPart(part: string | null): void {
    if (part) this.partPick.emit(part);
  }
}

function option(id: string, label: string): PillOption {
  return { id, label, available: true, hint: null };
}
