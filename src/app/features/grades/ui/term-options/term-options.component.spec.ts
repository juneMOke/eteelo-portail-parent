import { registerLocaleData } from '@angular/common';
import localeFr from '@angular/common/locales/fr';
import { LOCALE_ID } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { PERIOD, TERM, TERMS } from '../../../../../testing/grades-terms.fixture';
import { TermOptionsComponent } from './term-options.component';

registerLocaleData(localeFr);

describe('TermOptionsComponent', () => {
  async function render(periodId: string | null = PERIOD.first) {
    TestBed.configureTestingModule({ providers: [{ provide: LOCALE_ID, useValue: 'fr' }] });
    const fixture = TestBed.createComponent(TermOptionsComponent);
    fixture.componentRef.setInput('terms', TERMS);
    fixture.componentRef.setInput('termId', TERM.first);
    fixture.componentRef.setInput('periodId', periodId);
    const picks: unknown[] = [];
    fixture.componentInstance.termPick.subscribe((id) => picks.push(['term', id]));
    fixture.componentInstance.periodPick.subscribe((id) => picks.push(['period', id]));
    document.body.appendChild(fixture.nativeElement);
    await fixture.whenStable();
    const el = fixture.nativeElement as HTMLElement;
    const groups = [...el.querySelectorAll('[role="radiogroup"]')];
    const radios = (group: number) => [
      ...groups[group].querySelectorAll<HTMLButtonElement>('[role="radio"]'),
    ];
    return { el, picks, radios };
  }

  it('montre deux groupes nommés, la sélection cochée', async () => {
    const { el, radios } = await render();
    const labels = (group: number) => radios(group).map((r) => r.textContent?.trim());

    expect([...el.querySelectorAll('.group-label')].map((l) => l.textContent)).toEqual([
      'Trimestre',
      'Période',
    ]);
    expect(labels(1)).toEqual(['Tout le trimestre', '1re période', '2e période', 'Examen']);
    expect(radios(0)[0].getAttribute('aria-checked')).toBe('true');
    expect(radios(1)[1].getAttribute('aria-checked')).toBe('true');
    expect(radios(1).map((r) => r.tabIndex)).toEqual([-1, 0, -1, -1]);
  });

  it('affiche une pilule à venir inactive, avec sa date', async () => {
    const { picks, radios } = await render();
    const exam = radios(1)[3];

    expect(exam.getAttribute('aria-disabled')).toBe('true');
    expect(exam.title).toBe('Ouvre le 07/12');
    expect(exam.getAttribute('aria-label')).toBe('Examen, Ouvre le 07/12');
    exam.click();
    radios(0)[1].click();
    expect(picks).toEqual([]);
  });

  it('émet le trimestre ou la période choisis, « Tout le trimestre » valant null', async () => {
    const { picks, radios } = await render();

    radios(1)[0].click();
    radios(1)[2].click();

    expect(picks).toEqual([
      ['period', null],
      ['period', PERIOD.second],
    ]);
  });
});
