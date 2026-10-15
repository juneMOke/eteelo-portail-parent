import { DestroyRef, Signal, inject, signal } from '@angular/core';

/**
 * Le téléphone a-t-il du réseau ? Suivi des événements `online` / `offline` tant que le
 * composant vit. À appeler dans un contexte d'injection.
 */
export function injectOnline(): Signal<boolean> {
  const online = signal(navigator.onLine);
  const update = () => online.set(navigator.onLine);
  window.addEventListener('online', update);
  window.addEventListener('offline', update);
  inject(DestroyRef).onDestroy(() => {
    window.removeEventListener('online', update);
    window.removeEventListener('offline', update);
  });
  return online.asReadonly();
}
