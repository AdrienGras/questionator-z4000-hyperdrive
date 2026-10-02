# F28 — Guide utilisateur — Design

- **Date** : 2026-10-02
- **Ticket** : [#72](https://github.com/AdrienGras/questionator-z4000-hyperdrive/issues/72)
- **Branche** : `feat/72-guide-utilisateur`
- **Statut** : design validé en conversation, figé ici avant le plan d'implémentation.

## Contexte

F27 (#71, D96) a posé le site VitePress dans `site/`, avec dix pages squelettes dans `site/guide/`. Le public visé est un enseignant qui découvre l'application seul : il doit pouvoir préparer et faire passer une session d'oraux sans aide extérieure.

Références : [`PRODUCT.md`](https://github.com/AdrienGras/questionator-z4000-hyperdrive/blob/main/PRODUCT.md) §2, §4, §5, §6, §8 · `public/config.schema.json` (généré par `buildConfigJsonSchema`, `src/domain/config/json-schema.ts`) · `src/domain/config/messages.ts`, `src/domain/students/messages.ts` · D96.

## Objectif

Un guide complet en français, illustré de captures générées automatiquement, qui devient la référence utilisateur du format de config. `PRODUCT.md` reste la source de vérité produit ; en cas d'écart, le guide suit le code et l'écart est signalé, jamais inventé.

## Décisions (D97)

| Sujet | Décision | Raison |
|---|---|---|
| Captures | Playwright, config dédiée `playwright.screenshots.config.ts`, specs dans `e2e/screenshots/`, page objects des e2e réutilisés | Même serveur (`webServer` des e2e) et mêmes sélecteurs : une capture casse quand l'UI casse, pas silencieusement. |
| Format | PNG, 1280×800, `deviceScaleFactor: 2`, Chromium, locale `fr-FR`, `colorScheme: 'light'`, animations désactivées | Choix utilisateur : net sur écran HiDPI, ~3-4 Mo au total accepté. Mode sombre hors périmètre. |
| Déterminisme | `crypto.getRandomValues` remplacé par un PRNG à graine fixe (`addInitScript`), horloge figée par `page.clock.install` à `2026-09-15T09:00:00+02:00`, données = fichiers d'exemple de `public/` | Le tirage (`src/domain/passage/random.ts`) et les dates affichées sont les seules sources de variation. Aucun code de l'app ne change. |
| CI | `docs:screenshots` n'est pas lancé en CI | Coûteux et dépendant du rendu de la machine ; les PNG sont commités. `docs:build` échoue déjà si une image référencée manque. |
| Référence | Rédigée à la main, verrouillée par un test de couverture du schéma | Exigé par le ticket ; une page générée perdrait les exemples et les explications. |
| Dépannage | Une ancre par code d'erreur de création de session, verrouillée par un test | Rend vérifiable le critère « chaque message d'erreur … a une entrée ». |
| Voix | Vouvoiement, phrases courtes, comme l'interface ; relecture `humanize-fr` (registre support pédagogique) de chaque page | Cohérence avec les messages de l'app. |

## Pages

Les dix fichiers existants de `site/guide/` sont remplis ; slugs et titres inchangés (sidebar de `site/.vitepress/config.ts` inchangée). Aucune page squelette ne reste.

| Page | Contenu | Captures |
|---|---|---|
| `prise-en-main.md` | Ce que fait l'app ; rien ne quitte le navigateur (stockage local) ; parcours complet avec `students.example.csv` et `config.example.json` : accueil → nouvelle session → passage d'un étudiant (tirage, note) → statistiques → export Excel. Se suffit à lui seul (critère 1). | accueil, création remplie, passage avec question tirée, export |
| `preparer-les-fichiers.md` | CSV : colonnes nom / prénom, en-tête, séparateur, encodage (UTF-8, ancien encodage détecté), doublons, lignes vides ; config par l'exemple : catégories, questions, barèmes, couleurs, icônes Tabler, blocs de code, images. Renvoie à la référence. | création avec avertissements CSV |
| `reference-config.md` | Chaque champ du schéma : type, obligatoire, défaut, exemple ; règles croisées vérifiées à la création ; `$schema` et l'aide de VSCode. | — |
| `editeur-config.md` | Éditeur intégré (F26) : ouverture, autocomplétion (Ctrl+Espace), survol, erreurs, aperçu, créer une session depuis l'éditeur. | éditeur avec aperçu |
| `sessions.md` | Créer, reprendre (liste de l'accueil), exporter / importer une sauvegarde, supprimer. | accueil avec sessions |
| `faire-passer.md` | Tirage par catégorie, notation, score cumulé, skip, absent, changement d'étudiant, panneau latéral, ajustement, note finale. | passage, panneau latéral, note finale |
| `projeter.md` | Vue projetée, ouverture dans une seconde fenêtre, double écran, ce que voit l'étudiant (pas la réponse attendue), aperçu. | vue projetée |
| `stats-export.md` | Statistiques (histogramme, effectifs), export Excel : feuilles et colonnes. | statistiques |
| `hors-ligne.md` | Installation (Chrome, Edge), fonctionnement sans réseau après un premier chargement, bouton « Recharger » à chaque version, limite des images distantes ; la doc elle-même n'est pas hors ligne. | — |
| `depannage.md` | FAQ ; une entrée par code d'erreur de création (voir Garde-fous) ; CSV mal reconnu ; projection ; perte de données (stockage du navigateur, sauvegarde). | — |

Les images sont référencées par `![texte alternatif](/screenshots/<nom>.png)` (chemin public VitePress, résolu sous la base). Chaque image a un texte alternatif qui décrit ce qu'elle montre. Les noms de fichiers sont listés dans le plan.

## Captures : `pnpm docs:screenshots`

- `package.json` : `"docs:screenshots": "playwright test -c playwright.screenshots.config.ts"`.
- `playwright.screenshots.config.ts` : `testDir: 'e2e/screenshots'`, même `webServer` et même `baseURL` que `playwright.config.ts` (valeurs importées, pas recopiées), projet Chromium unique avec `viewport: { width: 1280, height: 800 }`, `deviceScaleFactor: 2`, `colorScheme: 'light'`, `locale: 'fr-FR'`, `timezoneId: 'Europe/Paris'`, `workers: 1`.
- `playwright.config.ts` ignore `e2e/screenshots/` (`testIgnore`), pour que `pnpm e2e` ne régénère rien.
- `e2e/screenshots/determinism.ts` : fixture qui installe le PRNG (mulberry32, graine `72`) à la place de `crypto.getRandomValues` et fige l'horloge.
- Chaque capture : `page.screenshot({ path: 'site/public/screenshots/<nom>.png', animations: 'disabled', caret: 'hide' })`, plein viewport sauf mention (élément ciblé pour un détail).
- Vérification du déterminisme : deux exécutions successives, `git status --porcelain site/public/screenshots` vide après la seconde.

## Garde-fous (Vitest)

`site/guide/reference-config.test.ts` (ou `scripts/`, voir plan) :

- Parcourt le schéma de `buildConfigJsonSchema()` (propriétés, `items` → `[]`, `anyOf`/`oneOf`/`allOf`) et produit les chemins : `exam.title`, `categories[].questions[].answer`, etc.
- Chaque chemin doit apparaître en code inline (`` `chemin` ``) dans `site/guide/reference-config.md`.
- **Exception thème** : pour `theme.light.<jeton>` et `theme.dark.<jeton>`, il suffit que `` `<jeton>` `` apparaisse (un seul tableau de jetons partagé par les deux modes), et que `` `theme.light` `` et `` `theme.dark` `` apparaissent.
- Un message d'échec liste les chemins manquants.

`site/guide/depannage.test.ts` :

- Codes attendus : clés de `ConfigIssueParams` (`src/domain/config/issues.ts`) et de `StudentIssueParams` (`src/domain/students/issues.ts`), lues depuis les dictionnaires exportés ou une liste exportée (voir plan).
- Chaque code doit apparaître comme ancre `{#<code>}` sur un titre de `site/guide/depannage.md`. Une entrée peut porter plusieurs codes : les ancres supplémentaires sont posées par `<span id="<code>"></span>` dans l'entrée. Le test accepte les deux formes.
- Un message d'échec liste les codes manquants.

Ces tests vivent hors de `src/` : ils lisent `site/` et `src/domain/` sans être soumis à `pnpm deps`. Vitest doit les inclure (vérifié au plan).

## README

La section « Écrire une config » devient : une phrase, la ligne `$schema`, et un lien vers `https://adriengras.github.io/questionator-z4000-hyperdrive/docs/guide/reference-config.html`. Le lien vers le fichier d'exemple reste.

## Mémoire

- `docs/DECISIONS.md` : D97 (tableau ci-dessus).
- `docs/ENVIRONMENT.md` : `pnpm docs:screenshots` (build de l'app et de la doc, Chromium, écrit dans `site/public/screenshots/`).
- `docs/QUIRKS.md` : pièges rencontrés (rapports d'implémentation).
- `docs/INDEX.md` : ligne F28 ; `docs/HANDOFF.md` : entrée du jour, et mise à jour de l'entrée #71 (PR #122 mergée).
- `docs/BACKLOG.md` : captures en mode sombre, traduction anglaise (si non déjà présents).

## Critères d'acceptation et vérification

| Critère | Vérifié par |
|---|---|
| De *Prise en main* et des exemples jusqu'à l'export Excel sans autre source | Relecture : suivre la page pas à pas sur `pnpm preview` (revue finale) |
| Toutes les pages existent, plus de squelette | Relecture + `grep` de la phrase type des squelettes (« Cette page décrira ») vide dans `site/guide/` |
| `pnpm docs:screenshots` régénère à l'identique | Deux exécutions, `git status` vide |
| Retirer un champ de la référence fait échouer le test | Test de couverture + expérience manuelle consignée |
| Chaque message d'erreur de création a une entrée | Test des ancres de dépannage |
| Le README renvoie vers la référence | Diff du README |

## Hors périmètre

Captures en mode sombre, vidéos, GIF ; traduction anglaise ; section « Contribuer » (#73).
