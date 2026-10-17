/**
 * Nom du cookie CSRF posé par le backend visé. « __Host- » exige Secure et interdit Domain :
 * un sous-domaine ne peut pas imposer un faux jeton.
 *
 * Remplacé par xsrf-cookie.local.ts dans les configurations `development` et `mock`, où le back local
 * (profil dev, http) nomme le cookie XSRF-TOKEN. La configuration `staging-backend` garde ce nom-ci.
 */
export const XSRF_COOKIE_NAME = '__Host-XSRF-TOKEN';
