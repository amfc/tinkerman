LOG.AbstractBox = function() {
}

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
        if (item.hidden) {
            continue;
        }
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
            var margin = marginSize + (fixedSize.name ? fixedSize.name : '');
            setStyle(node, 'margin' + this.reservedSpacePosition, '-' + margin);
            setStyle(node, 'padding' + this.reservedSpacePosition, margin);
        }
    }
}

LOG.AbstractBox.prototype.setChildSize = function(childNumber, size, sizeUnit) {
    this.sizes[childNumber].size = size;
    this.sizes[childNumber].sizeUnit = sizeUnit;
    this.updateSizes();
}

LOG.AbstractBox.prototype.setChildHidden = function(childNumber, hidden) {
    this.sizes[childNumber].hidden = hidden;
    this.sizes[childNumber].element.style.display = hidden ? 'none': '';
    this.updateSizes();
}

LOG.AbstractBox.prototype.getChildSize = function(childNumber) {
    return this.sizes[childNumber];
}

LOG.AbstractBox.prototype.add = function(element, size) { //  size: { size, sizeUnit: %|px|em }
    var sizeElement;
    this.element.appendChild(
        sizeElement = LOG.createElement(
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
    size.element = sizeElement;
    this.sizes.push(size);
    this.updateSizes();
}

LOG.Hbox = function(doc) {
    this.init(doc);
}


LOG.Hbox.prototype = new LOG.AbstractBox;
LOG.Hbox.prototype.sizeProperty = 'width';
LOG.Hbox.prototype.reservedSpacePosition = 'Right';


LOG.Vbox = function(doc) {
    this.init(doc);
}

LOG.Vbox.prototype = new LOG.AbstractBox;
LOG.Vbox.prototype.sizeProperty = 'height';
LOG.Vbox.prototype.reservedSpacePosition = 'Bottom';
