/*jslint browser: true*/
/*global $, jQuery, alert*/
/*global L, lealfet, alert*/
/*global moment, moment, alert*/
/*global console, console, alert*/

////////////////////////////////////////////////////////////////////////
//Global Variables
var scope = {
        aoiBounds: undefined,
        rp_scenes: [],
        api_url: "https://api.remotepixel.ca/landsat?search=",
        side: 'L',
        before: undefined,
        after: undefined,
        before_overlays: undefined,
        after_overlays: undefined,
        filtervalues: {
            cloudmin: 0,
            cloudmax: 100,
            datestart: new Date('2013-04-01').toISOString().slice(0, 10),
            dateend: new Date().toISOString().slice(0, 10),
            seasons: ['spring', 'summer', 'autumn', 'winter']
        }
    };

var map = L.map('map', {
    center: [0, 0],
    bounceAtZoomLimits: false,
    worldCopyJump: false,
    touchZoom: false,
    inertia: false,
    zoomControl: false,
    doubleClickZoom: 'center',
    scrollWheelZoom: 'center',
    minZoom: 1,
    zoom: 2,
    maxZoom: 11
});

var osm_url = 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png',
    attribution = '&copy; <a href="http://www.openstreetmap.org/copyright">OpenStreetMap</a>',
    OpenStreetMap = L.tileLayer(osm_url, {id: 'MapID', attribution: attribution})
        .addTo(map);

L.control.zoom({position: 'topright'}).addTo(map);

var footprintGr = new L.featureGroup().addTo(map),
    markerGr = new L.featureGroup().addTo(map);

map.fitWorld();

map.on('dragend', function() {
    'use strict';
    if (footprintGr.getLayers().length !== 0) {
        if (!footprintGr.getBounds().contains(map.getCenter())) {
            updateMap(map.getCenter());
        }
    } else {
        updateMap(map.getCenter());
    }
});

L.easyButton('fa-home',
    function () {
        'use strict';
        resetmap();
        resetFilters();
        map.fitWorld();
    }, 'Reset');

L.easyButton('fa-share',
    function () {
        'use strict';
        $("#twitter").attr('href', 'https://twitter.com/share?text=Easy creation of Landsat 8 Before/After map&url=' + window.location.href + '&via=RemotePixel&hashtags=Landsat&related=NASA_Landsat');
        $("#linkedin").attr('href', 'https://www.linkedin.com/shareArticle?mini=true&url=' + window.location.href + '&title=' + document.title + '&source=https://remotepixel.ca');
        $("#facebook").attr('href', 'https://www.facebook.com/sharer/sharer.php?u=' + window.location.href);
        $('#modalShare').modal();
    }, 'Share it');

L.easyButton('fa-info',
    function () {
        'use strict';
        $('#modalAbout').modal();
    },
    'About');

////////////////////////////////////////////////////////////////////////
//Tools
function timestamp(str) {
    'use strict';
    return new Date(str).getTime();
}

//From Libra by developmentseed (https://github.com/developmentseed/libra)
function mod(number, dividend) {
    'use strict';
    return ((number % dividend) + dividend) % dividend;
}

function sortScenes(a, b) {
    'use strict';
    return Date.parse(b.acquisitionDate) - Date.parse(a.acquisitionDate);
}

function sortScenes2(a, b) {
    'use strict';
    return Date.parse(a.acquisitionDate) - Date.parse(b.acquisitionDate);
}

//http://stackoverflow.com/questions/2998784/how-to-output-integers-with-leading-zeros-in-javascript
function zeroPad(num, places) {
    'use strict';
    var zero = places - num.toString().length + 1;
    return new Array(+(zero > 0 && zero)).join("0") + num;
}

function isInArray(array, search) {
    'use strict';
    return (array.indexOf(search) >= 0) ? true : false;
}

