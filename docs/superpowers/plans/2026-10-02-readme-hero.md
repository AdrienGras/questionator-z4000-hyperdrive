# #74 — Animation du parcours en tête du README — Plan d'implémentation

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Remplacer `banner.webp` par un SVG animé en CSS qui raconte le parcours de l'application en une boucle de 15 s.

**Architecture:** Un fichier SVG écrit à la main (`assets/readme-hero.svg`), une seule timeline CSS de 15 s pilotant six scènes par opacité, variables CSS pour les thèmes. Un contrôle Node (`scripts/check-readme-hero.ts`, testé sous Vitest) garde les contraintes (pas de script, pas de ressource externe, < 100 Ko, mouvement réduit). Un script de capture jetable sert à la revue visuelle.

**Tech Stack:** SVG + CSS (`@keyframes`, `@media`), Node 24 natif (types retirés), Vitest, Playwright (`@playwright/test`, Chromium) pour les captures.

**Spec:** `docs/superpowers/specs/2026-10-02-readme-hero-design.md` — à lire en entier avant toute tâche.

## Global Constraints

- `viewBox="0 0 1200 600"` ; fenêtre de navigateur ~1040 × 500 centrée.
- Boucle unique `--loop: 15s`, toutes les animations en `infinite` sur cette durée, **aucun `animation-delay`** (le séquencement passe par les pourcentages des keyframes).
- Plages : scène 1 0–2,5 s · 2 2,5–5 s · 3 5–8,5 s · 4 8,5–11 s · 5 11–13 s · 6 13–15 s ; fondus de 0,3 s aux bornes.
- Texte : corps ≥ 40 unités, quelques mots, `font-family: system-ui, sans-serif`, aucune fonte embarquée.
- Aucun `<script>`, attribut `on*`, `<foreignObject>`, ni `href`/`url()` vers `http(s)`. Poids < 100 Ko (102 400 octets).
- Couleurs des scènes 2-6 uniquement par variables CSS ; valeurs prises dans `src/index.css` (clair `:root`, sombre `.dark`).
- Catégories : Facile `oklch(0.797 0.134 211.5)` `leaf` · Normal `oklch(0.709 0.159 293.5)` `brand-php` · Difficile `oklch(0.687 0.252 323.9)` `flame` · Cauchemar `oklch(0.758 0.159 55.9)` `skull`.
- Icônes Tabler 3.48.0, tracés copiés depuis `node_modules/@tabler/icons-react/dist/esm/icons/Icon<Nom>.mjs` (`__iconNode`), en `<symbol viewBox="0 0 24 24">`, `fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"`.
- Texte alternatif exact : « Animation du parcours : on charge une config et une liste d'étudiants, chaque étudiant tire une question par catégorie et reçoit une note, puis on consulte les statistiques et on exporte un fichier Excel. »
- `prefers-reduced-motion: reduce` : animations coupées, scène 6 seule visible et complète (fichier Excel sorti).
- Commits gitmoji en français, avec les lignes `Co-Authored-By` / `Claude-Session` de la session.

## Review Focus

1. **Thème GitHub ≠ thème OS** : un visiteur en GitHub sombre sur OS clair doit voir la version sombre — levé par la tâche 1 (vérification humaine), pas par un test.
2. **Capture figée trompeuse** : un `animation-delay` dans le SVG fausserait les captures (délai négatif injecté écrasé) et désynchroniserait la boucle — le contrôle de la tâche 2 refuse `animation-delay`.
3. **Mobile ~360 px** : un libellé sous 40 unités devient illisible — le contrôle refuse un `font-size` < 40.
4. **Mouvement réduit** : la scène 6 doit être visible dans son état final, pas à son état initial (fichier encore dans la fenêtre) — vérifié sur la capture `reduced` de la tâche 4.
5. **Raccord de boucle** : à 15 s → 0 s, aucune scène ne doit clignoter — vérifié par les captures à 14,9 s et 0,1 s (tâche 4).

---

### Task 1 (contrôleur, avec l'utilisateur) : levée de risque du thème GitHub

**Files:**
- Create: `assets/readme-hero.svg` (témoin, remplacé à la tâche 3)
- Modify: `README.md:3`

- [ ] **Step 1:** Écrire un SVG témoin `0 0 1200 600` : fond `#ffffff` et texte « CLAIR » en noir ; sous `@media (prefers-color-scheme: dark)`, fond `#111111` et texte « SOMBRE » en blanc (deux `<text>` alternés par `display`).
- [ ] **Step 2:** Remplacer la ligne 3 du README par `![Témoin de thème](assets/readme-hero.svg)` ; commit `🧪 Ajoute un SVG témoin du thème GitHub`, push de la branche.
- [ ] **Step 3:** Demander à l'utilisateur d'ouvrir `https://github.com/AdrienGras/questionator-z4000-hyperdrive/tree/feat/74-animation-readme` en croisant OS clair / GitHub sombre et inversement, sur ordinateur et dans l'app mobile. **Attendre sa réponse.**
- [ ] **Step 4:** Noter le résultat. **Mode `img`** : le témoin suit le thème GitHub → un seul fichier. **Mode `picture`** : il suit l'OS → variante sombre (tâches 2 et 5). Consigner le constat pour D95 et `QUIRKS.md`.

