LOG.shallowClone = function(obj) {
    var item, out;
    if (obj.constructor == Array) {
        out = [];
    } else {
        out = {};
    }
    for (item in obj) {
        out[item] = obj[item];
    }
    return out;
}

LOG.getObjectDifferences = function(oldObject, newObject) {
    var oldKeys = LOG.getObjectProperties(oldObject);
    var newKeys = LOG.getObjectProperties(newObject);
    var addedKeys = [];
    var i;
    for (i = 0; i < newKeys.length; ++i) {
        if (LOG.indexOf(oldKeys, newKeys[i]) == -1) {
            addedKeys.push(newKeys[i]);
        }
    }
    var removedKeys = [];
    for (i = 0; i < oldKeys.length; ++i) {
        if (LOG.indexOf(newKeys, oldKeys[i]) == -1) {
            removedKeys.push(oldKeys[i]);
        }
    }
    var notRemovedKeys = [];
    for (i = 0; i < oldKeys.length; ++i) {
        if (LOG.indexOf(removedKeys, oldKeys[i]) == -1) {
            notRemovedKeys.push(oldKeys[i]);
        }
    }
    var changedKeys = [], key;
    for (i = 0; i < notRemovedKeys.length; ++i) {
        key = notRemovedKeys[i];
        if (oldObject[key] != newObject[key]) {
            changedKeys.push(key);
        }
    }
    return {
        addedKeys: addedKeys,
        removedKeys: removedKeys,
        changedKeys: changedKeys
    };
}
