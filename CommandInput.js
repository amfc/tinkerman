LOG.CommandInput = function(doc, useTextArea, evaluator, historyManager) {
    this.doc = doc;
    this.evaluator = evaluator;
    this.useTextArea = useTextArea;
    
    this.historyManager = historyManager;
    
    this.element = LOG.createElement(
        this.doc,
        useTextArea ? 'textarea' : 'input',
        {
            style: {
                width: '100%',
                height: '100%',
                border: 'none',
                padding: '0',
                fontFamily: 'terminus, monospace',
                fontWeight: 'normal'
            },
            onmousedown: LOG.createEventHandler(doc, this, 'onInputMouseDown')
        }
    );
    if (LOG.isIE || LOG.isKonq || LOG.isWebKit) {
        this.element.onkeydown = LOG.createEventHandler(doc, this, 'onInputKeyPressOrDown');
    }
    if (!LOG.isIE && !LOG.isWebKit) { // Konq needs both
        this.element.onkeypress = LOG.createEventHandler(doc, this, 'onInputKeyPressOrDown');
    }
}

LOG.setTypeName(LOG.CommandInput, 'LOG.CommandInput');

LOG.CommandInput.prototype.onInputMouseDown = function(event) {
    LOG.stopPropagation(event);
}

LOG.CommandInput.prototype.getCurrentExpression = function(code, position) {
    function skipString(quote) {
        for (--startWordPos; startWordPos > 0; --startWordPos) {
            if (code.charAt(startWordPos) == quote && code.charAt(startWordPos - 1) != '\\') {
                return;
            }
        }
        throw 'unterminated string';
    }
    
    var endWordPos = position;
    var startWordPos = endWordPos;
    var depth = 0, chr, bracketDepth = 0;
    while (startWordPos > 0) {
        chr = code.charAt(startWordPos - 1);
        if (chr == ')') {
            ++depth;
        } else if (chr == '(') {
            if (depth == 0) {
                break;
            }
            --depth;
        } else if (chr == '[') {
            if (bracketDepth == 0) {
                break;
            }
            --bracketDepth;
        } else if (chr == ']') {
            ++bracketDepth;
        } else if (chr == '\'' || chr == '"') {
            skipString(chr);
        } else if (depth == 0 && !(/^[a-zA-Z0-9_$.]$/.test(chr))) {
            break;
        }
        --startWordPos;
    }
    return code.substr(startWordPos, endWordPos - startWordPos);
}

LOG.CommandInput.prototype.getCurrentWordAndPosition = function(code, currentPosition) {
    var endWordPos = currentPosition;
    var startWordPos = currentPosition;
    var chr;
    while (startWordPos > 0) {
        chr = code.charAt(startWordPos - 1);
        if (!(/^[a-zA-Z0-9_$]$/.test(chr))) {
            break;
        }
        startWordPos--;
    }
    return {
        word: code.substr(startWordPos, endWordPos - startWordPos),
        start: startWordPos,
        end: endWordPos
    }
}

LOG.CommandInput.prototype.autoChooseSuggestion = function(code, currentWordAndPosition, matches) {
    function getCommonStart(list) {
        var common = list[0];
        var j;
        for (var i = 1; i < list.length; ++i) {
            if (list[i].length < common.length) {
                common = common.substr(0, list[i].length);
            }
            for (j = 0; j < common.length; ++j) {
                if (common.charAt(j) != list[i].charAt(j)) {
                    common = common.substr(0, j);
                    break;
                }
            }
        }
        return common;
    }
    var position = currentWordAndPosition.end;
    if (matches.length > 0) {
        var commonStart = getCommonStart(matches);
        if (commonStart.length > currentWordAndPosition.word.length) {
            code = code.substr(0, currentWordAndPosition.end) +
                commonStart.substr(currentWordAndPosition.word.length) +
                code.substr(currentWordAndPosition.end)
            ;
            position = currentWordAndPosition.end + commonStart.length - currentWordAndPosition.word.length;
        }
    }
    return {
        matches: matches,
        newCode: code,
        newPosition: position
    }
}

LOG.CommandInput.prototype.suggestJs = function(code, currentPosition) {
    var currentExpression = this.getCurrentExpression(code, currentPosition);
    var currentWordAndPosition = this.getCurrentWordAndPosition(code, currentPosition);
    var names;
    if (currentExpression == currentWordAndPosition.word) {
        names = LOG.getObjectProperties(window).concat(
            [
                'escape', 'unescape', 'encodeURI', 'decodeURI', 'encodeURIComponent',
                'decodeURIComponent', 'isFinite', 'isNaN', 'Number', 'eval', 'parseFloat',
                'parseInt', 'String', 'Infinity', 'undefined', 'NaN', 'true', 'false'
            ]
        );
    } else {
        var script = currentExpression.substr(0, currentExpression.length - currentWordAndPosition.word.length);
        if (script.charAt(script.length - 1) == '.') {
            script = script.substr(0, script.length - 1);
        }
        var result = this.evaluator.evalScript(script);
        if ((typeof result != 'object' && typeof result != 'function') || result == LOG.dontLogResult) {
            return;
        }
        names = LOG.getObjectProperties(result);
    }
    var matches = this.getNamesStartingWith(currentWordAndPosition.word, names);
    return this.autoChooseSuggestion(code, currentWordAndPosition, matches);
}

