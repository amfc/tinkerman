LOG.LogRunner = function() {
    this.doc = document;
    this.willOpenInNewWindow = LOG.getCookie('LOG_IN_NEW_WINDOW') == 'true';
    this.historyManager = new LOG.HistoryManager(LOG.getCookie('LOG_HISTORY'));
    this.bodyWrapperSavedSize = parseFloat(LOG.getCookie('LOG_SIZE'));
    this.loggerSavedOpenSections = LOG.getCookie('LOG_OPEN_SECTIONS');
    LOG.addEventListener(document, 'keydown', LOG.createEventHandler(document, this, 'onKeyDown'), true);
    LOG.addEventListener(document, 'selectstart', this.caller('onDocumentSelectStart'), true);
    LOG.addEventListener(document, 'mousedown', this.caller('onMouseDown'), true);
    LOG.addEventListener(document, 'mouseup', this.caller('onClick'), true);
    LOG.addEventListener(document, 'click', this.caller('onClick'), true);
    LOG.addEventListener(window, 'unload', this.caller('onUnload'));
    this.createLogger();
}

LOG.setTypeName(LOG.LogRunner, 'LOG.LogRunner');

LOG.LogRunner.prototype.caller = function(methodName) {
    var me = this;
    return function() {
        return me[methodName].apply(me, arguments);
    }
}

LOG.LogRunner.prototype.createLogger = function() {
    this.doc = this.prepareNewDocument();
    this.logger = new LOG.Logger(this.doc, this.willOpenInNewWindow, this.historyManager, this.loggerSavedOpenSections);
    this.logger.onnewwindowtoggleclick = this.caller('onLoggerNewWindowToggleClick');
    this.logger.onescpress = this.caller('onLoggerEscPress');
    this.logger.oncollapsetoggleclick = this.caller('onLoggerCollapseToggleClick');
    if (this.doc.body) {
        this.appendLogger();
    } else {
        if (!this.appendLoggerCaller) {
            this.appendLoggerCaller = this.caller('appendLogger');
        }
        LOG.addEventListener(window, 'load', this.appendLoggerCaller);
    }
}

LOG.LogRunner.prototype.appendLogger = function() {
    if (this.appendLoggerCaller) {
        LOG.removeEventListener(window, 'load', this.appendLoggerCaller);
        delete this.appendLoggerCaller;
    }
    if (!this.willOpenInNewWindow) {
        var collapsed = LOG.getCookie('LOG_OPEN') != 'true';
        this.bodyWrapper = new LOG.BodyWrapper(this.doc, this.logger.element, this.bodyWrapperSavedSize, collapsed ? '1.3em' : undefined);
        this.bodyWrapper.ondragend = this.caller('onBodyWrapperDragEnd');
        this.setCollapsed(collapsed);
    } else {
        this.doc.body.appendChild(this.logger.element);
    }
}

LOG.LogRunner.prototype.onBodyWrapperDragEnd = function() {
    if (this.collapsed) {
        this.setCollapsed(false);
    }
}

LOG.LogRunner.prototype.setCollapsed = function(collapsed) {
    if (collapsed) {
        this.bodyWrapper.lock('1.3em');
    } else {
        this.bodyWrapper.unlock();
    }
    this.logger.setCollapsed(collapsed);
    this.collapsed = collapsed;
}

LOG.LogRunner.prototype.onLoggerCollapseToggleClick = function() {
    this.setCollapsed(!this.collapsed);
}

LOG.LogRunner.prototype.onLoggerNewWindowToggleClick = function() {
    this.deleteElement();
    this.willOpenInNewWindow = !this.willOpenInNewWindow;
    this.createLogger();
    this.logger.focus();
}

LOG.LogRunner.prototype.getLogger = function() {
    return this.logger;
}

LOG.LogRunner.prototype.onLogWindowUnload = function() {
    delete this.logger;
    delete this.logWindow;
    this.willOpenInNewWindow = false;
    this.doc = document;
    this.createLogger();
}

