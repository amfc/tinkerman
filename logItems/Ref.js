LOG.RefLogItem = function(doc, value, stackedMode, alreadyLoggedContainers) {
    this.value = value;
    var link;
    this.element = LOG.createElement(doc, 'span', {},
        [
            LOG.getGetPositionInVariablesElement(doc, value),
            '«',
            link = LOG.createElement(doc, 'a',
                {
                    style: {
                        textDecoration: 'none',
                        color: 'gray'
                    },
                    href: '#',
                    onmouseover: function() {
                        link.style.textDecoration = 'underline';
                    },
                    onmouseout: function() {
                        link.style.textDecoration = 'none';
                    },
                    onclick: LOG.createEventHandler(doc, this, 'onNameClick')
                },
                [ 'Ref#' + LOG.indexOf(alreadyLoggedContainers, value) ]
            ),
            '»'
        ]
    );
}

LOG.setTypeName(LOG.RefLogItem, 'LOG.RefLogItem');

LOG.RefLogItem.prototype.onNameClick = function(event) {
    LOG.preventDefault(event);
    LOG.stopPropagation(event);
    LogAndStore(this.value);
}
