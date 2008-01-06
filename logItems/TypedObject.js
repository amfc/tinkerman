LOG.Class('TypedObjectLogItem');

LOG.TypedObjectLogItem.prototype.getTypeName = function() {
    var value = this.value;
    var txt = '';
    var objectToStringName = null;
    if (value.toString && value.toString && value.toString != Object.prototype.toString) {
        objectToStringName = (
            function() { // This is used to detect object like Window or Navigator which generate an [object Navigator] like toString()
                var match = value.toString().match(/^\[object ([a-zA-Z0-9_$]+)\]/);
                if (!match) {
                    return null;
                }
                return match[1];
            }
        )();
    }
    if (value.constructor && value.constructor.name) {
        txt += value.constructor.name.toString();
    } else if (objectToStringName) {
        txt += objectToStringName;
    } else if (value.getClassName) {
        txt += value.getClassName();
    } else {
        txt += 'Anonymous';
    }
    return txt;
}

LOG.TypedObjectLogItem.prototype.init = function(value, stackedMode, alreadyLoggedContainers) {
    var doc = LOG.console.ownerDocument;
    this.showSource = false;
    this.value = value;
    this.stackedMode = stackedMode;
    this.alreadyLoggedContainers = alreadyLoggedContainers;
    this.autoUpdate = false;
    var decoration = '';
    if (value.Deleted) {
        decoration = 'line-through';
    }
    var me = this;
    var outlineElement;
    this.element = LOG.createElement(doc,
        'span',
        {},
        [
            LOG.getGetPositionInVariablesElement(doc, value),
            '«',
            this.link = LOG.createElement(doc, 'a',
                {
                    style: {
                        color: 'gray',
                        textDecoration: decoration ? decoration : 'none'
                    },
                    href: '#',
                    onmouseover: function() {
                        me.link.style.textDecoration = 'underline ' + decoration;
                        if (value.getDomNode) {
                            var node = value.getDomNode();
                            if (node) {
                                outlineElement = LOG.createOutlineFromElement(node);
                            }
                        }
                    },
                    onmouseout: function() {
                        if (decoration) {
                            me.link.style.textDecoration = decoration;
                        } else {
                            me.link.style.textDecoration = 'none';
                        }
                        if (outlineElement) {
                            outlineElement.parentNode.removeChild(outlineElement);
                        }
                    },
                    onclick: function(event) {
                        if (!event) {
                            event = LOG.console.getWindow().event;
                        }
                        if (event.ctrlKey) {
                            LOG.openClassInEditor(value);
                        } else {
                            LogAndStore(value);
                        }
                        LOG.stopPropagation(event);
                        LOG.preventDefault(event);
                    }
                },
                [
                    this.getTypeName()
                ]
            ),
            ' ',
            this.srcLink = LOG.createElement(doc, 'a',
                {
                    style: {
                        color: 'green',
                        textDecoration: 'none',
                        fontSize: '8pt'
                    },
                    href: '#',
                    onmouseover: function() {
                        me.srcLink.style.textDecoration = me.showSource ? 'line-through underline' : 'underline';
                    },
                    onmouseout: function() {
                        me.srcLink.style.textDecoration = me.showSource ? 'line-through' : 'none';
                    },
                    onclick: function(event) {
                        if (!event) {
                            event = LOG.console.getWindow().event;
                        }
                        me.toggleShowSource();
                        LOG.stopPropagation(event);
                        LOG.preventDefault(event);
                    }
                },
                [
                    'src'
                ]
            ),
            LOG.getExtraInfoToLogAsHtmlElement(doc, value, stackedMode, alreadyLoggedContainers),
            (typeof value.toString == 'function' && value.toString != Object.prototype.toString) ? ' ' + value.toString() : null,
            this.srcElement = LOG.createElement(doc, 'span'),
            '»'
        ]
    );
}

LOG.TypedObjectLogItem.prototype.focusProperty = function(pathToProperty) {
    if (!this.showSource) {
        this.setShowSource(true);
    }
    this.objectLogItem.focusProperty(pathToProperty);
}

LOG.TypedObjectLogItem.prototype.setAutoUpdate = function(enabled) {
    this.autoUpdate = enabled;
    if (this.objectLogItem) {
        this.objectLogItem.setAutoUpdate(enabled);
    }
}

LOG.TypedObjectLogItem.prototype.toggleShowSource = function() {
    this.setShowSource(!this.showSource);
}

LOG.TypedObjectLogItem.prototype.setShowSource = function(showSource) {
    if (this.showSource == showSource) {
        return;
    }
    var doc = LOG.console.ownerDocument;
    this.showSource = showSource;
    if (showSource) {
        this.srcLink.style.textDecoration = 'line-through';
        this.srcElement.appendChild(doc.createTextNode(' '));
        this.objectLogItem = new LOG.ObjectLogItem;
        this.objectLogItem.init(this.value, this.stackedMode, this.alreadyLoggedContainers, true, false);
        if (this.autoUpdate) {
            this.objectLogItem.setAutoUpdate(true);
        }
        this.srcElement.appendChild(this.objectLogItem.element);
    } else {
        this.objectLogItem.setAutoUpdate(false);
        delete this.objectLogItem;
        this.srcLink.style.textDecoration = 'none';
        while (this.srcElement.firstChild) {
            this.srcElement.removeChild(this.srcElement.firstChild);
        }
    }
}
