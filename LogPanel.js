LOG.LogPanel = function(doc, name, selected, content) {
    this.labelElement = LOG.createElement(doc, 'span',
        {
            style: {
                cursor: 'pointer'
            },
            onclick: LOG.createEventHandler(doc, this, 'onLabelClick')
        },
        [ name ]
    );
    
    this.panelElement = LOG.createElement(doc, 'td',
        {
            style: {
                width: '1%',
                height: '100%',
                borderLeft: '1px solid gray',
                display: selected ? '' : 'none'
            }
        },
        [
            LOG.createElement(doc, 'div',
                {
                    style: {
                        height: '100%',
                        width: '100%',
                        position: 'relative'
                    }
                },
                [
                    this.contentElementContainer = LOG.createElement(doc, 'div',
                        {
                            style: {
                                left: '0',
                                top: '0',
                                width: '100%',
                                height: '100%',
                                overflow: 'auto',
                                position: 'absolute',
                                borderTop: '1px solid #ccc',
                                borderBottom: '1px solid #ccc',
                                backgroundColor: 'white',
                                fontSize: '10px',
                                padding: '5px',
                                fontWeight: 'normal',
                                backgroundColor: '#fcfcfc',
                                MozBoxSizing: 'border-box',
                                boxSizing: 'border-box',
                                fontFamily: 'terminus, lucida console, monospace'
                            }
                        }
                    )
                ]
            )
        ]
    );
    
    this.setSelected(selected);
    if (content) {
        this.setContent(content);
    }
}

LOG.setTypeName(LOG.LogPanel, 'LOG.LogPanel');

LOG.LogPanel.prototype.setContent = function(content) {
    if (this.contentElementContainer.firstChild) {
        this.contentElementContainer.removeChild(this.contentElementContainer.firstChild);
    }
    this.contentElementContainer.appendChild(content.element);
    this.content = content;
}

LOG.LogPanel.prototype.onLabelClick = function(selected) {
    this.setSelected(!this.selected);
}

LOG.LogPanel.prototype.getSelected = function() {
    return this.selected;
}

LOG.LogPanel.prototype.setSelected = function(selected) {
    if (selected) {
        this.labelElement.style.textDecoration = 'underline';
        this.labelElement.style.fontWeight = 'bold';
        this.panelElement.style.display = '';
        if (this.onselect) {
            this.onselect();
        }
        this.setChanged(false);
    } else {
        this.labelElement.style.textDecoration = '';
        this.labelElement.style.fontWeight = '';
        this.panelElement.style.display = 'none';
    }
    this.selected = selected;
    if (this.content && this.content.setSelected) {
        this.content.setSelected(selected);
    }
}

LOG.LogPanel.prototype.setChanged = function(changed) {
    this.labelElement.style.color = changed ? 'red' : '';
}


LOG.LogPanel.prototype.scrollElementIntoView = function(element) {
    var containerPos = LOG.getPosition(this.panelElement);
    var elementPos = LOG.getPosition(element);
    var containerY0 = containerPos.y;
    var containerY1 = containerY0 + this.panelElement.offsetHeight;
    var y0 = elementPos.y;
    var y1 = y0 + element.offsetHeight;
    if (y0 < containerY0 || y1 > containerY1) {
        var scrollToTop = y0 + this.contentElementContainer.scrollTop - containerY0;
        var scrollToCenter = scrollToTop - this.panelElement.offsetHeight / 2 - element.offsetHeight / 2;
        if (scrollToCenter < 0) {
            scrollToCenter = 0;
        }
        this.contentElementContainer.scrollTop = scrollToCenter;
    }
    var containerX0 = containerPos.x;
    var containerX1 = containerX0 + this.panelElement.offsetWidth;
    var x0 = elementPos.x;
    var x1 = x0 + element.offsetWidth;
    if (x0 < containerX0 || x1 > containerX1) {
        this.contentElementContainer.scrollLeft = x0 + this.contentElementContainer.scrollLeft - containerX0;
    }
}

