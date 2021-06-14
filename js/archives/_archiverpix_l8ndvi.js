/*jslint browser: true*/
/*global $, jQuery, alert*/
/*global L, lealfet, alert*/
/*global turf, turf, alert*/
/*global c3, C3, alert*/
/*global moment, moment, alert*/
/*global console, console, alert*/
//********************************************************************//


////////////////////////////////////////////////////////////////////////
//Global Variables
var scope = {
    api_landsat: 'https://api.remotepixel.ca/landsat?search=',
    api_ndvi: '{{ RPIX_API }}/landsat/ndviserie?',
    filtervalues: {
        cloudmin: 0,
        cloudmax: 20,
        datestart: '2013-04-01',
        dateend: moment().utc().format('YYYY-MM-DD')
    },
    landsat_to_process: [],
    ndvi_values: []
};

var map = L.map('map', {
    center: [0, 0],
    bounceAtZoomLimits: false,
    attributionControl: false,
    worldCopyJump: false,
    zoomControl: false,
    touchZoom: false,
    inertia: false,
    minZoom: 2,
    zoom: 2,
    maxZoom: 17
});

L.control.attribution({prefix: '<a href="https://remotepixel.ca" target="_blank"> &copy; RemotePixel.ca</a>', position: 'bottomright'})
    .addAttribution('Landsat data from NASA/USGS')
    .addTo(map);

//Adding some basemap to the map
var mars_terrain2 = L.tileLayer('https://api.tiles.mapbox.com/v4/{id}/{z}/{x}/{y}.jpg70?access_token={accessToken}', {
    attribution: "<a href='http://www.mapbox.com/about/maps/' target='_blank'>&copy; Mapbox</a>, <a href='https://www.digitalglobe.com/' target='_blank'> © DigitalGlobe</a></div>",
    id: 'mapbox.satellite',
    zIndex: 0,
    accessToken: '{MAPBOX TOKEN}'
}).addTo(map);

L.control.zoom({position: 'topright'}).addTo(map);

// Initialise the FeatureGroup to store editable layers
var drawLayers = new L.FeatureGroup();
map.addLayer(drawLayers);

var options = {
        position: 'topright',
        draw: {
            polyline:  false,
            polygon: false,
            circle: false,
            rectangle: false,
            marker: true
        },
        edit: {
            featureGroup: drawLayers,
            remove: false
        }
    };

map.addControl(new L.Control.Draw(options));

//From Libra by developmentseed (https://github.com/developmentseed/libra)
function mod(number, dividend) {
    'use strict';
    return ((number % dividend) + dividend) % dividend;
}

function zeroPad(n, c) {
    'use strict';
    var s = String(n);
    if (s.length < c) {
        return zeroPad('0' + n, c);
    }
    return s;
}

function closechart() {
    'use strict';
    $(".chart").removeClass('in');
    map.invalidateSize();
}

//********************************************************************//

function resetmap() {
    'use strict';
    scope.landsat_to_process = [];
    scope.ndvi_values = [];
    drawLayers.clearLayers();
    map.invalidateSize();
}

function cleanmap() {
    'use strict';
    scope.landsat_to_process = [];
    scope.ndvi_values = [];
    drawLayers.clearLayers();
    map.invalidateSize();
}

function sortNDVI(a, b) {
    'use strict';
    return Date.parse(a.date) - Date.parse(b.date);
}

function sortCloud(a, b) {
    'use strict';
    return a.cloudCoverFull - b.cloudCoverFull;
}

function sortScenes(a, b) {
    'use strict';
    return Date.parse(b.acquisitionDate) - Date.parse(a.acquisitionDate);
}

'use strict';

function get_ndvi_values(url) {
    return $.post(url, function (data) {
        if (!(data.hasOwnProperty('errorMessage'))) scope.ndvi_values.push(data);
    }).done();
}

