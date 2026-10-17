import { Injector, runInInjectionContext, signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { Observable, Subject, throwError } from 'rxjs';
import { settle } from '../../../testing/async';
import { SessionCache, sessionResource } from './session-cache';

describe('sessionResource', () => {
  function setup() {
    const cache = TestBed.inject(SessionCache);
    const week = signal(1);
    let server = new Subject<string>();
    const stream = vi.fn((): Observable<string> => server);
    const open = () =>
      runInInjectionContext(TestBed.inject(Injector), () =>
        sessionResource({ cache, name: 'test.week', params: week, stream: () => stream() }),
      );
    return {
      cache,
      week,
      stream,
      open,
      next: () => (server = new Subject<string>()),
      server: () => server,
    };
  }

  it('se comporte comme rxResource à la première lecture', async () => {
    const { open, server } = setup();
    const resource = open();
    await settle();

    expect(resource.isLoading()).toBe(true);
    expect(resource.refreshing()).toBe(false);
    server().next('semaine 1');
    await settle();
    expect(resource.value()).toBe('semaine 1');
  });

  it('affiche aussitôt la valeur gardée au retour, puis la réponse du serveur', async () => {
    const { open, server, next, stream } = setup();
    open();
    await settle();
    server().next('semaine 1');
    server().complete();
    await settle();

    next();
    const back = open();
    await settle();
    expect(back.value()).toBe('semaine 1');
    expect(back.refreshing()).toBe(true);
    expect(stream).toHaveBeenCalledTimes(2);

    server().next('semaine 1 · note publiée');
    await settle();
    expect(back.value()).toBe('semaine 1 · note publiée');
    expect(back.refreshing()).toBe(false);
    expect(back.refreshed()).toBe(true);
  });

  it('ne signale aucun changement quand le serveur répond la même chose', async () => {
    const { open, server, next } = setup();
    open();
    await settle();
    server().next('semaine 1');
    await settle();

    next();
    const back = open();
    await settle();
    server().next('semaine 1');
    await settle();

    expect(back.refreshed()).toBe(false);
  });

  it('garde la valeur connue quand le serveur échoue, et le dit', async () => {
    const { open, server, next } = setup();
    open();
    await settle();
    server().next('semaine 1');
    await settle();

    next();
    const back = open();
    await settle();
    server().error(new Error('hors connexion'));
    await settle();

    expect(back.error()).toBeUndefined();
    expect(back.value()).toBe('semaine 1');
    expect(back.stale()).toBe(true);
  });

  it('garde une clé par paramètres, et retient une valeur posée par la page', async () => {
    const { open, server, week, cache } = setup();
    const resource = open();
    await settle();
    server().next('semaine 1');
    await settle();

    resource.set('semaine 1 · copie déposée');
    expect(cache.get('test.week:1')).toBe('semaine 1 · copie déposée');

    week.set(2);
    await settle();
    expect(cache.get('test.week:2')).toBeUndefined();
  });

  it('oublie tout à la fermeture de la session', () => {
    const cache = TestBed.inject(SessionCache);
    cache.set('test.week:1', 'semaine 1');

    cache.clear();

    expect(cache.get('test.week:1')).toBeUndefined();
  });

  it('oublie les réponses les plus anciennes au-delà de soixante', () => {
    const cache = TestBed.inject(SessionCache);
    for (let index = 0; index <= 60; index++) cache.set(`k${index}`, index);

    expect(cache.get('k0')).toBeUndefined();
    expect(cache.get('k60')).toBe(60);
  });

  it('remonte l’erreur sans valeur connue', async () => {
    const cache = TestBed.inject(SessionCache);
    const resource = runInInjectionContext(TestBed.inject(Injector), () =>
      sessionResource({
        cache,
        name: 'test.error',
        params: () => 1,
        stream: () => throwError(() => new Error('hors connexion')),
      }),
    );
    await settle();

    expect(resource.error()).toBeDefined();
    expect(resource.stale()).toBe(false);
  });
});
