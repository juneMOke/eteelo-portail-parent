import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { firstValueFrom } from 'rxjs';
import { bootstrapFixture } from '../../../testing/bootstrap.fixture';
import { ParentApi, reportCardDocumentUrl } from './parent-api';

describe('ParentApi', () => {
  let api: ParentApi;
  let http: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [provideHttpClient(), provideHttpClientTesting()],
    });
    api = TestBed.inject(ParentApi);
    http = TestBed.inject(HttpTestingController);
  });

  afterEach(() => http.verify());

  it('rend le bootstrap validé', async () => {
    const result = firstValueFrom(api.bootstrap());
    http.expectOne('/api/v1/parent/bootstrap').flush(bootstrapFixture());

    expect((await result).children).toHaveLength(2);
  });

  it('replie un lien de parenté inconnu sur OTHER', async () => {
    const raw = bootstrapFixture();
    const result = firstValueFrom(api.bootstrap());
    http.expectOne('/api/v1/parent/bootstrap').flush({
      ...raw,
      children: [{ ...raw.children[0], relationshipType: 'STEPMOTHER' }],
    });

    expect((await result).children[0].relationshipType).toBe('OTHER');
  });

  it('rejette un bootstrap qui ne respecte pas le contrat', async () => {
    const result = firstValueFrom(api.bootstrap());
    http.expectOne('/api/v1/parent/bootstrap').flush({ parent: null });

    await expect(result).rejects.toThrow();
  });

  it('demande la semaine du jour donné, ou la semaine en cours', () => {
    api.gradesWeek('c1', '2026-09-24').subscribe();
    api.gradesWeek('c1').subscribe();

    http.expectOne('/api/v1/parent/children/c1/grades/week?date=2026-09-24').flush({});
    http.expectOne('/api/v1/parent/children/c1/grades/week').flush({});
  });

  it('ne demande une période qu’avec son trimestre', () => {
    api.gradeCourses('c1', { termId: 't1', periodId: 'p2' }).subscribe();
    api.gradeCourses('c1', { periodId: 'p2' }).subscribe();
    api.reportCard('c1', { termId: 't1' }).subscribe();

    http.expectOne('/api/v1/parent/children/c1/grades/courses?termId=t1&periodId=p2').flush({});
    http.expectOne('/api/v1/parent/children/c1/grades/courses').flush({});
    http.expectOne('/api/v1/parent/children/c1/grades/report-card?termId=t1').flush({});
  });

  it('sert le PDF scellé du bulletin par sa route', () => {
    expect(reportCardDocumentUrl('c1', 'r9')).toBe(
      '/api/v1/parent/children/c1/report-cards/r9/document',
    );
  });
});
