if (!LOG.LogRunner) {
    LOG.LogRunner = function() {};
}

LOG.LogRunner.prototype.init = function() {
    this.doc = document;
    this.willOpenInNewWindow = false;
    
    if (this.doc.body) {
        this.appendLogger();
    } else {
        LOG.addEventListener(window, 'load', (function(me) { return function() { me.appendLogger() } })(this));
    }
}

LOG.LogRunner.prototype.appendLogger = function() {
    this.logger = new LOG.Logger;
    this.logger.init(this.doc, this.willOpenInNewWindow);
    this.logger.onnewwindowtoggleclick = (function(me) { return function() { me.onLoggerNewWindowToggleClick() } })(this);
    
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
                this.ownerDocument = document;
                return document;
            }
        }
        this.ownerDocument = this.window.document;
        this.ownerDocument.open();
        this.ownerDocument.write('<html><head><style> BODY { margin: 0em }</style></head><body></body></html>');
        this.ownerDocument.close();
        this.ownerDocument.title = 'Log: ' + window.document.title;
        
        return this.window.document;
    } else {
        if (this.window) {
            this.window.close();
        }
        delete this.window;
        this.ownerDocument = document;
        return document;
    }
}


LOG.LogRunner.prototype.deleteElement = function() {
    if (this.bodyWrapper) {
        this.bodyWrapper.uninit();
        delete this.bodyWrapper;
    }
}


LOG.LogRunner.prototype.close = function() {
    if (!this.elementCreated || this.stopDebugging) {
        return;
    }
    this.deleteElement();
    this.stopDebugging = true;
}

LOG.LogRunner.prototype.hide = function() {
    if (this.bodyWrapper) {
        this.bodyWrapper.hide();
    }
}

LOG.LogRunner.prototype.show = function() {
    if (this.bodyWrapper) {
        this.bodyWrapper.show();
    }
}

LOG.LogRunner.prototype.onNewWindowClick = function(event) {
    LOG.stopPropagation(event);
    LOG.preventDefault(event);
    this.willOpenInNewWindow = !this.willOpenInNewWindow;
    this.deleteElement();
    this.prepareNewDocument();
    this.createElement();
    LOG.addCookie('LOG_IN_NEW_WINDOW', this.willOpenInNewWindow ? 'true' : 'false', 30);
}