////////////////////////////////////////////////////////////////////////
//Filters
function initFilters() {
    'use strict';
    //Cloud Cover Slider
    $("#cloudCoverSlider").noUiSlider({
        start: [ scope.filtervalues.cloudmin, scope.filtervalues.cloudmax ],
        step: 1,
        behaviour: 'drag',
        connect: true,
        range: {
            'min': 0,
            'max': 100
        }
    });

    $("#cloudCoverSlider").noUiSlider_pips({
        mode: 'positions',
        values: [0, 20, 40, 60, 80, 100],
        density: 4
    });

    $('#cloudCoverSlider').on('slide', setCloud);
    $('#cloudCoverSlider').on('set', updateCloud);

  //Date slider
    $("#dateSlider").noUiSlider({
        range: {
            'min': timestamp(scope.filtervalues.datestart),
            'max': timestamp(scope.filtervalues.dateend)
        },
        //behaviour: 'drag',
        connect: true,
        step: 24 * 60 * 60 * 1000, //one day
        format: wNumb({decimals: 0}),
        start: [timestamp(scope.filtervalues.datestart), timestamp(scope.filtervalues.dateend)]
    });

    var dateRange = Date.parse(scope.filtervalues.dateend) - Date.parse(scope.filtervalues.datestart),
        range = [Date.parse(scope.filtervalues.datestart),
            Date.parse(scope.filtervalues.datestart) + dateRange / 4,
            Date.parse(scope.filtervalues.datestart) + 2 * dateRange / 4,
            Date.parse(scope.filtervalues.datestart) + 3 * dateRange / 4, Date.parse(scope.filtervalues.dateend)];

    $("#dateSlider").noUiSlider_pips({
        mode: 'values',
        values: range,
        density: 4,
        stepped: true
    });

    //From Libra by developmentseed (https://github.com/developmentseed/libra)
    $('#dateSlider > .noUi-pips > .noUi-value').each(
        function () {
            $(this).html(new Date(Number($(this).html())).toISOString().slice(0, 7));
        }
    );

    $('#dateSlider').on('slide', setDate);
    $('#dateSlider').on('set', updateDate);

      //Season slider
    $("#seasonSlider").noUiSlider({
        range: {
            'min': 0,
            'max': 4
        },
        margin: 1,
        behaviour: 'drag',
        connect: true,
        step: 1,
        format: wNumb({ decimals: 0 }),
        start: [0, 4]
    });

    $("#seasonSlider").noUiSlider_pips({
        mode: 'values',
        density: 11,
        values: [0.5, 1.5, 2.5, 3.5]
    });

    //From Libra by developmentseed (https://github.com/developmentseed/libra)
    $('#seasonSlider > .noUi-pips > .noUi-value').each(
        function () {
            var seas = ['spring', 'summer', 'autumn', 'winter'];
            $(this).html(seas[$(this).html() - 1]);
        }
    );

    $('#seasonSlider').on('set', updateSeason);

    $('#string-date').text(' : ' + scope.filtervalues.datestart + ' - ' + scope.filtervalues.dateend);
    $('#string-cloud').text(' : ' + scope.filtervalues.cloudmin + ' - ' + scope.filtervalues.cloudmax + ' %');
}

function toggleOpenFilter(filter) {
    'use strict';
    switch (filter) {
    case 'date':
        $("button#date").addClass("active");
        $("button#cloud").removeClass("active");
        $("button#season").removeClass("active");
        $("div.filter-date").removeClass("display-none");
        $("div.filter-cloud").addClass("display-none");
        $("div.filter-season").addClass("display-none");
        break;
    case 'cloud':
        $("button#date").removeClass("active");
        $("button#cloud").addClass("active");
        $("button#season").removeClass("active");
        $("div.filter-date").addClass("display-none");
        $("div.filter-cloud").removeClass("display-none");
        $("div.filter-season").addClass("display-none");
        break;
    case 'season':
        $("button#date").removeClass("active");
        $("button#cloud").removeClass("active");
        $("button#season").addClass("active");
        $("div.filter-date").addClass("display-none");
        $("div.filter-cloud").addClass("display-none");
        $("div.filter-season").removeClass("display-none");
        break;
    case null:
        break;
    }
}

function resetFilters() {
    'use strict';
    scope.filtervalues.cloudmin = 0;
    scope.filtervalues.cloudmax = 100;
    scope.filtervalues.datestart = new Date('2013-04-01').toISOString().slice(0, 10);
    scope.filtervalues.dateend = new Date().toISOString().slice(0, 10);
    scope.filtervalues.seasons = ['spring', 'summer', 'autumn', 'winter'];

    $("#cloudCoverSlider").val([scope.filtervalues.cloudmin, scope.filtervalues.cloudmax]);
    $("#dateSlider").val([Date.parse(scope.filtervalues.datestart), Date.parse(scope.filtervalues.dateend)]);
    $("#seasonSlider").val([0, 4]);
    $('#string-date').text(' : ' + scope.filtervalues.datestart + ' - ' + scope.filtervalues.dateend);
    $('#string-cloud').text(' : ' + scope.filtervalues.cloudmin + ' - ' + scope.filtervalues.cloudmax + ' %');
}

function setCloud() {
    'use strict';
    scope.filtervalues.cloudmin = parseInt($('#cloudCoverSlider').val()[0]);
    scope.filtervalues.cloudmax = parseInt($('#cloudCoverSlider').val()[1]);
    $('#string-cloud').text(' : ' + scope.filtervalues.cloudmin + ' - ' + scope.filtervalues.cloudmax + ' %');
}

