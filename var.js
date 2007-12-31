// Gets the index of an element of an array or false if it doesn't exist
LOG.indexOf = function(arr, item) {
    for (var i = 0; i < arr.length; i++) {
        if (arr[i] == item) {
            return i;
        }
    }
    return -1;
}

LOG.getObjectProperties = function(object) {
    var item, items = [];
    for (item in object) {
        items.push(item);
    }
    return items;
}
