#!/bin/bash

function add() {
    echo "// BEGIN $1.js" >> log.js;
    cat $1.js >> log.js;
    echo "// END $1.js" >> log.js;
}

echo "// Compiled LOG" > log.js

add core;
add cookie;
add dom;
add var;
add extra;
add guess;
add diff;
add BodyWrapper;
add CommandInput;
add CommandEditor;
add Evaluator;
add Console;
add logItem;
add LogPanel;
find logItems -name '*.js' -exec bash -c 'cat '{}' >> log.js; echo >> log.js' ';'
add 'init';
