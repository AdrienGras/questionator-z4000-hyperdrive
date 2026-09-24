#!/bin/bash
# Hook SessionStart canonique : charge le scaffold de mémoire projet et injecte
# un unique objet JSON hookSpecificOutput/additionalContext, ou rien si aucun
# fichier de mémoire n'existe. Ce script ne fait que LIRE — il n'appelle pas
# rotate-memory.sh (l'ordonnancement est assuré par settings.json).
set -u

K=3
THEMATIC_THRESHOLD_KB=4
ARCHIVE_INDEX_MONTHS=12
nl=$'\n'

# --- Fonctions -------------------------------------------------------------

# Index de toutes les lignes "## " avec leur numéro de ligne.
titles_with_lines() {
  grep -n '^## ' "$1" 2>/dev/null
}

# Corps des K premières sections "## " (+ préambule éventuel avant la
# première section). Borne = ligne du (K+1)-ème "## " moins 1 ; si le
# fichier compte K sections ou moins, tout le fichier est retourné.
body_of_first_k() {
  local f="$1" k="$2" bound
  bound="$(grep -n '^## ' "$f" 2>/dev/null | awk -F: -v want="$((k + 1))" '
    NR == want { print $1 - 1; found = 1 }
    END { if (!found) print -1 }
  ')"
  if [ -z "$bound" ] || [ "$bound" -lt 0 ]; then
    cat "$f"
  else
    head -n "$bound" "$f"
  fi
}

# Taille d'un fichier en kilo-octets (division entière).
size_kb() {
  echo $(( $(wc -c < "$1") / 1024 ))
}

# --- Digest de resituation ---------------------------------------------------
# Mesuré sur données réelles : au-delà d'un certain volume, le harnais ne met
# jamais la sortie d'un hook en contexte telle quelle — il la persiste et n'en
# inline qu'un aperçu de tête de quelques centaines d'octets, bien en deçà
# d'un digest de plusieurs Ko. Aucun ordonnancement ne change ça : ce n'est
# pas la TÊTE d'une sortie volumineuse qui survit, c'est une sortie volumineuse
# qui ne survit jamais. La conclusion est une inversion de volume, pas d'ordre :
# stdout n'émet plus que le digest (+ pointeur + annonce courte), et la carte
# complète (index QUIRKS, corps HANDOFF, index des archives, thématiques) part
# intégralement dans .git/memory-snapshot.md — jamais sur stdout.

# Segment textuel commençant à la ligne $2 (1-based, relative à $1 = texte de
# l'entrée) jusqu'à la ligne précédant le marqueur suivant présent dans $4
# (liste triée d'indices, séparés par des espaces), ou jusqu'à $3 (dernière
# ligne de l'entrée) s'il n'y en a pas.
digest_segment() {
  local entry="$1" start="$2" total="$3" all="$4" end="$3" n
  for n in $all; do
    if [ "$n" -gt "$start" ]; then
      end=$((n - 1))
      break
    fi
  done
  printf '%s\n' "$entry" | sed -n "${start},${end}p"
}

