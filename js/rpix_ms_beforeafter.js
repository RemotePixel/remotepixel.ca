/*jslint browser: true*/
/*global $, jQuery, alert*/
/*global L, lealfet, alert*/
/*global moment, moment, alert*/
/*global console, console, alert*/
var locDate = new Date(),
    utcDate = new Date(locDate.getTime() + (locDate.getTimezoneOffset() * 60000)),
    avail_basemap = {
        'VIIRS_SNPP_CorrectedReflectance_TrueColor' : 'VIIRS True Color (CR)',
        'VIIRS_SNPP_CorrectedReflectance_BandsM11-I2-I1' : 'VIIRS Bands M11-I2-I1 (CR)',
        'VIIRS_SNPP_CorrectedReflectance_BandsM3-I3-M11' : 'VIIRS Bands M3-I3-I11 (CR)',
        'MODIS_Terra_CorrectedReflectance_TrueColor': 'Terra True Color (CR)',
        'MODIS_Terra_CorrectedReflectance_Bands721': 'Terra Bands 7-2-1 (CR)',
        'MODIS_Terra_CorrectedReflectance_Bands367': 'Terra Bands 3-6-7 (CR)',
        'MODIS_Aqua_CorrectedReflectance_TrueColor': 'Aqua True Color (CR)',
        'MODIS_Aqua_CorrectedReflectance_Bands721': 'Aqua Bands 7-2-1 (CR)',
        'MODIS_Terra_Land_Surface_Temp_Day': 'Terra Surface T° (Day)',
        'MODIS_Terra_Land_Surface_Temp_Night': 'Terra Surface T° (Night)',
        'MODIS_Aqua_Land_Surface_Temp_Day': 'Aqua Surface T° (Day)',
        'MODIS_Aqua_Land_Surface_Temp_Night': 'Aqua Surface T° (Night)',
        'OSM': 'OpenStreetMap'
    },
    scope = {
        lyr_max_zoom : 9,
        left_date : moment(utcDate).format('YYYY-MM-DD'),
        right_date: moment(utcDate).format('YYYY-MM-DD'),
        left_data: 'VIIRS_SNPP_CorrectedReflectance_TrueColor',
        right_data: 'VIIRS_SNPP_CorrectedReflectance_TrueColor'
    },
    map_option = {
        zoom: 1,
        attributionControl: false,
        zoomControl: false,
        touchZoom: false,
        inertia: false,
        minZoom: 1,
        maxZoom: 10,
        center: [1, 1]
    };

var mapbefore = L.map('map-before', map_option),
    mapafter = L.map('map-after', map_option);

var osm_url = 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png',
    attribution = '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
    left_osm = L.tileLayer(osm_url).addTo(mapbefore),
    right_osm = L.tileLayer(osm_url, {id: 'MapID', attribution: attribution}).addTo(mapafter);

L.control.zoom({position: 'topright'}).addTo(mapafter);
L.control.attribution({position: 'bottomright'}).addTo(mapafter);

var before_overlays = new L.layerGroup().addTo(mapbefore),
    after_overlays = new L.layerGroup().addTo(mapafter);

$('#map-container').beforeAfter(mapbefore, mapafter);

mapbefore.sync(mapafter);
mapafter.sync(mapbefore);

$("#map-container [id^='lt-text']").text('LEFT').css('text-transform', 'none');
$("#map-container [id^='rt-text']").text('RIGHT').css('text-transform', 'none');

////////////////////////////////////////////////////////////////////////
//function

$('#modalOverlay').on('show.bs.modal', function () {
    'use strict';
    if (before_overlays.getLayers().length !== 0) {
        $('#BasemapsCtrl-left').addClass('on');
    }
    if (after_overlays.getLayers().length !== 0) {
        $('#BasemapsCtrl-right').addClass('on');
    }
});

$('#modalOverlay').on('hide.bs.modal', function () {
    'use strict';
    if (before_overlays.getLayers().length !== 0) {
        $("#BasemapsCtrl-left [class^='side-view-content']").scrollTop(0);
        $('#BasemapsCtrl-left').removeClass('on');
    }
    if (after_overlays.getLayers().length !== 0) {
        $("#BasemapsCtrl-right [class^='side-view-content']").scrollTop(0);
        $('#BasemapsCtrl-right').removeClass('on');
    }
});

function changeOverlay(side, lyr_name) {
    'use strict';
    if (side === 'left') {
        scope.left_data = lyr_name;
        before_overlays.clearLayers();
        if (scope.left_data !== 'OSM') {
            before_overlays.addLayer(L.GIBSLayer(scope.left_data, {date:  scope.left_date, transparent: true}));
        }
        $("#left-id").text("Left: " + avail_basemap[scope.left_data]);
    } else {
        scope.right_data = lyr_name;
        after_overlays.clearLayers();
        if (scope.right_data !== 'OSM') {
            after_overlays.addLayer(L.GIBSLayer(scope.right_data, {date: scope.right_date, transparent: true}));
        }
        $("#right-id").text("Right: " + avail_basemap[scope.right_data]);
    }
}

function resetmap() {
    'use strict';
    scope.left_date = moment(utcDate.date).format('YYYY-MM-DD');
    scope.right_date = moment(utcDate.date).format('YYYY-MM-DD');
    $("#map-container [id^='lt-text']").text(scope.left_date).css('text-transform', 'none');
    $("#map-container [id^='rt-text']").text(scope.right_date).css('text-transform', 'none');
    scope.lyr_max_zoom = 9;
    changeOverlay('left', 'VIIRS_SNPP_CorrectedReflectance_TrueColor');
    changeOverlay('right', 'VIIRS_SNPP_CorrectedReflectance_TrueColor');
}

