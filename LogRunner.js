LOG.LogRunner = function() {
    LOG.n = 0;
    this.doc = document;
    this.willOpenInNewWindow = LOG.getCookie('LOG_IN_NEW_WINDOW') == 'true';
    this.historyManager = new LOG.HistoryManager(LOG.getCookie('LOG_HISTORY'));
    this.containerSavedSize = parseFloat(LOG.getCookie('LOG_SIZE'));
    this.loggerSavedOpenSections = LOG.getCookie('LOG_OPEN_SECTIONS');
    this.collapsed = LOG.getCookie('LOG_OPEN') != 'true';
    LOG.addEventListener(document, 'keydown', LOG.createEventHandler(document, this, 'onKeyDown'), true);
    LOG.addEventListener(document, 'selectstart', this.caller('onDocumentSelectStart'), true);
    LOG.addEventListener(document, 'mousedown', this.caller('onMouseDown'), true);
    LOG.addEventListener(document, 'mouseup', this.caller('onClick'), true);
    LOG.addEventListener(document, 'click', this.caller('onClick'), true);
    LOG.addEventListener(window, 'unload', this.caller('onUnload'));
    this.appendLogger();
}

LOG.setTypeName(LOG.LogRunner, 'LOG.LogRunner');

LOG.LogRunner.prototype.caller = function(methodName) {
    var me = this;
    return function() {
        return me[methodName].apply(me, arguments);
    }
}


LOG.LogRunner.prototype.createLogger = function(doc) {
    LOG.logger = new LOG.Logger(doc, this.willOpenInNewWindow, this.historyManager, this.loggerSavedOpenSections);
    LOG.logger.onnewwindowtoggleclick = this.caller('onLoggerNewWindowToggleClick');
    LOG.logger.onescpress = this.caller('onLoggerEscPress');
    LOG.logger.oncollapsetoggleclick = this.caller('onLoggerCollapseToggleClick');
    LOG.logger.onconsolerowappend = this.caller('onConsoleRowAppend');
    for (var i = 0; i < LOG.pendingLogCalls.length; ++i) {
        Log.apply(window, LOG.pendingLogCalls[i]);
    }
    LOG.pendingLogCalls = [];
    LOG.logger.setCollapsed(this.collapsed);
    LOG.logger.onexpandrequest = this.caller('onLoggerExpandRequest');
}

LOG.LogRunner.prototype.onLoggerExpandRequest = function() {
    if (!this.willOpenInNewWindow) {
        this.setCollapsed(this.container, false);
    }
}

LOG.LogRunner.prototype.createWindowContainer = function(callback) {
    var container;
    var me = this;
    try {
        new LOG.LogWindow(
            function (container) {
                container.onkeydown = me.caller('onKeyDown');
                container.onunload = me.caller('onLogWindowUnload');
                callback(container);
            }
        );
    } catch (e) {
        callback(null);
    }
}

LOG.LogRunner.prototype.createBodyWrapperContainer = function(callback) {
    var me = this;
    new LOG.BodyWrapper(
        this.doc,
        this.containerSavedSize,
        this.collapsed ? '17px' : undefined,
        function (container) {
            container.ondragend = me.caller('onBodyWrapperDragEnd');
            me.setCollapsed(container, me.collapsed);
            callback(container);
        }
    );
}

LOG.LogRunner.prototype.createContainer = function(callback) {
    var container;
    var me = this;
    if (this.willOpenInNewWindow) {
        this.createWindowContainer(
            function (container) {
                if (container) {
                    me.container = container;
                    callback();
                } else {
                    me.willOpenInNewWindow = false;
                    me.createContainer(callback);
                }
            }
        );
    } else {
        this.willOpenInNewWindow = false;
        if (this.container) { // there is an old window or BodyWrapper left
            this.container.uninit();
            delete this.container;
        }
        this.createBodyWrapperContainer(
            function(container) {
                me.container = container;
                callback();
            }
        );
    }
}

LOG.LogRunner.prototype.appendLoggerNow = function() {
    if (this.appendLoggerNowCaller) {
        LOG.removeEventListener(window, 'load', this.appendLoggerNowCaller);
        delete this.appendLoggerNowCaller;
    }
    var me = this;
    this.createContainer(
        function() {
            me.createLogger(me.container.doc);
            me.container.appendChild(LOG.logger.element);
            LOG.logger.setInNewWindow(me.willOpenInNewWindow);
            // LOG.logger.focus();
        }
    );
}

LOG.LogRunner.prototype.appendLogger = function() {
    if (document.body) {
        this.appendLoggerNow();
    } else {
        if (!this.appendLoggerNowCaller) {
            this.appendLoggerNowCaller = this.caller('appendLoggerNow');
        }
        LOG.addEventListener(window, 'load', this.appendLoggerNowCaller);
    }
    this.loggerAppended = true;
}

