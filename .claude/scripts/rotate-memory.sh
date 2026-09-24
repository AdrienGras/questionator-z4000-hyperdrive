#!/bin/bash
# rotate-memory.sh — archive les entrées de journal des mois révolus de
# docs/HANDOFF.md vers docs/handoff/<AAAA-MM>.md.
#
# Sans argument. Exécutable depuis n'importe quel sous-répertoire d'un
# dépôt git. N'écrit rien s'il n'y a rien à archiver. N'échoue jamais
# (hook-safe) : sortie 0 dans tous les cas.
set -u
LC_ALL=C
export LC_ALL

ROOT="$(git rev-parse --show-toplevel 2>/dev/null)" || ROOT="$PWD"
HANDOFF="$ROOT/docs/HANDOFF.md"
ARCHDIR="$ROOT/docs/handoff"

[ -f "$HANDOFF" ] || exit 0

CUR="$(date +%Y-%m)"

# --- Repérer les sections ## par numéro de ligne (jamais par comptage fixe).
H2LINES=()
while IFS= read -r ln; do
  H2LINES+=("$ln")
done < <(grep -n '^## ' "$HANDOFF" | cut -d: -f1)

[ "${#H2LINES[@]}" -gt 0 ] || exit 0

TOTAL_LINES="$(wc -l < "$HANDOFF")"
PREAMBLE_END=$(( H2LINES[0] - 1 ))

STARTS=()
ENDS=()
MONTHS=()
ARCHIVED=()
NEEDS_ARCHIVE=0

for i in "${!H2LINES[@]}"; do
  start="${H2LINES[$i]}"
  if [ "$((i + 1))" -lt "${#H2LINES[@]}" ]; then
    end=$(( H2LINES[$((i + 1))] - 1 ))
  else
    end="$TOTAL_LINES"
  fi
  title="$(sed -n "${start}p" "$HANDOFF")"
  date_found="$(printf '%s\n' "$title" | grep -oE '[0-9]{4}-[0-9]{2}-[0-9]{2}' | head -n1)"
  month=""
  [ -n "$date_found" ] && month="$(printf '%s\n' "$date_found" | grep -oE '^[0-9]{4}-[0-9]{2}')"

  archived=0
  if [ -n "$month" ] && [ "$month" \< "$CUR" ]; then
    archived=1
    NEEDS_ARCHIVE=1
  fi

  STARTS[i]="$start"
  ENDS[i]="$end"
  MONTHS[i]="$month"
  ARCHIVED[i]="$archived"
done

# --- Rien à archiver : aucune écriture, aucune sortie.
[ "$NEEDS_ARCHIVE" -eq 1 ] || exit 0

# --- Construire, par mois, le contenu à ajouter (ordre d'apparition préservé).
MONTH_KEYS=()
declare -A MONTH_BUF
declare -A MONTH_IS_NEW
declare -A MONTH_COUNT

_seen_month() {
  local m="$1" k
  for k in "${MONTH_KEYS[@]}"; do [ "$k" = "$m" ] && return 0; done
  return 1
}

for i in "${!STARTS[@]}"; do
  [ "${ARCHIVED[$i]}" -eq 1 ] || continue
  m="${MONTHS[$i]}"
  if ! _seen_month "$m"; then
    MONTH_KEYS+=("$m")
    MONTH_BUF["$m"]="$(mktemp "${TMPDIR:-/tmp}/.rotate-buf-XXXXXX")"
    if [ -f "$ARCHDIR/$m.md" ]; then
      MONTH_IS_NEW["$m"]=0
      cat "$ARCHDIR/$m.md" > "${MONTH_BUF[$m]}"
      # Retirer les lignes vides finales avant d'ajouter la suite (fichier
      # scratch : réécriture en place autorisée, ce n'est pas la cible).
      while [ -s "${MONTH_BUF[$m]}" ] && [ -z "$(tail -n1 "${MONTH_BUF[$m]}")" ]; do
        sed -i '$d' "${MONTH_BUF[$m]}"
      done
      [ -s "${MONTH_BUF[$m]}" ] && printf '\n' >> "${MONTH_BUF[$m]}"
    else
      MONTH_IS_NEW["$m"]=1
      printf '%s\n\n' "# Handoff — archive $m" > "${MONTH_BUF[$m]}"
    fi
    MONTH_COUNT["$m"]=0
  fi
  sed -n "${STARTS[$i]},${ENDS[$i]}p" "$HANDOFF" >> "${MONTH_BUF[$m]}"
  MONTH_COUNT["$m"]=$(( MONTH_COUNT["$m"] + 1 ))
