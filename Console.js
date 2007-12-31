LOG.Class('Console');

LOG.Console.prototype.init = function() {
    this.elementCreated = false;
    this.dragging = false;
    this.maxCount = 1000;
    this.append = true;
    this.stopDebugging = false;
    this.paused = false;
    this.n = 0;
    this.lastMessage = null;
    this.ownerDocument = document;
    this.stackedMode = true;
}

LOG.Console.prototype.log = function(message, title, newLineAfterTitle, consoleName, dontOpen, stackedMode) {
    var console;
    if (!this.elementCreated) {
        this.createElement();
        if (dontOpen) {
            this.hide();
        }
    }
    if (consoleName) {
        console = this.addConsole(consoleName);
    } else {
        console = this.console;
    }
    this.lastMessage = message;
    this.appendRow(LOG.getValueAsHtmlElement(message, stackedMode == undefined ? this.stackedMode : stackedMode, undefined, true, true), title, newLineAfterTitle, null, console, dontOpen);
    return message;
}

LOG.Console.prototype.getWindow = function() {
    if (this.window) {
        return this.window;
    } else {
        return window;
    }
}

LOG.Console.prototype.appendRow = function(messageHtmlFragment, title, newLineAfterTitle, titleColor, console, dontOpen) {
    var newRow = this.ownerDocument.createElement('div');
    if (this.stopDebugging || this.paused) {
        return;
    }
    if (!this.elementCreated) {
        this.createElement();
        if (dontOpen) {
            this.hide();
        }
    }
    if (!console) {
        console = this.console;
    }
    if (this.hidden && !dontOpen) {
        this.show();
    }
    if (!dontOpen) {
        console.panel.setSelected(true);
    } else if (!console.panel.selected) {
        console.panel.setChanged(true);
    }
    if (console.count >= this.maxCount) {
        if (!this.append) {
            console.panel.contentElement.removeChild(console.panel.contentElement.lastChild);
        } else {
            console.panel.contentElement.removeChild(console.panel.contentElement.firstChild);
        }
    } else {
        console.count++;
    }
    this.n++;
    newRow.style.fontFamily = 'monospace';
    newRow.style.fontSize = '9pt';
    newRow.style.color = 'black';
    newRow.style.borderBottom = '1px solid #aaaaaa';
    if (LOG.isGecko) {
        newRow.style.whiteSpace = '-moz-pre-wrap';
    } else {
        newRow.style.whiteSpace = 'pre';
    }
    newRow.style.padding = '2px';
    if (console.count & 1) {
        newRow.style.backgroundColor = '#faffff';
    } else {
        newRow.style.backgroundColor = '#fff3f2';
    }
    var em = this.ownerDocument.createElement('em');
    em.appendChild(this.ownerDocument.createTextNode(this.n));
    newRow.appendChild(em);
    newRow.appendChild(this.ownerDocument.createTextNode(': '));
    
    if (title) {
        var strong = this.ownerDocument.createElement('strong');
        if (titleColor) {
            strong.style.color = titleColor;
        }
        strong.appendChild(this.ownerDocument.createTextNode(title + ': ' + (newLineAfterTitle ? '\n' : '')));
        newRow.appendChild(strong);
    }
    newRow.appendChild(messageHtmlFragment);
    if (!this.append) {
        console.panel.contentElement.insertBefore(newRow, console.panel.contentElement.firstChild);
    } else {
        console.panel.contentElement.appendChild(newRow);
        console.panel.contentElement.scrollTop = console.panel.contentElement.scrollHeight - console.panel.contentElement.offsetHeight + 1;
    }
}

LOG.Console.prototype.onClearClick = function(event) {
    LOG.stopPropagation(event);
    LOG.preventDefault(event);
    if (this.console.panel.selected) {
        this.clear(this.console);
    }
    for (var consoleName in this.consoles) {
        if (this.consoles[consoleName].panel.selected) {
            this.clear(this.consoles[consoleName]);
        }
    }
}

LOG.Console.prototype.clear = function(console) {
    if (!this.elementCreated) {
        return;
    }
    if (!console) {
        console = this.console;
    } else {
        if (console == this.consoles.html || console == this.consoles.page) {
            return; // Disabled clearing html and page consoles
        }
    }
    console.panel.setChanged(false);
    console.count = 0;
    while (console.panel.contentElement.childNodes.length > 0) {
        console.panel.contentElement.removeChild(console.panel.contentElement.firstChild);
    }
}

