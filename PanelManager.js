LOG.Class('PanelManager');

LOG.PanelManager.prototype.init = function(ownerDocument, rightToolbarElement) {
    var doc = ownerDocument;
    
    this.element = LOG.createElement(
        doc, 'div',
        {
            style: {
                borderTop: '1px solid gray',
                backgroundColor: 'white',
                color: 'gray',
                position: 'relative',
                height: '100%',
                width: '100%',
                overflow: 'hidden',
                MozBoxSizing: 'border-box'
            }
        },
        [
            this.scrollContainer = LOG.createElement(doc, 'div',
                {
                    style: {
                        position: 'absolute',
                        width: '100%',
                        height: LOG.isIE ? '100%' : null,
                        top: 0,
                        left: 0,
                        bottom: '0',
                        paddingTop: '1.8em'
                    }
                },
                [
                    LOG.createElement(doc, 'table',
                        {
                            style: {
                                width: '100%',
                                height: '100%'
                            },
                            cellPadding: '0',
                            cellSpacing: '0'
                        },
                        [
                            LOG.createElement(doc, 'tbody', {},
                                [
                                    this.panelElements = LOG.createElement(doc, 'tr')
                                ]
                            )
                        ]
                    )
                ]
            ),
            LOG.createElement(doc, 'div', // toolbar container
                {
                    style: {
                        height: '1.8em',
                        position: 'absolute',
                        top: 0,
                        left: 0,
                        right: 0,
                        MozBoxSizing: 'border-box',
                        overflow: 'hidden',
                        fontFamily: 'terminus, lucida console, monospace',
                        backgroundColor: '#f0f0f0'
                    }
                },
                [
                    LOG.createElement(doc, 'div', // toolbar
                        {
                            style: {
                                padding: '0.1em',
                                width: '100%'
                            }
                        },
                        [
                            this.panelLabels = LOG.createElement(doc, 'span'),
                            rightToolbarElement
                        ]
                    )
                ]
            )
        ]
    );
}

LOG.PanelManager.prototype.add = function(name, contents) {
    var doc = this.ownerDocument;
    var logPanel = new LOG.LogPanel;
    logPanel.init(name, false);
    if (this.panelLabels.childNodes.length > 0) {
        this.panelLabels.appendChild(doc.createTextNode(', '));
    }
    this.panelLabels.appendChild(logPanel.labelElement);
    this.panelElements.appendChild(logPanel.panelElement);
    this.contentElement.appendChild(contents);
    return logPanel;
}