function updateCloud() {
    'use strict';
    scope.filtervalues.cloudmin = parseInt($('#cloudCoverSlider').val()[0]);
    scope.filtervalues.cloudmax = parseInt($('#cloudCoverSlider').val()[1]);
    $('#string-cloud').text(' : ' + scope.filtervalues.cloudmin + ' - ' + scope.filtervalues.cloudmax + ' %');
    filterScenes();
}

function setDate() {
    'use strict';
    scope.filtervalues.datestart = new Date(Number($('#dateSlider').val()[0])).toISOString().slice(0, 10);
    scope.filtervalues.dateend = new Date(Number($('#dateSlider').val()[1])).toISOString().slice(0, 10);
    $('#string-date').text(' : ' + scope.filtervalues.datestart + ' - ' + scope.filtervalues.dateend);
}

function updateDate() {
    'use strict';
    scope.filtervalues.datestart = new Date(Number($('#dateSlider').val()[0])).toISOString().slice(0, 10);
    scope.filtervalues.dateend = new Date(Number($('#dateSlider').val()[1])).toISOString().slice(0, 10);
    $('#string-date').text(' : ' + scope.filtervalues.datestart + ' - ' + scope.filtervalues.dateend);
    filterScenes();
}

function updateSeason() {
    'use strict';
    var season = ['spring', 'summer', 'autumn', 'winter'];
    scope.filtervalues.seasons = season.slice($('#seasonSlider').val()[0], $('#seasonSlider').val()[1]);
    filterScenes();
}

function filterScenes() {
    'use strict';
    $('#landsat-wall').empty();
    $('#landsat-wall').scrollTop(0);
    var i;
    for (i = 0; i < scope.rp_scenes.length; i += 1) {

        var scene = scope.rp_scenes[i],
            imBlock = '<div id ="scene_' + i + '" class="result-content" onclick="imgclick(' + i + ')" >' +
                '<img id="' + scope.rp_scenes[i].sceneID +  '" ' +
                'class="img-thumb"' +
                'src="' + scope.rp_scenes[i].browseURL + '">' +
                '<div class="result-overlay">' +
                '<div>' +
                '<i class="fa fa-calendar-o"></i>' +
                '<span>  ' + scope.rp_scenes[i].acquisitionDate + '</span>' +
                '</div>' +
                '<div>' +
                '<i class="fa fa-cloud"></i>' +
                '<span>  ' + scope.rp_scenes[i].cloudCoverFull + ' %</span>' +
                '</div>' +
                '</div>';

        if (scope.filtervalues.cloudmin < scene.cloudCoverFull && scene.cloudCoverFull < scope.filtervalues.cloudmax) {
            //
        } else {
            continue;
        }

        if (! isInArray(scope.filtervalues.seasons, scene.season)) {
            continue;
        }

        if (Date.parse(scope.filtervalues.datestart) < Date.parse(scene.acquisitionDate) && Date.parse(scene.acquisitionDate) < Date.parse(scope.filtervalues.dateend)) {
            //
        } else {
            continue;
        }

        $('#landsat-wall').append(imBlock);
    }
}

////////////////////////////////////////////////////////////////////////
//Map Before/After
function backTopr() {
    'use strict';
    cleanbaMaps();
    closeimagePane();
    mapbefore.remove();
    mapafter.remove();
    scope.rp_scenes = undefined;
    $('#map-container-ba').empty();
    $('#map-container-ba').addClass("display-none");
    $('#map-container').removeClass("display-none");
    map.invalidateSize();
}

function cleanbaMaps() {
    'use strict';
    scope.before_overlays.clearLayers();
    scope.after_overlays.clearLayers();
    scope.before_overlays = undefined;
    scope.after_overlays = undefined;
    scope.side = 'L';
    scope.before = undefined;
    scope.after = undefined;
}

function closeimagePane() {
    'use strict';
    $("#imagePane").addClass("display-none");
}

////////////////////////////////////////////////////////////////////////////////

