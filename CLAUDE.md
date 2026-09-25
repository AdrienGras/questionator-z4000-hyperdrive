# Conventions du projet

- **Commits en [gitmoji](https://gitmoji.dev)** : `<emoji> <message au présent, en français>`, emoji en Unicode (pas de `:shortcode:`). Détail et emojis courants : `docs/CONVENTIONS.md` § « Message de commit — gitmoji ».
- **Une branche et une PR par ticket** vers `main`, `Closes #n` dans la PR ; pas de push direct sur `main` une fois F01 livré.
- **SonarQube Cloud avant toute revue** : ouvrir la PR en **brouillon**, lancer `.claude/scripts/sonar-check.sh --pr <n> --wait`, corriger jusqu'à « Quality gate OK », 0 issue, 0 hotspot, puis seulement passer la PR en « Ready for review ». SonarQube Cloud n'analyse que `main` et les PR (pas les branches seules).
- `PRODUCT.md` est la source de vérité produit ; tout arbitrage est tracé dans `docs/DECISIONS.md`.
- **Arborescence de `src/` (D59)** : avant de créer un fichier, lire `docs/CONVENTIONS.md` § « Arborescence et imports » (où ranger quoi). `lib/` = technique, `domain/` = règles métier sans React, `features/<x>/` = un écran, jamais d'import entre features. Imports par `@/`, pas de barrel, fichiers en kebab-case. `pnpm deps` (dependency-cruiser) fait respecter le sens des imports : corriger l'emplacement, pas la règle.

<!-- MEMORY_BLOCK_START -->
## Mémoire projet

<!-- MEMORY_V2_ADDITIONS_START -->
### Chargement automatique (v2)

Le hook `SessionStart` de ce dépôt injecte automatiquement, à chaque démarrage de session, un
snapshot de resituation basé sur trois natures de documents :

| Nature | Fichiers | Chargement |
|---|---|---|
| Journal temporel | `HANDOFF.md` | corps des `K=3` dernières entrées + index de tous les titres, plus l'index des titres des archives (borné à 12 mois) |
| Catalogue perpétuel | `QUIRKS.md` | tous les titres, corps à la demande |
| Référence | tout autre `docs/*.md` racine, **`ENVIRONMENT.md` compris** | contenu entier sous 4 Ko, sinon index des titres avec numéros de ligne |

**Tu n'as donc plus besoin de lancer `/load-memory` pour te resituer en début de session** — c'est
déjà fait. La commande ne sert plus qu'à charger **davantage** : le corps complet d'un fichier
au-delà de ce que le hook a injecté, ou l'intégralité du scaffold. Sans argument, elle ne charge
rien du tout — elle affiche juste la carte des sections disponibles.

### Règles de déclenchement

- *Avant d'écrire du code d'un type donné* : lancer `grep -n '^## ' docs/CONVENTIONS.md`, repérer
  la section pertinente, puis `Read` avec `offset`/`limit` sur cette seule section. Ne jamais
  charger le fichier entier pour écrire un seul composant.
- *Jamais en entier, sans exception* : ne jamais `Read` un `docs/*.md` sans `offset`/`limit`.
  Pour `docs/ENVIRONMENT.md` en particulier — à consulter avant toute commande non-triviale —
  repère la section pertinente dans son index (`grep -n '^## ' docs/ENVIRONMENT.md`) puis lis
  cette plage précise avant de lancer la commande ; ne le charge jamais en bloc.
- *Jamais deux fois* : ne pas relire un fichier déjà lu dans la session courante ; son contenu est
  encore dans le contexte.
- *Écrire une entrée `HANDOFF.md`* : toujours poser les quatre marqueurs en gras du gabarit
  (`**Dernière chose faite**`, `**Trucs en suspens**`, `**Prochaine chose à creuser**`,
  `**Notes pour future Claude**`). Le digest de resituation injecté au démarrage extrait son
  contenu par ces marqueurs ; une entrée en prose libre dégrade silencieusement la resituation
  vers un extrait brut des 2000 premiers caractères du corps.
- *L'aperçu est tronqué* : le contexte injecté au démarrage est un **aperçu** ; le snapshot
  complet est dans `.git/memory-snapshot.md`. S'il ne suffit pas, lance `/load-memory` sans
  argument pour obtenir la carte de ses sections (une commande, pas une lecture), puis relance
  `/load-memory` avec un argument explicite (`full`, un entier, ou un nom de fichier) pour
  charger quoi que ce soit. Ne lis jamais ce fichier en entier ni par plage devinée.
<!-- MEMORY_V2_ADDITIONS_END -->

### Pour approfondir

- **`docs/HANDOFF.md`** — état courant, dernière chose faite, trucs à savoir tout de suite.
  Injecté par le hook (3 dernières entrées + index) ; `/load-memory HANDOFF` ou `/load-memory full`
  pour l'historique complet.
- **`docs/INDEX.md`** — catalogue des features livrées avec liens vers spec/plan.
- **`docs/ENVIRONMENT.md`** — paths, services, env vars, accès. Injecté par le hook en entier
  sous 4 Ko, sinon en index de titres seul ; à consulter avant de lancer toute commande
  non-triviale (par plage si dégradé en index).
- **`docs/STYLE.md`** — voix et prose, gabarits par genre de contenu, si le projet en a un.
- **`docs/QUIRKS.md`** — pièges et comportements non-évidents. Injecté par le hook sous forme
  d'index de titres seul ; `Read` la plage voulue (ou `/load-memory QUIRKS`) pour le corps d'un
  piège précis.
- **`docs/BACKLOG.md`** — idées et améliorations identifiées mais non urgentes.
- **`docs/CONVENTIONS.md`** — skeletons de code et règles tacites.
- **`docs/superpowers/specs/`** — design docs détaillés par feature.
- **`docs/superpowers/plans/`** — plans d'implémentation détaillés par feature.
- **`docs/handoff/`** — archives du journal `HANDOFF.md`, une par mois (`<AAAA-MM>.md`), déplacées
  là par `rotate-memory.sh` une fois le mois révolu. **Non chargé automatiquement** ; s'y rendre via
  le lien du bloc de pointeurs en tête de `docs/HANDOFF.md`.
- **`docs/reference/`** — rangement optionnel pour de la référence réellement hors-sujet. Rôle
  déclassé par rapport au v1 (où c'était l'unique ligne de défense du contexte) : un fichier
  thématique volumineux ne coûte plus rien, il passe en index automatiquement. **Non chargé
  automatiquement.**

### À mettre à jour DURANT la session (decision tree — une question = un fichier)

| Tu découvres ou décides… | Fichier |
|---|---|
| Une règle qui s'applique TOUJOURS au projet | `CLAUDE.md` |
| Une règle de **voix / ton / rédaction** de contenu de cours | `docs/STYLE.md` |
| Un squelette de code récurrent | `docs/CONVENTIONS.md` |
| Une feature livrée | ajouter une ligne dans `docs/INDEX.md` + spec/plan dans `docs/superpowers/` si non-trivial |
| Où vit un container, un path, un port, un accès | `docs/ENVIRONMENT.md` |
| Un comportement non-évident, un piège | `docs/QUIRKS.md` (ajouter dès la découverte, pas plus tard) |
| Une idée future / nice-to-have | `docs/BACKLOG.md` |
| L'état mental d'une session significative | `docs/HANDOFF.md` (en fin de session) |

### Règle de fin d'implémentation (NON-NÉGOCIABLE)

À la fin de toute implémentation significative (feature livrée, refactor majeur, bug fix non-trivial, nouvelle commande/script), **avant de signaler la fin du travail**, tu DOIS :

1. **Mettre à jour `docs/INDEX.md`** — ajouter une ligne dans la table correspondante (feature, commande, etc.).
2. **Mettre à jour `docs/HANDOFF.md`** — ajouter une entrée datée en haut (sous le titre H1) avec : `Dernière chose faite`, `Trucs en suspens`, `Prochaine chose à creuser`, `Notes pour future Claude`.
3. **Mettre à jour `docs/QUIRKS.md`** si tu as découvert un piège non-évident pendant l'implémentation.
4. **Mettre à jour `docs/BACKLOG.md`** si tu as identifié des améliorations futures que tu n'as pas implémentées.
5. **Mettre à jour `docs/CONVENTIONS.md`** si tu as introduit un nouveau pattern qui doit être reproduit.
   **Mettre à jour `docs/STYLE.md`** si tu as établi/affiné une règle de voix ou de rédaction.
6. **Mettre à jour `docs/ENVIRONMENT.md`** si tu as ajouté/découvert un service, path, port, env var.
7. **Mettre à jour `CLAUDE.md`** si tu as établi une règle qui s'applique toujours au projet.

Ces mises à jour font partie de la définition de "terminé". Une feature livrée sans mise à jour de la mémoire est une feature à moitié livrée.
<!-- MEMORY_BLOCK_END -->

<!-- rtk-instructions v2 -->
# RTK (Rust Token Killer) - Token-Optimized Commands

## Golden Rule

**Always prefix commands with `rtk`**. If RTK has a dedicated filter, it uses it. If not, it passes through unchanged. This means RTK is always safe to use.

**Important**: Even in command chains with `&&`, use `rtk`:
```bash
# ❌ Wrong
git add . && git commit -m "msg" && git push

# ✅ Correct
rtk git add . && rtk git commit -m "msg" && rtk git push
```

## RTK Commands by Workflow

### Build & Compile (80-90% savings)
```bash
rtk cargo build         # Cargo build output
rtk cargo check         # Cargo check output
rtk cargo clippy        # Clippy warnings grouped by file (80%)
rtk tsc                 # TypeScript errors grouped by file/code (83%)
rtk lint                # ESLint/Biome violations grouped (84%)
rtk prettier --check    # Files needing format only (70%)
rtk next build          # Next.js build with route metrics (87%)
```

### Test (60-99% savings)
```bash
rtk cargo test          # Cargo test failures only (90%)
rtk go test             # Go test failures only (90%)
rtk jest                # Jest failures only (99.5%)
rtk vitest              # Vitest failures only (99.5%)
rtk playwright test     # Playwright failures only (94%)
rtk pytest              # Python test failures only (90%)
rtk rake test           # Ruby test failures only (90%)
rtk rspec               # RSpec test failures only (60%)
rtk test <cmd>          # Generic test wrapper - failures only
```

### Git (59-80% savings)
```bash
rtk git status          # Compact status
rtk git log             # Compact log (works with all git flags)
rtk git diff            # Compact diff (80%)
rtk git show            # Compact show (80%)
rtk git add             # Ultra-compact confirmations (59%)
rtk git commit          # Ultra-compact confirmations (59%)
rtk git push            # Ultra-compact confirmations
rtk git pull            # Ultra-compact confirmations
rtk git branch          # Compact branch list
rtk git fetch           # Compact fetch
rtk git stash           # Compact stash
rtk git worktree        # Compact worktree
```

Note: Git passthrough works for ALL subcommands, even those not explicitly listed.

### GitHub (26-87% savings)
```bash
rtk gh pr view <num>    # Compact PR view (87%)
rtk gh pr checks        # Compact PR checks (79%)
rtk gh run list         # Compact workflow runs (82%)
rtk gh issue list       # Compact issue list (80%)
rtk gh api              # Compact API responses (26%)
```

### JavaScript/TypeScript Tooling (70-90% savings)
```bash
rtk pnpm list           # Compact dependency tree (70%)
rtk pnpm outdated       # Compact outdated packages (80%)
rtk pnpm install        # Compact install output (90%)
rtk npm run <script>    # Compact npm script output
rtk npx <cmd>           # Compact npx command output
rtk prisma              # Prisma without ASCII art (88%)
```

### Files & Search (60-75% savings)
```bash
rtk ls <path>           # Tree format, compact (65%)
rtk read <file>         # Code reading with filtering (60%)
rtk grep <pattern>      # Search grouped by file (75%). Format flags (-c, -l, -L, -o, -Z) run raw.
rtk find <pattern>      # Find grouped by directory (70%)
```

### Analysis & Debug (70-90% savings)
```bash
rtk err <cmd>           # Filter errors only from any command
rtk log <file>          # Deduplicated logs with counts
rtk json <file>         # JSON structure without values
rtk deps                # Dependency overview
rtk env                 # Environment variables compact
rtk summary <cmd>       # Smart summary of command output
rtk diff                # Ultra-compact diffs
```

### Infrastructure (85% savings)
```bash
rtk docker ps           # Compact container list
rtk docker images       # Compact image list
rtk docker logs <c>     # Deduplicated logs
rtk kubectl get         # Compact resource list
rtk kubectl logs        # Deduplicated pod logs
```

### Network (65-70% savings)
```bash
rtk curl <url>          # Compact HTTP responses (70%)
rtk wget <url>          # Compact download output (65%)
```

### Meta Commands
```bash
rtk gain                # View token savings statistics
rtk gain --history      # View command history with savings
rtk discover            # Analyze Claude Code sessions for missed RTK usage
rtk proxy <cmd>         # Run command without filtering (for debugging)
rtk init                # Add RTK instructions to CLAUDE.md
rtk init --global       # Add RTK to ~/.claude/CLAUDE.md
```

## Token Savings Overview

| Category | Commands | Typical Savings |
|----------|----------|-----------------|
| Tests | vitest, playwright, cargo test | 90-99% |
| Build | next, tsc, lint, prettier | 70-87% |
| Git | status, log, diff, add, commit | 59-80% |
| GitHub | gh pr, gh run, gh issue | 26-87% |
| Package Managers | pnpm, npm, npx | 70-90% |
| Files | ls, read, grep, find | 60-75% |
| Infrastructure | docker, kubectl | 85% |
| Network | curl, wget | 65-70% |

Overall average: **60-90% token reduction** on common development operations.
<!-- /rtk-instructions -->