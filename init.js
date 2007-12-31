LOG.addEventListener(window, 'unload', LOG.onUnload);
LOG.addEventListener(document, 'mousedown', LOG.onMouseDown, true);
LOG.addEventListener(document, 'mouseup', LOG.onClick, true);
LOG.addEventListener(document, 'click', LOG.onClick, true);
LOG.addEventListener(document, 'keydown', LOG.onKeyDown, true);
LOG.addEventListener(document, 'selectstart', LOG.onDocumentSelectStart, true);

var DEBUG_MODE = false;

if (LOG.getCookie('LOG_DEBUG_MODE') == "true") {
    DEBUG_MODE = true;
}

if (!LOG.loaded) {
    LOG.console = new LOG.Console;
    LOG.console.init();
    LOG.willOpenInNewWindow = LOG.getCookie('LOG_IN_NEW_WINDOW') == 'true';
    LOG.history = LOG.getCookie('LOG_HISTORY');
    if (LOG.history) {
        try {
            LOG.history = eval('(' + LOG.history + ')');
            if (LOG.history.length > 0) {
                LOG.historyPosition = LOG.history.length;
            }
        } catch (e) {
            LOG.history = [];
            LOG.historyPosition = -1;
        }
    } else {
        LOG.history = [];
        LOG.historyPosition = -1;
    }
    
    (function() {
        var logWasOpen = LOG.getCookie('LOG_OPEN');
        if (logWasOpen == 'true') {
            LOG.console.createElement();
            var openConsoles = LOG.getCookie('LOG_OPEN_CONSOLES');
            if (openConsoles) {
                LOG.console.consoles.console.panel.setSelected(false);
                openConsoles = openConsoles.split(',');
                for (var i = 0; i < openConsoles.length; ++i) {
                    if (LOG.console.consoles[openConsoles[i]]) {
                        LOG.console.consoles[openConsoles[i]].panel.setSelected(true);
                    } else {
                        LOG.console.addConsole(openConsoles[i]).panel.setSelected(true);
                    }
                }
            }
        }
    })();
} else {
    if (LOG.wasOpen) {
        LOG.console.createElement();
    }
}

LOG.loaded = true;