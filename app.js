App = (function () {
    "use strict";
    
    var GMAP = google.maps,
        GMAP_MARKER = GMAP.Marker,
        GMAP_EVENT = GMAP.event,
        GMAP_LAT_LNG = GMAP.LatLng,
        customIcons = {
            parc: {
                icon: 'http://labs.google.com/ridefinder/images/mm_20_green.png',
                shadow: 'http://labs.google.com/ridefinder/images/mm_20_shadow.png'
            },
          
            other: {
                icon: 'http://labs.google.com/ridefinder/images/mm_20_red.png',
                shadow: 'http://labs.google.com/ridefinder/images/mm_20_shadow.png'
            }
        },
        activeMarkers = [],
        searchInput,
        map, infoWindow;
        
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
        request.send();
    }
    
    function on(el, eventName, handler) {
        var hasAddEventListener = !!window.addEventListener;
        el[hasAddEventListener? 'addEventListener' : 'attachEvent']((hasAddEventListener? '' : 'on') + eventName, handler);
    }
    
    function getMarkers(criterias, callback) {
        criterias = criterias || '';
        
        ajax('phpsqlajax_genxml3.php?' + criterias, function (request, status) {  
            callback(JSON.parse(request.responseText), status);
        });
    }
    
    function onMarkerClick() {
        var data = this._data;
        
        infoWindow.setContent([
            '<b>', data.name, '</b><br>',
            data.address, '<br>',
            data.installations
        ].join(''));
        
        infoWindow.open(map, this);
    }
    
    function addMarkers(markers) {
        var mapMarker, marker, icon;
         
        for (var i = 0, len = markers.length; i < len; i++) {
            
            mapMarker = new GMAP_MARKER({
                map: map,
                position: new GMAP_LAT_LNG(
                    parseFloat((marker = markers[i]).lat),
                    parseFloat(marker.lng)
                ),
                icon: (icon = customIcons[marker.type] || {}).icon,
                shadow: icon.shadow
            });
            
            activeMarkers.push(mapMarker);
            
            mapMarker._data = marker;
            
            GMAP_EVENT.addListener(mapMarker, 'click', onMarkerClick);
        }
    }
    
    function removeAllMarkers() {
        var i = activeMarkers.length - 1,
            marker;
        
        while (i >= 0) {
            (marker = activeMarkers[i]).setMap(null);
            GMAP_EVENT.clearInstanceListeners(marker);
            activeMarkers.splice(i, 1);
            i--;
        }
    }
    
    function onMarkersLoad(markers, status) {
        if (status !== 200) {
            //TODO: Handle error
            return;
        }
        
        addMarkers(markers);
    }
    
    function search(criterias) {
        removeAllMarkers();
        getMarkers(criterias, onMarkersLoad);
    }
    
    function installDOMListeners() {
        
        on(document, 'click', function (e) {
            var target = e.target;
            
            if (!target || target.type !== 'checkbox') {
                return;
            }
            
            search(buildCriterias());
        });
        
        //TODO: Free-text search function
        /*
        on(searchInput, 'keypress', function (e) {
            if (e.keyCode && e.keyCode === 13) {
                search(buildCriterias() + '&query=' + searchInput.value);
            }
        });
        */
    }
    
    function buildCriterias() {
        var checks = document.querySelectorAll('[type="checkbox"]'),
            i = 0,
            len = checks.length,
            lastIndex = len - 1,
            sectors = '',
            installations = '',
            input;
            
        for (; i < len; i++) {
            input = checks[i];
            
            switch (input.checked && input.name) {
                case 'installation':
                    installations += input.value + ',';
                    break;
                case 'sector':
                    sectors += input.value + ',';
                    break;
            }
        }
        
        return encodeURI(
            (installations === ''? '' : 'installations=' + installations.slice(0, -1))
            + (sectors === ''? '' : (installations? '&' : '') + 'sectors=' + sectors.slice(0, -1))
        );
    }
    
    return {
        init: function () {
            
            map = new GMAP.Map(document.getElementById("map"), {
                center: new GMAP_LAT_LNG(45.486740, -75.633217),
                zoom: 11,
                mapTypeId: 'roadmap'
            });
            
            infoWindow = new GMAP.InfoWindow();
            
            search('');
            
            //searchInput = document.getElementById('search-input');
            
            installDOMListeners();
        }
    };
})();
