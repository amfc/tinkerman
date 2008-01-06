LOG.Class('CommandInput');

LOG.CommandInput.prototype.init = function(doc, useTextArea, evaluator) {
    this.doc = doc;
    this.evaluator = evaluator;
    this.useTextArea = useTextArea;
    
    //~ this.history = LOG.getCookie('LOG_HISTORY');
    if (this.history) {
        try {
            this.history = eval('(' + this.history + ')');
            if (this.history.length > 0) {
                this.historyPosition = this.history.length;
            }
        } catch (e) {
            this.history = [];
            this.historyPosition = -1;
        }
    } else {
        this.history = [];
        this.historyPosition = -1;
    }
    
    this.element = LOG.createElement(
        this.doc,
        useTextArea ? 'textarea' : 'input',
        {
            style: {
                width: '100%',
                height: '100%',
                border: '1px solid gray',
                fontFamily: 'terminus, monospace',
                fontSize: '13px',
                fontWeight: 'normal'
            },
            onkeydown: LOG.createEventHandler(doc, this, 'onInputKeyDown'),
            mousedown: function(event) {
                if (!event) {
                    event = LOG.console.getWindow().event;
                }
                LOG.stopPropagation(event);
            }
        }
    );
}

LOG.CommandInput.prototype.getCurrentExpression = function() {
    function skipString(quote) {
        for (--startWordPos; startWordPos > 0; --startWordPos) {
            if (value.charAt(startWordPos) == quote && value.charAt(startWordPos - 1) != '\\') {
                return;
            }
        }
        throw 'unterminated string';
    }
    
    var endWordPos = LOG.getTextInputSelection(this.element)[0];
    var startWordPos = endWordPos;
    var value = this.element.value;
    var depth = 0, chr, bracketDepth = 0;
    while (startWordPos > 0) {
        chr = value.charAt(startWordPos - 1);
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
    return value.substr(startWordPos, endWordPos - startWordPos);
}

LOG.CommandInput.prototype.getCurrentWordAndPosition = function() {
    var endWordPos = LOG.getTextInputSelection(this.element)[0];
    var startWordPos = endWordPos;
    var value = this.element.value;
    var chr;
    while (startWordPos > 0) {
        chr = value.charAt(startWordPos - 1);
        if (!(/^[a-zA-Z0-9_$]$/.test(chr))) {
            break;
        }
        startWordPos--;
    }
    return {
        word: value.substr(startWordPos, endWordPos - startWordPos),
        start: startWordPos,
        end: endWordPos
    }
}

LOG.CommandInput.prototype.onInputKeyDown = function($event) {
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
    if ($event.keyCode == 13) {
        if (!this.useTextArea || $event.ctrlKey) {
            if (this.history[this.history.length - 1] != this.element.value) {
                this.history.push(this.element.value);
            }
            this.historyPosition = this.history.length;
            this.evaluator.evalScriptAndPrintResults(this.element.value);
            LOG.stopPropagation($event);
            LOG.preventDefault($event);
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
            LOG.stopPropagation($event);
            LOG.preventDefault($event);
        }
    } else if ($event.keyCode == 9) { // Tab
        LOG.stopPropagation($event);
        LOG.preventDefault($event);
        var currentExpression = this.getCurrentExpression();
        var currentWordAndPosition = this.getCurrentWordAndPosition();
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
            if (typeof result != 'object' || result == LOG.dontLogResult) {
                return;
            }
            names = LOG.getObjectProperties(result);
        }
        var matches = this.getNamesStartingWith(currentWordAndPosition.word, names);
        if (matches.length == 0) {
            return;
        }
        if (matches.length > 1) {
            Log(matches, 'Matches');
        }
        var commonStart = getCommonStart(matches);
        if (commonStart.length > currentWordAndPosition.word.length) {
            this.element.value = this.element.value.substr(0, currentWordAndPosition.end) +
                commonStart.substr(currentWordAndPosition.word.length) +
                this.element.value.substr(currentWordAndPosition.end)
            ;
            var commonStartPos = currentWordAndPosition.end + commonStart.length - currentWordAndPosition.word.length;
            LOG.setTextInputSelection(this.element, [commonStartPos, commonStartPos]);
        }
    } else if ($event.keyCode == 38 && (!this.useTextArea || $event.ctrlKey)) { // Up
        if (this.historyPosition > 0) {
            --this.historyPosition;
            this.element.value = this.history[this.historyPosition];
        }
        LOG.stopPropagation($event);
        LOG.preventDefault($event);
    } else if ($event.keyCode == 40 && (!this.useTextArea || $event.ctrlKey)) { // Down
        if (this.historyPosition == this.history.length - 1) {
            this.element.value = '';
            this.historyPosition == this.history.length;
        } else if (this.historyPosition != -1 && this.historyPosition < this.history.length - 1) {
            ++this.historyPosition;
            this.element.value = this.history[this.historyPosition];
        }
        LOG.stopPropagation($event);
        LOG.preventDefault($event);
    }
}

LOG.CommandInput.prototype.writeStringToInput = function(str) {
    var currentWordAndPosition = this.getCurrentWordAndPosition();
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