LOG.LogRunner.prototype.prepareNewDocument = function() {
    if (this.willOpenInNewWindow) {
        try {
            this.logWindow = new LOG.LogWindow();
        } catch (e) {
            delete this.logWindow;
        }
        if (this.logWindow) {
            this.logWindow.onkeydown = this.caller('onKeyDown');
            this.logWindow.onunload = this.caller('onLogWindowUnload');
            return this.logWindow.doc;
        } else {
            this.willOpenInNewWindow = false;
        }
    }
    if (this.logWindow) {
        this.logWindow.close();
        delete this.logWindow;
    }
    return document;
}

LOG.LogRunner.prototype.deleteElement = function() {
    if (this.bodyWrapper) {
        this.bodyWrapperSavedSize = this.bodyWrapper.getSize();
        this.bodyWrapper.uninit();
        delete this.bodyWrapper;
    }
    if (this.logWindow) {
        this.logWindow.close();
        delete this.logWindow;
    }
    delete this.logger;
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
            LOG.preventDefault(event);
            LOG.stopPropagation(event);
        } else if (chr == 't') {
            this.onLoggerNewWindowToggleClick(event);
            LOG.preventDefault(event);
            LOG.stopPropagation(event);
        }
    }
}

LOG.LogRunner.prototype.showLogger = function() {
    if (this.bodyWrapper) {
        this.bodyWrapper.show();
    } else {
        this.logWindow.focus();
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
    if (this.bodyWrapper) {
        LOG.addCookie('LOG_SIZE', this.bodyWrapper.getSize(), 30);
    } else {
        LOG.addCookie('LOG_SIZE', this.bodyWrapperSavedSize, 30);
    }
    LOG.addCookie('LOG_IN_NEW_WINDOW', this.willOpenInNewWindow ? 'true' : 'false', 30);
    LOG.addCookie('LOG_OPEN', this.logger && (this.bodyWrapper && !this.bodyWrapper.hidden && !this.collapsed) ? "true" : "false", 30);
    if (this.logger) {
        LOG.addCookie('LOG_OPEN_SECTIONS', this.logger.serializeOpenSections(), 30);
    }
    if (LOG.isGecko) {
        LOG.removeAllEventListeners();
    }
}

LOG.LogRunner.prototype.close = function() {
    if (!this.logger || this.stopDebugging) {
        return;
    }
    this.deleteElement();
    this.stopDebugging = true;
}

LOG.LogRunner.prototype.onLoggerEscPress = function() {
    this.hide();
}

LOG.LogRunner.prototype.onDocumentSelectStart = function() {
    if (LOG.nextClickShouldBeStopped) {
        LOG.preventDefault(event);
        LOG.stopPropagation(event);
    }
}

LOG.LogRunner.prototype.onMouseDown = function(event) {
    if (LOG.getButtonFromEvent(event) == 'left' && event.ctrlKey && event.shiftKey) {
        LOG.nextClickShouldBeStopped = true;
        var element = LOG.getElementFromEvent(event);
        this.getLogger().focusValue(element);
        LOG.preventDefault(event);
        LOG.stopPropagation(event);
    } else if (LOG.getButtonFromEvent(event) == 'left' && event.altKey && event.ctrlKey) { // FIXME: iats dependancy, unmigrated
        if (!window.Reloadable) {
            return;
        }
        var element = LOG.getElementFromEvent(event);
        var path = LOG.guessDomNodeOwnerName(LOG.getElementFromEvent(event));
        if (path && path.pathToObject) {
            var i = 0;
            for (var i = path.pathToObject.length - 1; i >= 0; --i) {
                if (path.pathToObject[i].obj instanceof window.Reloadable) { // FIXME
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

LOG.LogRunner.prototype.onClick = function(event) {
    if (LOG.nextClickShouldBeStopped) {
        LOG.preventDefault(event);
        LOG.stopPropagation(event);
    }
}
