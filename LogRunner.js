if (!LOG.LogRunner) {
    LOG.LogRunner = function() {};
}

LOG.LogRunner.prototype.init = function() {
    this.doc = document;
    this.willOpenInNewWindow = false;
    this.historyManager = new LOG.HistoryManager;
    this.historyManager.init(LOG.getCookie('LOG_HISTORY'));
    //~ LOG.addEventListener(document, 'mousedown', this.caller('onMouseDown'), true);
    //~ LOG.addEventListener(document, 'mouseup', this.caller('onClick'), true);
    //~ LOG.addEventListener(document, 'click', this.caller('onClick'), true);
    LOG.addEventListener(document, 'keydown', LOG.createEventHandler(document, this, 'onKeyDown'), true);
    //~ LOG.addEventListener(document, 'selectstart', this.caller('onDocumentSelectStart'), true);
    LOG.addEventListener(window, 'unload', this.caller('onUnload'));
}

LOG.LogRunner.prototype.caller = function(methodName) {
    var me = this;
    return function() {
        me[methodName].apply(me, arguments);
    }
}

LOG.LogRunner.prototype.createLogger = function() {
    if (this.doc.body) {
        this.appendLogger();
    } else {
        LOG.addEventListener(window, 'load', this.caller('appendLogger'));
    }
}

LOG.LogRunner.prototype.appendLogger = function() {
    this.logger = new LOG.Logger;
    this.logger.init(this.doc, this.willOpenInNewWindow, this.historyManager);
    this.logger.onnewwindowtoggleclick = this.caller('onLoggerNewWindowToggleClick');
    this.logger.onescpress = this.caller('onLoggerEscPress');
    
    if (!this.willOpenInNewWindow) {
        this.bodyWrapper = new LOG.BodyWrapper;
        this.bodyWrapper.init(this.doc, this.logger.element);
    } else {
        this.doc.body.appendChild(this.logger.element);
    }
}

LOG.LogRunner.prototype.onLoggerNewWindowToggleClick = function() {
    this.deleteElement();
    this.willOpenInNewWindow = !this.willOpenInNewWindow;
    this.doc = this.prepareNewDocument();
    this.appendLogger();
    this.logger.focus();
}

LOG.LogRunner.prototype.getLogger = function() {
    return this.logger;
}

LOG.LogRunner.prototype.onLogWindowUnload = function() {
    delete this.logger;
    delete this.window;
    this.willOpenInNewWindow = false;
    this.doc = document;
}

LOG.LogRunner.prototype.prepareNewDocument = function() {
    if (this.willOpenInNewWindow) {
        if (!this.window || this.window.closed) {
            this.window = window.open('', 'LOG_logWindow', 'resizable=yes,scrollbars=yes,status=yes');
            if (!this.window) {
                this.willOpenInNewWindow = false;
                this.doc = document;
                return document;
            }
        }
        this.doc = this.window.document;
        this.doc.open();
        this.doc.write('<html><head><style> BODY { margin: 0em }</style></head><body></body></html>');
        this.doc.close();
        this.doc.title = 'Log: ' + window.document.title;
        this.doc.body.onunload = this.caller('onLogWindowUnload');
        this.doc.body.onkeydown = LOG.createEventHandler(this.doc, this, 'onKeyDown');
        
        return this.window.document;
    } else {
        if (this.window) {
            this.window.close();
        }
        delete this.window;
        this.doc = document;
        return document;
    }
}

LOG.LogRunner.prototype.deleteElement = function() {
    if (this.bodyWrapper) {
        this.bodyWrapper.uninit();
        delete this.bodyWrapper;
    }
}

LOG.LogRunner.prototype.onKeyDown = function(event) {
    var chr = String.fromCharCode(event.keyCode).toLowerCase();
    if (event.altKey && event.shiftKey) {
        if (chr == 'm') {
            if (!this.logger) {
                this.stopDebugging = false;
                this.createLogger();
            }
            this.showLogger();
        } else if (chr == 'i') {
            this.onLoggerNewWindowToggleClick(event);
        }
    }
}

LOG.LogRunner.prototype.showLogger = function() {
    if (this.bodyWrapper) {
        this.bodyWrapper.show();
    } else {
        this.window.focus();
    }
    this.logger.focus();
}

LOG.LogRunner.prototype.hide = function() {
    if (this.bodyWrapper) {
        this.bodyWrapper.hide();
    }
}

LOG.LogRunner.prototype.onUnload = function() {
    LOG.addCookie('LOG_HISTORY', this.historyManager.serialize(), 30);
    //~ LOG.addCookie('LOG_OPEN', LOG.logger && !LOG.console.hidden ? "true" : "false", 30);
    //~ LOG.addCookie('LOG_HISTORY', LOG.getSerializedHistory(), 30);
    //~ LOG.addCookie('LOG_SIZE', LOG.console.wrapperSize, 30);
    //~ var openConsoles = '';
    //~ var consoles = LOG.console.consoles;
    //~ for (var consoleName in consoles) {
        //~ if (consoles[consoleName].panel.selected) {
            //~ if (openConsoles) {
                //~ openConsoles += ',';
            //~ }
            //~ openConsoles += consoleName;
        //~ }
    //~ }
    //~ LOG.addCookie('LOG_OPEN_CONSOLES', openConsoles, 30);
    //~ if (LOG.isGecko) {
        //~ LOG.removeAllEventListeners();
    //~ }
}

// Unmigrated stuff

LOG.LogRunner.prototype.onLoggerEscPress = function() {
    this.hide();
}

//~ LOG.LogRunner.prototype.close = function() {
    //~ if (!this.logger || this.stopDebugging) {
        //~ return;
    //~ }
    //~ this.deleteElement();
    //~ this.stopDebugging = true;
//~ }

//~ LOG.LogRunner.prototype.onNewWindowClick = function(event) {
    //~ LOG.stopPropagation(event);
    //~ LOG.preventDefault(event);
    //~ this.willOpenInNewWindow = !this.willOpenInNewWindow;
    //~ this.deleteElement();
    //~ this.prepareNewDocument();
    //~ this.createLogger();
    //~ LOG.addCookie('LOG_IN_NEW_WINDOW', this.willOpenInNewWindow ? 'true' : 'false', 30);
//~ }

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


//~ if (!LOG.loaded) {
    //~ LOG.console = new LOG.Console;
    //~ LOG.console.init();
    //~ LOG.willOpenInNewWindow = LOG.getCookie('LOG_IN_NEW_WINDOW') == 'true';
    
    //~ (function() {
        //~ var logWasOpen = LOG.getCookie('LOG_OPEN');
        //~ if (logWasOpen == 'true') {
            //~ LOG.console.createElement();
            //~ var openConsoles = LOG.getCookie('LOG_OPEN_CONSOLES');
            //~ if (openConsoles) {
                //~ LOG.console.consoles.console.panel.setSelected(false);
                //~ openConsoles = openConsoles.split(',');
                //~ for (var i = 0; i < openConsoles.length; ++i) {
                    //~ if (LOG.console.consoles[openConsoles[i]]) {
                        //~ LOG.console.consoles[openConsoles[i]].panel.setSelected(true);
                    //~ } else {
                        //~ LOG.console.addConsole(openConsoles[i]).panel.setSelected(true);
                    //~ }
                //~ }
            //~ }
        //~ }
    //~ })();
//~ } else {
    //~ if (LOG.wasOpen) {
        //~ LOG.console.createElement();
    //~ }
//~ }

