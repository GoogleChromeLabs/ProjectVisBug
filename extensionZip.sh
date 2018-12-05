#!/bin/bash
rm -rf ./extension/build/* && mkdir ./visbug_v$1 && cp -R ./extension/* ./visbug_v$1/ && zip -r ./extension/build/visbug_v$1.zip ./visbug_v$1 && rm -rf ./visbug_v$1