# Digest de la PREMIÈRE entrée "## " de docs/HANDOFF.md (la plus récente,
# fichier antéchronologique) : son titre, puis les segments introduits par les
# marqueurs en gras du gabarit du projet, dans l'ordre Dernière chose faite /
# Trucs en suspens / Prochaine chose à creuser. « Notes pour future Claude »
# est volontairement exclu (le plus gros, le moins utile pour se resituer) —
# mais sa position sert quand même à borner le segment qui le précède.
#
# Repli si aucun des trois marqueurs n'est trouvé : titre + 2000 premiers
# caractères du corps, avec un en-tête qui le signale explicitement. Si
# certains marqueurs seulement sont présents, seuls ceux-là sont émis, sans
# section vide ni erreur. Silence total (aucune sortie) si docs/HANDOFF.md est
# absent ou ne contient aucune entrée "## ".
handoff_digest() {
  local f="docs/HANDOFF.md"
  [ -f "$f" ] || return 0

  local titles l1 l2 total endline
  titles="$(grep -n '^## ' "$f" 2>/dev/null)"
  [ -z "$titles" ] && return 0

  l1="$(printf '%s\n' "$titles" | head -n1 | cut -d: -f1)"
  l2="$(printf '%s\n' "$titles" | sed -n '2p' | cut -d: -f1)"
  total="$(wc -l < "$f")"
  if [ -z "$l2" ]; then endline="$total"; else endline=$((l2 - 1)); fi

  local entry entry_total title
  entry="$(sed -n "${l1},${endline}p" "$f")"
  entry_total="$(printf '%s\n' "$entry" | wc -l)"
  title="$(printf '%s\n' "$entry" | head -n1)"

  local m_derniere m_trucs m_prochaine m_notes
  m_derniere="$(printf '%s\n' "$entry" | grep -n '^\*\*Dernière chose faite\*\*' | head -n1 | cut -d: -f1)"
  m_trucs="$(printf '%s\n' "$entry" | grep -n '^\*\*Trucs en suspens\*\*' | head -n1 | cut -d: -f1)"
  m_prochaine="$(printf '%s\n' "$entry" | grep -n '^\*\*Prochaine chose à creuser\*\*' | head -n1 | cut -d: -f1)"
  m_notes="$(printf '%s\n' "$entry" | grep -n '^\*\*Notes pour future Claude\*\*' | head -n1 | cut -d: -f1)"

  if [ -z "$m_derniere" ] && [ -z "$m_trucs" ] && [ -z "$m_prochaine" ]; then
    local head_extract
    head_extract="$(printf '%s\n' "$entry" | tail -n +2 | head -c 2000)"
    echo "=== Digest de resituation — REPLI : aucun marqueur de gabarit (Dernière chose faite / Trucs en suspens / Prochaine chose à creuser) trouvé dans la dernière entrée de docs/HANDOFF.md — ceci est un extrait de TÊTE du corps (2000 premiers caractères), pas une sélection par marqueurs. « Notes pour future Claude » reste volontairement exclu par principe. Entrée complète plus bas dans ce snapshot, section HANDOFF. ==="
    echo
    printf '%s\n' "$title"
    echo
    printf '%s\n' "$head_extract"
    return 0
  fi

  local all_sorted
  all_sorted="$(printf '%s\n' "$m_derniere" "$m_trucs" "$m_prochaine" "$m_notes" | grep -v '^$' | sort -n | tr '\n' ' ')"

  echo "=== Digest de resituation — extrait de la dernière entrée de docs/HANDOFF.md (« Notes pour future Claude » volontairement exclu ; entrée complète plus bas dans ce snapshot, section HANDOFF) ==="
  echo
  printf '%s\n' "$title"
  if [ -n "$m_derniere" ]; then
    echo
    digest_segment "$entry" "$m_derniere" "$entry_total" "$all_sorted"
  fi
  if [ -n "$m_trucs" ]; then
    echo
    digest_segment "$entry" "$m_trucs" "$entry_total" "$all_sorted"
  fi
  if [ -n "$m_prochaine" ]; then
    echo
    digest_segment "$entry" "$m_prochaine" "$entry_total" "$all_sorted"
  fi
}

# --- Parcours de docs/*.md (jamais de récursion dans les sous-répertoires) -

