#!/usr/bin/env bash
# Vérifie l'analyse SonarQube Cloud d'une branche ou d'une PR : quality gate, issues ouvertes,
# hotspots à revoir. À lancer après un push, avant d'ouvrir (ou de déclarer prête) une PR.
#
# usage : sonar-check.sh [--branch <nom>|--pr <numéro>] [--wait]
#   défaut : --branch <branche courante>
#   --wait : attend que SonarQube Cloud ait analysé le commit HEAD (jusqu'à 10 min)
#
# Code de sortie : 0 si quality gate OK et aucune issue ouverte, 1 sinon, 2 si l'analyse est introuvable.
set -euo pipefail

PROJECT=AdrienGras_questionator-z4000-hyperdrive
API=https://sonarcloud.io/api
mode=branch
target=$(git rev-parse --abbrev-ref HEAD)
wait=false

while [ $# -gt 0 ]; do
  case $1 in
    --branch) mode=branch target=$2; shift 2 ;;
    --pr) mode=pullRequest target=$2; shift 2 ;;
    --wait) wait=true; shift ;;
    *) echo "option inconnue : $1" >&2; exit 2 ;;
  esac
done

q="$mode=$target"

if $wait; then
  head=$(git rev-parse HEAD)
  for _ in $(seq 60); do
    # project_analyses ne donne pas le commit analysé d'une PR : on lit la liste des PR / branches.
    if [ "$mode" = pullRequest ]; then
      rev=$(curl -fsS "$API/project_pull_requests/list?project=$PROJECT" | jq -r --arg k "$target" '.pullRequests[] | select(.key == $k) | .commit.sha // empty' || true)
    else
      rev=$(curl -fsS "$API/project_branches/list?project=$PROJECT" | jq -r --arg k "$target" '.branches[] | select(.name == $k) | .commit.sha // empty' || true)
    fi
    [ "$rev" = "$head" ] && break
    sleep 10
  done
  [ "$rev" = "$head" ] || { echo "SonarQube Cloud n'a pas encore analysé $head" >&2; exit 2; }
fi

gate=$(curl -fsS "$API/qualitygates/project_status?projectKey=$PROJECT&$q") || { echo "analyse introuvable pour $q" >&2; exit 2; }
status=$(jq -r '.projectStatus.status' <<<"$gate")
echo "Quality gate ($q) : $status"
jq -r '.projectStatus.conditions[] | select(.status != "OK") | "  ✗ \(.metricKey) = \(.actualValue) (seuil \(.errorThreshold))"' <<<"$gate"

issues=$(curl -fsS "$API/issues/search?componentKeys=$PROJECT&$q&resolved=false&ps=100")
n=$(jq '.total' <<<"$issues")
echo "Issues ouvertes : $n"
jq -r '.issues[] | "  - [\(.severity) \(.type)] \(.component | sub("^[^:]+:"; "")):\(.line // "-") \(.rule) — \(.message)"' <<<"$issues"

hotspots=$(curl -fsS "$API/hotspots/search?projectKey=$PROJECT&$q&status=TO_REVIEW&ps=100")
h=$(jq '.paging.total // 0' <<<"$hotspots")
echo "Hotspots à revoir : $h"
jq -r '.hotspots[]? | "  - [\(.vulnerabilityProbability)] \(.component | sub("^[^:]+:"; "")):\(.line // "-") \(.ruleKey) — \(.message)"' <<<"$hotspots"

[ "$status" = "OK" ] && [ "$n" -eq 0 ] && [ "$h" -eq 0 ]
