LOG.getDefaultHtml = function(onload) {
    LOG.onHtmlLoadFunction = onload;
    return '<html><head><link rel="stylesheet" type="text/css" href="' + LOG.url + 'style.css"></head><body><script type="text/javascript">(top.LOG ? top.LOG : opener.LOG).onHtmlLoadFunction();</script></body></html>';
}

LOG.logRunner = new LOG.LogRunner(document);

LOG.loaded = true;
