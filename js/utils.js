/**
 * Compare strings accounting for collation (lowercase/no accents)
 * - c7n prefix stands for collation -
 */
function c7nCompare(a, b) {
    return String(a).toLowerCase().localeCompare(String(b).toLowerCase())
}

/**
 * Sorts keys of the hash accounting for collation (lowercase/no accents)
 */
function c7nSortedHashKeys(hash) {
    var sorted = []
    $.each(hash, function (key) {
        sorted.push(key);
    });
    // should used proper collation Ecole > ZZ
    sorted.sort(c7nCompare);
    return sorted;
}

/**
 * Returns a hash that contains all the url params.
 */
function getURLParams() {
    var searchString = window.location.search.substring(1),
        params = searchString.split("&"),
        hash = {};

    for (var i = 0, len = params.length; i < len; i++) {
        var val = params[i].split("="),
            key = val[0];
        
        if (key) {
            hash[key.toLowerCase()] = val[1].toLowerCase();
        }
    }
    return hash;
}