LOG.Class('Console');

LOG.Console.prototype.init = function(doc) {
    this.maxCount = 1000;
    this.append = true;
    this.stopDebugging = false;
    this.n = 0;
    this.ownerDocument = doc;
    this.stackedMode = true;
    this.count = 0;
    this.element = LOG.createElement(doc, 'div');
    //~ var ownerDocument = this.prepareNewDocument();
    //~ if (LOG.willOpenInNewWindow) {
        //~ ownerDocument.body.innerHTML = '';
    //~ }
    //~ var doc = window.document;
    //~ if (ownerDocument) {
        //~ doc = ownerDocument;
    //~ }
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
    if (this.stopDebugging) {
        return;
    }
    //~ if (!this.elementCreated) {
        //~ this.createElement();
        //~ if (dontOpen) {
            //~ this.hide();
        //~ }
    //~ }
    //~ if (this.hidden && !dontOpen) {
        //~ this.show();
    //~ }
    //~ if (!dontOpen) {
        //~ this.panel.setSelected(true);
    //~ } else if (!console.panel.selected) {
        //~ this.panel.setChanged(true);
    //~ }
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
        this.element.insertBefore(newRow, this.element.firstChild);
    } else {
        this.element.appendChild(newRow);
        this.element.scrollTop = this.element.scrollHeight - this.element.offsetHeight + 1;
    }
}

LOG.Console.prototype.clear = function(console) {
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

LOG.Console.prototype.focus = function() {
    this.commandEditor.focus();
}
