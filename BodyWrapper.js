LOG.BodyWrapper = function(ownerDocument, initialSize, startWithFixedSize) {
    this.dragging = false;
    this.ownerDocument = ownerDocument;
    var doc = this.ownerDocument;
    this.element = LOG.createElement(doc, 'div',
        {
            style: {
                top: '0',
                bottom: '0',
                position: 'absolute',
                left: '0',
                right: '0',
                overflow: 'hidden',
                height: '100%',
                width: '100%'
            }
        },
        [
            this.topElement = LOG.createElement(doc, 'div',
                {
                    style: {
                        top: '0',
                        width: '100%',
                        position: 'absolute',
                        left: '0',
                        right: '0',
                        overflow: 'auto'
                    }
                }
            ),
            this.bottomElement = LOG.createElement(doc, 'div',
                {
                    style: {
                        width: '100%',
                        bottom: '0',
                        position: 'absolute',
                        left: '0',
                        right: '0'
                    }
                },
                [
                    this.resizeHandle = LOG.createElement(doc, 'div', // resize handle
                        {
                            style: {
                                height: '6px',
                                width: '100%',
                                position: 'absolute',
                                zIndex: 1000,
                                cursor: 'n-resize'
                            }
                        }
                    ),
                    this.iframe = LOG.createElement(doc, 'iframe',
                        {
                            style: {
                                border: 'none',
                                height: '100%',
                                width: '100%'
                            }
                        }
                    )
                ]
            )
        ]
    );
    this.oldBodyOverflow = document.body.style.overflow;
    this.oldBodyMargin = document.body.style.margin;
    document.body.style.overflow = 'hidden';
    document.body.style.margin = '0';
    
    if (isNaN(initialSize) || initialSize < 0.1 || initialSize > 0.9) {
        initialSize = 0.3333333;
    }
    if (startWithFixedSize) {
        this.size = initialSize;
        this.lock(startWithFixedSize);
    } else {
        this.setSize(initialSize ? initialSize : 0.3333333);
    }
    
    var child;
    while (doc.body.firstChild) { 
        child = doc.body.firstChild;
        doc.body.removeChild(child);
        this.topElement.appendChild(child);
    }
    this.hidden = false;
    doc.body.appendChild(this.element);
    this.iframe.contentWindow.document.open();
    this.iframe.contentWindow.document.write(LOG.defaultHtml);
    this.iframe.contentWindow.document.close();
    this.doc = this.iframe.contentWindow.document
    if (LOG.isIE) {
        this.doc.body.scroll = "no"; // CSS doesn't always affect the scrollbar
    }
    LOG.addObjEventListener(this, this.resizeHandle, 'mousedown', this.onResizeHandleMousedown);
}

LOG.setTypeName(LOG.BodyWrapper, 'LOG.BodyWrapper');

LOG.BodyWrapper.prototype.uninit = function() {
    var doc = this.ownerDocument;
    doc.body.removeChild(this.element);
    while (this.topElement.firstChild) {
        child = this.topElement.firstChild;
        this.topElement.removeChild(child);
        doc.body.appendChild(child);
    }
    delete this.element;
    delete this.topElement;
    delete this.bottomElement;
    document.body.style.overflow = this.oldBodyOverflow ? this.oldBodyOverflow : '';
    document.body.style.margin = this.oldBodyMargin ? this.oldBodyMargin : '';
    LOG.removeObjEventListener(this, this.resizeHandle, 'mousedown', this.onResizeHandleMousedown);
}

LOG.BodyWrapper.prototype.onDragKeypress = function(event) {
    if (event.keyCode == 27) {
        this.endDrag();
    }
}

LOG.BodyWrapper.prototype.onResizeHandleMousedown = function(event) {
    this.dragging = true;
    this.originalDelta = DOM.getPositionFromEvent(event).y - DOM.getPosition(this.bottomElement).y;
    this.element.style.borderColor = 'black';
    this.draggingElement = LOG.createElement(document, 'div', { style: { width: '100%', borderTop: '1px dotted black', height: 0, position: 'absolute', left: 0 } });
    this.draggingElement.style.top = ((1 - this.size) * 100) + '%';
    document.body.appendChild(this.draggingElement);
    LOG.addObjEventListener(this, document, 'mousemove', this.onMousemove);
    LOG.addObjEventListener(this, document, 'mouseup', this.onMouseup);
    LOG.addObjEventListener(this, document, 'keypress', this.onDragKeypress);
    LOG.addObjEventListener(this, this.doc, 'mousemove', this.onMousemove);
    LOG.addObjEventListener(this, this.doc, 'mouseup', this.onMouseup);
    LOG.addObjEventListener(this, this.doc, 'keypress', this.onDragKeypress);
    if (LOG.isIE) {
        LOG.addObjEventListener(this, document, 'selectstart', this.onSelectstart);
        LOG.addObjEventListener(this, this.doc, 'selectstart', this.onSelectstart);
    }
    this.oldBodyCursor = document.body.style.cursor ? document.body.style.cursor : '';
    document.body.style.cursor = 'n-resize';
    this.doc.body.style.cursor = 'n-resize';
    LOG.stopPropagation(event);
    LOG.preventDefault(event);
}

