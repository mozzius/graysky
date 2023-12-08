#!/bin/bash

rm -rf eas-workingdir
SHORT_SHA=$(git rev-parse --short HEAD)
[ -f "$SHORT_SHA.ipa" ] && rm "$SHORT_SHA.ipa"
EAS_LOCAL_BUILD_WORKINGDIR="$PWD/eas-workingdir" eas build --platform ios --profile production --non-interactive --local --output="./$SHORT_SHA.ipa" --wait
# EAS_LOCAL_BUILD_WORKINGDIR="$PWD/eas-workingdir" eas build --platform ios --profile production --local --output="./$SHORT_SHA.ipa" --wait
[ -f "$SHORT_SHA.ipa" ] && eas submit --platform ios --path="./$SHORT_SHA.ipa" --non-interactive --wait