LOG.LogRunner.prototype.onBodyWrapperDragEnd = function() {
    if (this.collapsed) {
        this.setCollapsed(this.container, false);
    }
}

LOG.LogRunner.prototype.setCollapsed = function(bodyWrapper, collapsed) {
    if (collapsed) {
        bodyWrapper.lock('17px');
        window.focus();
    } else {
        bodyWrapper.unlock();
    }
    if (LOG.logger) {
        LOG.logger.setCollapsed(collapsed);
    }
    this.collapsed = collapsed;
}

LOG.LogRunner.prototype.onConsoleRowAppend = function(console) {
    if (console.shouldExpandOnRowAppend && this.collapsed) {
        this.showLogger();
    }
}

LOG.LogRunner.prototype.onLoggerCollapseToggleClick = function() {
    this.setCollapsed(this.container, !this.collapsed);
}

LOG.LogRunner.prototype.onLoggerNewWindowToggleClick = function() {
    this.deleteContainer();
    if (!this.willOpenInNewWindow) { // otherwise this will be handled by onLogWindowUnload
        this.willOpenInNewWindow = !this.willOpenInNewWindow;
        this.appendLogger();
    }
}

LOG.LogRunner.prototype.onLogWindowUnload = function() {
    delete this.logWindow;
    this.willOpenInNewWindow = false;
    this.appendLogger();
}

LOG.LogRunner.prototype.deleteContainer = function() {
    if (this.container && this.container.getSize) {
        this.containerSavedSize = this.container.getSize();
    }
    this.container.uninit();
    delete this.container;
}

LOG.LogRunner.prototype.onKeyDown = function(event) {
    var chr = String.fromCharCode(event.keyCode).toLowerCase();
    if (event.keyCode == 120) {
        if (!LOG.logger) {
            this.stopDebugging = false;
            this.createAndAppendLogger();
        }
        this.showLogger(true);
        LOG.preventDefault(event);
        LOG.stopPropagation(event);
    } else if (event.altKey && event.shiftKey && chr == 't') {
        this.onLoggerNewWindowToggleClick(event);
        LOG.preventDefault(event);
        LOG.stopPropagation(event);
    }
}

LOG.LogRunner.prototype.showLogger = function(alsoFocus) {
    if (!this.willOpenInNewWindow) {
        this.setCollapsed(this.container, false);
        this.container.show();
    }
    if (alsoFocus) {
        LOG.logger.focus();
    }
}

LOG.LogRunner.prototype.hide = function() {
    if (!this.willOpenInNewWindow) {
        this.setCollapsed(this.container, true);
    } else {
        this.container.hide();
    }
}

LOG.LogRunner.prototype.onUnload = function() {
    LOG.addCookie('LOG_HISTORY', this.historyManager.serialize(), 30);
    if (this.container && this.container.getSize) {
        LOG.addCookie('LOG_SIZE', this.container.getSize(), 30);
    } else {
        LOG.addCookie('LOG_SIZE', this.containerSavedSize, 30);
    }
    LOG.addCookie('LOG_IN_NEW_WINDOW', this.willOpenInNewWindow ? 'true' : 'false', 30);
    LOG.addCookie('LOG_OPEN', LOG.logger && (this.container && !this.container.hidden && !this.collapsed) ? "true" : "false", 30);
    if (LOG.logger) {
        LOG.addCookie('LOG_OPEN_SECTIONS', LOG.logger.serializeOpenSections(), 30);
    }
    if (LOG.isGecko) {
        LOG.removeAllEventListeners();
    }
}

LOG.LogRunner.prototype.close = function() {
    if (!LOG.logger || this.stopDebugging) {
        return;
    }
    this.deleteContainer();
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
    // To support mac we allow left or middle click
    if (LOG.getButtonFromEvent(event) != 'middle' && event.ctrlKey && event.shiftKey) {
        LOG.nextClickShouldBeStopped = true;
        var element = LOG.getElementFromEvent(event);
        LOG.logger.focusValue(element, undefined, event.altKey);
        LOG.preventDefault(event);
        LOG.stopPropagation(event);
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

LOG.LogRunner.prototype.getBody = function() {
    if (this.container && this.container.getBody) {
        return this.container.getBody();
    } else {
        return document.body;
    }
}

LOG.LogRunner.prototype.getParentNodeHidingContainer = function(node) {
    if (this.container.getParentNodeHidingMe) {
        return this.container.getParentNodeHidingMe(node);
    } else {
        return node.parentNode;
    }
}

LOG.LogRunner.prototype.getChildNodesHidingContainer = function(node) {
    if (this.container.getChildNodesHidingMe) {
        return this.container.getChildNodesHidingMe(node);
    } else {
        return node.childNodes;
    }
}
