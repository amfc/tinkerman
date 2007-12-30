// LOG

if (typeof LOG != 'undefined') { // this file is being reloaded
    LOG.wasOpen = LOG.LogObject.elementCreated && !LOG.LogObject.hidden;
    LOG.LogObject.close();
    LOG.removeAllEventListeners();
} else {
    var LOG = {};
    LOG.dontLogResult = {}; // This is used internally to avoid logging some things
    LOG.clickedMessages = [];
}

LOG.pageObjectName = 'page';

// ---- VAR functions used by LOG ----

// Gets the index of an element of an array or false if it doesn't exist
LOG.indexOf = function(arr, item) {
    for (var i = 0; i < arr.length; i++) {
        if (arr[i] == item) {
            return i;
        }
    }
    return -1;
}

// ---- End of VAR functions used by LOG

// ---- DOM functions used by LOG ----

LOG.userAgent = navigator.userAgent.toLowerCase(); 
LOG.isKonq = LOG.userAgent.indexOf('konqueror') != -1;
LOG.isGecko = !LOG.isKonq && LOG.userAgent.indexOf('gecko') != -1;
LOG.isOpera = LOG.userAgent.indexOf('opera') != -1;
LOG.isIE = LOG.userAgent.indexOf('msie') != -1 && !LOG.isOpera;


LOG.preventDefault = function(event) {
    if (event.preventDefault) {
        event.preventDefault();
    } else {
        event.returnValue = false;
    }
}

LOG.globalContext = function() {
    this.evaluate = function(code, additionalVariables) {
        for (var name in additionalVariables) {
            eval("var " + name + " = additionalVariables['" + name + "'];");
        }
        return eval(code);
    }
    this.getNames = function() {
        return [];
    }
}

LOG.stopPropagation = function(event) {
    if (event.stopPropagation) {
        event.stopPropagation();
    } else {
        event.cancelBubble = true;
    }
}

if (!LOG.loaded) { // We do this to keep them even if the script is reloaded
    LOG.eventListeners = {};
}

LOG.addEventListener = function(element, eventString, handler, useCapture) {
    if (!LOG.eventListeners[eventString]) {
        LOG.eventListeners[eventString] = [];
    }
    var item = {
        handler: handler,
        element: element,
        useCapture: !!useCapture
    };
    LOG.eventListeners[eventString].push(item);
    if (element.addEventListener) {
        element.addEventListener(eventString, handler, !!useCapture);
    } else {
        element.attachEvent("on" + eventString, handler);
    }
}

LOG.removeEventListener = function(element, eventString, handler, useCapture) {
    var list = LOG.eventListeners[eventString];
    var pos;
    for (var i = 0; i < list.length; ++i) {
        if (list[i].handler == handler && list[i].element == element && list[i].useCapture == useCapture) {
            pos = i;
            break;
        }
    }
    list.splice(pos, 1);
    if (list.length == 0) {
        delete LOG.eventListeners[eventString];
    }
    if (element.addEventListener) {
        element.removeEventListener(eventString, handler, useCapture);
    } else {
        element.detachEvent("on" + eventString, handler);
    }
}

LOG.removeAllEventListeners = function() {
    var eventString, list, item;
    for (eventString in LOG.eventListeners) {
        list = LOG.eventListeners[eventString];
        while (list.length > 0) {
            item = list[0];
            LOG.removeEventListener(item.element, eventString, item.handler, item.useCapture);
        }
    }
}

// These are used to add or remove an event handler to an object preserving the "this" reference

if (!LOG.loaded) { // We do this to keep them even if the script is reloaded
    LOG.objEventListeners = [];
}

LOG.addObjEventListener = function(obj, element, eventString, handler) {
    var pos = LOG.objEventListeners.length;
    var item = {
        obj: obj,
        element: element,
        eventString: eventString,
        handler: handler,
        internalHandler: new Function('event', "LOG.runObjEventHandler(event, " + pos + ")")
    };
    LOG.objEventListeners[pos] = item
    LOG.addEventListener(element, eventString, item.internalHandler);
}

LOG.removeObjEventListener = function(obj, element, eventString, handler) {
    var list = LOG.objEventListeners, item, i;
    
    for (i = 0; i < list.length; i++) {
        item = list[i];
        if (item && item.obj == obj && item.element == element && item.eventString == eventString && item.handler == handler) {
            LOG.removeEventListener(element, eventString, item.internalHandler);
            delete(list[i]);
            break;
        }
    }
}

LOG.runObjEventHandler = function(event, number) {
    LOG.objEventListeners[number].handler.call(LOG.objEventListeners[number].obj, event);
}

LOG.getWindowInnerSize = function() {
    var document = LOG.LogObject.ownerDocument;
    var w, h;
    if (self.innerHeight) { // all except Explorer
        w = self.innerWidth;
        h = self.innerHeight;
    } else if (document.documentElement && document.documentElement.clientHeight) { // Explorer 6 Strict Mode
        w = document.documentElement.clientWidth;
        h = document.documentElement.clientHeight;
    } else if (document.body) { // other
        w = document.body.clientWidth;
        h = document.body.clientHeight;
    }
    return {w: w, h: h}
}

LOG.getScrollBarPositions = function() {
    var document = LOG.LogObject.ownerDocument;
    var x, y;
    if (typeof document.documentElement != 'undefined' && typeof document.documentElement.scrollLeft != 'undefined') {
        x = document.documentElement.scrollLeft;
        y = document.documentElement.scrollTop;
    } else if (typeof window.pageXOffset != 'undefined') {
        x = window.pageXOffset;
        y = window.pageYOffset;
    } else {
        x = document.body.scrollLeft;
        y = document.body.scrollTop;
    }
    return {x: x, y: y}
}

// Gets the absolute position of the element from the body
// It takes into account any element scroll position
LOG.getPosition = function(obj) {
    var left = 0;
    var top = 0;
    if (obj.offsetParent) {
        while (obj.offsetParent) {
            left += obj.offsetLeft - obj.scrollLeft;
            top += obj.offsetTop - obj.scrollTop;
            obj = obj.offsetParent;
        }
    }
    left += LOG.getBody().scrollLeft;
    top += LOG.getBody().scrollTop;
    return {x: left, y: top};
}


// Takes into account if the LOG wrapper element is active and either returns the true document's body or LOG's
LOG.getBody = function(element) {
    if (LOG.LogObject.wrapperElement) {
        return LOG.LogObject.wrapperTopElement;
    } else {
        return document.body;
    }
}

// This works both with <input type=text>s and <textarea>s
// returns an array [start, end]
LOG.getTextInputSelection = function(element) {
    var document = LOG.LogObject.ownerDocument;
    if (LOG.isIE) {
        var start = null, end = null;
        var selection = document.selection.createRange();
        
        var elementSelection;
        if (element.tagName.toLowerCase() == 'textarea') {
            elementSelection = selection.duplicate();
            elementSelection.moveToElementText(element);
        } else { // input type=text
            elementSelection = element.createTextRange();
        }
        try {
            for (var i = 0; i <= element.value.length; i++) {
                if (i > 0) {
                    elementSelection.move('character');
                }
                if (elementSelection.compareEndPoints('StartToStart', selection) == 0) {
                    start = i;
                    if (end !== null) {
                        break;
                    }
                }
                if (elementSelection.compareEndPoints('StartToEnd', selection) == 0) {
                    end = i;
                    if (start !== null) {
                        break;
                    }
                }
            }
        } catch (e) { // if the selection is collapsed explorer throws an exception
        }
        return [start === null ? 0 : start, end === null ? 0 : end];
    } else {
        return [element.selectionStart, element.selectionEnd];
    }
}

// This works both with <input type=text>s and <textarea>s
// range is an array [start, end]
LOG.setTextInputSelection = function(element, range) {
    if (LOG.isIE) {
        var selection = element.createTextRange();
        var i;
        var distance = element.value.length - range[1];
        if (distance < 0) {
            distance = 0;
        }
        for (i = 1; i <= distance; i++) {
            selection.moveEnd('character', -1);
        }
        distance = range[0];
        if (distance > element.value.length) {
            distance = element.value.length;
        }
        for (i = 1; i <= distance; i++) {
            selection.moveStart('character');
        }
        selection.select();
    } else {
        element.selectionStart = range[0];
        element.selectionEnd = range[1];
    }
}

LOG.createElement = function(ownerDocument, tagName, attributes, childNodes) {
    var element = ownerDocument.createElement(tagName);
    var styleProperties, item;
    var type;
    for (var attribute in attributes) {
        type = typeof attributes[attribute];
        if (type == 'function' || type == 'boolean') {
            element[attribute] = attributes[attribute];
        } else if (attribute == 'style' && typeof attributes[attribute] == 'object') {
            styleProperties = attributes[attribute];
            for (item in styleProperties) {
                element.style[item] = styleProperties[item];
            }
        } else if (attribute == 'class') {
            element.className = attributes[attribute];
        } else if (attributes[attribute] === null) {
            continue;
        } else {
            element.setAttribute(attribute, attributes[attribute]);
        }
    }
    if (childNodes) {
        for (var i = 0; i < childNodes.length; ++i) {
            if (childNodes[i] === null) {
                continue;
            } else if (typeof childNodes[i] == 'string' || typeof childNodes[i] == 'number') {
                element.appendChild(ownerDocument.createTextNode(childNodes[i]));
            } else {
                element.appendChild(childNodes[i]);
            }
        }
    }
    return element;
}


// Creates a function which will be called as a method from obj which will
//  have event as a parameter but will call the callback with 2 parameters:
//  event and the extra parameter passed. This also handles the missing event
//  parameter from explorer.
LOG.createEventHandler = function(obj, methodName, parameter) {
    return function(event) {
        if (!event) {
            event = LOG.LogObject.getWindow().event;
        }
        obj[methodName].call(obj, event, parameter);
    }
}

LOG.getButtonFromEvent = function(event) {
    if (event.button == 2) {
        return "right";
    } else if (LOG.isGecko) {
        if (event.button == 0) {
            return "left";
        } else {
            return "middle";
        }
    } else {
        if (event.button == 1) {
            return "left";
        } else {
            return "middle";
        }
    }
}

LOG.getElementFromEvent = function(event) {
    if (event.target) {
        return event.target;
    } else {
        return event.srcElement;
    }
}

// ---- End of DOM functions used by LOG ----

// ---- COOKIE functions used by LOG ----

LOG.addCookie = function(name, value, days) {
    var path;
    if (LOG.isIE) {
        path = '/';
    } else {
        path = document.location.pathname;
    }
    var expires = '';
    if (days) {
        var date = new Date();
        date.setTime(date.getTime() + (days * 24 * 60 * 60 * 1000));
        expires = '; expires=' + date.toGMTString();
    }
    document.cookie = name + '=' + escape(value) + expires + '; path=' + path;
}

LOG.getCookie = function(name) {
    var nameEQ = name + '=';
    var cookieStrings = document.cookie.split(';');
    var cookieString;
    for (var i = 0; i < cookieStrings.length; ++i) {
        cookieString = cookieStrings[i];
        while (cookieString.charAt(0) == ' ') {
            cookieString = cookieString.substring(1);
        }
        if (cookieString.indexOf(nameEQ) == 0) {
            return unescape(cookieString.substring(nameEQ.length));
        }
    }
    return null;
}

// ---- End of COOKIE functions used by LOG ----

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

LOG.onUnload = function() {
    LOG.addCookie('LOG_DEBUG_MODE', DEBUG_MODE ? "true" : "false", 30);
    LOG.addCookie('LOG_OPEN', LOG.LogObject.elementCreated && !LOG.LogObject.hidden ? "true" : "false", 30);
    LOG.addCookie('LOG_HISTORY', LOG.getSerializedHistory(), 30);
    LOG.addCookie('LOG_SIZE', LOG.LogObject.wrapperSize, 30);
    var openConsoles = '';
    var consoles = LOG.LogObject.consoles;
    for (var consoleName in consoles) {
        if (consoles[consoleName].panel.selected) {
            if (openConsoles) {
                openConsoles += ',';
            }
            openConsoles += consoleName;
        }
    }
    LOG.addCookie('LOG_OPEN_CONSOLES', openConsoles, 30);
    if (LOG.isGecko) {
        LOG.removeAllEventListeners();
    }
}

LOG.addEventListener(window, 'unload', LOG.onUnload);

if (!LOG.LogPanel) {
    LOG.LogPanel = function() {}
}

LOG.LogPanel.prototype.init = function(name, selected) {
    var doc = LOG.LogObject.ownerDocument;
    this.labelElement = LOG.createElement(doc, 'span',
        {
            style: {
                cursor: 'pointer'
            },
            onclick: LOG.createEventHandler(this, 'onLabelClick')
        },
        [ name ]
    );
    
    this.panelElement = LOG.createElement(doc, 'td',
        {
            style: {
                width: '1%',
                height: '100%',
                borderLeft: '1px solid gray',
                display: selected ? '' : 'none'
            }
        },
        [
            LOG.createElement(doc, 'div',
                {
                    style: {
                        height: '100%',
                        width: '100%',
                        position: 'relative'
                    }
                },
                [
                    this.contentElement = LOG.createElement(doc, 'div',
                        {
                            style: {
                                left: '0',
                                top: '0',
                                width: '100%',
                                height: '100%',
                                overflow: 'auto',
                                position: 'absolute',
                                borderTop: '1px solid #ccc',
                                borderBottom: '1px solid #ccc',
                                backgroundColor: 'white',
                                fontSize: '10px',
                                padding: '5px',
                                fontWeight: 'normal',
                                backgroundColor: '#fcfcfc',
                                MozBoxSizing: 'border-box',
                                boxSizing: 'border-box',
                                fontFamily: 'terminus, lucida console, monospace'
                            }
                        }
                    )
                ]
            )
        ]
    );
    
    this.setSelected(selected);
}

LOG.LogPanel.prototype.onLabelClick = function(selected) {
    this.setSelected(!this.selected);
}

LOG.LogPanel.prototype.setSelected = function(selected) {
    if (selected) {
        this.labelElement.style.textDecoration = 'underline';
        this.labelElement.style.fontWeight = 'bold';
        this.panelElement.style.display = '';
        if (this.onselect) {
            this.onselect();
        }
        this.setChanged(false);
    } else {
        this.labelElement.style.textDecoration = '';
        this.labelElement.style.fontWeight = '';
        this.panelElement.style.display = 'none';
    }
    this.selected = selected;
}

LOG.LogPanel.prototype.setChanged = function(changed) {
    this.labelElement.style.color = changed ? 'red' : '';
}

