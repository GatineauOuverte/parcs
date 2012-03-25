App = (function () {
    var customIcons = {
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
        request.send('');
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

    function bindInfoWindow(marker, html) {
        google.maps.event.addListener(marker, 'click', function() {
            infoWindow.setContent(html);
            infoWindow.open(map, marker);
        });
    }
    
    function addMarkers(markers) {
        var mapMarker, point, marker, icon;
         
        for (var i = 0, len = markers.length; i < len; i++) {
            marker = markers[i];
            
            point = new google.maps.LatLng(
                parseFloat(marker.lat),
                parseFloat(marker.lng)
            );
            
            icon = customIcons[marker.type] || {};
            
            mapMarker = new google.maps.Marker({
                map: map,
                position: point,
                icon: icon.icon,
                shadow: icon.shadow
            });
            
            mapMarker.installations = marker.installations;
            
            activeMarkers.push(mapMarker);
            
            bindInfoWindow(mapMarker, [
                '<b>', marker.name, '</b><br>',
                marker.address, '<br>',
                marker.installations
            ].join(''));
        }
    }
    
    function removeAllMarkers() {
        for (var i = 0, len = activeMarkers.length; i < len; i++) {
            activeMarkers[i].setMap(null);
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
    
    function installHandlers() {
        on(document, 'click', function (e) {
            var target = e.target;
            
            if (!target || target.type !== 'checkbox') {
                return;
            }
            
            search(buildCriterias());
        });
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
            
            map = new google.maps.Map(document.getElementById("map"), {
                center: new google.maps.LatLng(45.486740, -75.633217),
                zoom: 11,
                mapTypeId: 'roadmap'
            });
            
            infoWindow = new google.maps.InfoWindow();
            
            search('');
            
            installHandlers();
        }
    };
})();
