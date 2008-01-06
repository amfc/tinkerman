LOG.Class('Logger');

LOG.Logger.prototype.init = function(doc) {
    this.consoles = {};
    
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
    );
    
    this.consolePanel = new LOG.LogPanel;
    this.consolePanel.init(doc, 'console', true);
    this.consolePanel.setSelected(true);
    var console = new LOG.Console;
    console.init(doc);
    this.evaluator = new LOG.Evaluator;
    this.evaluator.init(console);
    this.consolePanel.contentElement.appendChild(console.element);
    
    this.panelManager.add(this.consolePanel);
    
    this.console = {
        panel: this.consolePanel,
        count: 0
    }
    
    this.consoles.console = this.console;
    
    var me = this;
    
    this.htmlPanel = new LOG.LogPanel;
    this.htmlPanel.init(doc, 'html', false);
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
    this.pagePanel.init(doc, 'page', false);
    this.pagePanel.onselect = function() {
        function createPageLogItem() {
            if (!self[LOG.pageObjectName]) {
                setTimeout(createPageLogItem, 1000);
                return;
            }
            if (!me.pageLogItem) {
                me.pageLogItem = LOG.getValueAsLogItem(doc, self[LOG.pageObjectName], true, []);
                me.pagePanel.contentElement.appendChild(me.pageLogItem.element);
            }
        }
        createPageLogItem();
    }
    
    this.consoles.page = {
        panel: this.pagePanel,
        count: 0
    };
    
    this.commandEditor = new LOG.CommandEditor;
    this.commandEditor.init(doc, this.evaluator, function() { me.updateCommandEditorSize() } );
    
    var me = this;
    function append() {
        if (!LOG.willOpenInNewWindow) {
            this.bodyWrapper = new LOG.BodyWrapper;
            this.bodyWrapper.init(doc, me.element);
        } else {
            doc.body.appendChild(me.element);
        }
    }
    
    this.box.add(this.panelManager.element, { size: 100, sizeUnit: '%' });
    this.box.add(this.commandEditor.element, { size: 1.3, sizeUnit: 'em' });
    this.element = this.box.element;
    
    if (doc.body) {
        append();
    } else {
        LOG.addEventListener(window, 'load', append);
    }
}

LOG.Logger.prototype.addConsole = function(consoleName, content) {
    if (this.consoles[consoleName]) {
        return this.consoles[consoleName];
    }
    return this.consoles[consoleName] = {
        panel: this.panelManager.add(consoleName),
        content: content
    }
}

LOG.Logger.prototype.onClearClick = function(event) {
    LOG.stopPropagation(event);
    LOG.preventDefault(event);
    for (var consoleName in this.consoles) {
        if (this.consoles[consoleName].panel.selected) {
            this.consoles[consoleName].content.clear();
        }
    }
}

LOG.Logger.prototype.close = function() {
    if (!this.elementCreated || this.stopDebugging) {
        return;
    }
    this.deleteElement();
    this.stopDebugging = true;
}

LOG.Logger.prototype.deleteElement = function() {
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

LOG.Logger.prototype.onCloseClick = function(event) {
    this.close();
    LOG.stopPropagation(event);
    LOG.preventDefault(event);
}

LOG.Logger.prototype.hide = function() {
    this.hidden = true;
    if (this.bodyWrapper) {
        this.bodyWrapper.hide();
    }
}

LOG.Logger.prototype.show = function() {
    this.hidden = false;
    if (this.bodyWrapper) {
        this.bodyWrapper.show();
    }
}

LOG.Logger.prototype.onNewWindowClick = function(event) {
    LOG.stopPropagation(event);
    LOG.preventDefault(event);
    LOG.willOpenInNewWindow = !LOG.willOpenInNewWindow;
    this.deleteElement();
    this.prepareNewDocument();
    this.createElement();
    LOG.addCookie('LOG_IN_NEW_WINDOW', LOG.willOpenInNewWindow ? 'true' : 'false', 30);
}

LOG.Logger.prototype.updateCommandEditorSize = function() {
    //~ if (this.scrollContainer) {
        //~ this.scrollContainer.style.paddingBottom = this.commandEditor.getHeight() + 'em';
    //~ }
}

