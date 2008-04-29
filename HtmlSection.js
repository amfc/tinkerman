LOG.HtmlSection = function(doc) {
    this.doc = doc;
    this.logItem = new LOG.HTMLElementLogItem(this.doc, document.getElementsByTagName('html')[0], false, [], true);
    this.element = LOG.createElement(this.doc, 'div', {}, [ this.logItem.element ]);
}

LOG.setTypeName(LOG.HtmlSection, 'LOG.HtmlSection');

LOG.HtmlSection.prototype.setSelected = function(isSelected) {
    this.selected = isSelected;
}

LOG.HtmlSection.prototype.getSelected = function() {
    return this.selected;
}

LOG.HtmlSection.prototype.focusValue = function(value, dontLog, panel, dontSeparateBySpaces) {
    function getPathToNodeFromHtmlNode(node) {
        var htmlNode = document.getElementsByTagName('html')[0];
        var path = [];
        while (node && node != htmlNode) {
            path.unshift(LOG.getChildNodeNumber(node));
            node = LOG.logRunner.getParentNodeHidingContainer(node); // this takes into account the extra elements which the LOG could have added and ignores them
        }
        return path;
    }
    if (this.selected && value.nodeType) {
        // Focus the element in the html panel
        if (this.logItem) {
            var elementLogItem = this.logItem.expandChild(getPathToNodeFromHtmlNode(value));
            if (elementLogItem) {
                panel.scrollElementIntoView(elementLogItem.element);
                LOG.blinkElement(elementLogItem.element);
            }
        }
    }
}