LOG.LogObject = new function() {
    this.elementCreated = false;
    this.dragging = false;
    this.maxCount = 1000;
    this.append = true;
    this.stopDebugging = false;
    this.paused = false;
    this.n = 0;
    this.lastMessage = null;
    this.contexts = {};
    this.ownerDocument = document;
    this.stackedMode = true;
    
    this.log = function(message, title, newLineAfterTitle, consoleName, dontOpen, stackedMode) {
        var console;
        if (!this.elementCreated) {
            this.createElement();
            if (dontOpen) {
                this.hide();
            }
        }
        if (consoleName) {
            console = this.addConsole(consoleName);
        } else {
            console = this.console;
        }
        this.lastMessage = message;
        this.appendRow(LOG.getValueAsHtmlElement(message, stackedMode == undefined ? this.stackedMode : stackedMode, undefined, true, true), title, newLineAfterTitle, null, console, dontOpen);
        return message;
    }
    
    this.getWindow = function() {
        if (this.window) {
            return this.window;
        } else {
            return window;
        }
    }
    
    this.appendRow = function(messageHtmlFragment, title, newLineAfterTitle, titleColor, console, dontOpen) {
        var newRow = this.ownerDocument.createElement('div');
        if (this.stopDebugging || this.paused) {
            return;
        }
        if (!this.elementCreated) {
            this.createElement();
            if (dontOpen) {
                this.hide();
            }
        }
        if (!console) {
            console = this.console;
        }
        if (this.hidden && !dontOpen) {
            this.show();
        }
        if (!dontOpen) {
            console.panel.setSelected(true);
        } else if (!console.panel.selected) {
            console.panel.setChanged(true);
        }
        if (console.count >= this.maxCount) {
            if (!this.append) {
                console.panel.contentElement.removeChild(console.panel.contentElement.lastChild);
            } else {
                console.panel.contentElement.removeChild(console.panel.contentElement.firstChild);
            }
        } else {
            console.count++;
        }
        this.n++;
        newRow.style.fontFamily = 'monospace';
        newRow.style.fontSize = '9pt';
        newRow.style.color = 'black';
        newRow.style.borderBottom = '1px solid #aaaaaa';
        if (LOG.isGecko) {
            newRow.style.whiteSpace = '-moz-pre-wrap';
        } else {
            newRow.style.whiteSpace = 'pre';
        }
        newRow.style.padding = '2px';
        if (console.count & 1) {
            newRow.style.backgroundColor = '#faffff';
        } else {
            newRow.style.backgroundColor = '#fff3f2';
        }
        var em = this.ownerDocument.createElement('em');
        em.appendChild(this.ownerDocument.createTextNode(this.n));
        newRow.appendChild(em);
        newRow.appendChild(this.ownerDocument.createTextNode(': '));
        
        if (title) {
            var strong = this.ownerDocument.createElement('strong');
            if (titleColor) {
                strong.style.color = titleColor;
            }
            strong.appendChild(this.ownerDocument.createTextNode(title + ': ' + (newLineAfterTitle ? '\n' : '')));
            newRow.appendChild(strong);
        }
        newRow.appendChild(messageHtmlFragment);
        if (!this.append) {
            console.panel.contentElement.insertBefore(newRow, console.panel.contentElement.firstChild);
        } else {
            console.panel.contentElement.appendChild(newRow);
            console.panel.contentElement.scrollTop = console.panel.contentElement.scrollHeight - console.panel.contentElement.offsetHeight + 1;
        }
    }
    
    this.onClearClick = function(event) {
        LOG.stopPropagation(event);
        LOG.preventDefault(event);
        if (this.console.panel.selected) {
            this.clear(this.console);
        }
        for (var consoleName in this.consoles) {
            if (this.consoles[consoleName].panel.selected) {
                this.clear(this.consoles[consoleName]);
            }
        }
    }
    
    this.clear = function(console) {
        if (!this.elementCreated) {
            return;
        }
        if (!console) {
            console = this.console;
        } else {
            if (console == this.consoles.html || console == this.consoles.page) {
                return; // Disabled clearing html and page consoles
            }
        }
        console.panel.setChanged(false);
        console.count = 0;
        while (console.panel.contentElement.childNodes.length > 0) {
            console.panel.contentElement.removeChild(console.panel.contentElement.firstChild);
        }
    }
    
    this.close = function() {
        if (!this.elementCreated || this.stopDebugging) {
            return;
        }
        this.deleteElement();
        this.stopDebugging = true;
    }
    
    this.deleteElement = function() {
        if (!this.elementCreated) {
            return;
        }
        if (this.wrapperElement) {
            this.unwrapBody();
        }
        if (this.htmlLogItem) {
            delete this.htmlLogItem;
        }
        if (this.pageLogItem) {
            delete this.pageLogItem;
        }
        this.elementCreated = false;
    }
    
    this.onCloseClick = function(event) {
        this.close();
        LOG.stopPropagation(event);
        LOG.preventDefault(event);
    }
    
    this.onPauseClick = function(event) {
        this.paused = !this.paused;
        if (this.paused) {
            this.pauseLink.firstChild.data = 'resume';
        } else {
            this.pauseLink.firstChild.data = 'pause';
        }
        LOG.stopPropagation(event);
        LOG.preventDefault(event);
    }
    
    this.onHideClick = function(event) {
        this.hide();
        LOG.stopPropagation(event);
        LOG.preventDefault(event);
    }
    
    this.hide = function() {
        this.hidden = true;
        if (this.wrapperBottomElement) {
            this.wrapperBottomElement.style.display = 'none';
            this.wrapperTopElement.style.height = '100%';
        }
    }
    
    this.show = function() {
        this.hidden = false;
        if (this.wrapperBottomElement) {
            this.wrapperBottomElement.style.display = '';
            this.setWrapperSize(this.wrapperSize);
        }
    }
    
    this.onToggleTextAreaClick = function(event) {
        this.textAreaBig = !this.textAreaBig;
        
        var oldInput = null;
        if (this.input) {
            oldInput = this.input;
        }
        
        this.input = this.createInput(this.textAreaBig);
        
        LOG.removeObjEventListener(this, oldInput, 'keydown', this.onInputKeyDown);
        LOG.removeObjEventListener(this, oldInput, 'mousedown', LOG.stopPropagation);
        oldInput.parentNode.replaceChild(this.input, oldInput);
        
        
        if (this.textAreaBig) {
            this.inputTableContainer.style.height = '12em';
            this.scrollContainer.style.paddingBottom = '12em';
            this.toggleTextAreaLink.firstChild.data = 'small';
        } else {
            this.inputTableContainer.style.height = '1.8em';
            this.scrollContainer.style.paddingBottom = '1.8em';
            this.toggleTextAreaLink.firstChild.data = 'big';
        }
        
        LOG.stopPropagation(event);
        LOG.preventDefault(event);
    }
    
    this.prepareNewDocument = function() {
        if (LOG.willOpenInNewWindow) {
            if (!this.window || this.window.closed) {
                this.window = window.open('', 'LOG_logWindow', 'resizable=yes,scrollbars=yes,status=yes');
                if (!this.window) {
                    LOG.willOpenInNewWindow = false;
                    this.ownerDocument = document;
                    return document;
                }
            }
            this.ownerDocument = this.window.document;
            this.ownerDocument.open();
            this.ownerDocument.write('<html><head><style>a { text-decoration: underline; cursor: pointer; color: #36a; }\n a:hover { color: #36f; }\n * { font-size: 9pt; font-family: monospace, verdana, sans-serif; } BODY { margin: 0 }</style></head><body></body></html>');
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
    
    this.onNewWindowClick = function(event) {
        LOG.stopPropagation(event);
        LOG.preventDefault(event);
        LOG.willOpenInNewWindow = !LOG.willOpenInNewWindow;
        this.deleteElement();
        this.prepareNewDocument();
        this.selectContextCombo = this.ownerDocument.createElement('select');
        for (var item in this.contexts) {
            this.contexts[item].optionElement = null;
            this.setContext(item, this.contexts[item].name, this.contexts[item].contextObject);
        }
        this.createElement();
        LOG.addCookie('LOG_IN_NEW_WINDOW', LOG.willOpenInNewWindow ? 'true' : 'false', 30);
    }
    
    this.onDragKeypress = function(event) {
        if (event.keyCode == 27) {
            this.endDrag();
        }
    }
    
    this.onResizeHandleMousedown = function(event) {
        this.dragging = true;
        this.originalDelta = event.clientY - this.wrapperBottomElement.offsetTop;
        this.element.style.borderColor = 'black';
        LOG.addObjEventListener(this, document, 'mousemove', this.onMousemove);
        LOG.addObjEventListener(this, document, 'mouseup', this.onMouseup);
        LOG.addObjEventListener(this, document, 'keypress', this.onDragKeypress);
        if (LOG.isIE) {
            LOG.addObjEventListener(this, document, 'selectstart', this.onSelectstart);
        }
        LOG.stopPropagation(event);
        LOG.preventDefault(event);
    }
    
    this.endDrag = function() {
        this.dragging = false;
        this.element.style.borderColor = 'gray';
        LOG.removeObjEventListener(this, document, 'mousemove', this.onMousemove);
        LOG.removeObjEventListener(this, document, 'mouseup', this.onMouseup);
        LOG.removeObjEventListener(this, document, 'keypress', this.onDragKeypress);
        if (LOG.isIE) {
            LOG.removeObjEventListener(this, document, 'selectstart', this.onSelectstart);
        }
    }
    
    this.onSelectstart = function(event) {
        LOG.stopPropagation(event);
        LOG.preventDefault(event);
    }
    
    this.onMousemove = function(event) {
        if (this.dragging) {
            var top = (event.clientY - this.originalDelta) / LOG.getWindowInnerSize().h;
            if (top < 0) {
                top = 0;
            }
            this.setWrapperSize(1 - top);
            return false;
        }
    }
    
    this.onMouseup = function(event) {
        this.endDrag();
    }
    
    this.logAndStore = function(value, source) {
        var pos = LOG.indexOf(LOG.clickedMessages, value);
        if (pos == -1) {
            pos = LOG.clickedMessages.length;
            LOG.clickedMessages[pos] = value;
        }
        
        if (source) {
            LOG.logObjectSource(value, null, this.stackedMode);
        } else {
            this.appendRow(LOG.getValueAsHtmlElement(value, this.stackedMode, undefined, true));
        }
        if (LOG.LogObject.input.value == '' || LOG.LogObject.input.value.match(/^\$[0-9]+$/)) {
            LOG.LogObject.input.value = '$' + pos;
        }
        return;
    }
    
    this.evalScriptAndPrintResults = function($script) {
        var result = this.evalScript($script);
        if (result !== LOG.dontLogResult) {
            if ($script.indexOf('\n') == -1) {
                this.log(result, $script, true);
            } else {
                this.log(result, $script.substr(0, $script.indexOf('\n')) + '...', true);
            }
        }
    }
    
    this.evalScript = function($script) {
        var me = this;
        if ($script == 'help') {
            this.appendRow(
                this.ownerDocument.createTextNode(
                    '\n$0, $1 ... $n: clicked element' +
                    '\n$_: Last logged value' +
                    '\n$E(element): createOutlineFromElement' +
                    '\n$S(object, title): logObjectSource' +
                    '\n$P(object): getObjectProperties'
                ), 'Help'
            );
            return LOG.dontLogResult;
        }
        try {
            var vars = {
                '$_': this.lastMessage,
                '$P': LOG.getObjectProperties,
                '$S': LOG.logObjectSource,
                '$E': LOG.createOutlineFromElement
            };
            for (var i = 0; i < LOG.clickedMessages.length; ++i) {
               vars['$' + i] = LOG.clickedMessages[i];
            }
            return this.contexts[this.selectContextCombo.value].contextObject.evaluate($script, vars);
        } catch (e) {
            var logItem = new LOG.ExceptionLogItem;
            logItem.init(e);
            this.appendRow(
                logItem.element,
                'error ' + $script,
                true,
                'red'
            );
            return LOG.dontLogResult;
        }
    }
    
    this.getNamesStartingWith = function(start, names) {
        var matches = [];
        for (var i = 0; i < names.length; ++i) {
            if (names[i].substr(0, start.length) == start) {
                matches.push(names[i]);
            }
        }
        matches.sort();
        return matches;
    }
    
    this.getCurrentExpression = function() {
        function skipString(quote) {
            for (--startWordPos; startWordPos > 0; --startWordPos) {
                if (value.charAt(startWordPos) == quote && value.charAt(startWordPos - 1) != '\\') {
                    return;
                }
            }
            throw 'unterminated string';
        }
        
        var endWordPos = LOG.getTextInputSelection(this.input)[0];
        var startWordPos = endWordPos;
        var value = this.input.value;
        var depth = 0, chr, bracketDepth = 0;
        while (startWordPos > 0) {
            chr = value.charAt(startWordPos - 1);
            if (chr == ')') {
                ++depth;
            } else if (chr == '(') {
                if (depth == 0) {
                    break;
                }
                --depth;
            } else if (chr == '[') {
                if (bracketDepth == 0) {
                    break;
                }
                --bracketDepth;
            } else if (chr == ']') {
                ++bracketDepth;
            } else if (chr == '\'' || chr == '"') {
                skipString(chr);
            } else if (depth == 0 && !(/^[a-zA-Z0-9_$.]$/.test(chr))) {
                break;
            }
            --startWordPos;
        }
        return value.substr(startWordPos, endWordPos - startWordPos);
    }
    
    this.getCurrentWordAndPosition = function() {
        var endWordPos = LOG.getTextInputSelection(this.input)[0];
        var startWordPos = endWordPos;
        var value = this.input.value;
        var chr;
        while (startWordPos > 0) {
            chr = value.charAt(startWordPos - 1);
            if (!(/^[a-zA-Z0-9_$]$/.test(chr))) {
                break;
            }
            startWordPos--;
        }
        return {
            word: value.substr(startWordPos, endWordPos - startWordPos),
            start: startWordPos,
            end: endWordPos
        }
    }
    
    this.onInputKeyDown = function($event) {
        function getCommonStart(list) {
            var common = list[0];
            var j;
            for (var i = 1; i < list.length; ++i) {
                if (list[i].length < common.length) {
                    common = common.substr(0, list[i].length);
                }
                for (j = 0; j < common.length; ++j) {
                    if (common.charAt(j) != list[i].charAt(j)) {
                        common = common.substr(0, j);
                        break;
                    }
                }
            }
            return common;
        }
        if (!$event) {
            $event = LOG.LogObject.getWindow().event;
        }
        if ($event.keyCode == 13) {
            if (!this.textAreaBig || $event.ctrlKey) {
                if (LOG.history[LOG.history.length - 1] != this.input.value) {
                    LOG.history.push(this.input.value);
                }
                LOG.historyPosition = LOG.history.length;
                this.evalScriptAndPrintResults(this.input.value);
                LOG.stopPropagation($event);
                LOG.preventDefault($event);
                if (!this.textAreaBig) {
                    this.input.value = '';
                }
            } else if (this.textAreaBig) { // We keep indentation in enters
                function getLineFromLeft(value, pos) {
                    var chr, line = '';
                    while (pos >= 0) {
                        chr = value.charAt(pos);
                        if (chr == '\n' || chr == '\r') {
                            break;
                        }
                        line = chr + line;
                        --pos;
                    }
                    return line;
                }
                function getIndentation(line) {
                    var chr;
                    var indentation = '';
                    for (var i = 0; i < line.length; ++i) {
                        chr = line.charAt(i);
                        if (chr != ' ' && chr != '\t') {
                            break;
                        }
                        indentation += chr;
                    }
                    return indentation;
                }
                var pos = LOG.getTextInputSelection(this.input)[0];
                var indentation = getIndentation(getLineFromLeft(this.input.value, pos - 1));
                this.input.value = this.input.value.substring(0, pos) + '\n' + indentation + this.input.value.substring(pos);
                pos += indentation.length + 1;
                LOG.setTextInputSelection(this.input, [pos, pos]);
                LOG.stopPropagation($event);
                LOG.preventDefault($event);
            }
        } else if ($event.keyCode == 27) { // Esc
            this.onHideClick($event);
            LOG.stopPropagation($event);
            LOG.preventDefault($event);
        } else if ($event.keyCode == 9) { // Tab
            LOG.stopPropagation($event);
            LOG.preventDefault($event);
            var currentExpression = this.getCurrentExpression();
            var currentWordAndPosition = this.getCurrentWordAndPosition();
            var names;
            var onlyLocal = false;
            if (currentExpression == currentWordAndPosition.word) {
                names = this.contexts[this.selectContextCombo.value].contextObject.getNames();
                if (this.selectContextCombo.value == 'global' || currentExpression != '') {
                    names = names.concat(
                        names,
                        LOG.getObjectProperties(window),
                        [ 'escape', 'unescape', 'encodeURI', 'decodeURI', 'encodeURIComponent', 'decodeURIComponent', 'isFinite', 'isNaN',
                          'Number', 'eval', 'parseFloat', 'parseInt', 'String', 'Infinity', 'undefined', 'NaN', 'true', 'false'
                        ]
                    );
                    if (LOG.isIE) {
                        names = names.concat(names, ['DEBUG_MODE']);
                    }
                } else {
                    onlyLocal = true;
                }
            } else {
                var script = currentExpression.substr(0, currentExpression.length - currentWordAndPosition.word.length);
                if (script.charAt(script.length - 1) == '.') {
                    script = script.substr(0, script.length - 1);
                }
                var result = this.evalScript(script);
                if (typeof result != 'object' || result == LOG.dontLogResult) {
                    return;
                }
                names = LOG.getObjectProperties(result);
            }
            var matches = this.getNamesStartingWith(currentWordAndPosition.word, names);
            if (matches.length == 0) {
                return;
            }
            if (matches.length > 1) {
                this.log(matches, onlyLocal ? 'Matches in ' + this.contexts[this.selectContextCombo.value].name : 'Matches');
            }
            var commonStart = getCommonStart(matches);
            if (commonStart.length > currentWordAndPosition.word.length) {
                this.input.value = this.input.value.substr(0, currentWordAndPosition.end) +
                    commonStart.substr(currentWordAndPosition.word.length) +
                    this.input.value.substr(currentWordAndPosition.end)
                ;
                var commonStartPos = currentWordAndPosition.end + commonStart.length - currentWordAndPosition.word.length;
                LOG.setTextInputSelection(this.input, [commonStartPos, commonStartPos]);
            }
        } else if ($event.keyCode == 38 && (!this.textAreaBig || $event.ctrlKey)) { // Up
            if (LOG.historyPosition > 0) {
                --LOG.historyPosition;
                this.input.value = LOG.history[LOG.historyPosition];
            }
            LOG.stopPropagation($event);
            LOG.preventDefault($event);
        } else if ($event.keyCode == 40 && (!this.textAreaBig || $event.ctrlKey)) { // Down
            if (LOG.historyPosition == LOG.history.length - 1) {
                this.input.value = '';
                LOG.historyPosition == LOG.history.length;
            } else if (LOG.historyPosition != -1 && LOG.historyPosition < LOG.history.length - 1) {
                ++LOG.historyPosition;
                this.input.value = LOG.history[LOG.historyPosition];
            }
            LOG.stopPropagation($event);
            LOG.preventDefault($event);
        }
    }
    
    this.setContext = function(id, name, contextObject) {
        var optionElement;
        
        var optionElementOK;
        try {
            optionElementOK = this.contexts[id] && this.contexts[id].optionElement && this.contexts[id].optionElement.ownerDocument;
        } catch (e) {
            optionElementOK = false;
        }
        
        
        if (!optionElementOK) {
            optionElement = this.ownerDocument.createElement('option');
            optionElement.value = id;
            this.contexts[id] = {
                optionElement: optionElement
            };
            this.selectContextCombo.appendChild(optionElement);
        } else {
            optionElement = this.contexts[id].optionElement;
        }
        
        this.contexts[id].contextObject = contextObject;
        this.contexts[id].name = name;
        while (optionElement.firstChild) {
            optionElement.removeChild(optionElement.firstChild);
        }
        
        optionElement.appendChild(this.ownerDocument.createTextNode(name));
    }
    
    // This searchs for some value in all the selected panels and focuses it
    this.focusValue = function(value, dontLog) {
        // this takes into account the extra elements which the LOG could have added and ignores them
        function getPathToNodeFromHtmlNode(node) {
            var htmlNode = document.getElementsByTagName('html')[0];
            var path = [];
            while (node && node != htmlNode) {
                path.unshift(LOG.getChildNodeNumber(node));
                node = node.parentNode;
                if (node == LOG.LogObject.wrapperTopElement) {
                    node = document.body;
                }
            }
            return path;
        }
        var path = LOG.guessDomNodeOwnerName(value);
        if (!dontLog) {
            // Log the path into the console panel
            var logItem = new LOG.PathToObjectLogItem;
            logItem.init(path);
            this.appendRow(logItem.element);
        }
        if (path) {
            if (value.nodeType) {
                // Focus the element in the html panel
                if (this.htmlLogItem) {
                    this.htmlLogItem.focusChild(getPathToNodeFromHtmlNode(value));
                }
            }
            
            // Focus the element in the page panel
            if (this.pageLogItem) {
                path.pathToObject.shift(); // remove the 'page' part
                if (path.pathToObject.length == 0) {
                    LOG.focusAndBlinkElement(this.pageLogItem.element);
                } else {
                    this.pageLogItem.focusProperty(path.pathToObject);
                }
            }
        }
    }
    
    this.deleteContext = function(id) {
        if (!this.contexts[id]) {
            return;
        }
        var optionElement;
        optionElement = this.contexts[id].optionElement;
        optionElement.parentNode.removeChild(optionElement);
        delete this.contexts[id];
    }
    
    this.createInput = function(useTextArea) {
        return LOG.createElement(
            this.ownerDocument,
            useTextArea ? 'textarea' : 'input',
            {
                style: {
                    width: '100%',
                    height: '100%',
                    border: '1px solid gray',
                    fontFamily: 'monospace',
                    fontSize: '13px',
                    fontWeight: 'normal'
                },
                onkeydown: LOG.createEventHandler(this, 'onInputKeyDown'),
                mousedown: function(event) {
                    if (!event) {
                        event = LOG.LogObject.getWindow().event;
                    }
                    LOG.stopPropagation(event);
                }
            }
        );
    }
    
    this.unwrapBody = function() {
        var doc = this.ownerDocument;
        
        doc.body.removeChild(this.wrapperElement);
        while (this.wrapperTopElement.firstChild) {
            child = this.wrapperTopElement.firstChild;
            this.wrapperTopElement.removeChild(child);
            doc.body.appendChild(child);
        }
        this.wrapperElement = null;
        this.wrapperTopElement = null;
        this.wrapperBottomElement = null;
        document.body.style.overflow = this.oldBodyOverflow ? this.oldBodyOverflow : '';
        LOG.removeObjEventListener(this, this.resizeHandle, 'mousedown', this.onResizeHandleMousedown);
    }
    
    this.setWrapperSize = function(size) {
        this.wrapperSize = size;
        this.wrapperTopElement.style.bottom = size * 100 + '%';
        this.wrapperTopElement.style.height = (1 - size) * 100 + '%';
        this.wrapperBottomElement.style.top = (1 - size) * 100 + '%';
        this.wrapperBottomElement.style.height = size * 100 + '%';
    }
    
    this.wrapBodyInElement = function(element) {
        var doc = this.ownerDocument;
        this.wrapperElement = LOG.createElement(doc, 'div',
            {
                style: {
                    top: '0',
                    bottom: '0',
                    position: 'absolute',
                    left: '0',
                    right: '0',
                    overflow: 'hidden',
                    height: '100%',
                    width: '100%'
                }
            },
            [
                this.wrapperTopElement = LOG.createElement(doc, 'div',
                    {
                        style: {
                            top: '0',
                            width: '100%',
                            position: 'absolute',
                            left: '0',
                            right: '0',
                            overflow: 'auto'
                        }
                    }
                ),
                this.wrapperBottomElement = LOG.createElement(doc, 'div',
                    {
                        style: {
                            width: '100%',
                            bottom: '0',
                            position: 'absolute',
                            left: '0',
                            right: '0'
                        }
                    },
                    [
                        element
                    ]
                )
            ]
        );
        this.oldBodyOverflow = document.body.style.overflow;
        document.body.style.overflow = 'hidden';
        
        var size = LOG.getCookie('LOG_SIZE');
        if (!size || isNaN(size = parseFloat(size))) {
            size = 0.3333333;
        }
        
        this.setWrapperSize(size);
        var child;
        while (doc.body.firstChild) {
            child = doc.body.firstChild;
            doc.body.removeChild(child);
            this.wrapperTopElement.appendChild(child);
        }
        doc.body.appendChild(this.wrapperElement);
        
        LOG.addObjEventListener(this, this.resizeHandle, 'mousedown', this.onResizeHandleMousedown);
        
    }
    
    this.addConsole = function(consoleName) {
        if (this.consoles[consoleName]) {
            return this.consoles[consoleName];
        }
        return this.consoles[consoleName] = {
            panel: this.addLogPanel(consoleName),
            count: 0
        }
    }

    this.addLogPanel = function(name) {
        var doc = this.ownerDocument;
        var logPanel = new LOG.LogPanel;
        logPanel.init(name, false);
        this.panelLabels.appendChild(doc.createTextNode(', '));
        this.panelLabels.appendChild(logPanel.labelElement);
        this.panelElements.appendChild(logPanel.panelElement);
        return logPanel;
    }
    
    this.createElement = function() {
        this.consoles = {};
        
        var ownerDocument = this.prepareNewDocument();
        if (LOG.willOpenInNewWindow) {
            ownerDocument.body.innerHTML = '';
        }
        var doc = window.document;
        if (ownerDocument) {
            doc = ownerDocument;
        }
        
        this.elementCreated = true;
        
        var selectContextComboOk;
        try {
            selectContextComboOk = this.selectContextCombo && this.selectContextCombo.ownerDocument;
        } catch (e) {
            selectContextComboOk = false;
        }
        
        if (!selectContextComboOk) {
            this.selectContextCombo = LOG.createElement(doc, 'select',
                {
                    style: {
                        fontWeight: 'normal'
                    }
                }
            )
        }
        
        this.consolePanel = new LOG.LogPanel;
        this.consolePanel.init('console', true);
        
        this.console = {
            panel: this.consolePanel,
            count: 0
        }
        
        this.consoles.console = this.console;
        
        var me = this;
        
        this.htmlPanel = new LOG.LogPanel;
        this.htmlPanel.init('html', false);
        this.htmlPanel.onselect = function() {
            if (!me.htmlLogItem) {
                me.htmlLogItem = new LOG.HTMLElementLogItem;
                me.htmlLogItem.init(document.getElementsByTagName('html')[0], false, [], true);
                me.htmlPanel.contentElement.appendChild(me.htmlLogItem.element);
            }
        }
        
        this.consoles.html = {
            panel: this.htmlPanel,
            count: 0
        };
        
        this.pagePanel = new LOG.LogPanel;
        this.pagePanel.init('page', false);
        this.pagePanel.onselect = function() {
            function createPageLogItem() {
                if (!self[LOG.pageObjectName]) {
                    setTimeout(createPageLogItem, 1000);
                    return;
                }
                if (!me.pageLogItem) {
                    me.pageLogItem = LOG.getValueAsLogItem(self[LOG.pageObjectName], true, []);
                    me.pagePanel.contentElement.appendChild(me.pageLogItem.element);
                }
            }
            createPageLogItem();
        }
        
        this.consoles.page = {
            panel: this.pagePanel,
            count: 0
        };
        
        this.textAreaBig = false;
        
        this.element = LOG.createElement(
            doc, 'div',
            {
                style: {
                    borderTop: '1px solid gray',
                    backgroundColor: 'white',
                    color: 'gray',
                    position: 'relative',
                    height: '100%',
                    width: '100%',
                    overflow: 'hidden',
                    MozBoxSizing: 'border-box'
                }
            },
            [
                this.scrollContainer = LOG.createElement(doc, 'div',
                    {
                        style: {
                            position: 'absolute',
                            width: '100%',
                            height: LOG.isIE ? '100%' : null,
                            top: 0,
                            left: 0,
                            bottom: '0',
                            paddingTop: '1.8em',
                            paddingBottom: LOG.isIE ? '2em' : '1.8em'
                        }
                    },
                    [
                        LOG.createElement(doc, 'table',
                            {
                                style: {
                                    width: '100%',
                                    height: '100%'
                                },
                                cellPadding: '0',
                                cellSpacing: '0'
                            },
                            [
                                LOG.createElement(doc, 'tbody', {},
                                    [
                                        this.panelElements = LOG.createElement(doc, 'tr', {},
                                            [
                                                this.consolePanel.panelElement,
                                                this.htmlPanel.panelElement,
                                                this.pagePanel.panelElement
                                            ]
                                        )
                                    ]
                                )
                            ]
                        )
                    ]
                ),
                LOG.createElement(doc, 'div', // toolbar container
                    {
                        style: {
                            height: '1.8em',
                            position: 'absolute',
                            top: 0,
                            left: 0,
                            right: 0,
                            MozBoxSizing: 'border-box',
                            overflow: 'hidden',
                            fontFamily: 'terminus, lucida console, monospace',
                            backgroundColor: '#f0f0f0'
                        }
                    },
                    [
                        this.resizeHandle = LOG.createElement(doc, 'div', // resize handle
                            {
                                style: {
                                    top: '0px',
                                    height: '6px',
                                    width: '100%',
                                    position: 'absolute',
                                    cursor: 'n-resize'
                                }
                            }
                        ),
                        LOG.createElement(doc, 'div', // toolbar
                            {
                                style: {
                                    padding: '0.1em',
                                    width: '100%'
                                }
                            },
                            [
                                this.panelLabels = LOG.createElement(doc, 'span', {},
                                    [
                                        this.consolePanel.labelElement,
                                        ', ',
                                        this.htmlPanel.labelElement,
                                        ', ',
                                        this.pagePanel.labelElement
                                    ]
                                ),
                                ', ',
                                LOG.createElement(doc, 'a',
                                    {
                                        href: '#',
                                        style: {
                                            fontWeight: 'normal'
                                        },
                                        onclick: LOG.createEventHandler(this, 'onClearClick')
                                    },
                                    [ 'clear' ]
                                ),
                                ' (alt-c), ',
                                LOG.createElement(doc, 'a',
                                    {
                                        href: '#',
                                        style: {
                                            fontWeight: 'normal'
                                        },
                                        onclick: LOG.createEventHandler(this, 'onCloseClick')
                                    },
                                    [ 'close' ]
                                ),
                                ' (alt-k), ',
                                this.pauseLink = LOG.createElement(doc, 'a',
                                    {
                                        href: '#',
                                        style: {
                                            fontWeight: 'normal'
                                        },
                                        onclick: LOG.createEventHandler(this, 'onPauseClick')
                                    },
                                    [ 'pause' ]
                                ),
                                ' (alt-p), ',
                                LOG.createElement(doc, 'a',
                                    {
                                        href: '#',
                                        style: {
                                            fontWeight: 'normal'
                                        },
                                        onclick: LOG.createEventHandler(this, 'onHideClick')
                                    },
                                    [ 'hide' ]
                                ),
                                ' (alt-h), ',
                                LOG.createElement(doc, 'a',
                                    {
                                        href: '#',
                                        style: {
                                            fontWeight: 'normal'
                                        },
                                        onclick: LOG.createEventHandler(this, 'onNewWindowClick')
                                    },
                                    [ LOG.willOpenInNewWindow ? 'same window' : 'new window' ]
                                ),
                                ' (alt-i) '
                            ]
                        )
                    ]
                ),
                this.inputTableContainer = LOG.createElement(doc, 'div',
                    {
                        style: {
                            height: '1.8em',
                            position: 'absolute',
                            left: 0,
                            backgroundColor: '#f0f0f0',
                            bottom: 0
                        }
                    },
                    [
                        this.inputTable = LOG.createElement(doc, 'table',
                            {
                                style: {
                                    height: '100%',
                                    fontSize: '10px',
                                    borderSpacing: 0
                                }
                            },
                            [
                                LOG.createElement(doc, 'tbody', {},
                                    [
                                        LOG.createElement(doc, 'tr', {},
                                            [
                                                this.inputTd = LOG.createElement(doc, 'td', {
                                                        style: {
                                                            width: '100%',
                                                            verticalAlign: 'bottom'
                                                        }
                                                    },
                                                    [
                                                        this.input = this.createInput()
                                                    ]
                                                ),
                                                this.toggleTextAreaTd = LOG.createElement(doc, 'td',
                                                    {
                                                        style: {
                                                            width: '10px',
                                                            verticalAlign: 'bottom'
                                                        }
                                                    },
                                                    [
                                                        this.toggleTextAreaLink = LOG.createElement(doc, 'a',
                                                            {
                                                                href: '#',
                                                                style: {
                                                                    fontWeight: 'normal',
                                                                    fontSize: '12px'
                                                                },
                                                                onclick: LOG.createEventHandler(this, 'onToggleTextAreaClick')
                                                            },
                                                            [ 'big' ]
                                                        )
                                                    ]
                                                )
                                            ]
                                        )
                                    ]
                                )
                            ]
                        )
                    ]
                )
            ]
        );
        
        this.setContext('global', 'Global', new LOG.globalContext);
        
        
        
        var me = this;
        function append() {
            if (!LOG.willOpenInNewWindow) {
                me.wrapBodyInElement(me.element);
            } else {
                doc.body.appendChild(me.element);
            }
        }
        
        if (doc.body) {
            append();
        } else {
            LOG.addEventListener(window, 'load', append);
        }
    }
}();

LOG.shallowClone = function(obj) {
    var item, out;
    if (obj.constructor == Array) {
        out = [];
    } else {
        out = {};
    }
    for (item in obj) {
        out[item] = obj[item];
    }
    return out;
}

LOG.getObjectDifferences = function(oldObject, newObject) {
    var oldKeys = LOG.getObjectProperties(oldObject);
    var newKeys = LOG.getObjectProperties(newObject);
    var addedKeys = [];
    var i;
    for (i = 0; i < newKeys.length; ++i) {
        if (LOG.indexOf(oldKeys, newKeys[i]) == -1) {
            addedKeys.push(newKeys[i]);
        }
    }
    var removedKeys = [];
    for (i = 0; i < oldKeys.length; ++i) {
        if (LOG.indexOf(newKeys, oldKeys[i]) == -1) {
            removedKeys.push(oldKeys[i]);
        }
    }
    var notRemovedKeys = [];
    for (i = 0; i < oldKeys.length; ++i) {
        if (LOG.indexOf(removedKeys, oldKeys[i]) == -1) {
            notRemovedKeys.push(oldKeys[i]);
        }
    }
    var changedKeys = [], key;
    for (i = 0; i < notRemovedKeys.length; ++i) {
        key = notRemovedKeys[i];
        if (oldObject[key] != newObject[key]) {
            changedKeys.push(key);
        }
    }
    return {
        addedKeys: addedKeys,
        removedKeys: removedKeys,
        changedKeys: changedKeys
    };
}

LOG.focusAndBlinkElement = function(element) {
    element.scrollIntoView();
    element.style.backgroundColor = 'yellow';
    setTimeout(
        function() {
            element.style.backgroundColor = '';
        },
        1000
    );
}



if (typeof LOG.PathToObjectPart == 'undefined') {
    LOG.PathToObjectPart = function() {
    }
}

LOG.PathToObjectPart.prototype.init = function(value, pathPartName) {
    var doc = LOG.LogObject.ownerDocument;
    this.value = value;
    var me = this;
    var ctrlClick = false;
    var link = this.element = LOG.createElement(
        doc, 'a',
        {
            style: {
                textDecoration: 'none',
                color: 'black'
            },
            href: '#',
            onmouseover: function() {
                link.style.textDecoration = 'underline';
                link.style.color = 'olive';
                me.showElementOutline();
            },
            onmouseout: function() {
                link.style.textDecoration = 'none';
                link.style.color = 'black';
                me.hideElementOutline();
            },
            onmousedown: function(event) {
                if (!event) {
                    event = LOG.LogObject.getWindow().event;
                }
                ctrlClick = LOG.getButtonFromEvent(event) == 'left' && event.ctrlKey;
            },
            onclick: function(event) {
                if (!event) {
                    event = LOG.LogObject.getWindow().event;
                }
                if (!ctrlClick) {
                    LOG.LogObject.logAndStore(value);
                    LOG.LogObject.focusValue(value, true);
                } else if (window.Reloadable && value instanceof window.Reloadable) {
                    LOG.openClassInEditor(value);
                }
                LOG.stopPropagation(event);
                LOG.preventDefault(event);
            }
        },
        [ pathPartName ]
    );
}

LOG.PathToObjectPart.prototype.showElementOutline = function() {
    if (this.value.getDomNode) {
        var node = this.value.getDomNode();
        if (node) {
            this.outlineElement = LOG.createOutlineFromElement(node);
        }
    } else if (this.value.nodeType) {
        this.outlineElement = LOG.createOutlineFromElement(this.value);
    }
}

LOG.PathToObjectPart.prototype.hideElementOutline = function() {
    if (this.outlineElement) {
        this.outlineElement.parentNode.removeChild(this.outlineElement);
        delete this.outlineElement;
    }
}

if (typeof LOG.PathToObjectLogItem == 'undefined') {
    LOG.PathToObjectLogItem = function() {
    }
}

LOG.PathToObjectLogItem.prototype.init = function(value) {
    var doc = LOG.LogObject.ownerDocument;
    var me = this;
    this.value = value;
    this.element = LOG.createElement(
        doc, 'span',
        {}
    );
    if (value) {
        var part, i;
        for (i = 0; i < value.pathToObject.length; ++i) {
            part = new LOG.PathToObjectPart;
            part.init(value.pathToObject[i].obj, i == 0 ? value.pathToObject[i].name : LOG.getPropertyAccessor(value.pathToObject[i].name));
            this.element.appendChild(LOG.createElement(doc, 'span', { style: { fontSize: '0.1pt' } }, [ ' ' ]));
            this.element.appendChild(part.element);
        }
        var node = value.pathToObject[value.pathToObject.length - 1].obj;
        for (i = 0; i < value.pathToElement.length; ++i) {
            part = new LOG.PathToObjectPart;
            node = node.childNodes[value.pathToElement[i]];
            part.init(node, '.childNodes[' + value.pathToElement[i] + ']');
            this.element.appendChild(part.element);
        }
    } else {
        this.element.appendChild(document.createTextNode('Could not compute path'));
    }
}

// This works with JS and PHP exceptions traces
if (typeof LOG.ExceptionLogItem == 'undefined') {
    LOG.ExceptionLogItem = function() {
    }
}

LOG.ExceptionLogItem.prototype.init = function(value) {
    var doc = LOG.LogObject.ownerDocument;
    var link;
    var me = this;
    this.showingMoreInfo = false;
    this.value = value;
    
    if (LOG.isIE && !value.type == 'PHP') {
        this.stack = this.getStackFromArguments();
    } else {
        this.stack = this.value.stack;
    }
    
    this.element = LOG.createElement(
        doc, 'span',
        {},
        [
            LOG.getGetPositionInVariablesElement(value),
            '«',
            link = LOG.createElement(
                doc, 'a',
                {
                    style: {
                        textDecoration: 'none',
                        color: 'red'
                    },
                    href: '#',
                    onmouseover: function() {
                        link.style.textDecoration = 'underline';
                        link.style.color = 'olive';
                    },
                    onmouseout: function() {
                        link.style.textDecoration = 'none';
                        link.style.color = 'red';
                    },
                    onclick: function(event) {
                        if (!event) {
                            event = LOG.LogObject.getWindow().event;
                        }
                        LOG.LogObject.logAndStore(value);
                        LOG.stopPropagation(event);
                        LOG.preventDefault(event);
                    }
                },
                [ value.name ? value.name : 'Exception' ]
            ),
            ' ',
            value.message ? value.message : value.toString(),
            LOG.isGecko ? ' in ' : null,
            (LOG.isGecko && this.value.fileName) ? this.getFileLink(this.getLocalFile(this.value.fileName), this.value.lineNumber) : null,
            ' ',
            this.showMoreLink = LOG.createElement(doc, 'a',
                {
                    style: {
                        textDecoration: 'underline',
                        color: 'black'
                    },
                    href: '#',
                    onmouseover: function() {
                        me.showMoreLink.style.textDecoration = 'none';
                        me.showMoreLink.style.color = 'red';
                    },
                    onmouseout: function() {
                        me.showMoreLink.style.textDecoration = 'underline';
                        me.showMoreLink.style.color = 'black';
                    },
                    onclick: function(event) {
                        if (!event) {
                            event = LOG.LogObject.getWindow().event;
                        }
                        LOG.preventDefault(event);
                        LOG.stopPropagation(event);
                        me.toggleShowMoreInfo();
                    }
                },
                [ 'more' ]
            ),
            this.moreInfoSpan = LOG.createElement(doc, 'span'),
            '»'
        ]
    );
}

LOG.ExceptionLogItem.prototype.toggleShowMoreInfo = function() {
    this.setShowMoreInfo(!this.showingMoreInfo);
}

LOG.ExceptionLogItem.prototype.getLocalFile = function(url) {
    var start = window.location.protocol + '//' + window.location.host + '/';
    if (url.substr(0, start.length) == start) {
        url = url.substr(start.length);
    }
    var queryStringPos = url.lastIndexOf('?');
    if (queryStringPos != -1) {
        url = url.substr(0, queryStringPos);
    }
    return url;
}

LOG.ExceptionLogItem.prototype.getStackAsArray = function(stackString) {
    var linesArray = stackString.split(/\r\n|\r|\n/);
    var out = [];
    var linePos, line;
    for (var i = 0; i < linesArray.length; ++i) {
        line = linesArray[i];
        if (!line) {
            continue;
        }
        var atPos = line.lastIndexOf('@');
        var colonPos = line.lastIndexOf(':');
        out.push(
            {
                'function': this.getLocalFile(line.substr(0, atPos)),
                file: this.getLocalFile(line.substring(atPos + 1, colonPos)),
                line: parseInt(line.substr(colonPos + 1)),
                args: []
            }
        );
    }
    return out;
}

function getStackFromArguments() {
    var currentCaller = arguments.callee.caller.caller.caller; // I skip 2
    var stack = [];
    var caller;
    while (currentCaller) {
        stack.push(currentCaller);
        currentCaller = currentCaller.caller;
    }
    return stack;
}

LOG.ExceptionLogItem.prototype.getStackFromArguments = getStackFromArguments;

LOG.ExceptionLogItem.prototype.getStackHtmlElement = function(fileName, lineNumber) {
    var stackArray;
    if (LOG.isIE) {
        return LOG.getValueAsHtmlElement(this.stack);
    } else if (this.value.stack) {
        if (typeof this.value.stack == 'string') {
            stackArray = this.getStackAsArray(this.value.stack);
        } else {
            stackArray = this.value.stack;
        }
        var doc = LOG.LogObject.ownerDocument;
        var element = LOG.createElement(doc, 'div');
        var link;
        for (var i = 1; i < stackArray.length; ++i) {
            if (stackArray[i].file && stackArray[i].line) {
                link = this.getFileLink(stackArray[i].file, stackArray[i].line)
            } else if (!stackArray[i].file && !stackArray[i].line && !stackArray.line) {
                continue;
            } else {
                link = null;
            }
            element.appendChild(
                LOG.createElement(doc, 'div',
                    {},
                    [
                        link,
                        link ? ': ' + stackArray[i]['function'] : stackArray[i]['function'],
                        stackArray[i]['args'] ? LOG.createElement(doc, 'span',
                            {},
                            [
                                ' (',
                                LOG.getValueAsHtmlElement(stackArray[i]['args']),
                                ')'
                            ]
                        ) : null
                    ]
                )
            )
        }
        return element;
    } else {
        return LOG.createElement(
            LOG.LogObject.ownerDocument, 'div',
            {
            },
            [
                'No more info available'
            ]
        );
    }
}

LOG.ExceptionLogItem.prototype.getFileLink = function(fileName, lineNumber) {
    return LOG.createElement(
        LOG.LogObject.ownerDocument, 'a',
        {
            href: 'openFile.php?file=' + escape(fileName) + '&line=' + lineNumber
        },
        [
            fileName + ' line ' + lineNumber
        ]
    );
}

LOG.ExceptionLogItem.prototype.setShowMoreInfo = function(show) {
    if (show == this.showingMoreInfo) {
        return;
    }
    this.showingMoreInfo = show;
    if (!show) {
        if (this.moreInfoSpan.firstChild) {
            this.moreInfoSpan.removeChild(this.moreInfoSpan.firstChild);
        }
    } else {
        var start = window.location.protocol + '//' + window.location.host;
        var stackElement = this.getStackHtmlElement();
        if (stackElement) { // could be null if there is no stack to show
            this.moreInfoSpan.appendChild(
                stackElement
            );
        }
    }
}

if (typeof LOG.ArrayLogItem == 'undefined') {
    LOG.ArrayLogItem = function() {
    }
}

LOG.ArrayLogItem.prototype.init = function(value, stackedMode, alreadyLoggedContainers) {
    var doc = LOG.LogObject.ownerDocument;
    
    if (typeof alreadyLoggedContainers == 'undefined') {
        alreadyLoggedContainers = [];
    }
    this.value = value;
    this.stackedMode = stackedMode;
    this.alreadyLoggedContainers = alreadyLoggedContainers;
    var me = this;
    var link;
    this.element = LOG.createElement(
        doc, 'span',
        {},
        [
            LOG.getGetPositionInVariablesElement(value),
            link = LOG.createElement(
                doc, 'a',
                {
                    style: {
                        textDecoration: 'none',
                        color: 'black'
                    },
                    href: '#',
                    onmouseover: function() {
                        link.style.textDecoration = 'underline';
                        link.style.color = 'red';
                        endSpan.style.textDecoration = 'underline';
                        endSpan.style.color = 'red';
                    },
                    onmouseout: function() {
                        link.style.textDecoration = 'none';
                        link.style.color = 'black';
                        endSpan.style.textDecoration = 'none';
                        endSpan.style.color = '';
                    },
                    onclick: function(event) {
                        if (!event) {
                            event = LOG.LogObject.getWindow().event;
                        }
                        LOG.LogObject.logAndStore(value);
                        LOG.stopPropagation(event);
                        LOG.preventDefault(event);
                    }
                },
                [ '[' ]
            ),
            this.updateLink = LOG.createElement(doc, 'a',
                {
                    style: {
                        textDecoration: 'none',
                        color: 'black'
                    },
                    href: '#',
                    onmouseover: function() {
                        me.updateLink.style.textDecoration = 'underline';
                        me.updateLink.style.color = 'red';
                    },
                    onmouseout: function() {
                        me.updateLink.style.textDecoration = 'none';
                        me.updateLink.style.color = 'black';
                    },
                    onclick: function(event) {
                        if (!event) {
                            event = LOG.LogObject.getWindow().event;
                        }
                        LOG.preventDefault(event);
                        LOG.stopPropagation(event);
                        me.toggleAutoUpdate();
                    }
                },
                [ '\u21ba' ]
            ),
            ' ',
            this.stackedToggleLink = LOG.createElement(
                doc, 'a',
                {
                    style: {
                        textDecoration: 'none',
                        color: 'olive',
                        fontSize: '8pt'
                    },
                    href: '#',
                    onmouseover: function() {
                        me.stackedToggleLink.style.textDecoration = 'underline';
                        endSpan.style.textDecoration = 'underline';
                    },
                    onmouseout: function() {
                        me.stackedToggleLink.style.textDecoration = 'none';
                        endSpan.style.textDecoration = 'none';
                    },
                    onclick: function(event) {
                        if (!event) {
                            event = LOG.LogObject.getWindow().event;
                        }
                        LOG.preventDefault(event);
                        LOG.stopPropagation(event);
                        me.toggleStackedMode(event.ctrlKey);
                        me.stackedToggleLink.style.textDecoration = 'none';
                        endSpan.style.textDecoration = 'none';
                    }
                },
                [ '\u25ba' ]
            ),
            this.propertiesSpan = LOG.createElement(doc, 'span')
        ]
    );
    
    this.currentStackedMode = false;
    this.properties = [];
    this.oldValue = LOG.shallowClone(value);
    
    for (var i = 0; i < value.length; i++) {
        this.createProperty(i, LOG.getValueAsLogItem(value[i], stackedMode, alreadyLoggedContainers));
        me.lastVisibleProperty = this.properties[i];
        this.propertiesSpan.appendChild(this.properties[i].element);
    }
    
    var endSpan = LOG.createElement(
        doc, 'span',
        {},
        [ ']' ]
    );
    
    this.autoUpdateInterval = null;
    
    this.element.appendChild(endSpan);
    if (stackedMode) {
        this.toggleStackedMode();
    }
}

LOG.ArrayLogItem.prototype.setShowChildren = function(showChildren, applyToChildren) {
    if (!showChildren || !applyToChildren) {
        return;
    }
    for (var i = 0; i < this.value.length; i++) {
        if (this.properties[i].logItem.setShowChildren) {
            this.properties[i].logItem.setShowChildren(true, true);
        }
    }
}

LOG.ArrayLogItem.prototype.createProperty = function(index) {
    var logItem = LOG.getValueAsLogItem(this.value[index], this.stackedMode, this.alreadyLoggedContainers);
    var span, labelElement, logItemSpan, commaSpan;
    var doc = LOG.LogObject.ownerDocument;
    span = LOG.createElement(doc, 'span',
        {},
        [
            labelElement = LOG.createElement(
                doc, 'span',
                {
                    style: {
                        display: 'none',
                        color: 'gray'
                    }
                },
                [ index + ': ' ]
            ),
            logItemSpan = LOG.createElement(
                doc, 'span',
                {},
                [logItem.element]
            ),
            commaSpan = LOG.createElement(
                doc, 'span',
                {},
                [', ']
            )
        ]
    );
    var property = {
        element: span,
        labelElement: labelElement,
        propertyValueElement: logItemSpan,
        logItem: logItem,
        commaSpan: commaSpan
    };
    this.properties[index] = property;
    if (index == this.value.length - 1) {
        property.commaSpan.style.display = 'none';
    }
}

LOG.ArrayLogItem.prototype.focusProperty = function(pathToProperty) {
    var property = pathToProperty.shift().name;
    if (pathToProperty.length == 0) {
        LOG.focusAndBlinkElement(this.properties[property].logItem.element);
    } else {
        if (this.properties[property].logItem.focusProperty) {
            this.properties[property].logItem.focusProperty(pathToProperty);
        }
    }
}

LOG.ArrayLogItem.prototype.setStackedMode = function(stacked, applyToChildren) {
    if (this.currentStackedMode == stacked) {
        return;
    }
    this.currentStackedMode = stacked;
    for (var i in this.properties) {
        this.setPropertyStackMode(i, applyToChildren);
    }
    if (stacked) {
        this.stackedToggleLink.firstChild.nodeValue = '\u25bc';
    } else {
        this.stackedToggleLink.firstChild.nodeValue = '\u25ba';
    }
}

LOG.ArrayLogItem.prototype.setPropertyStackMode = function(index, applyToChildren) {
    var text, margin;
    if (this.currentStackedMode) {
        margin = '2em';
    } else {
        margin = '0';
    }
    var property = this.properties[index];
    property.element.style.display = this.currentStackedMode ? 'block' : 'inline';
    property.element.style.marginLeft = margin;
    property.labelElement.style.display = this.currentStackedMode ? '' : 'none';
    if (applyToChildren && property.logItem.setStackedMode) {
        property.logItem.setStackedMode(this.currentStackedMode, applyToChildren);
    }
}

LOG.ArrayLogItem.prototype.toggleStackedMode = function(applyToChildren) {
    this.setStackedMode(!this.currentStackedMode, applyToChildren);
}

LOG.ArrayLogItem.prototype.toggleAutoUpdate = function() {
    this.setAutoUpdate(!this.autoUpdateInterval);
}

LOG.ArrayLogItem.prototype.setAutoUpdate = function(enabled) {
    if (!!this.autoUpdateInterval == enabled) {
       return;
    }
    if (this.autoUpdateInterval) {
        clearInterval(this.autoUpdateInterval);
        this.autoUpdateInterval = null;
        this.updateLink.firstChild.nodeValue = '\u21ba';
        this.updateLink.style.backgroundColor = '';
    } else {
        var me = this;
        this.autoUpdateInterval = setInterval(
            function() {
                me.updateAndMarkDifferences()
            },
            100
        );
        this.updateLink.firstChild.nodeValue = '\u21bb';
        this.updateLink.style.backgroundColor = '#af5';
    }
    for (var i = 0; i < this.properties.length; ++i) {
        if (this.properties[i].logItem.setAutoUpdate) {
            this.properties[i].logItem.setAutoUpdate(enabled);
        }
    }
}

LOG.ArrayLogItem.prototype.updateAndMarkDifferences = function() {
    var me = this;
    function blinkProperty(key) {
        if (me.properties[key].blinkTimeout) {
            clearTimeout(me.properties[key].blinkTimeout);
        }
        me.properties[key].propertyValueElement.style.backgroundColor = 'yellow';
        me.properties[key].labelElement.style.backgroundColor = 'yellow';
        me.properties[key].blinkTimeout = setTimeout(
            function() {
                me.properties[key].propertyValueElement.style.backgroundColor = '';
                me.properties[key].labelElement.style.backgroundColor = '';
                delete me.properties[key].blinkTimeout;
            }, 1000
        );
    }
    
    function updateChangedProperty(key) {
        var propertyValueElement = me.properties[key].propertyValueElement;
        if (me.properties[key].logItem.onRemove) {
            me.properties[key].logItem.onRemove();
        }
        var wasShowingChildren = me.properties[key].logItem.getShowChildren && me.properties[key].logItem.getShowChildren();
        while (propertyValueElement.firstChild) {
            propertyValueElement.removeChild(propertyValueElement.firstChild);
        }
        me.properties[key].logItem = LOG.getValueAsLogItem(me.value[key], me.stackedMode, me.alreadyLoggedContainers);
        if (wasShowingChildren) {
            me.properties[key].logItem.setShowChildren(wasShowingChildren);
        }
        if (me.properties[key].logItem.setAutoUpdate) {
            me.properties[key].logItem.setAutoUpdate(!!me.autoUpdateInterval);
        }
        propertyValueElement.appendChild(me.properties[key].logItem.element);
        blinkProperty(key);
    }
    
    function updateAddedProperty(key) {
        me.createProperty(key);
        me.setPropertyStackMode(key);
        if (me.lastVisibleProperty) {
            me.lastVisibleProperty.commaSpan.style.display = '';
        }
        me.properties[key].commaSpan.style.display = 'none';
        me.lastVisibleProperty = me.properties[key];
        blinkProperty(key);
        if (me.properties[key].logItem.setAutoUpdate) {
            me.properties[key].logItem.setAutoUpdate(!!me.autoUpdateInterval);
        }
        me.propertiesSpan.appendChild(me.properties[key].element);
    }
    
    function updateRemovedProperty(key) {
        if (me.properties[key].blinkTimeout) {
            clearTimeout(me.properties[key].blinkTimeout);
        }
        var property = me.properties[key];
        if (property.logItem.onRemove) {
            property.logItem.onRemove();
        }
        property.propertyValueElement.style.backgroundColor = 'yellow';
        property.labelElement.style.backgroundColor = 'yellow';
        property.propertyValueElement.style.textDecoration = 'line-through';
        property.labelElement.style.textDecoration = 'line-through';
        
        setTimeout(
            function() {
                me.propertiesSpan.removeChild(property.element);
                if (me.lastVisibleProperty == property) {
                    me.lastVisibleProperty = null;
                    for (var i = me.properties.length - 1; i >= 0; --i) {
                        if (me.properties[i].element.style.display != 'none') {
                            me.lastVisibleProperty = me.properties[i];
                            me.lastVisibleProperty.commaSpan.style.display = 'none';
                            break;
                        }
                    }
                }
            }, 1000
        );
    }
    
    var diffs = LOG.getObjectDifferences(this.oldValue, this.value);
    for (var i = 0; i < diffs.changedKeys.length; ++i) {
        updateChangedProperty(diffs.changedKeys[i]);
    }
    for (var i = 0; i < diffs.addedKeys.length; ++i) {
        updateAddedProperty(diffs.addedKeys[i]);
    }
    for (var i = 0; i < diffs.removedKeys.length; ++i) {
        updateRemovedProperty(diffs.removedKeys[i]);
    }
    this.oldValue = LOG.shallowClone(this.value);
}

LOG.ArrayLogItem.prototype.onRemove = function() {
    this.setAutoUpdate(false);
}

if (typeof LOG.HTMLElementLogItem == 'undefined') {
    LOG.HTMLElementLogItem = function() {
    }
}

LOG.HTMLElementLogItem.prototype.init = function(value, stackedMode, alreadyLoggedContainers, dontShowParentLink) {
    var doc = LOG.LogObject.ownerDocument;
    var link;
    var showParentLink;
    
    this.stackedMode = stackedMode;
    this.alreadyLoggedContainers = alreadyLoggedContainers;
    this.dontShowParentLink = dontShowParentLink;
    
    var me = this;
    this.value = value;
    this.onlyTextNodeChildren = true;
    
    var childNodes = this.getChildNodes();
    this.hasChildNodes = childNodes.length > 0;
    for (var i = 0; i < childNodes.length; ++i) {
        if (childNodes[i].nodeName != '#text') {
            this.onlyTextNodeChildren = false;
            break;
        }
    }
    this.showChildNodes = false;
    this.element = LOG.createElement(doc, 'span',
        {
            style: {
                color: '#00e'
            }
        },
        [
            this.showChildNodesLink = LOG.createElement(doc, 'a',
                {
                    style: {
                        textDecoration: 'none',
                        color: 'black',
                        fontWeight: 'bold',
                        cursor: 'pointer'
                    },
                    onmouseover: function() {
                        me.showChildNodesLink.style.textDecoration = 'underline';
                        me.showChildNodesLink.style.color = 'red';
                    },
                    onmouseout: function() {
                        me.showChildNodesLink.style.textDecoration = 'none';
                        me.showChildNodesLink.style.color = 'black';
                    },
                    onclick: function(event) {
                        if (!event) {
                            event = LOG.LogObject.getWindow().event;
                        }
                        me.toggleShowChildNodes(event.ctrlKey);
                        LOG.stopPropagation(event);
                        LOG.preventDefault(event);
                    },
                    title: 'Toggle show child nodes'
                },
                [
                    this.hasChildNodes ?
                        (this.showChildNodes ? '-' : '+') :
                        '\u00A0'
                ]
            ),
            '<',
            link = LOG.createElement(doc, 'a',
                {
                    style: {
                        textDecoration: 'none',
                        color: '#00e'
                    },
                    onmouseover: function() {
                        link.style.textDecoration = 'underline';
                        me.showElementOutline();
                    },
                    onmouseout: function() {
                        link.style.textDecoration = 'none';
                        me.hideElementOutline();
                    },
                    onclick: function(event) {
                        if (!event) {
                            event = LOG.LogObject.getWindow().event;
                        }
                        LOG.LogObject.logAndStore(value);
                        LOG.stopPropagation(event);
                        LOG.preventDefault(event);
                    },
                    href: '#'
                },
                [
                    value.tagName.toLowerCase()
                ]
            ),
            LOG.getGetPositionInVariablesElement(value),
            (!dontShowParentLink ? showParentLink = LOG.createElement(doc, 'a',
                {
                    style: {
                        textDecoration: 'none',
                        color: 'gray'
                    },
                    onmouseover: function() {
                        showParentLink.style.textDecoration = 'underline';
                        showParentLink.style.color = 'red';
                    },
                    onmouseout: function() {
                        showParentLink.style.textDecoration = 'none';
                        showParentLink.style.color = 'gray';
                    },
                    onclick: function(event) {
                        if (!event) {
                            event = LOG.LogObject.getWindow().event;
                        }
                        me.showParent();
                        LOG.stopPropagation(event);
                        LOG.preventDefault(event);
                    },
                    title: 'Show parent node'
                },
                ['\u21A5']
            ) : null),
            this.propertiesContainer = LOG.createElement(doc, 'span'),
            this.startTagEnd = doc.createTextNode(this.showChildNodes ? '>' : '/>'),
            this.withChildNodesEnd = LOG.createElement(doc, 'span',
                {
                    style: {
                        display: this.showChildNodes ? null :  'none'
                    }
                },
                [
                    this.childNodesContainer = LOG.createElement(doc, 'span'),
                    this.endTag = LOG.createElement(doc, 'span',
                        {
                            onmouseover: function() {
                                link.style.textDecoration = 'underline';
                                me.showElementOutline();
                            },
                            onmouseout: function() {
                                link.style.textDecoration = 'none';
                                me.hideElementOutline();
                            }
                        },
                        [
                            '\u00A0</' + value.tagName.toLowerCase() + '>'
                        ]
                    )
                ]
            )
        ]
    )
    
    for (var i = 0; i < value.attributes.length; ++i) {
        if (value.attributes[i].specified) {
            this.propertiesContainer.appendChild(doc.createTextNode(' '));
            this.propertiesContainer.appendChild(
                LOG.createElement(doc, 'span',
                    { style: {color: '#036' } },
                    [ value.attributes[i].name + '=' ]
                )
            );
            this.propertiesContainer.appendChild(
                LOG.createElement(doc, 'span',
                    { style: { color: '#630' } },
                    [ '"' + value.attributes[i].value.replace(/"/, '"') + '"' ]
                )
            );
        }
    }
    if (this.hasChildNodes && this.value.nodeName.toLowerCase() != 'script' && this.value.nodeName.toLowerCase() != 'style' && this.onlyTextNodeChildren) {
        this.setShowChildNodes(true);
    }
}

LOG.HTMLElementLogItem.prototype.focusChild = function(pathToChild) {
    if (pathToChild.length == 0) {
        LOG.focusAndBlinkElement(this.element);
    } else {
        if (!this.showChildNodes) {
            this.setShowChildNodes(true, false);
        }
        var i = pathToChild.shift();
        if (this.childNodeItems[i].focusChild) {
            this.childNodeItems[i].focusChild(pathToChild);
        } else {
            Log('focus something which is not an htmlelementlogitem');
        }
    }
}

LOG.HTMLElementLogItem.prototype.showElementOutline = function() {
    this.outlineElement = LOG.createOutlineFromElement(this.value);
}

LOG.HTMLElementLogItem.prototype.hideElementOutline = function() {
    this.outlineElement.parentNode.removeChild(this.outlineElement);
    delete this.outlineElement;
}

LOG.HTMLElementLogItem.prototype.getChildNodes = function() {
    if (LOG.LogObject.wrapperElement && this.value == document.body) { // Hide LOG's wrapper elements in the DOM
        return LOG.LogObject.wrapperTopElement.childNodes;
    } else {
        return this.value.childNodes;
    }
}

LOG.HTMLElementLogItem.prototype.showParent = function() {
    Log(this.value.parentNode);
}

LOG.HTMLElementLogItem.prototype.toggleShowChildNodes = function(applyToChildNodes) {
    this.setShowChildNodes(!this.showChildNodes, applyToChildNodes);
}

LOG.HTMLElementLogItem.prototype.setShowChildNodes = function(show, applyToChildNodes) {
    if (show == this.showChildNodes) {
        return;
    }
    this.showChildNodes = show;
    while (this.childNodesContainer.firstChild) {
        this.childNodesContainer.removeChild(this.childNodesContainer.firstChild);
    }
    this.withChildNodesEnd.style.display = show ? '' : 'none';
    this.showChildNodesLink.firstChild.nodeValue = show ? '-' : '+';
    this.startTagEnd.nodeValue = show ? '>' : '/>';
    var childNodeLogItem;
    var doc = LOG.LogObject.ownerDocument;
    if (show) {
        if (!this.onlyTextNodeChildren) {
            this.childNodesContainer.style.display = 'block';
            this.childNodesContainer.style.marginLeft = '1em';
        }
        var childNode;
        var childNodeToAppend;
        var childNodes = this.getChildNodes();
        this.childNodeItems = [];
        for (var i = 0; i < childNodes.length; ++i) {
            childNode = childNodes[i];
            if (childNode.nodeType == 1) {
                childNodeLogItem = new LOG.HTMLElementLogItem;
                childNodeLogItem.init(childNode, this.stackedMode, this.alreadyLoggedContainers, true);
                childNodeToAppend = childNodeLogItem.element;
                if (applyToChildNodes) {
                    childNodeLogItem.setShowChildNodes(true, true);
                }
                this.childNodeItems[i] = childNodeLogItem;
            } else if (childNode.nodeName == '#text') {
                childNodeToAppend = LOG.createElement(doc, 'span', { style: { color: 'gray' } }, [ '\u00A0' + childNode.nodeValue ] );
                this.childNodeItems[i] = childNodeToAppend;
            } else {
                childNodeToAppend = LOG.getValueAsLogItem(childNode).element;
                this.childNodeItems[i] = childNodeToAppend;
            }
            if (!this.onlyTextNodeChildren) {
                childNodeToAppend.style.display = 'block';
            }
            this.childNodesContainer.appendChild(childNodeToAppend);
        }
        
    } else {
        this.childNodesContainer.style.display = 'inline';
        this.childNodesContainer.style.marginLeft = '0';
    }
}

if (typeof LOG.ObjectLogItem == 'undefined') {
    LOG.ObjectLogItem = function() {
    }
}

LOG.ObjectLogItem.prototype.init = function(value, stackedMode, alreadyLoggedContainers, showChildren, showToggleChildrenLink) {
    if (typeof alreadyLoggedContainers == 'undefined') {
        alreadyLoggedContainers = [];
    }
    if (typeof showChildren == 'undefined') {
        showChildren = false;
    }
    if (typeof showToggleChildrenLink == 'undefined') {
        showToggleChildrenLink = true;
    }
    
    var doc = LOG.LogObject.ownerDocument;
    
    this.stackedMode = stackedMode;
    this.alreadyLoggedContainers = alreadyLoggedContainers;
    alreadyLoggedContainers.push(this);
    
    this.value = value;
    
    var endSpan;
    
    function highlightCurlyBraces() {
        me.startObjectLink.style.textDecoration = 'underline';
        me.startObjectLink.style.color = 'red';
        me.startObjectLink.style.backgroundColor = 'yellow';
        endSpan.style.textDecoration = 'underline';
        endSpan.style.color = 'red';
        endSpan.style.backgroundColor = 'yellow';
    }
    
    function endHighlightCurlyBraces() {
        me.startObjectLink.style.textDecoration = 'none';
        me.startObjectLink.style.color = 'black';
        me.startObjectLink.style.backgroundColor = '';
        endSpan.style.textDecoration = 'none';
        endSpan.style.color = '';
        endSpan.style.backgroundColor = '';
    }
    
    this.element = LOG.createElement(doc, 'span',
        {},
        [
            LOG.getGetPositionInVariablesElement(value),
            showToggleChildrenLink ? this.toggleChildrenLink = LOG.createElement(doc, 'a',
                {
                    style: {
                        textDecoration: 'none',
                        color: 'black'
                    },
                    href: '#',
                    onmouseover: function() {
                        me.toggleChildrenLink.style.textDecoration = 'underline';
                        me.toggleChildrenLink.style.color = 'red';
                    },
                    onmouseout: function() {
                        me.toggleChildrenLink.style.textDecoration = 'none';
                        me.toggleChildrenLink.style.color = 'black';
                    },
                    onclick: function(event) {
                        if (!event) {
                            event = LOG.LogObject.getWindow().event;
                        }
                        LOG.preventDefault(event);
                        LOG.stopPropagation(event);
                        me.toggleShowChildren(event.ctrlKey);
                    }
                },
                [ showChildren ? '-' : '+' ]
            ) : null,
            this.startObjectLink = LOG.createElement(doc, 'a',
                {
                    style: {
                        textDecoration: 'none',
                        color: 'black'
                    },
                    href: '#',
                    onmouseover: function() {
                        highlightCurlyBraces();
                    },
                    onmouseout: function() {
                        endHighlightCurlyBraces();
                    },
                    onclick: function(event) {
                        if (!event) {
                            event = LOG.LogObject.getWindow().event;
                        }
                        LOG.preventDefault(event);
                        LOG.stopPropagation(event);
                        LOG.LogObject.logAndStore(value);
                    }
                },
                [ '{' ]
            ),
            this.updateLink = LOG.createElement(doc, 'a',
                {
                    style: {
                        textDecoration: 'none',
                        color: 'black',
                        display: 'none'
                    },
                    href: '#',
                    onmouseover: function() {
                        me.updateLink.style.textDecoration = 'underline';
                        me.updateLink.style.color = 'red';
                    },
                    onmouseout: function() {
                        me.updateLink.style.textDecoration = 'none';
                        me.updateLink.style.color = 'black';
                    },
                    onclick: function(event) {
                        if (!event) {
                            event = LOG.LogObject.getWindow().event;
                        }
                        LOG.preventDefault(event);
                        LOG.stopPropagation(event);
                        me.toggleAutoUpdate();
                    }
                },
                [ '\u21ba' ]
            ),
            this.stackedToggleLink = LOG.createElement(doc, 'a',
                {
                    style: {
                        textDecoration: 'none',
                        color: 'green',
                        fontSize: '8pt',
                        display: 'none'
                    },
                    href: '#',
                    onmouseover: function() {
                        me.stackedToggleLink.style.textDecoration = 'underline';
                    },
                    onmouseout: function() {
                        me.stackedToggleLink.style.textDecoration = 'none';
                    },
                    onclick: function(event) {
                        if (!event) {
                            event = LOG.LogObject.getWindow().event;
                        }
                        LOG.preventDefault(event);
                        LOG.stopPropagation(event);
                        me.toggleStackedMode(event.ctrlKey);
                    }
                },
                [ '\u25ba' ]
            ),
            this.toggleMethodsLink = LOG.createElement(doc, 'a',
                {
                    style: {
                        textDecoration: 'none',
                        color: '#a3f',
                        fontSize: '8pt',
                        display: 'none'
                    },
                    href: '#',
                    onmouseover: function() {
                        me.toggleMethodsLink.style.textDecoration = 'underline';
                        me.toggleMethodsLink.style.color = '#660';
                    },
                    onmouseout: function() {
                        me.toggleMethodsLink.style.textDecoration = 'none';
                        me.toggleMethodsLink.style.color = '#a3f';
                    },
                    onclick: function(event) {
                        if (!event) {
                            event = LOG.LogObject.getWindow().event;
                        }
                        LOG.preventDefault(event);
                        LOG.stopPropagation(event);
                        me.toggleMethodsVisible();
                    }
                },
                [ '+' ]
            ),
            this.propertiesSpan = LOG.createElement(doc, 'span', { style: { display: 'none' } }),
            this.ellipsisSpan = LOG.createElement(doc, 'span', {}, [ '...' ]),
            endSpan = LOG.createElement(doc, 'span',
                {
                    onmouseover: function() {
                        highlightCurlyBraces();
                    },
                    onmouseout: function() {
                        endHighlightCurlyBraces();
                    }
                },
                [ '}' ]
            )
        ]
    );
    
    this.autoUpdateInterval = null;
    this.currentStackedMode = false;
    this.properties = {};
    this.methodsVisible = false;
    var me = this;
    this.setStackedMode(this.stackedMode);
    this.showingChildren = false;
    this.setShowChildren(showChildren);
}

LOG.ObjectLogItem.prototype.setShowChildren = function(showChildren, applyToChildren) {
    if (this.showingChildren == showChildren) {
        return;
    }
    this.showingChildren = showChildren;
    
    this.propertiesSpan.style.display = showChildren ? '' : 'none';
    this.ellipsisSpan.firstChild.nodeValue = showChildren ? ' ' : '...';
    this.updateLink.style.display = showChildren ? '' : 'none';
    this.stackedToggleLink.style.display = showChildren ? '' : 'none';
    this.toggleMethodsLink.style.display = showChildren ? '' : 'none';
    
    if (this.toggleChildrenLink) {
        this.toggleChildrenLink.firstChild.nodeValue = showChildren ? '-' : '+';
    }
    
    if (showChildren) {
        this.lastVisibleProperty = null; // the one which shouldn't have a coma
        
        this.oldValue = LOG.shallowClone(this.value);
        
        this.keys = LOG.getObjectProperties(this.value);
        this.keys.sort();
        
        var key;
        this.someMethodExists = false;
        for (var i = 0; i < this.keys.length; ++i) {
            key = this.keys[i];
            this.createProperty(key);
            this.propertiesSpan.appendChild(this.properties[key].element);
            if (typeof this.value[key] == 'function') {
                this.someMethodExists = true;
            }
            if (!this.methodsVisible && typeof this.value[key] == 'function') {
                this.properties[key].element.style.display = 'none';
            } else {
                this.lastVisibleProperty = this.properties[key]; // always the last one
            }
            this.setPropertyStackMode(key);
            if (applyToChildren) {
                if (this.properties[key].logItem.setShowChildren) {
                    this.properties[key].logItem.setShowChildren(true, true);
                }
            }
        }
        if (!this.someMethodExists) {
            this.toggleMethodsLink.style.display = 'none';
        }
        
        if (this.lastVisibleProperty) {
            this.lastVisibleProperty.commaSpan.style.display = 'none';
        }
        if (this.wasAutoUpdating) {
            this.setAutoUpdate(true);
        }
    } else {
        this.wasAutoUpdating = !!this.autoUpdateInterval;
        this.setAutoUpdate(false);
        for (var key in this.properties) {
            if (this.properties[key].logItem.onRemove) {
                this.properties[key].logItem.onRemove();
            }
            this.properties[key].element.parentNode.removeChild(this.properties[key].element);
        }
        this.properties = {};
    }
}

LOG.ObjectLogItem.prototype.getShowChildren = function() {
    return this.showingChildren;
}

LOG.ObjectLogItem.prototype.toggleShowChildren = function(applyToChildren) {
    this.setShowChildren(!this.showingChildren, applyToChildren);
}

LOG.ObjectLogItem.prototype.createProperty = function(key) {
    var document = LOG.LogObject.ownerDocument;
    var itemSpan, span, propertyValueElement;
    itemSpan = document.createElement('span');
    span = document.createElement('span');
    span.appendChild(document.createTextNode(key));
    span.style.color = '#930';
    itemSpan.appendChild(span);
    itemSpan.appendChild(document.createTextNode(': '));
    propertyValueElement = document.createElement('span');
    var logItem = LOG.getValueAsLogItem(this.value[key], this.stackedMode, this.alreadyLoggedContainers)
    propertyValueElement.appendChild(logItem.element);
    itemSpan.appendChild(propertyValueElement);
    var commaSpan = document.createElement('span')
    commaSpan.appendChild(document.createTextNode(', '));
    itemSpan.appendChild(commaSpan);
    this.properties[key] = {
        element: itemSpan,
        labelElement: span,
        propertyValueElement: propertyValueElement,
        commaSpan: commaSpan,
        logItem: logItem
    };
}

LOG.ObjectLogItem.prototype.updateAndMarkDifferences = function() {
    var me = this;
    function blinkProperty(key) {
        if (me.properties[key].blinkTimeout) {
            clearTimeout(me.properties[key].blinkTimeout);
        }
        me.properties[key].propertyValueElement.style.backgroundColor = 'yellow';
        me.properties[key].labelElement.style.backgroundColor = 'yellow';
        me.properties[key].blinkTimeout = setTimeout(
            function() {
                me.properties[key].propertyValueElement.style.backgroundColor = '';
                me.properties[key].labelElement.style.backgroundColor = '';
                delete me.properties[key].blinkTimeout;
            }, 1000
        );
    }
    
    function updateChangedProperty(key) {
        var propertyValueElement = me.properties[key].propertyValueElement;
        if (me.properties[key].logItem.onRemove) {
            me.properties[key].logItem.onRemove();
        }
        var wasShowingChildren = me.properties[key].logItem.getShowChildren && me.properties[key].logItem.getShowChildren();
        while (propertyValueElement.firstChild) {
            propertyValueElement.removeChild(propertyValueElement.firstChild);
        }
        me.properties[key].logItem = LOG.getValueAsLogItem(me.value[key], me.stackedMode, me.alreadyLoggedContainers);
        me.properties[key].element = me.properties[key].logItem.element;
        if (wasShowingChildren) {
            me.properties[key].logItem.setShowChildren(wasShowingChildren);
        }
        if (me.properties[key].logItem.setAutoUpdate) {
            me.properties[key].logItem.setAutoUpdate(!!me.autoUpdateInterval);
        }
        propertyValueElement.appendChild(me.properties[key].element);
        blinkProperty(key);
    }
    
    function updateAddedProperty(key) {
        me.keys.push(key);
        me.createProperty(key);
        me.setPropertyStackMode(key);
        if (!me.methodsVisible && typeof me.value[key] == 'function') {
            me.properties[key].element.style.display = 'none';
        } else { // the property will be visible and the last, update the lastVisibleProperty
            if (me.lastVisibleProperty) {
                me.lastVisibleProperty.commaSpan.style.display = '';
            }
            me.properties[key].commaSpan.style.display = 'none';
            me.lastVisibleProperty = me.properties[key];
            blinkProperty(key);
        }
        if (me.properties[key].logItem.setAutoUpdate) {
            me.properties[key].logItem.setAutoUpdate(!!me.autoUpdateInterval);
        }
        me.propertiesSpan.appendChild(me.properties[key].element);
    }
    
    function updateRemovedProperty(key) {
        if (me.properties[key].blinkTimeout) {
            clearTimeout(me.properties[key].blinkTimeout);
        }
        var property = me.properties[key];
        if (property.logItem.onRemove) {
            property.logItem.onRemove();
        }
        me.keys.splice(LOG.indexOf(me.keys, key), 1);
        property.propertyValueElement.style.backgroundColor = 'yellow';
        property.labelElement.style.backgroundColor = 'yellow';
        property.propertyValueElement.style.textDecoration = 'line-through';
        property.labelElement.style.textDecoration = 'line-through';
        
        setTimeout(
            function() {
                me.propertiesSpan.removeChild(property.element);
                if (me.lastVisibleProperty == property) {
                    me.lastVisibleProperty = null;
                    for (var i = me.keys.length - 1; i >= 0; --i) {
                        if (me.properties[me.keys[i]].element.style.display != 'none') {
                            me.lastVisibleProperty = me.properties[me.keys[i]];
                            me.lastVisibleProperty.commaSpan.style.display = 'none';
                            break;
                        }
                    }
                }
            }, 1000
        );
    }
    
    var diffs = LOG.getObjectDifferences(this.oldValue, this.value);
    for (var i = 0; i < diffs.changedKeys.length; ++i) {
        updateChangedProperty(diffs.changedKeys[i]);
    }
    for (var i = 0; i < diffs.addedKeys.length; ++i) {
        updateAddedProperty(diffs.addedKeys[i]);
    }
    for (var i = 0; i < diffs.removedKeys.length; ++i) {
        updateRemovedProperty(diffs.removedKeys[i]);
    }
    this.oldValue = LOG.shallowClone(this.value);
}

LOG.ObjectLogItem.prototype.onRemove = function() {
    this.setAutoUpdate(false);
}

LOG.ObjectLogItem.prototype.toggleAutoUpdate = function() {
    this.setAutoUpdate(!this.autoUpdateInterval);
}

LOG.ObjectLogItem.prototype.setAutoUpdate = function(enabled) {
    if (!!this.autoUpdateInterval == enabled) {
       return;
    }
    if (!this.showingChildren) {
        this.wasAutoUpdating = enabled;
        return;
    }
    if (this.autoUpdateInterval) {
        clearInterval(this.autoUpdateInterval);
        this.autoUpdateInterval = null;
        this.updateLink.firstChild.nodeValue = '\u21ba';
        this.updateLink.style.backgroundColor = '';
    } else {
        var me = this;
        this.autoUpdateInterval = setInterval(
            function() {
                me.updateAndMarkDifferences()
            },
            100
        );
        this.updateLink.firstChild.nodeValue = '\u21bb';
        this.updateLink.style.backgroundColor = '#af5';
    }
    for (var property in this.properties) {
        if (this.properties[property].logItem.setAutoUpdate) {
            this.properties[property].logItem.setAutoUpdate(enabled);
        }
    }
}

LOG.ObjectLogItem.prototype.setPropertyStackMode = function(key) {
    this.properties[key].element.style.marginLeft = this.currentStackedMode ? '2em' : '0';
    if (this.methodsVisible || typeof this.value[key] != 'function') {
        this.properties[key].element.style.display = this.currentStackedMode ? 'block' : 'inline';
    }
}

LOG.ObjectLogItem.prototype.setStackedMode = function(stacked, applyToChildren) {
    if (this.currentStackedMode == stacked) {
        return;
    }
    var text, margin;
    this.currentStackedMode = stacked;
    for (var key in this.properties) {
        this.setPropertyStackMode(key);
        if (applyToChildren && this.properties[key].logItem.setStackedMode) {
            this.properties[key].logItem.setStackedMode(stacked, applyToChildren);
        }
    }
    if (stacked) {
        this.stackedToggleLink.firstChild.nodeValue = '\u25bc';
    } else {
        this.stackedToggleLink.firstChild.nodeValue = '\u25ba';
    }
}

LOG.ObjectLogItem.prototype.toggleStackedMode = function(applyToChildren) {
    this.setStackedMode(!this.currentStackedMode, applyToChildren);
}

LOG.ObjectLogItem.prototype.toggleMethodsVisible = function() {
    this.methodsVisible = !this.methodsVisible;
    var key;
    if (this.lastVisibleProperty) {
        this.lastVisibleProperty.commaSpan.style.display = '';
    }
    this.lastVisibleProperty = null;
    for (var i = 0; i < this.keys.length; ++i) {
        key = this.keys[i];
        this.setPropertyStackMode(key);
        if (this.methodsVisible || typeof this.value[key] != 'function') {
            this.lastVisibleProperty = this.properties[key]; // always the last
            this.properties[key].element.style.display = this.currentStackedMode ? 'block' : 'inline';
        } else {
            this.properties[key].element.style.display = 'none';
        }
    }
    this.lastVisibleProperty.commaSpan.style.display = 'none';
    if (this.methodsVisible) {
        this.toggleMethodsLink.firstChild.nodeValue = '-';
    } else {
        this.toggleMethodsLink.firstChild.nodeValue = '+';
    }
}

LOG.ObjectLogItem.prototype.focusProperty = function(pathToProperty) {
    var property = pathToProperty.shift().name;
    if (typeof this.value[property] == 'function') {
        this.toggleMethodsVisible(true);
    }
    this.setShowChildren(true);
    if (pathToProperty.length == 0) {
        LOG.focusAndBlinkElement(this.properties[property].logItem.element);
    } else {
        if (this.properties[property].logItem.focusProperty) {
            this.properties[property].logItem.focusProperty(pathToProperty);
        }
    }
}

if (typeof LOG.TypedObjectLogItem == 'undefined') {
    LOG.TypedObjectLogItem = function() {
    }
}

LOG.TypedObjectLogItem.prototype.getTypeName = function() {
    var value = this.value;
    var txt = '';
    var objectToStringName = null;
    if (value.toString && value.toString && value.toString != Object.prototype.toString) {
        objectToStringName = (
            function() { // This is used to detect object like Window or Navigator which generate an [object Navigator] like toString()
                var match = value.toString().match(/^\[object ([a-zA-Z0-9_$]+)\]/);
                if (!match) {
                    return null;
                }
                return match[1];
            }
        )();
    }
    if (value.constructor && value.constructor.name) {
        txt += value.constructor.name.toString();
    } else if (objectToStringName) {
        txt += objectToStringName;
    } else if (value.getClassName) {
        txt += value.getClassName();
    } else {
        txt += 'Anonymous';
    }
    return txt;
}

LOG.TypedObjectLogItem.prototype.init = function(value, stackedMode, alreadyLoggedContainers) {
    var doc = LOG.LogObject.ownerDocument;
    this.showSource = false;
    this.value = value;
    this.stackedMode = stackedMode;
    this.alreadyLoggedContainers = alreadyLoggedContainers;
    this.autoUpdate = false;
    var decoration = '';
    if (value.Deleted) {
        decoration = 'line-through';
    }
    var me = this;
    var outlineElement;
    this.element = LOG.createElement(doc,
        'span',
        {},
        [
            LOG.getGetPositionInVariablesElement(value),
            '«',
            this.link = LOG.createElement(doc, 'a',
                {
                    style: {
                        color: 'gray',
                        textDecoration: decoration ? decoration : 'none'
                    },
                    href: '#',
                    onmouseover: function() {
                        me.link.style.textDecoration = 'underline ' + decoration;
                        if (value.getDomNode) {
                            var node = value.getDomNode();
                            if (node) {
                                outlineElement = LOG.createOutlineFromElement(node);
                            }
                        }
                    },
                    onmouseout: function() {
                        if (decoration) {
                            me.link.style.textDecoration = decoration;
                        } else {
                            me.link.style.textDecoration = 'none';
                        }
                        if (outlineElement) {
                            outlineElement.parentNode.removeChild(outlineElement);
                        }
                    },
                    onclick: function(event) {
                        if (!event) {
                            event = LOG.LogObject.getWindow().event;
                        }
                        if (event.ctrlKey) {
                            LOG.openClassInEditor(value);
                        } else {
                            LOG.LogObject.logAndStore(value);
                        }
                        LOG.stopPropagation(event);
                        LOG.preventDefault(event);
                    }
                },
                [
                    this.getTypeName()
                ]
            ),
            ' ',
            this.srcLink = LOG.createElement(doc, 'a',
                {
                    style: {
                        color: 'green',
                        textDecoration: 'none',
                        fontSize: '8pt'
                    },
                    href: '#',
                    onmouseover: function() {
                        me.srcLink.style.textDecoration = me.showSource ? 'line-through underline' : 'underline';
                    },
                    onmouseout: function() {
                        me.srcLink.style.textDecoration = me.showSource ? 'line-through' : 'none';
                    },
                    onclick: function(event) {
                        if (!event) {
                            event = LOG.LogObject.getWindow().event;
                        }
                        me.toggleShowSource();
                        LOG.stopPropagation(event);
                        LOG.preventDefault(event);
                    }
                },
                [
                    'src'
                ]
            ),
            LOG.getExtraInfoToLogAsHtmlElement(value, stackedMode, alreadyLoggedContainers),
            (typeof value.toString == 'function' && value.toString != Object.prototype.toString) ? ' ' + value.toString() : null,
            this.srcElement = LOG.createElement(doc, 'span'),
            '»'
        ]
    );
}

LOG.TypedObjectLogItem.prototype.focusProperty = function(pathToProperty) {
    if (!this.showSource) {
        this.setShowSource(true);
    }
    this.objectLogItem.focusProperty(pathToProperty);
}

LOG.TypedObjectLogItem.prototype.setAutoUpdate = function(enabled) {
    this.autoUpdate = enabled;
    if (this.objectLogItem) {
        this.objectLogItem.setAutoUpdate(enabled);
    }
}

LOG.TypedObjectLogItem.prototype.toggleShowSource = function() {
    this.setShowSource(!this.showSource);
}

LOG.TypedObjectLogItem.prototype.setShowSource = function(showSource) {
    if (this.showSource == showSource) {
        return;
    }
    var doc = LOG.LogObject.ownerDocument;
    this.showSource = showSource;
    if (showSource) {
        this.srcLink.style.textDecoration = 'line-through';
        this.srcElement.appendChild(doc.createTextNode(' '));
        this.objectLogItem = new LOG.ObjectLogItem;
        this.objectLogItem.init(this.value, this.stackedMode, this.alreadyLoggedContainers, true, false);
        if (this.autoUpdate) {
            this.objectLogItem.setAutoUpdate(true);
        }
        this.srcElement.appendChild(this.objectLogItem.element);
    } else {
        this.objectLogItem.setAutoUpdate(false);
        delete this.objectLogItem;
        this.srcLink.style.textDecoration = 'none';
        while (this.srcElement.firstChild) {
            this.srcElement.removeChild(this.srcElement.firstChild);
        }
    }
}

LOG.writeStringToInput = function(str) {
    var currentWordAndPosition = LOG.LogObject.getCurrentWordAndPosition();
    LOG.LogObject.input.value = LOG.LogObject.input.value.substr(0, currentWordAndPosition.end) + str +
        LOG.LogObject.input.value.substr(currentWordAndPosition.end)
    ;
    var endPos = currentWordAndPosition.end + str.length;
    LOG.setTextInputSelection(LOG.LogObject.input, [endPos, endPos]);
    LOG.LogObject.input.focus();
}

LOG.getGetPositionInVariablesElement = function(value) {
    var doc = LOG.LogObject.ownerDocument;
    var positionInVariables = LOG.indexOf(LOG.clickedMessages, value);
    if (positionInVariables == -1) {
        return null;
    }
    return LOG.createElement(doc, 'a',
        {
            style: {
                fontSize: '7pt',
                color: '#66a'
            },
            onclick: function(event) {
                if (!event) {
                    event = LOG.LogObject.getWindow().event;
                }
                LOG.writeStringToInput('$' + positionInVariables)
                LOG.stopPropagation(event);
                LOG.preventDefault(event);
            }
        },
        [
            '$' + positionInVariables
        ]
    );
}

LOG.getValueAsHtmlElement = function(value, stackedMode, alreadyLoggedContainers, showFirstLevelObjectChildren, showExpandObjectChildren) {
   return LOG.getValueAsLogItem(value, stackedMode, alreadyLoggedContainers, showFirstLevelObjectChildren, showExpandObjectChildren).element;
}

LOG.getExtraInfoToLogAsHtmlElement = function(value, stackedMode, alreadyLoggedContainers) {
    if (!value.getExtraInfoToLog) {
        return null;
    }
    var extraInfoToLog = value.getExtraInfoToLog();
    var doc = LOG.LogObject.ownerDocument;
    var element = LOG.createElement(doc, 'span', {});

    for (var item in extraInfoToLog) {
        if (typeof extraInfoToLog[item] == 'function') {
            element.appendChild(document.createTextNode(' '));
            var link = LOG.createElement(doc, 'a',
                {
                    style: {
                        textDecoration: 'none',
                        color: 'green',
                        fontSize: '8pt'
                    },
                    href: '#',
                    onclick: (function(item) {
                        return function(event) {
                            if (!event) {
                                event = LOG.LogObject.getWindow().event;
                            }
                            Log(extraInfoToLog[item].call(value));
                            LOG.stopPropagation(event);
                            LOG.preventDefault(event);
                        }
                    })(item)
                },
                [
                    item
                ]
            )
            element.appendChild(link);
        } else {
            var span = LOG.createElement(doc, 'span',
                {
                    style: {
                        color: '#039',
                        fontSize: '8pt'
                    }
                },
                [' ' + item + ': ']
            );
            element.appendChild(span);
            element.appendChild(LOG.getValueAsHtmlElement(extraInfoToLog[item], stackedMode, alreadyLoggedContainers));
        }
    }
    return element;
}


LOG.getValueAsLogItem = function(value, stackedMode, alreadyLoggedContainers, showFirstLevelObjectChildren, showExpandObjectChildren) {
    // Simple object (used as hash tables), array, html element and typed objects are special (since they are implemented as separate objects) and should be handled separately
    if (value != null && typeof value == 'object') {
        if (value.nodeType && value.nodeType == 1) { // 1: element node
            var logItem = new LOG.HTMLElementLogItem;
            logItem.init(value, stackedMode, alreadyLoggedContainers);
            return logItem;
        }  else if (value instanceof Array || /* filter DOM Select elements */ !value.nodeType && value.item && typeof value.length != 'undefined') {
            var logItem = new LOG.ArrayLogItem;
            logItem.init(value, stackedMode, alreadyLoggedContainers);
            return logItem;
        } else if (value.getClassName || value instanceof String || value instanceof Date || value instanceof Number || value instanceof Boolean) { // an object we can Log
            var logItem = new LOG.TypedObjectLogItem;
            logItem.init(value, stackedMode, alreadyLoggedContainers);
            return logItem;
        } else {
            var logItem = new LOG.ObjectLogItem;
            logItem.init(value, stackedMode, alreadyLoggedContainers, showFirstLevelObjectChildren, showExpandObjectChildren);
            return logItem;
        }
    }
    
    function appendExtraInfoToLog() {
        var extraInfoElement = LOG.getExtraInfoToLogAsHtmlElement(value, stackedMode, alreadyLoggedContainers);
        if (extraInfoElement) {
            fragment.appendChild(extraInfoElement);
        }
    }
    
    // We know the value is not a hash type object or an array or html element or a typed object
    var document = LOG.LogObject.ownerDocument;
    var i;
    var fragment = document.createDocumentFragment();
    
    var span = LOG.getGetPositionInVariablesElement(value);
    if (span) {
        fragment.appendChild(span);
    }
    
    if (!alreadyLoggedContainers) {
        alreadyLoggedContainers = [];
    }
    if (typeof value == 'object') {
        if (value == null) {
            fragment.appendChild(document.createTextNode('null'));
        } else if (LOG.indexOf(alreadyLoggedContainers, value) != -1) {
            fragment.appendChild(document.createTextNode('<Ref>'));
        } else if (typeof value == 'object' && value.nodeType == 8) { // 8 = comment
            fragment.appendChild(document.createTextNode('[Comment] '));
            fragment.appendChild(LOG.getValueAsHtmlElement(value.nodeValue, stackedMode, alreadyLoggedContainers));
        } else if (typeof value == 'object' && value.nodeName == '#text') {
            fragment.appendChild(document.createTextNode('[NodeText] '));
            fragment.appendChild(LOG.getValueAsHtmlElement(value.nodeValue, stackedMode, alreadyLoggedContainers));
        }
    } else if (typeof value == 'string') {
        fragment.appendChild(document.createTextNode('"' + value.toString() + '"'));
    } else if (typeof value == 'function') {
        var result = /function[^(]*(\([^)]*\))/.exec(value.toString());
        var text;
        if (!result) {
            text = document.createTextNode(value.toString());
        } else {
            text = 'f' + result[1];
        }
        
        fragment.appendChild(document.createTextNode('«'));
        
        
        var link = document.createElement('a');
        link.style.textDecoration = 'none';
        link.style.color = 'gray';
        link.appendChild(document.createTextNode(text));
        fragment.appendChild(link);
        link.href = '#';
        LOG.addEventListener(link, 'mouseover',
            function() {
                link.style.textDecoration = 'underline';
            }
        );
        LOG.addEventListener(link, 'mouseout',
            function() {
                link.style.textDecoration = 'none';
            }
        );
        LOG.addEventListener(link, 'click',
            function(event) {
                LOG.preventDefault(event);
                LOG.stopPropagation(event);
                LOG.LogObject.logAndStore(value);
            }
        );
        
        fragment.appendChild(document.createTextNode(' '));
        var srcLink = document.createElement('a');
        srcLink.style.textDecoration = 'none';
        srcLink.style.color = 'green';
        srcLink.style.fontSize = '8pt';
        srcLink.appendChild(document.createTextNode('src'));
        
        LOG.addEventListener(srcLink, 'mouseover',
            function() {
                srcLink.style.textDecoration = 'underline';
            }
        );
        LOG.addEventListener(srcLink, 'mouseout',
            function() {
                srcLink.style.textDecoration = 'none';
            }
        );
        LOG.addEventListener(srcLink, 'click',
            function(event) {
                LOG.LogObject.appendRow(document.createTextNode('\n' + value.toString()));
                LOG.preventDefault(event);
                LOG.stopPropagation(event);
            }
        );
        fragment.appendChild(srcLink);
        appendExtraInfoToLog();
        fragment.appendChild(document.createTextNode('»'));
    } else if (typeof value != 'undefined' && typeof value.toString == 'function') {
        fragment.appendChild(document.createTextNode(value.toString()));
    }
    return {
       element: fragment
    };
}

LOG.getObjectProperties = function(object) {
    var item, items = [];
    for (item in object) {
        items.push(item);
    }
    return items;
}

LOG.createOutlineFromElement = function(element) {
    var div = document.createElement('div');
    div.style.border = '2px solid red';
    div.style.position = 'absolute';
    div.style.width = element.offsetWidth + 'px';
    div.style.height = element.offsetHeight + 'px';
    var pos = LOG.getPosition(element);
    div.style.left = pos.x + 'px';
    div.style.top = pos.y + 'px';
    var labelElement = document.createElement('label');
    labelElement.appendChild(document.createTextNode(element.tagName + '-' + element.id));
    labelElement.style.backgroundColor = '#FFF';
    labelElement.onclick = function() {
      Log(element);
    }
    div.appendChild(labelElement);
    LOG.getBody().appendChild(div);
    return div;
}

LOG.logObjectSource = function(object, title) {
    var logItem = new LOG.ObjectLogItem;
    logItem.init(object, LOG.LogObject.stackedMode);
    LOG.LogObject.appendRow(logItem.element, title);
    return LOG.dontLogResult;
}

LOG.onKeyDown = function(event) {
    var chr = String.fromCharCode(event.keyCode).toLowerCase();
    if (event.altKey) {
        if (chr == 'o') {
            if (!LOG.LogObject.elementCreated) {
                LOG.LogObject.stopDebugging = false;
                LOG.LogObject.createElement();
            }
            var logObjectGone = false;
            try {
                LOG.LogObject.show();
            } catch (e) {
                logObjectGone = true;
            }
            if (!logObjectGone && LOG.LogObject.ownerDocument.defaultView) {
                LOG.LogObject.ownerDocument.defaultView.focus();
                LOG.LogObject.input.focus();
            } else {
                if (logObjectGone || !LOG.LogObject.ownerDocument.parentWindow) {
                    LOG.LogObject.createElement();
                } else {
                    LOG.LogObject.ownerDocument.parentWindow.focus();
                    LOG.LogObject.input.focus();
                }
            }
        } else if (chr == 'i') {
            if (!LOG.LogObject.elementCreated || LOG.LogObject.ownerDocument == document) {
                LOG.LogObject.onNewWindowClick(event);
            }
            setTimeout(
                function() {
                    if (LOG.LogObject.ownerDocument.defaultView) {
                        LOG.LogObject.ownerDocument.defaultView.focus();
                    }  else {
                        LOG.LogObject.ownerDocument.parentWindow.focus();
                    }
                    LOG.LogObject.input.focus();
               }, 0
            );
        } else if (LOG.LogObject.elementCreated) {
            if (chr == 'c') {
                LOG.LogObject.onClearClick(event);
            } else if (chr == 'p') {
                LOG.LogObject.onPauseClick(event);
            } else if (chr == 'k') {
                LOG.LogObject.onCloseClick(event);
            } else if (chr == 'x') {
                LOG.LogObject.selectContextCombo.focus();
            } else if (chr == 'h') {
                LOG.LogObject.onHideClick(event);
            }
        }
    }
}

LOG.getEvalFunction = function() {
    return "function (str, additionalVariables) {\n" +
        "    for (var name in additionalVariables) {\n" +
        "        eval(\"var \" + name + \" = additionalVariables['\" + name + \"'];\");\n" +
        "    }\n" +
        "    return eval(str);\n" +
        "}\n";
}

LOG.guessNameAsArray = function(objToFind) {
    function getPath(item) {
        var path = [];
        while (item) {
            path.unshift(item);
            item = item.parent;
        }
        return path;
    }
    
    var checkedObjects = [];
    var objectsToCheck = [
        { obj: page, name: LOG.pageObjectName, parent: null }
    ];
    for (var i = 0; i < objectsToCheck.length; ++i) {
        if (objectsToCheck[i].obj == objToFind) {
            return getPath(objectsToCheck[i]);
        }
    }
    var name, currentItem;
    while (objectsToCheck.length > 0) {
        currentItem = objectsToCheck.shift();
        parentObj = currentItem.obj;
        for (name in parentObj) {
            try {
                if (!parentObj[name]) {
                    continue;
                }
            } catch (e) {
                continue;
            }
            if (parentObj[name] === objToFind) {
                return getPath(
                    {
                        obj: parentObj[name],
                        name: name,
                        parent: currentItem
                    }
                );
            }
            if (typeof parentObj[name] != "object") {
                continue;
            }
            if (parentObj[name].nodeType) {
                continue;
            }
            if (parentObj[name] == window) {
                continue;
            }
            if (LOG.indexOf(checkedObjects, parentObj[name]) !== -1) {
                continue;
            }
            checkedObjects.push(parentObj[name]);
            objectsToCheck.push(
                {
                    obj: parentObj[name],
                    name: name,
                    parent: currentItem
                }
            );
        }
    }
    return null;
}

//  This returns:
//      "1" -> "[1]" // integers get enclosed in square brackets
//      "name" -> ".name" // no conversion was necessary
//      "a value" -> "[\"a value\"]" // it has value which is not valid as an identifier, so it gets quoted and enclosed
LOG.getPropertyAccessor = function(propertyName) {
    var nameMustNotBeQuotedRegexp = /^[a-z_$][a-z0-9_$]*$/i;
    var isIntegerRegexp = /^[0-9]+$/i;
    var isInteger;
    if (nameMustNotBeQuotedRegexp.test(propertyName)) {
        return '.' + propertyName;
    } else {
        var out = '[';
        isInteger = isIntegerRegexp.test(propertyName);
        if (!isInteger) {
            out += '"';
        }
        out += propertyName.replace('"', "\\\"]");
        if (!isInteger) {
            out += '"';
        }
        out += ']';
        return out;
    }
}

LOG.guessName = function(objToFind) {
    function pathToString(pathElements) {
        var out = pathElements[0];
        for (var i = 1; i < pathElements.length; ++i) {
            out += LOG.getPropertyAccessor(pathElements[i].name);
        }
        return out;
    }
    var path = LOG.guessNameAsArray(objToFind);
    if (path) {
        return pathToString(path);
    }
    return null;
}

LOG.getChildNodeNumber = function(domNode) {
    var childNodes = domNode.parentNode.childNodes;
    for (var i = 0; i < childNodes.length; ++i) {
        if (childNodes[i] == domNode) {
            return i;
        }
    }
    return null;
}

LOG.guessDomNodeOwnerName = function(domNode) {
    if (domNode == null) {
        return null;
    } else {
        var path = LOG.guessNameAsArray(domNode);
        if (path == null) {
            var returnValue = LOG.guessDomNodeOwnerName(domNode.parentNode);
            if (returnValue == null) {
                return null;
            }
            returnValue.pathToElement.push(LOG.getChildNodeNumber(domNode));
            return returnValue;
        } else {
            return {
                pathToObject: path,
                pathToElement: []
            }
            return path;
        }
    }
}

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
        LOG.LogObject.focusValue(element);
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

LOG.throwExceptionWithStack = function(name, message, sourceException) {
    if (DOM.isGecko) {
        try {
            ({}).nonExistentMethod();
        } catch (e2) {
            var newE = {};
            if (sourceException) {
                newE.name = sourceException.name;
                newE.message = message ? message : sourceException.message;
            } else {
                newE.name = name;
                newE.message = message;
            }
            newE.fileName = e2.fileName;
            newE.lineNumber = e2.lineNumber;
            newE.stack = e2.stack;
            throw newE;
        }
    } else {
        throw name;
    }
}

LOG.openClassInEditor = function(value) {
    if (value.getPackage()) {
        var packageName = value.getPackage().name;
        var className = value.getSimpleClassName();
        document.location = 'openClass.php?package=' + escape(packageName) + '&class=' + escape(className);
    }
}

LOG.addEventListener(document, 'mousedown', LOG.onMouseDown, true);
LOG.addEventListener(document, 'mouseup', LOG.onClick, true);
LOG.addEventListener(document, 'click', LOG.onClick, true);
LOG.addEventListener(document, 'keydown', LOG.onKeyDown, true);
LOG.addEventListener(document, 'selectstart', LOG.onDocumentSelectStart, true);

function Log(message, title, section, dontOpen, stackedMode) {
    return LOG.LogObject.log(message, title, true, section, dontOpen, stackedMode);
}

function LogX(str) { // Log in external window
    var win = window.open("", "log", "resizable=yes,scrollbars=yes,status=yes");
    win.document.open();
    win.document.write('<html><head><title>LogX</title></head><body><pre id="pre" style="white-space: -moz-pre-wrap"> </pre></html>');
    win.document.close();
    win.document.getElementById('pre').firstChild.nodeValue = str;
}

// Log expression (usage: eval(LogE("expression")))
function LogE(expression) {
    return '(function() { return Log(' + expression + ', ' + expression.toSource() + ') } )();';
}

var DEBUG_MODE = false;

if (LOG.getCookie('LOG_DEBUG_MODE') == "true") {
    DEBUG_MODE = true;
}

if (!LOG.loaded) {
    LOG.willOpenInNewWindow = LOG.getCookie('LOG_IN_NEW_WINDOW') == 'true';
    LOG.history = LOG.getCookie('LOG_HISTORY');
    if (LOG.history) {
        try {
            LOG.history = eval('(' + LOG.history + ')');
            if (LOG.history.length > 0) {
                LOG.historyPosition = LOG.history.length;
            }
        } catch (e) {
            LOG.history = [];
            LOG.historyPosition = -1;
        }
    } else {
        LOG.history = [];
        LOG.historyPosition = -1;
    }
    
    (function() {
        var logWasOpen = LOG.getCookie('LOG_OPEN');
        if (logWasOpen == 'true') {
            LOG.LogObject.createElement();
            var openConsoles = LOG.getCookie('LOG_OPEN_CONSOLES');
            if (openConsoles) {
                LOG.LogObject.consoles.console.panel.setSelected(false);
                openConsoles = openConsoles.split(',');
                for (var i = 0; i < openConsoles.length; ++i) {
                    if (LOG.LogObject.consoles[openConsoles[i]]) {
                        LOG.LogObject.consoles[openConsoles[i]].panel.setSelected(true);
                    } else {
                        LOG.LogObject.addConsole(openConsoles[i]).panel.setSelected(true);
                    }
                }
            }
        }
    })();
} else {
    if (LOG.wasOpen) {
        LOG.LogObject.createElement();
    }
}

function LogError(e) {
    var logItem = new LOG.ExceptionLogItem;
    logItem.init(e);
    LOG.LogObject.appendRow(
        logItem.element,
        'error',
        true,
        'red'
    );
    return LOG.dontLogResult;
}

LOG.loaded = true;