### Task 2 : contrôle `check:hero`

**Files:**
- Create: `scripts/check-readme-hero.ts`, `scripts/check-readme-hero.test.ts`
- Modify: `package.json` (scripts `check:hero` et `check`)

**Interfaces:**
- Produces: `findHeroIssues(svg: string): string[]` (messages en français, vide si conforme) ; `findDarkVariantIssues(light: string, dark: string): string[]` (mode `picture` seulement) ; `main(files: readonly string[], report?: (line: string) => void): number` (0/1, sur le modèle de `scripts/check-precache.ts`). Lancement direct : `main(['assets/readme-hero.svg'])` (+ `assets/readme-hero.dark.svg` en mode `picture`).

- [ ] **Step 1: Tests en échec** dans `check-readme-hero.test.ts`, partant d'un SVG minimal conforme (`<svg …><style>@media (prefers-reduced-motion: reduce){*{animation:none}}</style></svg>`) :
  - `accepte un SVG conforme` → `[]`
  - `refuse <script>`, `refuse un attribut onload`, `refuse <foreignObject>`
  - `refuse un href http(s)` (`<use href="https://…">`, `xlink:href="http://…"`), `refuse url(https://…)` dans le style ; accepte `href="#leaf"` et `url(#grad)`
  - `refuse plus de 102 400 octets` (taille mesurée en octets UTF-8, `Buffer.byteLength`)
  - `exige @media (prefers-reduced-motion: reduce)`
  - `refuse animation-delay`
  - `refuse un font-size inférieur à 40` (attribut `font-size="32"` et propriété `font-size: 32px`) ; accepte 40
  - `main` : 1 et un message par problème avec le nom du fichier ; 0 sur fichier conforme
  - mode `picture` seulement : `findDarkVariantIssues` accepte deux fichiers qui ne diffèrent que par une ligne contenant `data-theme="dark"`, refuse toute autre différence.
- [ ] **Step 2:** `pnpm vitest run scripts/check-readme-hero.test.ts` → FAIL (module absent).
- [ ] **Step 3:** Implémenter ; regex simples sur le texte, pas de parseur XML. En-tête de doc comme `check-precache.ts`.
- [ ] **Step 4:** Le test passe ; `package.json` : `"check:hero": "node scripts/check-readme-hero.ts"`, et `check` devient `pnpm format:check && pnpm lint && pnpm deps && pnpm typecheck && pnpm check:hero && pnpm test`. `pnpm check:hero` sur le témoin de la tâche 1 → doit **échouer** (pas de `prefers-reduced-motion`) : c'est attendu, la tâche 3 le rend conforme.
- [ ] **Step 5:** `pnpm lint && pnpm typecheck && pnpm format:check` verts ; commit `✅ Contrôle l'animation du README (poids, script, ressources externes, mouvement réduit)`.

### Task 3 : socle du SVG, scène 1 et scène 2

**Files:**
- Modify (réécrit): `assets/readme-hero.svg`
- Create (non commité): `<scratchpad>/capture-hero.ts`

**Interfaces:**
- Consumes: `pnpm check:hero` (tâche 2).
- Produces: structure de la spec §4 — ids `ambiance`, `scene-1`, `window`, `scene-2` … `scene-6` (groupes 3 à 6 vides à ce stade) ; variables `--loop --bg --fg --card --muted --muted-fg --border --cat1 --cat2 --cat3 --cat4 --night` ; symboles `#i-leaf #i-brand-php #i-flame #i-skull #i-file-code #i-file-spreadsheet #i-user #i-chart-bar #i-presentation`.
  `capture-hero.ts <svg> <outDir>` : pour chaque thème `light|dark` et chaque instant `0.1 1.8 3.8 6.8 9.8 12 14 14.9` s, `page.emulateMedia({ colorScheme })`, SVG inline via `setContent` à 1200 × 600, style injecté `svg, svg * { animation-play-state: paused !important; animation-delay: -<t>s !important }`, capture `<theme>-<t>.png` ; plus `reduced.png` avec `reducedMotion: 'reduce'` (sans style injecté). Assemble ensuite une planche `sheet.png` (grille HTML des captures, une capture Playwright). Modèle de lancement Chromium : `scripts/render-icons.ts`.

