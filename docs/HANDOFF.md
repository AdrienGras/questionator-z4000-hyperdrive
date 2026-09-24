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

## 2026-09-24 — F01 livré : socle, CI, Pages

**Dernière chose faite** : F01 (#1) implémenté en subagent-driven development (5 tâches du
plan + migration shadcn v4 / Tabler demandée en cours de route), revue finale de branche,
PR #18 mergée. App vide en ligne sur https://adriengras.github.io/questionator-z4000-hyperdrive/
(404 par hash vérifiée en navigateur). `main` protégée (job `check` requis). Alertes
SonarQube Cloud corrigées (actions épinglées par SHA, `String.raw`, `routeTree.gen.ts`
exclu) et étape Sonar ajoutée avant toute PR. D37 : shadcn v4 base-ui + Tabler partout,
chunk d'icônes complet (~489 Kio gz) accepté ; tickets #2, #7, #17 mis à jour.

**Trucs en suspens** : favicon manquant (404 console) → F17. Question ouverte à l'utilisateur :
rendre aussi le quality gate SonarQube Cloud obligatoire dans la protection de `main` ?
Cette PR de clôture (docs) à merger.

**Prochaine chose à creuser** : ticket #2 (F02 — schéma de config et validation) : branche,
figer la spec de l'issue dans `docs/superpowers/specs/`, plan, subagent-driven development.
Attention : noms d'icônes Tabler (`iconsList`), liste blanche des tokens alignée sur
`src/index.css` (shadcn v4 Nova).

**Notes pour future Claude** : cycle d'une PR = branche → PR **brouillon** → `gh pr checks`
→ `.claude/scripts/sonar-check.sh --pr <n> --wait` → `gh pr ready` (SonarQube Cloud n'analyse
que `main` et les PR). pnpm via `corepack pnpm` (pnpm global 9.x). Après ajout d'une route :
`pnpm test` ou `pnpm dev` pour régénérer `routeTree.gen.ts`, puis commit (voir QUIRKS). Le CLI
shadcn v4 doit recevoir toutes ses options, stdin fermé (voir QUIRKS). Sous-agents : leur
passer brief + contraintes globales en fichiers, jamais d'outil interactif.

## 2026-09-24 — Spec V1 arbitrée et 17 tickets rédigés

**Dernière chose faite** : les 12 points ouverts de `PRODUCT.md` tranchés, puis chaque
feature F01–F17 creusée (brainstorming superpowers) et rédigée en issue GitHub #1 à #17,
rangées dans le projet n°3 en **Ready**, avec Priority, Size et relations « blocked by ».
36 décisions tracées dans `docs/DECISIONS.md` (D01–D36) et reportées dans `PRODUCT.md`.
Toolset challengé : TS 7, oxlint type-aware, Prettier, pnpm, Node 24 via nvm (D13) ;
ExcelJS remplacé par write-excel-file (D35) ; Playwright adopté (D33). Conventions :
commits gitmoji, une branche + PR par ticket. Tout est commité et poussé sur `main`
(pas encore de code applicatif).

**Trucs en suspens** : rien sur la spec. `rtk trust` à lancer par l'utilisateur pour
les filtres RTK du projet (modèle vide, sans effet). Protection de `main` à activer à la
fin de F01 (critère du ticket #1).

**Prochaine chose à creuser** : prendre le ticket #1 (F01 — socle) : créer la branche
`feat/f01-socle`, figer la spec de l'issue dans
`docs/superpowers/specs/AAAA-MM-JJ-f01-socle-design.md`, puis writing-plans et le cycle
habituel. Ordre des dépendances : #1 → #2 → #3 → #4 → (#5, #6) → #7, #8 → #9 → #10, #11 →
#12 → #13 → #14, #15 → #16 → #17.

**Notes pour future Claude** : `PRODUCT.md` (~40 Ko) est la source de vérité produit ;
le lire par sections (`grep -n '^##'`). Le corps de chaque issue est la spec détaillée
de sa feature (`gh issue view <n> -R AdrienGras/questionator-z4000-hyperdrive`).
`docs/DECISIONS.md` garde le pourquoi (`## Dnn — Sujet (date)`), à compléter à chaque
arbitrage. Créer un ticket : `.claude/scripts/gh-ticket.sh` (voir `INDEX.md`). TS 7 :
pas de `baseUrl`, rien qui dépende de l'API JS de TypeScript (typescript-eslint,
ts-morph). `gh` a le scope `project`. Interface et docs en français.

## 2026-09-24 — Bootstrap de la mémoire projet et arbitrage de PRODUCT.md

**Dernière chose faite** : mise en place du système de mémoire projet via
`/init-memory`. Revue de `PRODUCT.md` : 12 incohérences / points ouverts tranchés un par
un avec l'utilisateur, reportés dans `PRODUCT.md` et tracés dans `docs/DECISIONS.md`
(D01 à D12). Le §11 de `PRODUCT.md` est vide. Hook RTK ajouté dans
`~/.claude/settings.json` (backup `settings.json.bak-rtk`). Aucun commit.

**Trucs en suspens** : rien sur la spec. Dépôt sans commit (`PRODUCT.md`, `banner.webp`,
`CLAUDE.md`, `.claude/`, `.rtk/`, `docs/` non suivis).

**Prochaine chose à creuser** : étape 2 du process convenu — pour chaque feature F01 à
F17, creuser si besoin (brainstorming superpowers) et créer une issue GitHub dans le
dépôt, rattachée au projet https://github.com/users/AdrienGras/projects/3 (vrais issues,
pas des drafts ; titre `Fxx — Nom` ; corps = spec, critères d'acceptation, `Dépend de
#x` ; labels `feature` / `spike`). Profondeur pressentie : peu à creuser F01, F04, F08,
F17 ; à creuser F02, F03, F09, F14, F15, F16 ; le reste entre les deux. Ensuite, par
ticket : figer la spec dans `docs/superpowers/`, plan d'implémentation, cycle habituel.

**Notes pour future Claude** : `PRODUCT.md` (~33 Ko) est la source de vérité produit ;
le lire par sections (`grep -n '^##'`). `docs/DECISIONS.md` garde le pourquoi de chaque
arbitrage (format `## Dnn — Sujet (date)`), à compléter à chaque nouvel arbitrage.
`banner.webp` sert de base au thème « Synthwave » de la config d'exemple (F02). `gh` est
authentifié avec le scope `project`. Interface et docs en français.
