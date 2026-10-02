# F27 — Site de documentation (socle) — Design

- **Date** : 2026-10-02
- **Ticket** : [#71](https://github.com/AdrienGras/questionator-z4000-hyperdrive/issues/71)
- **Branche** : `feat/71-site-doc`
- **Statut** : design validé en conversation, figé ici avant le plan d'implémentation.

## Contexte

L'application s'adresse à des enseignants qui ne connaissent pas forcément son auteur. La seule aide est aujourd'hui le README (section « Écrire une config ») et `PRODUCT.md`, document de conception. F27 pose le socle d'un site de documentation ; son contenu est écrit par F28 (#72, guide utilisateur) et F29 (#73, contribuer).

Références : [`PRODUCT.md`](https://github.com/AdrienGras/questionator-z4000-hyperdrive/blob/main/PRODUCT.md) §9 (stack), F17 (hors ligne) · `docs/DECISIONS.md` D59 (arborescence), D72 (PWA).

## Objectif

Un site VitePress en français, publié sous `https://adriengras.github.io/questionator-z4000-hyperdrive/docs/` dans le même artefact Pages que l'application, avec deux sections squelettes « Guide » et « Contribuer ». L'application y renvoie par un lien « Aide » dans l'en-tête commun.

## Décisions (D96)

| Sujet | Décision | Raison |
|---|---|---|
| Générateur | **VitePress `2.0.0-alpha.20`**, épinglé en version exacte | VitePress stable (`1.6.4`, août 2025) dépend de Vite 5 (hors support) et de Shiki 2 : il ajouterait un second Vite et un second Shiki à l'arbre. La 2.0 alpha dépend de Vite 8 et Shiki 4, comme l'application. Risque assumé : l'API peut bouger d'une alpha à l'autre ; chaque montée est manuelle. Starlight écarté : écosystème Astro en plus pour un site squelette. |
| Emplacement | Sources dans `site/`, pas dans `docs/` | `docs/` porte la mémoire projet, que VitePress publierait, et le hook `SessionStart` classe les `docs/*.md` de la racine. |
| URL | `cleanUrls` désactivé (URL en `.html`) | Fonctionne tel quel sur GitHub Pages et en `vite preview`, sans réécriture. |
| Hors ligne | La doc n'est **pas** pré-cachée ; le service worker de l'app la laisse passer au réseau | Le pré-cache vise l'app (F17). La doc hors ligne est notée au BACKLOG. |
| Formatage | oxfmt (le formateur du projet, pas Prettier) couvre `site/**/*.{ts,css}` ; les `.md` restent ignorés | `**/*.md` est déjà ignoré dans tout le dépôt (`.oxfmtrc.json`). |
| Accent | Rose du soleil de l'icône, `#ff2d95` en sombre, assombri en clair (contraste ≥ 4,5:1 sur blanc) | Habillage limité au logo et à l'accent (hors périmètre au-delà). `#ff2d95` sur blanc tombe à ~3,4:1. |
| Vue projetée | Pas de lien « Aide » | Elle n'utilise pas `PageShell` et s'adresse à l'étudiant. |

## Arborescence

```
site/
  .vitepress/
    config.ts           configuration (lang, base, outDir, thème, recherche, traductions)
    theme/index.ts      thème par défaut étendu, importe custom.css
    theme/custom.css    variables --vp-c-brand-* (accent) seulement
  public/logo.svg       copie de public/icons/icon.svg
  index.md              accueil (layout: home)
  guide/                10 pages squelettes
  contribuer/           7 pages squelettes
```

`site/.vitepress/cache` est ajouté au `.gitignore`. `site/` reste hors de `pnpm deps` (qui ne cruise que `src/`) et hors du build de l'app.

**Pages squelettes** (titre `#` et une phrase, rien d'autre), alignées sur les pages prévues par #72 et #73 :

| Guide (`site/guide/`) | Titre |
|---|---|
| `prise-en-main.md` | Prise en main |
| `preparer-les-fichiers.md` | Préparer les fichiers |
| `reference-config.md` | Référence de la config |
| `editeur-config.md` | Éditeur de config |
| `sessions.md` | Créer, reprendre et importer une session |
| `faire-passer.md` | Faire passer un oral |
| `projeter.md` | Projeter |
| `stats-export.md` | Statistiques et export Excel |
| `hors-ligne.md` | Hors ligne et installation |
| `depannage.md` | FAQ et dépannage |

| Contribuer (`site/contribuer/`) | Titre |
|---|---|
| `installer.md` | Installer le poste |
| `architecture.md` | Architecture |
| `conventions.md` | Conventions |
| `workflow.md` | Workflow |
| `tests.md` | Tests |
| `decisions.md` | Décisions |
| `claude-code.md` | Travailler avec Claude Code |

Pas de page d'index par section : l'entrée « Guide » mène à *Prise en main*, l'entrée « Contribuer » à *Installer le poste*.

## Configuration VitePress

- `lang: 'fr'`, `title: 'Questionator Z-4000 Hyperdrive'`, `description` en français.
- `base: '/questionator-z4000-hyperdrive/docs/'`, `outDir: '../dist/docs'` (relatif à `site/`).
- `head` : favicon vers `logo.svg` (préfixé par `base`).
- `themeConfig` :
  - `logo: '/logo.svg'`.
  - `nav` : Guide, Contribuer, Application (lien absolu vers `https://adriengras.github.io/questionator-z4000-hyperdrive/`).
  - `socialLinks` : GitHub vers le dépôt.
  - `sidebar` par préfixe (`/guide/`, `/contribuer/`), une liste par section dans l'ordre des tableaux ci-dessus.
  - `editLink` : `pattern: 'https://github.com/AdrienGras/questionator-z4000-hyperdrive/edit/main/site/:path'`, `text: 'Modifier cette page sur GitHub'`.
  - `search: { provider: 'local', options: { translations } }` avec les libellés français de la boîte de recherche (bouton, placeholder, aucun résultat, raccourcis clavier, réinitialiser, fermer).
  - Libellés du thème traduits : `outline.label` (« Sur cette page »), `docFooter` (« Page précédente » / « Page suivante »), `darkModeSwitchLabel`, `lightModeSwitchTitle`, `darkModeSwitchTitle`, `sidebarMenuLabel`, `returnToTopLabel`, `langMenuLabel`, `skipToContentLabel`, `notFound` (titre, citation, lien de retour), `lastUpdated` non activé.
- Mode sombre : `appearance` par défaut de VitePress (suit le système au premier affichage, bascule dans la barre).
- Liens morts : `ignoreDeadLinks` non renseigné, donc un lien interne mort fait échouer `docs:build` (vérifié une fois à l'implémentation par un lien cassé temporaire).

`site/.vitepress/config.ts` est ajouté à l'`include` de `tsconfig.node.json`, donc couvert par `pnpm typecheck` et oxlint.

**Accueil** (`index.md`, `layout: home`) : `hero` (nom, accroche « Faire passer des oraux notés par tirage de questions », phrase « Tout tourne dans le navigateur : aucune donnée ne quitte la machine de l'examinateur. »), trois actions : « Ouvrir l'application » (brand, lien absolu vers l'app), « Guide », « Contribuer » ; image : le logo.

**Logo** : `site/public/logo.svg` est une copie de `public/icons/icon.svg` ; un test Vitest compare les deux fichiers octet à octet pour empêcher la dérive.

## Scripts et CI

`package.json` :

```json
"docs:dev": "vitepress dev site",
"docs:build": "vitepress build site",
"docs:preview": "vitepress preview site"
```

`.github/workflows/ci.yml`, job `check` :

1. Après « Build », nouvelle étape « Build de la doc » : `pnpm docs:build` (sort dans `dist/docs/`, donc dans l'artefact Pages déjà téléversé depuis `dist`).
2. `check:precache` reste après les deux builds.
3. Nouvelle étape « Vérifier la base des assets de la doc » : `grep -q '/questionator-z4000-hyperdrive/docs/assets/' dist/docs/index.html`.

Ordre imposé : `vite build` vide `dist/` ; la doc doit être construite **après** l'app.

`playwright.config.ts` : la commande du `webServer` devient `pnpm build && pnpm docs:build && exec node_modules/.bin/vite preview …`, pour que les e2e servent aussi la doc.

## Service worker de l'app

Dans `vite.config.ts`, `workbox` :

- `navigateFallbackDenylist: [/\/docs(?:\/|$)/]` (couvre aussi `…/docs` sans barre finale) : sans cela, le repli de navigation du service worker sert `index.html` de l'app pour toute navigation sous son scope, doc comprise.
- `globIgnores: ['docs/**']` : défense en profondeur (la doc n'est pas dans `dist/` au moment où Workbox génère le manifeste, puisqu'elle est construite après).

`scripts/check-precache.ts` :

- `listDistFiles` ignore le dossier `docs/` de premier niveau (la doc n'est pas pré-cachée, c'est voulu).
- `main` échoue si une URL du manifeste commence par `docs/`, en la nommant (critère « le pré-cache de l'app ne contient aucun fichier de `docs/` »).
- Tests dans `check-precache.test.ts` pour les deux comportements.

## Lien « Aide »

- `src/components/page-shell.tsx` : un lien rendu juste avant `ColorModeToggle` (qui reste le dernier de la barre), dans le style des boutons `ghost` existants (`buttonVariants`), icône Tabler `IconHelp`, libellé visible.
- `href` : `` `${import.meta.env.BASE_URL}docs/` ``, `target="_blank"`, `rel="noopener noreferrer"`.
- Libellés dans `src/lib/i18n/ui-messages.ts` : texte visible « Aide » / « Help », nom accessible « Aide (nouvel onglet) » / « Help (opens in a new tab) ».
- Test `page-shell.test.tsx` : le lien existe, pointe vers la doc, s'ouvre dans un nouvel onglet, précède le bouton de thème.
- En `pnpm dev`, la doc n'est pas servie par le serveur de l'app : le lien n'aboutit pas. Noté dans QUIRKS (la doc se lance à part, `pnpm docs:dev`).

## Tests de bout en bout

Nouveau `e2e/docs.spec.ts` :

1. Ouvrir l'accueil de l'app, attendre que le service worker contrôle la page (même attente que `offline.spec.ts`).
2. Le lien « Aide » a `target="_blank"` et ouvre un nouvel onglet sur l'accueil de la doc (titre ou `hero` reconnaissable, pas l'app).
3. Dans le contexte contrôlé par le service worker, `goto('docs/')` affiche l'accueil de la doc.
4. `goto('docs/guide/prise-en-main.html')` puis `reload()` : la page *Prise en main* s'affiche, pas l'app.
5. La recherche locale ouverte, la saisie « Projeter » propose la page squelette *Projeter*.

## README et mémoire

- `README.md` : lien vers la doc en tête (sous le titre). La section « Écrire une config » reste jusqu'à F28.
- `docs/DECISIONS.md` : D96 (tableau ci-dessus).
- `docs/BACKLOG.md` : doc hors ligne ; doc en anglais ; passage à VitePress 2 stable dès sa sortie.
- `docs/ENVIRONMENT.md` : scripts `docs:*`, URL de la doc en ligne et en local (`docs:dev` sert sur le port par défaut de VitePress, 5173 ; `pnpm preview` sert l'app **et** la doc après les deux builds).
- `docs/QUIRKS.md` : lien « Aide » mort en `pnpm dev` ; ordre des builds (`vite build` efface `dist/docs/`).
- `docs/INDEX.md`, `docs/HANDOFF.md` : comme pour toute feature.

## Critères d'acceptation (rappel du ticket) et vérification

| Critère | Vérifié par |
|---|---|
| `pnpm docs:dev` sert le site ; `pnpm docs:build` produit `dist/docs/` | Lancement manuel ; CI |
| `…/docs/` affiche la doc avec le service worker de l'app actif | e2e étape 3 |
| Recharger une page profonde affiche la page | e2e étape 4 |
| `check:precache` passe, aucun fichier `docs/` pré-caché | CI + tests de `check-precache` |
| La recherche locale trouve une page squelette | e2e étape 5 |
| Un lien interne cassé fait échouer `docs:build` | Vérification manuelle à l'implémentation |
| Le lien « Aide » ouvre la doc dans un nouvel onglet | Test unitaire + e2e étape 2 |
| Mode sombre du système et bascule | Comportement par défaut de VitePress, vérifié à la main (Playwright, `emulateMedia`) |

## Hors périmètre

Contenu des guides (#72, #73), doc hors ligne, doc en anglais, habillage au-delà du logo et de l'accent.
