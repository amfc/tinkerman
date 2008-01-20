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

LOG.isWhitespace = function(s) {
    var whitespace = " \t\n\r";
    for (var i = 0; i < s.length; i++) {
        if (whitespace.indexOf(s.charAt(i)) == -1) {
            return false;
        }
    }
    return true;
}
