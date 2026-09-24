---
description: Le hook SessionStart a déjà injecté le digest de resituation (cette commande n'est pas nécessaire pour se resituer) — sans argument elle affiche la carte du snapshot sans rien charger ; un argument explicite est requis pour charger quoi que ce soit
allowed-tools: Read, Glob, Grep, Bash(ls:*), Bash(grep:*), Bash(wc:*)
---

Le hook `SessionStart` de ce dépôt a **déjà injecté** en début de session le **digest de
resituation seul** (titre + Dernière chose faite + Trucs en suspens + Prochaine chose à
creuser de la dernière entrée de `docs/HANDOFF.md` ; jamais Notes pour future Claude) —
**pas** la carte complète. La carte complète (index des titres de tous les `docs/*.md`, corps
des K dernières entrées de chaque journal, index des archives) n'est **jamais** envoyée sur
stdout : au-delà d'un certain volume, le harnais ne met en contexte qu'un aperçu de tête,
bien trop petit pour cette carte-là, quel que soit l'ordre dans lequel elle serait émise. Le
hook a donc écrit cette carte complète, elle, dans `.git/memory-snapshot.md`. **Tu n'as donc
pas besoin de lancer cette commande pour te resituer** — le digest est déjà là ; c'est la
carte complète, non lue, qui t'attend dans `.git/memory-snapshot.md`.

Sans argument, cette commande ne charge donc rien : elle se contente de **montrer la carte**
de ce qui est disponible dans `.git/memory-snapshot.md`, pour que tu puisses ensuite demander
une cible précise. Avec argument, elle sert à charger **davantage** que ce que le hook a
injecté : plus d'entrées de journal, le corps complet d'un fichier précis, ou l'intégralité du
scaffold. Utile après un `/clear`/`/compact`, ou quand une tâche a besoin de l'historique
complet d'un journal ou du corps entier d'une référence.

En mode `full`, `N`, ou nom de fichier, lis effectivement le contenu des fichiers demandés (ne
te contente pas de lister leurs noms). En mode par défaut, ne lis aucun contenu — voir
ci-dessous.

## Argument optionnel

`$ARGUMENTS` module le comportement :

- **vide** (défaut) : ne lit AUCUN `docs/*.md`, et ne lit AUCUNE plage de
  `.git/memory-snapshot.md`. Exécute EXACTEMENT cette commande, pas une variante :
  - `awk '/^=== /{if(h){if(h~/Digest de resituation/)print h; else printf "%s  (%d titres)\n", h, c} h=$0; c=0; next} /^[0-9]+:## /{c++} END{if(h){if(h~/Digest de resituation/)print h; else printf "%s  (%d titres)\n", h, c}}' .git/memory-snapshot.md; wc -l .git/memory-snapshot.md`
    — elle rend une ligne par en-tête de section avec son nombre de titres indexés (une dizaine
    de lignes au total), plus le nombre total de lignes du snapshot. Coût visé : quelques
    centaines de tokens. Ce n'est plus la carte complète (l'ancien motif `grep -nE`, voir mode
    `map` plus bas) : le digest de resituation, déjà injecté par le hook en tête de session,
    couvre désormais l'essentiel de la resituation à lui seul, et payer ~5000 tokens de carte
    complète à chaque invocation par défaut n'est plus justifié.
  Affiche cette sortie et **arrête-toi là** (l'exception qui autorise, en plus, une ou deux
  phrases sur l'état courant du projet est décrite dans « Sortie » plus bas). N'essaie pas de
  repérer une section « utile », « pertinente » ou « nécessaire » — sans tâche ni fichier
  ciblé en main, il n'existe aucun critère pour en choisir une plutôt qu'une autre. Le mode par
  défaut ne lit aucun CONTENU de fichier, ni aucune plage du snapshot, point.
- **`map`** (ex. `/load-memory map`) : sort la **carte complète** du snapshot — tous les
  titres indexés avec leurs numéros de ligne, pas seulement leur décompte. Exécute EXACTEMENT
  ces deux commandes, pas une variante :
  - `grep -nE '^=== |^[0-9]+:## ' .git/memory-snapshot.md` — **c'est cette commande précise et
    aucune autre** (en particulier pas `grep -n '^===\|^# \|^## '`, qui ne rend que les
    en-têtes de section et rate les titres indexés). Elle rend les en-têtes de section **et**
    les titres indexés, avec leurs numéros de ligne — c'est ce qui permet ensuite de viser une
    plage précise (`Read` avec `offset`/`limit`). Coût approximatif : **~5000 tokens**, pour
    que ça ne soit pas une surprise — c'est le prix à payer pour ce mode-là, précisément parce
    que le mode par défaut ne le paie plus.
  - `wc -l .git/memory-snapshot.md` — nombre total de lignes.
  Affiche cette carte et **arrête-toi là**, mêmes règles de sortie que le mode par défaut. Ne
  lit aucun contenu de fichier — c'est le mode à utiliser quand on veut ensuite viser une plage
  précise (`Read` avec `offset`/`limit`).
- **`full`** (ex. `/load-memory full`) : seul mode qui charge TOUT en entier — `CLAUDE.md`,
  chaque `docs/*.md` à la racine, journaux compris (corps intégral, pas seulement l'index).
  C'est l'échappatoire explicite pour un historique complet.
- **un entier `N`** (ex. `/load-memory 6`) : recharge le(s) journal(aux) daté(s) avec
  `K = N` dernières entrées au lieu des 3 injectées par le hook (`docs/HANDOFF.md`, ou tout
  autre journal daté que le projet documente comme tel). Repère les titres (`grep -n '^## '`),
  puis `Read` du début du fichier jusqu'à la borne de la `(N+1)`-ème entrée
  (`offset`/`limit`) — même technique que le hook, avec `N` à la place de 3.
- **un nom/fragment de fichier** (ex. `/load-memory HANDOFF`) : charge CE fichier précis en
  entier, quel que soit son type. Ordre explicite et ciblé de l'utilisateur sur un fichier
  nommé → toujours légitime, même s'il s'agit d'un journal.

(L'utilisateur peut aussi te demander en langage naturel « charge tout QUIRKS » à tout moment
après le `/load-memory` — relis alors ce fichier en entier.)

La classification journal / non-journal (quels fichiers sont des journaux à K entrées, quels
fichiers sont indexés ou chargés en entier) est **déjà tranchée par le hook**
(`load-memory.sh`) — cette commande ne la reproduit pas. En mode `N` ou nom de fichier, vise
directement le(s) fichier(s) concerné(s) tel que documenté dans `CLAUDE.md` (section « Pour
approfondir »).

## Fichiers à charger (modes `full`, `N`, nom de fichier)

1. `CLAUDE.md` à la racine du projet, s'il existe — **toujours en entier**.
2. Les fichiers Markdown situés **uniquement à la racine** de `docs/` (Glob sur
   `docs/*.md`, **PAS de récursion**). N'inclus PAS les sous-dossiers (`docs/superpowers/`,
   `docs/reference/`, `docs/external/`, …) — sauf si une tâche précise le nécessite,
   auquel cas tu les chargeras au cas par cas.
3. Tout autre document de contexte manifestement nécessaire (`README.md`,
   `ARCHITECTURE.md`, `AGENTS.md`, …) — uniquement s'il existe et apporte du contexte.
   Ces fichiers se chargent en entier.

En mode `full`, charge tous les fichiers de l'étape 2 en entier, journaux compris. En mode
`N`, ne recharge que le(s) journal(aux) daté(s) (voir ci-dessus) ; les autres `docs/*.md`
restent tels qu'injectés par le hook. En mode nom de fichier, charge uniquement ce fichier.

## Sortie

- L'interdiction porte sur le **contenu chargé** par cette commande (la sortie du mode par
  défaut ou de `map`, les fichiers en mode `full`/`N`/nom) : n'affiche AUCUN résumé, AUCUN
  extrait, AUCUNE analyse de ce contenu-là.
