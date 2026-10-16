import { LOCALE_ID, Pipe, PipeTransform, inject } from '@angular/core';
import { Money, amountLabel, amountsLabel } from '../format/amount';

/**
 * Montant affiché avec sa devise (invariant 6) : « 1 240 $ ». Une liste de montants (une
 * ligne par devise) s'écrit côte à côte, jamais additionnée : « 80 $ · 50 000 FC ».
 */
@Pipe({ name: 'amount' })
export class AmountPipe implements PipeTransform {
  private readonly locale = inject(LOCALE_ID);

  transform(value: Money | readonly Money[]): string {
    return 'currency' in value ? amountLabel(value, this.locale) : amountsLabel(value, this.locale);
  }
}
