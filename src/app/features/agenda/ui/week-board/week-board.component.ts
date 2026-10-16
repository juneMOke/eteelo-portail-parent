import { formatDate } from '@angular/common';
import {
  ChangeDetectionStrategy,
  Component,
  LOCALE_ID,
  computed,
  inject,
  input,
  signal,
} from '@angular/core';
import { ActivatedRoute, Params, Router } from '@angular/router';
import { AssignmentWindow, CivilDate } from '../../../../core/api/assignments.contract';
import { addDays, civilToDate } from '../../../../shared/date/civil-date';
import { countLabel } from '../../../../shared/format/count';
import { dayLabel } from '../../../../shared/format/day-labels';
import { WIDE_SCREEN, mediaQuery } from '../../../../shared/layout/media-query';
import { EmptyPeriodComponent } from '../../../../shared/ui/empty-period/empty-period.component';
import {
  nearDay,
  openingWeek,
  schoolWeekOf,
  shortWeekLabel,
  weekDays,
  weekLabel,
  weekOffset,
  weekRange,
} from '../../data-access/school-week';
import { relativeWeek } from '../../../../shared/format/relative-week';
import { AssignmentCardComponent } from '../../../../shared/ui/assignment-card/assignment-card.component';
import {
  FilterMenuComponent,
  FilterOption,
} from '../../../../shared/ui/filter-menu/filter-menu.component';
import {
  WeekBannerComponent,
  WeekView,
} from '../../../../shared/ui/week-banner/week-banner.component';
import { WeekBoardLabels, WeekCard } from '../../data-access/week-board';

type Menu = 'day' | 'status';

interface DayGroup {
  readonly day: CivilDate;
  /** « Mardi 22/09 ». */
  readonly label: string;
  /** « Mardi », « 22/09 » : l'en-tête de colonne de la grille. */
  readonly weekday: string;
  readonly date: string;
  /** « aujourd'hui », « demain ». */
  readonly near: string | null;
  readonly cards: readonly WeekCard[];
}

interface Empty {
  readonly heading: string;
  readonly message: string;
}

/**
 * Squelette commun de Mes devoirs et Mes évaluations (spec 03 v2) : ① le bandeau de semaine,
 * ③ les filtres par jour et par statut, en menus déroulants sous le bandeau sur tous les
 * écrans, ② la semaine en grille (grand écran, par défaut) ou en
 * liste de cartes de jour (seule vue au téléphone), ⑪ le vide. Semaine, filtres et vue vivent
 * dans l'URL (`?week=&day=&status=&view=`) : la fiche y ramène « même semaine, mêmes filtres,
 * même vue ». Changer de semaine remet le filtre jour à « Toute la semaine » et garde le statut.
 */
