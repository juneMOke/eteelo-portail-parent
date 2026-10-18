import { TestBed } from '@angular/core/testing';
import { gradeCoursesFixture } from '../../../../../testing/grade-courses.fixture';
import { GRADE_PERIODS, TERM } from '../../../../../testing/grades-terms.fixture';
import { TermChoice } from '../../data-access/term-selection';
import { TermPickerComponent } from './term-picker.component';

/** Grand écran simulé : `mediaQuery` lit `matchMedia`, absent du rendu de test. */
function wideScreen(): void {
  vi.stubGlobal('matchMedia', () => ({
    matches: true,
    addEventListener: () => undefined,
    removeEventListener: () => undefined,
  }));
}

describe('TermPickerComponent', () => {
  afterEach(() => vi.unstubAllGlobals());

  async function render() {
    const fixture = TestBed.createComponent(TermPickerComponent);
    fixture.componentRef.setInput('periods', GRADE_PERIODS);
    fixture.componentRef.setInput('selection', gradeCoursesFixture().selection);
    const choices: TermChoice[] = [];
    fixture.componentInstance.selectionChange.subscribe((choice) => choices.push(choice));
    document.body.appendChild(fixture.nativeElement);
    await fixture.whenStable();
    const el = fixture.nativeElement as HTMLElement;
    return { fixture, el, choices };
  }

  const radios = (root: Element, group: number) => {
    const groups = root.querySelectorAll('[role="radiogroup"]');
    return [...groups[group].querySelectorAll<HTMLButtonElement>('[role="radio"]')];
  };

  it('empile deux menus au téléphone : le trimestre, puis la période', async () => {
    const { el } = await render();
    const triggers = [...el.querySelectorAll('ui-filter-menu .trigger')];

    expect(triggers.map((t) => t.querySelector('.caption')?.textContent)).toEqual([
      'Trimestre',
      'Période',
    ]);
    expect(triggers.map((t) => t.querySelector('.value-label')?.textContent)).toEqual([
      '1er trimestre',
      '1re période',
    ]);
    expect(el.querySelector('.value-count')).toBeNull();
    expect(el.querySelector('[role="radiogroup"]')).toBeNull();
  });

  it('n’ouvre qu’un menu à la fois, et émet le trimestre choisi en entier', async () => {
    const { fixture, el, choices } = await render();
    const [term, part] = [...el.querySelectorAll<HTMLButtonElement>('ui-filter-menu .trigger')];

    part.click();
    await fixture.whenStable();
    term.click();
    await fixture.whenStable();

    expect(el.querySelectorAll('[role="listbox"]')).toHaveLength(1);
    const options = [...el.querySelectorAll<HTMLElement>('[role="option"]')];
    expect(options.map((o) => o.querySelector('.option-label')?.textContent)).toEqual([
      '1er trimestre',
      '2e trimestre',
      '3e trimestre',
    ]);
    options[1].click();
    expect(choices).toEqual([{ periodId: TERM.second, part: 'ALL' }]);
  });

  it('propose le trimestre entier, ses périodes et son examen', async () => {
    const { fixture, el, choices } = await render();

    el.querySelectorAll<HTMLButtonElement>('ui-filter-menu .trigger')[1].click();
    await fixture.whenStable();
    const options = [...el.querySelectorAll<HTMLElement>('[role="option"]')];

    expect(options.map((o) => o.querySelector('.option-label')?.textContent)).toEqual([
      'Tout le trimestre',
      '1re période',
      '2e période',
      'Examen',
    ]);
    options[3].click();
    expect(choices).toEqual([{ periodId: TERM.first, part: 'EXAM' }]);
  });

  it('au grand écran, émet la partie choisie, et un trimestre entier', async () => {
    wideScreen();
    const { el, choices } = await render();
    const inline = el.querySelector('.inline')!;

    expect(el.querySelector('ui-filter-menu')).toBeNull();
    radios(inline, 1)[2].click();
    radios(inline, 1)[1].click();
    radios(inline, 0)[1].click();

    expect(choices).toEqual([
      { periodId: TERM.first, part: 'SECOND' },
      { periodId: TERM.second, part: 'ALL' },
    ]);
  });
});