function onURLids() {

    var query = "https://api.remotepixel.ca/landsat?search=sceneID(" + scope.before + "," + scope.after + ")&limit=2",
        res = [];

    $.getJSON(query, function(data) {
        var total = data.info.results.total;
        if (total < 2000){
            for (var i=0; i < data.results.length; i++){
                var scene = {};
                scene.rowpath = data.results[i].row + '-' + data.results[i].path;
                scene.acquisitionDate = data.results[i].acquisitionDate;
                scene.browseAvailable = data.results[i].browseAvailable;
                scene.lat = data.results[i].sceneCenterLatitude;
                scene.lon = data.results[i].sceneCenterLongitude;
                scene.sceneID = data.results[i].sceneID;
                scene.browseURL = data.results[i].browseURL;
                scene.pngURL = 'http://earthexplorer.usgs.gov/cgi-bin/landsat_8?sceneid=' + scene.sceneID
                scene.lowerLeftCornerLatitude = data.results[i].lowerLeftCornerLatitude;
                scene.lowerRightCornerLatitude = data.results[i].lowerRightCornerLatitude;
                scene.upperLeftCornerLatitude = data.results[i].upperLeftCornerLatitude;
                scene.upperRightCornerLatitude = data.results[i].upperRightCornerLatitude;
                scene.lowerLeftCornerLongitude = data.results[i].lowerLeftCornerLongitude;
                scene.lowerRightCornerLongitude = data.results[i].lowerRightCornerLongitude;
                scene.upperLeftCornerLongitude = data.results[i].upperLeftCornerLongitude;
                scene.upperRightCornerLongitude = data.results[i].upperRightCornerLongitude;

                var diff_L = Math.abs(scene.lowerLeftCornerLongitude - scene.lowerRightCornerLongitude);
                var diff_U = Math.abs(scene.upperLeftCornerLongitude - scene.upperRightCornerLongitude);
                if ((diff_L > 180) || (diff_U > 180)){
                    if (scene.lowerLeftCornerLongitude < 0) scene.lowerLeftCornerLongitude += 360;
                    if (scene.upperLeftCornerLongitude < 0) scene.upperLeftCornerLongitude += 360;
                    if (scene.lowerRightCornerLongitude < 0) scene.lowerRightCornerLongitude += 360;
                    if (scene.upperRightCornerLongitude < 0) scene.upperRightCornerLongitude += 360;
                }

                var polygon = turf.polygon([[
                        [scene.upperLeftCornerLongitude, scene.upperLeftCornerLatitude],
                        [scene.upperRightCornerLongitude, scene.upperRightCornerLatitude],
                        [scene.lowerRightCornerLongitude, scene.lowerRightCornerLatitude],
                        [scene.lowerLeftCornerLongitude, scene.lowerLeftCornerLatitude],
                        [scene.upperLeftCornerLongitude, scene.upperLeftCornerLatitude]
                    ]]),
                    bbox = turf.extent(polygon),
                    anchors = [
                        [bbox[3], bbox[0]],
                        [bbox[3], bbox[2]],
                        [bbox[1], bbox[2]],
                        [bbox[1], bbox[0]]
                    ],
                    clipCoords = [
                        [scene.upperLeftCornerLatitude, scene.upperLeftCornerLongitude],
                        [scene.upperRightCornerLatitude, scene.upperRightCornerLongitude],
                        [scene.lowerRightCornerLatitude, scene.lowerRightCornerLongitude],
                        [scene.lowerLeftCornerLatitude, scene.lowerLeftCornerLongitude],
                        [scene.upperLeftCornerLatitude, scene.upperLeftCornerLongitude]
                    ],
                    options = {
                        attribution: "&copy Landsat imagery courtesy of NASA and USGS",
                        id: scene.sceneID,
                        time: scene.acquisitionDate,
                        info: {date: scene.acquisitionDate, cloud: scene.cloudCover, sun: scene.sunAzimuth},
                        clip: clipCoords
                    };
                scene.imOverlay = new L.ImageTransform(scene.browseURL, anchors, options);
                res.push(scene);
            };
        }

        scope.rp_scenes = res;
        $("#map-container").addClass("display-none");
        $("#map-container-ba").removeClass("display-none");
        $('#map-container-ba').append(['<div id="map-before" class="map"></div>', '<div id="map-after" class="map"></div>']);

        mapbefore = L.map('map-before', {
            zoom: 2,
            attributionControl: false,
            zoomControl: false,
            touchZoom: false,
            inertia: false,
            doubleClickZoom: 'center',
            scrollWheelZoom: 'center',
            center: [1,1],
            minZoom: 1,
            maxZoom: 11
        });
        scope.before_overlays = new L.layerGroup().addTo(mapbefore);

        mapafter = L.map('map-after', {
            zoom: 2,
            attributionControl: false,
            zoomControl: false,
            touchZoom: false,
            inertia: false,
            doubleClickZoom: 'center',
            scrollWheelZoom: 'center',
            center: [1,1],
            minZoom: 1,
            maxZoom: 11
        });
        scope.after_overlays = new L.layerGroup().addTo(mapafter);

        var osm_url = 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png',
            attribution = '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>';

        L.tileLayer(osm_url).addTo(mapbefore);
        L.tileLayer(osm_url, {id: 'MapID', attribution: attribution}).addTo(mapafter);

        L.control.zoom({position:'topright'}).addTo(mapafter);
        L.control.attribution({position:'bottomright'}).addTo(mapafter);

        L.easyButton('fa-arrow-circle-left',
                function (){
                    backTopr();
                },
                'Back', mapafter);

        L.easyButton('fa-share',
                function (){

                    if (scope.before !== '' && scope.after !== ''){

                        var share_url = "https://remotepixel.ca/projects/landsat8beforeafter.html?before=&" + scope.before + "&after=" + scope.after;
                        $("#twitter").attr('href',
                                'https://twitter.com/share?url=' + encodeURIComponent(share_url) +
                                '&via=RemotePixel' +
                                '&hashtags=Landsat' +
                                '&related=NASA_Landsat' +
                                '&text=Landsat 8 Before/After map');

                        $("#linkedin").attr('href',
                                'https://www.linkedin.com/shareArticle?mini=true&url=' + encodeURIComponent(share_url) +
                                '&title=Landsat 8 Before/After map' +
                                '&source=https://remotepixel.ca');

                        $("#facebook").attr('href',
                                'https://www.facebook.com/sharer/sharer.php?u=' + encodeURIComponent(share_url));

                    }else{
                        $("#twitter").attr('href','https://twitter.com/share?text=Easy creation of Landsat 8 Before/After map&url=' + window.location.href + '&via=RemotePixel&hashtags=Landsat&related=NASA_Landsat');
                        $("#linkedin").attr('href','https://www.linkedin.com/shareArticle?mini=true&url=' + window.location.href + '&title='+ document.title + '&source=https://remotepixel.ca');
                        $("#facebook").attr('href','https://www.facebook.com/sharer/sharer.php?u=' + window.location.href);
                    }

                    $('#modalShare').modal();
                },
                'Share it', mapafter);

        L.easyButton('fa-info',
                function (){
                   $('#modalAbout-pane2').modal();
                },
                'About', mapafter);

        $('#map-container-ba').beforeAfter(mapbefore, mapafter);

        scope.before_overlays.clearLayers();
        scope.before_overlays.addLayer(scope.rp_scenes[0].imOverlay);
        $('#lt-text').text(scope.rp_scenes[0].acquisitionDate)
        scope.after_overlays.clearLayers();
        scope.after_overlays.addLayer(scope.rp_scenes[1].imOverlay);
        $('#rt-text').text(scope.rp_scenes[1].acquisitionDate)

        mapbefore.sync(mapafter);
        mapafter.sync(mapbefore);
        mapafter.fitBounds(L.polygon(scope.rp_scenes[1].imOverlay.options.clip).getBounds());
    });
}

