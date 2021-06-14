/*jslint browser: true*/
/*global $, jQuery, alert*/
/*global mapboxgl, mapboxgl, alert*/
/*global moment, moment, alert*/
/*global console, console, alert*/

var scope = {
        results: {},
        cloudmin: 0,
        cloudmax: 100,
        datestart: moment('2013-04-01').utc(),
        dateend: moment.utc()//,
    };

$('#modalPreview').on('shown.bs.modal', function () {
    "use strict";
    $(".img-preview").focus();
});

$('#modalPreview').on('hidden.bs.modal', function () {
    "use strict";
    $('.img-preview').scrollTop(0);
    $('.img-preview').empty();
});

$('#modalDownloadL8').on('shown.bs.modal', function () {
    "use strict";
    $("#modalDownloadL8 .dwn-bands").focus();
});

$('#modalDownloadL8').on('hidden.bs.modal', function () {
    "use strict";
    $("#modalPreview").focus();
    $('#modalDownloadL8 .dwn-bands').empty();
    $('#modalDownloadL8 .overview').attr('data-id', '');
    $('#modalDownloadL8 .overview').html('<span><i class="fa fa-spinner fa-spin"></i></span>');

    $("#modalDownloadL8 .dropdown-menu li a").each(function (index, element) {
        $(element).removeClass('on');
    });
    $("#modalDownloadL8 .dropdown-menu li a").first().addClass("on");
    $("#modalDownloadL8 .dropdown .btn:first-child").html($("#modalDownloadL8 .dropdown-menu li a").first().text() + ' <span class="caret"></span>');

});

$(function () {
    "use strict";

    $("#modalDownloadL8 .dropdown-menu li a").click(function () {
        $('#modalDownloadL8 .overview').html('<span><i class="fa fa-spinner fa-spin"></i></span>');
        $("#modalDownloadL8 .dropdown .btn:first-child").html($(this).text() + ' <span class="caret"></span>');

        var req = {
            scene: $('#modalDownloadL8 .overview').attr("data-id"),
            bands: $(this).parent().attr("data-bands")
        };

        $.post("{{ RPIX_API }}/landsat/overview", JSON.stringify({info: req}))
            .done(function (data) {
                if (!(data.hasOwnProperty('errorMessage'))) {
                    $('#modalDownloadL8 .overview').html('<img src="data:image/png;base64,' + data.data + '">');
                } else {
                    $('#modalDownloadL8 .overview').html('<span>Preview Unavailable</span>');
                }
            })
            .fail(function () {
                $('#modalDownloadL8 .overview').html('<span>Preview Unavailable</span>');
            });

        $("#modalDownloadL8 .dropdown-menu li a").each(function (index, element) {
            $(element).removeClass('on');
        });
        $(this).addClass('on');

    });
});

////////////////////////////////////////////////////////////////////////////////
if (!mapboxgl.supported()) {
    alert('Your browser does not support Mapbox GL');
    $("#modalGL").modal();
} else {

    mapboxgl.accessToken = '{MAPBOX TOKEN}';
    var map = new mapboxgl.Map({
        container: 'map',
        style: 'mapbox://styles/mapbox/light-v9',
        center: [-70.50, 40],
        zoom: 4,
        attributionControl: false,
        minZoom: 4,
        maxZoom: 7
    });

    map.addControl(new mapboxgl.Navigation({position: 'top-left'}));

    var ctrl = document.getElementsByClassName("mapboxgl-ctrl-bottom-right")[0],
        attr = document.createElement('div');
    attr.className = 'mapboxgl-ctrl-attrib mapboxgl-ctrl';
    ctrl.appendChild(attr);

    $(".mapboxgl-ctrl-attrib").append('<a href="https://remotepixel.ca" target="_blank">&copy; RemotePixel.ca</a>');
    $(".mapboxgl-ctrl-attrib").append('<a href="https://www.mapbox.com/about/maps/" target="_blank"> © Mapbox</a>');
    $(".mapboxgl-ctrl-attrib").append('<a href="http://www.openstreetmap.org/about/" target="_blank"> © OpenStreetMap</a>');

    // map.on('moveend', function () {
    //     "use strict";
    //     filterL8Grid();
    // });

    map.on('mousemove', function (e) {
        "use strict";
        var features = map.queryRenderedFeatures(e.point, {layers: ['grdL8']}),
            pr;
        if (features.length !== 0) {
            pr = ['any'];
            features.forEach(function (e) {
                pr.push(["all", ["==", "PATH", e.properties.PATH], ["==", "ROW", e.properties.ROW]]);
            });
            map.setFilter("grdL8-highlighted", pr);
        }
    });

    map.on('click', function (e) {
        "use strict";
        scope.results = {};

        $('.spin').removeClass('display-none');
        var features = map.queryRenderedFeatures(e.point, {layers: ['grdL8']}),
            pr;

        if (features.length !== 0) {
            pr = ['any'];
            features.forEach(function (e) {
                pr.push(["all", ["==", "PATH", e.properties.PATH], ["==", "ROW", e.properties.ROW]]);
            });
            map.setFilter("grdL8-selected", pr);
            buildQueryAndRequestL8(features);
        } else {
            $('.spin').addClass('display-none');
            map.setFilter("grdL8-selected", ["in", "PATH", ""]);
        }
    });

    map.on('style.load', function () {
        "use strict";

        map.addSource('landsat', {
            "type": "vector",
            "url": "mapbox://vincentsarago.9vmfvfcx"
        });

        map.addLayer({
            "id": "grdL8",
            "type": "fill",
            "source": "landsat",
            "source-layer": "LANDSAT_8_metageojson",
            "paint": {
                "fill-outline-color": "#324952",
                "fill-color": "#0f6d8e",
                "fill-opacity": 0.1
            }
        });

        map.addLayer({
            "id": "grdL8-highlighted",
            "type": "fill",
            "source": "landsat",
            "source-layer": "LANDSAT_8_metageojson",
            "paint": {
                "fill-outline-color": "#324952",
                "fill-color": "#0f6d8e",
                "fill-opacity": 0.4
            },
            "filter": ["in", "PATH", ""]
        });

        map.addLayer({
            "id": "grdL8-selected",
            "type": "fill",
            "source": "landsat",
            "source-layer": "LANDSAT_8_metageojson",
            "paint": {
                "fill-outline-color": "#324952",
                "fill-color": "#0f6d8e",
                "fill-opacity": 0.4
            },
            "filter": ["in", "PATH", ""]
        });

        $(".loading-map").addClass('off');
    });
}

