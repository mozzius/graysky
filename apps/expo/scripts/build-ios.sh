#!/bin/bash

export $(xargs < ../../.env)
SHORT_SHA=$(git rev-parse --short HEAD)
eas build --platform ios --profile production --non-interactive --local --output="./$SHORT_SHA.ipa" --wait
[ -f "$SHORT_SHA.ipa" ] && eas submit --platform ios --path="./$SHORT_SHA.ipa" --non-interactive --wait