import { registerLocaleData } from '@angular/common';
import localeFr from '@angular/common/locales/fr';
import { LOCALE_ID } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { AssignmentCardComponent, AssignmentCardView } from './assignment-card.component';

registerLocaleData(localeFr);

const CARD: AssignmentCardView = {
  view: { label: 'Corrigé', tone: 'success', icon: 'award' },
  heading: 'Interrogation de Chimie — les acides',
  when: 'Mardi 15/09',
  compactWhen: null,
  detail: 'Acides et bases, pH',
  urgent: null,
  grade: { points: 13.5, maxPoints: 20 },
};

describe('AssignmentCardComponent', () => {
  async function render(card: AssignmentCardView, scored = false) {
    TestBed.configureTestingModule({
      providers: [provideRouter([]), { provide: LOCALE_ID, useValue: 'fr' }],
    });
    const fixture = TestBed.createComponent(AssignmentCardComponent);
    fixture.componentRef.setInput('card', card);
    fixture.componentRef.setInput('link', ['/c', 'c1', 'assessments', 'e1']);
    fixture.componentRef.setInput('scored', scored);
    await fixture.whenStable();
    return fixture.nativeElement as HTMLElement;
  }

  it('dit le statut, le titre, la date et le détail, et mène à la fiche', async () => {
    const el = await render({ ...CARD, grade: null });

    expect(el.querySelector('.status')?.textContent).toContain('Corrigé');
    expect(el.querySelector('.heading')?.textContent).toContain('les acides');
    expect(el.querySelector('.when')?.textContent).toContain('Mardi 15/09');
    expect(el.querySelector('.detail')?.textContent).toContain('pH');
    expect(el.querySelector('a')?.getAttribute('href')).toBe('/c/c1/assessments/e1');
    expect(el.querySelector('.chevron')).not.toBeNull();
  });

  it('remplace le chevron par la note publiée', async () => {
    const el = await render(CARD);

    expect(el.querySelector('ui-grade')?.textContent).toContain('13,5/20');
    expect(el.querySelector('.chevron')).toBeNull();
  });

  it('garde le chevron à côté de la note dans Mes cours', async () => {
    const el = await render(CARD, true);

    expect(el.classList).toContain('scored');
    expect(el.querySelector('ui-grade')?.textContent).toContain('13,5/20');
    expect(el.querySelector('.chevron')).not.toBeNull();
  });
});
