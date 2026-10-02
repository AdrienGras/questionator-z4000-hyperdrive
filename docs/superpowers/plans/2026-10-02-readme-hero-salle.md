# #74 — Animation du README, révision 2 (scène de salle) — Plan d'implémentation

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Refaire `assets/readme-hero.svg` pour qu'on comprenne l'oral : un étudiant, un examinateur, deux écrans, le principe du tirage et de la note, en une boucle de 18 s.

**Architecture:** Même fichier SVG écrit à la main, même timeline CSS unique. La fenêtre de navigateur et les scènes 2 à 4 disparaissent au profit d'une scène de salle (examinateur + portable, écran projeté, étudiants), suivie d'un zoom dans le portable pour les stats et l'export. Le titre synthwave, les symboles Tabler, les tuiles, les stats et l'export existants sont réutilisés.

**Tech Stack:** SVG + CSS, `pnpm check:hero` (inchangé), script de capture Playwright du scratchpad.

**Spec:** `docs/superpowers/specs/2026-10-02-readme-hero-design.md` — section « Révision 2 — scène de salle » (prioritaire), puis le reste de la spec pour ce qui est inchangé.

## Global Constraints

- `width="1200" height="600" viewBox="0 0 1200 600"` à la racine.
- `--loop: 18s` ; 1 s = 5,5556 % ; toutes les animations `infinite` sur cette durée ; **aucun `animation-delay`**, ni délai dans le raccourci `animation:`.
- Plages : titre 0–2 s · préparation 2–4 s · choix 4–6 s · tirage et réponse 6–8,5 s · note 8,5–10 s · suivants 10–12 s · zoom stats 12–15 s · export 15–18 s ; retour au titre 17,7–18 s.
- Aucun `--` dans un commentaire XML (le fichier doit rester du XML valide).
- Texte ≥ 40 unités, seuls textes : titre, « +2 », score. `system-ui, sans-serif`.
- Aucun `<script>`, `on*`, `<foreignObject>`, `href`/`url()` autre que `#…`, `@import`. < 100 Ko.
- Couleurs hors titre et écran projeté : variables CSS clair / sombre (tokens de `src/index.css`). Écran projeté toujours sombre.
- Étudiants : A `--cat1`, B `--cat2`, C `--cat4` ; catégorie choisie par A : Difficile (`--cat3`, `flame`).
- Personnages ~160 unités de haut, définis dans `<defs>` (`#p-student`, `#p-examiner`), instanciés par `<use>`, couleur par `color`.
- Mouvement réduit : salle figée au moment de la note (A en place, question projetée, réponse sur le portable, score affiché).
- Texte alternatif exact (dans `<desc>` et l'`alt` du README) : « Animation du principe : un étudiant choisit une difficulté, une question est tirée et projetée sur grand écran, il répond à l'oral pendant que l'examinateur voit la réponse attendue et note sur son ordinateur ; puis on consulte les statistiques et on exporte un fichier Excel. »
- Commits gitmoji en français avec les lignes `Co-Authored-By` / `Claude-Session` de la session.
- **Validation humaine** : après chaque tâche, le contrôleur montre la planche à l'utilisateur et attend son accord avant la suivante.

## Review Focus

1. **Deux écrans distincts** : sur une capture de 6–8,5 s, l'écran projeté montre l'énoncé seul, le portable l'énoncé **et** la réponse attendue — la différence doit sauter aux yeux.
2. **XML strict** : un `--` ou un `&` nu casse l'affichage en `<img>` ; vérifier par ouverture `file://` (pas seulement inline).
3. **Mobile 0,3×** : bulles, icônes et score lisibles sur la planche réduite.
4. **Raccord** : 17,9 s et 0,1 s sans clignotement.
5. **Zoom** : pendant 12–12,8 s, le portable grandit sans que le décor ne « saute ».

---

### Task 1 : salle, personnages, titre raccourci, préparation (0–4 s)

**Files:** Modify: `assets/readme-hero.svg` · Capture (non commité) : `<scratchpad>/capture-hero.ts` (passer `TIMES`).

**Interfaces:**
- Produces: `--loop: 18s` ; groupes `#ambiance`, `#scene-title`, `#room` (`#decor`, `#examiner`, `#laptop` avec `#laptop-screen`, `#projector` avec `#projector-screen`, `#students`), `#zoom` (vide) ; symboles `#p-student`, `#p-examiner` ; groupes d'écran `#proj-tiles` et `#lap-tiles` (4 tuiles chacun).

- [ ] **Step 1:** Supprimer `#window`, `#home`, `#scene-2` à `#scene-4` et leurs keyframes ; garder `#scene-5` / `#scene-6` hors affichage (opacité 0) pour la tâche 3 ; renommer `#scene-1` en `#scene-title`, ramené à 0–2 s.
- [ ] **Step 2:** Décor (mur, sol, bureau), examinateur (lunettes, tasse) assis à gauche, portable de trois quarts, écran projeté sombre en haut à droite, tous en variables CSS.
- [ ] **Step 3:** Préparation 2–4 s : apparition de la salle ; `config.json` et `etudiants.csv` volent dans le portable ; tuiles allumées sur l'écran projeté et le portable.
- [ ] **Step 4:** `pnpm check:hero` vert ; validation XML stricte (`python3 -c "import xml.dom.minidom as m; m.parse('assets/readme-hero.svg')"`) ; captures `TIMES=0.1,1.5,2.5,3.2,3.9` + `reduced` en clair et en sombre ; vérifier la planche.
- [ ] **Step 5:** Commit `♻️ Remplace la fenêtre de l'animation du README par une salle d'oral` ; remettre `sheet.png` au contrôleur.

### Task 2 : passage (4–12 s) et mouvement réduit

**Files:** Modify: `assets/readme-hero.svg`

**Interfaces:**
- Consumes: groupes et symboles de la tâche 1.

- [ ] **Step 1:** Choix 4–6 s : A entre par la droite et se place ; bulle « flamme » ; tuile Difficile allumée sur les deux écrans.
- [ ] **Step 2:** Tirage et réponse 6–8,5 s : cartes mélangées puis carte question sur l'écran projeté (énoncé seul) ; sur le portable, énoncé + barre « réponse attendue » de couleur distincte ; bulle « … » animée au-dessus de A.
- [ ] **Step 3:** Note 8,5–10 s : un bouton de note s'allume sur le portable ; « +2 » monte au-dessus du portable ; score affiché sur l'écran projeté.
- [ ] **Step 4:** Suivants 10–12 s : A sort par la droite ; B puis C passent en accéléré (tuile, question, note) ; le score se met à jour pour chacun.
- [ ] **Step 5:** `@media (prefers-reduced-motion: reduce)` : salle figée au moment de la note (voir Global Constraints).
- [ ] **Step 6:** `check:hero` vert, XML strict ; captures `TIMES=4.5,5.5,6.5,7.5,8.2,9.2,9.8,10.5,11.5` + `reduced` ; vérifier la planche (Review Focus 1 et 3).
- [ ] **Step 7:** Commit `✨ Anime le passage d'un étudiant dans la salle d'oral du README` ; remettre `sheet.png`.

### Task 3 : zoom (12–18 s), raccord, intégration et mémoire

**Files:** Modify: `assets/readme-hero.svg`, `README.md:3`, `docs/DECISIONS.md` (D95), `docs/INDEX.md` (ligne de l'animation), `docs/HANDOFF.md`, `docs/BACKLOG.md` si besoin

- [ ] **Step 1:** Zoom 12–15 s : `#laptop` (ou un double dans `#zoom`) s'agrandit jusqu'à remplir l'image, le décor s'efface ; stats (barres + courbe, reprises de l'ancienne scène 5) dans l'écran.
- [ ] **Step 2:** Export 15–18 s : fichier Excel qui sort de l'écran zoomé (reprise de l'ancienne scène 6) ; fondu vers le titre à 17,7–18 s.
- [ ] **Step 3:** Nettoyage : plus aucun symbole, classe, keyframe ni groupe inutilisé ; commentaires de section avec leurs plages en secondes ; `<desc>` = texte alternatif exact.
- [ ] **Step 4:** README ligne 3 : `![<texte alternatif>](assets/readme-hero.svg)`.
- [ ] **Step 5:** Mémoire : D95 complété par la révision (pourquoi, salle + zoom, 18 s, personnages, mouvement réduit) ; ligne INDEX mise à jour ; entrée HANDOFF du jour amendée (pas de nouvelle entrée) avec les quatre marqueurs. Lire chaque `docs/*.md` par plage seulement.
- [ ] **Step 6:** `pnpm check` vert ; XML strict ; captures `TIMES=12.3,13,14,15.5,16.5,17.5,17.9` puis la planche complète `TIMES=0.1,1.5,3.2,5.5,7.5,9.2,11,13.5,16.5,17.9` + `reduced` ; vérifier.
- [ ] **Step 7:** Commit `✨ Zoome sur les stats et l'export dans l'animation du README` ; push ; remettre la planche complète.
