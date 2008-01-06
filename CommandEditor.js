LOG.Class('CommandEditor');

LOG.CommandEditor.prototype.init = function(ownerDocument, evalCallback, resizeCallback) {
    var doc = ownerDocument;
    this.ownerDocument = ownerDocument;
    this.evalCallback = evalCallback;
    this.resizeCallback = resizeCallback;
    
    this.element = LOG.createElement(doc, 'div',
        {
            style: {
                height: '100%',
                backgroundColor: '#f0f0f0'
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
                                        }
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
                                                    onclick: LOG.createEventHandler(doc, this, 'onToggleTextAreaClick')
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
    );
    this.setIsBig(false, true);
}

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
    this.commandInput = new LOG.CommandInput;
    this.commandInput.init(this.ownerDocument, this.textAreaBig, this.evalCallback);
    this.inputTd.appendChild(this.commandInput.element);
    
    if (this.textAreaBig) {
        this.setHeight(4, dontNotifyParent);
        this.toggleTextAreaLink.firstChild.data = 'small';
    } else {
        this.setHeight(1.2, dontNotifyParent);
        this.toggleTextAreaLink.firstChild.data = 'big';
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