function hoverPR(gr) {
    "use strict";
    map.setFilter("grdL8-highlighted", gr);
}

////////////////////////////////////////////////////////////////////////////////
//From Libra by developmentseed (https://github.com/developmentseed/libra)
function zeroPad(n, c) {
    'use strict';
    var s = String(n);
    if (s.length < c) {
        return zeroPad('0' + n, c);
    }
    return s;
}

function sortScenes(a, b) {
    'use strict';
    return Date.parse(b.date) - Date.parse(a.date);
}

////////////////////////////////////////////////////////////////////////////////
function buildQueryAndRequestL8(features) {
    'use strict';

    $('.list-img').scrollTop(0);
    $('.list-img').empty();

    var results = {};

    features.forEach(function (e) {
        var c = JSON.parse(e.properties.cloudCover),
            d = JSON.parse(e.properties.acquisitionDate),
            i,
            j,
            scene,
            dates = [],
            cloud = [];

        for (j = 0; j < d.length; j += 1) {
            if (c[j] <= scope.cloudmax) {
                if (scope.datestart <= moment(d[j]) && moment(d[j]) <= scope.dateend) {
                    dates.push(d[j]);
                    cloud.push(c[j]);
                }
            }
        }

        for (i = 0; i < dates.length; i += 1) {
            scene = {};
            scene.path = e.properties.PATH.toString();
            scene.row = e.properties.ROW.toString();
            scene.grid = scene.path + '/' + scene.row;
            scene.date = dates[i];
            scene.cloud = cloud[i];
            scene.sceneID = "LC8" +
                zeroPad(scene.path, 3) +
                zeroPad(scene.row, 3) +
                scene.date.slice(0, 4) +
                zeroPad(moment(scene.date).utc().dayOfYear().toString(), 3) +
                "LGN00";

            scene.browseURL = "http://earthexplorer.usgs.gov/browse/landsat_8/" +
                scene.date.slice(0, 4) +
                "/" + zeroPad(scene.path, 3) +
                "/" + zeroPad(scene.row, 3) +
                "/" + scene.sceneID + ".jpg";

            scene.usgsURL = "http://earthexplorer.usgs.gov/order/process?dataset_name=LANDSAT_8&ordered=" + scene.sceneID;
            scene.AWSurl = 'http://landsat-pds.s3.amazonaws.com/L8/' +
                zeroPad(scene.path, 3) + '/' +
                zeroPad(scene.row, 3) + '/' +
                scene.sceneID + '/';

            if (results.hasOwnProperty(scene.grid)) {
                results[scene.grid].push(scene);
            } else {
                results[scene.grid] = [];
                results[scene.grid].push(scene);
            }
        }
    });

    var grid = Object.keys(results),
        i,
        latest,
        hoverstr,
        nohoverstr;

    for (i = 0; i < grid.length; i += 1) {
        results[grid[i]].sort(sortScenes);

        latest = results[grid[i]][0];
        hoverstr = "['all', ['==', 'PATH', " + latest.path + "], ['==', 'ROW', " + latest.row + "]]";
        nohoverstr = "['all', ['==', 'PATH', ''], ['==', 'ROW', '']]";

        $('.list-img').append(
            '<div id ="' +  latest.grid + '" onclick="feedPreviewL8(this)" onmouseover="hoverPR(' + hoverstr + ')" onmouseout="hoverPR(' + nohoverstr + ')" class="list-element">' +
                '<div class="col">' +
                    '<div class="prinfo"><span class="pathrow">' + latest.grid + '</span></div>' +
                    '<div class="prinfo">' +
                        '<span class="date">Latest: ' + latest.date + '  </span>' +
                        '<span class="date"><i class="fa fa-cloud"></i> ' + latest.cloud + '%</span>' +
                    '</div>' +
                '</div>' +
                '<div class="img-thumb">' +
                    '<img id="' + latest.sceneID +  '" ' +
                        'class="img-item img-responsive lazy2 lazyload"' +
                        'src="' + latest.browseURL + '">' +
                '</div>' +
                '</div>'
        );
    }

    scope.results = results;
    $('.spin').addClass('display-none');
}

