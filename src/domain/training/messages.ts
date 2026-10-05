import type { Dictionary, Locale } from '@/lib/i18n/i18n'

type NoParams = Record<string, never>

/** Sections du prompt, dans l'ordre où elles sont rendues. */
export const TRAINING_PROMPT_SECTIONS = [
  'intro',
  'tool',
  'format',
  'steps',
  'calibration',
  'volume',
  'writing',
  'delivery',
] as const

export type TrainingPromptSection = (typeof TRAINING_PROMPT_SECTIONS)[number]

export type TrainingPromptParams = {
  intro: NoParams
  tool: { readmeUrl: string }
  format: { liteSchemaUrl: string; fullSchemaUrl: string; categoryTable: string }
  steps: NoParams
  calibration: NoParams
  volume: NoParams
  writing: { decimalExample: string }
  delivery: NoParams
}

const fr: Dictionary<TrainingPromptParams> = {
  intro:
    () => `Tu vas générer un fichier de configuration pour Questionator Z-4000 Hyperdrive, une application
d'entraînement aux oraux. Je t'ai joint mon cours et mes ateliers (PDF ou zip) : c'est la seule
source de contenu autorisée.`,
  tool: ({ readmeUrl }) => `## 1. Comprendre l'outil
Lis la présentation du projet :
${readmeUrl}
L'étudiant choisit un niveau, une question est tirée, il y répond, affiche la réponse attendue
et se note lui-même avec le barème du niveau.`,
  format: ({ liteSchemaUrl, fullSchemaUrl, categoryTable }) => `## 2. Respecter le format
Lis le JSON Schema, qui fait foi pour la structure et les champs autorisés :
${liteSchemaUrl}
Aucune clé hors schéma. Le champ \`$schema\` du fichier vaut :
"${fullSchemaUrl}"
Valeurs imposées :
- "schemaVersion": 1, "locale": "fr"
- "exam.title" : le titre du cours ; "exam.subject" : la matière
- "scoring": { "questionsPerStudent": 3, "maxRawScore": 10, "finalScale": 20 }
- exactement ces 4 catégories, dans cet ordre (\`icon\` = nom d'icône Tabler Icons) :
${categoryTable}`,
  steps: () => `## 3. Procéder dans cet ordre
a. Dresse la liste fermée des notions du cours (5 à 15 tags courts, en minuscules, par exemple
   à partir des chapitres). Tu n'utiliseras que ces tags, écrits exactement pareil.
b. Rédige les questions, chacune avec 1 à 3 tags de cette liste.
c. Vérifie les règles d'oral, la couverture et le format (sections 2, 4, 5 et 6) avant de
   répondre.`,
  calibration: () => `## 4. Questions d'oral et difficulté
Ce sont des questions d'ORAL : chaque question se répond à voix haute, en 2 à 5 minutes, sans
écrire de code.
- Ne demande jamais d'écrire, de réécrire ou d'implémenter du code.
- Le cours et les ateliers illustrent des notions ; ils ne sont pas à mémoriser. Ne demande
  jamais un nom de classe, de méthode, de fichier ou une valeur de configuration propre aux
  ateliers, ni « la solution retenue dans l'atelier ». La réponse attendue est une notion, un
  mécanisme ou un raisonnement, jamais un détail du projet.
- Si une question s'appuie sur du code, l'énoncé fournit un extrait court et autonome
  (15 lignes au plus) : l'étudiant raisonne dessus (prédire, expliquer, repérer un problème
  et dire pourquoi), sans avoir vu l'atelier.
- Une seule question par énoncé : pas de liste de cas à traiter un par un.
Plus le niveau monte, plus le raisonnement s'approfondit (pourquoi, compromis, conséquences,
cas limites) ; la quantité de détails à connaître, elle, n'augmente pas.
- facile : RESTITUER. La réponse est littéralement dans le cours, en 1 ou 2 phrases. Une
  seule notion. « Qu'est-ce que… », « À quoi sert… ».
- normal : COMPRENDRE ET APPLIQUER. Expliquer un comportement ou un mécanisme, prédire le
  résultat d'un extrait fourni, appliquer une notion à une situation concrète. Une notion,
  dans un contexte légèrement nouveau.
- difficile : ANALYSER. Relier au moins 2 notions (au moins 2 tags), expliquer la cause d'un
  problème décrit ou montré dans un extrait, comparer deux approches et justifier un choix.
  Un raisonnement, pas une récitation.
- cauchemar : ÉVALUER ET ARGUMENTER. Cas limites, compromis, mécanismes internes, « que se
  passe-t-il si… » sur une notion centrale. Demande une compréhension fine, sans sortir du
  cours.
Toute question doit pouvoir se résoudre avec le contenu fourni, sans connaissance hors programme.`,
  volume: () => `## 5. Volume et couverture
- Pour chaque tag : au moins 1 question facile et 1 question normal.
- Chaque question difficile porte au moins 2 tags.
- cauchemar : 3 à 6 questions, sur les notions centrales.
- Total : 30 à 60 questions, réparties environ en 35 % facile, 30 % normal, 25 % difficile
  et 10 % cauchemar.
- Pas deux questions qui demandent la même chose sous une autre forme.`,
  writing: ({ decimalExample }) => `## 6. Rédiger chaque question
- "id" : "<niveau>-<slug-du-sujet>", en kebab-case et sans numérotation
  (ex. "normal-comparaison-stricte"). Unique dans tout le fichier.
- "title" : un libellé court (moins de 60 caractères).
- "prompt" : l'énoncé en markdown ; les blocs de code indiquent leur langage.
- "answer" : exactement ce gabarit markdown :

  **Réponse de référence**
  <ce qu'un bon candidat dit à l'oral, en quelques phrases, sans code à produire>

  **Barème**
  - **<valeur>** : <ce que dit une réponse qui vaut cette note>
  (une ligne par valeur non nulle du barème du niveau, en ordre croissant, écrite avec une
  virgule décimale : ${decimalExample} ; chaque ligne décrit la réponse complète à ce palier,
  sans « en plus de »)

  **Pièges**
  - <erreur fréquente>
  (section facultative, 1 ou 2 lignes, à omettre si elle n'apporte rien)`,
  delivery: () => `## 7. Livrer
Rends un unique fichier \`.json\`, valide et complet, sans commentaire. Si tu ne peux pas créer
de fichier, rends un seul bloc de code \`\`\`json\`\`\` et rien d'autre.`,
}