function ndvi_task() {
    'use strict';
    var results = [];
    scope.landsat_to_process.forEach(function (d) {
        var scene = 'scene=' + d.sceneID,
            latlng = drawLayers.getLayers()[0].getLatLng(),
            lat = latlng.lat,
            lng = mod(latlng.lng + 180, 360) - 180,
            pt = 'point=[' + lat + ',' + lng + ']',
            url = scope.api_ndvi + scene + '&' + pt;
        results.push(get_ndvi_values(url));
    });

    $(".info-process span").text("Processing Landsat images (" + scope.landsat_to_process.length + ")");

    const getNdvi = (scene, coord) => {

    };

    $.when.apply(this, results).done(function () {
        //console.log('done')


        if (scope.ndvi_values.lenght !== 0) {
            scope.ndvi_values.sort(sortNDVI);
            $(".chart").addClass('in');
            map.invalidateSize();

            var ndvi = scope.ndvi_values.map(function (a) {return a.ndvi; }),
                date_ndvi = scope.ndvi_values.map(function (a) {return a.date; }),
                cloud = scope.ndvi_values.map(function (a) {return a.cloud; }),
                chart = c3.generate({
                    bindto: '#chart',
                    padding: {
                        top: 0,
                        right: 40,
                        bottom: 0,
                        left: 40
                    },
                    legend: {hide: true},
                    data: {
                        x: 'x',
                        columns: [
                            ['x'].concat(date_ndvi),
                            ['ndvi'].concat(ndvi)
                        ]
                    },
                    axis: {
                        x: {
                            type: 'timeseries',
                            tick: {
                                rotate: 20,
                                format: '%Y-%m-%d',
                                fit: true
                            }
                        },
                        y: {max: 1, min: -0.2}
                    },
                    tooltip: {
                        format: {
                            value: function (value, ratio, id, index) {
                                var st = value.toString().slice(0, 5) + " (cloud: " + cloud[index] + "%)";
                                return st;
                            }
                        }
                    }
                });
        } else {
            $("#noNDVI").removeClass('display-none');
        }

        $(".info-process").addClass('display-none');
        $(".handle_spin").addClass('opa');
    });
}

