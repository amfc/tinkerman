LOG.BasicLogItem = function(doc, value, stackedMode, alreadyLoggedContainers) {
    function getText() {
        if (typeof value == 'object') {
            if (value == null) {
                return 'null';
            } else if (typeof value == 'object' && value.nodeType == 8) { // 8 = comment
                return '[Comment] ' + value.nodeValue;
            } else if (typeof value == 'object' && value.nodeType == 3) { // 3 = text node
                return '[TextNode] ' + value.nodeValue;
            }
        } else if (typeof value == 'undefined') {
            return 'undefined';
        } else if (typeof value == 'string') {
            return '"' + value.toString().replace(/"/, '\\"') + '"';
        } else if (typeof value != 'undefined' && typeof value.toString == 'function') {
            return value.toString();
        }
    }
    
    this.element = LOG.createElement(doc, 'span', {}, [
        LOG.getGetPositionInVariablesElement(doc, value),
        getText(),
        LOG.getExtraInfoToLogAsHtmlElement(doc, value, stackedMode, alreadyLoggedContainers)
    ]);
}