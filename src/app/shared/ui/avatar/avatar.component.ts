import { ChangeDetectionStrategy, Component, computed, input, linkedSignal } from '@angular/core';

export type AvatarSize = 'sm' | 'md' | 'lg';

/**
 * Photo de l'enfant si elle existe, sinon ses initiales. Décoratif : le prénom est toujours
 * écrit à côté.
 */
@Component({
  selector: 'ui-avatar',
  template: `
    @if (showPhoto()) {
      <img [src]="photoUrl()" alt="" (error)="photoFailed.set(true)" />
    } @else {
      <span aria-hidden="true">{{ initials() }}</span>
    }
  `,
  styleUrl: './avatar.component.css',
  host: { '[attr.data-size]': 'size()' },
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AvatarComponent {
  readonly firstName = input<string | null | undefined>(null);
  readonly lastName = input.required<string>();
  readonly photoUrl = input<string | null>(null);
  readonly size = input<AvatarSize>('md');

  /** Repasse à false quand l'URL change : une nouvelle photo mérite un nouvel essai. */
  protected readonly photoFailed = linkedSignal({
    source: this.photoUrl,
    computation: () => false,
  });
  protected readonly showPhoto = computed(() => !!this.photoUrl() && !this.photoFailed());
  protected readonly initials = computed(() =>
    [this.firstName(), this.lastName()]
      .map((part) => part?.trim().charAt(0) ?? '')
      .join('')
      .toLocaleUpperCase('fr'),
  );
}
