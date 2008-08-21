LOG.ObjectLogItem = function(doc, value, stackedMode, alreadyLoggedContainers, showChildren, showToggleChildrenLink) {
    if (typeof alreadyLoggedContainers == 'undefined') {
        alreadyLoggedContainers = [];
    }
    if (typeof showChildren == 'undefined') {
        showChildren = false;
    }
    if (typeof showToggleChildrenLink == 'undefined') {
        showToggleChildrenLink = true;
    }
    
    this.doc = doc;
    
    this.stackedMode = stackedMode;
    this.alreadyLoggedContainers = alreadyLoggedContainers;
    alreadyLoggedContainers.push(value);
    
    this.value = value;
    
    var endSpan;
    
    function highlightCurlyBraces() {
        me.startObjectLink.style.textDecoration = 'underline';
        me.startObjectLink.style.color = 'red';
        me.startObjectLink.style.backgroundColor = 'yellow';
        endSpan.style.textDecoration = 'underline';
        endSpan.style.color = 'red';
        endSpan.style.backgroundColor = 'yellow';
    }
    
    function endHighlightCurlyBraces() {
        me.startObjectLink.style.textDecoration = 'none';
        me.startObjectLink.style.color = 'black';
        me.startObjectLink.style.backgroundColor = '';
        endSpan.style.textDecoration = 'none';
        endSpan.style.color = '';
        endSpan.style.backgroundColor = '';
    }
    
    this.element = LOG.createElement(doc, 'span',
        {},
        [
            LOG.getGetPositionInVariablesElement(doc, value),
            showToggleChildrenLink ? this.toggleChildrenLink = LOG.createElement(doc, 'a',
                {
                    style: {
                        textDecoration: 'none',
                        color: 'black'
                    },
                    href: '#',
                    onmouseover: function() {
                        me.toggleChildrenLink.style.textDecoration = 'underline';
                        me.toggleChildrenLink.style.color = 'red';
                    },
                    onmouseout: function() {
                        me.toggleChildrenLink.style.textDecoration = 'none';
                        me.toggleChildrenLink.style.color = 'black';
                    },
                    onclick: LOG.createEventHandler(doc, this, 'onElementClick')
                },
                [ showChildren ? '-' : '+' ]
            ) : null,
            this.startObjectLink = LOG.createElement(doc, 'a',
                {
                    style: {
                        textDecoration: 'none',
                        color: 'black'
                    },
                    href: '#',
                    onmouseover: function() {
                        highlightCurlyBraces();
                    },
                    onmouseout: function() {
                        endHighlightCurlyBraces();
                    },
                    onclick: LOG.createEventHandler(doc, this, 'onStartObjectLinkClick')
                },
                [ '{' ]
            ),
            this.updateLink = LOG.createElement(doc, 'a',
                {
                    style: {
                        textDecoration: 'none',
                        color: 'black',
                        display: 'none'
                    },
                    href: '#',
                    onmouseover: function() {
                        me.updateLink.style.textDecoration = 'underline';
                        me.updateLink.style.color = 'red';
                    },
                    onmouseout: function() {
                        me.updateLink.style.textDecoration = 'none';
                        me.updateLink.style.color = 'black';
                    },
                    onclick: LOG.createEventHandler(doc, this, 'onUpdateLinkClick')
                },
                [ '\u21ba' ]
            ),
            this.stackedToggleLink = LOG.createElement(doc, 'a',
                {
                    style: {
                        textDecoration: 'none',
                        color: 'green',
                        fontSize: '8pt',
                        display: 'none'
                    },
                    href: '#',
                    onmouseover: function() {
                        me.stackedToggleLink.style.textDecoration = 'underline';
                    },
                    onmouseout: function() {
                        me.stackedToggleLink.style.textDecoration = 'none';
                    },
                    onclick: function(event) {
                        if (!event) {
                            event = doc.parentWindow.event;
                        }
                        LOG.preventDefault(event);
                        LOG.stopPropagation(event);
                        me.toggleStackedMode(event.ctrlKey);
                    }
                },
                [ '\u25ba' ]
            ),
            this.toggleMethodsLink = LOG.createElement(doc, 'a',
                {
                    style: {
                        textDecoration: 'none',
                        color: '#a3f',
                        fontSize: '8pt',
                        display: 'none'
                    },
                    href: '#',
                    onmouseover: function() {
                        me.toggleMethodsLink.style.textDecoration = 'underline';
                        me.toggleMethodsLink.style.color = '#660';
                    },
                    onmouseout: function() {
                        me.toggleMethodsLink.style.textDecoration = 'none';
                        me.toggleMethodsLink.style.color = '#a3f';
                    },
                    onclick: function(event) {
                        if (!event) {
                            event = doc.parentWindow.event;
                        }
                        LOG.preventDefault(event);
                        LOG.stopPropagation(event);
                        me.toggleMethodsVisible();
                    }
                },
                [ '+' ]
            ),
            this.propertiesSpan = LOG.createElement(doc, 'span', { style: { display: 'none' } }),
            this.ellipsisSpan = LOG.createElement(doc, 'span', {}, [ '...' ]),
            endSpan = LOG.createElement(doc, 'span',
                {
                    onmouseover: function() {
                        highlightCurlyBraces();
                    },
                    onmouseout: function() {
                        endHighlightCurlyBraces();
                    }
                },
                [ '}' ]
            )
        ]
    );
    
    this.autoUpdateInterval = null;
    this.currentStackedMode = false;
    this.properties = {};
    this.methodsVisible = false;
    var me = this;
    this.setStackedMode(this.stackedMode);
    this.showingChildren = false;
    this.setShowChildren(showChildren);
}

