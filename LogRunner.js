if (!LOG.LogRunner) {
    LOG.LogRunner = function() {};
}

LOG.LogRunner.prototype.init = function() {
    this.doc = document;
    this.willOpenInNewWindow = false;
    //~ this.createLogger();
    //~ LOG.addEventListener(window, 'unload', this.caller('onUnload'));
    //~ LOG.addEventListener(document, 'mousedown', this.caller('onMouseDown'), true);
    //~ LOG.addEventListener(document, 'mouseup', this.caller('onClick'), true);
    //~ LOG.addEventListener(document, 'click', this.caller('onClick'), true);
    LOG.addEventListener(document, 'keydown', LOG.createEventHandler(document, this, 'onKeyDown'), true);
    //~ LOG.addEventListener(document, 'selectstart', this.caller('onDocumentSelectStart'), true);
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
    this.logger.init(this.doc, this.willOpenInNewWindow);
    this.logger.onnewwindowtoggleclick = this.caller('onLoggerNewWindowToggleClick');
    
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
}

LOG.LogRunner.prototype.getLogger = function() {
    return this.logger;
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
    if (event.altKey) {
        if (chr == 'o') {
            if (!this.logger) {
                this.stopDebugging = false;
                this.createLogger();
            }
            var logObjectGone = false;
            try {
                this.showLogger();
            } catch (e) {
                logObjectGone = true;
            }
            if (!logObjectGone && this.doc.defaultView) {
                this.doc.defaultView.focus();
                this.logger.focus();
            } else {
                if (logObjectGone || !this.doc.parentWindow) {
                    this.createLogger();
                } else {
                    this.doc.parentWindow.focus();
                    this.logger.focus();
                }
            }
        } else if (chr == 'i') {
            this.onLoggerNewWindowToggleClick(event);
            setTimeout(
                function() {
                    if (this.doc.defaultView) {
                        this.doc.defaultView.focus();
                    }  else {
                        this.doc.parentWindow.focus();
                    }
                    this.logger.focus();
               }, 0
            );
        } else if (this.logger) {
            //~ if (chr == 'c') {
                //~ LOG.console.onClearClick(event);
            //~ } else if (chr == 'p') {
                //~ LOG.console.onPauseClick(event);
            //~ } else if (chr == 'k') {
                //~ LOG.console.onCloseClick(event);
            //~ } else if (chr == 'h') {
                //~ LOG.console.onHideClick(event);
            //~ }
        }
    }
}

LOG.LogRunner.prototype.showLogger = function() {
    if (this.bodyWrapper) {
        this.bodyWrapper.show();
    } else {
        this.window.focus();
    }
}

// Unmigrated stuff

//~ LOG.LogRunner.prototype.close = function() {
    //~ if (!this.logger || this.stopDebugging) {
        //~ return;
    //~ }
    //~ this.deleteElement();
    //~ this.stopDebugging = true;
//~ }

//~ LOG.LogRunner.prototype.hide = function() {
    //~ if (this.bodyWrapper) {
        //~ this.bodyWrapper.hide();
    //~ }
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

//~ LOG.onUnload = function() {
    //~ LOG.addCookie('LOG_DEBUG_MODE', DEBUG_MODE ? "true" : "false", 30);
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