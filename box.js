if (!LOG.AbstractBox) {
    LOG.AbstractBox = function() {
    }
}

LOG.AbstractBox.prototype.init = function(doc, boxItemSizes) {
    this.doc = doc;
    this.element = doc.createElement('div');
    this.element.className = this.className;
    this.sizes = boxItemSizes;
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

LOG.AbstractBox.prototype.getTotalMinimumSize = function() {
    var totalFixedSize = 0, fixedSizeUnit, unitValue, item, unitName;
    for (var i = 0; i < this.sizes.length; ++i) {
        item = this.sizes[i];
        unitName = item.sizeUnit;
        if (unitName != '%') {
            continue;
        }
        if (!item.minSize) {
            continue;
        }
        unitName = item.minSizeUnit;
        if (!unitName) {
            throw "Missing required parameter. If minSize parameter is set, minSizeUnit is required.";
        }
        unitValue = item.minSize;
        if (fixedSizeUnit == null) {
            fixedSizeUnit = unitName;
        } else if (fixedSizeUnit != unitName) {
            throw "Inconsistent units (all non percentage units should be of the same type)";
        }
        totalFixedSize += unitValue;
    }
    return { size: totalFixedSize, name: fixedSizeUnit };
}

// How much can this child can expand before compromising other children's minimum sizes?
LOG.AbstractBox.prototype.getChildAvailableSize = function(childNumber) {
    var totalFixedSize = 0, item;
    var totalSize = 0;
    for (var i = 0; i < this.sizes.length; ++i) {
        if (i == childNumber) {
            continue;
        }
        totalSize += this.getChildOffsetSize(i);
        item = this.sizes[i];
        if (item.minSize) {
            if (item.minSizeUnit != 'px') {
                throw "getAvailableSize requires all minimum sizes to be set in pixels to work";
            }
            totalFixedSize += item.minSize;
        }
    }
    return totalSize - totalFixedSize;
}

// This only works with pixels or percentages
LOG.AbstractBox.prototype.getExtraSpaceNeededToResizeChild = function(childNumber, newSize) {
    var usedSpace = 0;
    for (var i = 0; i < this.sizes.length; ++i) {
        if (i == childNumber) {
            usedSpace += newSize;
            continue;
        }
        if (this.sizes[i].sizeUnit == '%') {
            if (this.sizes[i].minSizeUnit != 'px') {
                throw "getAvailableSize requires all minimum sizes to be set in pixels to work";
            }
            usedSpace += this.sizes[i].minSize;
        } else if (this.sizes[i].sizeUnit == 'px') {
            usedSpace += this.sizes[i].size;
        } else {
            throw "getExtraSpaceNeededToResize requires all sizes to be set in pixels or percentages to work";
        }
    }
    var newFreeSpace = desktopHbox.element.offsetWidth - usedSpace;
    if (newFreeSpace < 0) {
        return -newFreeSpace;
    } else {
        return 0;
    }
}

// This only works if the all minimum sizes are specified in pixels
LOG.AbstractBox.prototype.getChildOffsetSize = function(childNumber) {
    return this.element.childNodes[childNumber].firstChild[this.sizeProperty == 'width' ? 'offsetWidth' : 'offsetHeight'];
}

LOG.AbstractBox.prototype.updateSizes = function() {
    function setStyle(element, property, value) {
        element.style.setProperty(property, value, null);
    }
    
    var fixedSize = this.getFixedSize();
    var totalMinimumSize = this.getTotalMinimumSize();
    if (!totalMinimumSize.name && fixedSize.name) {
        totalMinimumSize.name = fixedSize.name;
    }
    if (totalMinimumSize.name && !fixedSize.name) {
        fixedSize.name = totalMinimumSize.name;
    }
    
    setStyle(this.element, 'min-' + this.sizeProperty, (fixedSize.size + totalMinimumSize.size) + fixedSize.name);
    
    var item, node, marginSize;
    for (var i = 0; i < this.sizes.length; ++i) {
        item = this.sizes[i];
        node = this.element.childNodes[i];
        setStyle(node, this.sizeProperty, item.size + item.sizeUnit);
        if (item.sizeUnit == '%') {
            marginSize = fixedSize.size * item.size / 100;
            if (item.minSize) {
                setStyle(node, 'min-' + this.sizeProperty, (item.minSize + marginSize) + item.minSizeUnit);
            }
            if (marginSize) {
                var margin = marginSize + fixedSize.name; 
                setStyle(node, 'margin-' + this.reservedSpacePosition, '-' + margin);
                setStyle(node, 'padding-' + this.reservedSpacePosition, margin);
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

LOG.AbstractBox.prototype.add = function(element, size) { //  size: { size, sizeUnit: '%' | 'px', minSize, minSizeUnit }
    var outer = this.doc.createElement('div');
    var inner = this.doc.createElement('div');
    outer.className = 'LOG_box_outer';
    outer.appendChild(inner);
    inner.appendChild(element);
    outer.className = 'LOG_box_inner';
    this.sizes.push(size);
    this.element.appendChild(outer);
    this.updateSizes();
}

if (!LOG.Hbox) {
    LOG.Hbox = function() {
    }
}

LOG.Hbox.prototype = new LOG.AbstractBox;
LOG.Hbox.prototype.sizeProperty = 'width';
LOG.Hbox.prototype.reservedSpacePosition = 'right';
LOG.Hbox.prototype.className = 'LOG_hbox';


if (!LOG.Vbox) {
    LOG.Vbox = function() {
    }
}

LOG.Vbox.prototype = new LOG.AbstractBox;
LOG.Vbox.prototype.sizeProperty = 'height';
LOG.Vbox.prototype.reservedSpacePosition = 'bottom';
LOG.Vbox.prototype.className = 'LOG_vbox';
