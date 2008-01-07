LOG.Class('AbstractBox');

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
    var totalFixedSize = 0, fixedSizeUnit, unitName, item;
    for (var i = 0; i < this.sizes.length; ++i) {
        item = this.sizes[i];
        unitName = item.sizeUnit; 
        if (unitName != '%') {
            if (!fixedSizeUnit) {
                fixedSizeUnit = unitName;
            } else if (fixedSizeUnit != unitName) {
                throw "Inconsistent units (all non percentage units should be of the same type)";
            }
            totalFixedSize += item.size;
        }
    }
    return { size: totalFixedSize, name: fixedSizeUnit };
}

LOG.AbstractBox.prototype.updateSizes = function() {
    function setStyle(element, property, value) {
        element.style[property] = value;
    }
    
    var fixedSize = this.getFixedSize();
    
    var item, node, marginSize;
    for (var i = 0; i < this.sizes.length; ++i) {
        item = this.sizes[i];
        node = this.element.childNodes[i];
        setStyle(node, this.sizeProperty.toLowerCase(), item.size + item.sizeUnit);
        if (item.sizeUnit == '%') {
            marginSize = fixedSize.size * item.size / 100;
            if (marginSize) {
                var margin = marginSize + fixedSize.name; 
                setStyle(node, 'margin' + this.reservedSpacePosition, '-' + margin);
                setStyle(node, 'padding' + this.reservedSpacePosition, margin);
            }
        }
    }
}

LOG.AbstractBox.prototype.setChildSize = function(childNumber, size, sizeUnit) {
    this.sizes[childNumber].size = size;
    this.sizes[childNumber].sizeUnit = sizeUnit;
    this.updateSizes();
}

LOG.AbstractBox.prototype.getChildSize = function(childNumber) {
    return this.sizes[childNumber];
}

LOG.AbstractBox.prototype.add = function(element, size) { //  size: { size, sizeUnit: %|px|em }
    this.element.appendChild(
        LOG.createElement(
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
        )
    );
    
    this.sizes.push(size);
    this.updateSizes();
}

if (!LOG.Hbox) {
    LOG.Hbox = function() {
    }
}


LOG.Hbox.prototype = new LOG.AbstractBox;
LOG.Hbox.prototype.sizeProperty = 'width';
LOG.Hbox.prototype.reservedSpacePosition = 'Right';


if (!LOG.Vbox) {
    LOG.Vbox = function() {
    }
}

LOG.Vbox.prototype = new LOG.AbstractBox;
LOG.Vbox.prototype.sizeProperty = 'height';
LOG.Vbox.prototype.reservedSpacePosition = 'Bottom';
