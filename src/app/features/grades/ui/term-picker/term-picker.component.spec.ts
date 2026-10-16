import { TestBed } from '@angular/core/testing';
import { stubDialog } from '../../../../../testing/dialog';
import { gradeCoursesFixture } from '../../../../../testing/grade-courses.fixture';
import { GRADE_PERIODS, TERM } from '../../../../../testing/grades-terms.fixture';
import { TermChoice } from '../../data-access/term-selection';
import { TermPickerComponent } from './term-picker.component';

describe('TermPickerComponent', () => {
  beforeAll(stubDialog);

  async function render() {
    const fixture = TestBed.createComponent(TermPickerComponent);
    fixture.componentRef.setInput('periods', GRADE_PERIODS);
    fixture.componentRef.setInput('selection', gradeCoursesFixture().selection);
    const choices: TermChoice[] = [];
    fixture.componentInstance.selectionChange.subscribe((choice) => choices.push(choice));
    await fixture.whenStable();
    const el = fixture.nativeElement as HTMLElement;
    return { fixture, el, choices };
  }

  const radios = (root: Element, group: number) => [
    ...root
      .querySelectorAll('[role="radiogroup"]')
      [group].querySelectorAll<HTMLButtonElement>('[role="radio"]'),
  ];

  it('résume la sélection sur une ligne compacte', async () => {
    const { el } = await render();

    expect(el.querySelector('.compact-label')?.textContent).toBe('1er trimestre · 1re période');
  });

  it('en ligne, émet la partie choisie, et un trimestre entier', async () => {
    const { el, choices } = await render();
    const inline = el.querySelector('.inline')!;

    radios(inline, 1)[2].click();
    radios(inline, 1)[1].click();
    radios(inline, 0)[1].click();

    expect(choices).toEqual([
      { periodId: TERM.first, part: 'SECOND' },
      { periodId: TERM.second, part: 'ALL' },
    ]);
  });

  it('dans la feuille, une période choisie valide et ferme', async () => {
    const { fixture, el, choices } = await render();
    const sheet = el.querySelector('ui-sheet')!;

    el.querySelector<HTMLButtonElement>('.compact')!.click();
    await fixture.whenStable();
    expect(el.querySelector('dialog')?.hasAttribute('open')).toBe(true);
    radios(sheet, 1)[0].click();

    expect(choices).toEqual([{ periodId: TERM.first, part: 'ALL' }]);
    expect(el.querySelector('dialog')?.hasAttribute('open')).toBe(false);
  });
});
