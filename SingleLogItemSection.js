LOG.SingleLogItemSection = function(doc, logItem) {
    this.doc = doc;
    this.element = LOG.createElement(this.doc, 'div', {}, [ logItem.element ]);
    this.logItem = logItem;
}

LOG.setTypeName(LOG.SingleLogItemSection, 'LOG.SingleLogItemSection');

LOG.SingleLogItemSection.prototype.setSelected = function(isSelected) {
    this.selected = isSelected;
}

LOG.SingleLogItemSection.prototype.getSelected = function() {
    return this.selected;
}

LOG.SingleLogItemSection.prototype.focusValue = function(value, dontLog, panel) {
    var path = LOG.guessDomNodeOwnerName(value);
    if (!dontLog) {
        // Log the path into the console panel
        var logItem = new LOG.PathToObjectLogItem(this.doc, path);
        LOG.logger.defaultConsole.appendRow(logItem.element);
    }
    if (path) {
        if (this.logItem && this.logItem.value == path.pathToObject[0].obj) {
            path.pathToObject.shift(); // remove the 'page' part
            if (path.pathToObject.length == 0) {
                panel.scrollElementIntoView(this.logItem.element);
                LOG.blinkElement(this.logItem.element);
            } else {
                var propertyLogItem = this.logItem.expandProperty(path.pathToObject);
                panel.scrollElementIntoView(propertyLogItem.element);
                LOG.blinkElement(propertyLogItem.element);
            }
        }
    }
}
