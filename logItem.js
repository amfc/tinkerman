LOG.getGetPositionInVariablesElement = function(doc, value) {
    var positionInVariables = LOG.indexOf(LOG.clickedMessages, value);
    if (positionInVariables == -1) {
        return null;
    }
    return LOG.createElement(doc, 'a',
        {
            style: {
                fontSize: '7pt',
                color: '#66a'
            },
            onclick: function(event) {
                if (!event) {
                    event = doc.parentWindow.event;
                }
                LOG.logger.commandEditor.commandInput.writeStringToInput('$' + positionInVariables);
                LOG.stopPropagation(event);
                LOG.preventDefault(event);
            }
        },
        [
            '$' + positionInVariables
        ]
    );
}

LOG.getValueAsHtmlElement = function(doc, value, stackedMode, alreadyLoggedContainers, showFirstLevelObjectChildren, showExpandObjectChildren) {
    return LOG.getValueAsLogItem(doc, value, stackedMode, alreadyLoggedContainers, showFirstLevelObjectChildren, showExpandObjectChildren).element;
}

LOG.getExtraInfoToLogAsHtmlElement = function(doc, value, stackedMode, alreadyLoggedContainers) {
    if (!value || !value.getExtraInfoToLog) {
        return null;
    }
    var extraInfoToLog = value.getExtraInfoToLog();
    var element = LOG.createElement(doc, 'span', {});
    for (var item in extraInfoToLog) {
        if (typeof extraInfoToLog[item] == 'function') {
            element.appendChild(doc.createTextNode(' '));
            var link = LOG.createElement(doc, 'a',
                {
                    style: {
                        textDecoration: 'none',
                        color: 'green',
                        fontSize: '8pt'
                    },
                    href: '#',
                    onclick: (function(item) {
                        return function(event) {
                            if (!event) {
                                event = doc.parentWindow.event;
                            }
                            Log(extraInfoToLog[item].call(value));
                            LOG.stopPropagation(event);
                            LOG.preventDefault(event);
                        }
                    })(item)
                },
                [
                    item
                ]
            )
            element.appendChild(link);
        } else {
            var span = LOG.createElement(doc, 'span',
                {
                    style: {
                        color: '#039',
                        fontSize: '8pt'
                    }
                },
                [' ' + item + ': ']
            );
            element.appendChild(span);
            element.appendChild(LOG.getValueAsHtmlElement(doc, extraInfoToLog[item], stackedMode, alreadyLoggedContainers));
        }
    }
    return element;
}


LOG.instanceOfDocument = function(value) {
    if (LOG.isIE) {
        return value.nodeType == 9;
    } else {
        return value instanceof Document;
    }
}

LOG.instanceOfHTMLDocument = function(value) {
    return LOG.instanceOfDocument(value) && document.body;
}

LOG.instanceOfWindow = function(value) {
    return value && value.self == value && value == value.window;
}


LOG.asText = function(value) {
    if (value != null && typeof value == 'object') {
        if (LOG.instanceOfWindow(value) || LOG.instanceOfDocument(value) || value instanceof Date || value.getTypeName) {
            return '<<' + LOG.TypedObjectLogItem.getTypeName(value) + '>>';
        } else if (value.nodeType) { // DOM node
            if (value.nodeType == 1) { // 1: element node
                return '<' + value.tagName + '>';
            } else {
                return '<<' + value.nodeName + '>>';
            }
        } else if (
            value instanceof Array ||
            typeof value.length != 'undefined' && (
                value.item || // DOM collections
                value.slice && value.pop && value.push // Arrays from other windows (in konq all arrays which are logged)
            )
        ) {
            var out = '[';
            for (var i = 0; i < value.length; ++i) {
                if (i > 0) {
                    out += ', ';
                }
                out += LOG.logAsText(value[i]);
            }
            out += ']';
            return out;
        } else if (value.constructor != Object) {
            return '<<' + LOG.TypedObjectLogItem.getTypeName(value) + '>>';
        } else {
            var out = '{';
            for (var prop in value) {
                if (i > 0) {
                    out += ', ';
                }
                out += prop + ':' + LOG.logAsText(value[prop]);
            }
            out += '}';
            return out;
        }
    } else if (typeof value == 'function') {
        return 'func'
    } else if (typeof value == 'string') {
        return '"' + value.toString() + '"';
    } else {
        return value.toString();
    }
}

LOG.getValueAsLogItem = function(doc, value, stackedMode, alreadyLoggedContainers, showFirstLevelObjectChildren, showExpandObjectChildren) {
    // Simple object (used as hash tables), array, html element and typed objects are special (since they are implemented as separate objects) and should be handled separately
    if (!alreadyLoggedContainers) {
        alreadyLoggedContainers = [];
    }
    if (value instanceof Object && LOG.indexOf(alreadyLoggedContainers, value) != -1) {
        return new LOG.RefLogItem(doc, value, stackedMode, alreadyLoggedContainers);
    } else {
        if (value && value.createLogItem) {
            return value.createLogItem(doc, stackedMode, alreadyLoggedContainers, showFirstLevelObjectChildren, showExpandObjectChildren);
        } else if (value != null && typeof value == 'object') {
            if (LOG.instanceOfWindow(value) || LOG.instanceOfDocument(value) || value instanceof Date || value.getTypeName) {
                return new LOG.TypedObjectLogItem(doc, value, stackedMode, alreadyLoggedContainers);
            } else if (value.nodeType && value.nodeType != 11) { // DOM node (not a fragment)
                if (value.nodeType == 1) { // 1: element node
                    return new LOG.HTMLElementLogItem(doc, value, stackedMode, alreadyLoggedContainers);
                } else {
                    return new LOG.BasicLogItem(doc, value, stackedMode, alreadyLoggedContainers);
                }
            } else if (
                value instanceof Array ||
                typeof value.length != 'undefined' && (
                    value.item || // DOM collections
                    value.slice && value.pop && value.push // Arrays from other windows (in konq all arrays which are logged)
                )
            ) {
                return new LOG.ArrayLogItem(doc, value, stackedMode, alreadyLoggedContainers);
            } else if (value.constructor != Object) {
                return new LOG.TypedObjectLogItem(doc, value, stackedMode, alreadyLoggedContainers);
            } else {
                return new LOG.ObjectLogItem(doc, value, stackedMode, alreadyLoggedContainers, showFirstLevelObjectChildren, showExpandObjectChildren);
            }
        } else if (typeof value == 'function') {
            return new LOG.FunctionLogItem(doc, value, stackedMode, alreadyLoggedContainers);
        } else {
            return new LOG.BasicLogItem(doc, value, stackedMode, alreadyLoggedContainers);
        }
    }
}
