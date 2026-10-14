import { DatePipe } from '@angular/common';
import { ChangeDetectionStrategy, Component, input } from '@angular/core';

/** Salutation (le seul moment chaleureux de la page, pas un titre) et date du jour. */
@Component({
  selector: 'app-greeting',
  imports: [DatePipe],
  templateUrl: './greeting.component.html',
  styleUrl: './greeting.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class GreetingComponent {
  readonly greeting = input.required<string>();
  readonly childLabel = input.required<string>();
  readonly today = input.required<Date>();
}