LOG.setTypeName(LOG.ObjectLogItem, 'LOG.ObjectLogItem');

LOG.ObjectLogItem.prototype.onUpdateLinkClick = function(event) {
    LOG.preventDefault(event);
    LOG.stopPropagation(event);
    this.toggleAutoUpdate();
}

LOG.ObjectLogItem.prototype.onStartObjectLinkClick = function(event) {
    LOG.preventDefault(event);
    LOG.stopPropagation(event);
    LogAndStore(this.value);
}

LOG.ObjectLogItem.prototype.onElementClick = function(event) {
    LOG.preventDefault(event);
    LOG.stopPropagation(event);
    this.toggleShowChildren(event.ctrlKey);
}

LOG.ObjectLogItem.prototype.setShowChildren = function(showChildren, applyToChildren) {
    if (this.showingChildren == showChildren) {
        return;
    }
    this.showingChildren = showChildren;
    
    this.propertiesSpan.style.display = showChildren ? '' : 'none';
    this.ellipsisSpan.firstChild.nodeValue = showChildren ? ' ' : '...';
    this.updateLink.style.display = showChildren ? '' : 'none';
    this.stackedToggleLink.style.display = showChildren ? '' : 'none';
    this.toggleMethodsLink.style.display = showChildren ? '' : 'none';
    
    if (this.toggleChildrenLink) {
        this.toggleChildrenLink.firstChild.nodeValue = showChildren ? '-' : '+';
    }
    
    if (showChildren) {
        this.lastVisibleProperty = null; // the one which shouldn't have a coma
        
        this.oldValue = LOG.shallowClone(this.value);
        
        this.keys = LOG.getObjectProperties(this.value);
        this.keys.sort();
        
        var key;
        this.someMethodExists = false;
        for (var i = 0; i < this.keys.length; ++i) {
            key = this.keys[i];
            this.createProperty(key);
            this.propertiesSpan.appendChild(this.properties[key].element);
            if (typeof this.value[key] == 'function') {
                this.someMethodExists = true;
            }
            if (!this.methodsVisible && typeof this.value[key] == 'function') {
                this.properties[key].element.style.display = 'none';
            } else {
                this.lastVisibleProperty = this.properties[key]; // always the last one
            }
            this.setPropertyStackMode(key);
            if (applyToChildren) {
                if (this.properties[key].logItem.setShowChildren) {
                    this.properties[key].logItem.setShowChildren(true, true);
                }
            }
        }
        if (!this.someMethodExists) {
            this.toggleMethodsLink.style.display = 'none';
        }
        
        if (this.lastVisibleProperty) {
            this.lastVisibleProperty.commaSpan.style.display = 'none';
        }
        if (this.wasAutoUpdating) {
            this.setAutoUpdate(true);
        }
    } else {
        this.wasAutoUpdating = !!this.autoUpdateInterval;
        this.setAutoUpdate(false);
        for (var key in this.properties) {
            if (this.properties[key].logItem.onRemove) {
                this.properties[key].logItem.onRemove();
            }
            this.properties[key].element.parentNode.removeChild(this.properties[key].element);
        }
        this.properties = {};
    }
}

LOG.ObjectLogItem.prototype.getShowChildren = function() {
    return this.showingChildren;
}

LOG.ObjectLogItem.prototype.toggleShowChildren = function(applyToChildren) {
    this.setShowChildren(!this.showingChildren, applyToChildren);
}

