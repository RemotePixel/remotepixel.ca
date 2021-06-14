/*jslint browser: true*/
/*global $, jQuery, alert*/
/*global mapbox, mapboxgl, alert*/
/*global moment, moment, alert*/
/*global console, console, alert*/

// var sat_api = 'https://api.astrodigital.com/v2.0/search/?',
var sat_api = 'https://api.developmentseed.org/satellites/',
    scope = {
        results: {}
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

    $("#modalDownloadL8 .btn-download").removeClass("processing");
    $("#modalDownloadL8 .btn-download").removeClass("error");
    $("#modalDownloadL8 .btn-download").removeClass("ready");
    $("#modalDownloadL8 .btn-download span").text('Download');
    $("#modalDownloadL8 .btn-download a").attr('href', '');
    $("#modalDownloadL8 .dropdown-menu li a").each(function () {
        $(this).removeClass('on');
    });
    $("#modalDownloadL8 .dropdown-menu li a").first().addClass("on");
    $("#modalDownloadL8 .dropdown .btn:first-child").html($("#modalDownloadL8 .dropdown-menu li a").first().text() + ' <span class="caret"></span>');
});

$('#modalDownloadL8').on('hidden.bs.modal', function () {
    "use strict";
    $("#modalPreview").focus();
    $('#modalDownloadL8 .dwn-bands').empty();
    $('#modalDownloadL8 .overview').attr('data-id', '');
    $('#modalDownloadL8 .overview').html('<span><i class="fa fa-spinner fa-spin"></i></span>');
});

$('#modalDownloadS2').on('shown.bs.modal', function () {
    "use strict";
    $("#modalDownloadS2 .dwn-bands").focus();
    $("#modalDownloadS2 .dropdown-menu li a").each(function () {
        $(this).removeClass('on');
    });
    $("#modalDownloadS2 .dropdown-menu li a").first().addClass("on");
    $("#modalDownloadS2 .dropdown .btn:first-child").html($("#modalDownloadS2 .dropdown-menu li a").first().text() + ' <span class="caret"></span>');
});

$('#modalDownloadS2').on('hidden.bs.modal', function () {
    "use strict";
    $("#modalPreview").focus();
    $('#modalDownloadS2 .dwn-bands').empty();
    $('#modalDownloadS2 .overview').attr('data-id', '');
    $('#modalDownloadS2 .overview').html('<span><i class="fa fa-spinner fa-spin"></i></span>');
});

$(function () {
    "use strict";

    $("#modalDownloadS2 .dropdown-menu li a").click(function () {
        $('#modalDownloadS2 .overview').html('<span><i class="fa fa-spinner fa-spin"></i></span>');
        $("#modalDownloadS2 .dropdown .btn:first-child").html($(this).text() + ' <span class="caret"></span>');

        var req = {
            path: $('#modalDownloadS2 .overview').attr("data-id"),
            bands: $(this).parent().attr("data-bands")
        };

        if (req.bands === "[4,3,2]") {
            var preview = $('#modalDownloadS2 .overview').attr("data-prev");
            $('#modalDownloadS2 .overview').html('<img src="' + preview + '">');
        } else {
            $.post("{{ RPIX_API }}/sentinel2_ovr", JSON.stringify({info: req}))
                .done(function (data) {
                    if (!(data.hasOwnProperty('errorMessage'))) {
                        $('#modalDownloadS2 .overview').html('<img src="data:image/png;base64,' + data.data + '">');
                    } else {
                        $('#modalDownloadS2 .overview').html('<span>Preview Unavailable</span>');
                    }
                })
                .fail(function () {
                    $('#modalDownloadS2 .overview').html('<span>Preview Unavailable</span>');
                });
        }

        $("#modalDownloadS2 .dropdown-menu li a").each(function () {
            $(this).removeClass('on');
        });
        $(this).addClass('on');
    });
});

$(function () {
    "use strict";

    $("#modalDownloadL8 .dropdown-menu li a").click(function () {

        $("#modalDownloadL8 .btn-download").removeClass("processing");
        $("#modalDownloadL8 .btn-download").removeClass("error");
        $("#modalDownloadL8 .btn-download").removeClass("ready");
        $("#modalDownloadL8 .btn-download span").text('Download');
        $("#modalDownloadL8 .btn-download a").attr('href', '');

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

        $("#modalDownloadL8 .dropdown-menu li a").each(function () {
            $(this).removeClass('on');
        });
        $(this).addClass('on');

    });
});

