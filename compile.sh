#!/bin/bash
echo "// Compiled LOG" > log.js
cat core.js >> log.js
cat cookie.js >> log.js
cat dom.js >> log.js
cat var.js >> log.js
cat extra.js >> log.js
cat guess.js >> log.js
cat diff.js >> log.js
cat logItem.js >> log.js
cat Console.js >> log.js
cat logItem.js >> log.js
cat LogPanel.js >> log.js
find logItems -name '*.js' -exec bash -c 'cat '{}' >> log.js; echo >> log.js' ';'
cat init.js >> log.js