LOG.LogPanel = function(doc, name, selected) {
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
                    this.contentElement = LOG.createElement(doc, 'div',
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
}

LOG.setTypeName(LOG.LogPanel, 'LOG.LogPanel');

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
}

LOG.LogPanel.prototype.setChanged = function(changed) {
    this.labelElement.style.color = changed ? 'red' : '';
}