function landsatdownload() {
    "use strict";

    $("#modalDownloadL8 button.btn-download").addClass("processing");

    var req = {
        scene: $('#modalDownloadL8 .overview').attr("data-id"),
        bands: $("#modalDownloadL8 .dropdown-menu li .on").parent().attr("data-bands")
    };

    $.post("{{ RPIX_API }}/landsat/toa", JSON.stringify(req))
        .done(function (data) {
            if (!(data.hasOwnProperty('errorMessage'))) {
                $("#modalDownloadL8 button.btn-download").removeClass("processing");
                $("#modalDownloadL8 button.btn-download").addClass("ready");
                $("#modalDownloadL8 a.btn-download").attr('href', data.path);
            } else {
                $("#modalDownloadL8 button.btn-download").removeClass("processing");
                $("#modalDownloadL8 button.btn-download").addClass("error");
                $("#modalDownloadL8 button.btn-download span").text('Error');
            }
        })
        .fail(function (error, data) {
            $("#modalDownloadL8 button.btn-download").removeClass("processing");
            $("#modalDownloadL8 button.btn-download").addClass("error");
            $("#modalDownloadL8 button.btn-download span").text('Error');
        });
}

function showSiteInfo() {
    'use strict';
    $('.site-info').toggleClass('in');
    window.dispatchEvent(new Event('resize'));
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

//From Libra by developmentseed (https://github.com/developmentseed/libra)
function mod(number, dividend) {
    return ((number % dividend) + dividend) % dividend;
};

function sortScenes(a, b) {
    'use strict';
    return Date.parse(b.date) - Date.parse(a.date);
}

////////////////////////////////////////////////////////////////////////////////
function buildQueryAndRequestS2(latlong) {
    'use strict';

    $('.list-img').scrollTop(0);
    $('.list-img').empty();

    var lat = latlong.lat,
        lon = mod(latlong.lng + 180, 360) - 180,
        results = {};

    var jsonObj = {
            intersects: {"type": "Feature", "properties": {}, "geometry": {"coordinates": [lon, lat], "type": "Point"}},
            satellite_name: "sentinel",
            limit: 2000
        };

    $.ajax ({
        url: sat_api,
        type: "POST",
        data: JSON.stringify(jsonObj),
        dataType: "json",
        contentType: "application/json",
    })
    .success(function(data){
        if (data.meta.found !== 0) {
            var i,
                scene = {};

            for (i = 0; i < data.results.length; i += 1) {
                scene = {};
                scene.date = data.results[i].date;
                scene.cloud = data.results[i].cloud_coverage;
                scene.utm_zone = data.results[i].utm_zone.toString();
                scene.grid_square = data.results[i].grid_square;
                scene.latitude_band = data.results[i].latitude_band;
                scene.sceneID = data.results[i].scene_id;
                scene.browseURL = data.results[i].thumbnail.replace('.jp2', ".jpg");
                scene.path = data.results[i].aws_path.replace('tiles', "#tiles");
                scene.AWSurl = 'http://sentinel-s2-l1c.s3-website.eu-central-1.amazonaws.com/' + scene.path + '/';
                scene.grid = scene.utm_zone + scene.latitude_band + scene.grid_square;

                if (results.hasOwnProperty(scene.grid)) {
                    results[scene.grid].push(scene);
                } else {
                    results[scene.grid] = [];
                    results[scene.grid].push(scene);
                }
            }

            var grid = Object.keys(results),
                i;

            for (i = 0; i < grid.length; i += 1) {
                results[grid[i]].sort(sortScenes);

                var latest = results[grid[i]][0],
                    hoverstr = "['in', 'Name', '" + latest.grid + "']",
                    nohoverstr = "['in', 'Name', '']";

                $('.list-img').append(
                    '<div id ="' +  latest.grid + '" onclick="feedPreviewS2(this)" class="list-element">' +
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
        } else {
            $('.list-img').append('<span class="nodata-error">No image found</span>');
        }
    })
    .always(function () {
        $('.spin').addClass('display-none');
    })
    .fail(function () {
        $('.list-img').append('<span class="serv-error">Server Error: Please contact <a href="mailto:contact@remotepixel.ca">contact@remotepixel.ca</a></span>');
    });

}

////////////////////////////////////////////////////////////////////////////////
function buildQueryAndRequestL8(latlong) {
    'use strict';

    $('.list-img').scrollTop(0);
    $('.list-img').empty();

    var lat = latlong.lat,
        lon = mod(latlong.lng + 180, 360) - 180,
        results = {};

    var jsonObj = {
            intersects: {"type": "Feature", "properties": {}, "geometry": {"coordinates": [lon, lat], "type": "Point"}},
            satellite_name: "landsat",
            limit: 2000
        };

    $.ajax ({
        url: sat_api,
        type: "POST",
        data: JSON.stringify(jsonObj),
        dataType: "json",
        contentType: "application/json",
    })
    .success(function(data){
        if (data.meta.found !== 0) {
            var i,
                scene = {};

            for (i = 0; i < data.results.length; i += 1) {
                scene = {};
                scene.path = data.results[i].path.toString();
                scene.row = data.results[i].row.toString();
                scene.grid = data.results[i].path + '/' + data.results[i].row;
                scene.date = data.results[i].date;
                scene.cloud = data.results[i].cloud_coverage;
                scene.browseURL = data.results[i].browseURL;
                scene.usgsURL = data.results[i].cartURL;
                scene.sceneID = data.results[i].scene_id;
                scene.AWSurl = 'http://landsat-pds.s3.amazonaws.com/L8/' + zeroPad(data.results[i].path, 3) + '/' + zeroPad(data.results[i].row, 3) + '/' + data.results[i].sceneID + '/';
                scene.sumAWSurl = 'https://landsatonaws.com/L8/' + zeroPad(data.results[i].path, 3) + '/' + zeroPad(data.results[i].row, 3) + '/' + data.results[i].sceneID;

                if (results.hasOwnProperty(scene.grid)) {
                    results[scene.grid].push(scene);
                } else {
                    results[scene.grid] = [];
                    results[scene.grid].push(scene);
                }
            }

            var grid = Object.keys(results),
                i;
            for (i = 0; i < grid.length; i += 1) {
                results[grid[i]].sort(sortScenes);

                var latest = results[grid[i]][0],
                    hoverstr = "['all', ['==', 'PATH', " + latest.path + "], ['==', 'ROW', " + latest.row + "]]",
                    nohoverstr = "['all', ['==', 'PATH', ''], ['==', 'ROW', '']]";

                $('.list-img').append(
                    '<div id ="' +  latest.grid + '" onclick="feedPreviewL8(this)" class="list-element">' +
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
        } else {
            $('.list-img').append('<span class="nodata-error">No image found</span>');
        }
    })
    .always(function () {
        $('.spin').addClass('display-none');
    })
    .fail(function () {
        $('.list-img').append('<span class="serv-error">Server Error: Please contact <a href="mailto:contact@remotepixel.ca">contact@remotepixel.ca</a></span>');
    });
}

////////////////////////////////////////////////////////////////////////////////
function feedPreviewS2(elem) {
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
                    '<div class="btnDD" onclick="feeddownloadS2(\'' + res[i].path.replace('#tiles', "tiles") + '\',\'' + res[i].browseURL + '\')"><i class="fa fa-download"></i></div>' +
                    '<a target="_blank" href="' + res[i].AWSurl + '"><img src="/img/aws.png"> </a>' +
                '</div>' +
                '</div>'
        );
    }
    $('#modalPreview').modal();
}

function feeddownloadS2(elem, preview) {
    "use strict";

    var s2prefix = "http://sentinel-s2-l1c.s3.amazonaws.com/";

    $('#modalDownloadS2 .overview').attr('data-id', elem);
    $('#modalDownloadS2 .overview').attr('data-prev', preview);

    $('#modalDownloadS2 .dwn-bands').append(
        '<span>Direct Download S2 band (Right Click on link)</span>' +
            '<a id="b1" target="_blank" href="' + s2prefix + elem + '/B01.jp2" download>B1 - Coastal (60m)</a>' +
            '<a id="b2" target="_blank" href="' + s2prefix + elem + '/B02.jp2" download>B2 - Blue (10m)</a>' +
            '<a id="b3" target="_blank" href="' + s2prefix + elem + '/B03.jp2" download>B3 - Green (10m)</a>' +
            '<a id="b4" target="_blank" href="' + s2prefix + elem + '/B04.jp2" download>B4 - Red (10m)</a>' +
            '<a id="b5" target="_blank" href="' + s2prefix + elem + '/B05.jp2" download>B5 - Vegetation Classif 1 (20m)</a>' +
            '<a id="b6" target="_blank" href="' + s2prefix + elem + '/B06.jp2" download>B6 - Vegetation Classif 2 (20m)</a>' +
            '<a id="b7" target="_blank" href="' + s2prefix + elem + '/B07.jp2" download>B7 - Vegetation Classif 3 (20m)</a>' +
            '<a id="b8" target="_blank" href="' + s2prefix + elem + '/B08.jp2" download>B8 - Near Infrared (10m)</a>' +
            '<a id="b9" target="_blank" href="' + s2prefix + elem + '/B09.jp2" download>B9 - Water vapour (60m)</a>' +
            '<a id="b10" target="_blank" href="' + s2prefix + elem + '/B10.jp2" download>B10 - Cirrus (60m)</a>' +
            '<a id="b11" target="_blank" href="' + s2prefix + elem + '/B11.jp2" download>B11 - Thermal Infrared 1 (20m)</a>' +
            '<a id="b12" target="_blank" href="' + s2prefix + elem + '/B12.jp2" download>B12 - Thermal Infrared 2 (20m)</a>' +
            '<a id="mtl" target="_blank" href="' + s2prefix + elem + '/productInfo.json" download>Metadata</a>'
    );

    $('#modalDownloadS2 .overview').html('<img src="' + preview + '">');

    $('#modalDownloadS2').modal();
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
                    // '<a target="_blank" href="' + res[i].AWSurl + 'index.html"><img src="/img/aws.png"> </a>' +
                    '<a target="_blank" href="' + res[i].sumAWSurl + '"><img src="/img/aws.png"> </a>' +
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
function changeStyle() {
    "use strict";
    if (document.getElementById("sat-checkbox").checked) {
        map.removeLayer(landsatMap);
        map.addLayer(sentinelMap);
    } else {
        map.removeLayer(sentinelMap);
        map.addLayer(landsatMap);
    }
}

$("#sat-checkbox").change(function () {
    "use strict";
    $('.list-img').scrollTop(0);
    $('.list-img').empty();
    $('.list-img').append('<span class="nodata-error">Click on Tile</span>');

    $(".loading-map").removeClass('off');
    if (this.checked) {
        $("#sat-checkbox").parent().addClass('slider-white');
    } else {
        $("#sat-checkbox").parent().removeClass('slider-white');
    }
    changeStyle();
});

L.mapbox.accessToken = '{MAPBOX TOKEN}';
var map = L.mapbox.map('map', undefined, {attributionControl: false})
    .setView([40,-70.50], 3);

var landsatMap = L.mapbox.styleLayer('mapbox://styles/vincentsarago/cin0walc0005cahnmimk2c3vy'),
    sentinelMap   = L.mapbox.styleLayer('mapbox://styles/vincentsarago/ciowlfm34000gcmm54f3eb3ai');

landsatMap.on('load', function() {
    $(".loading-map").addClass('off');
});

sentinelMap.on('load', function() {
    $(".loading-map").addClass('off');
});

map.addLayer(landsatMap);

var ctrl = document.getElementsByClassName("leaflet-bottom leaflet-right")[0],
    attr = document.createElement('div');
attr.className = 'leaflet-control-attribution leaflet-control';
ctrl.appendChild(attr);

$(".leaflet-control-attribution").append('<a href="https://remotepixel.ca" target="_blank">&copy; RemotePixel.ca</a>');
$(".leaflet-control-attribution").append('<a href="https://www.mapbox.com/about/maps/" target="_blank"> © Mapbox</a>');
$(".leaflet-control-attribution").append('<a href="http://www.openstreetmap.org/about/" target="_blank"> © OpenStreetMap</a>');
$(".leaflet-control-attribution").append('<a href="https://www.digitalglobe.com/" target="_blank"> © DigitalGlobe</a></div>');

map.on('click', function (e) {
    "use strict";
    scope.results = {};

    $('.spin').removeClass('display-none');
    if (document.getElementById("sat-checkbox").checked) {
        buildQueryAndRequestS2(e.latlng);
    } else {
        buildQueryAndRequestL8(e.latlng);
    }
});

$(document).ready(function () {
    'use strict';
    $("#twitter").attr('href',
            'https://twitter.com/share?url=' + encodeURIComponent(window.location.href) +
            '&via=RemotePixel' +
            '&text=Satellite Search');

    $("#linkedin").attr('href',
            'https://www.linkedin.com/shareArticle?mini=true&url=' + encodeURIComponent(window.location.href) +
            '&title=Satellite Search' +
            '&source=https://remotepixel.ca');

    $("#facebook").attr('href',
            'https://www.facebook.com/sharer/sharer.php?u=' + encodeURIComponent(window.location.href));

    $("#modalGL").modal();
});
