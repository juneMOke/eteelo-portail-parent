/**
 * Proxy de `ng serve` (développement uniquement : il n'entre pas dans le build).
 * En staging et en prod, c'est le reverse proxy devant le conteneur qui route /api vers Spring.
 *
 * API_TARGET choisit le backend : back local par défaut, staging via `npm run start:staging`.
 */
const target = process.env.API_TARGET ?? 'http://localhost:8080';

export default {
  '/api': {
    target,
    secure: true,
    changeOrigin: true,
    // Les cookies du backend doivent se poser sur localhost, quel que soit le domaine visé.
    cookieDomainRewrite: '',
  },
};
