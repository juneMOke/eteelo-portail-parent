import { registerLocaleData } from '@angular/common';
import localeFr from '@angular/common/locales/fr';
import { LOCALE_ID } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { PendingAbsence } from '../../data-access/attendance-view';
import { PendingAbsencesComponent } from './pending-absences.component';

registerLocaleData(localeFr);

describe('PendingAbsencesComponent', () => {
  const entry = (date: string, justifyUntil: string | null): PendingAbsence => ({
    date,
    justifyUntil,
    day: undefined,
  });

  async function render(entries: PendingAbsence[]) {
    TestBed.configureTestingModule({ providers: [{ provide: LOCALE_ID, useValue: 'fr' }] });
    const fixture = TestBed.createComponent(PendingAbsencesComponent);
    fixture.componentRef.setInput('entries', entries);
    await fixture.whenStable();
    return { fixture, el: fixture.nativeElement as HTMLElement };
  }

  it('montre deux absences, puis déplie les autres', async () => {
    const { fixture, el } = await render([
      entry('2026-09-29', '2026-10-06'),
      entry('2026-10-02', '2026-10-09'),
      entry('2026-10-05', null),
    ]);

    expect(el.querySelectorAll('li')).toHaveLength(2);
    el.querySelector<HTMLButtonElement>('.more')!.click();
    await fixture.whenStable();
    expect(el.querySelectorAll('li')).toHaveLength(3);
    expect(el.querySelector('li.waiting')?.textContent).toContain(
      'Justification envoyée · en attente de l’école',
    );
    expect(el.querySelector('.more')).toBeNull();
  });

  it('ne propose « Justifier » que dans le délai', async () => {
    const { fixture, el } = await render([
      entry('2026-10-02', '2026-10-09'),
      entry('2026-10-05', null),
    ]);
    const justify = vi.fn();
    fixture.componentInstance.justify.subscribe(justify);

    expect(el.querySelector('h2')?.textContent).toBe('À justifier');
    expect(el.querySelectorAll('.justify')).toHaveLength(1);
    el.querySelector<HTMLButtonElement>('.justify')!.click();
    expect(justify).toHaveBeenCalledWith('2026-10-02');
  });
});
