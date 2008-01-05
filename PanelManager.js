LOG.Class('PanelManager');

LOG.PanelManager.prototype.init = function(doc, rightToolbarElement) {
    this.doc = doc;
    this.element = LOG.createElement(
        this.doc, 'div',
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
            this.scrollContainer = LOG.createElement(this.doc, 'div',
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
            ),
            LOG.createElement(this.doc, 'div', // toolbar container
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
            )
        ]
    );
}

LOG.PanelManager.prototype.add = function(logPanel) {
    if (this.panelLabels.childNodes.length > 0) {
        this.panelLabels.appendChild(this.doc.createTextNode(', '));
    }
    this.panelLabels.appendChild(logPanel.labelElement);
    this.panelElements.appendChild(logPanel.panelElement);
    logPanel.contentElement.appendChild(contents);
    return logPanel;
}
