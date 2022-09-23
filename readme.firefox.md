Steps to build locally:

1. Install Node and NPM
1. `npm install` to install dependencies
1. `npm run extension:firefox` to bundle and copy files to the extension/ directory and run `web-ext run` for local development

Steps for the production bundle build:

1. `npm run extension:ci:version`
1. `npm run extension:build`
1. `cd extension/`
1. `web-ext build`