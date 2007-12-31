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
    var document = LOG.console.ownerDocument;
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
    var document = LOG.console.ownerDocument;
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
    if (LOG.console.wrapperElement) {
        return LOG.console.wrapperTopElement;
    } else {
        return document.body;
    }
}

// This works both with <input type=text>s and <textarea>s
// returns an array [start, end]
LOG.getTextInputSelection = function(element) {
    var document = LOG.console.ownerDocument;
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
            event = LOG.console.getWindow().event;
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