////////////////////////////////////////////////////////////////////////////////

function onClickRowPath(){

    scope.rp_scenes = this.scenes;
    var bds = this.getBounds();

    $("#map-container").addClass("display-none");
    $("#map-container-ba").removeClass("display-none");
    $('#map-container-ba').append(['<div id="map-before" class="map"></div>', '<div id="map-after" class="map"></div>']);
    $("#imagePane").removeClass("display-none");

    mapbefore = L.map('map-before', {
        zoom: 2,
        attributionControl: false,
        zoomControl: false,
        touchZoom: false,
        inertia: false,
        doubleClickZoom: 'center',
        scrollWheelZoom: 'center',
        center: [1,1],
        minZoom: 1,
        maxZoom: 11
    });

    mapbefore.fitBounds(bds);
    scope.before_overlays = new L.layerGroup().addTo(mapbefore);

    var defaultStyle = {
            color: "#000",
            weight: 2.,
            fill: true,
            fillOpacity: 0,
            opacity: 1
    };

    L.polygon(this.getLatLngs(), defaultStyle).addTo(mapbefore)

    mapafter = L.map('map-after', {
        zoom: 2,
        attributionControl: false,
        zoomControl: false,
        touchZoom: false,
        inertia: false,
        doubleClickZoom: 'center',
        scrollWheelZoom: 'center',
        center: [1,1],
        minZoom: 1,
        maxZoom: 11
    });

    mapafter.fitBounds(bds);
    scope.after_overlays = new L.layerGroup().addTo(mapafter);
    L.polygon(this.getLatLngs(), defaultStyle).addTo(mapafter)

    var osm_url = 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png';
    var attribution = '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>';

    L.tileLayer(osm_url).addTo(mapbefore);
    L.tileLayer(osm_url, {id: 'MapID', attribution: attribution}).addTo(mapafter);

    L.control.zoom({position:'topright'}).addTo(mapafter);
    L.control.attribution({position:'bottomright'}).addTo(mapafter);

    L.easyButton('fa-arrow-circle-left',
            function (){
                backTopr();
            },
            'Back', mapafter);

    L.easyButton('fa-eraser',
            function (){
                $("#imagePane").removeClass("display-none");
            },
            'Back', mapafter);

    L.easyButton('fa-sliders',
            function (){
                $("#imagePane").removeClass("display-none");
                $("#modalFilters").modal();
            },
            'Filter', mapafter);

    L.easyButton('fa-share',
            function (){

                if (scope.before_overlays.getLayers().length != 0 && scope.after_overlays.getLayers().length != 0){

                    var b_id = scope.before_overlays.getLayers()[0].options.id;
                    var a_id = scope.after_overlays.getLayers()[0].options.id;
                    // var share_url = "https://remotepixel.ca/projects/landsat8beforeafter.html?ids=[" + b_id + "," + a_id+"]";
                    var share_url = "https://remotepixel.ca/projects/landsat8beforeafter.html?before=" + b_id + "&after=" + a_id;

                    $("#twitter").attr('href',
                            'https://twitter.com/share?url=' + encodeURIComponent(share_url) +
                            '&via=RemotePixel' +
                            '&hashtags=Landsat' +
                            '&related=NASA_Landsat' +
                            '&text=Landsat 8 Before/After map');

                    $("#linkedin").attr('href',
                            'https://www.linkedin.com/shareArticle?mini=true&url=' + encodeURIComponent(share_url) +
                            '&title=Landsat 8 Before/After map' +
                            '&source=https://remotepixel.ca');

                    $("#facebook").attr('href',
                            'https://www.facebook.com/sharer/sharer.php?u=' + encodeURIComponent(share_url));

                }else{
                    $("#twitter").attr('href','https://twitter.com/share?text=Easy creation of Landsat 8 Before/After map&url=' + window.location.href + '&via=RemotePixel&hashtags=Landsat&related=NASA_Landsat');
                    $("#linkedin").attr('href','https://www.linkedin.com/shareArticle?mini=true&url=' + window.location.href + '&title='+ document.title + '&source=https://remotepixel.ca');
                    $("#facebook").attr('href','https://www.facebook.com/sharer/sharer.php?u=' + window.location.href);
                }

                $('#modalShare').modal();
            },
            'Share it', mapafter);

    L.easyButton('fa-info',
            function (){
               $('#modalAbout-pane2').modal();
            },
            'About', mapafter);

    $('#map-container-ba').beforeAfter(mapbefore, mapafter);

    mapbefore.sync(mapafter);
    mapafter.sync(mapbefore);

    updateWall();
};

