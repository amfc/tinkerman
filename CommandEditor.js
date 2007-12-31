LOG.Class('CommandEditor');

LOG.CommandEditor.prototype.init = function(ownerDocument, evalCallback) {
    var doc = ownerDocument;
    this.evalCallback = evalCallback;
    this.input = new LOG.CommandInput;
    this.input.init(doc, false, this.evalCallback);
    
    this.element = LOG.createElement(doc, 'div',
        {
            style: {
                height: '1.8em',
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
}

LOG.CommandEditor.prototype.onToggleTextAreaClick = function(event) {
    this.textAreaBig = !this.textAreaBig;
    
    var oldInput = null;
    if (this.input) {
        oldInput = this.input;
    }
    
    this.input = new LOG.CommandInput;
    this.input.init(doc, this.textAreaBig, this.evalCallback);
    
    LOG.removeObjEventListener(this, oldInput, 'keydown', this.onInputKeyDown);
    LOG.removeObjEventListener(this, oldInput, 'mousedown', LOG.stopPropagation);
    oldInput.parentNode.replaceChild(this.input.element, oldInput.element);
    
    if (this.textAreaBig) {
        this.element.style.height = '12em';
        this.scrollContainer.style.paddingBottom = '12em';
        this.toggleTextAreaLink.firstChild.data = 'small';
    } else {
        this.element.style.height = '1.8em';
        this.scrollContainer.style.paddingBottom = '1.8em';
        this.toggleTextAreaLink.firstChild.data = 'big';
    }
    
    LOG.stopPropagation(event);
    LOG.preventDefault(event);
}

LOG.CommandEditor.prototype.focus = function() {
    this.input.focus();
}