LOG.Class('Logger');

LOG.Logger.prototype.init = function(doc, inNewWindow, historyManager) {
    this.doc = doc;
    this.sections = {};
    this.inNewWindow = inNewWindow;
    this.box = new LOG.Vbox;
    this.box.init(doc);
    
    this.panelManager = new LOG.PanelManager;
    this.panelManager.init(doc,
        LOG.createElement(doc, 'span', {},
            [
                ', ',
                LOG.createElement(doc, 'a',
                    {
                        href: '#',
                        style: {
                            fontWeight: 'normal'
                        },
                        onclick: LOG.createEventHandler(doc, this, 'onClearClick')
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
                        onclick: LOG.createEventHandler(doc, this, 'onCloseClick')
                    },
                    [ 'close' ]
                ),
                ' (alt-k), ',
                LOG.createElement(doc, 'a',
                    {
                        href: '#',
                        style: {
                            fontWeight: 'normal'
                        },
                        onclick: LOG.createEventHandler(doc, this, 'onNewWindowClick')
                    },
                    [ this.inNewWindow ? 'same window' : 'new window' ]
                ),
                ' (alt-i) '
            ]
        )
    );
    
    // create the default console
    var consoleSection = this.addConsoleSection('console');
    consoleSection.panel.setSelected(true);
    this.defaultConsole = consoleSection.content;
    
    this.evaluator = new LOG.Evaluator;
    this.evaluator.init(this);

    //~ var me = this;
    
    //~ this.htmlPanel = new LOG.LogPanel;
    //~ this.htmlPanel.init(doc, 'html', false);
    //~ this.htmlPanel.onselect = function() {
        //~ if (!me.htmlLogItem) {
            //~ me.htmlLogItem = new LOG.HTMLElementLogItem;
            //~ me.htmlLogItem.init(this.doc, document.getElementsByTagName('html')[0], false, [], true);
            //~ me.htmlPanel.contentElement.appendChild(me.htmlLogItem.element);
        //~ }
    //~ }
    
    //~ this.consoles.html = {
        //~ panel: this.htmlPanel,
        //~ count: 0
    //~ };
    
    //~ this.pagePanel = new LOG.LogPanel;
    //~ this.pagePanel.init(doc, 'page', false);
    //~ this.pagePanel.onselect = function() {
        //~ function createPageLogItem() {
            //~ if (!self[LOG.pageObjectName]) {
                //~ setTimeout(createPageLogItem, 1000);
                //~ return;
            //~ }
            //~ if (!me.pageLogItem) {
                //~ me.pageLogItem = LOG.getValueAsLogItem(doc, self[LOG.pageObjectName], true, []);
                //~ me.pagePanel.contentElement.appendChild(me.pageLogItem.element);
            //~ }
        //~ }
        //~ createPageLogItem();
    //~ }
    
    //~ this.consoles.page = {
        //~ panel: this.pagePanel,
        //~ count: 0
    //~ };
    
    this.historyManager = historyManager;
    
    this.commandEditor = new LOG.CommandEditor;
    this.commandEditor.init(doc, this.evaluator, function() { me.updateCommandEditorSize() }, this.historyManager);
    
    this.box.add(this.panelManager.element, { size: 100, sizeUnit: '%' });
    this.box.add(this.commandEditor.element, { size: this.commandEditor.getHeight(), sizeUnit: 'em' });
    this.element = this.box.element;
    var me = this;
    LOG.addEventListener(this.element, 'keydown', function(event) { me.onKeyDown(event) });
}

LOG.Logger.prototype.logText = function(text, title) {
    this.defaultConsole.appendRow(this.doc.createTextNode(text), title);
}

LOG.Logger.prototype.logException = function(exception, title) {
    var logItem = new LOG.ExceptionLogItem;
    logItem.init(this.doc, exception);
    this.defaultConsole.appendRow(
        logItem.element,
        title,
        true,
        'red'
    );
}

LOG.Logger.prototype.logObjectSource = function(object, title) {
    var logItem = new LOG.ObjectLogItem;
    logItem.init(this.doc, object, this.stackedMode);
    this.defaultConsole.appendRow(logItem.element, title);
    return LOG.dontLogResult;
}

