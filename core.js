// LOG

var LOG = {};
LOG.dontLogResult = {}; // This is used internally to avoid logging some things
LOG.clickedMessages = [];
LOG.callWhenLoggerReadyCallbacks = []; // This is used to wait until the page is loaded

LOG.setTypeName = function(constructor, name) {
    constructor.prototype.getTypeName = function() {
        return name;
    }
}

LOG.callWhenLoggerReady = function(callback) {
    if (LOG.logger) {
        callback();
    } else {
        LOG.callWhenLoggerReadyCallbacks.push(callback);
    }
}

LOG.logAsSection = function(sectionName, object, objectName) {
    LOG.callWhenLoggerReady(
        function() {
            LOG.logger.getOrAddSection(sectionName, new LOG.SingleLogItemSection(LOG.logger.doc, LOG.logger.getValueAsLogItem(object), objectName));
        }
    );
}

LOG.focusAndBlinkElement = function(element) {
    element.scrollIntoView();
    LOG.blinkElement(element);
}

LOG.blinkElement = function(element) {
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
    try {
        var pos = LOG.getPosition(element);
    } catch (e) { // ie sometimes throws exceptions (it happened with iframes) while accessing offsetParent
        var pos = { x: 0, y: 0 };
    }
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

function Log(message, title, section, dontOpen, stackedMode) {
    LOG.callWhenLoggerReady(
        function() {
            LOG.logger.log(message, title, true, section, dontOpen, stackedMode);
        }
    );
    return message;
}

function LogAndStore(value, source) {
    LOG.callWhenLoggerReady(
        function() {
            LOG.logger.logAndStore(value, source);
        }
    );
    return value;
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
    var logItem = new LOG.ExceptionLogItem(LOG.logger.doc, e);
    LOG.logger.defaultConsole.appendRow(
        logItem,
        'error',
        true,
        'red'
    );
    return LOG.dontLogResult;
}

LOG.createHttpRequest = function() {
    if (window.XMLHttpRequest) {
        return new XMLHttpRequest();
    } else if (window.ActiveXObject) {
        return new ActiveXObject("Msxml2.XMLHTTP");
    } else {
        throw "Can't create XMLHttpRequest";
    }
}


// Extension prefixes for commands

LOG.extensions = {};

/*

example:

LOG.extensions.php = {
    exec: function() { eval in php... },
    suggest: function(code, currentPosition) {  return { matches: [ 'option1', 'option2', etc ], newCode: 'var x = pepe', newPosition: 12 } }
}

*/

LOG.getExtensionFromCode = function(code) {
    for (var prefix in LOG.extensions) {
        if (code.substr(0, prefix.length + 1) == prefix + ':') {
            return LOG.extensions[prefix];
        }
    }
    return null;
}