LOG.Console.prototype.close = function() {
    if (!this.elementCreated || this.stopDebugging) {
        return;
    }
    this.deleteElement();
    this.stopDebugging = true;
}

LOG.Console.prototype.deleteElement = function() {
    if (!this.elementCreated) {
        return;
    }
    if (this.wrapperElement) {
        this.unwrapBody();
    }
    if (this.htmlLogItem) {
        delete this.htmlLogItem;
    }
    if (this.pageLogItem) {
        delete this.pageLogItem;
    }
    this.elementCreated = false;
}

LOG.Console.prototype.onCloseClick = function(event) {
    this.close();
    LOG.stopPropagation(event);
    LOG.preventDefault(event);
}

LOG.Console.prototype.onPauseClick = function(event) {
    this.paused = !this.paused;
    if (this.paused) {
        this.pauseLink.firstChild.data = 'resume';
    } else {
        this.pauseLink.firstChild.data = 'pause';
    }
    LOG.stopPropagation(event);
    LOG.preventDefault(event);
}

LOG.Console.prototype.onHideClick = function(event) {
    this.hide();
    LOG.stopPropagation(event);
    LOG.preventDefault(event);
}

LOG.Console.prototype.hide = function() {
    this.hidden = true;
    if (this.wrapperBottomElement) {
        this.wrapperBottomElement.style.display = 'none';
        this.wrapperTopElement.style.height = '100%';
    }
}

LOG.Console.prototype.show = function() {
    this.hidden = false;
    if (this.wrapperBottomElement) {
        this.wrapperBottomElement.style.display = '';
        this.setWrapperSize(this.wrapperSize);
    }
}

LOG.Console.prototype.onToggleTextAreaClick = function(event) {
    this.textAreaBig = !this.textAreaBig;
    
    var oldInput = null;
    if (this.input) {
        oldInput = this.input;
    }
    
    this.input = this.createInput(this.textAreaBig);
    
    LOG.removeObjEventListener(this, oldInput, 'keydown', this.onInputKeyDown);
    LOG.removeObjEventListener(this, oldInput, 'mousedown', LOG.stopPropagation);
    oldInput.parentNode.replaceChild(this.input, oldInput);
    
    
    if (this.textAreaBig) {
        this.inputTableContainer.style.height = '12em';
        this.scrollContainer.style.paddingBottom = '12em';
        this.toggleTextAreaLink.firstChild.data = 'small';
    } else {
        this.inputTableContainer.style.height = '1.8em';
        this.scrollContainer.style.paddingBottom = '1.8em';
        this.toggleTextAreaLink.firstChild.data = 'big';
    }
    
    LOG.stopPropagation(event);
    LOG.preventDefault(event);
}

LOG.Console.prototype.prepareNewDocument = function() {
    if (LOG.willOpenInNewWindow) {
        if (!this.window || this.window.closed) {
            this.window = window.open('', 'LOG_logWindow', 'resizable=yes,scrollbars=yes,status=yes');
            if (!this.window) {
                LOG.willOpenInNewWindow = false;
                this.ownerDocument = document;
                return document;
            }
        }
        this.ownerDocument = this.window.document;
        this.ownerDocument.open();
        this.ownerDocument.write('<html><head><style>a { text-decoration: underline; cursor: pointer; color: #36a; }\n a:hover { color: #36f; }\n * { font-size: 9pt; font-family: monospace, verdana, sans-serif; } BODY { margin: 0 }</style></head><body></body></html>');
        this.ownerDocument.close();
        this.ownerDocument.title = 'Log: ' + window.document.title;
        
        return this.window.document;
        
    } else {
        if (this.window) {
            this.window.close();
        }
        delete this.window;
        this.ownerDocument = document;
        return document;
    }
}

LOG.Console.prototype.onNewWindowClick = function(event) {
    LOG.stopPropagation(event);
    LOG.preventDefault(event);
    LOG.willOpenInNewWindow = !LOG.willOpenInNewWindow;
    this.deleteElement();
    this.prepareNewDocument();
    this.createElement();
    LOG.addCookie('LOG_IN_NEW_WINDOW', LOG.willOpenInNewWindow ? 'true' : 'false', 30);
}

LOG.Console.prototype.onDragKeypress = function(event) {
    if (event.keyCode == 27) {
        this.endDrag();
    }
}

