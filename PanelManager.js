LOG.Class('PanelManager');

LOG.PanelManager.prototype.init = function(doc, rightToolbarElement) {
    this.doc = doc;
    var box = new LOG.Vbox;
    box.init(doc);
    this.element = box.element;
    this.scrollContainer = LOG.createElement(this.doc, 'div',
        {
            style: {
                width: '100%',
                height: '100%'
            }
        },
        [
            LOG.createElement(this.doc, 'table',
                {
                    style: {
                        width: '100%',
                        height: '100%'
                    },
                    cellPadding: '0',
                    cellSpacing: '0'
                },
                [
                    LOG.createElement(this.doc, 'tbody', {},
                        [
                            this.panelElements = LOG.createElement(this.doc, 'tr')
                        ]
                    )
                ]
            )
        ]
    );
    this.toolbarContainer = LOG.createElement(this.doc, 'div', // toolbar container
        {
            style: {
                fontFamily: 'terminus, lucida console, monospace',
                backgroundColor: '#f0f0f0',
                height: '100%'
            }
        },
        [
            LOG.createElement(this.doc, 'div', // toolbar
                {
                    style: {
                        padding: '0.1em',
                        width: '100%'
                    }
                },
                [
                    this.panelLabels = LOG.createElement(this.doc, 'span'),
                    rightToolbarElement
                ]
            )
        ]
    );
    
    box.add(this.toolbarContainer, { size: 1.3, sizeUnit: 'em' });
    box.add(this.scrollContainer, { size: 100, sizeUnit: '%' });
}

LOG.PanelManager.prototype.add = function(logPanel) {
    if (this.panelLabels.childNodes.length > 0) {
        this.panelLabels.appendChild(this.doc.createTextNode(', '));
    }
    this.panelLabels.appendChild(logPanel.labelElement);
    this.panelElements.appendChild(logPanel.panelElement);
    return logPanel;
}
