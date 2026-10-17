import {
  ChangeDetectionStrategy,
  Component,
  ElementRef,
  computed,
  input,
  output,
  signal,
  viewChildren,
} from '@angular/core';
import { moveRadioFocus } from '../../../../shared/a11y/radio-focus';
import { IconComponent } from '../../../../shared/ui/icon/icon.component';
import {
  FilterMenuComponent,
  FilterOption,
} from '../../../../shared/ui/filter-menu/filter-menu.component';

/** Une année de l'enfant, la plus récente en tête. */
export interface YearChoice {
  readonly id: string;
  /** « 2026-2027 ». */
  readonly label: string;
}

/** Au plus trois pilules ; les années plus anciennes passent par « Plus ancien ». */
const VISIBLE_PILLS = 3;

/**
 * C Le bandeau d'année de Mes reçus et de Mes paiements, de la famille du bandeau de semaine :
 * aplat Bleu Ardoise au motif kuba. Au-delà du téléphone, le résumé (« 4 reçus · dernier le
 * 22/09 », « 5 versements · dernier le 22/09 ») à gauche et les
 * pilules d'année à droite, trois au plus puis « Plus ancien ». Au téléphone, un menu déroulant
 * qui reprend le résumé. Une seule année : son libellé, sans geste. Seules les pilules se
 * touchent.
 */
@Component({
  selector: 'app-year-banner',
  imports: [FilterMenuComponent, IconComponent],
  templateUrl: './year-banner.component.html',
  styleUrl: './year-banner.component.css',
  host: { '[class.wide]': 'wide()' },
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class YearBannerComponent {
  readonly years = input.required<readonly YearChoice[]>();
  readonly checked = input.required<string | undefined>();
  /** « 4 reçus » ; null tant que l'année n'est pas lue. */
  readonly countLabel = input<string | null>(null);
  /** « dernier le 22/09 » ; null sans reçu. */
  readonly latestLabel = input<string | null>(null);
  /** Nombre de reçus ou de versements de l'année affichée, dans le menu du téléphone. */
  readonly count = input<number | null>(null);
  /** Ce que compte `count` : « reçus », « versements ». */
  readonly unit = input.required<string>();
  readonly wide = input(false);
  readonly pick = output<string>();

  private readonly pills = viewChildren<ElementRef<HTMLButtonElement>>('pill');

  protected readonly menuOpen = signal(false);
  protected readonly olderOpen = signal(false);

  protected readonly recent = computed(() => this.years().slice(0, VISIBLE_PILLS));
  protected readonly older = computed(() => this.years().slice(VISIBLE_PILLS));
  /** L'année plus ancienne choisie : la pilule « Plus ancien » la nomme. */
  protected readonly checkedOlder = computed(() =>
    this.older().find((year) => year.id === this.checked()),
  );
  protected readonly checkedLabel = computed(
    () => this.years().find((year) => year.id === this.checked())?.label ?? '',
  );
  protected readonly menuOptions = computed<readonly FilterOption[]>(() =>
    this.years().map((year) => ({
      id: year.id,
      label: year.label,
      count: year.id === this.checked() ? this.count() : null,
      unit: this.unit(),
      tone: null,
    })),
  );

  protected choose(id: string | null): void {
    this.menuOpen.set(false);
    this.olderOpen.set(false);
    if (id && id !== this.checked()) this.pick.emit(id);
  }

  protected move(event: KeyboardEvent, index: number): void {
    moveRadioFocus(
      event,
      index,
      this.pills().map((pill) => pill.nativeElement),
    );
  }
}
