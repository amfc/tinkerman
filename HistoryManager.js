LOG.Class('HistoryManager');

LOG.HistoryManager.prototype.init = function(serializedHistory) {
    if (serializedHistory) {
        try {
            this.history = eval('(' + this.history + ')');
            if (this.history.length > 0) {
                this.historyPosition = this.history.length;
            }
        } catch (e) {
            this.history = [];
            this.historyPosition = -1;
        }
    } else {
        this.history = [];
        this.historyPosition = -1;
    }
}

LOG.HistoryManager.prototype.add = function(text) {
    if (this.history[this.history.length - 1] != text) {
        this.history.push(text);
    }
    this.historyPosition = this.history.length;
}

LOG.HistoryManager.prototype.canGoUp = function() {
    return this.historyPosition > 0;
}


LOG.HistoryManager.prototype.up = function() {
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
        return '';
    } else {
        return this.history[this.historyPosition];
    }
}
