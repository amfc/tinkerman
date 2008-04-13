if (LOG.isIE7) { // (no box-sizing available)
    LOG.BoxItem = function(doc, sizeProperty, reservedSpacePosition, element, size) { //  size: { size, sizeUnit: %|px|em }
        this.doc = doc;
        this.reservedSpacePosition = reservedSpacePosition;
        this.sizeProperty = sizeProperty;
        this.size = size;
        this.element = LOG.createElement(
            this.doc, 'div',
            {
                style: {
                    height: '100%',
                    width: '100%',
                    borderWidth: '0',
                    padding: 0,
                    borderSpacing: 0
                }
            },
            [
                LOG.createElement(
                    this.doc, 'table',
                    {
                        style: {
                            height: '100%',
                            width: '100%',
                            borderWidth: '0',
                            padding: 0,
                            borderSpacing: 0
                        }
                    },
                    [
                        LOG.createElement(
                            this.doc, 'tbody', {},
                            [
                                LOG.createElement(
                                    this.doc, 'tr', {},
                                    [
                                        LOG.createElement(
                                            this.doc, 'td', { style: { height: '100%', padding: 0 }},
                                            [
                                                element
                                            ]
                                        )
                                    ]
                                ),
                                LOG.createElement(
                                    this.doc, 'tr', {},
                                    [
                                        this.secondTd = LOG.createElement(
                                            this.doc, 'td', { style: {padding: 0} }
                                        )
                                    ]
                                )
                            ]
                        )
                    ]
                )
            ]
        );
    }

    LOG.BoxItem.prototype.updateSize = function(fixedSize) {
        this.element.style[this.sizeProperty] = this.size.size + this.size.sizeUnit;
        if (this.size.sizeUnit == '%') {
            var marginSize = fixedSize.size * this.size.size / 100;
            var margin = marginSize + (fixedSize.name ? fixedSize.name : '');
            this.element.style['margin' + this.reservedSpacePosition] = '-' + margin;
            this.secondTd.style[this.sizeProperty] = margin;
            this.secondTd.style.display = '';
        } else {
            this.secondTd.style.display = 'none';
        }
    }
} else {
    LOG.BoxItem = function(doc, sizeProperty, reservedSpacePosition, element, size) { //  size: { size, sizeUnit: %|px|em }
        this.doc = doc;
        this.reservedSpacePosition = reservedSpacePosition;
        this.sizeProperty = sizeProperty;
        this.size = size;
        
        this.element = LOG.createElement(
            this.doc, 'div',
            { // opera 9.25 doesn't understand border-box if set as as an attribute of .style
                style: 'position: relative; -moz-box-sizing: border-box; box-sizing: border-box'
            },
            [
            
                LOG.createElement(
                    this.doc, 'div',
                    {
                        style: {
                            height: '100%',
                            overflow: 'hidden'
                        }
                    },
                    [
                        element
                    ]
                )
            ]
        );
    }

    LOG.BoxItem.prototype.updateSize = function(fixedSize) {
        this.element.style[this.sizeProperty] = this.size.size + this.size.sizeUnit;
        if (this.size.sizeUnit == '%') {
            var marginSize = fixedSize.size * this.size.size / 100;
            var margin = marginSize + (fixedSize.name ? fixedSize.name : '');
            this.element.style['margin' + this.reservedSpacePosition] = '-' + margin;
            this.element.style['padding' + this.reservedSpacePosition] = margin;
        }
    }
}

LOG.setTypeName(LOG.BoxItem, 'LOG.BoxItem');

LOG.BoxItem.prototype.getSize = function(size) {
    return this.size;
}

LOG.BoxItem.prototype.setSize = function(size) {
    this.size = size;
}

LOG.BoxItem.prototype.setHidden = function(hidden) {
    this.hidden = hidden;
    this.element.style.display = hidden ? 'none' : '';
}

LOG.BoxItem.prototype.getHidden = function() {
    return this.hidden;
}


LOG.AbstractBox = function() {
}

LOG.setTypeName(LOG.AbstractBox, 'LOG.AbstractBox');

LOG.AbstractBox.prototype.init = function(doc) {
    this.doc = doc;
    this.element = LOG.createElement(
        doc,
        'div',
        {
            style: {
                position: 'relative',
                overflow: 'hidden',
                height: '100%',
                width: '100%'
            }
        }
    );
    this.sizes = [];
}

LOG.AbstractBox.prototype.getFixedSize = function() {
    var totalFixedSize = 0, fixedSizeUnit, unitName, item, size;
    for (var i = 0; i < this.sizes.length; ++i) {
        item = this.sizes[i];
        if (item.getHidden()) {
            continue;
        }
        size = item.size;
        unitName = size.sizeUnit; 
        if (unitName != '%') {
            if (!fixedSizeUnit) {
                fixedSizeUnit = unitName;
            } else if (fixedSizeUnit != unitName) {
                throw "Inconsistent units (all non percentage units should be of the same type)";
            }
            totalFixedSize += size.size;
        }
    }
    return { size: totalFixedSize, name: fixedSizeUnit };
}

LOG.AbstractBox.prototype.updateSizes = function() {
    var fixedSize = this.getFixedSize();
    for (var i = 0; i < this.sizes.length; ++i) {
        this.sizes[i].updateSize(fixedSize);
    }
}

LOG.AbstractBox.prototype.setChildSize = function(childNumber, size, sizeUnit) {
    this.sizes[childNumber].setSize(size, sizeUnit);
    this.updateSizes();
}

LOG.AbstractBox.prototype.setChildHidden = function(childNumber, hidden) {
    this.sizes[childNumber].setHidden(hidden);
    this.updateSizes();
}

LOG.AbstractBox.prototype.getChildSize = function(childNumber) {
    return this.sizes[childNumber];
}

LOG.AbstractBox.prototype.add = function(element, size) { //  size: { size, sizeUnit: %|px|em }
    var boxItem = new LOG.BoxItem(this.doc, this.sizeProperty, this.reservedSpacePosition, element, size);
    this.element.appendChild(boxItem.element);
    this.sizes.push(boxItem);
    this.updateSizes();
}

LOG.Hbox = function(doc) {
    this.init(doc);
}

LOG.setTypeName(LOG.Hbox, 'LOG.Hbox');

LOG.Hbox.prototype = new LOG.AbstractBox;
LOG.Hbox.prototype.sizeProperty = 'width';
LOG.Hbox.prototype.reservedSpacePosition = 'Right';


LOG.Vbox = function(doc) {
    this.init(doc);
}

LOG.setTypeName(LOG.Vbox, 'LOG.Vbox');

LOG.Vbox.prototype = new LOG.AbstractBox;
LOG.Vbox.prototype.sizeProperty = 'height';
LOG.Vbox.prototype.reservedSpacePosition = 'Bottom';
