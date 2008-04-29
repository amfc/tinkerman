// example for objectsToStartWith: [ { obj: page, name: 'page', parent: null } ]
LOG.guessNameAsArray = function(objToFind, objectsToStartWith) {
    function getPath(item) {
        var path = [];
        while (item) {
            path.unshift(item);
            item = item.parent;
        }
        return path;
    }
    
    var checkedObjects = [];
    var objectsToCheck = objectsToStartWith;
    for (var i = 0; i < objectsToCheck.length; ++i) {
        if (objectsToCheck[i].obj == objToFind) {
            return getPath(objectsToCheck[i]);
        }
    }
    var name, currentItem;
    while (objectsToCheck.length > 0) {
        currentItem = objectsToCheck.shift();
        parentObj = currentItem.obj;
        if (parentObj.dontGuessNames) {
            continue;
        }
        for (name in parentObj) {
            try {
                if (!parentObj[name]) {
                    continue;
                }
            } catch (e) {
                continue;
            }
            if (parentObj[name] === objToFind) {
                return getPath(
                    {
                        obj: parentObj[name],
                        name: name,
                        parent: currentItem
                    }
                );
            }
            if (typeof parentObj[name] != "object") {
                continue;
            }
            try {
                if (parentObj[name].nodeType) {
                    continue;
                }
                if (parentObj[name] == window) {
                    continue;
                }
                if (LOG.indexOf(checkedObjects, parentObj[name]) !== -1) {
                    continue;
                }
            } catch (e) {
                continue;
            }
            checkedObjects.push(parentObj[name]);
            objectsToCheck.push(
                {
                    obj: parentObj[name],
                    name: name,
                    parent: currentItem
                }
            );
        }
    }
    return null;
}

//  This returns:
//      "1" -> "[1]" // integers get enclosed in square brackets
//      "name" -> ".name" // no conversion was necessary
//      "a value" -> "[\"a value\"]" // it has value which is not valid as an identifier, so it gets quoted and enclosed
LOG.getPropertyAccessor = function(propertyName) {
    var nameMustNotBeQuotedRegexp = /^[a-z_$][a-z0-9_$]*$/i;
    var isIntegerRegexp = /^[0-9]+$/i;
    var isInteger;
    if (nameMustNotBeQuotedRegexp.test(propertyName)) {
        return '.' + propertyName;
    } else {
        var out = '[';
        isInteger = isIntegerRegexp.test(propertyName);
        if (!isInteger) {
            out += '"';
        }
        out += propertyName.replace('"', "\\\"]");
        if (!isInteger) {
            out += '"';
        }
        out += ']';
        return out;
    }
}

LOG.guessName = function(objToFind, objectsToStartWith) {
    function objectPathToString(pathElements) {
        var out = pathElements[0].name;
        for (var i = 1; i < pathElements.length; ++i) {
            out += LOG.getPropertyAccessor(pathElements[i].name);
        }
        return out;
    }
    function elementPathToString(pathElements) {
        var out = '';
        for (var i = 0; i < pathElements.length; ++i) {
            if (i > 0) {
                out += '.';
            }
            out += 'childNodes[' + pathElements[i] + ']';
        }
        return out;
    }
    var path = LOG.guessDomNodeOwnerName(objToFind, objectsToStartWith);
    if (path) {
        var str = objectPathToString(path.pathToObject);
        if (path.pathToElement.length) {
            str += '.' + elementPathToString(path.pathToElement)
        }
        return str;
    }
    return null;
}

LOG.getChildNodeNumber = function(domNode) {
    var childNodes = domNode.parentNode.childNodes;
    for (var i = 0; i < childNodes.length; ++i) {
        if (childNodes[i] == domNode) {
            return i;
        }
    }
    return null;
}

LOG.guessDomNodeOwnerName = function(domNode, objectsToStartWith) {
    if (domNode == null) {
        return null;
    } else {
        var path = LOG.guessNameAsArray(domNode, objectsToStartWith);
        if (path == null) {
            var returnValue = LOG.guessDomNodeOwnerName(domNode.parentNode, objectsToStartWith);
            if (returnValue == null) {
                return null;
            }
            returnValue.pathToElement.push(LOG.getChildNodeNumber(domNode));
            return returnValue;
        } else {
            return {
                pathToObject: path,
                pathToElement: []
            }
            return path;
        }
    }
}

