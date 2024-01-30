#!/bin/bash

export $(xargs < ../../.env)
eas build --platform ios --profile development-simulator --non-interactive --local --output=graysky.tar.gz --wait
[ -f graysky.tar.gz ] &&  eas build:run -p ios --path=graysky.tar.gz