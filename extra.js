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