////////////////////////////////////////////////////////////////////////////////
function feedPreviewL8(elem) {
    'use strict';
    var res = scope.results[elem.id],
        i;

    for (i = 0; i < res.length; i += 1) {
        $('.img-preview').append(
            '<div class="item">' +
                '<img class="img-item img-responsive lazy lazyload" data-src="' + res[i].browseURL + '" class="img-responsive">' +
                '<div class="result-overlay">' +
                    '<span>' + res[i].sceneID + '</span>' +
                    '<span><i class="fa fa-calendar-o"></i> ' + res[i].date + '</span>' +
                    '<span><i class="fa fa-cloud"></i> ' + res[i].cloud + '%</span>' +
                    '<span>Link:</span>' +
                    '<div class="btnDD" onclick="feeddownloadL8(\'' + res[i].AWSurl + '\',\'' + res[i].sceneID + '\')"><i class="fa fa-download"></i></div>' +
                    '<a target="_blank" href="' + res[i].AWSurl + 'index.html"><img src="/img/aws.png"> </a>' +
                    '<a target="_blank" href="' + res[i].usgsURL + '"><img src="/img/usgs.jpg"></a>' +
                '</div>' +
                '</div>'
        );
    }
    $('#modalPreview').modal();
}

function feeddownloadL8(url, id) {
    "use strict";

    $('#modalDownloadL8 .overview').attr('data-id', id);
    $('#modalDownloadL8 .dwn-bands').append(
        '<span>Direct Download L8 band (Right Click on link)</span>' +
            '<a id="b1" target="_blank" href="' + url + id + '_B1.TIF" download>B1 - Coastal aerosol</a>' +
            '<a id="b2" target="_blank" href="' + url + id + '_B2.TIF" download>B2 - Blue</a>' +
            '<a id="b3" target="_blank" href="' + url + id + '_B3.TIF" download>B3 - Green</a>' +
            '<a id="b4" target="_blank" href="' + url + id + '_B4.TIF" download>B4 - Red</a>' +
            '<a id="b5" target="_blank" href="' + url + id + '_B5.TIF" download>B5 - Near Infrared</a>' +
            '<a id="b6" target="_blank" href="' + url + id + '_B6.TIF" download>B6 - Shortwave Infrared 1</a>' +
            '<a id="b7" target="_blank" href="' + url + id + '_B7.TIF" download>B7 - Shortwave Infrared 2</a>' +
            '<a id="b8" target="_blank" href="' + url + id + '_B8.TIF" download>B8 - Panchromatic (15m)</a>' +
            '<a id="b9" target="_blank" href="' + url + id + '_B9.TIF" download>B9 - Cirrus</a>' +
            '<a id="b10" target="_blank" href="' + url + id + '_B10.TIF" download>B10 - Thermal Infrared 1</a>' +
            '<a id="b11" target="_blank" href="' + url + id + '_B11.TIF" download>B11 - Thermal Infrared 2</a>' +
            '<a id="bQA" target="_blank" href="' + url + id + '_BQA.TIF" download>BQA - Quality Assessment</a>' +
            '<a id="mtl" target="_blank" href="' + url + id + '_MTL.txt" download>MTL - Metadata</a>'
    );

    var req = {
        scene: id,
        bands: "[4,3,2]"
    };

    $.post("{{ RPIX_API }}/landsat/overview", JSON.stringify({info: req}))
        .done(function (data) {
            if (!(data.hasOwnProperty('errorMessage'))) {
                $('#modalDownloadL8 .overview').html('<img src="data:image/png;base64,' + data.data + '">');
            } else {
                $('#modalDownloadL8 .overview').html('<span>Preview Unavailable</span>');
            }
        })
        .fail(function () {
            $('#modalDownloadL8 .overview').html('<span>Preview Unavailable</span>');
        });

    $('#modalDownloadL8').modal();
}