LOG.Console.prototype.onResizeHandleMousedown = function(event) {
    this.dragging = true;
    this.originalDelta = event.clientY - this.wrapperBottomElement.offsetTop;
    this.element.style.borderColor = 'black';
    LOG.addObjEventListener(this, document, 'mousemove', this.onMousemove);
    LOG.addObjEventListener(this, document, 'mouseup', this.onMouseup);
    LOG.addObjEventListener(this, document, 'keypress', this.onDragKeypress);
    if (LOG.isIE) {
        LOG.addObjEventListener(this, document, 'selectstart', this.onSelectstart);
    }
    LOG.stopPropagation(event);
    LOG.preventDefault(event);
}

LOG.Console.prototype.endDrag = function() {
    this.dragging = false;
    this.element.style.borderColor = 'gray';
    LOG.removeObjEventListener(this, document, 'mousemove', this.onMousemove);
    LOG.removeObjEventListener(this, document, 'mouseup', this.onMouseup);
    LOG.removeObjEventListener(this, document, 'keypress', this.onDragKeypress);
    if (LOG.isIE) {
        LOG.removeObjEventListener(this, document, 'selectstart', this.onSelectstart);
    }
}

LOG.Console.prototype.onSelectstart = function(event) {
    LOG.stopPropagation(event);
    LOG.preventDefault(event);
}

LOG.Console.prototype.onMousemove = function(event) {
    if (this.dragging) {
        var top = (event.clientY - this.originalDelta) / LOG.getWindowInnerSize().h;
        if (top < 0) {
            top = 0;
        }
        this.setWrapperSize(1 - top);
        return false;
    }
}

LOG.Console.prototype.onMouseup = function(event) {
    this.endDrag();
}

LOG.Console.prototype.logAndStore = function(value, source) {
    var pos = LOG.indexOf(LOG.clickedMessages, value);
    if (pos == -1) {
        pos = LOG.clickedMessages.length;
        LOG.clickedMessages[pos] = value;
    }
    
    if (source) {
        LOG.logObjectSource(value, null, this.stackedMode);
    } else {
        this.appendRow(LOG.getValueAsHtmlElement(value, this.stackedMode, undefined, true));
    }
    if (LOG.console.input.value == '' || LOG.console.input.value.match(/^\$[0-9]+$/)) {
        LOG.console.input.value = '$' + pos;
    }
    return;
}

LOG.Console.prototype.evalScriptAndPrintResults = function($script) {
    var result = this.evalScript($script);
    if (result !== LOG.dontLogResult) {
        if ($script.indexOf('\n') == -1) {
            this.log(result, $script, true);
        } else {
            this.log(result, $script.substr(0, $script.indexOf('\n')) + '...', true);
        }
    }
}

LOG.Console.prototype.evalScript = function($script) {
    var me = this;
    if ($script == 'help') {
        this.appendRow(
            this.ownerDocument.createTextNode(
                '\n$0, $1 ... $n: clicked element' +
                '\n$_: Last logged value' +
                '\n$E(element): createOutlineFromElement' +
                '\n$S(object, title): logObjectSource' +
                '\n$P(object): getObjectProperties'
            ), 'Help'
        );
        return LOG.dontLogResult;
    }
    try {
        var vars = {
            '$_': this.lastMessage,
            '$P': LOG.getObjectProperties,
            '$S': LOG.logObjectSource,
            '$E': LOG.createOutlineFromElement
        };
        for (var i = 0; i < LOG.clickedMessages.length; ++i) {
           vars['$' + i] = LOG.clickedMessages[i];
        }
        return LOG.evaluate($script, vars);
    } catch (e) {
        var logItem = new LOG.ExceptionLogItem;
        logItem.init(e);
        this.appendRow(
            logItem.element,
            'error ' + $script,
            true,
            'red'
        );
        return LOG.dontLogResult;
    }
}

LOG.Console.prototype.getNamesStartingWith = function(start, names) {
    var matches = [];
    for (var i = 0; i < names.length; ++i) {
        if (names[i].substr(0, start.length) == start) {
            matches.push(names[i]);
        }
    }
    matches.sort();
    return matches;
}