LOG.ObjectLogItem.prototype.createProperty = function(key) {
    var itemSpan, span, propertyValueElement;
    itemSpan = this.doc.createElement('span');
    span = this.doc.createElement('span');
    span.appendChild(this.doc.createTextNode(key));
    span.style.color = '#930';
    itemSpan.appendChild(span);
    itemSpan.appendChild(this.doc.createTextNode(': '));
    propertyValueElement = this.doc.createElement('span');
    var logItem = LOG.getValueAsLogItem(this.doc, this.value[key], this.stackedMode, this.alreadyLoggedContainers)
    propertyValueElement.appendChild(logItem.element);
    itemSpan.appendChild(propertyValueElement);
    var commaSpan = this.doc.createElement('span')
    commaSpan.appendChild(this.doc.createTextNode(', '));
    itemSpan.appendChild(commaSpan);
    this.properties[key] = {
        element: itemSpan,
        labelElement: span,
        propertyValueElement: propertyValueElement,
        commaSpan: commaSpan,
        logItem: logItem
    };
}

LOG.ObjectLogItem.prototype.updateAndMarkDifferences = function() {
    var me = this;
    function blinkProperty(key) {
        if (me.properties[key].blinkTimeout) {
            clearTimeout(me.properties[key].blinkTimeout);
        }
        me.properties[key].propertyValueElement.style.backgroundColor = 'yellow';
        me.properties[key].labelElement.style.backgroundColor = 'yellow';
        me.properties[key].blinkTimeout = setTimeout(
            function() {
                me.properties[key].propertyValueElement.style.backgroundColor = '';
                me.properties[key].labelElement.style.backgroundColor = '';
                delete me.properties[key].blinkTimeout;
            }, 1000
        );
    }
    
    function updateChangedProperty(key) {
        var propertyValueElement = me.properties[key].propertyValueElement;
        if (me.properties[key].logItem.onRemove) {
            me.properties[key].logItem.onRemove();
        }
        var wasShowingChildren = me.properties[key].logItem.getShowChildren && me.properties[key].logItem.getShowChildren();
        while (propertyValueElement.firstChild) {
            propertyValueElement.removeChild(propertyValueElement.firstChild);
        }
        me.properties[key].logItem = LOG.getValueAsLogItem(me.doc, me.value[key], me.stackedMode, me.alreadyLoggedContainers);
        me.properties[key].element = me.properties[key].logItem.element;
        if (wasShowingChildren) {
            me.properties[key].logItem.setShowChildren(wasShowingChildren);
        }
        if (me.properties[key].logItem.setAutoUpdate) {
            me.properties[key].logItem.setAutoUpdate(!!me.autoUpdateInterval);
        }
        propertyValueElement.appendChild(me.properties[key].element);
        blinkProperty(key);
    }
    
    function updateAddedProperty(key) {
        me.keys.push(key);
        me.createProperty(key);
        me.setPropertyStackMode(key);
        if (!me.methodsVisible && typeof me.value[key] == 'function') {
            me.properties[key].element.style.display = 'none';
        } else { // the property will be visible and the last, update the lastVisibleProperty
            if (me.lastVisibleProperty) {
                me.lastVisibleProperty.commaSpan.style.display = '';
            }
            me.properties[key].commaSpan.style.display = 'none';
            me.lastVisibleProperty = me.properties[key];
            blinkProperty(key);
        }
        if (me.properties[key].logItem.setAutoUpdate) {
            me.properties[key].logItem.setAutoUpdate(!!me.autoUpdateInterval);
        }
        me.propertiesSpan.appendChild(me.properties[key].element);
    }
    
    function updateRemovedProperty(key) {
        if (me.properties[key].blinkTimeout) {
            clearTimeout(me.properties[key].blinkTimeout);
        }
        var property = me.properties[key];
        if (property.logItem.onRemove) {
            property.logItem.onRemove();
        }
        me.keys.splice(LOG.indexOf(me.keys, key), 1);
        property.propertyValueElement.style.backgroundColor = 'yellow';
        property.labelElement.style.backgroundColor = 'yellow';
        property.propertyValueElement.style.textDecoration = 'line-through';
        property.labelElement.style.textDecoration = 'line-through';
        
        setTimeout(
            function() {
                me.propertiesSpan.removeChild(property.element);
                if (me.lastVisibleProperty == property) {
                    me.lastVisibleProperty = null;
                    for (var i = me.keys.length - 1; i >= 0; --i) {
                        if (me.properties[me.keys[i]].element.style.display != 'none') {
                            me.lastVisibleProperty = me.properties[me.keys[i]];
                            me.lastVisibleProperty.commaSpan.style.display = 'none';
                            break;
                        }
                    }
                }
            }, 1000
        );
    }
    
    var diffs = LOG.getObjectDifferences(this.oldValue, this.value);
    for (var i = 0; i < diffs.changedKeys.length; ++i) {
        updateChangedProperty(diffs.changedKeys[i]);
    }
    for (var i = 0; i < diffs.addedKeys.length; ++i) {
        updateAddedProperty(diffs.addedKeys[i]);
    }
    for (var i = 0; i < diffs.removedKeys.length; ++i) {
        updateRemovedProperty(diffs.removedKeys[i]);
    }
    this.oldValue = LOG.shallowClone(this.value);
}

