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
EXPOSE 80