- **Exception explicite, attendue** : si le digest de resituation injecté par le hook
  `SessionStart` est disponible (il l'est dès que `docs/HANDOFF.md` a au moins une entrée),
  affiche **UNE OU DEUX PHRASES** sur l'état courant du projet. Ce n'est pas un résumé du
  contenu chargé par cette commande — c'est le rappel de ce que le digest, déjà injecté avant
  même cette commande, a établi. C'est le seul signal qui distingue « je suis resitué » de
  « je n'ai rien » : sans lui, l'utilisateur ne peut pas savoir si la resituation a marché.
- **Mode par défaut** : affiche les en-têtes de section avec leur nombre de titres indexés
  (sortie brute de la commande `awk`), le nombre total de lignes, les 1-2 phrases d'état
  courant ci-dessus, puis arrête-toi. Au-delà de ces phrases, n'affiche aucune supposition sur
  le contenu du snapshot — tu ne l'as pas lu.
- **Mode `map`** : affiche la carte complète des sections (sortie brute des deux commandes),
  les 1-2 phrases d'état courant ci-dessus, puis arrête-toi. Mêmes règles que le mode par
  défaut.
- **Modes `full`/`N`/nom de fichier** : quand tout est lu, réponds par **UN SEUL message
  court** : ce qui a été chargé (fichier(s) précis, ou étendue `full`/`N`).

Exemple de réponse attendue (mode par défaut) :
« État courant : le projet est en train de resituer le hook de mémoire v2 sur la séparation
stdout/snapshot (d'après le digest injecté au démarrage).

Sections de `.git/memory-snapshot.md` (412 lignes) :
```
=== docs/HANDOFF.md (journal — corps des 3 dernières entrées) ===  (28 titres)
=== docs/QUIRKS.md (catalogue — index des titres uniquement) ===  (35 titres)
=== docs/CONVENTIONS.md (thématique — dégradé en index, >= 4 Ko) ===  (6 titres)
```
Aucun contenu chargé. Donne-moi une cible — `/load-memory map` pour la carte complète avec
numéros de ligne, `/load-memory full`, `/load-memory 6`, ou `/load-memory HANDOFF` — pour que
je charge quelque chose. »
