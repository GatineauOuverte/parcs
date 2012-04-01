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
