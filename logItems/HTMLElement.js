if (typeof LOG.HTMLElementLogItem == 'undefined') {
    LOG.HTMLElementLogItem = function() {
    }
}

LOG.HTMLElementLogItem.prototype.init = function(value, stackedMode, alreadyLoggedContainers, dontShowParentLink) {
    var doc = LOG.LogObject.ownerDocument;
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
    this.element = LOG.createElement(doc, 'span',
        {
            style: {
                color: '#00e'
            }
        },
        [
            this.showChildNodesLink = LOG.createElement(doc, 'a',
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
                    onclick: function(event) {
                        if (!event) {
                            event = LOG.LogObject.getWindow().event;
                        }
                        me.toggleShowChildNodes(event.ctrlKey);
                        LOG.stopPropagation(event);
                        LOG.preventDefault(event);
                    },
                    title: 'Toggle show child nodes'
                },
                [
                    this.hasChildNodes ?
                        (this.showChildNodes ? '-' : '+') :
                        '\u00A0'
                ]
            ),
            '<',
            link = LOG.createElement(doc, 'a',
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
                    onclick: function(event) {
                        if (!event) {
                            event = LOG.LogObject.getWindow().event;
                        }
                        LOG.LogObject.logAndStore(value);
                        LOG.stopPropagation(event);
                        LOG.preventDefault(event);
                    },
                    href: '#'
                },
                [
                    value.tagName.toLowerCase()
                ]
            ),
            LOG.getGetPositionInVariablesElement(value),
            (!dontShowParentLink ? showParentLink = LOG.createElement(doc, 'a',
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
                    onclick: function(event) {
                        if (!event) {
                            event = LOG.LogObject.getWindow().event;
                        }
                        me.showParent();
                        LOG.stopPropagation(event);
                        LOG.preventDefault(event);
                    },
                    title: 'Show parent node'
                },
                ['\u21A5']
            ) : null),
            this.propertiesContainer = LOG.createElement(doc, 'span'),
            this.startTagEnd = doc.createTextNode(this.showChildNodes ? '>' : '/>'),
            this.withChildNodesEnd = LOG.createElement(doc, 'span',
                {
                    style: {
                        display: this.showChildNodes ? null :  'none'
                    }
                },
                [
                    this.childNodesContainer = LOG.createElement(doc, 'span'),
                    this.endTag = LOG.createElement(doc, 'span',
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
            this.propertiesContainer.appendChild(doc.createTextNode(' '));
            this.propertiesContainer.appendChild(
                LOG.createElement(doc, 'span',
                    { style: {color: '#036' } },
                    [ value.attributes[i].name + '=' ]
                )
            );
            this.propertiesContainer.appendChild(
                LOG.createElement(doc, 'span',
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

LOG.HTMLElementLogItem.prototype.focusChild = function(pathToChild) {
    if (pathToChild.length == 0) {
        LOG.focusAndBlinkElement(this.element);
    } else {
        if (!this.showChildNodes) {
            this.setShowChildNodes(true, false);
        }
        var i = pathToChild.shift();
        if (this.childNodeItems[i].focusChild) {
            this.childNodeItems[i].focusChild(pathToChild);
        } else {
            Log('focus something which is not an htmlelementlogitem');
        }
    }
}

LOG.HTMLElementLogItem.prototype.showElementOutline = function() {
    this.outlineElement = LOG.createOutlineFromElement(this.value);
}

LOG.HTMLElementLogItem.prototype.hideElementOutline = function() {
    this.outlineElement.parentNode.removeChild(this.outlineElement);
    delete this.outlineElement;
}

LOG.HTMLElementLogItem.prototype.getChildNodes = function() {
    if (LOG.LogObject.wrapperElement && this.value == document.body) { // Hide LOG's wrapper elements in the DOM
        return LOG.LogObject.wrapperTopElement.childNodes;
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
    var childNodeLogItem;
    var doc = LOG.LogObject.ownerDocument;
    if (show) {
        if (!this.onlyTextNodeChildren) {
            this.childNodesContainer.style.display = 'block';
            this.childNodesContainer.style.marginLeft = '1em';
        }
        var childNode;
        var childNodeToAppend;
        var childNodes = this.getChildNodes();
        this.childNodeItems = [];
        for (var i = 0; i < childNodes.length; ++i) {
            childNode = childNodes[i];
            if (childNode.nodeType == 1) {
                childNodeLogItem = new LOG.HTMLElementLogItem;
                childNodeLogItem.init(childNode, this.stackedMode, this.alreadyLoggedContainers, true);
                childNodeToAppend = childNodeLogItem.element;
                if (applyToChildNodes) {
                    childNodeLogItem.setShowChildNodes(true, true);
                }
                this.childNodeItems[i] = childNodeLogItem;
            } else if (childNode.nodeName == '#text') {
                childNodeToAppend = LOG.createElement(doc, 'span', { style: { color: 'gray' } }, [ '\u00A0' + childNode.nodeValue ] );
                this.childNodeItems[i] = childNodeToAppend;
            } else {
                childNodeToAppend = LOG.getValueAsLogItem(childNode).element;
                this.childNodeItems[i] = childNodeToAppend;
            }
            if (!this.onlyTextNodeChildren) {
                childNodeToAppend.style.display = 'block';
            }
            this.childNodesContainer.appendChild(childNodeToAppend);
        }
        
    } else {
        this.childNodesContainer.style.display = 'inline';
        this.childNodesContainer.style.marginLeft = '0';
    }
}