function getUrlVars() {
    "use strict";
    var vars = {};
    var parts = window.location.href.replace(/[?&]+([^=&]+)=([^&]*)/gi, function(m,key,value) {
        vars[key] = value;
    });
    return vars;
}

L.easyButton('fa-home',
    function () {
        'use strict';
        resetmap();
    },
    'Reset', mapafter);

L.easyButton('fa-sliders',
    function () {
        'use strict';
        if (before_overlays.getLayers().length !== 0 || after_overlays.getLayers().length !== 0) {
            $("#modalOverlay").modal();
        }
    },
    'Settings', mapafter);

L.easyButton('fa-share',
    function () {
        'use strict';
        if (before_overlays.getLayers().length !== 0 || after_overlays.getLayers().length !== 0) {

            var mZoom = (mapbefore._zoom < scope.lyr_max_zoom) ? mapbefore._zoom : scope.lyr_max_zoom,
                share_url = "https://remotepixel.ca/projects/viirsmodis_compare-nogl.html?leftmap=" + scope.left_data
                    + "&leftdate=" + scope.left_date
                    + "&latlngZ=[" + mapbefore.getCenter().lat + "," + mapbefore.getCenter().lng + "," + mZoom + "]"
                    + "&rightmap=" + scope.right_data
                    + "&rightdate=" + scope.right_date;


            $("#twitter").attr('href',
                    'https://twitter.com/share?url=' + encodeURIComponent(share_url) +
                    '&via=RemotePixel' +
                    '&hashtags=MODIS' +
                    '&related=NASAEarthData' +
                    '&text=MODIS-SUOMI before/after map');

            $("#linkedin").attr('href',
                    'https://www.linkedin.com/shareArticle?mini=true&url=' + encodeURIComponent(share_url) +
                    '&title=MODIS-SUOMI before/after map' +
                    '&source=https://remotepixel.ca');

            $("#facebook").attr('href',
                    'https://www.facebook.com/sharer/sharer.php?u=' + encodeURIComponent(share_url));

            $("#embedded").removeClass('display-none');

            var share_url = "https://remotepixel.ca/projects/viirsmodis_compare_emb-nogl.html?leftmap=" + scope.left_data
                + "&leftdate=" + scope.left_date
                + "&latlngZ=[" + mapbefore.getCenter().lat + "," + mapbefore.getCenter().lng + "," + mZoom + "]"
                + "&rightmap=" + scope.right_data
                + "&rightdate=" + scope.right_date;

            var url = '&lt;iframe frameborder="0" width="100%" height="360" src="' + share_url + '"&gt&lt;/iframe&gt'
            $("#modalEmbedded .code2copy code").html(url)

        } else {
            $("#twitter").attr('href', 'https://twitter.com/share?text=Access, Compare, Share NASA global imagery&url=' + window.location.href + '&via=RemotePixel&hashtags=MODIS&related=NASAEarthData');
            $("#linkedin").attr('href', 'https://www.linkedin.com/shareArticle?mini=true&url=' + window.location.href + '&title=' + document.title + '&source=https://remotepixel.ca');
            $("#facebook").attr('href', 'https://www.facebook.com/sharer/sharer.php?u=' + window.location.href);
            $("#embedded").addClass('display-none');
        }

        $('#modalShare').modal();
    },
    'Share it', mapafter);

L.easyButton('fa-info',
    function () {
        'use strict';
        $('#modalAbout').modal();
    },
    'About', mapafter);

$(document).ready(function () {
    'use strict';
    $("#map-container [id^='lt-text']").datepicker({
        format: 'mm/dd/yyyy',
        autoclose: true,
        todayHighlight: true,
        startDate: new Date('2012-05-08'),
        endDate: utcDate
    }).on('changeDate', function (e) {
        scope.left_date = moment(e.date).format('YYYY-MM-DD');
        $("#map-container [id^='lt-text']").text(scope.left_date).css('text-transform', 'none');
        changeOverlay('left', scope.left_data);
    });

    $("#map-container [id^='rt-text']").datepicker({
        format: 'mm/dd/yyyy',
        autoclose: true,
        todayHighlight: true,
        startDate: new Date('2012-05-08'),
        endDate: utcDate
    }).on('changeDate', function (e) {
        scope.right_date = moment(e.date).format('YYYY-MM-DD');
        $("#map-container [id^='rt-text']").text(scope.right_date).css('text-transform', 'none');
        changeOverlay('right', scope.right_data);
    });

    var leftmap = getUrlVars().leftmap,
        rightmap = getUrlVars().rightmap,
        leftdate = getUrlVars().leftdate,
        rightdate = getUrlVars().rightdate,
        latlngZ = getUrlVars().latlngZ;

    if (typeof leftmap !== 'undefined' &&
        typeof rightmap !== 'undefined' &&
        typeof leftdate !== 'undefined' &&
        typeof rightdate !== 'undefined' &&
        typeof latlngZ !== 'undefined'){

        scope.left_date = leftdate;
        scope.right_date = rightdate;
        $("#map-container [id^='lt-text']").text(scope.left_date).css('text-transform', 'none');
        $("#map-container [id^='rt-text']").text(scope.right_date).css('text-transform','none');

        scope.max_zoom = eval(latlngZ)[2];
        scope.latlng = [eval(latlngZ)[0], eval(latlngZ)[1]];

        mapbefore.setView(scope.latlng, scope.max_zoom);

        changeOverlay('left', leftmap);
        changeOverlay('right', rightmap);
    } else {
        scope.left_date = moment(utcDate.date).format('YYYY-MM-DD');
        scope.right_date = moment(utcDate.date).format('YYYY-MM-DD');
        $('#modalAbout').modal();
    }



});
