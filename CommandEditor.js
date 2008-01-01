LOG.Class('CommandEditor');

LOG.CommandEditor.prototype.init = function(ownerDocument, evalCallback, resizeCallback) {
    var doc = ownerDocument;
    this.ownerDocument = ownerDocument;
    this.evalCallback = evalCallback;
    this.resizeCallback = resizeCallback;
    
    this.element = LOG.createElement(doc, 'div',
        {
            style: {
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
    );
    this.setIsBig(false);
}

LOG.CommandEditor.prototype.setHeight = function(height) {
    this.height = height;
    this.element.style.height = height + 'em';
}

LOG.CommandEditor.prototype.getHeight = function() {
    return this.height;
}

LOG.CommandEditor.prototype.setIsBig = function(isBig) {
    this.textAreaBig = isBig;
    if (this.input) {
        this.input.element.parentNode.removeChild(this.input.element);
    }
    this.input = new LOG.CommandInput;
    this.input.init(this.ownerDocument, this.textAreaBig, this.evalCallback);
    this.inputTd.appendChild(this.input.element);
    
    if (this.textAreaBig) {
        this.setHeight(12);
        this.toggleTextAreaLink.firstChild.data = 'small';
    } else {
        this.setHeight(1.2);
        this.toggleTextAreaLink.firstChild.data = 'big';
    }
    this.resizeCallback();
}

LOG.CommandEditor.prototype.onToggleTextAreaClick = function(event) {
    this.setIsBig(!this.textAreaBig);
    LOG.stopPropagation(event);
    LOG.preventDefault(event);
}

LOG.CommandEditor.prototype.focus = function() {
    this.input.focus();
}