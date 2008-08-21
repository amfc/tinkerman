LOG.PanelManager = function(doc, rightToolbarElement) {
    this.doc = doc;
    this.box = new LOG.Vbox(doc);
    this.element = this.box.element;
    this.panels = [];
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
                    cellPadding: 0,
                    cellSpacing: 0
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
                    LOG.createElement(this.doc, 'span', { style: { cssFloat: 'right', styleFloat: 'right' } }, [ rightToolbarElement ]),
                    this.panelLabels = LOG.createElement(this.doc, 'span')
                ]
            )
        ]
    );
    
    this.box.add(this.toolbarContainer, { size: 1.3, sizeUnit: 'em' });
    this.box.add(this.scrollContainer, { size: 100, sizeUnit: '%' });
}

LOG.setTypeName(LOG.PanelManager, 'LOG.PanelManager');

LOG.PanelManager.prototype.setBodyHidden = function(hidden) {
    this.box.setChildHidden(1, hidden);
}

LOG.PanelManager.prototype.onPanelSelectChange = function(logPanel, selected) {
    var visiblePanels = 0;
    for (var i = 0; i < this.panels.length; ++i) {
        if (this.panels[i].getSelected()) {
            ++visiblePanels;
        }
    }
    for (var i = 0; i < this.panels.length; ++i) {
        if (this.panels[i].getSelected()) {
            this.panels[i].setWidth((100 / visiblePanels) + '%');
        }
    }
}

LOG.PanelManager.prototype.onPanelLabelClick = function(logPanel, selected) {
    if (this.onpanellabelclick) {
        return this.onpanellabelclick(logPanel, selected);
    }
}

LOG.PanelManager.prototype.remove = function(logPanel) { // FIXME: remove the extra space between panels
    var index = LOG.indexOf(this.panels, logPanel);
    this.panels.splice(index, 1);
    this.panelLabels.removeChild(logPanel.labelElement);
    this.panelElements.removeChild(logPanel.panelElement);
}

LOG.PanelManager.prototype.add = function(logPanel) {
    if (this.panelLabels.childNodes.length > 0) {
        this.panelLabels.appendChild(this.doc.createTextNode(' '));
    }
    var me = this;
    logPanel.onlabelclick = function(selected) { return me.onPanelLabelClick(logPanel, selected); }
    logPanel.onselectchange = function(selected) { return me.onPanelSelectChange(logPanel, selected); }
    this.panelLabels.appendChild(logPanel.labelElement);
    this.panelElements.appendChild(logPanel.panelElement);
    this.panels.push(logPanel);
    return logPanel;
}
