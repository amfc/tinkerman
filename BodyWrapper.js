LOG.Class('BodyWrapper');

LOG.BodyWrapper.prototype.init = function(ownerDocument, elementToWrap, initialSize) {
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
                    elementToWrap
                ]
            )
        ]
    );
    this.oldBodyOverflow = document.body.style.overflow;
    this.oldBodyMargin = document.body.style.margin;
    document.body.style.overflow = 'hidden';
    document.body.style.margin = '0';
    
    this.setSize(initialSize ? initialSize : 0.3333333);
    
    var child;
    while (doc.body.firstChild) {
        child = doc.body.firstChild;
        doc.body.removeChild(child);
        this.topElement.appendChild(child);
    }
    doc.body.appendChild(this.element);
    
    LOG.addObjEventListener(this, this.resizeHandle, 'mousedown', this.onResizeHandleMousedown);
}

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
    this.originalDelta = event.clientY - this.bottomElement.offsetTop;
    this.element.style.borderColor = 'black';
    LOG.addObjEventListener(this, document, 'mousemove', this.onMousemove);
    LOG.addObjEventListener(this, document, 'mouseup', this.onMouseup);
    LOG.addObjEventListener(this, document, 'keypress', this.onDragKeypress);
    if (LOG.isIE) {
        LOG.addObjEventListener(this, document, 'selectstart', this.onSelectstart);
    }
    LOG.stopPropagation(event);
    LOG.preventDefault(event);
}

LOG.BodyWrapper.prototype.endDrag = function() {
    this.dragging = false;
    this.element.style.borderColor = 'gray';
    LOG.removeObjEventListener(this, document, 'mousemove', this.onMousemove);
    LOG.removeObjEventListener(this, document, 'mouseup', this.onMouseup);
    LOG.removeObjEventListener(this, document, 'keypress', this.onDragKeypress);
    if (LOG.isIE) {
        LOG.removeObjEventListener(this, document, 'selectstart', this.onSelectstart);
    }
}

LOG.BodyWrapper.prototype.onSelectstart = function(event) {
    LOG.stopPropagation(event);
    LOG.preventDefault(event);
}

LOG.BodyWrapper.prototype.onMousemove = function(event) {
    if (this.dragging) {
        var top = (event.clientY - this.originalDelta) / LOG.getWindowInnerSize(this.ownerDocument).h;
        if (top < 0) {
            top = 0;
        }
        this.setSize(1 - top);
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

LOG.BodyWrapper.prototype.hide = function() {
    if (this.bottomElement) {
        this.bottomElement.style.display = 'none';
        this.topElement.style.height = '100%';
    }
}

LOG.BodyWrapper.prototype.show = function() {
    if (this.bottomElement) {
        this.bottomElement.style.display = '';
        this.setSize(this.size);
    }
}
