LOG.Evaluator = function(logger) {
    this.logger = logger;
}

LOG.setTypeName(LOG.Evaluator, 'LOG.Evaluator');

LOG.Evaluator.prototype.evalScriptAndPrintResults = function($script) {
    var result = this.evalScript($script);
    if (result !== LOG.dontLogResult) {
        if ($script.indexOf('\n') == -1) {
            this.logger.log(result, $script, true);
        } else {
            this.logger.log(result, $script.substr(0, $script.indexOf('\n')) + '...', true);
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
        this.logger.logText(
            '\n$0, $1 ... $n: clicked element' +
            '\n$E(element): createOutlineFromElement' +
            '\n$S(object, title): logObjectSource' +
            '\n$P(object): getObjectProperties',
            'Help'
        );
        return LOG.dontLogResult;
    }
    try {
        var vars = {
            '$P': LOG.getObjectProperties,
            '$S': function(object, title) { return me.logger.logObjectSource(object, title) }
        };
        for (var i = 0; i < LOG.clickedMessages.length; ++i) {
           vars['$' + i] = LOG.clickedMessages[i];
        }
        return this.evaluate($script, vars);
    } catch (e) {
        this.logger.logException(e, 'error ' + $script);
        return LOG.dontLogResult;
    }
}