function update_Landsat_list(Mark) {
    'use strict';
    if (typeof Mark === 'undefined') {
        return;
    }

    $(".info-process").removeClass('display-none');
    $(".info-process span").text("Retrieving Landsat 8 data for the selected point");

    scope.landsat_to_process = [];
    scope.ndvi_values = [];

    $("#rpixAPI").addClass('display-none');
    $("#noL8").addClass('display-none');
    $("#noNDVI").addClass('display-none');
    $(".handle_spin").removeClass('opa');

    var lat = (Mark.getLatLng().lat).toString(),
        lon = (mod(Mark.getLatLng().lng + 180, 360) - 180).toString(),
        str1 = "upperLeftCornerLatitude:[" + lat + "+TO+1000]+AND+lowerRightCornerLatitude:[-1000+TO+" + lat + "]",
        str2 = "+AND+lowerLeftCornerLongitude:[-1000+TO+" + lon + "]+AND+upperRightCornerLongitude:[" + lon + "+TO+1000]",
        cloudfilter = "+AND+cloudCoverFull:[" + scope.filtervalues.cloudmin + "+TO+" + scope.filtervalues.cloudmax + "]",
        datefilter = "+AND+acquisitionDate:[" + scope.filtervalues.datestart + "+TO+" + scope.filtervalues.dateend + "]",
        query = scope.api_landsat + str1 + str2 + datefilter + cloudfilter + "&limit=2000",
        pointturf = turf.point([mod(Mark.getLatLng().lng + 180, 360) - 180, Mark.getLatLng().lat]),
        results = [];

    $(".latlong span").text("lat: " + lat.slice(0, 10) + " | lon:" + lon.slice(0, 10));
    $(".latlong").removeClass('display-none');

    $.getJSON(query, function (data) {

        for (let i = 0; i < data.results.length; i += 1) {
            let scene = {};
            scene.rowpath = data.results[i].row + '-' + data.results[i].path;
            scene.acquisitionDate = data.results[i].acquisitionDate;
            scene.date = data.results[i].acquisitionDate;
            scene.browseURL = data.results[i].browseURL;
            scene.cloudCover = data.results[i].cloudCover;
            scene.cloudCoverFull = data.results[i].cloudCoverFull;
            scene.path = data.results[i].path;
            scene.row = data.results[i].row;
            scene.sunAzimuth = data.results[i].sunAzimuth;
            scene.sunElevation = data.results[i].sunElevation;
            // scene.sceneID = data.results[i].sceneID;
            scene.lowerLeftCornerLatitude = data.results[i].lowerLeftCornerLatitude;
            scene.lowerRightCornerLatitude = data.results[i].lowerRightCornerLatitude;
            scene.upperLeftCornerLatitude = data.results[i].upperLeftCornerLatitude;
            scene.upperRightCornerLatitude = data.results[i].upperRightCornerLatitude;
            scene.lowerLeftCornerLongitude = data.results[i].lowerLeftCornerLongitude;
            scene.lowerRightCornerLongitude = data.results[i].lowerRightCornerLongitude;
            scene.upperLeftCornerLongitude = data.results[i].upperLeftCornerLongitude;
            scene.upperRightCornerLongitude = data.results[i].upperRightCornerLongitude;
            // scene.AWSurl = 'http://landsat-pds.s3.amazonaws.com/L8/' + zeroPad(data.results[i].path, 3) + '/' + zeroPad(data.results[i].row, 3) + '/' + data.results[i].sceneID + '/';

            scene.sceneID = data.results[i].scene_id;
            scene.productID = data.results[i].LANDSAT_PRODUCT_ID;
            scene.awsID = (Date.parse(scene.date) < Date.parse('2017-05-01')) ? data.results[i].scene_id.replace(/LGN0[0-9]/, 'LGN00'): data.results[i].LANDSAT_PRODUCT_ID;

            let polygon = turf.polygon([[
                [scene.upperLeftCornerLongitude, scene.upperLeftCornerLatitude],
                [scene.upperRightCornerLongitude, scene.upperRightCornerLatitude],
                [scene.lowerRightCornerLongitude, scene.lowerRightCornerLatitude],
                [scene.lowerLeftCornerLongitude, scene.lowerLeftCornerLatitude],
                [scene.upperLeftCornerLongitude, scene.upperLeftCornerLatitude]
            ]]);
            if (turf.inside(pointturf, polygon)  && data.results[i].hasOwnProperty('S3')) {
                results.push(scene);
            }
        }

        if (results.length !== 0) {
            var landsat_on_pt = results;

            //Filtre Scene:
            var date_scene = landsat_on_pt.map(function (a) {return a.acquisitionDate; }),
                uniquedate = date_scene.filter(function(itm, i, date_scene) {
                    return i === date_scene.indexOf(itm);
                });

            uniquedate.forEach(function(d){
                var dd = landsat_on_pt.filter(function (e) {return e.acquisitionDate === d});

                if (dd.length > 1) {
                    dd.sort(sortCloud);
                    (scope.landsat_to_process).push(dd[0]);
                } else {
                    (scope.landsat_to_process).push(dd[0]);
                }
            });

            scope.landsat_to_process.sort(sortScenes);

            ndvi_task();
        } else {
            $("#noL8").removeClass('display-none');
            $(".handle_spin").addClass('opa');
            $(".info-process").addClass('display-none');
        }

    }).fail(function () {
        $(".handle_spin").addClass('opa');
        $("#rpixAPI").removeClass('display-none');
        $(".info-process").addClass('display-none');

    });
}

map.on('draw:created', function (e) {
    'use strict';
    var layer = e.layer;

    drawLayers.clearLayers();
    drawLayers.addLayer(layer);
    update_Landsat_list(layer);
});

map.on('draw:edited', function (e) {
    'use strict';
    var keys = Object.keys(e.layers._layers),
        layer = e.layers._layers[keys[0]];
    update_Landsat_list(layer);
});

L.easyButton('fa-info',
    function () {
        'use strict';
        $('#modalAbout').modal();
    },
    'About');

L.easyButton('fa-share',
    function () {
        'use strict';
        $("#twitter").attr('href', 'https://twitter.com/share?text=Landsat 8 NDVI Serie&url=' + window.location.href + '&via=RemotePixel&hashtags=Landsat');
        $("#linkedin").attr('href', 'https://www.linkedin.com/shareArticle?mini=true&url=' + window.location.href + '&title=' + document.title + '&source=https://remotepixel.ca');
        $("#facebook").attr('href', 'https://www.facebook.com/sharer/sharer.php?u=' + window.location.href);
        $('#modalShare-bottom').modal();
    },
    'Share it');

L.easyButton('fa-home',
    function () {
        'use strict';
        resetmap();
        map.fitWorld();
    },
    'Reset');

$(document).ready(function () {
    'use strict';
    $(".handle_spin").addClass('opa');
    $('#modalAbout').modal();
});
