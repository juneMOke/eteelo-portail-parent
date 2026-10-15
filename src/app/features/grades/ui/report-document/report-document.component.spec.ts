import { registerLocaleData } from '@angular/common';
import localeFr from '@angular/common/locales/fr';
import { LOCALE_ID } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { ReportCardDocument } from '../../../../core/api/grades.contract';
import { ReportDocumentComponent } from './report-document.component';

registerLocaleData(localeFr);

describe('ReportDocumentComponent', () => {
  async function render(document: ReportCardDocument | null) {
    TestBed.configureTestingModule({ providers: [{ provide: LOCALE_ID, useValue: 'fr' }] });
    const fixture = TestBed.createComponent(ReportDocumentComponent);
    fixture.componentRef.setInput('title', 'Bulletin du 1er trimestre');
    fixture.componentRef.setInput('document', document);
    fixture.componentRef.setInput('href', '/api/v1/parent/children/c1/report-cards/r1/document');
    await fixture.whenStable();
    return fixture.nativeElement as HTMLElement;
  }

  it('propose le PDF signé de l’école', async () => {
    const el = await render({
      reportCardId: 'r1',
      fileName: 'Bulletin-T1.pdf',
      sizeBytes: 245_760,
      signedBy: 'la direction',
    });
    const link = el.querySelector('a')!;

    expect(el.querySelector('h2')?.textContent).toBe('Bulletin du 1er trimestre');
    expect(el.querySelector('p')?.textContent).toBe('PDF · 246 Ko · signé par la direction');
    expect(link.textContent?.trim()).toBe('Télécharger');
    expect(link.getAttribute('href')).toBe('/api/v1/parent/children/c1/report-cards/r1/document');
    expect(link.hasAttribute('download')).toBe(true);
  });

  it('garde la surface, sans bouton, avant publication', async () => {
    const el = await render(null);

    expect(el.querySelector('a')).toBeNull();
    expect(el.querySelector('p')?.textContent).toBe(
      'Le bulletin signé sera disponible ici après sa publication par l’école.',
    );
  });
});
