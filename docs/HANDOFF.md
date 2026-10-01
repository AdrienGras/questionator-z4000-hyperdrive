# Handoff — état courant du projet

Notes informelles à destination de la prochaine session (humaine ou Claude). Format
libre, **antéchronologique** : l'entrée la plus récente en haut.

**À mettre à jour à la fin d'une session significative.** Pas besoin de noter chaque
petit truc — l'idée est de se resituer en 30 secondes en début de session.

Chaque entrée est un titre `## AAAA-MM-JJ — Titre court de la session`, suivi de
quatre marqueurs en **gras**, chacun en tête de paragraphe, dans cet ordre :
`**Dernière chose faite**`, `**Trucs en suspens**`, `**Prochaine chose à creuser**`,
`**Notes pour future Claude**`.

**Ces quatre marqueurs sont obligatoires, exactement sous cette forme — jamais en
sous-titres `###`, jamais en prose libre sans eux.** Le hook `SessionStart` extrait
le digest de resituation injecté à chaque démarrage de session en cherchant CES
marqueurs précis dans la dernière entrée. Une entrée qui ne les porte pas dégrade
silencieusement la resituation vers un extrait brut des 2000 premiers caractères du
corps, sans distinction entre ce qui est fait, en suspens, ou à creuser.

---

<!-- ARCHIVES:START -->
> Entrées antérieures archivées : [2026-09](handoff/2026-09.md)
<!-- ARCHIVES:END -->

## 2026-10-01 — F20 mergé, F24 : fond des blocs de code (#58)

**Dernière chose faite** : PR #69 (F20) mergée sur go de l'utilisateur. F24 traité comme ticket borné (design court validé en conversation, pas de spec ni de plan), sur `feat/f24-blocs-de-code`. Dans `src/index.css`, le fond du thème Shiki est abandonné : blocs colorés et bruts partagent `--muted` avec une bordure `--border`. Le code en ligne n'a plus de backticks et prend un fond `--muted`. Nouvel e2e `e2e/code-style.spec.ts` (clair et sombre, `getComputedStyle`), test de `index.css` adapté dans `code-block.test.tsx`. D79, INDEX, BACKLOG et CONVENTIONS sont à jour. Vérifié à l'écran : vue examinateur clair et sombre, vue projetée sombre.

**Trucs en suspens** : PR F24 à ouvrir en brouillon, Sonar, « Ready for review », puis go de l'utilisateur. Toujours au BACKLOG : taille de projection `prose-2xl`.

**Prochaine chose à creuser** : #60 (F26, éditeur de config ; ses dépendances #54 et #56 sont mergées).

**Notes pour future Claude** : un réglage CSS (index.css, prose) ne se teste pas en Vitest/jsdom, sauf par lecture du texte du fichier. Le vérifier en e2e avec `getComputedStyle`, en imposant le mode par `presentation.defaultColorMode` dans la config du test : la fixture python est en `dark`, et `emulateMedia` n'y change rien. Les sélecteurs e2e de la vue de passage doivent exclure `[data-projection-canvas]`. `pkill -f "<motif>"` lancé depuis le shell de l'outil tue ce shell s'il contient le motif : viser le PID.

## 2026-10-01 — F22 mergé, F20 : accueil sur deux colonnes (#54)

**Dernière chose faite** : PR #68 (F22) mergée sur go de l'utilisateur. F20 implémenté sur `feat/f20-accueil-deux-colonnes` en subagent-driven development (quatre tâches revues, revue finale, correctifs : titres h3 dans la région « Sessions », clé `create_config_example_link`). `ActionCards` : « Nouvelle session » (liens vers les exemples et le JSON Schema) et « Restaurer une session ». Grille `lg:grid-cols-[24rem_minmax(0,1fr)]`, sessions en `2xl:grid-cols-2`. La barre de titre est réduite à l'indicateur de persistance et au thème, l'état vide à un message. Export Excel dans le menu « … » de la carte de session via `useWorkbookExport` (`components/export/`, garde en `useRef`), partagé avec `ExportButton`. D78, `PRODUCT.md` F05, F16 et F20, INDEX et BACKLOG sont à jour. Vérifié dans le navigateur à 1440 et 900 px ; aucun chunk xlsx au chargement de l'accueil.

**Trucs en suspens** : PR F20 à ouvrir en brouillon, Sonar, « Ready for review », puis go de l'utilisateur. Le clic « Exporter en Excel » depuis la carte n'a pas été vérifié dans le navigateur (le navigateur Playwright MCP plante sur le téléchargement) ; il est couvert par les tests unitaires. BACKLOG : classe de lien recopiée entre la création et l'accueil, `buildWorkbook` / `computeStats` dans le chunk de l'accueil.

**Prochaine chose à creuser** : #58 (F24, fond des blocs de code), puis #60 (F26, éditeur de config, débloqué une fois #54 et #56 mergés).

**Notes pour future Claude** : l'accueil a maintenant des titres `h3` à la fois dans les cartes d'action et dans les cartes de session : scoper les requêtes de test par `region` (« Actions », « Sessions »). La page de création a un `h1` « Nouvelle session » et la carte d'action un `h3` du même nom : filtrer par `level`. Le navigateur Playwright MCP plante sur un téléchargement déclenché depuis la page : vérifier un export par les tests ou à la main.

