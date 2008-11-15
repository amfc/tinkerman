LOG.ConsoleRow = function(doc, number, title, titleColor, logItem, newLineAfterTitle, isOdd) {
    this.element = LOG.createElement(doc, 'div',
        {
            style: {
                fontFamily: 'terminus, monospace',
                color: 'black',
                borderBottom: '1px solid #aaa',
                whiteSpace: LOG.isGecko ? '-moz-pre-wrap' : 'pre',
                padding: '2px',
                backgroundColor: isOdd ? '#faffff' : '#fff3f2'
            }
        },
        [
            LOG.createElement(doc, 'em', null,
                [
                    number
                ]
            ),
            ': ',
            title ? LOG.createElement(doc, 'strong',
                {
                    style: {
                        color: titleColor ? titleColor : null
                    }
                },
                [
                    title + ': ' + (newLineAfterTitle ? '\n' : '')
                ]
            ) : null,
            logItem.element
        ]
    );
    this.logItem = logItem;
}

LOG.setTypeName(LOG.ConsoleRow, 'LOG.ConsoleRow');

LOG.Console = function(doc) {
    this.maxCount = 100;
    this.stopDebugging = false;
    this.doc = doc;
    this.stackedMode = true;
    this.element = LOG.createElement(doc, 'div');
    this.rows = [];
    this.rowsToAppend = [];
    this.rowsToRemove = [];
    this.nextWillBeOdd = true;
}

LOG.setTypeName(LOG.Console, 'LOG.Console');

LOG.Console.prototype.getWindow = function() {
    if (this.window) {
        return this.window;
    } else {
        return window;
    }
}

LOG.Console.prototype.scrollToBottom = function() {
    this.element.parentNode.scrollTop = this.element.parentNode.scrollHeight - this.element.parentNode.offsetHeight;
}

LOG.Console.prototype.appendMany = function() {
    for (var i = 0; i < this.rowsToAppend.length; ++i) {
        this.element.appendChild(this.rowsToAppend[i].element);
    }
    for (var i = 0; i < this.rowsToRemove.length; ++i) {
        this.element.removeChild(this.rowsToRemove[i].element);
    }
    this.rowsToAppend = [];
    this.rowsToRemove = [];
    this.scrollToBottom();
}

LOG.Console.prototype.appendRow = function(logItem, title, newLineAfterTitle, titleColor, dontOpen) {
    if (this.stopDebugging) {
        return;
    }
    if (this.rows.length >= this.maxCount) {
        this.rowsToRemove.push(this.rows[0]);
        this.rows.shift();
    }
    LOG.n++;
    var row = new LOG.ConsoleRow(this.doc, LOG.n, title, titleColor, logItem, newLineAfterTitle, this.nextWillBeOdd);
    this.nextWillBeOdd = !this.nextWillBeOdd;
    this.rows.push(row);
    this.rowsToAppend.push(row);
    if (this.onrowappend) {
        this.onrowappend(dontOpen);
    }
    if (!this.waiting) {
        this.waiting = true;
        var me = this;
        setTimeout(function() { me.waiting = false; me.appendMany(); }, 100);
    }
}

LOG.Console.prototype.getLastLogItemLogged = function() {
    return this.rows[this.rows.length - 1].logItem;
}

LOG.Console.prototype.clear = function() {
    for (var i = 0; i < this.rows.length; ++i) {
        if (this.rows[i].onremove) {
            this.rows[i].onremove();
        }
        this.element.removeChild(this.rows[i].element);
    }
    this.rows = [];
}

LOG.Console.prototype.focus = function() {
    this.commandEditor.focus();
}

LOG.Console.prototype.newLogItem = function(type, params) {
    var doc = this.doc;
    function subtype() {
        type.apply(this, [doc].concat(params));
    }
    subtype.prototype = type.prototype;
    var obj = new subtype;
    return obj;
}
