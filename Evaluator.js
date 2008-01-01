LOG.Class('Evaluator');

LOG.Evaluator.prototype.init = function(console) {
    this.console = console;
    this.stackedMode = true;
}

LOG.Evaluator.prototype.log = function(message, title, newLineAfterTitle, consoleName, dontOpen, stackedMode) {
    this.console.appendRow(
        LOG.getValueAsHtmlElement(
            message,
            stackedMode == undefined ?
            this.stackedMode :
            stackedMode,
            undefined,
            true,
            true
        ),
        title,
        newLineAfterTitle,
        null,
        consoleName,
        dontOpen
    );
    return message;
}

LOG.Evaluator.prototype.logAndStore = function(value, source) {
    var pos = LOG.indexOf(LOG.clickedMessages, value);
    if (pos == -1) {
        pos = LOG.clickedMessages.length;
        LOG.clickedMessages[pos] = value;
    }
    
    if (source) {
        this.logObjectSource(value, null, this.stackedMode);
    } else {
        this.console.appendRow(LOG.getValueAsHtmlElement(value, this.stackedMode, undefined, true));
    }
    if (this.console.commandEditor.commandInput.element.value == '' || this.console.commandEditor.commandInput.element.value.match(/^\$[0-9]+$/)) {
        this.console.commandEditor.commandInput.element.value = '$' + pos;
    }
    return;
}

LOG.Evaluator.prototype.evalScriptAndPrintResults = function($script) {
    var result = this.evalScript($script);
    if (result !== LOG.dontLogResult) {
        if ($script.indexOf('\n') == -1) {
            this.log(result, $script, true);
        } else {
            this.log(result, $script.substr(0, $script.indexOf('\n')) + '...', true);
        }
    }
}

LOG.Evaluator.prototype.evaluate = function(code, additionalVariables) {
    for (var name in additionalVariables) {
        eval("var " + name + " = additionalVariables['" + name + "'];");
    }
    return eval(code);
}

LOG.Evaluator.prototype.evalScript = function($script) {
    var me = this;
    if ($script == 'help') {
        this.console.appendRow(
            this.ownerDocument.createTextNode(
                '\n$0, $1 ... $n: clicked element' +
                '\n$E(element): createOutlineFromElement' +
                '\n$S(object, title): logObjectSource' +
                '\n$P(object): getObjectProperties'
            ), 'Help'
        );
        return LOG.dontLogResult;
    }
    try {
        var vars = {
            '$P': LOG.getObjectProperties,
            '$S': function(object, title) { return me.logObjectSource(object, title) },
            '$E': LOG.createOutlineFromElement
        };
        for (var i = 0; i < LOG.clickedMessages.length; ++i) {
           vars['$' + i] = LOG.clickedMessages[i];
        }
        return this.evaluate($script, vars);
    } catch (e) {
        var logItem = new LOG.ExceptionLogItem;
        logItem.init(e);
        this.console.appendRow(
            logItem.element,
            'error ' + $script,
            true,
            'red'
        );
        return LOG.dontLogResult;
    }
}

LOG.Evaluator.prototype.logObjectSource = function(object, title) {
    var logItem = new LOG.ObjectLogItem;
    logItem.init(object, this.stackedMode);
    this.console.appendRow(logItem.element, title);
    return LOG.dontLogResult;
}
