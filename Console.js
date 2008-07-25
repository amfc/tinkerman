LOG.Console = function(doc) {
    this.maxCount = 1000;
    this.append = true;
    this.stopDebugging = false;
    this.doc = doc;
    this.stackedMode = true;
    this.count = 0;
    this.element = LOG.createElement(doc, 'div');
}

LOG.setTypeName(LOG.Console, 'LOG.Console');

LOG.Console.prototype.getWindow = function() {
    if (this.window) {
        return this.window;
    } else {
        return window;
    }
}

LOG.Console.prototype.appendRow = function(messageHtmlFragment, title, newLineAfterTitle, titleColor, dontOpen) {
    var newRow = this.doc.createElement('div');
    if (this.stopDebugging) {
        return;
    }
    if (this.count >= this.maxCount) {
        if (!this.append) {
            this.element.removeChild(this.element.lastChild);
        } else {
            this.element.removeChild(this.element.firstChild);
        }
    } else {
        this.count++;
    }
    LOG.n++;
    newRow.style.fontFamily = 'terminus, monospace';
    newRow.style.color = 'black';
    newRow.style.borderBottom = '1px solid #aaaaaa';
    if (LOG.isGecko) {
        newRow.style.whiteSpace = '-moz-pre-wrap';
    } else {
        newRow.style.whiteSpace = 'pre'; // FIXME: doesn't seem to work in IE
    }
    newRow.style.padding = '2px';
    if (this.count & 1) {
        newRow.style.backgroundColor = '#faffff';
    } else {
        newRow.style.backgroundColor = '#fff3f2';
    }
    var em = this.doc.createElement('em');
    em.appendChild(this.doc.createTextNode(LOG.n));
    newRow.appendChild(em);
    newRow.appendChild(this.doc.createTextNode(': '));
    
    if (title) {
        var strong = this.doc.createElement('strong');
        if (titleColor) {
            strong.style.color = titleColor;
        }
        strong.appendChild(this.doc.createTextNode(title + ': ' + (newLineAfterTitle ? '\n' : '')));
        newRow.appendChild(strong);
    }
    newRow.appendChild(messageHtmlFragment);
    if (!this.append) {
        this.element.insertBefore(newRow, this.element.firstChild);
    } else {
        this.element.appendChild(newRow);
        this.element.parentNode.scrollTop = this.element.parentNode.scrollHeight - this.element.parentNode.offsetHeight + 1;
    }
    if (this.onrowappend) {
        this.onrowappend(dontOpen);
    }
}

LOG.Console.prototype.clear = function() {
    this.count = 0;
    while (this.element.childNodes.length > 0) {
        this.element.removeChild(this.element.firstChild);
    }
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
