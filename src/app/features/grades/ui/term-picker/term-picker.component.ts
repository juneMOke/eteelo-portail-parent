import {
  ChangeDetectionStrategy,
  Component,
  input,
  linkedSignal,
  output,
  viewChild,
} from '@angular/core';
import { TermSelection, TermTree } from '../../../../core/api/grades.contract';
import { IconComponent } from '../../../../shared/ui/icon/icon.component';
import { SheetComponent } from '../../../../shared/ui/sheet/sheet.component';
import { TermOptionsComponent } from '../term-options/term-options.component';

export type TermChoice = Pick<TermSelection, 'termId' | 'periodId'>;

/**
 * ③ Choix trimestre · période, partagé par Mes cours et Mon bulletin. Deux rangées de pilules ;
 * au téléphone, une seule ligne « 1er trimestre · 2e période ▾ » qui ouvre une feuille de choix
 * (gain de 90 px au-dessus de la liste). Dans la feuille, choisir un trimestre montre ses
 * périodes ; choisir une période valide et ferme.
 */
@Component({
  selector: 'app-term-picker',
  imports: [IconComponent, SheetComponent, TermOptionsComponent],
  templateUrl: './term-picker.component.html',
  styleUrl: './term-picker.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class TermPickerComponent {
  readonly tree = input.required<TermTree>();
  readonly selectionChange = output<TermChoice>();

  private readonly sheet = viewChild.required(SheetComponent);

  /** Trimestre parcouru dans la feuille, avant d'en choisir la période. */
  protected readonly draftTerm = linkedSignal(() => this.tree().selection.termId);

  protected openSheet(): void {
    this.draftTerm.set(this.tree().selection.termId);
    this.sheet().open();
  }

  /** En ligne : un trimestre choisi s'affiche en entier. */
  protected pickTerm(termId: string): void {
    this.choose({ termId, periodId: null });
  }

  protected pickPeriod(periodId: string | null): void {
    this.choose({ termId: this.tree().selection.termId, periodId });
  }

  protected pickDraftPeriod(periodId: string | null): void {
    this.sheet().close();
    this.choose({ termId: this.draftTerm(), periodId });
  }

  /** Période cochée dans la feuille : seulement sur le trimestre de la sélection. */
  protected draftPeriod(): string | null | undefined {
    const { termId, periodId } = this.tree().selection;
    return this.draftTerm() === termId ? periodId : undefined;
  }

  private choose(choice: TermChoice): void {
    const { termId, periodId } = this.tree().selection;
    if (choice.termId !== termId || choice.periodId !== periodId) this.selectionChange.emit(choice);
  }
}
