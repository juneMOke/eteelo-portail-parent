import { ChangeDetectionStrategy, Component, input } from '@angular/core';
import { IconComponent } from '../../../../shared/ui/icon/icon.component';
import { WeekTile } from '../../data-access/attendance-view';

/**
 * ⑪ Les jours de la semaine : une tuile par jour, au fond et au filet de son état, avec l'état
 * en mot. « Ceci se lit » : aucune tuile n'ouvre de fiche (le mois s'en charge).
 */
@Component({
  selector: 'app-week-days',
  imports: [IconComponent],
  templateUrl: './week-days.component.html',
  styleUrl: './week-days.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class WeekDaysComponent {
  readonly tiles = input.required<readonly WeekTile[]>();
}