shopt -s nullglob
files=(docs/*.md)
shopt -u nullglob

if [ ${#files[@]} -eq 0 ]; then
  exit 0
fi

OUTPUT=""
DEGRADED=()
ARCHIVES_EXCLUDED=()

for f in "${files[@]}"; do
  base="$(basename "$f")"
  case "$base" in
    HANDOFF.md)
      body="$(body_of_first_k "$f" "$K")"
      idx="$(titles_with_lines "$f")"
      OUTPUT="${OUTPUT}=== docs/HANDOFF.md (journal — corps des ${K} dernières entrées) ===${nl}${body}${nl}${nl}--- docs/HANDOFF.md : index complet des titres ---${nl}${idx}${nl}${nl}"

      # Archives HANDOFF (docs/handoff/<AAAA-MM>.md) : seule exception au
      # non-parcours des sous-répertoires de docs/, et uniquement pour les
      # titres — jamais le corps. Bornée à ARCHIVE_INDEX_MONTHS fichiers, du
      # mois le plus récent au plus ancien, pour éviter une croissance non
      # bornée du contexte au fil des rotations.
      shopt -s nullglob
      archive_files=(docs/handoff/*.md)
      shopt -u nullglob
      if [ ${#archive_files[@]} -gt 0 ]; then
        sorted_archives=()
        while IFS= read -r af; do
          sorted_archives+=("$af")
        done < <(printf '%s\n' "${archive_files[@]}" | sort -r)

        for af in "${sorted_archives[@]:0:$ARCHIVE_INDEX_MONTHS}"; do
          aidx="$(titles_with_lines "$af")"
          OUTPUT="${OUTPUT}=== $af (archive — index des titres uniquement) ===${nl}${aidx}${nl}${nl}"
        done

        for af in "${sorted_archives[@]:$ARCHIVE_INDEX_MONTHS}"; do
          ARCHIVES_EXCLUDED+=("$(basename "$af" .md)")
        done
      fi
      ;;
    QUIRKS.md)
      idx="$(titles_with_lines "$f")"
      OUTPUT="${OUTPUT}=== docs/QUIRKS.md (catalogue — index des titres uniquement) ===${nl}${idx}${nl}${nl}"
      ;;
    *)
      kb="$(size_kb "$f")"
      if [ "$kb" -lt "$THEMATIC_THRESHOLD_KB" ]; then
        body="$(cat "$f")"
        OUTPUT="${OUTPUT}=== $f (thématique — contenu intégral) ===${nl}${body}${nl}${nl}"
      else
        idx="$(titles_with_lines "$f")"
        OUTPUT="${OUTPUT}=== $f (thématique — dégradé en index, >= ${THEMATIC_THRESHOLD_KB} Ko) ===${nl}${idx}${nl}${nl}"
        DEGRADED+=("$base")
      fi
      ;;
  esac
done

if [ -z "$OUTPUT" ]; then
  exit 0
fi

# --- Bloc d'annonce final ---------------------------------------------------

ANNOUNCE="--- Annonce ---${nl}"
if [ ${#DEGRADED[@]} -gt 0 ]; then
  degraded_list="${DEGRADED[*]}"
  ANNOUNCE="${ANNOUNCE}Fichiers dégradés en index (taille >= ${THEMATIC_THRESHOLD_KB} Ko) : ${degraded_list}${nl}"
fi
if [ ${#ARCHIVES_EXCLUDED[@]} -gt 0 ]; then
  excluded_list="${ARCHIVES_EXCLUDED[*]}"
  ANNOUNCE="${ANNOUNCE}Archives HANDOFF non indexées (au-delà de ${ARCHIVE_INDEX_MONTHS} mois) : ${excluded_list}${nl}"
fi
if [ -n "${MEMORY_ROTATED:-}" ]; then
  ANNOUNCE="${ANNOUNCE}${MEMORY_ROTATED}${nl}"
fi

OUTPUT="${OUTPUT}${ANNOUNCE}"

# --- Snapshot complet à chemin stable ---------------------------------------
# Le harnais persiste la sortie d'un hook dès qu'elle dépasse un certain
# volume et ne donne alors qu'un aperçu tronqué en contexte. Le chemin de
# persistance est propre à chaque session et indocumentable ; on écrit donc
# nous-mêmes une copie intégrale du contexte à un chemin stable et documenté.
# Écrasé à chaque démarrage (pas d'accumulation), écriture par fichier
# temporaire puis mv (même mécanique que le relais .git/memory-rotated).
# Best-effort : un hook ne doit jamais faire échouer une session pour un
# problème d'écriture. Ce fichier reçoit le contenu COMPLET (pointeur + digest
# + carte des sections + annonce complète) — inchangé par rapport aux
# itérations précédentes.
SNAPSHOT_PATH=".git/memory-snapshot.md"
MENTION="Snapshot complet du contexte disponible dans ${SNAPSHOT_PATH} — si cet aperçu ne suffit pas, lance /load-memory SANS argument pour obtenir la carte de ses sections (pas son contenu), puis relance /load-memory avec un argument explicite (full, un entier, ou un nom de fichier) pour charger quoi que ce soit. Ne lis jamais ce fichier en entier."

DIGEST="$(handoff_digest)"
PREFIX="${MENTION}${nl}${nl}"
if [ -n "$DIGEST" ]; then
  PREFIX="${PREFIX}${DIGEST}${nl}${nl}"
fi
FULL_OUTPUT="${PREFIX}${OUTPUT}"

SNAPSHOT_OK=0
if [ -d .git ] && tmp_snap="$(mktemp .git/.tmp-memory-snapshot-XXXXXX 2>/dev/null)"; then
  if printf '%s' "$FULL_OUTPUT" > "$tmp_snap" 2>/dev/null && mv "$tmp_snap" "$SNAPSHOT_PATH" 2>/dev/null; then
    SNAPSHOT_OK=1
  else
    rm -f "$tmp_snap" 2>/dev/null
  fi
fi

# --- Sortie stdout : amorce seule, jamais la carte complète -----------------
# stdout (le contexte réellement injecté) n'émet plus, dans cet ordre, que :
# 1. un pointeur reformulé vers le snapshot (dit explicitement que stdout ne
#    contient que le digest, et où trouver la carte complète) ;
# 2. le digest de resituation lui-même ;
# 3. une annonce courte (rotation éventuelle + rappel du snapshot).
# Ni l'index QUIRKS, ni les index thématiques, ni le corps HANDOFF, ni les
# index d'archives ne partent sur stdout — ils restent exclusivement dans
# .git/memory-snapshot.md (voir bloc ci-dessus, inchangé).
if [ "$SNAPSHOT_OK" -eq 1 ]; then
  STDOUT_POINTER="Contexte injecté : le digest de resituation SEUL (titre + Dernière chose faite + Trucs en suspens + Prochaine chose à creuser de la dernière entrée). La carte complète — index des titres de tous les fichiers, corps des ${K} dernières entrées de journal, index des archives — est dans ${SNAPSHOT_PATH} : lance /load-memory SANS argument pour l'obtenir. Ne lis jamais ce fichier en entier."

  STDOUT_ANNOUNCE="--- Annonce ---${nl}"
  if [ -n "${MEMORY_ROTATED:-}" ]; then
    STDOUT_ANNOUNCE="${STDOUT_ANNOUNCE}${MEMORY_ROTATED}${nl}"
  fi
  STDOUT_ANNOUNCE="${STDOUT_ANNOUNCE}Le reste (index QUIRKS, corps HANDOFF complet, index thématiques, index des archives) est dans ${SNAPSHOT_PATH}.${nl}"

  OUTPUT="${STDOUT_POINTER}${nl}${nl}"
  if [ -n "$DIGEST" ]; then
    OUTPUT="${OUTPUT}${DIGEST}${nl}${nl}"
  fi
  OUTPUT="${OUTPUT}${STDOUT_ANNOUNCE}"
fi
# Si SNAPSHOT_OK=0 (pas de .git, ou échec d'écriture) : OUTPUT reste tel
# qu'assemblé plus haut (docs + annonce complète, sans pointeur ni digest) —
# repli historique, il n'y a nulle part où pointer.

jq -nc --arg ctx "$OUTPUT" '{hookSpecificOutput:{hookEventName:"SessionStart",additionalContext:$ctx}}'

exit 0
