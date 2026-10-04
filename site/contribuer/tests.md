# Tests

Deux outils : Vitest pour la logique et les écrans, Playwright pour le navigateur réel. `pnpm check` lance Vitest ; `pnpm e2e` lance Playwright.

## Vitest

`pnpm test` exécute `vitest run` dans jsdom, avec le réglage `src/testing/setup.ts`. Il couvre :

- les tests de `src/`, à côté du code (`x.test.ts`, `x.test.tsx`) ;
- les tests de `scripts/` et de `vite/` ;
- les garde-fous du site, par exemple `site/guide/*.test.ts` (référence de la config, dépannage) et `site/contribuer/links.test.ts`.

Seul le dossier `e2e/` est exclu : ses specs sont des tests Playwright. Les fixtures et doublures partagées vivent dans `src/testing/`. Les tests de `src/lib/db/` utilisent `fake-indexeddb`.

Pour écrire un test, ouvrez la section du gabarit qui correspond au code testé, par exemple [Mutation de session](https://github.com/AdrienGras/questionator-z4000-hyperdrive/blob/main/docs/CONVENTIONS.md#mutation-de-session--squelette) pour la base, ou [Calcul de note](https://github.com/AdrienGras/questionator-z4000-hyperdrive/blob/main/docs/CONVENTIONS.md#calcul-de-note--squelette) pour le métier.

## Couverture

`pnpm test:coverage` lance la même suite avec la mesure de couverture (`@vitest/coverage-v8`). Elle affiche un résumé et écrit le rapport dans `coverage/` : `coverage/lcov.info`, et une version HTML à ouvrir dans `coverage/lcov-report/index.html`. `pnpm test` et `pnpm check` ne mesurent rien, pour rester rapides.

Seuls `src/`, `scripts/` et `vite/` sont mesurés. En sont exclus les tests, les déclarations `.d.ts`, `src/testing/`, le code généré (`src/routeTree.gen.ts`) et le code shadcn (`src/components/ui/`). Les mêmes exclusions sont écrites dans [`vite.config.ts`](https://github.com/AdrienGras/questionator-z4000-hyperdrive/blob/main/vite.config.ts), [`sonar-project.properties`](https://github.com/AdrienGras/questionator-z4000-hyperdrive/blob/main/sonar-project.properties) et [`codecov.yml`](https://github.com/AdrienGras/questionator-z4000-hyperdrive/blob/main/codecov.yml) : si vous en changez une, changez les trois. Les tests Playwright ne comptent pas dans la couverture.

En CI, le job `check` lance `pnpm test:coverage`, puis envoie le rapport à Codecov et à SonarQube Cloud :

- **SonarQube Cloud** juge : son quality gate échoue si la couverture du nouveau code passe sous 80 %. Sous 20 lignes nouvelles, Sonar ignore cette condition, donc une PR de documentation n'est pas bloquée.
- **Codecov** informe : il commente la PR (évolution de la couverture, fichiers touchés) et pose deux statuts, `project` et `patch`, qui ne bloquent jamais.

Le choix est expliqué dans [D99](https://github.com/AdrienGras/questionator-z4000-hyperdrive/blob/main/docs/DECISIONS.md#d99--f42-126--couverture-des-tests-codecov-et-analyse-sonar-par-la-ci-2026-10-03).

## Playwright

`pnpm e2e` joue les specs de `e2e/` dans Chromium seul, contre le build de production servi par `vite preview` sur le port 4173. Le serveur est lancé par Playwright : il construit l'app, puis la doc.

- Un **page object** par écran, dans `e2e/pages/`. Les specs n'enchaînent que des appels de pages et des `expect`.
- Les éléments se trouvent par rôle et nom accessible, jamais par sélecteur CSS ni `data-testid`.
- Chaque test part d'un contexte neuf, donc d'une IndexedDB vide (`e2e/fixtures.ts`).

Le gabarit complet : [Test e2e Playwright](https://github.com/AdrienGras/questionator-z4000-hyperdrive/blob/main/docs/CONVENTIONS.md#test-e2e-playwright--squelette-page-object-model).

La CI lance les tests de bout en bout dans un job `e2e`, après l'installation de Chromium.

## Les captures du guide

`pnpm docs:screenshots` régénère les images de `site/public/screenshots/` avec Playwright, via la config dédiée `playwright.screenshots.config.ts`. Le hasard et l'horloge y sont figés pour que deux exécutions donnent les mêmes images. La CI ne les lance pas : les PNG sont commités. Après un changement visible de l'interface, relancez la commande et commitez les images. Le choix est expliqué dans [D97](https://github.com/AdrienGras/questionator-z4000-hyperdrive/blob/main/docs/DECISIONS.md#d97--f28-72--guide-utilisateur-captures-et-garde-fous-2026-10-02).

## Ce qui se teste où

| Vous changez | Vous testez avec |
|---|---|
| Une règle métier (`domain/`) | Vitest, fichier voisin, sans React |
| Un écran (`features/`) | Vitest et Testing Library |
| La base locale (`lib/db/`) | Vitest avec `fake-indexeddb` |
| Un parcours complet, le hors ligne, la vue projetée | Playwright |
| Un champ du schéma ou un code d'erreur | Les tests du guide l'exigent dans `reference-config.md` et `depannage.md` |
| Un lien de ce guide vers le dépôt | `site/contribuer/links.test.ts` |
| Un lien du README ou d'un fichier communautaire | `scripts/community-links.test.ts` |
