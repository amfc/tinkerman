LOG.addCookie = function(name, value, days) {
    var path;
    if (LOG.isIE) {
        path = '/';
    } else {
        path = document.location.pathname;
    }
    var expires = '';
    if (days) {
        var date = new Date();
        date.setTime(date.getTime() + (days * 24 * 60 * 60 * 1000));
        expires = '; expires=' + date.toGMTString();
    }
    document.cookie = name + '=' + escape(value) + expires + '; path=' + path;
}

LOG.getCookie = function(name) {
    var nameEQ = name + '=';
    var cookieStrings = document.cookie.split(';');
    var cookieString;
    for (var i = 0; i < cookieStrings.length; ++i) {
        cookieString = cookieStrings[i];
        while (cookieString.charAt(0) == ' ') {
            cookieString = cookieString.substring(1);
        }
        if (cookieString.indexOf(nameEQ) == 0) {
            return unescape(cookieString.substring(nameEQ.length));
        }
    }
    return null;
}
