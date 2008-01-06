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
                    event = LOG.console.getWindow().event;
                }
                LOG.console.writeStringToInput('$' + positionInVariables)
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
    if (!value.getExtraInfoToLog) {
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
                                event = LOG.console.getWindow().event;
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


LOG.getValueAsLogItem = function(doc, value, stackedMode, alreadyLoggedContainers, showFirstLevelObjectChildren, showExpandObjectChildren) {
    // Simple object (used as hash tables), array, html element and typed objects are special (since they are implemented as separate objects) and should be handled separately
    if (value != null && typeof value == 'object') {
        if (value.nodeType && value.nodeType == 1) { // 1: element node
            var logItem = new LOG.HTMLElementLogItem;
            logItem.init(doc, value, stackedMode, alreadyLoggedContainers);
            return logItem;
        }  else if (value instanceof Array || /* filter DOM Select elements */ !value.nodeType && value.item && typeof value.length != 'undefined') {
            var logItem = new LOG.ArrayLogItem;
            logItem.init(doc, value, stackedMode, alreadyLoggedContainers);
            return logItem;
        } else if (value.getClassName || value instanceof String || value instanceof Date || value instanceof Number || value instanceof Boolean) { // an object we can Log
            var logItem = new LOG.TypedObjectLogItem;
            logItem.init(doc, value, stackedMode, alreadyLoggedContainers);
            return logItem;
        } else {
            var logItem = new LOG.ObjectLogItem;
            logItem.init(doc, value, stackedMode, alreadyLoggedContainers, showFirstLevelObjectChildren, showExpandObjectChildren);
            return logItem;
        }
    }
    
    function appendExtraInfoToLog() {
        var extraInfoElement = LOG.getExtraInfoToLogAsHtmlElement(doc, value, stackedMode, alreadyLoggedContainers);
        if (extraInfoElement) {
            fragment.appendChild(extraInfoElement);
        }
    }
    
    // We know the value is not a hash type object or an array or html element or a typed object
    var i;
    var fragment = doc.createDocumentFragment();
    
    var span = LOG.getGetPositionInVariablesElement(doc, value);
    if (span) {
        fragment.appendChild(span);
    }
    
    if (!alreadyLoggedContainers) {
        alreadyLoggedContainers = [];
    }
    if (typeof value == 'object') {
        if (value == null) {
            fragment.appendChild(doc.createTextNode('null'));
        } else if (LOG.indexOf(alreadyLoggedContainers, value) != -1) {
            fragment.appendChild(doc.createTextNode('<Ref>'));
        } else if (typeof value == 'object' && value.nodeType == 8) { // 8 = comment
            fragment.appendChild(doc.createTextNode('[Comment] '));
            fragment.appendChild(LOG.getValueAsHtmlElement(doc, value.nodeValue, stackedMode, alreadyLoggedContainers));
        } else if (typeof value == 'object' && value.nodeName == '#text') {
            fragment.appendChild(doc.createTextNode('[NodeText] '));
            fragment.appendChild(LOG.getValueAsHtmlElement(doc, value.nodeValue, stackedMode, alreadyLoggedContainers));
        }
    } else if (typeof value == 'string') {
        fragment.appendChild(doc.createTextNode('"' + value.toString() + '"'));
    } else if (typeof value == 'function') {
        var result = /function[^(]*(\([^)]*\))/.exec(value.toString());
        var text;
        if (!result) {
            text = doc.createTextNode(value.toString());
        } else {
            text = 'f' + result[1];
        }
        
        fragment.appendChild(doc.createTextNode('«'));
        
        
        var link = doc.createElement('a');
        link.style.textDecoration = 'none';
        link.style.color = 'gray';
        link.appendChild(doc.createTextNode(text));
        fragment.appendChild(link);
        link.href = '#';
        LOG.addEventListener(link, 'mouseover',
            function() {
                link.style.textDecoration = 'underline';
            }
        );
        LOG.addEventListener(link, 'mouseout',
            function() {
                link.style.textDecoration = 'none';
            }
        );
        LOG.addEventListener(link, 'click',
            function(event) {
                LOG.preventDefault(event);
                LOG.stopPropagation(event);
                LogAndStore(value);
            }
        );
        
        fragment.appendChild(doc.createTextNode(' '));
        var srcLink = doc.createElement('a');
        srcLink.style.textDecoration = 'none';
        srcLink.style.color = 'green';
        srcLink.style.fontSize = '8pt';
        srcLink.appendChild(doc.createTextNode('src'));
        
        LOG.addEventListener(srcLink, 'mouseover',
            function() {
                srcLink.style.textDecoration = 'underline';
            }
        );
        LOG.addEventListener(srcLink, 'mouseout',
            function() {
                srcLink.style.textDecoration = 'none';
            }
        );
        LOG.addEventListener(srcLink, 'click',
            function(event) {
                LOG.console.appendRow(doc.createTextNode('\n' + value.toString()));
                LOG.preventDefault(event);
                LOG.stopPropagation(event);
            }
        );
        fragment.appendChild(srcLink);
        appendExtraInfoToLog();
        fragment.appendChild(doc.createTextNode('»'));
    } else if (typeof value != 'undefined' && typeof value.toString == 'function') {
        fragment.appendChild(doc.createTextNode(value.toString()));
    }
    return {
       element: fragment
    };
}
