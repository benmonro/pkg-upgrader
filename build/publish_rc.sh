#!/bin/bash

set -o errexit

npm install --production
npm run std-version --prerelease beta
git push --follow-tags origin ${CIRCLE_BRANCH}
npm publish --tag prerelease

