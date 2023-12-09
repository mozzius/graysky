#!/bin/bash

get_abs_filename() {
  # $1 : relative filename
  echo "$(cd "$(dirname "$1")" && pwd)/$(basename "$1")"
}

export $(xargs < ../../.env)
export GOOGLE_SERVICES_JSON=$(get_abs_filename google-services.json)
SHORT_SHA=$(git rev-parse --short HEAD)
eas build --platform android --profile production --non-interactive --local --output="./$SHORT_SHA.aab" --wait
[ -f "$SHORT_SHA.aab" ] && eas submit --platform android --path="./$SHORT_SHA.aab" --non-interactive --wait
[ -f "$SHORT_SHA.aab" ] && rm "$SHORT_SHA.aab"