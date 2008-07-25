LOG.Logger = function(doc, inNewWindow, historyManager, openSectionsStr) {
    this.doc = doc;
    this.panels = {};
    this.box = new LOG.Vbox(doc);
    this.panelManager = new LOG.PanelManager(doc,
        LOG.createElement(doc, 'span', {},
            [
                LOG.createElement(doc, 'a',
                    {
                        href: '#',
                        style: {
                            fontWeight: 'normal'
                        },
                        title: 'ctrl-shift-c: clear visible panels',
                        onclick: LOG.createEventHandler(doc, this, 'onClearClick')
                    },
                    [
                        LOG.createElement(doc, 'span',
                            { style: { fontWeight: 'bold' } },
                            [ 'c' ]
                        ),
                        'lr'
                    ]
                ),
                ' ',
                LOG.createElement(doc, 'a',
                    {
                        href: '#',
                        style: {
                            fontWeight: 'normal'
                        },
                        title: 'ctrl-shift-t: attach / detach window',
                        onclick: LOG.createEventHandler(doc, this, 'onNewWindowClick')
                    },
                    [
                        this.inNewWindowAttachDetachPrefix = doc.createTextNode(inNewWindow ? 'at' : 'de'),
                        LOG.createElement(doc, 'span',
                            { style: { fontWeight: 'bold' } },
                            [ 't' ]
                        )
                    ]
                ),
                this.collapseButton = LOG.createElement(doc, 'span',
                    {
                        style: { display: inNewWindow ? 'none' : '' }
                    },
                    [
                        ' ',
                        LOG.createElement(doc, 'a',
                            {
                                href: '#',
                                style: {
                                    fontWeight: 'normal'
                                },
                                onclick: LOG.createEventHandler(doc, this, 'onCollapseToggleClick'),
                                title: 'toggle collapse'
                            },
                            [ '[', this.closeButtonTextNode = doc.createTextNode('x'), ']' ]
                        )
                    ]
                )
            ]
        )
    );
    var me = this;
    this.panelManager.onpanellabelclick = function(panel, selected) {
        return me.onPanelLabelClick(panel, selected);
    }
    this.element = LOG.createElement(doc, 'div',
        {
            onkeydown: LOG.createEventHandler(doc, this, 'onKeyDown'),
            style: {
                borderTop: '1px solid gray',
                height: '100%'
            }
        },
        [
            this.box.element
        ]
    );
    
    // create the default console
    var consoleSection = this.addConsoleSection('console', true);
    consoleSection.setSelected(true);
    this.defaultConsole = consoleSection.content;
    
    this.evaluator = new LOG.Evaluator(this);

    this.htmlSection = this.addSection('html', new LOG.HtmlSection(doc));
    this.historyManager = historyManager;
    this.commandEditor = new LOG.CommandEditor(doc, this.evaluator, function() { me.updateCommandEditorSize() }, this.historyManager);
    this.box.add(this.panelManager.element, { size: 100, sizeUnit: '%' });
    this.box.add(this.commandEditor.element, { size: this.commandEditor.getHeight(), sizeUnit: 'em' });
    this.unserializeOpenSections(openSectionsStr);
}

LOG.setTypeName(LOG.Logger, 'LOG.Logger');

LOG.Logger.prototype.onPanelLabelClick = function(panel, selected) {
    if (this.collapsed) {
        if (this.onexpandrequest) {
            this.onexpandrequest();
        }
        this.setCollapsed(false);
        return !selected; // We cancel (return true) if the panel would be unselected (we want to open the panel)
    }
}

LOG.Logger.prototype.onConsoleRowAppend = function(console, dontOpen) {
    if (this.onconsolerowappend) {
        this.onconsolerowappend(console, dontOpen);
    }
}

LOG.Logger.prototype.setInNewWindow = function(inNewWindow) {
    this.inNewWindowAttachDetachPrefix.nodeValue = inNewWindow ? 'at' : 'de';
    this.collapseButton.style.display = inNewWindow ? 'none' : '';
    if (inNewWindow) {
        this.setCollapsed(false);
    }
}

LOG.Logger.prototype.unserializeOpenSections = function(str) {
    if (str) {
        this.panels.console.setSelected(false);
        var openSections = str.split(',');
        for (var i = 0; i < openSections.length; ++i) {
            this.getOrAddConsoleSection(openSections[i]).setSelected(true);
        }
    }
}

LOG.Logger.prototype.serializeOpenSections = function() {
    var out = '';
    var panels = this.panels;
    for (var sectionName in panels) {
        if (panels[sectionName].selected) {
            if (out) {
                out += ',';
            }
            out += sectionName;
        }
    }
    return out;
}

