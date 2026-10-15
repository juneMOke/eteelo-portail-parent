import { Injector, runInInjectionContext, signal } from '@angular/core';
import { rxResource } from '@angular/core/rxjs-interop';
import { TestBed } from '@angular/core/testing';
import { Observable, Subject, of, throwError } from 'rxjs';
import { settle } from '../../../testing/async';
import { latestValue } from './latest-value';

describe('latestValue', () => {
  it('garde la valeur précédente pendant le chargement, rien en erreur', async () => {
    const page = signal(1);
    const pending = new Subject<string>();
    const responses: Record<number, () => Observable<string>> = {
      1: () => of('semaine 1'),
      2: () => pending,
      3: () => throwError(() => new Error('hors connexion')),
    };
    const { resource, latest } = runInInjectionContext(TestBed.inject(Injector), () => {
      const resource = rxResource({ params: page, stream: ({ params }) => responses[params]() });
      return { resource, latest: latestValue(resource) };
    });

    await settle();
    expect(latest()).toBe('semaine 1');

    page.set(2);
    await settle();
    expect(resource.isLoading()).toBe(true);
    expect(latest()).toBe('semaine 1');

    pending.next('semaine 2');
    await settle();
    expect(latest()).toBe('semaine 2');

    page.set(3);
    await settle();
    expect(latest()).toBeUndefined();
  });
});
