import { DatePipe } from '@angular/common';
import {
  ChangeDetectionStrategy,
  Component,
  LOCALE_ID,
  computed,
  inject,
  input,
} from '@angular/core';

/**
 * Salutation (le seul moment chaleureux de la page, pas un titre) : « Mbote » en bleu,
 * le nom du parent en terre cuite, puis l'élève affiché et sa classe dans une pastille, et la date.
 */
@Component({
  selector: 'app-greeting',
  imports: [DatePipe],
  templateUrl: './greeting.component.html',
  styleUrl: './greeting.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class GreetingComponent {
  /** Null : « Mbote » seul. */
  readonly parentName = input.required<string | null>();
  readonly childName = input.required<string>();
  readonly childClass = input.required<string | null>();
  readonly today = input.required<Date>();

  /** « Grâce Mbala Nsimba · 5e B », ou le nom seul tant que l'élève n'est pas placé. */
  protected readonly childLabel = computed(() => {
    const className = this.childClass();
    return className ? `${this.childName()} · ${className}` : this.childName();
  });
}
