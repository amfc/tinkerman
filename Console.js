LOG.Class('Console');

LOG.Console.prototype.init = function() {
    this.elementCreated = false;
    this.maxCount = 1000;
    this.append = true;
    this.stopDebugging = false;
    this.paused = false;
    this.n = 0;
    this.ownerDocument = document;
    this.stackedMode = true;
    this.evaluator = new LOG.Evaluator;
    this.evaluator.init(this);
    this.count = 0;
    this.element = LOG.createElement(doc, 'div');
}

LOG.Console.prototype.getWindow = function() {
    if (this.window) {
        return this.window;
    } else {
        return window;
    }
}

LOG.Console.prototype.appendRow = function(messageHtmlFragment, title, newLineAfterTitle, titleColor, dontOpen) {
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
    if (this.hidden && !dontOpen) {
        this.show();
    }
    if (!dontOpen) {
        this.panel.setSelected(true);
    } else if (!console.panel.selected) {
        this.panel.setChanged(true);
    }
    if (this.count >= this.maxCount) {
        if (!this.append) {
            this.element.removeChild(this.element.lastChild);
        } else {
            this.element.removeChild(this.element.firstChild);
        }
    } else {
        this.count++;
    }
    this.n++;
    newRow.style.fontFamily = 'terminus, monospace';
    newRow.style.fontSize = '9px';
    newRow.style.color = 'black';
    newRow.style.borderBottom = '1px solid #aaaaaa';
    if (LOG.isGecko) {
        newRow.style.whiteSpace = '-moz-pre-wrap';
    } else {
        newRow.style.whiteSpace = 'pre';
    }
    newRow.style.padding = '2px';
    if (this.count & 1) {
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
    this.count = 0;
    while (console.panel.contentElement.childNodes.length > 0) {
        console.panel.contentElement.removeChild(console.panel.contentElement.firstChild);
    }
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

LOG.Console.prototype.createElement = function() {
    var ownerDocument = this.prepareNewDocument();
    if (LOG.willOpenInNewWindow) {
        ownerDocument.body.innerHTML = '';
    }
    var doc = window.document;
    if (ownerDocument) {
        doc = ownerDocument;
    }
}

LOG.Console.prototype.updateCommandEditorSize = function() {
    if (this.scrollContainer) {
        this.scrollContainer.style.paddingBottom = this.commandEditor.getHeight() + 'em';
    }
}

LOG.Console.prototype.focus = function() {
    this.commandEditor.focus();
}