////////////////////////////////////////////////////////////////////////////////

function filterL8Grid() {
    "use strict";
    map.setFilter("grdL8-selected", ["in", "PATH", ""]);
    $('.list-img').scrollTop(0);
    $('.list-img').empty();
    $('.list-img').append('<span class="nodata-error">Click on Tile</span>');

    if ($(".button-update").attr("disabled") !== "") $(".button-update").attr("disabled", false)

    // var features = map.queryRenderedFeatures(scope.bounds, { layers: ['backgrid'] }),
    var features = map.querySourceFeatures('landsat', {
            sourceLayer: 'LANDSAT_8_metageojson',
            filter: null
        }),
        pr;

    if (features.length !== 0) {
        pr = ['any'];
        features.forEach(function (e) {
            if ('PATH' in e.properties) {

                var cloud = JSON.parse(e.properties.cloudCover),
                    dates = JSON.parse(e.properties.acquisitionDate),
                    cc = cloud.map(function (val) {
                        return val <= scope.cloudmax;
                    }),
                    dd = dates.filter(function (el, index, arr) {
                        if (cc[index] === true) {
                            return (scope.datestart <= moment(el) && moment(el) <= scope.dateend);
                        }
                        return false;
                    });

                if (dd.length !== 0) {
                    pr.push(["all", ["==", "PATH", e.properties.PATH], ["==", "ROW", e.properties.ROW]]);
                }
            }
        });
        map.setFilter("grdL8", pr);
    }
}

function setDate() {
    'use strict';
    scope.datestart = moment.unix($('#dateSlider').val()[0]);
    scope.dateend = moment.unix($('#dateSlider').val()[1]);

    $(".dateValues").html(
        scope.datestart.format("MMM DD, YYYY") + " - " +
            scope.dateend.format("MMM DD, YYYY")
    );
}

function updateDate() {
    'use strict';
    scope.datestart = moment.unix($('#dateSlider').val()[0]);
    scope.dateend = moment.unix($('#dateSlider').val()[1]);
    $(".dateValues").html(
        scope.datestart.format("MMM DD, YYYY") + " - " +
            scope.dateend.format("MMM DD, YYYY")
    );
    filterL8Grid();
}

function setCloud() {
    'use strict';
    scope.cloudmax = parseInt($('#cloudCoverSlider').val());
    $(".cloudValues").html(
        '<i class="fa fa-cloud"></i> ' +
            scope.cloudmin + " - " +
            scope.cloudmax + " %"
    );
}

function updateCloud() {
    'use strict';
    scope.cloudmax = parseInt($('#cloudCoverSlider').val());

    $(".cloudValues").html(
        '<i class="fa fa-cloud"></i> ' +
            scope.cloudmin + " - " +
            scope.cloudmax + " %"
    );

    if (scope.cloudmax === 0) {
        scope.cloudmax = 1;
    }
    filterL8Grid();
}


function initFilters() {
    'use strict';

    //Cloud Cover Slider
    $("#cloudCoverSlider").noUiSlider({
        start: [ 100 ],
        step: 1,
        connect: 'lower',
        range: {
            'min': 0,
            'max': 100
        }
    });

    $('#cloudCoverSlider').on('slide', setCloud);
    $('#cloudCoverSlider').on('set', updateCloud);

    $(".cloudValues").html(
        '<i class="fa fa-cloud"></i> ' +
            scope.cloudmin + " - " +
            scope.cloudmax + " %"
    );

    //Date slider
    $("#dateSlider").noUiSlider({
        range: {
            'min': scope.datestart.unix(),
            'max': scope.dateend.unix()
        },
        behaviour: 'drag',
        connect: true,
        step: 1 * 24 * 60 * 60,
        format: wNumb({ decimals: 0 }),
        start: [moment(scope.datestart).unix(), moment(scope.dateend).unix()]
    });

    $(".dateValues").html(
        scope.datestart.format("MMM DD, YYYY") + " - " +
            scope.dateend.format("MMM DD, YYYY")
    );

    $('#dateSlider').on('slide', setDate);
    $('#dateSlider').on('set', updateDate);
}

$(document).ready(function () {
    initFilters();
    $('#modalAbout').modal();
});
