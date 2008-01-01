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
    if (typeof console == 'string') {
        console = this.addConsole(console);
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
    if (this.bodyWrapper) {
        this.bodyWrapper.uninit();
        delete this.bodyWrapper;
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
    if (this.bodyWrapper) {
        this.bodyWrapper.hide();
    }
}

LOG.Console.prototype.show = function() {
    this.hidden = false;
    if (this.bodyWrapper) {
        this.bodyWrapper.show();
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

LOG.Console.prototype.onNewWindowClick = function(event) {
    LOG.stopPropagation(event);
    LOG.preventDefault(event);
    LOG.willOpenInNewWindow = !LOG.willOpenInNewWindow;
    this.deleteElement();
    this.prepareNewDocument();
    this.createElement();
    LOG.addCookie('LOG_IN_NEW_WINDOW', LOG.willOpenInNewWindow ? 'true' : 'false', 30);
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
                        paddingTop: '1.8em'
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
            )
        ]
    );
    
    this.commandEditor = new LOG.CommandEditor;
    this.commandEditor.init(doc, this.evaluator, function() { me.updateCommandEditorSize() } );
    this.element.appendChild(this.commandEditor.element);
    
    var me = this;
    function append() {
        if (!LOG.willOpenInNewWindow) {
            this.bodyWrapper = new LOG.BodyWrapper;
            this.bodyWrapper.init(me.ownerDocument, me.element);
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

LOG.Console.prototype.updateCommandEditorSize = function() {
    if (this.scrollContainer) {
        this.scrollContainer.style.paddingBottom = this.commandEditor.getHeight() + 'em';
    }
}

LOG.Console.prototype.focus = function() {
    this.commandEditor.focus();
}
