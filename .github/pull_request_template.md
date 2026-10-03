## Contexte

Closes #

<!-- Le problème ou le besoin, en deux ou trois phrases. -->

## Changements

<!-- Ce qui change, regroupé par sujet. -->

## Tests

<!-- Ce qui a été testé et comment : tests ajoutés, vérification manuelle, navigateur. -->

## Checklist

- [ ] `Closes #n` renseigné ci-dessus
- [ ] PR ouverte en brouillon
- [ ] `pnpm check` vert, CI verte
- [ ] `.claude/scripts/sonar-check.sh --pr <n> --wait` : Quality gate OK, 0 issue, 0 hotspot
- [ ] Mémoire projet à jour : `docs/INDEX.md`, `docs/HANDOFF.md` et, selon le cas, `DECISIONS.md`, `QUIRKS.md`, `BACKLOG.md`, `CONVENTIONS.md`
- [ ] Captures du guide régénérées (`pnpm docs:screenshots`) si l'interface visible dans le guide change

Le déroulé complet : [Workflow](https://adriengras.github.io/questionator-z4000-hyperdrive/docs/contribuer/workflow.html).
