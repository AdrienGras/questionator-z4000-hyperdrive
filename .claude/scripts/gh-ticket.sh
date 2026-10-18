#!/usr/bin/env bash
# Crée une issue « feature », l'ajoute au projet n°3 (Status=Ready, Priority, Size) et pose les dépendances « blocked by ».
# usage: ticket.sh "<title>" <body.md> <priority> <size> [blocked_by_issue_numbers...]
set -euo pipefail
R=AdrienGras/questionator-z4000-hyperdrive; P=PVT_kwHOBEq7jc4BkiAe
title=$1 body=$2 prio=$3 size=$4; shift 4
url=$(gh issue create -R $R -t "$title" -F "$body" -l feature); n=${url##*/}; echo "$url"
# Le projet peut avoir déjà ajouté l'issue de lui-même (« Content already exists ») : on reprend alors son élément.
item=$(gh project item-add 3 --owner AdrienGras --url "$url" --format json -q .id 2>/dev/null) ||
  item=$(gh project item-list 3 --owner AdrienGras --limit 1000 --format json -q ".items[]|select(.content.number==$n).id")
[ -n "$item" ] || { echo "issue #$n introuvable dans le projet n°3" >&2; exit 1; }
F=$(gh project field-list 3 --owner AdrienGras --format json)
set_f(){ fid=$(jq -r --arg n "$1" '.fields[]|select(.name==$n).id' <<<"$F"); oid=$(jq -r --arg n "$1" --arg o "$2" '.fields[]|select(.name==$n).options[]|select(.name==$o).id' <<<"$F"); gh project item-edit --id "$item" --project-id $P --field-id "$fid" --single-select-option-id "$oid" >/dev/null; echo "  $1=$2"; }
set_f Status Ready; set_f Priority "$prio"; set_f Size "$size"
for b in "$@"; do bid=$(gh api repos/$R/issues/$b -q .id); gh api -X POST repos/$R/issues/$n/dependencies/blocked_by -F issue_id=$bid >/dev/null && echo "  blocked_by #$b"; done
