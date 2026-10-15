import { formatDate } from '@angular/common';
import {
  ChangeDetectionStrategy,
  Component,
  LOCALE_ID,
  computed,
  inject,
  input,
  output,
} from '@angular/core';
import { Term } from '../../../../core/api/grades.contract';
import { civilToDate } from '../../../../shared/date/civil-date';
import {
  PillGroupComponent,
  PillOption,
} from '../../../../shared/ui/pill-group/pill-group.component';

/**
 * Les deux rangées de pilules de ③ : « Trimestre » puis « Période » (« Tout le trimestre », les
 * périodes, l'examen). Une pilule à venir est affichée mais inactive, avec sa date d'ouverture.
 */
@Component({
  selector: 'app-term-options',
  imports: [PillGroupComponent],
  template: `
    <ui-pill-group
      label="Trimestre"
      [options]="termOptions()"
      [checked]="termId()"
      (pick)="pickTerm($event)"
    />
    <ui-pill-group
      label="Période"
      [options]="periodOptions()"
      [checked]="periodId()"
      (pick)="periodPick.emit($event)"
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
  readonly terms = input.required<readonly Term[]>();
  /** Trimestre dont on montre les périodes. */
  readonly termId = input.required<string>();
  /** Période cochée ; null pour « Tout le trimestre », undefined si aucune ne l'est. */
  readonly periodId = input<string | null | undefined>(undefined);
  readonly termPick = output<string>();
  readonly periodPick = output<string | null>();

  private readonly locale = inject(LOCALE_ID);

  protected readonly termOptions = computed(() =>
    this.terms().map((term) => this.option(term.termId, term.label, term.available, term.opensOn)),
  );
  protected readonly periodOptions = computed(() => {
    const term = this.terms().find((candidate) => candidate.termId === this.termId());
    if (!term) return [];
    return [
      this.option(null, 'Tout le trimestre', term.available, term.opensOn),
      ...term.periods.map((p) => this.option(p.periodId, p.label, p.available, p.opensOn)),
    ];
  });

  protected pickTerm(termId: string | null): void {
    if (termId) this.termPick.emit(termId);
  }

  private option(
    id: string | null,
    label: string,
    available: boolean,
    opensOn: string,
  ): PillOption {
    const hint = available
      ? null
      : `Ouvre le ${formatDate(civilToDate(opensOn), 'dd/MM', this.locale, 'UTC')}`;
    return { id, label, available, hint };
  }
}
