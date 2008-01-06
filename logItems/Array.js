LOG.Class('ArrayLogItem');

LOG.ArrayLogItem.prototype.init = function(value, stackedMode, alreadyLoggedContainers) {
    var doc = LOG.console.ownerDocument;
    
    if (typeof alreadyLoggedContainers == 'undefined') {
        alreadyLoggedContainers = [];
    }
    this.value = value;
    this.stackedMode = stackedMode;
    this.alreadyLoggedContainers = alreadyLoggedContainers;
    var me = this;
    var link;
    this.element = LOG.createElement(
        doc, 'span',
        {},
        [
            LOG.getGetPositionInVariablesElement(doc, value),
            link = LOG.createElement(
                doc, 'a',
                {
                    style: {
                        textDecoration: 'none',
                        color: 'black'
                    },
                    href: '#',
                    onmouseover: function() {
                        link.style.textDecoration = 'underline';
                        link.style.color = 'red';
                        endSpan.style.textDecoration = 'underline';
                        endSpan.style.color = 'red';
                    },
                    onmouseout: function() {
                        link.style.textDecoration = 'none';
                        link.style.color = 'black';
                        endSpan.style.textDecoration = 'none';
                        endSpan.style.color = '';
                    },
                    onclick: function(event) {
                        if (!event) {
                            event = LOG.console.getWindow().event;
                        }
                        LogAndStore(value);
                        LOG.stopPropagation(event);
                        LOG.preventDefault(event);
                    }
                },
                [ '[' ]
            ),
            this.updateLink = LOG.createElement(doc, 'a',
                {
                    style: {
                        textDecoration: 'none',
                        color: 'black'
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
                    onclick: function(event) {
                        if (!event) {
                            event = LOG.console.getWindow().event;
                        }
                        LOG.preventDefault(event);
                        LOG.stopPropagation(event);
                        me.toggleAutoUpdate();
                    }
                },
                [ '\u21ba' ]
            ),
            ' ',
            this.stackedToggleLink = LOG.createElement(
                doc, 'a',
                {
                    style: {
                        textDecoration: 'none',
                        color: 'olive',
                        fontSize: '8pt'
                    },
                    href: '#',
                    onmouseover: function() {
                        me.stackedToggleLink.style.textDecoration = 'underline';
                        endSpan.style.textDecoration = 'underline';
                    },
                    onmouseout: function() {
                        me.stackedToggleLink.style.textDecoration = 'none';
                        endSpan.style.textDecoration = 'none';
                    },
                    onclick: function(event) {
                        if (!event) {
                            event = LOG.console.getWindow().event;
                        }
                        LOG.preventDefault(event);
                        LOG.stopPropagation(event);
                        me.toggleStackedMode(event.ctrlKey);
                        me.stackedToggleLink.style.textDecoration = 'none';
                        endSpan.style.textDecoration = 'none';
                    }
                },
                [ '\u25ba' ]
            ),
            this.propertiesSpan = LOG.createElement(doc, 'span')
        ]
    );
    
    this.currentStackedMode = false;
    this.properties = [];
    this.oldValue = LOG.shallowClone(value);
    
    for (var i = 0; i < value.length; i++) {
        this.createProperty(i, LOG.getValueAsLogItem(doc, value[i], stackedMode, alreadyLoggedContainers));
        me.lastVisibleProperty = this.properties[i];
        this.propertiesSpan.appendChild(this.properties[i].element);
    }
    
    var endSpan = LOG.createElement(
        doc, 'span',
        {},
        [ ']' ]
    );
    
    this.autoUpdateInterval = null;
    
    this.element.appendChild(endSpan);
    if (stackedMode) {
        this.toggleStackedMode();
    }
}

LOG.ArrayLogItem.prototype.setShowChildren = function(showChildren, applyToChildren) {
    if (!showChildren || !applyToChildren) {
        return;
    }
    for (var i = 0; i < this.value.length; i++) {
        if (this.properties[i].logItem.setShowChildren) {
            this.properties[i].logItem.setShowChildren(true, true);
        }
    }
}

LOG.ArrayLogItem.prototype.createProperty = function(index) {
    var doc = LOG.console.ownerDocument;
    var logItem = LOG.getValueAsLogItem(doc, this.value[index], this.stackedMode, this.alreadyLoggedContainers);
    var span, labelElement, logItemSpan, commaSpan;
    span = LOG.createElement(doc, 'span',
        {},
        [
            labelElement = LOG.createElement(
                doc, 'span',
                {
                    style: {
                        display: 'none',
                        color: 'gray'
                    }
                },
                [ index + ': ' ]
            ),
            logItemSpan = LOG.createElement(
                doc, 'span',
                {},
                [logItem.element]
            ),
            commaSpan = LOG.createElement(
                doc, 'span',
                {},
                [', ']
            )
        ]
    );
    var property = {
        element: span,
        labelElement: labelElement,
        propertyValueElement: logItemSpan,
        logItem: logItem,
        commaSpan: commaSpan
    };
    this.properties[index] = property;
    if (index == this.value.length - 1) {
        property.commaSpan.style.display = 'none';
    }
}

LOG.ArrayLogItem.prototype.focusProperty = function(pathToProperty) {
    var property = pathToProperty.shift().name;
    if (pathToProperty.length == 0) {
        LOG.focusAndBlinkElement(this.properties[property].logItem.element);
    } else {
        if (this.properties[property].logItem.focusProperty) {
            this.properties[property].logItem.focusProperty(pathToProperty);
        }
    }
}

LOG.ArrayLogItem.prototype.setStackedMode = function(stacked, applyToChildren) {
    if (this.currentStackedMode == stacked) {
        return;
    }
    this.currentStackedMode = stacked;
    for (var i in this.properties) {
        this.setPropertyStackMode(i, applyToChildren);
    }
    if (stacked) {
        this.stackedToggleLink.firstChild.nodeValue = '\u25bc';
    } else {
        this.stackedToggleLink.firstChild.nodeValue = '\u25ba';
    }
}

LOG.ArrayLogItem.prototype.setPropertyStackMode = function(index, applyToChildren) {
    var text, margin;
    if (this.currentStackedMode) {
        margin = '2em';
    } else {
        margin = '0';
    }
    var property = this.properties[index];
    property.element.style.display = this.currentStackedMode ? 'block' : 'inline';
    property.element.style.marginLeft = margin;
    property.labelElement.style.display = this.currentStackedMode ? '' : 'none';
    if (applyToChildren && property.logItem.setStackedMode) {
        property.logItem.setStackedMode(this.currentStackedMode, applyToChildren);
    }
}

LOG.ArrayLogItem.prototype.toggleStackedMode = function(applyToChildren) {
    this.setStackedMode(!this.currentStackedMode, applyToChildren);
}

LOG.ArrayLogItem.prototype.toggleAutoUpdate = function() {
    this.setAutoUpdate(!this.autoUpdateInterval);
}

LOG.ArrayLogItem.prototype.setAutoUpdate = function(enabled) {
    if (!!this.autoUpdateInterval == enabled) {
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
    for (var i = 0; i < this.properties.length; ++i) {
        if (this.properties[i].logItem.setAutoUpdate) {
            this.properties[i].logItem.setAutoUpdate(enabled);
        }
    }
}

LOG.ArrayLogItem.prototype.updateAndMarkDifferences = function() {
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
        me.properties[key].logItem = LOG.getValueAsLogItem(LOG.console.ownerDocument, me.value[key], me.stackedMode, me.alreadyLoggedContainers);
        if (wasShowingChildren) {
            me.properties[key].logItem.setShowChildren(wasShowingChildren);
        }
        if (me.properties[key].logItem.setAutoUpdate) {
            me.properties[key].logItem.setAutoUpdate(!!me.autoUpdateInterval);
        }
        propertyValueElement.appendChild(me.properties[key].logItem.element);
        blinkProperty(key);
    }
    
    function updateAddedProperty(key) {
        me.createProperty(key);
        me.setPropertyStackMode(key);
        if (me.lastVisibleProperty) {
            me.lastVisibleProperty.commaSpan.style.display = '';
        }
        me.properties[key].commaSpan.style.display = 'none';
        me.lastVisibleProperty = me.properties[key];
        blinkProperty(key);
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
        property.propertyValueElement.style.backgroundColor = 'yellow';
        property.labelElement.style.backgroundColor = 'yellow';
        property.propertyValueElement.style.textDecoration = 'line-through';
        property.labelElement.style.textDecoration = 'line-through';
        
        setTimeout(
            function() {
                me.propertiesSpan.removeChild(property.element);
                if (me.lastVisibleProperty == property) {
                    me.lastVisibleProperty = null;
                    for (var i = me.properties.length - 1; i >= 0; --i) {
                        if (me.properties[i].element.style.display != 'none') {
                            me.lastVisibleProperty = me.properties[i];
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

LOG.ArrayLogItem.prototype.onRemove = function() {
    this.setAutoUpdate(false);
}