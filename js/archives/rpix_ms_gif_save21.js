/*jslint browser: true*/
/*global $, jQuery, alert*/
/*global mapboxgl, mapboxgl, alert*/
/*global moment, moment, alert*/
/*global console, console, alert*/

////////////////////////////////////////////////////////////////////////
//function

var scope = {
        overlay: 'VIIRS_SNPP_CorrectedReflectance_TrueColor',
        selected_img: []
    },
    map = new mapboxgl.Map({
        container: 'map',
        center: [0, 0],
        attributionControl: true,
        zoom: 1,
        minZoom: 0,
        maxZoom: 8
    }),
    mapstatic = new mapboxgl.Map({
        container: 'mapstatic',
        center: [0, 0],
        interactive: false,
        // preserveDrawingBuffer: false,
        // attributionControl: false,
        zoom: 1,
        minZoom: 0,
        maxZoom: 8
    });

map.addControl(new mapboxgl.Navigation());

$(".tab-selector-2").change(function () {
    "use strict";
    mapstatic.fitBounds(map.getBounds(), {linear:false, bearing:map.getBearing()});
});

////////////////////////////////////////////////////////////////////////////////
$("#coastline-checkbox").change(function () {
    "use strict";
    if (this.checked) {
        $("#coastline-checkbox").parent().addClass('slider-white');
    } else {
        $("#coastline-checkbox").parent().removeClass('slider-white');
    }

    changeOverlay(
        map,
        'VIIRS_SNPP_CorrectedReflectance_TrueColor',
        moment.utc().subtract(1, 'days').format('YYYY-MM-DD')
    );
    changeOverlay(
        mapstatic,
        'VIIRS_SNPP_CorrectedReflectance_TrueColor',
        moment.utc().subtract(1, 'days').format('YYYY-MM-DD')
    );
});

$("#place-checkbox").change(function () {
    "use strict";
    if (this.checked) {
        $("#place-checkbox").parent().addClass('slider-white');
    } else {
        $("#place-checkbox").parent().removeClass('slider-white');
    }
    changeOverlay(
        map,
        'VIIRS_SNPP_CorrectedReflectance_TrueColor',
        moment.utc().subtract(1, 'days').format('YYYY-MM-DD')
    );
    changeOverlay(
        mapstatic,
        'VIIRS_SNPP_CorrectedReflectance_TrueColor',
        moment.utc().subtract(1, 'days').format('YYYY-MM-DD')
    );
});

////////////////////////////////////////////////////////////////////////////////

////////////////////////////////////////////////////////////////////////////////

$('#modalShare').on('show.bs.modal', function () {
    'use strict';
    var share_url = "https://remotepixel.ca/projects/viirsmodis_compare.html?";
            // + "leftmap=" + scope.left_data
            // + "&rightmap=" + scope.right_data
            // + "&leftdate=" + scope.left_date
            // + "&rightdate=" + scope.right_date
            // + "&latlngZ=[" + before.getCenter().lat + "," + before.getCenter().lng + "," + before.getZoom() + "]"
            // + "&angle=" + before.getBearing();

    $("#twitter").attr('href',
            'https://twitter.com/share?url=' + encodeURIComponent(share_url) +
            '&via=RemotePixel' +
            '&hashtags=MODIS' +
            '&related=NASAEarthData' +
            '&text=MODIS-SUOMI map comparison');

    $("#linkedin").attr('href',
            'https://www.linkedin.com/shareArticle?mini=true&url=' + encodeURIComponent(share_url) +
            '&title=MODIS-SUOMI map comparison' +
            '&source=https://remotepixel.ca');

    $("#facebook").attr('href',
            'https://www.facebook.com/sharer/sharer.php?u=' + encodeURIComponent(share_url));
});

