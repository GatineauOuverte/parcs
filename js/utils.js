function ajax(url, callback) {
    var request = window.XMLHttpRequest?
        new XMLHttpRequest() :
        new ActiveXObject('Microsoft.XMLHTTP');

    request.onreadystatechange = function() {
        if (request.readyState == 4) {
            callback(request, request.status);
        }
    };
    request.open('GET', url, true);
    request.send(null);
}

function on(el, eventName, handler) {
    var hasAddEventListener = !!window.addEventListener;
    el[hasAddEventListener? 'addEventListener' : 'attachEvent']((hasAddEventListener? '' : 'on') + eventName, handler);
}