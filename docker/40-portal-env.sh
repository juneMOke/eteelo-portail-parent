#!/bin/sh
# Icônes, favicon et manifeste de l'environnement, posés au démarrage du conteneur
# (lancé par l'entrypoint de nginx, avant nginx). Une seule image pour tous les environnements :
# l'image de staging est promue en prod sans rebuild, l'environnement ne peut donc venir que d'ici.
# Ces fichiers sont exclus du service worker (ngsw-config.json) : leur empreinte change selon l'environnement.
set -eu

case "$PORTAL_ENV" in
  prod | staging | dev) ;;
  *)
    echo "✗ PORTAL_ENV='${PORTAL_ENV}' inconnu (attendu : prod, staging ou dev)" >&2
    exit 1
    ;;
esac
cp -R "/usr/share/nginx/branding/${PORTAL_ENV}/." /usr/share/nginx/html/
echo "→ Icônes et manifeste de ${PORTAL_ENV}"
