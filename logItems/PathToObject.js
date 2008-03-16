LOG.PathToObjectLogItem = function(doc, value) {
    this.doc = doc;
    var me = this;
    this.value = value;
    this.element = LOG.createElement(
        this.doc, 'span',
        {}
    );
    if (value) {
        var part, i;
        for (i = 0; i < value.pathToObject.length; ++i) {
            part = new LOG.PathToObjectPart(this.doc, value.pathToObject[i].obj, i == 0 ? value.pathToObject[i].name : LOG.getPropertyAccessor(value.pathToObject[i].name));
            this.element.appendChild(LOG.createElement(this.doc, 'span', { style: { fontSize: '0.1pt' } }, [ ' ' ]));
            this.element.appendChild(part.element);
        }
        var node = value.pathToObject[value.pathToObject.length - 1].obj;
        for (i = 0; i < value.pathToElement.length; ++i) {
            node = node.childNodes[value.pathToElement[i]];
            part = new LOG.PathToObjectPart(this.doc, node, '.childNodes[' + value.pathToElement[i] + ']');
            this.element.appendChild(part.element);
        }
    } else {
        this.element.appendChild(this.doc.createTextNode('Could not compute path'));
    }
}

LOG.setTypeName(LOG.PathToObjectLogItem, 'LOG.PathToObjectLogItem');

LOG.PathToObjectPart = function(doc, value, pathPartName) {
    this.doc = doc;
    this.value = value;
    this.ctrlClick = false;
    var me = this;
    var link = this.element = LOG.createElement(
        this.doc, 'a',
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
            onmousedown: LOG.createEventHandler(this.doc, this, 'onLinkMouseDown'),
            onclick: LOG.createEventHandler(this.doc, this, 'onLinkClick')
        },
        [ pathPartName ]
    );
}

LOG.PathToObjectPart.prototype.onLinkMouseDown = function(event) {
    this.ctrlClick = LOG.getButtonFromEvent(event) == 'left' && event.ctrlKey;
}

LOG.PathToObjectPart.prototype.onLinkClick = function(event) {
    if (!this.ctrlClick) {
        LogAndStore(this.value);
        LOG.console.focusValue(value, true);
    } else if (window.Reloadable && value instanceof window.Reloadable) {
        LOG.openClassInEditor(value);
    }
    LOG.stopPropagation(event);
    LOG.preventDefault(event);
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
