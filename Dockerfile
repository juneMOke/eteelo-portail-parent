# Portail parent : build Angular dans Node, service statique par nginx.
# Une seule image pour tous les environnements : l'API est en relatif (/api/v1/parent),
# le reverse proxy de chaque environnement route /api vers Spring.

FROM node:24.16-alpine AS build
WORKDIR /app
RUN npm install -g npm@12.2.0
COPY package.json package-lock.json ./
RUN npm ci --no-audit --no-fund
COPY . .
RUN NG_CLI_ANALYTICS=false npx ng build

FROM nginx:1.30-alpine
COPY nginx.conf /etc/nginx/conf.d/default.conf
COPY --from=build /app/dist/eteelo-portail-parent/browser /usr/share/nginx/html
# Icônes, favicon et manifeste par environnement : le build sert prod, 40-portal-env.sh pose
# au démarrage ceux de PORTAL_ENV (prod | staging | dev).
COPY branding/prod /usr/share/nginx/branding/prod
COPY branding/staging /usr/share/nginx/branding/staging
COPY branding/dev /usr/share/nginx/branding/dev
COPY --chmod=755 docker/40-portal-env.sh /docker-entrypoint.d/40-portal-env.sh
ENV PORTAL_ENV=prod
EXPOSE 80
# Lu par le déploiement : la bascule n'est validée qu'une fois le conteneur « healthy ».
HEALTHCHECK --interval=10s --timeout=3s --start-period=5s --retries=3 \
  CMD wget -q -O /dev/null http://127.0.0.1/healthz || exit 1
