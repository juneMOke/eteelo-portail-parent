import { registerLocaleData } from '@angular/common';
import localeFr from '@angular/common/locales/fr';
import { Component, LOCALE_ID, signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { COURSES } from '../../../../../testing/grade-courses.fixture';
import { GradeCourse } from '../../../../core/api/grades.contract';
import { CourseRowComponent } from './course-row.component';

registerLocaleData(localeFr);

@Component({
  imports: [CourseRowComponent],
  template: `
    <app-course-row
      [course]="course()"
      [expanded]="expanded()"
      (toggled)="expanded.set(!expanded())"
    >
      <p class="projected">Évaluations du cours</p>
    </app-course-row>
  `,
})
class HostComponent {
  readonly course = signal<GradeCourse>(COURSES[0]);
  readonly expanded = signal(false);
}

describe('CourseRowComponent', () => {
  async function render(course: GradeCourse) {
    TestBed.configureTestingModule({ providers: [{ provide: LOCALE_ID, useValue: 'fr' }] });
    const fixture = TestBed.createComponent(HostComponent);
    fixture.componentInstance.course.set(course);
    await fixture.whenStable();
    const el = fixture.nativeElement as HTMLElement;
    return { fixture, el, header: el.querySelector<HTMLButtonElement>('.header')! };
  }

  it('donne la moyenne du cours et la tendance sans déplier', async () => {
    const { el, header } = await render(COURSES[0]);

    expect(el.querySelector('.label')?.textContent).toBe('Mathématiques');
    expect(el.querySelector('.summary')?.textContent).toBe(
      'M. Kasongo · 2 évaluations, dernière 15/20 le 14/09',
    );
    expect(el.querySelector('app-average')?.textContent).toBe('75,0 %');
    expect(header.getAttribute('aria-label')).toBe(
      'Mathématiques, moyenne 75,0\u00a0%, 2 évaluations.',
    );
    expect(header.getAttribute('aria-expanded')).toBe('false');
    expect(el.querySelector('.panel')?.hasAttribute('hidden')).toBe(true);
  });

  it('se déplie et se replie', async () => {
    const { fixture, el, header } = await render(COURSES[0]);

    header.click();
    await fixture.whenStable();

    expect(header.getAttribute('aria-expanded')).toBe('true');
    expect(el.querySelector('.panel')?.hasAttribute('hidden')).toBe(false);
    expect(el.querySelector('.projected')?.textContent).toBe('Évaluations du cours');
  });

  it('garde un cours sans évaluation, avec un tiret', async () => {
    const { el } = await render(COURSES[7]);

    expect(el.querySelector('.summary')?.textContent).toBe('Pas encore d’évaluation');
    expect(el.querySelector('app-average')?.textContent).toBe('—');
    expect(el.querySelector('.none')?.textContent).toBe('Pas encore d’évaluation pour ce cours.');
  });
});