function updateWall(){

    $('#landsat-wall').empty();
    $('#landsat-wall').scrollTop(0);

    browse = [];
    for (var i=0; i < scope.rp_scenes.length; i++){
        browse.push(
            '<div id ="scene_'+ i +'" class="result-content" onclick="imgclick('+ i +')" >'+
                '<img id="' + scope.rp_scenes[i].sceneID +  '" ' +
                    'class="img-thumb"' +
                    'src="' + scope.rp_scenes[i].browseURL + '">'+

                '<div class="result-overlay">' +
                    '<div>' +
                    '<i class="fa fa-calendar-o"></i>' +
                    '<span>  ' + scope.rp_scenes[i].acquisitionDate + '</span>' +
                '</div>' +
                '<div>' +
                    '<i class="fa fa-cloud"></i>' +
                    '<span>  ' + scope.rp_scenes[i].cloudCoverFull + ' %</span>' +
                '</div>' +
            '</div>'
        );
    };

    $('#landsat-wall').append(browse);
    browse = null;
};

function imgclick(i){

    var scene = scope.rp_scenes[i];

    var polygon = turf.polygon([[
                                 [scene.upperLeftCornerLongitude, scene.upperLeftCornerLatitude],
                                 [scene.upperRightCornerLongitude, scene.upperRightCornerLatitude],
                                 [scene.lowerRightCornerLongitude, scene.lowerRightCornerLatitude],
                                 [scene.lowerLeftCornerLongitude, scene.lowerLeftCornerLatitude],
                                 [scene.upperLeftCornerLongitude, scene.upperLeftCornerLatitude]
                                ]]);

    var bbox = turf.extent(polygon);

    var anchors = [
                   [bbox[3], bbox[0]],
                   [bbox[3], bbox[2]],
                   [bbox[1], bbox[2]],
                   [bbox[1], bbox[0]]
    ];

    var clipCoords = [
                      [scene.upperLeftCornerLatitude, scene.upperLeftCornerLongitude],
                      [scene.upperRightCornerLatitude, scene.upperRightCornerLongitude],
                      [scene.lowerRightCornerLatitude, scene.lowerRightCornerLongitude],
                      [scene.lowerLeftCornerLatitude, scene.lowerLeftCornerLongitude],
                      [scene.upperLeftCornerLatitude, scene.upperLeftCornerLongitude]
    ];

    var options = {
            attribution: "&copy Landsat imagery courtesy of NASA and USGS",
            id: scene.sceneID,
            time: scene.acquisitionDate,
            info: {date: scene.acquisitionDate, cloud: scene.cloudCover, sun: scene.sunAzimuth},
            clip: clipCoords
    };

    var imOverlay = new L.ImageTransform(scene.browseURL, anchors, options);

    if (scope.side == 'L'){
        scope.before_overlays.clearLayers();
        scope.before_overlays.addLayer(imOverlay);
        $('#lt-text').text(scene.acquisitionDate)

        $("#left-hover").remove()
        $('<div id="left-hover" class="result-hover">' +
            '<div class="result-hover-content">' +
             '<h3 id="hoverpos">L</h3>' +
            '</div>' +
        '</div>').prependTo($("#scene_" + i ));
        scope.side = 'R'
    } else {
        scope.after_overlays.clearLayers();
        scope.after_overlays.addLayer(imOverlay);
        $('#rt-text').text(scene.acquisitionDate)

        $("#right-hover").remove()
        $('<div id="right-hover" class="result-hover">' +
            '<div class="result-hover-content">' +
             '<h3 id="hoverpos">R</h3>' +
            '</div>' +
        '</div>').prependTo($("#scene_" + i ));
        scope.side = 'L'
    };
};

