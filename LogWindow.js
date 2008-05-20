LOG.LogWindow = function(callback) {
    this.window = window.open('', 'LOG_logWindow', 'resizable=yes,scrollbars=yes,status=yes');
    if (!this.window) {
        throw "Cannot create window";
    }
    this.doc = this.window.document;
    this.doc.open();
    var me = this;
    this.doc.write(
        LOG.getDefaultHtml(
            function() {
                me.doc.title = 'Log: ' + window.document.title;
                if (LOG.isGecko) {
                    me.window.onunload = me.caller('onUnload');
                } else {
                    me.doc.body.onunload = me.caller('onUnload');
                }
                me.doc.body.onkeydown = LOG.createEventHandler(me.doc, me, 'onKeyDown');
                callback(me);
            }
        )
    );
    this.doc.close();
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
    this.doc.body.appendChild(elementToWrap);
}
