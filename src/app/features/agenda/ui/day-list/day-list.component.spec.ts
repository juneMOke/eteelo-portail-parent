import { registerLocaleData } from '@angular/common';
import localeFr from '@angular/common/locales/fr';
import { ChangeDetectionStrategy, Component, LOCALE_ID, signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { AssignmentWindow, CivilDate } from '../../../../core/api/assignments.contract';
import { DayListComponent, DayListLabels } from './day-list.component';

registerLocaleData(localeFr);

const WINDOW: AssignmentWindow = {
  from: '2026-09-01',
  to: '2026-10-20',
  today: '2026-09-22',
  schoolDays: ['MON', 'TUE', 'WED', 'THU', 'FRI'],
};

const LABELS: DayListLabels = {
  region: 'Épreuves du jour',
  one: 'épreuve',
  many: 'épreuves',
  none: 'Aucune épreuve',
  emptyDay: 'Aucune épreuve ce jour',
  next: 'Prochaine épreuve',
};

@Component({
  imports: [DayListComponent],
  template: `
    <app-day-list
      [day]="day()"
      [window]="window"
      [count]="count()"
      [busyDays]="busyDays()"
      [labels]="labels"
      (dayChange)="emitted.push($event)"
    >
      <p class="projected">Cartes du jour</p>
    </app-day-list>
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
class HostComponent {
  readonly day = signal<CivilDate>('2026-09-24');
  readonly count = signal(0);
  readonly busyDays = signal<readonly CivilDate[]>([]);
  readonly window = WINDOW;
  readonly labels = LABELS;
  readonly emitted: CivilDate[] = [];
}

/** Un toucher à la position donnée ; jsdom n'expose pas le constructeur Touch. */
function touch(type: 'touchstart' | 'touchend', x: number, y: number): Event {
  const event = new Event(type, { bubbles: true });
  Object.defineProperty(event, 'changedTouches', { value: [{ clientX: x, clientY: y }] });
  return event;
}

describe('DayListComponent', () => {
  async function render(setup: Partial<{ day: CivilDate; count: number; busyDays: CivilDate[] }>) {
    TestBed.configureTestingModule({
      providers: [provideRouter([]), { provide: LOCALE_ID, useValue: 'fr' }],
    });
    const fixture = TestBed.createComponent(HostComponent);
    const host = fixture.componentInstance;
    if (setup.day) host.day.set(setup.day);
    if (setup.count !== undefined) host.count.set(setup.count);
    if (setup.busyDays) host.busyDays.set(setup.busyDays);
    await fixture.whenStable();
    const el = fixture.nativeElement as HTMLElement;
    return { fixture, host, el };
  }

  it('affiche les cartes projetées et le nombre du jour', async () => {
    const { el } = await render({ count: 2 });

    expect(el.querySelector('.projected')?.textContent).toBe('Cartes du jour');
    expect(el.querySelector('.empty-day')).toBeNull();
    expect(el.querySelector('section')?.getAttribute('aria-label')).toBe('Épreuves du jour');
    expect(el.querySelector('[aria-live]')?.textContent).toContain('2 épreuves');
  });

  it('mène d’un jour vide au prochain jour occupé', async () => {
    const { el } = await render({ busyDays: ['2026-09-21', '2026-10-01'] });

    expect(el.querySelector('.projected')).toBeNull();
    expect(el.querySelector('.empty-day h2')?.textContent).toBe('Aucune épreuve ce jour');
    const next = el.querySelector<HTMLAnchorElement>('.next')!;
    expect(next.textContent?.trim()).toBe('Prochaine épreuve : jeudi 01/10');
    expect(next.getAttribute('href')).toContain('date=2026-10-01');
  });

  it('dit « Pas d’école » un week-end, et qu’il n’y a rien de prévu après', async () => {
    const { el } = await render({ day: '2026-09-26' });

    expect(el.querySelector('.empty-day h2')?.textContent).toBe('Pas d’école ce jour');
    expect(el.querySelector('.empty-day p')?.textContent).toContain('quatre prochaines semaines');
    expect(el.querySelector('[aria-live]')?.textContent).toContain('Pas d’école');
  });

  it('change de jour au balayage horizontal, pas au défilement vertical', async () => {
    const { host, el } = await render({ day: '2026-09-25', count: 1 });
    const section = el.querySelector('section')!;

    section.dispatchEvent(touch('touchstart', 200, 300));
    section.dispatchEvent(touch('touchend', 100, 310));
    section.dispatchEvent(touch('touchstart', 100, 300));
    section.dispatchEvent(touch('touchend', 200, 300));
    section.dispatchEvent(touch('touchstart', 200, 300));
    section.dispatchEvent(touch('touchend', 100, 400));

    expect(host.emitted).toEqual(['2026-09-28', '2026-09-24']);
  });

  it('fait glisser la liste dans le sens du changement de jour', async () => {
    const { fixture, host, el } = await render({ count: 1 });
    const animation = () => el.querySelector<HTMLElement>('.day-content')!.style.animationName;

    expect(animation()).toBe('day-in-forward-0');
    host.day.set('2026-09-23');
    await fixture.whenStable();
    expect(animation()).toBe('day-in-backward-1');
    host.day.set('2026-09-25');
    await fixture.whenStable();
    expect(animation()).toBe('day-in-forward-0');
  });
});
