import { Resource, Signal, linkedSignal } from '@angular/core';

/**
 * La dernière valeur reçue d'une ressource, gardée pendant le chargement de la suivante : la
 * page reste lisible quand on change de semaine ou de période en 3G, plutôt qu'un squelette à
 * chaque geste. Undefined avant la première réponse et en erreur.
 */
export function latestValue<T>(resource: Resource<T | undefined>): Signal<T | undefined> {
  return linkedSignal<T | undefined, T | undefined>({
    source: () => (resource.hasValue() ? resource.value() : undefined),
    computation: (value, previous) => (resource.error() ? undefined : (value ?? previous?.value)),
  });
}
