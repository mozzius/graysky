#!/bin/bash

rm -rf eas-workingdir
SHORT_SHA=$(git rev-parse --short HEAD)
rm "$SHORT_SHA.ipa"
EAS_LOCAL_BUILD_WORKINGDIR="$PWD/eas-workingdir" eas build --platform android --profile production --non-interactive --local --output="./$SHORT_SHA.ipa" --wait
[ -f "$SHORT_SHA.ipa" ] && eas submit --platform android --path="./$SHORT_SHA.ipa" --wait