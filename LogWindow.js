LOG.LogWindow = function() {
    this.window = window.open('', 'LOG_logWindow', 'resizable=yes,scrollbars=yes,status=yes');
    if (!this.window) {
        throw "Cannot create window";
    }
    this.doc = this.window.document;
    this.doc.open();
    this.doc.write('<html><head><style> BODY { margin: 0em; overflow: hidden; }</style></head><body></body></html>');
    this.doc.close();
    this.doc.title = 'Log: ' + window.document.title;
    if (LOG.isGecko) {
        this.window.onunload = this.caller('onUnload');
    } else {
        this.doc.body.onunload = this.caller('onUnload');
    }
    this.doc.body.onkeydown = LOG.createEventHandler(this.doc, this, 'onKeyDown');
}

LOG.setTypeName(LOG.LogWindow, 'LOG.LogWindow');

LOG.LogWindow.prototype.caller = function(methodName) {
    var me = this;
    return function() {
       return me[methodName].apply(me, arguments);
    }
}

LOG.LogWindow.prototype.show = function() {
    this.window.focus();
}

LOG.LogWindow.prototype.hide = function() {
}

LOG.LogWindow.prototype.uninit = function() {
    this.window.close();
}

LOG.LogWindow.prototype.onKeyDown = function(event) {
    if (this.onkeydown) {
        return this.onkeydown(event);
    }
}

LOG.LogWindow.prototype.onUnload = function(event) {
    if (this.onunload) {
        return this.onunload(event);
    }
}

LOG.LogWindow.prototype.appendChild = function(elementToWrap) {
    this.doc.importNode(elementToWrap, true);
    this.doc.body.appendChild(elementToWrap);
}
