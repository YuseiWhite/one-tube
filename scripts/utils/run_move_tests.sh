#!/usr/bin/env bash
set -euo pipefail
cd "$(dirname "$0")/../../contracts"
export MOVE_HOME="$PWD/.move_home"
mkdir -p "$MOVE_HOME"
if [ -d "$HOME/.move" ]; then
  cp -R "$HOME/.move/." "$MOVE_HOME/" 2>/dev/null || true
fi
REF_GAS_PRICE_MIST="${REF_GAS_PRICE_MIST:-1000}"
sui move test -s csv --skip-fetch-latest-git-deps |
awk -v price="$REF_GAS_PRICE_MIST" '
{
  if (prev ~ /^\[ PASS/ && $0 == "name,nanos,gas") {
    print "";
    print "name,nanos(ns),gas_units,cost_mist,cost_sui";
    prev=$0; next
  }
  if ($0 == "name,nanos,gas") {
    print "name,nanos(ns),gas_units,cost_mist,cost_sui";
    prev=$0; next
  }
  if ($0 ~ /^contracts::/) {
    split($0, cols, ",");
    gas_units = cols[3];
    cost_mist = gas_units * price;
    cost_sui = cost_mist / 1000000000;
    printf "%s,%s,%s,%.0f,%.9f\n", cols[1], cols[2], cols[3], cost_mist, cost_sui;
    prev=$0; next
  }
  print; prev=$0
}
'
