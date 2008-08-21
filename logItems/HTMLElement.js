LOG.HTMLElementLogItem = function(doc, value, stackedMode, alreadyLoggedContainers, dontShowParentLink) {
    this.doc = doc;
    var link;
    var showParentLink;
    
    this.stackedMode = stackedMode;
    this.alreadyLoggedContainers = alreadyLoggedContainers;
    this.dontShowParentLink = dontShowParentLink;
    
    var me = this;
    this.value = value;
    this.onlyTextNodeChildren = true;
    
    var childNodes = this.getChildNodes();
    this.hasChildNodes = childNodes.length > 0;
    for (var i = 0; i < childNodes.length; ++i) {
        if (childNodes[i].nodeName != '#text') {
            this.onlyTextNodeChildren = false;
            break;
        }
    }
    this.showChildNodes = false;
    this.element = LOG.createElement(this.doc, 'span',
        {
            style: {
                color: '#00e'
            }
        },
        [
            this.showChildNodesLink = LOG.createElement(this.doc, 'a',
                {
                    style: {
                        textDecoration: 'none',
                        color: 'black',
                        fontWeight: 'bold',
                        cursor: 'pointer'
                    },
                    onmouseover: function() {
                        me.showChildNodesLink.style.textDecoration = 'underline';
                        me.showChildNodesLink.style.color = 'red';
                    },
                    onmouseout: function() {
                        me.showChildNodesLink.style.textDecoration = 'none';
                        me.showChildNodesLink.style.color = 'black';
                    },
                    onclick: LOG.createEventHandler(this.doc, this, 'onShowChildNodesLinkClick'),
                    title: 'Toggle show child nodes'
                },
                [
                    this.hasChildNodes ?
                        (this.showChildNodes ? '-' : '+') :
                        '\u00A0'
                ]
            ),
            '<',
            link = LOG.createElement(this.doc, 'a',
                {
                    style: {
                        textDecoration: 'none',
                        color: '#00e'
                    },
                    onmouseover: function() {
                        link.style.textDecoration = 'underline';
                        me.showElementOutline();
                    },
                    onmouseout: function() {
                        link.style.textDecoration = 'none';
                        me.hideElementOutline();
                    },
                    onclick: LOG.createEventHandler(this.doc, this, 'onTagNameLinkClick'),
                    href: '#'
                },
                [
                    value.tagName.toLowerCase()
                ]
            ),
            LOG.getGetPositionInVariablesElement(this.doc, value),
            (!dontShowParentLink ? showParentLink = LOG.createElement(this.doc, 'a',
                {
                    style: {
                        textDecoration: 'none',
                        color: 'gray'
                    },
                    onmouseover: function() {
                        showParentLink.style.textDecoration = 'underline';
                        showParentLink.style.color = 'red';
                    },
                    onmouseout: function() {
                        showParentLink.style.textDecoration = 'none';
                        showParentLink.style.color = 'gray';
                    },
                    onclick: LOG.createEventHandler(this.doc, this, 'onShowParentLinkClick'),
                    title: 'Show parent node'
                },
                ['\u21A5']
            ) : null),
            this.propertiesContainer = LOG.createElement(this.doc, 'span'),
            this.startTagEnd = this.doc.createTextNode(this.showChildNodes ? '>' : '/>'),
            this.withChildNodesEnd = LOG.createElement(this.doc, 'span',
                {
                    style: {
                        display: this.showChildNodes ? null :  'none'
                    }
                },
                [
                    this.childNodesContainer = LOG.createElement(this.doc, 'span'),
                    this.endTag = LOG.createElement(this.doc, 'span',
                        {
                            onmouseover: function() {
                                link.style.textDecoration = 'underline';
                                me.showElementOutline();
                            },
                            onmouseout: function() {
                                link.style.textDecoration = 'none';
                                me.hideElementOutline();
                            }
                        },
                        [
                            '\u00A0</' + value.tagName.toLowerCase() + '>'
                        ]
                    )
                ]
            )
        ]
    )
    
    for (var i = 0; i < value.attributes.length; ++i) {
        if (value.attributes[i].specified) {
            this.propertiesContainer.appendChild(this.doc.createTextNode(' '));
            this.propertiesContainer.appendChild(
                LOG.createElement(this.doc, 'span',
                    { style: {color: '#036' } },
                    [ value.attributes[i].name + '=' ]
                )
            );
            this.propertiesContainer.appendChild(
                LOG.createElement(this.doc, 'span',
                    { style: { color: '#630' } },
                    [ '"' + value.attributes[i].value.replace(/"/, '"') + '"' ]
                )
            );
        }
    }
    if (this.hasChildNodes && this.value.nodeName.toLowerCase() != 'script' && this.value.nodeName.toLowerCase() != 'style' && this.onlyTextNodeChildren) {
        this.setShowChildNodes(true);
    }
}

LOG.setTypeName(LOG.HTMLElementLogItem, 'LOG.HTMLElementLogItem');

LOG.HTMLElementLogItem.prototype.onShowParentLinkClick = function(event) {
    this.showParent();
    LOG.stopPropagation(event);
    LOG.preventDefault(event);
}

LOG.HTMLElementLogItem.prototype.onTagNameLinkClick = function(event) {
    LogAndStore(this.value);
    LOG.stopPropagation(event);
    LOG.preventDefault(event);
}

LOG.HTMLElementLogItem.prototype.onShowChildNodesLinkClick = function(event) {
    this.toggleShowChildNodes(event.ctrlKey);
    LOG.stopPropagation(event);
    LOG.preventDefault(event);
}

LOG.HTMLElementLogItem.prototype.expandChild = function(pathToChild) {
    if (pathToChild.length > 0) {
        if (!this.showChildNodes) {
            this.setShowChildNodes(true, false);
        }
        var i = pathToChild.shift();
        if (this.childNodeItems[i] && this.childNodeItems[i].expandChild) {
            return this.childNodeItems[i].expandChild(pathToChild);
        } else {
            Log('expanding something which is not an htmlelementlogitem');
        }
    } else {
        return this;
    }
}

LOG.HTMLElementLogItem.prototype.showElementOutline = function() {
    this.outlineElement = LOG.createOutlineFromElement(this.value);
}

LOG.HTMLElementLogItem.prototype.hideElementOutline = function() {
    if (this.outlineElement) {
        this.outlineElement.parentNode.removeChild(this.outlineElement);
        delete this.outlineElement;
    }
}

LOG.HTMLElementLogItem.prototype.getChildNodes = function() {
    if (LOG.logRunner) { // Hide LOG's wrapper elements in the DOM
        return LOG.logRunner.getChildNodesHidingContainer(this.value);
    } else {
        return this.value.childNodes;
    }
}

LOG.HTMLElementLogItem.prototype.showParent = function() {
    Log(this.value.parentNode);
}

LOG.HTMLElementLogItem.prototype.toggleShowChildNodes = function(applyToChildNodes) {
    this.setShowChildNodes(!this.showChildNodes, applyToChildNodes);
}

LOG.HTMLElementLogItem.prototype.setShowChildNodes = function(show, applyToChildNodes) {
    if (show == this.showChildNodes) {
        return;
    }
    this.showChildNodes = show;
    while (this.childNodesContainer.firstChild) {
        this.childNodesContainer.removeChild(this.childNodesContainer.firstChild);
    }
    this.withChildNodesEnd.style.display = show ? '' : 'none';
    this.showChildNodesLink.firstChild.nodeValue = show ? '-' : '+';
    this.startTagEnd.nodeValue = show ? '>' : '/>';
    if (show) {
        if (!this.onlyTextNodeChildren) {
            this.childNodesContainer.style.display = 'block';
            this.childNodesContainer.style.marginLeft = '1em';
        }
        var childNodeLogItem;
        var childNode;
        var childNodes = this.getChildNodes();
        this.childNodeItems = [];
        for (var i = 0; i < childNodes.length; ++i) {
            childNode = childNodes[i];
            if (childNode.nodeType == 1) {
                childNodeLogItem = new LOG.HTMLElementLogItem(this.doc, childNode, this.stackedMode, this.alreadyLoggedContainers, true);
                if (applyToChildNodes) {
                    childNodeLogItem.setShowChildNodes(true, true);
                }
            } else if (childNode.nodeName == '#text') {
                childNodeLogItem = {
                    element: LOG.createElement(this.doc, 'span', { style: { color: '#999' } },
                        [
                            LOG.isWhitespace(childNode.nodeValue) ? ' ' : ('\u00A0' + childNode.nodeValue)
                        ]
                    )
                };
            } else if (childNode.nodeName == '#comment') {
                childNodeLogItem = {
                    element: LOG.createElement(this.doc, 'span', { style: { color: '#bc7' } }, [ '<!--' + childNode.nodeValue + '-->' ] )
                };
            } else {
                childNodeLogItem = LOG.getValueAsLogItem(this.doc, childNode);
            }
            
            this.childNodeItems.push(childNodeLogItem);
            if (!this.onlyTextNodeChildren) {
                childNodeLogItem.element.style.display = 'block';
            }
            this.childNodesContainer.appendChild(childNodeLogItem.element);
        }
        
    } else {
        this.childNodesContainer.style.display = 'inline';
        this.childNodesContainer.style.marginLeft = '0';
    }
}