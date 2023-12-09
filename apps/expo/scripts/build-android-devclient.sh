#!/bin/bash

get_abs_filename() {
  # $1 : relative filename
  echo "$(cd "$(dirname "$1")" && pwd)/$(basename "$1")"
}

export $(xargs < ../../.env)
export GOOGLE_SERVICES_JSON=$(get_abs_filename google-services.json)
SHORT_SHA=$(git rev-parse --short HEAD)
eas build --platform android --profile development --non-interactive --local --output="./$SHORT_SHA.apk" --wait
[ -f "$SHORT_SHA.apk" ] && eas build:run --platform android --path="./$SHORT_SHA.apk"
[ -f "$SHORT_SHA.apk" ] && rm "$SHORT_SHA.apk"