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

function Log(message, title, section, dontOpen, stackedMode) {
    return LOG.logRunner.getLogger().evaluator.log(message, title, true, section, dontOpen, stackedMode);
}

function LogAndStore(value, source) {
    return LOG.logger.evaluator.logAndStore(value, source);
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