- [ ] **Step 1:** Écrire `capture-hero.ts` ; le lancer sur le témoin pour valider le script (planche produite).
- [ ] **Step 2:** Écrire le socle (`<title>`, `<desc>` = texte alternatif, `<style>` avec variables et thème sombre, `<defs>`), l'ambiance (grille légère violet / magenta, faible opacité), le chrome de fenêtre (barre, trois pastilles, barre d'adresse dessinée sans texte : un libellé y serait sous 40 unités).
- [ ] **Step 3:** Scène 1 : nuit synthwave pleine image, soleil rayé dégradé orange → rose, grille en perspective, titre « QUESTIONATOR » / « Z-4000 HYPERDRIVE » ; montée du soleil, apparition du titre, puis repli dans la fenêtre qui montre l'accueil (3 cartes d'action, formes + icônes, pas de texte).
- [ ] **Step 4:** Scène 2 : icônes `config.json` (`file-code`) et `etudiants.csv` (`file-spreadsheet`) qui glissent depuis l'extérieur dans la fenêtre ; formation des 4 tuiles colorées avec leur icône.
- [ ] **Step 5:** `pnpm check:hero` vert ; capture ; vérifier sur la planche : scène 1 à 1,8 s et scène 2 à 3,8 s lisibles en clair et en sombre, rien de visible des scènes 3-6.
- [ ] **Step 6:** Commit `✨ Dessine le socle de l'animation du README, l'arrivée et la configuration` ; remettre au contrôleur le chemin de `sheet.png`.

### Task 4 : scènes 3 à 6 et mouvement réduit

**Files:**
- Modify: `assets/readme-hero.svg`

**Interfaces:**
- Consumes: ids, variables, symboles et `capture-hero.ts` de la tâche 3.

- [ ] **Step 1:** Scène 3 : file de 4 avatars (`user`) à gauche ; le premier avance, une tuile pulse, carte question (barres de texte simulées) puis réponse dévoilée ; vignette « vue projetée » (`presentation`) en bas à droite reprenant la question en miniature.
- [ ] **Step 2:** Scène 4 : rangée de boutons de note, un bouton s'allume ; score cumulé qui passe 0 → 3 → 5 (trois `<text>` alternés par opacité) ; deux avatars défilent en accéléré.
- [ ] **Step 3:** Scène 5 : 4 barres aux couleurs de catégorie qui montent (`transform: scaleY` avec `transform-box: fill-box; transform-origin: bottom`), courbe de distribution tracée (`stroke-dashoffset`).
- [ ] **Step 4:** Scène 6 : icône Excel (`file-spreadsheet`, vert) qui sort de la fenêtre vers la droite ; fondu vers la scène 1 à 15 s.
- [ ] **Step 5:** `@media (prefers-reduced-motion: reduce)` : `animation: none` partout, scène 6 seule à `opacity: 1` avec le fichier à sa position finale, autres scènes à 0.
- [ ] **Step 6:** `pnpm check:hero` vert (poids < 100 Ko) ; capture ; vérifier sur la planche : chaque instant montre sa scène, 14,9 s et 0,1 s sans clignotement, `reduced.png` montre la scène 6 finale.
- [ ] **Step 7:** Commit `✨ Anime le passage, la note, les stats et l'export dans l'animation du README` ; remettre `sheet.png` au contrôleur, qui la montre à l'utilisateur et relaie ses retours.

### Task 5 : intégration et mémoire

**Files:**
- Modify: `README.md:3`, `docs/BACKLOG.md`, `docs/DECISIONS.md`, `docs/INDEX.md`, `docs/HANDOFF.md`, `docs/QUIRKS.md` (si surprise de thème)
- Create (mode `picture` seulement): `assets/readme-hero.dark.svg`
- Delete: `banner.webp`

- [ ] **Step 1:** Mode `picture` seulement : créer `readme-hero.dark.svg` = copie de `readme-hero.svg` dont la balise ouvrante porte `data-theme="dark"` (sur sa propre ligne), le style forçant les variables sombres sous `svg[data-theme="dark"]` ; `check:hero` contrôle les deux fichiers et leur parité.
- [ ] **Step 2:** README ligne 3 : mode `img` → `![<texte alternatif>](assets/readme-hero.svg)` ; mode `picture` → `<picture><source media="(prefers-color-scheme: dark)" srcset="assets/readme-hero.dark.svg"><img src="assets/readme-hero.svg" alt="<texte alternatif>"></picture>`.
- [ ] **Step 3:** `git rm banner.webp` ; `grep -rn banner.webp` hors `docs/superpowers/` et `docs/handoff/` → aucun résultat.
- [ ] **Step 4:** Mémoire : D95 dans `DECISIONS.md` (tableau de la spec + résultat de la tâche 1) ; ligne `INDEX.md` ; BACKLOG « réutiliser `readme-hero.svg` en en-tête du site de doc (F27, #71) » ; `QUIRKS.md` si le thème GitHub a surpris ; entrée `HANDOFF.md` avec les quatre marqueurs en gras.
- [ ] **Step 5:** `pnpm check` vert ; commit `📝 Remplace le banner du README par l'animation du parcours` ; push.
- [ ] **Step 6 (contrôleur):** PR en brouillon `Closes #74`, `.claude/scripts/sonar-check.sh --pr <n> --wait` jusqu'à « Quality gate OK », 0 issue, 0 hotspot ; vérification de la page de la branche sur GitHub (clair, sombre, mobile) par l'utilisateur ; puis « Ready for review ». Pas de merge sans go.
