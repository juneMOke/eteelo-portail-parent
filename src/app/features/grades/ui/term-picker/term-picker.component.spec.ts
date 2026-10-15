import { registerLocaleData } from '@angular/common';
import localeFr from '@angular/common/locales/fr';
import { LOCALE_ID } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { PERIOD, TERM } from '../../../../../testing/grades-terms.fixture';
import { gradeCoursesFixture } from '../../../../../testing/grade-courses.fixture';
import { TermChoice, TermPickerComponent } from './term-picker.component';

registerLocaleData(localeFr);

describe('TermPickerComponent', () => {
  beforeAll(() => {
    // jsdom n'implémente pas showModal/close.
    HTMLDialogElement.prototype.showModal ??= function (this: HTMLDialogElement) {
      this.setAttribute('open', '');
    };
    HTMLDialogElement.prototype.close ??= function (this: HTMLDialogElement) {
      this.removeAttribute('open');
    };
  });

  async function render() {
    TestBed.configureTestingModule({ providers: [{ provide: LOCALE_ID, useValue: 'fr' }] });
    const fixture = TestBed.createComponent(TermPickerComponent);
    const { terms, selection } = gradeCoursesFixture();
    fixture.componentRef.setInput('tree', { terms, selection });
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

  it('en ligne, émet la période choisie, et un trimestre entier', async () => {
    const { el, choices } = await render();
    const inline = el.querySelector('.inline')!;

    radios(inline, 1)[2].click();
    radios(inline, 1)[1].click();

    expect(choices).toEqual([{ termId: TERM.first, periodId: PERIOD.second }]);
  });

  it('dans la feuille, une période choisie valide et ferme', async () => {
    const { fixture, el, choices } = await render();
    const sheet = el.querySelector('ui-sheet')!;

    el.querySelector<HTMLButtonElement>('.compact')!.click();
    await fixture.whenStable();
    expect(el.querySelector('dialog')?.hasAttribute('open')).toBe(true);
    radios(sheet, 1)[0].click();

    expect(choices).toEqual([{ termId: TERM.first, periodId: null }]);
    expect(el.querySelector('dialog')?.hasAttribute('open')).toBe(false);
  });
});
