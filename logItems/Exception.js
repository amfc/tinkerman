// This works with JS and PHP exceptions traces
LOG.ExceptionLogItem = function(doc, value) {
    this.doc = doc;
    var link;
    var me = this;
    this.showingMoreInfo = false;
    this.value = value;
    
    if (LOG.isIE && !value.type == 'PHP') {
        this.stack = this.getStackFromArguments();
    } else {
        this.stack = this.value.stack;
    }
    var exceptionName = 'Exception';
    try {
        if (value.name) {
            exceptionName = value.name;
        }
    } catch (e) {
    }
    
    var exceptionMessage = 'Could not access message';
    try {
        if (value.message) {
            exceptionMessage = value.message;
        } else if (typeof value == 'string') {
            exceptionMessage = value;
        }
    } catch (e) {
        try {
            exceptionMessage = value.toString();
        } catch (e) {
        }
    }
    
    this.element = LOG.createElement(
        this.doc, 'span',
        {},
        [
            LOG.getGetPositionInVariablesElement(this.doc, value),
            '«',
            link = LOG.createElement(
                this.doc, 'a',
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
                    onclick: LOG.createEventHandler(this.doc, this, 'onNameLinkClik')
                },
                [ exceptionName ]
            ),
            ' ',
            exceptionMessage,
            LOG.isGecko ? ' in ' : null,
            (LOG.isGecko && this.value.fileName) ? this.getFileLink(this.getLocalFile(this.value.fileName), this.value.lineNumber) : null,
            ' ',
            this.showMoreLink = LOG.createElement(this.doc, 'a',
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
                    onclick: LOG.createEventHandler(this.doc, this, 'onShowMoreLinkClick')
                },
                [ 'more' ]
            ),
            this.moreInfoSpan = LOG.createElement(this.doc, 'span'),
            '»'
        ]
    );
}

LOG.setTypeName(LOG.ExceptionLogItem, 'LOG.ExceptionLogItem');

LOG.ExceptionLogItem.prototype.onShowMoreLinkClick = function(event) {
    LOG.preventDefault(event);
    LOG.stopPropagation(event);
    this.toggleShowMoreInfo();
}

LOG.ExceptionLogItem.prototype.onNameLinkClick = function(event) {
    LogAndStore(this.value);
    LOG.stopPropagation(event);
    LOG.preventDefault(event);
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
    var currentCaller = arguments.callee.caller;
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
        return LOG.getValueAsHtmlElement(this.doc, this.stack);
    } else if (this.value.stack) {
        if (typeof this.value.stack == 'string') {
            stackArray = this.getStackAsArray(this.value.stack);
        } else {
            stackArray = this.value.stack;
        }
        var element = LOG.createElement(this.doc, 'div');
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
                LOG.createElement(this.doc, 'div',
                    {},
                    [
                        link,
                        link ? ': ' + stackArray[i]['function'] : stackArray[i]['function'],
                        stackArray[i]['args'] ? LOG.createElement(this.doc, 'span',
                            {},
                            [
                                ' (',
                                LOG.getValueAsHtmlElement(this.doc, stackArray[i]['args']),
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
            this.doc, 'div',
            {
            },
            [
                'No more info available'
            ]
        );
    }
}

// FIXME: iats dependency: this should be done from outside
LOG.ExceptionLogItem.getFileLink = function(ownerDoc, fileName, lineNumber) { // this is available to use from outside
    var onClickListener = {
        onClick: function(event) {
            if (OPEN_FILES_ON_SERVER) {
                LOG.preventDefault(event);
                var request = LOG.createHttpRequest();
                request.open('GET', 'openFile.php?file=' + escape(fileName) + '&line=' + lineNumber + '&onServer=1', false);
                request.send(null);
            }
        }
    };
    return LOG.createElement(
        ownerDoc, 'a',
        {
            href: 'openFile.php?file=' + escape(fileName) + '&line=' + lineNumber,
            onclick: LOG.createEventHandler(ownerDoc, onClickListener, 'onClick')
        },
        [
            fileName + ' line ' + lineNumber
        ]
    );
}

LOG.ExceptionLogItem.prototype.getFileLink = function(fileName, lineNumber) {
    return LOG.ExceptionLogItem.getFileLink(this.doc, fileName, lineNumber);
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
