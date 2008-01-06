LOG.Class('Logger');

LOG.Logger.prototype.init = function(doc, inNewWindow) {
    this.consoles = {};
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
                    [ this.inNewWindow ? 'same window' : 'new window' ]
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
    
    this.box.add(this.panelManager.element, { size: 100, sizeUnit: '%' });
    this.box.add(this.commandEditor.element, { size: this.commandEditor.getHeight(), sizeUnit: 'em' });
    this.element = this.box.element;
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





// unchecked - unimplemented

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

LOG.Logger.prototype.onCloseClick = function(event) {
    LOG.stopPropagation(event);
    LOG.preventDefault(event);
    if (this.oncloseclick) {
        this.oncloseclick();
    }
}

