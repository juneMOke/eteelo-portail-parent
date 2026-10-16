import { NgTemplateOutlet } from '@angular/common';
import { ChangeDetectionStrategy, Component, input, output } from '@angular/core';
import { Params, RouterLink } from '@angular/router';
import { AmountPipe } from '../../../../shared/pipes/amount.pipe';
import { IconComponent } from '../../../../shared/ui/icon/icon.component';
import { LedgerRow } from '../../data-access/finance-rows';

/**
 * Une ligne de Mes finances : toute la ligne se touche, le chevron le dit. Avec un lien, elle
 * mène à une autre page (une fiche y est ouverte) ; sans lien, elle signale qu'on l'a choisie.
 */
@Component({
  selector: 'app-ledger-row',
  imports: [AmountPipe, IconComponent, NgTemplateOutlet, RouterLink],
  templateUrl: './ledger-row.component.html',
  styleUrl: './ledger-row.component.css',
  host: {
    '[style.--row-tone]': "row().tone ? 'var(--color-tone-' + row().tone + ')' : 'transparent'",
  },
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class LedgerRowComponent {
  readonly row = input.required<LedgerRow>();
  /** Destination, pour une ligne qui mène à une autre page. */
  readonly link = input<readonly string[] | null>(null);
  readonly queryParams = input<Params>({});
  readonly activate = output<void>();
}
