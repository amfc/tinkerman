var DEBUG_MODE = false;

if (LOG.getCookie('LOG_DEBUG_MODE') == "true") {
    DEBUG_MODE = true;
}

//~ if (!LOG.loaded) {
    //~ LOG.console = new LOG.Console;
    //~ LOG.console.init();
    //~ LOG.willOpenInNewWindow = LOG.getCookie('LOG_IN_NEW_WINDOW') == 'true';
    
    //~ (function() {
        //~ var logWasOpen = LOG.getCookie('LOG_OPEN');
        //~ if (logWasOpen == 'true') {
            //~ LOG.console.createElement();
            //~ var openConsoles = LOG.getCookie('LOG_OPEN_CONSOLES');
            //~ if (openConsoles) {
                //~ LOG.console.consoles.console.panel.setSelected(false);
                //~ openConsoles = openConsoles.split(',');
                //~ for (var i = 0; i < openConsoles.length; ++i) {
                    //~ if (LOG.console.consoles[openConsoles[i]]) {
                        //~ LOG.console.consoles[openConsoles[i]].panel.setSelected(true);
                    //~ } else {
                        //~ LOG.console.addConsole(openConsoles[i]).panel.setSelected(true);
                    //~ }
                //~ }
            //~ }
        //~ }
    //~ })();
//~ } else {
    //~ if (LOG.wasOpen) {
        //~ LOG.console.createElement();
    //~ }
//~ }

LOG.logRunner = new LOG.LogRunner;
LOG.logRunner.init(document);

LOG.loaded = true;
