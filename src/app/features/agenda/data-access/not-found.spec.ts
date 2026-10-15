import { HttpErrorResponse } from '@angular/common/http';
import { isNotFound } from './not-found';

describe('isNotFound', () => {
  it('reconnaît une fiche introuvable, enveloppée ou non', () => {
    const notFound = new HttpErrorResponse({ status: 404 });

    expect(isNotFound(notFound)).toBe(true);
    expect(isNotFound(new Error('ressource', { cause: notFound }))).toBe(true);
    expect(isNotFound(new HttpErrorResponse({ status: 500 }))).toBe(false);
    expect(isNotFound(undefined)).toBe(false);
  });
});