LOG.ObjectLogItem.prototype.onRemove = function() {
    this.setAutoUpdate(false);
}

LOG.ObjectLogItem.prototype.toggleAutoUpdate = function() {
    this.setAutoUpdate(!this.autoUpdateInterval);
}

LOG.ObjectLogItem.prototype.setAutoUpdate = function(enabled) {
    if (!!this.autoUpdateInterval == enabled) {
       return;
    }
    if (!this.showingChildren) {
        this.wasAutoUpdating = enabled;
        return;
    }
    if (this.autoUpdateInterval) {
        clearInterval(this.autoUpdateInterval);
        this.autoUpdateInterval = null;
        this.updateLink.firstChild.nodeValue = '\u21ba';
        this.updateLink.style.backgroundColor = '';
    } else {
        var me = this;
        this.autoUpdateInterval = setInterval(
            function() {
                me.updateAndMarkDifferences()
            },
            100
        );
        this.updateLink.firstChild.nodeValue = '\u21bb';
        this.updateLink.style.backgroundColor = '#af5';
    }
    for (var property in this.properties) {
        if (this.properties[property].logItem.setAutoUpdate) {
            this.properties[property].logItem.setAutoUpdate(enabled);
        }
    }
}

LOG.ObjectLogItem.prototype.setPropertyStackMode = function(key) {
    this.properties[key].element.style.marginLeft = this.currentStackedMode ? '2em' : '0';
    if (this.methodsVisible || typeof this.value[key] != 'function') {
        this.properties[key].element.style.display = this.currentStackedMode ? 'block' : 'inline';
    }
}

LOG.ObjectLogItem.prototype.setStackedMode = function(stacked, applyToChildren) {
    if (this.currentStackedMode == stacked) {
        return;
    }
    var text, margin;
    this.currentStackedMode = stacked;
    for (var key in this.properties) {
        this.setPropertyStackMode(key);
        if (applyToChildren && this.properties[key].logItem.setStackedMode) {
            this.properties[key].logItem.setStackedMode(stacked, applyToChildren);
        }
    }
    if (stacked) {
        this.stackedToggleLink.firstChild.nodeValue = '\u25bc';
    } else {
        this.stackedToggleLink.firstChild.nodeValue = '\u25ba';
    }
}

LOG.ObjectLogItem.prototype.toggleStackedMode = function(applyToChildren) {
    this.setStackedMode(!this.currentStackedMode, applyToChildren);
}

LOG.ObjectLogItem.prototype.toggleMethodsVisible = function() {
    this.methodsVisible = !this.methodsVisible;
    var key;
    if (this.lastVisibleProperty) {
        this.lastVisibleProperty.commaSpan.style.display = '';
    }
    this.lastVisibleProperty = null;
    for (var i = 0; i < this.keys.length; ++i) {
        key = this.keys[i];
        this.setPropertyStackMode(key);
        if (this.methodsVisible || typeof this.value[key] != 'function') {
            this.lastVisibleProperty = this.properties[key]; // always the last
            this.properties[key].element.style.display = this.currentStackedMode ? 'block' : 'inline';
        } else {
            this.properties[key].element.style.display = 'none';
        }
    }
    this.lastVisibleProperty.commaSpan.style.display = 'none';
    if (this.methodsVisible) {
        this.toggleMethodsLink.firstChild.nodeValue = '-';
    } else {
        this.toggleMethodsLink.firstChild.nodeValue = '+';
    }
}

LOG.ObjectLogItem.prototype.expandProperty = function(pathToProperty) {
    Log(pathToProperty, 'pathToProperty', 'ppe');
    var property = pathToProperty.shift();
    if (typeof this.value[property] == 'function') {
        this.toggleMethodsVisible(true);
    }
    this.setShowChildren(true);
    if (pathToProperty.length == 0) {
        Log(this.properties, 'this.properties', 'ppe');
        Log(property, 'property', 'ppe');
        return this.properties[property].logItem;
    } else {
        if (this.properties[property].logItem.expandProperty) {
            return this.properties[property].logItem.expandProperty(pathToProperty);
        }
    }
}