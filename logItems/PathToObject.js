if (typeof LOG.PathToObjectLogItem == 'undefined') {
    LOG.PathToObjectLogItem = function() {
    }
}

LOG.PathToObjectLogItem.prototype.init = function(value) {
    var doc = LOG.console.ownerDocument;
    var me = this;
    this.value = value;
    this.element = LOG.createElement(
        doc, 'span',
        {}
    );
    if (value) {
        var part, i;
        for (i = 0; i < value.pathToObject.length; ++i) {
            part = new LOG.PathToObjectPart;
            part.init(value.pathToObject[i].obj, i == 0 ? value.pathToObject[i].name : LOG.getPropertyAccessor(value.pathToObject[i].name));
            this.element.appendChild(LOG.createElement(doc, 'span', { style: { fontSize: '0.1pt' } }, [ ' ' ]));
            this.element.appendChild(part.element);
        }
        var node = value.pathToObject[value.pathToObject.length - 1].obj;
        for (i = 0; i < value.pathToElement.length; ++i) {
            part = new LOG.PathToObjectPart;
            node = node.childNodes[value.pathToElement[i]];
            part.init(node, '.childNodes[' + value.pathToElement[i] + ']');
            this.element.appendChild(part.element);
        }
    } else {
        this.element.appendChild(document.createTextNode('Could not compute path'));
    }
}

if (typeof LOG.PathToObjectPart == 'undefined') {
    LOG.PathToObjectPart = function() {
    }
}

LOG.PathToObjectPart.prototype.init = function(value, pathPartName) {
    var doc = LOG.console.ownerDocument;
    this.value = value;
    var me = this;
    var ctrlClick = false;
    var link = this.element = LOG.createElement(
        doc, 'a',
        {
            style: {
                textDecoration: 'none',
                color: 'black'
            },
            href: '#',
            onmouseover: function() {
                link.style.textDecoration = 'underline';
                link.style.color = 'olive';
                me.showElementOutline();
            },
            onmouseout: function() {
                link.style.textDecoration = 'none';
                link.style.color = 'black';
                me.hideElementOutline();
            },
            onmousedown: function(event) {
                if (!event) {
                    event = LOG.console.getWindow().event;
                }
                ctrlClick = LOG.getButtonFromEvent(event) == 'left' && event.ctrlKey;
            },
            onclick: function(event) {
                if (!event) {
                    event = LOG.console.getWindow().event;
                }
                if (!ctrlClick) {
                    LOG.console.logAndStore(value);
                    LOG.console.focusValue(value, true);
                } else if (window.Reloadable && value instanceof window.Reloadable) {
                    LOG.openClassInEditor(value);
                }
                LOG.stopPropagation(event);
                LOG.preventDefault(event);
            }
        },
        [ pathPartName ]
    );
}

LOG.PathToObjectPart.prototype.showElementOutline = function() {
    if (this.value.getDomNode) {
        var node = this.value.getDomNode();
        if (node) {
            this.outlineElement = LOG.createOutlineFromElement(node);
        }
    } else if (this.value.nodeType) {
        this.outlineElement = LOG.createOutlineFromElement(this.value);
    }
}

LOG.PathToObjectPart.prototype.hideElementOutline = function() {
    if (this.outlineElement) {
        this.outlineElement.parentNode.removeChild(this.outlineElement);
        delete this.outlineElement;
    }
}
