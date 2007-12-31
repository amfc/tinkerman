// LOG

if (typeof LOG != 'undefined') { // this file is being reloaded
    LOG.wasOpen = LOG.console.elementCreated && !LOG.console.hidden;
    LOG.console.close();
    LOG.removeAllEventListeners();
} else {
    var LOG = {};
    LOG.dontLogResult = {}; // This is used internally to avoid logging some things
    LOG.clickedMessages = [];
}

LOG.Class = function(className) {
    if (!LOG[className]) {
        LOG[className] = function() {};
    }
}

LOG.pageObjectName = 'page';

LOG.evaluate = function(code, additionalVariables) {
    for (var name in additionalVariables) {
        eval("var " + name + " = additionalVariables['" + name + "'];");
    }
    return eval(code);
}

LOG.getSerializedHistory = function() {
    var history = LOG.history;
    var maxLength = 2000; // since all the log's history will be kept in a cookie
    var strLength = 3; // since we count both square brackets and the comma of the next element
    var appendedOne = false;
    var items = [], item;
    for (var i = history.length - 1; i >= 0; --i) {
        item = "\"" + history[i].replace('"', "\"") + "\"";
        if (strLength + item.length > maxLength) {
            break;
        }
        items.unshift(item);
        strLength += item.length + 1;
    }
    return '[' + items.join(',') + ']';
}

LOG.onUnload = function() {
    LOG.addCookie('LOG_DEBUG_MODE', DEBUG_MODE ? "true" : "false", 30);
    LOG.addCookie('LOG_OPEN', LOG.console.elementCreated && !LOG.console.hidden ? "true" : "false", 30);
    LOG.addCookie('LOG_HISTORY', LOG.getSerializedHistory(), 30);
    LOG.addCookie('LOG_SIZE', LOG.console.wrapperSize, 30);
    var openConsoles = '';
    var consoles = LOG.console.consoles;
    for (var consoleName in consoles) {
        if (consoles[consoleName].panel.selected) {
            if (openConsoles) {
                openConsoles += ',';
            }
            openConsoles += consoleName;
        }
    }
    LOG.addCookie('LOG_OPEN_CONSOLES', openConsoles, 30);
    if (LOG.isGecko) {
        LOG.removeAllEventListeners();
    }
}

LOG.focusAndBlinkElement = function(element) {
    element.scrollIntoView();
    element.style.backgroundColor = 'yellow';
    setTimeout(
        function() {
            element.style.backgroundColor = '';
        },
        1000
    );
}

LOG.createOutlineFromElement = function(element) {
    var div = document.createElement('div');
    div.style.border = '2px solid red';
    div.style.position = 'absolute';
    div.style.width = element.offsetWidth + 'px';
    div.style.height = element.offsetHeight + 'px';
    var pos = LOG.getPosition(element);
    div.style.left = pos.x + 'px';
    div.style.top = pos.y + 'px';
    var labelElement = document.createElement('label');
    labelElement.appendChild(document.createTextNode(element.tagName + '-' + element.id));
    labelElement.style.backgroundColor = '#FFF';
    labelElement.onclick = function() {
        Log(element);
    }
    div.appendChild(labelElement);
    LOG.getBody().appendChild(div);
    return div;
}

LOG.logObjectSource = function(object, title) {
    var logItem = new LOG.ObjectLogItem;
    logItem.init(object, LOG.console.stackedMode);
    LOG.console.appendRow(logItem.element, title);
    return LOG.dontLogResult;
}

LOG.onKeyDown = function(event) {
    var chr = String.fromCharCode(event.keyCode).toLowerCase();
    if (event.altKey) {
        if (chr == 'o') {
            if (!LOG.console.elementCreated) {
                LOG.console.stopDebugging = false;
                LOG.console.createElement();
            }
            var logObjectGone = false;
            try {
                LOG.console.show();
            } catch (e) {
                logObjectGone = true;
            }
            if (!logObjectGone && LOG.console.ownerDocument.defaultView) {
                LOG.console.ownerDocument.defaultView.focus();
                LOG.console.input.focus();
            } else {
                if (logObjectGone || !LOG.console.ownerDocument.parentWindow) {
                    LOG.console.createElement();
                } else {
                    LOG.console.ownerDocument.parentWindow.focus();
                    LOG.console.input.focus();
                }
            }
        } else if (chr == 'i') {
            if (!LOG.console.elementCreated || LOG.console.ownerDocument == document) {
                LOG.console.onNewWindowClick(event);
            }
            setTimeout(
                function() {
                    if (LOG.console.ownerDocument.defaultView) {
                        LOG.console.ownerDocument.defaultView.focus();
                    }  else {
                        LOG.console.ownerDocument.parentWindow.focus();
                    }
                    LOG.console.input.focus();
               }, 0
            );
        } else if (LOG.console.elementCreated) {
            if (chr == 'c') {
                LOG.console.onClearClick(event);
            } else if (chr == 'p') {
                LOG.console.onPauseClick(event);
            } else if (chr == 'k') {
                LOG.console.onCloseClick(event);
            } else if (chr == 'h') {
                LOG.console.onHideClick(event);
            }
        }
    }
}

LOG.onDocumentSelectStart = function(event) {
    if (LOG.nextClickShouldBeStopped) {
        LOG.preventDefault(event);
        LOG.stopPropagation(event);
    }
}

LOG.onMouseDown = function(event) {
    if (LOG.getButtonFromEvent(event) == 'left' && event.ctrlKey && event.shiftKey) {
        LOG.nextClickShouldBeStopped = true;
        var element = LOG.getElementFromEvent(event);
        LOG.console.focusValue(element);
        LOG.preventDefault(event);
        LOG.stopPropagation(event);
    } else if (LOG.getButtonFromEvent(event) == 'left' && event.altKey && event.ctrlKey) {
        if (!window.Reloadable) {
            return;
        }
        var element = LOG.getElementFromEvent(event);
        var path = LOG.guessDomNodeOwnerName(LOG.getElementFromEvent(event));
        if (path && path.pathToObject) {
            var i = 0;
            for (var i = path.pathToObject.length - 1; i >= 0; --i) {
                if (path.pathToObject[i].obj instanceof window.Reloadable) {
                    LOG.openClassInEditor(path.pathToObject[i].obj);
                    break;
                }
            }
        }
        LOG.preventDefault(event);
        LOG.stopPropagation(event);
        LOG.nextClickShouldBeStopped = true;
    } else {
        LOG.nextClickShouldBeStopped = false;
    }
}

LOG.onClick = function(event) {
    if (LOG.nextClickShouldBeStopped) {
        LOG.preventDefault(event);
        LOG.stopPropagation(event);
    }
}

function Log(message, title, section, dontOpen, stackedMode) {
    return LOG.console.log(message, title, true, section, dontOpen, stackedMode);
}

function LogX(str) { // Log in external window
    var win = window.open("", "log", "resizable=yes,scrollbars=yes,status=yes");
    win.document.open();
    win.document.write('<html><head><title>LogX</title></head><body><pre id="pre" style="white-space: -moz-pre-wrap"> </pre></html>');
    win.document.close();
    win.document.getElementById('pre').firstChild.nodeValue = str;
}

// Log expression (usage: eval(LogE("expression")))
function LogE(expression) {
    return '(function() { return Log(' + expression + ', ' + expression.toSource() + ') } )();';
}

function LogError(e) {
    var logItem = new LOG.ExceptionLogItem;
    logItem.init(e);
    LOG.console.appendRow(
        logItem.element,
        'error',
        true,
        'red'
    );
    return LOG.dontLogResult;
}
