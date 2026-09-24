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
