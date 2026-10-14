import { registerLocaleData } from '@angular/common';
import localeFr from '@angular/common/locales/fr';
import { LOCALE_ID } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { GradeComponent, gradeLevel } from './grade.component';

registerLocaleData(localeFr);

describe('gradeLevel', () => {
  it('colore selon la part du barème : 60 % et 50 %', () => {
    expect(gradeLevel(12, 20)).toBe('good');
    expect(gradeLevel(11.5, 20)).toBe('fair');
    expect(gradeLevel(10, 20)).toBe('fair');
    expect(gradeLevel(9.5, 20)).toBe('low');
    expect(gradeLevel(7, 10)).toBe('good');
    expect(gradeLevel(3, 0)).toBe('low');
  });
});

describe('GradeComponent', () => {
  async function render(inputs: Record<string, unknown>) {
    TestBed.configureTestingModule({ providers: [{ provide: LOCALE_ID, useValue: 'fr' }] });
    const fixture = TestBed.createComponent(GradeComponent);
    for (const [name, value] of Object.entries(inputs)) fixture.componentRef.setInput(name, value);
    await fixture.whenStable();
    return fixture.nativeElement as HTMLElement;
  }

  it('affiche la note à la française et la fait lire en toutes lettres', async () => {
    const el = await render({ points: 13.5, maxPoints: 20 });

    expect(el.querySelector('[aria-hidden]')?.textContent).toBe('13,5/20');
    expect(el.querySelector('.visually-hidden')?.textContent).toBe('13,5 sur 20');
    expect(el.style.getPropertyValue('--grade-color')).toBe('var(--color-grade-good)');
  });

  it("prend la couleur d'une note faible et la grande taille", async () => {
    const el = await render({ points: 9, maxPoints: 20, size: 'large' });

    expect(el.style.getPropertyValue('--grade-color')).toBe('var(--color-grade-low)');
    expect(el.classList.contains('large')).toBe(true);
  });
});
