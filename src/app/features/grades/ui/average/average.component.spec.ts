import { registerLocaleData } from '@angular/common';
import localeFr from '@angular/common/locales/fr';
import { LOCALE_ID } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { GradeAverage } from '../../../../core/api/grades.contract';
import { AverageComponent } from './average.component';

registerLocaleData(localeFr);

describe('AverageComponent', () => {
  async function render(average: Pick<GradeAverage, 'percent' | 'state'> | null) {
    TestBed.configureTestingModule({ providers: [{ provide: LOCALE_ID, useValue: 'fr' }] });
    const fixture = TestBed.createComponent(AverageComponent);
    fixture.componentRef.setInput('average', average);
    fixture.componentRef.setInput('size', 'xl');
    await fixture.whenStable();
    return fixture.nativeElement as HTMLElement;
  }

  it('écrit la moyenne en pourcentage, à la couleur de son ton', async () => {
    const el = await render({ percent: 64.5, state: 'PASSED' });

    expect(el.textContent).toBe('64,5 %');
    expect(el.style.getPropertyValue('--average-color')).toBe('var(--color-grade-good)');
    expect(el.classList).toContain('xl');
  });

  it('met un tiret quand il n’y a pas encore de note', async () => {
    const el = await render(null);

    expect(el.textContent).toBe('—');
    expect(el.style.getPropertyValue('--average-color')).toBe('var(--color-text-muted)');
  });
});
