import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { firstValueFrom } from 'rxjs';
import { bootstrapFixture } from '../../../testing/bootstrap.fixture';
import { ParentApi } from './parent-api';

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

    http.expectOne('/api/v1/parent/children/c1/grades/week?weekOf=2026-09-24').flush({});
    http.expectOne('/api/v1/parent/children/c1/grades/week').flush({});
  });

  it('lit les périodes scolaires de l’enfant', () => {
    api.gradePeriods('c1').subscribe();

    http.expectOne('/api/v1/parent/children/c1/grades/periods').flush([]);
  });

  it('ne demande une portion qu’avec sa période', () => {
    api.gradeCourses('c1', { periodId: 't1', part: 'SECOND' }).subscribe();
    api.gradeCourses('c1', { part: 'SECOND' }).subscribe();
    api.reportCard('c1', { periodId: 't1' }).subscribe();

    http.expectOne('/api/v1/parent/children/c1/grades/courses?periodId=t1&part=SECOND').flush({});
    http.expectOne('/api/v1/parent/children/c1/grades/courses').flush({});
    http.expectOne('/api/v1/parent/children/c1/grades/report-card?periodId=t1').flush({});
  });

  it('lit les frais et les versements de l’année courante, ou de l’année demandée', () => {
    api.fees('c1').subscribe();
    api.payments('c1', 'y1').subscribe();
    api.academicYears('c1').subscribe();

    http.expectOne('/api/v1/parent/children/c1/fees').flush({});
    http.expectOne('/api/v1/parent/children/c1/payments?academicYearId=y1').flush([]);
    http.expectOne('/api/v1/parent/children/c1/academic-years').flush([]);
  });

  it('lit un reçu en PDF et génère le relevé de l’année par un POST', () => {
    api.receipt('c1', 'p1').subscribe();
    api.statement('c1', 'y1').subscribe();

    const receipt = http.expectOne('/api/v1/parent/children/c1/payments/p1/receipt');
    expect(receipt.request.responseType).toBe('blob');
    receipt.flush(new Blob());
    const statement = http.expectOne('/api/v1/parent/children/c1/statement?academicYearId=y1');
    expect(statement.request.method).toBe('POST');
    expect(statement.request.responseType).toBe('blob');
    statement.flush(new Blob());
  });
});