LOG.Console.prototype.getCurrentExpression = function() {
    function skipString(quote) {
        for (--startWordPos; startWordPos > 0; --startWordPos) {
            if (value.charAt(startWordPos) == quote && value.charAt(startWordPos - 1) != '\\') {
                return;
            }
        }
        throw 'unterminated string';
    }
    
    var endWordPos = LOG.getTextInputSelection(this.input)[0];
    var startWordPos = endWordPos;
    var value = this.input.value;
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

LOG.Console.prototype.getCurrentWordAndPosition = function() {
    var endWordPos = LOG.getTextInputSelection(this.input)[0];
    var startWordPos = endWordPos;
    var value = this.input.value;
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

LOG.Console.prototype.onInputKeyDown = function($event) {
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
    if (!$event) {
        $event = LOG.console.getWindow().event;
    }
    if ($event.keyCode == 13) {
        if (!this.textAreaBig || $event.ctrlKey) {
            if (LOG.history[LOG.history.length - 1] != this.input.value) {
                LOG.history.push(this.input.value);
            }
            LOG.historyPosition = LOG.history.length;
            this.evalScriptAndPrintResults(this.input.value);
            LOG.stopPropagation($event);
            LOG.preventDefault($event);
            if (!this.textAreaBig) {
                this.input.value = '';
            }
        } else if (this.textAreaBig) { // We keep indentation in enters
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
            var pos = LOG.getTextInputSelection(this.input)[0];
            var indentation = getIndentation(getLineFromLeft(this.input.value, pos - 1));
            this.input.value = this.input.value.substring(0, pos) + '\n' + indentation + this.input.value.substring(pos);
            pos += indentation.length + 1;
            LOG.setTextInputSelection(this.input, [pos, pos]);
            LOG.stopPropagation($event);
            LOG.preventDefault($event);
        }
    } else if ($event.keyCode == 27) { // Esc
        this.onHideClick($event);
        LOG.stopPropagation($event);
        LOG.preventDefault($event);
    } else if ($event.keyCode == 9) { // Tab
        LOG.stopPropagation($event);
        LOG.preventDefault($event);
        var currentExpression = this.getCurrentExpression();
        var currentWordAndPosition = this.getCurrentWordAndPosition();
        var names;
        if (currentExpression == currentWordAndPosition.word) {
            names = Array.concat(
                LOG.getObjectProperties(window),
                [ 'escape', 'unescape', 'encodeURI', 'decodeURI', 'encodeURIComponent', 'decodeURIComponent', 'isFinite', 'isNaN',
                  'Number', 'eval', 'parseFloat', 'parseInt', 'String', 'Infinity', 'undefined', 'NaN', 'true', 'false'
                ]
            );
            if (LOG.isIE) {
                names = names.concat(names, ['DEBUG_MODE']);
            }
        } else {
            var script = currentExpression.substr(0, currentExpression.length - currentWordAndPosition.word.length);
            if (script.charAt(script.length - 1) == '.') {
                script = script.substr(0, script.length - 1);
            }
            var result = this.evalScript(script);
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
            this.log(matches, 'Matches');
        }
        var commonStart = getCommonStart(matches);
        if (commonStart.length > currentWordAndPosition.word.length) {
            this.input.value = this.input.value.substr(0, currentWordAndPosition.end) +
                commonStart.substr(currentWordAndPosition.word.length) +
                this.input.value.substr(currentWordAndPosition.end)
            ;
            var commonStartPos = currentWordAndPosition.end + commonStart.length - currentWordAndPosition.word.length;
            LOG.setTextInputSelection(this.input, [commonStartPos, commonStartPos]);
        }
    } else if ($event.keyCode == 38 && (!this.textAreaBig || $event.ctrlKey)) { // Up
        if (LOG.historyPosition > 0) {
            --LOG.historyPosition;
            this.input.value = LOG.history[LOG.historyPosition];
        }
        LOG.stopPropagation($event);
        LOG.preventDefault($event);
    } else if ($event.keyCode == 40 && (!this.textAreaBig || $event.ctrlKey)) { // Down
        if (LOG.historyPosition == LOG.history.length - 1) {
            this.input.value = '';
            LOG.historyPosition == LOG.history.length;
        } else if (LOG.historyPosition != -1 && LOG.historyPosition < LOG.history.length - 1) {
            ++LOG.historyPosition;
            this.input.value = LOG.history[LOG.historyPosition];
        }
        LOG.stopPropagation($event);
        LOG.preventDefault($event);
    }
}

// This searchs for some value in all the selected panels and focuses it
LOG.Console.prototype.focusValue = function(value, dontLog) {
    // this takes into account the extra elements which the LOG could have added and ignores them
    function getPathToNodeFromHtmlNode(node) {
        var htmlNode = document.getElementsByTagName('html')[0];
        var path = [];
        while (node && node != htmlNode) {
            path.unshift(LOG.getChildNodeNumber(node));
            node = node.parentNode;
            if (node == LOG.console.wrapperTopElement) {
                node = document.body;
            }
        }
        return path;
    }
    var path = LOG.guessDomNodeOwnerName(value);
    if (!dontLog) {
        // Log the path into the console panel
        var logItem = new LOG.PathToObjectLogItem;
        logItem.init(path);
        this.appendRow(logItem.element);
    }
    if (path) {
        if (value.nodeType) {
            // Focus the element in the html panel
            if (this.htmlLogItem) {
                this.htmlLogItem.focusChild(getPathToNodeFromHtmlNode(value));
            }
        }
        
        // Focus the element in the page panel
        if (this.pageLogItem) {
            path.pathToObject.shift(); // remove the 'page' part
            if (path.pathToObject.length == 0) {
                LOG.focusAndBlinkElement(this.pageLogItem.element);
            } else {
                this.pageLogItem.focusProperty(path.pathToObject);
            }
        }
    }
}

LOG.Console.prototype.createInput = function(useTextArea) {
    return LOG.createElement(
        this.ownerDocument,
        useTextArea ? 'textarea' : 'input',
        {
            style: {
                width: '100%',
                height: '100%',
                border: '1px solid gray',
                fontFamily: 'monospace',
                fontSize: '13px',
                fontWeight: 'normal'
            },
            onkeydown: LOG.createEventHandler(this, 'onInputKeyDown'),
            mousedown: function(event) {
                if (!event) {
                    event = LOG.console.getWindow().event;
                }
                LOG.stopPropagation(event);
            }
        }
    );
}

LOG.Console.prototype.unwrapBody = function() {
    var doc = this.ownerDocument;
    
    doc.body.removeChild(this.wrapperElement);
    while (this.wrapperTopElement.firstChild) {
        child = this.wrapperTopElement.firstChild;
        this.wrapperTopElement.removeChild(child);
        doc.body.appendChild(child);
    }
    this.wrapperElement = null;
    this.wrapperTopElement = null;
    this.wrapperBottomElement = null;
    document.body.style.overflow = this.oldBodyOverflow ? this.oldBodyOverflow : '';
    LOG.removeObjEventListener(this, this.resizeHandle, 'mousedown', this.onResizeHandleMousedown);
}

LOG.Console.prototype.setWrapperSize = function(size) {
    this.wrapperSize = size;
    this.wrapperTopElement.style.bottom = size * 100 + '%';
    this.wrapperTopElement.style.height = (1 - size) * 100 + '%';
    this.wrapperBottomElement.style.top = (1 - size) * 100 + '%';
    this.wrapperBottomElement.style.height = size * 100 + '%';
}

LOG.Console.prototype.wrapBodyInElement = function(element) {
    var doc = this.ownerDocument;
    this.wrapperElement = LOG.createElement(doc, 'div',
        {
            style: {
                top: '0',
                bottom: '0',
                position: 'absolute',
                left: '0',
                right: '0',
                overflow: 'hidden',
                height: '100%',
                width: '100%'
            }
        },
        [
            this.wrapperTopElement = LOG.createElement(doc, 'div',
                {
                    style: {
                        top: '0',
                        width: '100%',
                        position: 'absolute',
                        left: '0',
                        right: '0',
                        overflow: 'auto'
                    }
                }
            ),
            this.wrapperBottomElement = LOG.createElement(doc, 'div',
                {
                    style: {
                        width: '100%',
                        bottom: '0',
                        position: 'absolute',
                        left: '0',
                        right: '0'
                    }
                },
                [
                    element
                ]
            )
        ]
    );
    this.oldBodyOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    
    var size = LOG.getCookie('LOG_SIZE');
    if (!size || isNaN(size = parseFloat(size))) {
        size = 0.3333333;
    }
    
    this.setWrapperSize(size);
    var child;
    while (doc.body.firstChild) {
        child = doc.body.firstChild;
        doc.body.removeChild(child);
        this.wrapperTopElement.appendChild(child);
    }
    doc.body.appendChild(this.wrapperElement);
    
    LOG.addObjEventListener(this, this.resizeHandle, 'mousedown', this.onResizeHandleMousedown);
    
}

LOG.Console.prototype.addConsole = function(consoleName) {
    if (this.consoles[consoleName]) {
        return this.consoles[consoleName];
    }
    return this.consoles[consoleName] = {
        panel: this.addLogPanel(consoleName),
        count: 0
    }
}

LOG.Console.prototype.addLogPanel = function(name) {
    var doc = this.ownerDocument;
    var logPanel = new LOG.LogPanel;
    logPanel.init(name, false);
    this.panelLabels.appendChild(doc.createTextNode(', '));
    this.panelLabels.appendChild(logPanel.labelElement);
    this.panelElements.appendChild(logPanel.panelElement);
    return logPanel;
}

LOG.Console.prototype.createElement = function() {
    this.consoles = {};
    
    var ownerDocument = this.prepareNewDocument();
    if (LOG.willOpenInNewWindow) {
        ownerDocument.body.innerHTML = '';
    }
    var doc = window.document;
    if (ownerDocument) {
        doc = ownerDocument;
    }
    
    this.elementCreated = true;
    
    this.consolePanel = new LOG.LogPanel;
    this.consolePanel.init('console', true);
    
    this.console = {
        panel: this.consolePanel,
        count: 0
    }
    
    this.consoles.console = this.console;
    
    var me = this;
    
    this.htmlPanel = new LOG.LogPanel;
    this.htmlPanel.init('html', false);
    this.htmlPanel.onselect = function() {
        if (!me.htmlLogItem) {
            me.htmlLogItem = new LOG.HTMLElementLogItem;
            me.htmlLogItem.init(document.getElementsByTagName('html')[0], false, [], true);
            me.htmlPanel.contentElement.appendChild(me.htmlLogItem.element);
        }
    }
    
    this.consoles.html = {
        panel: this.htmlPanel,
        count: 0
    };
    
    this.pagePanel = new LOG.LogPanel;
    this.pagePanel.init('page', false);
    this.pagePanel.onselect = function() {
        function createPageLogItem() {
            if (!self[LOG.pageObjectName]) {
                setTimeout(createPageLogItem, 1000);
                return;
            }
            if (!me.pageLogItem) {
                me.pageLogItem = LOG.getValueAsLogItem(self[LOG.pageObjectName], true, []);
                me.pagePanel.contentElement.appendChild(me.pageLogItem.element);
            }
        }
        createPageLogItem();
    }
    
    this.consoles.page = {
        panel: this.pagePanel,
        count: 0
    };
    
    this.textAreaBig = false;
    
    this.element = LOG.createElement(
        doc, 'div',
        {
            style: {
                borderTop: '1px solid gray',
                backgroundColor: 'white',
                color: 'gray',
                position: 'relative',
                height: '100%',
                width: '100%',
                overflow: 'hidden',
                MozBoxSizing: 'border-box'
            }
        },
        [
            this.scrollContainer = LOG.createElement(doc, 'div',
                {
                    style: {
                        position: 'absolute',
                        width: '100%',
                        height: LOG.isIE ? '100%' : null,
                        top: 0,
                        left: 0,
                        bottom: '0',
                        paddingTop: '1.8em',
                        paddingBottom: LOG.isIE ? '2em' : '1.8em'
                    }
                },
                [
                    LOG.createElement(doc, 'table',
                        {
                            style: {
                                width: '100%',
                                height: '100%'
                            },
                            cellPadding: '0',
                            cellSpacing: '0'
                        },
                        [
                            LOG.createElement(doc, 'tbody', {},
                                [
                                    this.panelElements = LOG.createElement(doc, 'tr', {},
                                        [
                                            this.consolePanel.panelElement,
                                            this.htmlPanel.panelElement,
                                            this.pagePanel.panelElement
                                        ]
                                    )
                                ]
                            )
                        ]
                    )
                ]
            ),
            LOG.createElement(doc, 'div', // toolbar container
                {
                    style: {
                        height: '1.8em',
                        position: 'absolute',
                        top: 0,
                        left: 0,
                        right: 0,
                        MozBoxSizing: 'border-box',
                        overflow: 'hidden',
                        fontFamily: 'terminus, lucida console, monospace',
                        backgroundColor: '#f0f0f0'
                    }
                },
                [
                    this.resizeHandle = LOG.createElement(doc, 'div', // resize handle
                        {
                            style: {
                                top: '0px',
                                height: '6px',
                                width: '100%',
                                position: 'absolute',
                                cursor: 'n-resize'
                            }
                        }
                    ),
                    LOG.createElement(doc, 'div', // toolbar
                        {
                            style: {
                                padding: '0.1em',
                                width: '100%'
                            }
                        },
                        [
                            this.panelLabels = LOG.createElement(doc, 'span', {},
                                [
                                    this.consolePanel.labelElement,
                                    ', ',
                                    this.htmlPanel.labelElement,
                                    ', ',
                                    this.pagePanel.labelElement
                                ]
                            ),
                            ', ',
                            LOG.createElement(doc, 'a',
                                {
                                    href: '#',
                                    style: {
                                        fontWeight: 'normal'
                                    },
                                    onclick: LOG.createEventHandler(this, 'onClearClick')
                                },
                                [ 'clear' ]
                            ),
                            ' (alt-c), ',
                            LOG.createElement(doc, 'a',
                                {
                                    href: '#',
                                    style: {
                                        fontWeight: 'normal'
                                    },
                                    onclick: LOG.createEventHandler(this, 'onCloseClick')
                                },
                                [ 'close' ]
                            ),
                            ' (alt-k), ',
                            this.pauseLink = LOG.createElement(doc, 'a',
                                {
                                    href: '#',
                                    style: {
                                        fontWeight: 'normal'
                                    },
                                    onclick: LOG.createEventHandler(this, 'onPauseClick')
                                },
                                [ 'pause' ]
                            ),
                            ' (alt-p), ',
                            LOG.createElement(doc, 'a',
                                {
                                    href: '#',
                                    style: {
                                        fontWeight: 'normal'
                                    },
                                    onclick: LOG.createEventHandler(this, 'onHideClick')
                                },
                                [ 'hide' ]
                            ),
                            ' (alt-h), ',
                            LOG.createElement(doc, 'a',
                                {
                                    href: '#',
                                    style: {
                                        fontWeight: 'normal'
                                    },
                                    onclick: LOG.createEventHandler(this, 'onNewWindowClick')
                                },
                                [ LOG.willOpenInNewWindow ? 'same window' : 'new window' ]
                            ),
                            ' (alt-i) '
                        ]
                    )
                ]
            ),
            this.inputTableContainer = LOG.createElement(doc, 'div',
                {
                    style: {
                        height: '1.8em',
                        position: 'absolute',
                        left: 0,
                        backgroundColor: '#f0f0f0',
                        bottom: 0
                    }
                },
                [
                    this.inputTable = LOG.createElement(doc, 'table',
                        {
                            style: {
                                height: '100%',
                                fontSize: '10px',
                                borderSpacing: 0
                            }
                        },
                        [
                            LOG.createElement(doc, 'tbody', {},
                                [
                                    LOG.createElement(doc, 'tr', {},
                                        [
                                            this.inputTd = LOG.createElement(doc, 'td', {
                                                    style: {
                                                        width: '100%',
                                                        verticalAlign: 'bottom'
                                                    }
                                                },
                                                [
                                                    this.input = this.createInput()
                                                ]
                                            ),
                                            this.toggleTextAreaTd = LOG.createElement(doc, 'td',
                                                {
                                                    style: {
                                                        width: '10px',
                                                        verticalAlign: 'bottom'
                                                    }
                                                },
                                                [
                                                    this.toggleTextAreaLink = LOG.createElement(doc, 'a',
                                                        {
                                                            href: '#',
                                                            style: {
                                                                fontWeight: 'normal',
                                                                fontSize: '12px'
                                                            },
                                                            onclick: LOG.createEventHandler(this, 'onToggleTextAreaClick')
                                                        },
                                                        [ 'big' ]
                                                    )
                                                ]
                                            )
                                        ]
                                    )
                                ]
                            )
                        ]
                    )
                ]
            )
        ]
    );
    
    var me = this;
    function append() {
        if (!LOG.willOpenInNewWindow) {
            me.wrapBodyInElement(me.element);
        } else {
            doc.body.appendChild(me.element);
        }
    }
    
    if (doc.body) {
        append();
    } else {
        LOG.addEventListener(window, 'load', append);
    }
}
