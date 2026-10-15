import { TestBed } from '@angular/core/testing';
import { GRADE_PERIODS, TERM } from '../../../../../testing/grades-terms.fixture';
import { GradePeriod } from '../../../../core/api/grades.contract';
import { TermOptionsComponent } from './term-options.component';

describe('TermOptionsComponent', () => {
  async function render(part: string | undefined = 'FIRST', periods = GRADE_PERIODS) {
    const fixture = TestBed.createComponent(TermOptionsComponent);
    fixture.componentRef.setInput('periods', periods);
    fixture.componentRef.setInput('periodId', periods[0].periodId);
    fixture.componentRef.setInput('part', part);
    const picks: unknown[] = [];
    fixture.componentInstance.termPick.subscribe((id) => picks.push(['term', id]));
    fixture.componentInstance.partPick.subscribe((id) => picks.push(['part', id]));
    document.body.appendChild(fixture.nativeElement);
    await fixture.whenStable();
    const el = fixture.nativeElement as HTMLElement;
    const groups = [...el.querySelectorAll('[role="radiogroup"]')];
    const radios = (group: number) => [
      ...groups[group].querySelectorAll<HTMLButtonElement>('[role="radio"]'),
    ];
    const labels = (group: number) => radios(group).map((r) => r.textContent?.trim());
    return { el, picks, radios, labels };
  }

  it('montre deux groupes nommés, la sélection cochée', async () => {
    const { el, radios, labels } = await render();

    expect([...el.querySelectorAll('.group-label')].map((l) => l.textContent)).toEqual([
      'Trimestre',
      'Période',
    ]);
    expect(labels(0)).toEqual(['1er trimestre', '2e trimestre', '3e trimestre']);
    expect(labels(1)).toEqual(['Tout le trimestre', '1re période', '2e période', 'Examen']);
    expect(radios(0)[0].getAttribute('aria-checked')).toBe('true');
    expect(radios(1)[1].getAttribute('aria-checked')).toBe('true');
    expect(radios(1).map((r) => r.tabIndex)).toEqual([-1, 0, -1, -1]);
  });

  it('émet la période scolaire ou la partie choisies', async () => {
    const { picks, radios } = await render();

    radios(0)[1].click();
    radios(1)[0].click();
    radios(1)[3].click();

    expect(picks).toEqual([
      ['term', TERM.second],
      ['part', 'ALL'],
      ['part', 'EXAM'],
    ]);
  });

  it('parle de semestre pour un cycle semestriel', async () => {
    const semesters: GradePeriod[] = GRADE_PERIODS.slice(0, 2).map((period, index) => ({
      ...period,
      label: index === 0 ? '1er semestre' : '2e semestre',
    }));
    const { el, labels } = await render(undefined, semesters);

    expect(el.querySelector('.group-label')?.textContent).toBe('Semestre');
    expect(labels(1)[0]).toBe('Tout le semestre');
  });
});
