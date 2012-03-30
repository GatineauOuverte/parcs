$(function(){ // jQuery .ready handler
    App.init();
});
App = (function () {
    "use strict";
    
    var GMap = google.maps,
        GMarker = GMap.Marker,
        GEvent = GMap.event,
        GLatLng = GMap.LatLng,
        customIcons = {
            parc: {
                icon: 'images/mm_20_green.png' ,
                shadow: 'images/mm_20_shadow.png'
            },
          
            other: {
                icon: 'images/mm_20_green.png',
                shadow: 'images/mm_20_shadow.png'
            }
        },
        focusedMarker = null,
        activeMarkers = [],
        activeFilters = {
            sectors: {},
            installations: {}
        },
        cachedMarkers = null,
        searchInput, map, infoWindow, markerClusterer;
    
    /*
      filters marker so that,
       any (OR) sector selection match
       all (AND) installation selections match
    */
    function filterMarkers(markers,callback){
        // console.log('-----')
        // console.log('clientFilter activeFilters',JSON.stringify(activeFilters,null));
        var filteredMarkers=[];
        $.each(markers,function(i,marker){
            // filter each marker against active Filters
            var hasAtLeastOneSector=false;
            var accept=false;
            $.each(activeFilters.sectors,function(sector,_ignore){
                hasAtLeastOneSector=true;
                if (marker.sector==sector){
                    accept=true;
                    return false;// break the foreach loop
                }
            });

            // reject by sector: at least on sector is checked, and NO selected sectors match
            var reject= hasAtLeastOneSector && !accept;

            // reject by installation: reject if any selected installation is not present
            $.each(activeFilters.installations,function(installation,_ignore){
                if (!marker.hasInstalltion[installation]){
                    reject=true;
                    return false;// break the foreach loop
                }
            });

            if (!reject) filteredMarkers.push(marker);
        });
        // console.log('filtered markers',filteredMarkers.length);
        callback(filteredMarkers,200);
    }
    
    /*
      This function prepares the marker data by:
        -transforming the marker.installations array into marker.hasInstallation lookup hash
        -find all sectors and installtions (in the markers)
        -injecting a sorted list of sectors and installations as appropriate chackboxes
    */
    function makerPostProcessing(markers){
      var allSectors={};
      var allInstallations={};
      $.each(markers,function(i,marker){
        allSectors[marker.sector]=true;
        // tokenize installations
        if (!marker.hasInstalltion){
          marker.hasInstalltion={}
          var installations = marker.installations;
          $.each(installations,function(i,installation){
            allInstallations[installation]=true;
            marker.hasInstalltion[installation]=true;
          });
        }        
      });
      
      // sort and insert sector checkboxes
      var sortedSectors=c7nSortedHashKeys(allSectors);
      var $sector=$('#sectors');
      $.each(sortedSectors,function(i,sector){
        // console.log('sector',i,sector);
        $sector.append($('<input type="checkbox" name="sector" value="'+sector+'"/> <span>'+sector+'</span>'))
      });

      // sort and insert installation checkboxes
      var sortedInstallations=c7nSortedHashKeys(allInstallations);
      var $trows=$();
      var $tr=null;
      $.each(sortedInstallations,function(i,installation){
        if ((i%6)==0) { $tr = $('<tr />'); $trows = $trows.add($tr); }
        // console.log('installation',i,installation);
        // <td><input type="checkbox" name="installation" value="Aréna"/> Aréna</td>
        $tr.append($('<td><input type="checkbox" name="installation" value="'+installation+'"/> '+installation+'</td>'))
      });
      var $installationsTbl=$('#installations table');
      $installationsTbl.append($trows);
    }
    
    /* Fetches markers if not already cached
      then calls the filterMarkers
      the fetched data is stored in cachedMarkers instance variable
    */
    function getMarkers(callback) {
        if (cachedMarkers){
          // console.log('markers are cached');
          filterMarkers(cachedMarkers,callback);
        } else {          
          $.getJSON('data/markers.json',function(data){
            cachedMarkers=data;
            makerPostProcessing(cachedMarkers);
            filterMarkers(cachedMarkers,callback);
          }).error(function() { /*no error handler for now*/ });
        }
    }
    
    function onMarkerClick() {
        var data = this._data;
        
        if (focusedMarker) {
            focusedMarker.setAnimation(null);
        }
        
        focusedMarker = this;
        
        infoWindow.setContent([
            '<b>', data.name, '</b><br>',
            data.address, '<br>',
            data.installations
        ].join(''));
        
        infoWindow.open(map, this);
        
        setTimeout(function () {
            focusedMarker.setAnimation(GMap.Animation.BOUNCE);
        }, 0);
    }
    
    function addMarkers(markers) {
        var mapMarker, marker, icon;
         
        for (var i = 0, len = markers.length; i < len; i++) {
            
            mapMarker = new GMarker({
                position: new GLatLng(
                    parseFloat((marker = markers[i]).lat),
                    parseFloat(marker.lng)
                ),
                icon: (icon = customIcons[marker.type] || {}).icon,
                shadow: icon.shadow
            });
            
            activeMarkers.push(mapMarker);
            
            mapMarker._data = marker;
            
            GEvent.addListener(mapMarker, 'click', onMarkerClick);
        }
        
        markerClusterer.addMarkers(activeMarkers);
    }
    
    function removeAllMarkers() {
        var i = activeMarkers.length - 1,
            marker;
        
        markerClusterer.clearMarkers();
        
        while (i >= 0) {
            marker = activeMarkers[i];
            GEvent.clearInstanceListeners(marker); //TODO: Is this needed since we used clearMarkers?
            activeMarkers.splice(i, 1);
            i--;
        }
    }
    
    function refreshMarkers() {
        removeAllMarkers();
        getMarkers(addMarkers);
    }
    
    function updateFilter(type, id, clear) {
        type = type + 's';
        
        if (clear) {
            delete activeFilters[type][id];
        } else {
            activeFilters[type][id] = true;
        }
    }
    
    function installDOMListeners() {
        
        on(document, 'click', function (e) {
            var target = e.target;
            
            if (!target || target.type !== 'checkbox') {
                return;
            }
            
            updateFilter(target.name, target.value, !target.checked);            
            refreshMarkers();
        });
        
        //TODO: Free-text refreshMarkers function
        /*
        on(searchInput, 'keypress', function (e) {
            if (e.keyCode && e.keyCode === 13) {
                updateFilter(..buildCriterias() + '&query=' + searchInput.value...);                            
                refreshMarkers();
            }
        });
        */
    }
        
    return {
        init: function () {
            
            map = new GMap.Map(document.getElementById("map"), {
                center: new GLatLng(45.486740, -75.633217),
                zoom: 11,
                mapTypeId: 'roadmap'
            });
            
            markerClusterer = new MarkerClusterer(map, [], {
                minimumClusterSize: 10
            });
            
            infoWindow = new GMap.InfoWindow();
            
            GEvent.addListener(infoWindow, 'closeclick', function () {
                focusedMarker.setAnimation(null);
                focusedMarker = null;
            });
            
            refreshMarkers();
            
            //searchInput = document.getElementById('filterMarkers-input');
            
            installDOMListeners();
        }
    };
})();
