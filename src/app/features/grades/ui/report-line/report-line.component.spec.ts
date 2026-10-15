import { registerLocaleData } from '@angular/common';
import localeFr from '@angular/common/locales/fr';
import { LOCALE_ID } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { ReportCardLine } from '../../../../core/api/grades.contract';
import { ReportLineComponent } from './report-line.component';

registerLocaleData(localeFr);

describe('ReportLineComponent', () => {
  async function render(line: ReportCardLine) {
    TestBed.configureTestingModule({
      providers: [provideRouter([]), { provide: LOCALE_ID, useValue: 'fr' }],
    });
    const fixture = TestBed.createComponent(ReportLineComponent);
    fixture.componentRef.setInput('line', line);
    fixture.componentRef.setInput('link', ['/c', 'c1', 'grades', 'courses']);
    fixture.componentRef.setInput('queryParams', { term: 't1', course: line.courseId });
    await fixture.whenStable();
    return fixture.nativeElement as HTMLElement;
  }

  it('résume le cours et ouvre Mes cours sur lui', async () => {
    const el = await render({
      courseId: 'k1',
      label: 'Géographie',
      teacherLabel: null,
      average: { percent: 45, obtained: 9, max: 20 },
    });
    const link = el.querySelector('a')!;

    expect(el.querySelector('.label')?.textContent).toBe('Géographie');
    expect(el.querySelector('app-average')?.textContent).toBe('45,0 %');
    expect(el.querySelector<HTMLElement>('.fill')?.style.width).toBe('45%');
    expect(el.querySelector<HTMLElement>('.fill')?.style.background).toBe('var(--color-grade-low)');
    expect(link.getAttribute('href')).toBe('/c/c1/grades/courses?term=t1&course=k1');
    expect(link.getAttribute('aria-label')).toBe(
      'Géographie, 45,0 %. Voir le détail dans Mes cours.',
    );
  });

  it('garde un cours sans note, sans jauge', async () => {
    const el = await render({
      courseId: 'k2',
      label: 'Éducation civique',
      teacherLabel: null,
      average: null,
    });

    expect(el.querySelector('.fill')).toBeNull();
    expect(el.querySelector('app-average')?.textContent).toBe('—');
  });
});
