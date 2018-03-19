#!/bin/bash

set -o nounset
set -o errexit

npm login --always-auth << !
${NPM_UN}
${NPM_PW}
ben.monro@gmail.com
!

git config --global user.email "ben.monro@gmail.com"
git config --global user.name "benmonro"