done

# --- Préambule (sans bloc de pointeurs préexistant, débarrassé des lignes
#     vides finales), dans un fichier temporaire dédié.
PREAMBLE_TMP="$(mktemp "${TMPDIR:-/tmp}/.rotate-preamble-XXXXXX")"
sed -n "1,${PREAMBLE_END}p" "$HANDOFF" \
  | sed '/<!-- ARCHIVES:START -->/,/<!-- ARCHIVES:END -->/d' > "$PREAMBLE_TMP"
while [ -s "$PREAMBLE_TMP" ] && [ -z "$(tail -n1 "$PREAMBLE_TMP")" ]; do
  sed -i '$d' "$PREAMBLE_TMP"
done

# --- Liste des mois d'archive après cette exécution (existants + nouveaux),
#     du plus récent au plus ancien.
ALL_MONTHS=()
if [ -d "$ARCHDIR" ]; then
  for f in "$ARCHDIR"/*.md; do
    [ -e "$f" ] || continue
    b="$(basename "$f" .md)"
    case "$b" in
      [0-9][0-9][0-9][0-9]-[0-9][0-9]) ALL_MONTHS+=("$b") ;;
    esac
  done
fi
ALL_MONTHS+=("${MONTH_KEYS[@]}")
ALL_MONTHS_SORTED=()
while IFS= read -r m; do
  [ -n "$m" ] && ALL_MONTHS_SORTED+=("$m")
done < <(printf '%s\n' "${ALL_MONTHS[@]}" | sort -ru)

# --- Assembler le nouveau HANDOFF.md dans un fichier temporaire.
NEW_HANDOFF="$(mktemp "${TMPDIR:-/tmp}/.rotate-handoff-XXXXXX")"

cat "$PREAMBLE_TMP" > "$NEW_HANDOFF"
[ -s "$PREAMBLE_TMP" ] && printf '\n' >> "$NEW_HANDOFF"

{
  printf '%s\n' '<!-- ARCHIVES:START -->'
  printf '%s' '> Entrées antérieures archivées : '
  first=1
  for m in "${ALL_MONTHS_SORTED[@]}"; do
    if [ "$first" -eq 1 ]; then
      first=0
    else
      printf '%s' ' · '
    fi
    printf '[%s](handoff/%s.md)' "$m" "$m"
  done
  printf '\n'
  printf '%s\n' '<!-- ARCHIVES:END -->'
} >> "$NEW_HANDOFF"
printf '\n' >> "$NEW_HANDOFF"

for i in "${!STARTS[@]}"; do
  [ "${ARCHIVED[$i]}" -eq 1 ] && continue
  sed -n "${STARTS[$i]},${ENDS[$i]}p" "$HANDOFF" >> "$NEW_HANDOFF"
done

# --- Écriture effective : temporaire puis mv, jamais en place.
mkdir -p "$ARCHDIR"
for m in "${MONTH_KEYS[@]}"; do
  mv "${MONTH_BUF[$m]}" "$ARCHDIR/$m.md"
done
mv "$NEW_HANDOFF" "$HANDOFF"
rm -f "$PREAMBLE_TMP"

# --- Annonce sur stdout : une seule ligne, format ROTATED: <mois>=<n> ...
LINE="ROTATED:"
for m in "${MONTH_KEYS[@]}"; do
  LINE="$LINE $m=${MONTH_COUNT[$m]}"
done
printf '%s\n' "$LINE"

exit 0
