LOG.FunctionLogItem = function(doc, value, stackedMode, alreadyLoggedContainers) {
    function getName() {
        var result = /function[^(]*(\([^)]*\))/.exec(value.toString());
        if (!result) {
            return value.toString();
        } else {
            return 'f' + result[1];
        }
    }
    
    if (!alreadyLoggedContainers) {
        alreadyLoggedContainers = [];
    }
    
    this.value = value;
    var link, srcLink;
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
                [ getName() ]
            ),
            ' ',
            srcLink = LOG.createElement(doc, 'a',
                {
                    style: {
                        textDecoration: 'none',
                        color: 'green',
                        fontSize: '8pt'
                    },
                    href: '#',
                    onmouseover: function() {
                        srcLink.style.textDecoration = 'underline';
                    },
                    onmouseout: function() {
                        srcLink.style.textDecoration = 'none';
                    },
                    onclick: LOG.createEventHandler(doc, this, 'onSrcClick')
                },
                [ 'src' ]
            ),
            LOG.getExtraInfoToLogAsHtmlElement(doc, value, stackedMode, alreadyLoggedContainers),
            '»'
        ]
    );
}

LOG.setTypeName(LOG.FunctionLogItem, 'LOG.FunctionLogItem');

LOG.FunctionLogItem.prototype.onSrcClick = function(event) {
    LOG.preventDefault(event);
    LOG.stopPropagation(event);
    Log(this.value.toString());
}

LOG.FunctionLogItem.prototype.onNameClick = function(event) {
    LOG.preventDefault(event);
    LOG.stopPropagation(event);
    LogAndStore(this.value);
}