function mapResize() {
    "use strict";
    var w,
        l_margin,
        t_margin = $(".map").height() / -2,
        r = ($(".map-area").height() - 100) / $(".map").height();
        w = $(".map-area").width();

    if (r >= 1) r = 1

    if ($(".map").width() *  r > w - 50) {
        r = (w - 50) / $(".map").width();
        if (r >= 1) r = 1
    }

    l_margin = $(".map").width() / -2;

    $(".map").css({ transform: "scale(" + r + ")", margin: t_margin + "px 0 0 " + l_margin + "px" });
}

window.onresize = function () {
    "use strict";
    mapResize();
};

function reset() {
    $('.list-img').empty();
    scope.selected_img = [];
    $(".tab-selector-3").attr('disabled', 'disabled');
}

// MAP SIZE
function setSize(sz) {
    "use strict";
    ["#s-size", "#m-size", "#l-size"].forEach(function (value) { $(value).removeClass('on'); });
    ["s", "l", "m"].forEach(function (value) { $(".map").removeClass(value); });

    switch (sz) {
    case 's':
        $("#s-size").addClass('on');
        $(".map").addClass('s');
        break;

    case 'm':
        $("#m-size").addClass('on');
        $(".map").addClass('m');
        break;

    case 'l':
        $("#l-size").addClass('on');
        $(".map").addClass('l');
        break;

    case null:
        break;
    }

    // scope.style.size = sz;
    window.dispatchEvent(new Event('resize'));
    mapResize();
}

function getStyle(date, layer) {
    'use strict';
    var basemaps_url = "https://map1.vis.earthdata.nasa.gov/wmts-webmerc/" + layer + "/default/" + date + "/GoogleMapsCompatible_Level9/{z}/{y}/{x}.jpg",
        style = {
            "version": 8,
            "sources": {
                "gibs-tiles": {
                    "type": "raster",
                    "tiles": [
                        basemaps_url
                    ],
                    "attribution" : [
                        '<a href="https://remotepixel.ca">&copy; RemotePixel.ca</a> ',
                        ' <a href="http://mapbox.com">Mapbox</a> ',
                        ' <a href="http://openstreetmap.com">OpenStreetMap</a> ',
                        ' <a href="https://earthdata.nasa.gov/about/science-system-description/eosdis-components/global-imagery-browse-services-gibs" >NASA EOSDIS GIBS</a>'
                    ],
                    "tileSize": 256
                }
            },
            "layers": [
                {"id": "gibs-tiles",
                "type": "raster",
                "source": 'gibs-tiles',
                "minZoom": 1,
                "maxZoom": 8}
            ]
        };
        if (document.getElementById("coastline-checkbox").checked) {
            style.sources["coast"] = {
                "type": "raster",
                "tiles": [
                    "https://map1.vis.earthdata.nasa.gov/wmts-webmerc/Reference_Features/default/0/GoogleMapsCompatible_Level9/{z}/{y}/{x}.png",
                ],
                "tileSize": 256
            };
            style.layers.push({
                "id": "coast",
                "type": "raster",
                "source": 'coast',
                "minZoom": 1,
                "maxZoom": 8
            });
        }
        if (document.getElementById("place-checkbox").checked) {
            style.sources["places"] = {
                "type": "raster",
                "tiles": [
                    "https://map1.vis.earthdata.nasa.gov/wmts-webmerc/Reference_Labels/default/0/GoogleMapsCompatible_Level9/{z}/{y}/{x}.png",
                ],
                "tileSize": 256
            };
            style.layers.push({
                "id": "places",
                "type": "raster",
                "source": 'places',
                "minZoom": 1,
                "maxZoom": 8
            });
        }
    return style;
}

function changeOverlay(mapid, lyr_name, date) {
    "use strict";
    mapid.setStyle(getStyle(date, lyr_name));
}

function updateOverlay(lyr_name) {
    "use strict";
    scope.overlay = lyr_name;
    var selecteddate = moment($(".date-button").datepicker('getUTCDate')).format('YYYY-MM-DD');
    mapstatic.setStyle(getStyle(selecteddate, lyr_name));
}

function showImg(elem) {
    scope.overlay = elem.getAttribute("data-layer");
    $(".date-button").datepicker('setDate', elem.getAttribute("data-date"));
}

