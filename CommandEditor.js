LOG.CommandEditor = function(doc, evalCallback, resizeCallback, historyManager) {
    this.doc = doc;
    this.evalCallback = evalCallback;
    this.resizeCallback = resizeCallback;
    this.historyManager = historyManager;
    
    this.element = LOG.createElement(this.doc, 'div',
        {
            style: {
                height: '100%',
                backgroundColor: 'white',
                padding: '1px'
            }
        },
        [
            this.inputTable = LOG.createElement(this.doc, 'table',
                {
                    style: {
                        height: '100%',
                        fontSize: '10px',
                        borderSpacing: 0
                    }
                },
                [
                    LOG.createElement(this.doc, 'tbody', {},
                        [
                            LOG.createElement(this.doc, 'tr', {},
                                [
                                    LOG.createElement(this.doc, 'td', {
                                            style: {
                                                width: '10px',
                                                verticalAlign: 'top',
                                                paddingTop: '3px'
                                            },
                                        },
                                        [ '>>>' ]
                                    ),
                                    this.inputTd = LOG.createElement(this.doc, 'td', {
                                            style: {
                                                width: '100%',
                                                verticalAlign: 'bottom',
                                                paddingBottom: '4px'
                                            }
                                        }
                                    ),
                                    this.toggleTextAreaTd = LOG.createElement(this.doc, 'td',
                                        {
                                            style: {
                                                width: '10px',
                                                verticalAlign: 'bottom',
                                                paddingBottom: '4px'
                                            }
                                        },
                                        [
                                            this.toggleTextAreaLink = LOG.createElement(this.doc, 'a',
                                                {
                                                    href: '#',
                                                    style: {
                                                        fontWeight: 'normal',
                                                        fontSize: '12px',
                                                        textDecoration: 'none'
                                                    },
                                                    onclick: LOG.createEventHandler(this.doc, this, 'onToggleTextAreaClick')
                                                },
                                                [ '[big]' ]
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
    this.setIsBig(false, true);
}

LOG.setTypeName(LOG.CommandEditor, 'LOG.CommandEditor');

LOG.CommandEditor.prototype.setHeight = function(height, dontNotifyParent) {
    this.height = height;
    if (!dontNotifyParent) {
        this.resizeCallback();
    }
}

LOG.CommandEditor.prototype.getHeight = function() {
    return this.height;
}

LOG.CommandEditor.prototype.setIsBig = function(isBig, dontNotifyParent) {
    this.textAreaBig = isBig;
    if (this.commandInput) {
        this.commandInput.element.parentNode.removeChild(this.commandInput.element);
    }
    this.commandInput = new LOG.CommandInput(this.doc, this.textAreaBig, this.evalCallback, this.historyManager);
    this.inputTd.appendChild(this.commandInput.element);
    
    if (this.textAreaBig) {
        this.setHeight(4, dontNotifyParent);
        this.toggleTextAreaLink.firstChild.data = '[sml]';
    } else {
        this.setHeight(1.5, dontNotifyParent);
        this.toggleTextAreaLink.firstChild.data = '[big]';
    }
}

LOG.CommandEditor.prototype.onToggleTextAreaClick = function(event) {
    this.setIsBig(!this.textAreaBig);
    LOG.stopPropagation(event);
    LOG.preventDefault(event);
}

LOG.CommandEditor.prototype.focus = function() {
    this.commandInput.focus();
}