LOG.Logger.prototype.log = function(message, title, newLineAfterTitle, sectionName, dontOpen, stackedMode) {
    if (!sectionName) {
        sectionName = 'console';
    }
    var section = this.getOrAddConsoleSection(sectionName);
    section.content.appendRow(
        LOG.getValueAsHtmlElement(
            this.doc,
            message,
            stackedMode == undefined ? this.stackedMode : stackedMode,
            undefined,
            true,
            true
        ),
        title,
        newLineAfterTitle,
        null
    );
    if (!dontOpen) {
        section.panel.setSelected(true);
    } else if (!section.panel.selected) {
        section.panel.setChanged(true);
    }
    return message;
}

LOG.Logger.prototype.logAndStore = function(value, source) {
    var pos = LOG.indexOf(LOG.clickedMessages, value);
    if (pos == -1) {
        pos = LOG.clickedMessages.length;
        LOG.clickedMessages[pos] = value;
    }
    
    if (source) {
        this.logObjectSource(value, null, this.stackedMode);
    } else {
        this.console.appendRow(LOG.getValueAsHtmlElement(document, value, this.stackedMode, undefined, true));
    }
    if (this.console.commandEditor.commandInput.element.value == '' || this.console.commandEditor.commandInput.element.value.match(/^\$[0-9]+$/)) {
        this.console.commandEditor.commandInput.element.value = '$' + pos;
    }
    return;
}

LOG.Logger.prototype.updateCommandEditorSize = function() {
    this.box.setChildSize(1, this.commandEditor.getHeight(), 'em');
}

LOG.Logger.prototype.onNewWindowClick = function(event) {
    LOG.stopPropagation(event);
    LOG.preventDefault(event);
    if (this.onnewwindowtoggleclick) {
        this.onnewwindowtoggleclick();
    }
}

LOG.Logger.prototype.focus = function() {
    this.commandEditor.focus();
}

LOG.Logger.prototype.onKeyDown = function(event) {
    if (event.keyCode == 27) { // Esc
        if (this.onescpress) {
            this.onescpress();
        }
        LOG.stopPropagation(event);
        LOG.preventDefault(event);
    } else {
        var chr = String.fromCharCode(event.keyCode).toLowerCase();
        if (event.altKey && event.shiftKey) {
            if (chr == 'c') {
                this.onClearClick(event);
            } else if (chr == 'k') {
                this.onCloseClick(event);
            }
        }
    }
}

LOG.Logger.prototype.addConsoleSection = function(sectionName) {
    var console = new LOG.Console;
    console.init(this.doc);
    return this.addSection(sectionName, console);
}

LOG.Logger.prototype.getOrAddConsoleSection = function(sectionName) {
    if (this.sections[sectionName]) {
        return this.sections[sectionName];
    } else {
        return this.addConsoleSection(sectionName);
    }
}

LOG.Logger.prototype.addSection = function(sectionName, content) {
    var panel = new LOG.LogPanel;
    panel.init(this.doc, sectionName);
    panel.contentElement.appendChild(content.element);
    this.panelManager.add(panel);
    
    var section = {
        panel: panel,
        content: content
    };
    
    this.sections[sectionName] = section;
    
    return section;
}

LOG.Logger.prototype.onClearClick = function(event) {
    LOG.stopPropagation(event);
    LOG.preventDefault(event);
    for (var sectionName in this.sections) {
        if (this.sections[sectionName].panel.selected) {
            this.sections[sectionName].panel.setChanged(false);
            this.sections[sectionName].content.clear();
        }
    }
}

// FIXME: unchecked - unimplemented

LOG.Logger.prototype.onCloseClick = function(event) {
    LOG.stopPropagation(event);
    LOG.preventDefault(event);
    if (this.oncloseclick) {
        this.oncloseclick();
    }
}

// This searchs for some value in all the selected panels and focuses it
LOG.Logger.prototype.focusValue = function(value, dontLog) {
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
        logItem.init(this.doc, path);
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

