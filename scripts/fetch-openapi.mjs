/**
 * Rafraîchit openapi/api-docs.json depuis le spec de staging (npm run api:spec).
 * Le fichier est versionné : le CI régénère api-types.ts depuis lui, sans dépendre d'un serveur.
 * Formaté pour que la revue d'une PR montre ce qui a changé côté back.
 */
import { writeFile } from 'node:fs/promises';

const SOURCE = process.env.OPENAPI_URL ?? 'https://api-staging.eteeloconnect.com/v3/api-docs';
const TARGET = new URL('../openapi/api-docs.json', import.meta.url);

const response = await fetch(SOURCE);
if (!response.ok) {
  console.error(`Spec introuvable : ${SOURCE} a répondu ${response.status}.`);
  process.exit(1);
}
await writeFile(TARGET, JSON.stringify(await response.json(), null, 2) + '\n');
console.log(`openapi/api-docs.json mis à jour depuis ${SOURCE}.`);
