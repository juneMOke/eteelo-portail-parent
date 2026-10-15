import { HttpErrorResponse, HttpEvent, HttpEventType, HttpResponse } from '@angular/common/http';
import { Subject } from 'rxjs';
import { INTERRUPTED, UploadInterrupted, trackUpload, uploadFailure } from './upload';

describe('upload', () => {
  describe('trackUpload', () => {
    it('suit la progression puis rend le corps de la réponse', async () => {
      const events = new Subject<HttpEvent<string>>();
      const progress = vi.fn();

      const result = trackUpload(events, progress);
      events.next({ type: HttpEventType.UploadProgress, loaded: 1, total: 4 });
      events.next({ type: HttpEventType.UploadProgress, loaded: 2 });
      events.next(new HttpResponse({ status: 201, body: 'reçu' }));
      events.complete();

      expect(await result).toBe('reçu');
      expect(progress).toHaveBeenCalledExactlyOnceWith(0.25);
    });

    it('rejette une réponse sans corps', async () => {
      const events = new Subject<HttpEvent<string>>();

      const result = trackUpload(events, () => undefined);
      events.next(new HttpResponse({ status: 204 }));
      events.complete();

      await expect(result).rejects.toBeInstanceOf(UploadInterrupted);
    });
  });

  describe('uploadFailure', () => {
    const messages = {
      refusals: { CLOSED: 'C’est fermé.' },
      refused: 'Refusé.',
      tooMany: 'Trop d’envois.',
    };
    const error = (status: number, detailCode?: string) =>
      new HttpErrorResponse({ status, error: detailCode ? { detailCode } : null });

    it('dit la cause fine d’un refus, sans proposer de renvoyer', () => {
      expect(uploadFailure(error(422, 'CLOSED'), messages)).toEqual({
        message: 'C’est fermé.',
        retryable: false,
      });
      expect(uploadFailure(error(422, 'AUTRE'), messages)).toEqual({
        message: 'Refusé.',
        retryable: false,
      });
    });

    it('laisse réessayer après trop d’envois ou une coupure', () => {
      expect(uploadFailure(error(429), messages)).toEqual({
        message: 'Trop d’envois.',
        retryable: true,
      });
      expect(uploadFailure(error(0), messages)).toBe(INTERRUPTED);
      expect(uploadFailure(new UploadInterrupted(), messages)).toBe(INTERRUPTED);
    });
  });
});
