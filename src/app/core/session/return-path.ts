/**
 * Adresse de retour après connexion (amendement A4 du contrat « Annonces ») : la page d'un enfant
 * demandée sans session, portée par le lien magique puis rendue à l'ouverture de session.
 * Même liste d'autorisation que le serveur : `/c/{uuid}`, des segments en minuscules, chiffres
 * et tirets, puis une requête facultative en lettres, chiffres, `=`, `&`, `_` et `-`. Tout le
 * reste (autre origine, `//`, encodage, fragment) est écarté : on ne sort jamais du portail.
 */
const RETURN_PATH =
  /^\/c\/[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}(\/[a-z0-9-]+)*(\?[A-Za-z0-9=&_-]*)?$/;
const MAX_LENGTH = 512;

/** L'adresse si elle peut servir de retour, sinon null. */
export function returnPathOf(url: string | null | undefined): string | null {
  return url && url.length <= MAX_LENGTH && RETURN_PATH.test(url) ? url : null;
}