LOG.BodyWrapper.prototype.endDrag = function() {
    this.dragging = false;
    this.element.style.borderColor = 'gray';
    document.body.removeChild(this.draggingElement);
    delete this.draggingElement;
    document.body.style.cursor = this.oldBodyCursor;
    this.doc.body.style.cursor = '';
    delete this.oldBodyCursor;
    LOG.removeObjEventListener(this, document, 'mousemove', this.onMousemove);
    LOG.removeObjEventListener(this, document, 'mouseup', this.onMouseup);
    LOG.removeObjEventListener(this, document, 'keypress', this.onDragKeypress);
    LOG.removeObjEventListener(this, this.doc, 'mousemove', this.onMousemove);
    LOG.removeObjEventListener(this, this.doc, 'mouseup', this.onMouseup);
    LOG.removeObjEventListener(this, this.doc, 'keypress', this.onDragKeypress);
    if (LOG.isIE) {
        LOG.removeObjEventListener(this, document, 'selectstart', this.onSelectstart);
        LOG.removeObjEventListener(this, this.doc, 'selectstart', this.onSelectstart);
    }
    if (this.ondragend) {
        this.ondragend();
    }
    this.setSize(this.chosenSize);
}

LOG.BodyWrapper.prototype.onSelectstart = function(event) {
    LOG.stopPropagation(event);
    LOG.preventDefault(event);
}

LOG.BodyWrapper.prototype.onMousemove = function(event) {
    if (this.dragging) {
        var top = LOG.getPositionFromEvent(event).y;
        if (LOG.getElementFromEvent(event).ownerDocument == this.doc) {
            top += LOG.getPosition(this.iframe).y;
        }
        top = (top - this.originalDelta) / LOG.getWindowInnerSize(this.ownerDocument).h;
        if (top < 0.1) {
            top = 0.1;
        } else if ( top > 0.9) {
            top = 0.9;
        }
        this.chosenSize = 1 - top;
        this.draggingElement.style.top = ((1 - this.chosenSize) * 100) + '%';
        return false;
    }
}

LOG.BodyWrapper.prototype.onMouseup = function(event) {
    this.endDrag();
}

LOG.BodyWrapper.prototype.getSize = function() {
    return this.size;
}

LOG.BodyWrapper.prototype.setSize = function(size) {
    this.size = size;
    this.topElement.style.bottom = size * 100 + '%';
    this.topElement.style.height = (1 - size) * 100 + '%';
    this.bottomElement.style.top = (1 - size) * 100 + '%';
    this.bottomElement.style.height = size * 100 + '%';
}

LOG.BodyWrapper.prototype.lock = function(fixedSize) {
    this.topElement.style.bottom = '0';
    this.topElement.style.height = '100%';
    this.topElement.style.paddingBottom = fixedSize;
    this.bottomElement.style.top = '';
    this.bottomElement.style.bottom = '0';
    this.bottomElement.style.height = fixedSize;
    this.fixedSize = fixedSize;
}

LOG.BodyWrapper.prototype.unlock = function() {
    this.setSize(this.size);
    this.topElement.style.paddingBottom = '';
    this.bottomElement.style.bottom = '';
    delete this.fixedSize;
}

LOG.BodyWrapper.prototype.hide = function() {
    this.hidden = true;
    if (this.bottomElement) {
        this.bottomElement.style.display = 'none';
        this.topElement.style.height = '100%';
    }
}

LOG.BodyWrapper.prototype.show = function() {
    this.hidden = false;
    if (this.bottomElement) {
        this.bottomElement.style.display = '';
        if (this.fixedSize) {
            this.lock(this.fixedSize);
        } else {
            this.setSize(this.size);
        }
    }
}

LOG.BodyWrapper.prototype.appendChild = function(elementToWrap) {
    this.doc.body.appendChild(elementToWrap);
}

LOG.BodyWrapper.prototype.getBody = function() {
    return this.topElement;
}

LOG.BodyWrapper.prototype.getParentNodeHidingMe = function(node) {
    var parentNode = node.parentNode;
    if (parentNode == this.topElement) {
        return this.ownerDocument.body;
    } else {
        return parentNode;
    }
}

LOG.BodyWrapper.prototype.getChildNodesHidingMe = function(node) {
    if (node == this.ownerDocument.body) {
        return this.topElement.childNodes;
    } else {
        return node.childNodes;
    }
}
