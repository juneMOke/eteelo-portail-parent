# CLAUDE.md — Portail parent ETEELO CONNECT

Instructions pour Claude Code sur ce dépôt. Les lire avant toute modification.

## Le projet

Portail web des parents d'élèves pour ETEELO CONNECT, ERP scolaire des écoles privées de Kinshasa (RDC).
Un parent s'y connecte par lien magique WhatsApp et suit un enfant à la fois : devoirs, évaluations,
emploi du temps, notes, présence, discipline, frais, reçus, messages, notifications.

- Cible : téléphones Android d'entrée de gamme, réseau 3G instable. Le poids du bundle et le nombre
  d'allers-retours réseau sont les coûts dominants.
- Décisions d'architecture : ADR-019 v1.1 (fait foi en cas de doute).
- Maquette de référence : « Portail Parent - App » (Claude Design). Les specs d'expérience
  (« Specs - 02 Page Accueil v3 », etc.) priment sur la maquette en cas d'écart.

## Langue

- Domaine, interface, messages, commentaires métier : **français**.
- Identifiants de code (classes, fonctions, variables, fichiers, dossiers, routes, paramètres d'URL) : **anglais**.
  Seuls les textes affichés restent en français.

## Stack

- Angular 22, composants standalone, **zoneless**, signals-first.
- `@ngrx/signals` (SignalStore) pour les domaines qui écrivent ; `httpResource` admis derrière une façade pour les domaines en lecture.
- Valibot : validation à l'exécution du bootstrap et du bulletin uniquement.
- CSS natif + design tokens (`src/styles/tokens.css`) + Angular CDK pour le comportement. **Pas de Tailwind, pas de librairie de composants.**
- Tests unitaires : Vitest (`ng test`). Bout en bout : Playwright.
- Types d'API générés depuis l'OpenAPI de Spring (`src/app/core/api/api-types.ts`, ne jamais l'éditer à la main).

## Commandes

```bash
npm start               # ng serve, avec proxy /api (proxy.conf.json)
npx ng test             # tests unitaires Vitest
npx ng build            # build de production
npx playwright test     # tests de bout en bout
npm run api:types       # régénère api-types.ts depuis l'OpenAPI de staging
```

## Arborescence

```
src/app/
  core/       api (types générés, ParentApi, intercepteur), session (SessionStore, gardes), shell
  shared/     ui (assignment-card, attachment-picker, avatar, badge, card, copy-button, empty-period,
                  empty-state, file-row, file-upload, filter-menu, grade, icon, load-error, period-navigator,
                  pill-group, sheet, skeleton, swipe-pager, upload-progress, week-banner, tone), a11y (radio-focus),
              date (civil-date), files (document-actions, downscale-image, file-type), format (amount, count,
                  day-labels, file-size, relative-week, time-labels), layout (media-query), navigation (query-param-sheet), network (online),
              resource (latest-value), pipes (amount)
  features/   auth, home, agenda, grades, conduct, finance, communication
src/styles/   tokens.css, base.css
```

Routes : `/login`, `/login/:token` (magic-link), `/no-children`, puis tout le métier sous `/c/:childId` :
accueil sur `/c/:childId`, `homework`, `assessments`, `timetable`, `grades/{week,courses,report-card}`,
`conduct/{attendance,discipline}`, `finance/{fees,receipts,payments}`, `messages`, `notifications`.

Nommage : une page = `*.page.ts`, classe `XxxPage` ; un composant = `*.component.ts`, classe `XxxComponent`.
Sélecteurs `app-` (core, features) et `ui-` (shared/ui).

Chaque feature contient `data-access/` (façade, store si le domaine écrit) et ses composants.

## Invariants — ne jamais enfreindre

1. **Façade obligatoire.** Un composant n'injecte jamais `HttpClient`, `httpResource`, `ParentApi`
   ni le store d'un autre domaine. Il passe par la façade de sa feature.
2. **Aucun calcul métier côté front.** Moyenne, rang, mention, statut de frais, solde, verdict
   d'une évaluation viennent du serveur. Le front met en forme, il ne calcule pas.
   Seule exception documentée : le code couleur des notes (≥ 12 vert, 10 à 12 bleu, < 10 terre cuite).
3. **L'enfant courant est dans l'URL** (`/c/:childId/…`). Aucun store ne le détient comme source de vérité.
   Changer d'enfant = naviguer.
4. **Aucune feature n'importe une autre feature.** Les liens entre domaines passent par le routeur.
   `shared/` ne dépend d'aucun code métier.
5. **Aucune donnée métier en cache hors ligne.** Le service worker ne sert que le shell.
   Pas de `localStorage` pour les données ni pour un jeton.
6. **Montants bi-devise.** Un montant porte toujours sa devise (USD ou CDF). Les totaux s'affichent
   par devise, jamais convertis ni additionnés entre devises. Utiliser le pipe `amount`.
7. **Pas de `withFetch()`** dans `provideHttpClient` : le backend fetch ne remonte pas la progression
   d'upload, nécessaire au dépôt de devoir.

## Conventions Angular

- `inject()` plutôt que l'injection par constructeur.
- `input()`, `output()`, `model()` ; jamais `@Input()` / `@Output()`.
- Contrôle de flux `@if`, `@for` (avec `track`), `@switch` ; jamais `*ngIf` / `*ngFor`.
- `ChangeDetectionStrategy.OnPush` sur tous les composants.
- Template et styles en ligne seulement si le template tient en ~15 lignes et les styles en ~20 ;
  au-delà, ou dès qu'un des deux grossit, fichiers séparés (`.html`, `.css`, défaut de la CLI).
- `computed()` pour l'état dérivé ; pas d'`effect()` pour propager de l'état (réservé aux effets de bord).
- Pages chargées en lazy (`loadComponent` / `loadChildren`), exportées par défaut.
- `childId` arrive en `input()` via `withComponentInputBinding()`.
- Formulaires : Reactive Forms typés.
- Pas de NgModule, pas de zone.js, pas de `any`.

## HTTP, session, sécurité

- L'API est toujours appelée en relatif sur `/api/...` (même origine que le portail).
- Session : cookie `httpOnly` posé par le serveur. Ne jamais lire ni stocker de jeton côté client.
- CSRF (double-submit) : Angular envoie `X-XSRF-TOKEN` à partir du cookie `__Host-XSRF-TOKEN` sur toute requête
  non GET. Le préfixe `__Host-` empêche un sous-domaine d'imposer un faux jeton. Ne pas contourner.
- 401 : l'intercepteur réinitialise la session et renvoie vers `/login`. Ne pas gérer le 401 ailleurs.
- 403 sur une route `/api/v1/parent/children/{childId}/…` : enfant hors du périmètre du parent, renvoyer au premier enfant.
- Toutes les routes du portail sont sous `/api/v1/parent/…`, sans réécriture de chemin (ni proxy, ni Traefik).
- Le bootstrap (`GET /api/v1/parent/bootstrap`) est chargé une seule fois par session via `SessionStore.ensureLoaded()`.

## Style et design

- Couleurs, espacements, rayons, typographies : uniquement via les variables de `tokens.css`. Aucune couleur hexadécimale dans un composant.
- Palette de marque : Bleu Profond `#0E2D42`, Bleu Ardoise `#1B4D6B`, Terre Cuite `#B85C2C`, Or Doux `#D9A24E`, Blanc Cassé `#FAFAF7` (définis dans les tokens, avec les couleurs sémantiques).
- Polices : Inter (interface) et Lora (titres, montants), servies en woff2 depuis `public/fonts`. Aucun appel à Google Fonts.
- Mobile d'abord. Point de rupture principal : 905 px (grille Material). Au-dessus : menu latéral.
  En dessous : **pas de barre basse**, l'Accueil sert de menu et chaque page a un bouton retour.
  Seuil secondaire : 600 px (tuiles sur plusieurs colonnes en tablette). Contenu plafonné à 1 180 px.
- Les variables CSS ne fonctionnent pas dans les media queries : seuils écrits en dur
  (`@media (min-width: 905px)`), mobile d'abord, référencés en commentaire dans `tokens.css`.
- Chaque écran gère ses états : chargement (squelette), vide, erreur.
- Accessibilité : contrastes AA, cibles tactiles ≥ 44 px, libellés sur les boutons-icônes.

## Tests

- Toute façade et tout store ont des tests unitaires.
- Les composants de `shared/ui` ont des tests de rendu.
- Un parcours Playwright par écran livré (au minimum : affichage nominal et état vide).

## À éviter

- Ajouter une dépendance sans justification : chaque Ko compte en 3G.
- Calculer côté front ce que le serveur fournit (voir invariant 2).
- Modifier `api-types.ts` à la main.
- Écrire des libellés d'interface en anglais.
