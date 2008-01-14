LOG.HistoryManager = function(serializedHistory) {
    if (serializedHistory) {
        try {
            this.history = eval('(' + serializedHistory + ')');
            if (this.history.length > 0) {
                this.historyPosition = this.history.length;
            }
        } catch (e) {
            this.history = [];
            this.historyPosition = 0;
        }
    } else {
        this.history = [];
        this.historyPosition = 0;
    }
    this.currentValue = '';
}

LOG.HistoryManager.prototype.serialize = function() {
    var maxLength = 2000; // since all the log's history will be kept in a cookie
    var strLength = 3; // since we count both square brackets and the comma of the next element
    var appendedOne = false;
    var items = [], item;
    for (var i = this.history.length - 1; i >= 0; --i) {
        item = "\"" + this.history[i].replace('"', "\"") + "\"";
        if (strLength + item.length > maxLength) {
            break;
        }
        items.unshift(item);
        strLength += item.length + 1;
    }
    return '[' + items.join(',') + ']';
}

LOG.HistoryManager.prototype.add = function(text) {
    this.currentValue = '';
    if (this.history[this.history.length - 1] != text) {
        this.history.push(text);
    }
    this.historyPosition = this.history.length;
}

LOG.HistoryManager.prototype.up = function(currentValue) {
    if (this.historyPosition == this.history.length) {
        this.currentValue = currentValue;
    }
    if (this.historyPosition > 0) {
        --this.historyPosition;
    }
    return this.getCurrent();
}

LOG.HistoryManager.prototype.down = function() {
    if (this.historyPosition == this.history.length - 1) {
        this.historyPosition = this.history.length;
    } else if (this.historyPosition != -1 && this.historyPosition < this.history.length - 1) {
        ++this.historyPosition;
    }
    return this.getCurrent();
}

LOG.HistoryManager.prototype.getCurrent = function() {
    if (this.historyPosition == this.history.length) {
        return this.currentValue;
    } else {
        return this.history[this.historyPosition];
    }
}
