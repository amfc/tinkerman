LOG.Class('CommandEditor');

LOG.CommandEditor.prototype.init = function(ownerDocument, evalCallback, resizeCallback) {
    var doc = ownerDocument;
    this.ownerDocument = ownerDocument;
    this.evalCallback = evalCallback;
    this.resizeCallback = resizeCallback;
    this.input = new LOG.CommandInput;
    this.input.init(doc, false, this.evalCallback);
    
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
                                        },
                                        [ this.input.element ]
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
    this.setHeight(1.8);
}

LOG.CommandEditor.prototype.setHeight = function(height) {
    this.height = height;
    this.element.style.height = height + 'em';
}

LOG.CommandEditor.prototype.getHeight = function() {
    return this.height;
}

LOG.CommandEditor.prototype.onToggleTextAreaClick = function(event) {
    this.textAreaBig = !this.textAreaBig;
    
    var oldInput = null;
    if (this.input) {
        oldInput = this.input;
    }
    
    this.input = new LOG.CommandInput;
    this.input.init(this.ownerDocument, this.textAreaBig, this.evalCallback);
    
    oldInput.element.parentNode.replaceChild(this.input.element, oldInput.element);
    
    if (this.textAreaBig) {
        this.setHeight(12);
        this.toggleTextAreaLink.firstChild.data = 'small';
    } else {
        this.setHeight(1.8);
        this.toggleTextAreaLink.firstChild.data = 'big';
    }
    this.resizeCallback();
    LOG.stopPropagation(event);
    LOG.preventDefault(event);
}

LOG.CommandEditor.prototype.focus = function() {
    this.input.focus();
}