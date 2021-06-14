/*jslint browser: true*/
/*global $, jQuery, alert*/
/*global mapboxgl, mapboxgl, alert*/
/*global moment, moment, alert*/
/*global console, console, alert*/

////////////////////////////////////////////////////////////////////////
mapboxgl.accessToken = '{MAPBOX TOKEN}';

var scope = {
        uuid: '',
        tiles : []
    },
    map = new mapboxgl.Map({
        container: 'map',
        center: [0, 0],
        attributionControl: false,
        doubleClickZoom: false,
        boxZoom: false,
        zoom: 2,
        hash: true,
        style: 'mapbox://styles/vincentsarago/cip322u6y0018dgnqrdh8zjo9',
        minZoom: 2,
        maxZoom: 7
    });


map.dragRotate.disable();
map.touchZoomRotate.disableRotation();
map.addControl(new mapboxgl.Navigation());

////////////////////////////////////////////////////////////////////////////////
var btnreset = document.createElement('button');
btnreset.className = 'mapboxgl-ctrl-icon';
btnreset.setAttribute("onclick", "reset()");
var icnreset = document.createElement('i');
icnreset.className = 'fa fa-refresh ';
btnreset.appendChild(icnreset);

var grp = document.createElement('div');
grp.className = 'mapboxgl-ctrl-group mapboxgl-ctrl';
grp.appendChild(btnreset);

var control = document.getElementsByClassName("mapboxgl-ctrl-top-right");
control[0].appendChild(grp.cloneNode(true));

var ctrl = document.getElementsByClassName("mapboxgl-ctrl-bottom-right")[0],
    attr = document.createElement('div');
attr.className = 'mapboxgl-ctrl-attrib mapboxgl-ctrl';
ctrl.appendChild(attr);

$(".mapboxgl-ctrl-attrib").append('<a href="https://remotepixel.ca" target="_blank">&copy; RemotePixel.ca</a>');
$(".mapboxgl-ctrl-attrib").append('<a href="https://www.mapbox.com/about/maps/" target="_blank"> © Mapbox</a>');
$(".mapboxgl-ctrl-attrib").append('<a href="http://www.openstreetmap.org/about/" target="_blank"> © OpenStreetMap</a>');

////////////////////////////////////////////////////////////////////////////////

//from http://jsfiddle.net/briguy37/2MVFd/
function generateUUID() {
    var d = new Date().getTime();
    var uuid = 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function (c) {
        var r = (d + Math.random() * 16) % 16 | 0;
        d = Math.floor(d / 16);
        return (c=='x' ? r : (r&0x3 | 0x8)).toString(16);
    });
    return uuid;
}

function selectTiles(){
    var pr = ['any'];
    scope.tiles.forEach( function (e){
        pr.push(["==", "Name", e]);
    });
    map.setFilter("grdSRTM-selected", pr);

    if ((scope.tiles.length > 1) && (scope.tiles.length < 9)) {
        $(".tab-selector-2").prop('disabled', false);
    } else {
        $(".tab-selector-2").attr('disabled', 'disabled');
    }
}

function reset(){
    scope.tiles = [];
    selectTiles()
}

function back() {
    $( ".tab-selector-1" ).prop( "checked", true );
}

$(".tab-selector-2").change(function () {
    "use strict";
    if (this.checked) {
        //create uuid
        scope.uuid = generateUUID();
    }else{
        scope.uuid = '';
    }

    $('.form-rq').removeClass("display-none");
    $('.form-rq-resp').addClass("display-none");
    $('.uuid-text').text("Task ID: " + scope.uuid);
});

$('#submit-request').validator()
    .on('valid.bs.validator', function () {
        'use strict';
        $("#sendSRTMrequest").removeClass('disabled');
    })
    .on('invalid.bs.validator', function () {
        'use strict';
        $("#sendSRTMrequest").addClass('disabled');
    });

$('#sendSRTMrequest').on('click', function (e) {
    'use strict';

    if (!$('#sendSRTMrequest').hasClass('disabled')) {

        var req = {
            uuid: scope.uuid,
            tiles: scope.tiles,
            mailto: $('#EmailRequest').val(),
        };

        var postReq = $.post("{{ RPIX_API }}/srtm", JSON.stringify({info: req}))

        $('.form-rq').addClass("display-none");
        $('.form-rq-resp').removeClass("display-none");
        $(".form-rq").find('form')[0].reset();
    }
});

////////////////////////////////////////////////////////////////////////////////

map.on('style.load', function() {

    map.addSource('srtm', {
        "type": "vector",
        "url": "mapbox://vincentsarago.brk5rjab"
    });

    map.addLayer({
            "id": "grdSRTM-selected",
            "type": "fill",
            "source": "srtm",
            "source-layer": "SRTM1arc_WGS84",
            "paint": {
                "fill-outline-color": "#033b4e",
                "fill-color": "#075c79",
                "fill-opacity": 0.5
            },
            "filter": ["in", "Name", ""]
        }
    );

});

map.on('contextmenu', function (e) {
    var features = map.queryRenderedFeatures(e.point, { layers: ['srtm'] });
    if (!features.length) {
        return;
    }
    var feature = features[0],
        mirror = 'http://e4ftl01.cr.usgs.gov/SRTM/SRTMGL1.003/2000.02.11/',
        aws = 'https://s3.amazonaws.com/elevation-tiles-prod/skadi/',
        name =  feature.properties.Name,
        // os.path.join(srtm_site, '{}/{}.hgt.gz'.format(tl[0:3], tl))
        // file = mirror + name + '.SRTMGL1.hgt.zip',
        file = aws + name.slice(0,3) + '/' + name + '.hgt.gz',
        quicklook = mirror + feature.properties.Quicklook,
        html = '<span class="marker-title">' + name + '</span>'+
               '<div class="popup-img"><img class="img-responsive" src="'+ quicklook +'""></div>'+
               '<div class="dwn-btn"><a class="btn btn-small btn-success" href="' + file + '" target="_blank">Download</a></div>';

    var popup = new mapboxgl.Popup()
        .setLngLat(e.lngLat)
        .setHTML(html)
        .addTo(map);
});

map.on('click', function (e) {

    var features = map.queryRenderedFeatures(e.point, {layers: ['srtm']});
    if (!features.length) {
        return;
    }

    var feature = features[0],
        index = scope.tiles.indexOf(feature.properties.Name);
    if (index > -1) {
        scope.tiles.splice(index, 1);
    } else {
        scope.tiles.push(feature.properties.Name);
    }

    selectTiles();

});

$(document).ready(function () {
    'use strict';

    var share_url =  'https://remotepixel.ca/projects/srtm1arc-gl.html';
    $("#twitter").attr('href',
            'https://twitter.com/share?url=' + encodeURIComponent(share_url) +
            '&via=RemotePixel' +
            '&text=SRTM 1arc tile Mosaic');

    $("#linkedin").attr('href',
            'https://www.linkedin.com/shareArticle?mini=true&url=' + encodeURIComponent(share_url) +
            '&title=SRTM 1arc tile Mosaic' +
            '&source=https://remotepixel.ca');

    $("#facebook").attr('href',
            'https://www.facebook.com/sharer/sharer.php?u=' + encodeURIComponent(share_url));

    $('#modalAbout').modal();

});
