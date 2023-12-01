#!/bin/bash

SHORT_SHA=$(git rev-parse --short HEAD)
eas build --platform android --profile production --non-interactive --local --output="./$SHORT_SHA.ipa" --wait
eas submit --platform android --path="./$SHORT_SHA.ipa" --wait