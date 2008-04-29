LOG.LogRunner = function() {
    this.doc = document;
    this.willOpenInNewWindow = LOG.getCookie('LOG_IN_NEW_WINDOW') == 'true';
    this.historyManager = new LOG.HistoryManager(LOG.getCookie('LOG_HISTORY'));
    this.containerSavedSize = parseFloat(LOG.getCookie('LOG_SIZE'));
    this.loggerSavedOpenSections = LOG.getCookie('LOG_OPEN_SECTIONS');
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
}

LOG.LogRunner.prototype.createWindowContainer = function() {
    var container;
    try {
        container = new LOG.LogWindow();
    } catch (e) {
        return null;
    }
    container.onkeydown = this.caller('onKeyDown');
    container.onunload = this.caller('onLogWindowUnload');
    return container;
}

LOG.LogRunner.prototype.createBodyWrapperContainer = function() {
    var collapsed = LOG.getCookie('LOG_OPEN') != 'true';
    var container = new LOG.BodyWrapper(this.doc, this.containerSavedSize, collapsed ? '1.3em' : undefined);
    container.ondragend = this.caller('onBodyWrapperDragEnd');
    this.setCollapsed(container, collapsed);
    return container;
}

LOG.LogRunner.prototype.createContainer = function() {
    var container;
    if (this.willOpenInNewWindow && (container = this.createWindowContainer())) {
        this.container = container;
    } else {
        this.willOpenInNewWindow = false;
        if (this.container) { // there is an old window or BodyWrapper left
            this.container.uninit();
        }
        this.container = this.createBodyWrapperContainer();
    }
}

LOG.LogRunner.prototype.appendLoggerNow = function() {
    if (this.appendLoggerNowCaller) {
        LOG.removeEventListener(window, 'load', this.appendLoggerNowCaller);
        delete this.appendLoggerNowCaller;
    }
    this.createContainer();
    this.createLogger(this.container.doc);
    this.container.appendChild(LOG.logger.element);
    LOG.logger.setInNewWindow(this.willOpenInNewWindow);
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
        bodyWrapper.lock('1.3em');
    } else {
        bodyWrapper.unlock();
    }
    if (LOG.logger) {
        LOG.logger.setCollapsed(collapsed);
    }
    this.collapsed = collapsed;
}

LOG.LogRunner.prototype.onLoggerCollapseToggleClick = function() {
    this.setCollapsed(this.container, !this.collapsed);
}

LOG.LogRunner.prototype.onLoggerNewWindowToggleClick = function() {
    this.deleteContainer();
    this.willOpenInNewWindow = !this.willOpenInNewWindow;
    this.appendLogger();
    LOG.logger.focus();
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
    if (event.altKey && event.shiftKey) {
        if (chr == 'm') {
            if (!LOG.logger) {
                this.stopDebugging = false;
                this.createAndAppendLogger();
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
    this.container.show();
    LOG.logger.focus();
}

LOG.LogRunner.prototype.hide = function() {
    this.container.hide();
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
    if (LOG.getButtonFromEvent(event) == 'left' && event.ctrlKey && event.shiftKey) {
        LOG.nextClickShouldBeStopped = true;
        var element = LOG.getElementFromEvent(event);
        LOG.logger.focusValue(element, undefined, event.altKey);
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
