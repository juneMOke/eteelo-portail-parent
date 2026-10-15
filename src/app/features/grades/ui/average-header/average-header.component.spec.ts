import { registerLocaleData } from '@angular/common';
import localeFr from '@angular/common/locales/fr';
import { LOCALE_ID } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { TERM } from '../../../../../testing/grades-terms.fixture';
import { reportCardFixture } from '../../../../../testing/report-card.fixture';
import { ReportCard } from '../../../../core/api/grades.contract';
import { AverageHeaderComponent } from './average-header.component';

registerLocaleData(localeFr);

describe('AverageHeaderComponent', () => {
  async function render(report: ReportCard) {
    TestBed.configureTestingModule({ providers: [{ provide: LOCALE_ID, useValue: 'fr' }] });
    const fixture = TestBed.createComponent(AverageHeaderComponent);
    fixture.componentRef.setInput('report', report);
    await fixture.whenStable();
    const el = fixture.nativeElement as HTMLElement;
    return { el, text: (selector: string) => el.querySelector(selector)?.textContent?.trim() };
  }

  it('dit un bulletin officiel avant son chiffre, avec le rang', async () => {
    const { text } = await render(reportCardFixture({ termId: TERM.first }));

    expect(text('.visually-hidden')).toBe(
      'Bulletin officiel, publié le 19 décembre. Moyenne générale 58,4 %.',
    );
    expect(text('.scope')).toBe('Moyenne de l’année au 1er trimestre');
    expect(text('.status')).toBe('Officiel · publié le 19/12');
    expect(text('app-average')).toBe('58,4 %');
    expect(text('.rank-value')).toBe('8e sur 32');
  });

  it('dit un rectificatif', async () => {
    const report = {
      ...reportCardFixture({ termId: TERM.first }),
      updatedAt: '2027-01-08T10:00:00Z',
    };
    const { text } = await render(report);

    expect(text('.status')).toBe('Officiel · mis à jour le 08/01');
  });

  it('dit une moyenne provisoire et sur combien de notes, sans rang', async () => {
    const report: ReportCard = {
      ...reportCardFixture(),
      evolution: { delta: 0.8, comparedToLabel: 'la 1re période' },
    };
    const { el, text } = await render(report);

    expect(text('.status')).toBe('Provisoire');
    expect(text('.note')).toBe('Calculée sur 6 notes. Peut différer du bulletin officiel.');
    expect(text('.evolution')).toBe('+0,8 pt par rapport à la 1re période');
    expect(el.querySelector('.rank')).toBeNull();
  });
});