@Component({
  selector: 'app-week-board',
  imports: [
    AssignmentCardComponent,
    EmptyPeriodComponent,
    FilterMenuComponent,
    WeekBannerComponent,
  ],
  templateUrl: './week-board.component.html',
  styleUrl: './week-board.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class WeekBoardComponent {
  readonly window = input.required<AssignmentWindow>();
  /** Toutes les cartes de la fenêtre, dans l'ordre du serveur (heure limite, puis matière). */
  readonly cards = input.required<readonly WeekCard[]>();
  readonly labels = input.required<WeekBoardLabels>();
  /** Chemin de la liste ; la fiche d'une carte est `[...listLink, id]`. */
  readonly listLink = input.required<readonly string[]>();
  /** Paramètres d'URL bruts ; une valeur invalide est ignorée. */
  readonly week = input<string>();
  readonly day = input<string>();
  readonly status = input<string>();
  readonly viewParam = input<string>();
  /** Jour d'un lien venu d'ailleurs (`?date=`) : ouvre sa semaine. */
  readonly date = input<string>();

  private readonly router = inject(Router);
  private readonly route = inject(ActivatedRoute);
  private readonly locale = inject(LOCALE_ID);

  protected readonly wide = mediaQuery(WIDE_SCREEN);
  protected readonly openMenu = signal<Menu | null>(null);
  /** Sens du dernier changement de semaine : la semaine glisse de ce côté. */
  protected readonly direction = signal<1 | -1 | 0>(0);

  protected readonly today = computed(() => this.window().today);
  private readonly range = computed(() => weekRange(this.window()));
  protected readonly monday = computed(() => openingWeek(this.window(), this.week(), this.date()));
  private readonly days = computed(() => weekDays(this.monday()));

  protected readonly label = computed(() => weekLabel(this.monday(), this.locale));
  protected readonly shortLabel = computed(() => shortWeekLabel(this.monday(), this.locale));
  protected readonly relative = computed(() =>
    relativeWeek(weekOffset(this.monday(), this.today())),
  );
  protected readonly isCurrent = computed(() => this.monday() === schoolWeekOf(this.today()));
  protected readonly hasPrevious = computed(() => this.monday() > this.range().first);
  protected readonly hasNext = computed(() => this.monday() < this.range().last);

  /** Grille par défaut au grand écran ; liste seule au téléphone (le choix reste dans l'URL). */
  protected readonly view = computed<WeekView>(() =>
    this.wide() && this.viewParam() !== 'list' ? 'grid' : 'list',
  );

  protected readonly dayFilter = computed(() => {
    const day = this.day();
    return day && this.days().includes(day) ? day : null;
  });
  protected readonly statusFilter = computed(
    () => this.labels().statuses.find((filter) => filter.id === this.status()) ?? null,
  );

  private readonly weekCards = computed(() => {
    const days = this.days();
    return this.cards().filter((card) => days.includes(card.day));
  });

  private matchesDay(card: WeekCard, day: CivilDate | null): boolean {
    return day === null || card.day === day;
  }

  private matchesStatus(card: WeekCard, status: string | null): boolean {
    return status === null || card.status === status;
  }

  /** Chaque compteur dit ce que l'option montrerait, l'autre filtre restant tel quel. */
  protected readonly dayOptions = computed<FilterOption[]>(() => {
    const status = this.statusFilter()?.id ?? null;
    const cards = this.weekCards().filter((card) => this.matchesStatus(card, status));
    return [
      { id: null, label: 'Toute la semaine', count: cards.length, tone: null },
      ...this.days().map((day) => {
        const near = nearDay(day, this.today());
        const name = formatDate(civilToDate(day), 'EEEE d', this.locale, 'UTC');
        return {
          id: day,
          label: `${name.charAt(0).toUpperCase()}${name.slice(1)}${near === 'aujourd’hui' ? ' · aujourd’hui' : ''}`,
          count: cards.filter((card) => card.day === day).length,
          tone: null,
        };
      }),
    ];
  });

  protected readonly statusOptions = computed<FilterOption[]>(() => {
    const day = this.dayFilter();
    const cards = this.weekCards().filter((card) => this.matchesDay(card, day));
    return [
      { id: null, label: this.labels().all, count: cards.length, tone: null },
      ...this.labels().statuses.map((filter) => ({
        id: filter.id,
        label: filter.label,
        count: cards.filter((card) => card.status === filter.id).length,
        tone: filter.tone,
      })),
    ];
  });

  private readonly visible = computed(() => {
    const day = this.dayFilter();
    const status = this.statusFilter()?.id ?? null;
    return this.weekCards().filter(
      (card) => this.matchesDay(card, day) && this.matchesStatus(card, status),
    );
  });

  /** Les jours de la semaine (ou le jour choisi), chacun avec ses cartes. */
  protected readonly groups = computed<DayGroup[]>(() => {
    const day = this.dayFilter();
    const visible = this.visible();
    return (day ? [day] : this.days()).map((date) => ({
      day: date,
      label: dayLabel(date, this.locale),
      weekday: formatDate(civilToDate(date), 'EEEE', this.locale, 'UTC'),
      date: formatDate(civilToDate(date), 'dd/MM', this.locale, 'UTC'),
      near: nearDay(date, this.today()),
      cards: visible.filter((card) => card.day === date),
    }));
  });

  /** En liste, les jours vides sont omis. */
  protected readonly busyGroups = computed(() =>
    this.groups().filter((group) => group.cards.length),
  );

  protected readonly empty = computed<Empty | null>(() => {
    const labels = this.labels();
    if (!this.weekCards().length) {
      return {
        heading: labels.emptyWeek,
        message: 'Utilisez les flèches pour changer de semaine.',
      };
    }
    if (this.visible().length) return null;
    const status = this.statusFilter();
    if (status) {
      return { heading: status.empty, message: `Choisissez « ${labels.all} » pour tout revoir.` };
    }
    return {
      heading: labels.emptyDay,
      message: 'Choisissez « Toute la semaine » pour tout revoir.',
    };
  });

  protected readonly announcement = computed(() => {
    const { one, many, none } = this.labels();
    return `${this.label()}, ${countLabel(this.visible().length, one, many, none)}`;
  });

  /** Ce que la fiche rend au retour : même semaine, mêmes filtres, même vue. */
  protected readonly cardParams = computed<Params>(() => {
    const params: Params = { week: this.monday() };
    if (this.dayFilter()) params['day'] = this.dayFilter();
    if (this.statusFilter()) params['status'] = this.statusFilter()?.id;
    if (this.viewParam() === 'list') params['view'] = 'list';
    return params;
  });

  protected cardLink(card: WeekCard): string[] {
    return [...this.listLink(), card.id];
  }

  protected step(direction: 1 | -1): void {
    this.direction.set(direction);
    this.openMenu.set(null);
    const monday = addDays(this.monday(), 7 * direction);
    this.navigate({ week: this.weekParam(monday), day: null });
  }

  protected goCurrent(): void {
    this.direction.set(this.monday() < schoolWeekOf(this.today()) ? 1 : -1);
    this.openMenu.set(null);
    this.navigate({ week: null, day: null });
  }

  protected pickDay(day: string | null): void {
    this.navigate({ day });
  }

  protected pickStatus(status: string | null): void {
    this.navigate({ status });
  }

  protected pickView(view: WeekView): void {
    this.navigate({ view: view === 'list' ? 'list' : null });
  }

  /** Un seul menu ouvert à la fois. */
  protected setMenu(menu: Menu, open: boolean): void {
    this.openMenu.update((current) => (open ? menu : current === menu ? null : current));
  }

  private weekParam(monday: CivilDate): CivilDate | null {
    return monday === schoolWeekOf(this.today()) ? null : monday;
  }

  private navigate(params: Params): void {
    void this.router.navigate([], {
      relativeTo: this.route,
      queryParams: { date: null, ...params },
      queryParamsHandling: 'merge',
      replaceUrl: true,
    });
  }
}