LOG.setTypeName(LOG.Logger, 'LOG.Logger');

LOG.Logger.prototype.logText = function(text, title) {
    this.defaultConsole.appendRow(this.doc.createTextNode(text), title);
}

LOG.Logger.prototype.logException = function(exception, title) {
    var logItem = new LOG.ExceptionLogItem(this.doc, exception);
    this.defaultConsole.appendRow(
        logItem.element,
        title,
        true,
        'red'
    );
}

LOG.Logger.prototype.logObjectSource = function(object, title) {
    var logItem = new LOG.ObjectLogItem(this.doc, object, this.stackedMode);
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
        null,
        dontOpen
    );
    if (!dontOpen) {
        section.setSelected(true);
    } else if (!section.selected) {
        section.setChanged(true);
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
        this.defaultConsole.appendRow(LOG.getValueAsHtmlElement(this.doc, value, this.stackedMode, undefined, true));
    }

    if (this.commandEditor.commandInput.element.value == '' || this.commandEditor.commandInput.element.value.match(/^\$[0-9]+$/)) {
        this.commandEditor.commandInput.element.value = '$' + pos;
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
            }
        }
    }
}

LOG.Logger.prototype.addConsoleSection = function(sectionName, shouldExpandOnRowAppend) {
    var console = new LOG.Console(this.doc);
    console.onrowappend = (function(me) { return function(dontOpen) { me.onConsoleRowAppend(console, dontOpen) } })(this);
    console.shouldExpandOnRowAppend = shouldExpandOnRowAppend;
    return this.addSection(sectionName, console);
}

LOG.Logger.prototype.getOrAddConsoleSection = function(sectionName, shouldExpandOnRowAppend) {
    if (this.panels[sectionName]) {
        return this.panels[sectionName];
    } else {
        return this.addConsoleSection(sectionName, shouldExpandOnRowAppend);
    }
}

LOG.Logger.prototype.getOrAddSection = function(sectionName, content) {
    if (this.panels[sectionName]) {
        // if content is set the old panel will have the content replaced
        if (content) {
            this.panels[sectionName].setContent(content);
        }
        return this.panels[sectionName];
    } else {
        return this.addSection(sectionName, content);
    }
}

LOG.Logger.prototype.addSection = function(sectionName, content) {
    var panel = new LOG.LogPanel(this.doc, sectionName, false, content);
    this.panelManager.add(panel);
    this.panels[sectionName] = panel;
    return panel;
}

LOG.Logger.prototype.removeSection = function(sectionName) {
    this.panelManager.remove(this.panels[sectionName]);
    delete this.panels[sectionName];
}

LOG.Logger.prototype.onClearClick = function(event) {
    LOG.stopPropagation(event);
    LOG.preventDefault(event);
    for (var sectionName in this.panels) {
        if (this.panels[sectionName].selected) {
            this.panels[sectionName].setChanged(false);
            if (this.panels[sectionName].content && this.panels[sectionName].content.clear) {
                this.panels[sectionName].content.clear();
            }
        }
    }
}

LOG.Logger.prototype.setCollapsed = function(collapsed) {
    if (collapsed) {
        this.box.setChildHidden(1, true);
        this.panelManager.setBodyHidden(true);
        this.closeButtonTextNode.nodeValue = '|';
    } else {
        this.box.setChildHidden(1, false);
        this.panelManager.setBodyHidden(false);
        this.closeButtonTextNode.nodeValue = 'x';
    }
    this.collapsed = collapsed;
}

LOG.Logger.prototype.onCollapseToggleClick = function(event) {
    if (this.oncollapsetoggleclick) {
        this.oncollapsetoggleclick();
    }
    LOG.stopPropagation(event);
    LOG.preventDefault(event);
}

LOG.Logger.prototype.getValueAsLogItem = function(value, stackedMode, alreadyLoggedContainers, showFirstLevelObjectChildren, showExpandObjectChildren) {
    return LOG.getValueAsLogItem(this.doc, value, stackedMode, alreadyLoggedContainers, showFirstLevelObjectChildren, showExpandObjectChildren);
}

// This searchs for some value in all the selected panels and focuses it
LOG.Logger.prototype.focusValue = function(value, dontLog, dontSeparatePathBySpaces) {
    for (var sectionName in this.panels) {
        var section = this.panels[sectionName].content;
        if (section.focusValue) {
            section.focusValue(value, dontLog, this.panels[sectionName], dontSeparatePathBySpaces);
        }
    }
}
