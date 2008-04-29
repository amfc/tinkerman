LOG.SingleLogItemSection = function(doc, logItem, objectName) {
    this.doc = doc;
    this.element = LOG.createElement(this.doc, 'div', {}, [ logItem.element ]);
    this.logItem = logItem;
    this.objectName = objectName;
}

LOG.setTypeName(LOG.SingleLogItemSection, 'LOG.SingleLogItemSection');

LOG.SingleLogItemSection.prototype.setSelected = function(isSelected) {
    this.selected = isSelected;
}

LOG.SingleLogItemSection.prototype.getSelected = function() {
    return this.selected;
}

LOG.SingleLogItemSection.prototype.focusValue = function(value, dontLog, panel, dontSeparateBySpaces) {
    if (!this.objectName) {
        return;
    }
    var path = LOG.guessDomNodeOwnerName(value, [ { obj: this.logItem.value, name: this.objectName, parent: null } ]);
    if (!dontLog) {
        // Log the path into the console panel
        var logItem = new LOG.PathToObjectLogItem(this.doc, path, dontSeparateBySpaces);
        LOG.logger.defaultConsole.appendRow(logItem.element);
    }
    if (path && this.selected) {
        if (this.logItem.value == path.pathToObject[0].obj) {
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
