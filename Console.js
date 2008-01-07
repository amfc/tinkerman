LOG.Class('Console');

LOG.Console.prototype.init = function(doc) {
    this.maxCount = 1000;
    this.append = true;
    this.stopDebugging = false;
    this.n = 0;
    this.doc = doc;
    this.stackedMode = true;
    this.count = 0;
    this.element = LOG.createElement(doc, 'div');
}

LOG.Console.prototype.getWindow = function() {
    if (this.window) {
        return this.window;
    } else {
        return window;
    }
}

LOG.Console.prototype.appendRow = function(messageHtmlFragment, title, newLineAfterTitle, titleColor) {
    var newRow = this.doc.createElement('div');
    if (this.stopDebugging) {
        return;
    }
    //~ if (!this.elementCreated) {
        //~ this.createElement();
        //~ if (dontOpen) {
            //~ this.hide();
        //~ }
    //~ }
    //~ if (this.hidden && !dontOpen) {
        //~ this.show();
    //~ }
    //~ if (!dontOpen) {
        //~ this.panel.setSelected(true);
    //~ } else if (!console.panel.selected) {
        //~ this.panel.setChanged(true);
    //~ }
    if (this.count >= this.maxCount) {
        if (!this.append) {
            this.element.removeChild(this.element.lastChild);
        } else {
            this.element.removeChild(this.element.firstChild);
        }
    } else {
        this.count++;
    }
    this.n++;
    newRow.style.fontFamily = 'terminus, monospace';
    newRow.style.fontSize = '9px';
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
    em.appendChild(this.doc.createTextNode(this.n));
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