function removeImg(elem) {
    $(elem).parent().remove();

    if ($('.list-img').children().length > 1) {
        $(".tab-selector-3").prop('disabled', false);
    } else {
        $(".tab-selector-3").attr('disabled', 'disabled');
    }
}

function addImgToList(){
    var selecteddate = moment($(".date-button").datepicker('getUTCDate')).format('YYYY-MM-DD');

    switch (scope.overlay) {
    case 'VIIRS_SNPP_CorrectedReflectance_TrueColor':
        var sat = '<span class="sat left-block green">V</span>';
        break;
    case 'VIIRS_SNPP_CorrectedReflectance_BandsM11-I2-I1':
        var sat = '<span class="sat left-block blue">V</span>';
        break;
    case 'VIIRS_SNPP_CorrectedReflectance_BandsM3-I3-M11':
        var sat = '<span class="sat left-block orange">V</span>';
        break;
    case 'MODIS_Terra_CorrectedReflectance_TrueColor':
        var sat = '<span class="sat left-block green">T</span>';
        break;
    case 'MODIS_Terra_CorrectedReflectance_Bands721':
        var sat = '<span class="sat left-block blue">T</span>';
        break;
    case 'MODIS_Terra_CorrectedReflectance_Bands367':
        var sat = '<span class="sat left-block orange">T</span>';
        break;
    case 'MODIS_Aqua_CorrectedReflectance_TrueColor':
        var sat = '<span class="sat left-block green">A</span>';
        break;
    case 'MODIS_Aqua_CorrectedReflectance_Bands721':
        var sat = '<span class="sat left-block blue">A</span>';
        break;

    case null:
        break;
    }

    $('.list-img').append(
        '<div onclick="showImg(this)" class="list-element" data-date="'+ selecteddate +'" data-layer="'+ scope.overlay+'"> ' +
            sat +
            '<span class="center-block">'+ selecteddate + '</span>' +
            '<button onclick="removeImg(this)" class="rm-btn right-block"><i class="fa fa-trash-o"></i></button>' +
        '</div> ');

    // var simg = new Image();
    // var dataURL = mapstatic.getCanvas().toDataURL();
    // simg.id = 'simg';
    // simg.className = "img-responsive";
    // simg.src = dataURL;
    // window.open(dataURL,'_blank');
    // $('.list-img').append(simg);

    if ($('.list-img').children().length > 1) {
        $(".tab-selector-3").prop('disabled', false);
    } else {
        $(".tab-selector-3").attr('disabled', 'disabled');
    }

}

$(document).ready(function () {
    'use strict';

    changeOverlay(
        map,
        'VIIRS_SNPP_CorrectedReflectance_TrueColor',
        moment.utc().subtract(1, 'days').format('YYYY-MM-DD')
    );

    changeOverlay(
        mapstatic,
        'VIIRS_SNPP_CorrectedReflectance_TrueColor',
        moment.utc().subtract(1, 'days').format('YYYY-MM-DD')
    );

    $(".date-button").datepicker({
        format : 'yyyy-mm-dd',
        autoclose : true,
        todayHighlight : true,
        startDate : '2012-05-08',
        endDate : moment.utc().format('YYYY-MM-DD')
    }).on('changeDate', function (e) {
        var selectdate = moment(e.date).format('YYYY-MM-DD');
        $(".date-button").text(selectdate);

        if (moment(selectdate).isBefore('2015-11-24')) {
            var sat = scope.overlay.slice(0,5);
            if (sat == 'VIIRS'){
                scope.overlay = 'MODIS_Terra_CorrectedReflectance_TrueColor';
            }

            $(".dropdown-menu .viirs").addClass('not-active');

        } else {
            $(".dropdown-menu .viirs").removeClass('not-active');

        }
        changeOverlay(
            mapstatic,
            scope.overlay,
            selectdate
        );
    });
    $(".date-button").datepicker('setDate', moment.utc().subtract(1, 'days').format('YYYY-MM-DD'));

    // $('#modalAbout').modal();
    mapResize();
});