////////////////////////////////////////////////////////////////////////
//Main Map
function resetmap(){
    map.invalidateSize();
    footprintGr.clearLayers();
    markerGr.clearLayers();
    scope.rp_scenes = [];
};

function getSeason(dateIn, lat){
    var mDate =  moment(dateIn, "YYYY-MM-DD");

    var doy = mDate.dayOfYear();
    var year = mDate.year();

    var spring = moment({ year :year, month :2, day :21}).dayOfYear();
    var summer = moment({ year :year, month :5, day :21}).dayOfYear();
    var autumn = moment({ year :year, month :8, day :22}).dayOfYear();
    var winter = moment({ year :year, month :11, day :21}).dayOfYear();

    var seas = ['spring', 'summer', 'autumn', 'winter'];
    if (lat < 0) seas.reverse();

    var season = '';
    if (doy < spring || doy >= winter) season = seas[3];
    if (doy >= spring && doy < summer) season = seas[0];
    if (doy >= summer && doy < autumn) season = seas[1];
    if (doy >= autumn && doy < winter) season = seas[2];

    return season;
};

function getDataAndUpdate(adress) {

    map.spin(true);
    resetmap();

    var adjust = Math.floor((map.getCenter().lng + 180) / 360) * 360;
    var results = {};
    $.getJSON(adress, function(data) {
        var total = data.info.results.total;
        if (total < 2000){
            for (var i=0; i < data.results.length; i++){
                var scene = {};
                scene.rowpath = data.results[i].row + '-' + data.results[i].path;
                scene.className = data.results[i].sceneID + '-' + data.results[i].row + '-' + data.results[i].path;
                scene.sceneID = data.results[i].sceneID;

                scene.acquisitionDate = data.results[i].acquisitionDate;

                scene.browseAvailable = data.results[i].browseAvailable;
                scene.browseURL = data.results[i].browseURL;
                //scene.pngURL = 'http://earthexplorer.usgs.gov/cgi-bin/landsat_8?sceneid=' + scene.sceneID
                scene.cloudCover = data.results[i].cloudCover;
                scene.cloudCoverFull = data.results[i].cloudCoverFull;
                scene.dayOrNight = data.results[i].dayOrNight;

                scene.lat = data.results[i].sceneCenterLatitude;
                scene.lon = data.results[i].sceneCenterLongitude;
                scene.lon = scene.lon + adjust;

                scene.season = getSeason(scene.acquisitionDate, scene.lat);

                scene.path = data.results[i].path;
                scene.row = data.results[i].row;
                scene.sensor = data.results[i].sensor;
                scene.sunAzimuth = data.results[i].sunAzimuth;
                scene.sunElevation = data.results[i].sunElevation;

                scene.lowerLeftCornerLatitude = data.results[i].lowerLeftCornerLatitude;
                scene.lowerRightCornerLatitude = data.results[i].lowerRightCornerLatitude;
                scene.upperLeftCornerLatitude = data.results[i].upperLeftCornerLatitude;
                scene.upperRightCornerLatitude = data.results[i].upperRightCornerLatitude;
                scene.lowerLeftCornerLongitude = data.results[i].lowerLeftCornerLongitude;
                scene.lowerRightCornerLongitude = data.results[i].lowerRightCornerLongitude;
                scene.upperLeftCornerLongitude = data.results[i].upperLeftCornerLongitude;
                scene.upperRightCornerLongitude = data.results[i].upperRightCornerLongitude;

                var diff_L = Math.abs(scene.lowerLeftCornerLongitude - scene.lowerRightCornerLongitude);
                var diff_U = Math.abs(scene.upperLeftCornerLongitude - scene.upperRightCornerLongitude);
                if ((diff_L > 180) || (diff_U > 180)){
                    if (scene.lowerLeftCornerLongitude < 0) scene.lowerLeftCornerLongitude += 360;
                    if (scene.upperLeftCornerLongitude < 0) scene.upperLeftCornerLongitude += 360;
                    if (scene.lowerRightCornerLongitude < 0) scene.lowerRightCornerLongitude += 360;
                    if (scene.upperRightCornerLongitude < 0) scene.upperRightCornerLongitude += 360;
                }

                //From Libra by developmentseed (https://github.com/developmentseed/libra)
                var lonCorners = ['upperLeftCornerLongitude','upperRightCornerLongitude','lowerRightCornerLongitude','lowerLeftCornerLongitude'];
                for (var jj=0; jj < lonCorners.length; jj++){
                    scene[lonCorners[jj]] += adjust;
                };

                if ((scene.browseAvailable == "Y") && (scene.dayOrNight == "DAY")){
                    var rp = scene.rowpath;
                    if(results.hasOwnProperty(rp)){
                        results[rp].push(scene);
                    }else{
                        results[rp] = [];
                        results[rp].push(scene);
                    }
                };
            };
        };

        var defaultStyle = {
                color: "#000",
                weight: 2.,
                fill: true,
                fillOpacity: 0,
                opacity: 1
        };

        var highlightStyle = {
                color: '#2262CC',
                weight: 3,
                opacity: 0.6,
                fill: true,
                fillOpacity: 0.65,
                fillColor: '#2262CC'
        };

        var RowPath = Object.keys(results);

        for (var i=0; i < RowPath.length; i++){

            var fp = results[RowPath[i]][0];
            var LL = L.latLng(fp.lowerLeftCornerLatitude, fp.lowerLeftCornerLongitude ),
                LR = L.latLng(fp.lowerRightCornerLatitude, fp.lowerRightCornerLongitude ),
                UL = L.latLng(fp.upperLeftCornerLatitude, fp.upperLeftCornerLongitude ),
                UR = L.latLng(fp.upperRightCornerLatitude, fp.upperRightCornerLongitude );

            var poly = L.polygon([LL, LR, UR, UL], defaultStyle)
               .on('mouseover', function () {this.setStyle(highlightStyle);})
               .on('mouseout', function () {this.setStyle(defaultStyle);})
               .on('click', onClickRowPath);

            //poly.scenes = results[RowPath[i]].sort(sortScenes); //add all scenes information to polygon
            poly.scenes = results[RowPath[i]].sort(sortScenes2);
            poly.id = RowPath[i];

            var icon = new L.DivIcon({ html: '<div><span>' + poly.scenes.length + '</span></div>', className: 'marker-circle text-center', iconSize: new L.Point(30, 30) });
            var marker = new L.marker(poly.getBounds().getCenter(), {icon: icon, clickable: false, zIndexOffset: 0, keyboard: false, opacity: 0.5}).addTo(map);

            markerGr.addLayer(marker);
            footprintGr.addLayer(poly);
        };

        if (RowPath.length === 0){
            $("div.h4noim").removeClass("display-none");
        }else{
            $("div.h4noim").addClass("display-none");
        }

        map.spin(false);
    }).fail(function() {
        $("div.h4noim").removeClass("display-none");
        map.spin(false);
    });
};

function updateMap(LatLng){

    if (typeof LatLng === 'undefined') {
        return;
    };
    var lat = (LatLng.lat).toString(),
        lon = (mod(LatLng.lng + 180, 360) - 180).toString(),
        str1 = "upperLeftCornerLatitude:[" + lat + "+TO+1000]+AND+lowerRightCornerLatitude:[-1000+TO+" + lat + "]",
        str2 = "+AND+lowerLeftCornerLongitude:[-1000+TO+" + lon + "]+AND+upperRightCornerLongitude:[" + lon + "+TO+1000]",
        query = scope.api_url + str1 + str2 + "&limit=2000";

    getDataAndUpdate(query);
};

function getUrlVars() {
    "use strict";
    var vars = {},
        parts = window.location.href.replace(/[?&]+([^=&]+)=([^&]*)/gi, function(m,key,value) {
            vars[key] = value;
        });
    return vars;
}

$( document ).ready(function() {
    initFilters();

    var keys = getUrlVars();
    if (keys.hasOwnProperty('before')) scope.before = keys.before;
    if (keys.hasOwnProperty('after')) scope.after = keys.after;

    if (scope.before !== '' && scope.after !== ''){
        onURLids()
    } else {
        $('#modalAbout').modal();
    }

});