LOG.CommandInput.prototype.onInputKeyPressOrDown = function(event) {
    // Konqueror and opera return normal keys with keyCode as the charCode
    //  For Konqueror we skip them here to prevent "(" to be detected as "down" and similar
    //  For opera it seems not to be possible, so we require control+shift to use these keys
    //   (since control alone triggers a link navigation behaviour which doesn't seem to be
    //   cancellable)
    if (event.charCode) { // This only works for Konqueror, as Opera doesn't support charCode
        return;
    }
    if (LOG.isKonq) {
        if (event.keyCode == 9) {
            if (event.type != 'keydown') {
                return;
            }
        } else {
            if (event.type == 'keydown') {
                return;
            }
        }
    }
    if (event.keyCode == 9) { // Tab
        LOG.stopPropagation(event);
        LOG.preventDefault(event);
        var value = this.element.value;
        var extension = LOG.getExtensionFromCode(value);
        var me = this;
        function handleSuggestion(suggestion) {
            if (!suggestion) {
                return;
            }
            me.element.value = suggestion.newCode;
            LOG.setTextInputSelection(me.element, [suggestion.newPosition, suggestion.newPosition]);
            if (suggestion.matches.length > 1) {
                Log(suggestion.matches, 'Matches');
            }
        }
        
        if (extension) {
            extension.suggest(this.element.value, LOG.getTextInputSelection(this.element)[0], handleSuggestion);
        } else {
            handleSuggestion(this.suggestJs(this.element.value, LOG.getTextInputSelection(this.element)[0]));
        }
    } else if (event.keyCode == 38 && (!this.useTextArea || event.ctrlKey) && (!LOG.isOpera || (event.ctrlKey && event.shiftKey))) { // Up
        this.element.value = this.historyManager.up(this.element.value);
        LOG.stopPropagation(event);
        LOG.preventDefault(event);
    } else if (event.keyCode == 40 && (!this.useTextArea || event.ctrlKey) && (!LOG.isOpera || (event.ctrlKey && event.shiftKey))) { // Down
        this.element.value = this.historyManager.down();
        LOG.stopPropagation(event);
        LOG.preventDefault(event);
    } else if (event.keyCode == 13) {
        if (!this.useTextArea || event.ctrlKey) {
            this.historyManager.add(this.element.value);
            this.evaluator.evalScriptAndPrintResults(this.element.value);
            LOG.stopPropagation(event);
            LOG.preventDefault(event);
            if (!this.useTextArea) {
                this.element.value = '';
            }
        } else if (this.useTextArea) { // We keep indentation in enters
            function getLineFromLeft(value, pos) {
                var chr, line = '';
                while (pos >= 0) {
                    chr = value.charAt(pos);
                    if (chr == '\n' || chr == '\r') {
                        break;
                    }
                    line = chr + line;
                    --pos;
                }
                return line;
            }
            function getIndentation(line) {
                var chr;
                var indentation = '';
                for (var i = 0; i < line.length; ++i) {
                    chr = line.charAt(i);
                    if (chr != ' ' && chr != '\t') {
                        break;
                    }
                    indentation += chr;
                }
                return indentation;
            }
            var pos = LOG.getTextInputSelection(this.element)[0];
            var indentation = getIndentation(getLineFromLeft(this.element.value, pos - 1));
            this.element.value = this.element.value.substring(0, pos) + '\n' + indentation + this.element.value.substring(pos);
            pos += indentation.length + 1;
            LOG.setTextInputSelection(this.element, [pos, pos]);
            LOG.stopPropagation(event);
            LOG.preventDefault(event);
        }
    }
}

LOG.CommandInput.prototype.writeStringToInput = function(str) {
    var currentWordAndPosition = this.getCurrentWordAndPosition(str, LOG.getTextInputSelection(this.element)[0]);
    this.element.value = this.element.value.substr(0, currentWordAndPosition.end) + str +
        this.element.value.substr(currentWordAndPosition.end)
    ;
    var endPos = currentWordAndPosition.end + str.length;
    LOG.setTextInputSelection(this.element, [endPos, endPos]);
    this.element.focus();
}

LOG.CommandInput.prototype.getNamesStartingWith = function(start, names) {
    var matches = [];
    for (var i = 0; i < names.length; ++i) {
        if (names[i].substr(0, start.length) == start) {
            matches.push(names[i]);
        }
    }
    matches.sort();
    return matches;
}

LOG.CommandInput.prototype.focus = function() {
    this.element.focus();
}
