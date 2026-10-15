import {
  ChangeDetectionStrategy,
  Component,
  input,
  linkedSignal,
  output,
  viewChild,
} from '@angular/core';
import { GradePart, GradePeriod, GradeSelection } from '../../../../core/api/grades.contract';
import { IconComponent } from '../../../../shared/ui/icon/icon.component';
import { SheetComponent } from '../../../../shared/ui/sheet/sheet.component';
import { TermChoice } from '../../data-access/term-selection';
import { TermOptionsComponent } from '../term-options/term-options.component';

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
  readonly periods = input.required<readonly GradePeriod[]>();
  readonly selection = input.required<GradeSelection>();
  readonly selectionChange = output<TermChoice>();

  private readonly sheet = viewChild.required(SheetComponent);

  /** Période scolaire parcourue dans la feuille, avant d'en choisir la partie. */
  protected readonly draftTerm = linkedSignal(() => this.selection().periodId);

  protected openSheet(): void {
    this.draftTerm.set(this.selection().periodId);
    this.sheet().open();
  }

  /** En ligne : un trimestre choisi s'affiche en entier. */
  protected pickTerm(periodId: string): void {
    this.choose({ periodId, part: 'ALL' });
  }

  protected pickPart(part: GradePart): void {
    this.choose({ periodId: this.selection().periodId, part });
  }

  protected pickDraftPart(part: GradePart): void {
    this.sheet().close();
    this.choose({ periodId: this.draftTerm(), part });
  }

  /** Partie cochée dans la feuille : seulement sur la période de la sélection. */
  protected draftPart(): GradePart | undefined {
    const { periodId, part } = this.selection();
    return this.draftTerm() === periodId ? part : undefined;
  }

  private choose(choice: TermChoice): void {
    const { periodId, part } = this.selection();
    if (choice.periodId !== periodId || choice.part !== part) this.selectionChange.emit(choice);
  }
}