const en: Dictionary<TrainingPromptParams> = {
  intro:
    () => `You are going to generate a configuration file for Questionator Z-4000 Hyperdrive, an
app for practising oral exams. I have attached my course and my workshops (PDF or zip): they are
the only permitted source of content.`,
  tool: ({ readmeUrl }) => `## 1. Understand the tool
Read the project presentation:
${readmeUrl}
The student picks a level, a question is drawn, they answer it, reveal the expected answer and
score themselves with the level's scale.`,
  format: ({ liteSchemaUrl, fullSchemaUrl, categoryTable }) => `## 2. Follow the format
Read the JSON Schema, which is authoritative for the structure and the allowed fields:
${liteSchemaUrl}
No key outside the schema. The file's \`$schema\` field is:
"${fullSchemaUrl}"
Required values:
- "schemaVersion": 1, "locale": "en"
- "exam.title": the course title; "exam.subject": the subject
- "scoring": { "questionsPerStudent": 3, "maxRawScore": 10, "finalScale": 20 }
- exactly these 4 categories, in this order (\`icon\` = Tabler Icons icon name):
${categoryTable}`,
  steps: () => `## 3. Proceed in this order
a. Draw up the closed list of the course's concepts (5 to 15 short lowercase tags, for example
   from the chapters). You will only use these tags, spelled exactly the same.
b. Write the questions, each with 1 to 3 tags from this list.
c. Check the oral rules, coverage and format (sections 2, 4, 5 and 6) before answering.`,
  calibration: () => `## 4. Oral questions and difficulty
These are ORAL questions: each question is answered out loud, in 2 to 5 minutes, without
writing any code.
- Never ask to write, rewrite or implement code.
- The course and the workshops illustrate concepts; they are not material to memorise. Never
  ask for a class, method or file name or a configuration value specific to the workshops, nor
  for "the solution chosen in the workshop". The expected answer is a concept, a mechanism or a
  line of reasoning, never a project detail.
- If a question relies on code, the statement provides a short, self-contained snippet
  (15 lines at most): the student reasons about it (predict, explain, spot a problem and say
  why), without having seen the workshop.
- One question per statement: no list of cases to handle one by one.
The higher the level, the deeper the reasoning (why, trade-offs, consequences, edge cases);
the amount of detail to know does not grow.
- facile: RECALL. The answer is literally in the course, in 1 or 2 sentences. A single
  concept. "What is…", "What is … used for…".
- normal: UNDERSTAND AND APPLY. Explain a behaviour or a mechanism, predict the result of a
  provided snippet, apply a concept to a concrete situation. One concept, in a slightly new
  context.
- difficile: ANALYSE. Connect at least 2 concepts (at least 2 tags), explain the cause of a
  problem described or shown in a snippet, compare two approaches and justify a choice.
  Reasoning, not recitation.
- cauchemar: EVALUATE AND ARGUE. Edge cases, trade-offs, internal mechanisms, "what happens
  if…" on a central concept. Requires a fine understanding, without going beyond the course.
Every question must be solvable with the content provided, with no knowledge from outside the syllabus.`,
  volume: () => `## 5. Volume and coverage
- For each tag: at least 1 facile question and 1 normal question.
- Each difficile question carries at least 2 tags.
- cauchemar: 3 to 6 questions, on the central concepts.
- Total: 30 to 60 questions, split roughly into 35% facile, 30% normal, 25% difficile and
  10% cauchemar.
- No two questions asking the same thing in a different form.`,
  writing: ({ decimalExample }) => `## 6. Write each question
- "id": "<level>-<topic-slug>", in kebab-case and without numbering
  (e.g. "normal-strict-comparison"). Unique across the whole file.
- "title": a short label (under 60 characters).
- "prompt": the statement in markdown; code blocks state their language.
- "answer": exactly this markdown template:

  **Reference answer**
  <what a good candidate says out loud, in a few sentences, with no code to produce>

  **Scoring**
  - **<value>**: <what an answer worth this score says>
  (one line per non-zero value of the level's scale, in ascending order, written with a
  decimal point: ${decimalExample}; each line describes the complete answer at that step,
  without "in addition to")

  **Pitfalls**
  - <common mistake>
  (optional section, 1 or 2 lines, to omit if it adds nothing)`,
  delivery: () => `## 7. Deliver
Return a single \`.json\` file, valid and complete, without comments. If you cannot create a
file, return a single \`\`\`json\`\`\` code block and nothing else.`,
}

export const TRAINING_MESSAGES: Record<Locale, Dictionary<TrainingPromptParams>> = { fr, en }
