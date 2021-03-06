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
        document.location = 'openClass.php?fileName=' + escape(Package.getFileName(packageName)) + '&class=' + escape(className);
    }
}

LOG.openPhpMethodInEditor = function(className, method) {
    document.location = 'openMethod.php?fileName=' + escape('actions/' + className + '.php') + '&method=' + escape(method) + '&class=' + escape(className);
}