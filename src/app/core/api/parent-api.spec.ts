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
});
