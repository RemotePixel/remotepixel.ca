/*jslint browser: true*/
/*global $, jQuery, alert*/
/*global mapboxgl, mapboxgl, alert*/
/*global moment, moment, alert*/
/*global console, console, alert*/

////////////////////////////////////////////////////////////////////////
//function

var scope = {
        overlay: 'VIIRS_SNPP_CorrectedReflectance_TrueColor',
        date: '',
        uuid: '',
        size: 'm'
    },
    descr_basemap = {
        'VIIRS_SNPP_CorrectedReflectance_TrueColor' : 'VIIRS True Color',
        'VIIRS_SNPP_CorrectedReflectance_BandsM11-I2-I1' : 'VIIRS Bands M11-I2-I1',
        'VIIRS_SNPP_CorrectedReflectance_BandsM3-I3-M11' : 'VIIRS Bands M3-I3-I11',
        'MODIS_Terra_CorrectedReflectance_TrueColor': 'Terra True Color',
        'MODIS_Terra_CorrectedReflectance_Bands721': 'Terra Bands 7-2-1',
        'MODIS_Terra_CorrectedReflectance_Bands367': 'Terra Bands 3-6-7',
        'MODIS_Aqua_CorrectedReflectance_TrueColor': 'Aqua True Color',
        'MODIS_Aqua_CorrectedReflectance_Bands721': 'Aqua Bands 7-2-1'
    },
    map = new mapboxgl.Map({
        container: 'map',
        center: [0, 0],
        attributionControl: true,
        zoom: 1,
        minZoom: 0,
        maxZoom: 8
    });

map.addControl(new mapboxgl.Navigation({position : 'top-left'}));


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

////////////////////////////////////////////////////////////////////////////////

function mapResize() {
    "use strict";
    var t_margin = $(".map").height() / -2,
        r = ($(".map-area").height() - 100) / $(".map").height(),
        w = $(".map-area").width();

    if (r >= 1) r = 1

    if ($(".map").width() *  r > w - 50) {
        r = (w - 50) / $(".map").width();
        if (r >= 1) r = 1
    }

    var l_margin = $(".map").width() / -2;

    $(".map").css({ transform: "scale(" + r + ")", margin: t_margin + "px 0 0 " + l_margin + "px" });
}

window.onresize = function () {
    "use strict";
    mapResize();
};

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

    scope.size = sz;
    window.dispatchEvent(new Event('resize'));
    mapResize();
}

function getStyle(date, layer) {
    'use strict';

    $('.legend span').text('Basemap: ' + descr_basemap[layer])

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

function addDates(v) {

    reset();

    var d = moment.utc().subtract(1, 'days').format('YYYY-MM-DD'),
        newd = [scope.date];

    switch (v) {
    case '7':
        for (i = 1; i < 7; i++) {
            newd.push(moment.utc(scope.date).subtract(i, 'days').format('YYYY-MM-DD'));
        }
        break;

    case '15':
        for (i = 1; i < 15; i++) {
            newd.push(moment.utc(scope.date).subtract(i, 'days').format('YYYY-MM-DD'));
        }
        break;

    case '25':
        for (i = 1; i < 25; i++) {
            newd.push(moment.utc(scope.date).subtract(i, 'days').format('YYYY-MM-DD'));
        }
        break;

    case '1/6':
        for (i = 1; i < 6; i++) {
            newd.push(moment.utc(scope.date).subtract(i, 'months').format('YYYY-MM-DD'));
        }
        break;

    case '1/12':
        for (i = 1; i < 12; i++) {
            newd.push(moment.utc(scope.date).subtract(i, 'months').format('YYYY-MM-DD'));
        }
        break;

    case '1/24':
        for (i = 1; i < 24; i++) {
            newd.push(moment.utc(scope.date).subtract(i, 'months').format('YYYY-MM-DD'));
        }
        break;

    case null:
        break;
    }

    newd.forEach(function(e){
        scope.date = e;
        if (moment(scope.date).isBefore('2015-11-24')) {
            if (scope.overlay == 'VIIRS_SNPP_CorrectedReflectance_TrueColor'){
                scope.overlay = "MODIS_Terra_CorrectedReflectance_TrueColor";
            }
            if (scope.overlay == 'VIIRS_SNPP_CorrectedReflectance_BandsM11-I2-I1'){
                scope.overlay = "MODIS_Terra_CorrectedReflectance_Bands721";
            }
            if (scope.overlay == 'VIIRS_SNPP_CorrectedReflectance_BandsM3-I3-M11'){
                scope.overlay = "MODIS_Terra_CorrectedReflectance_Bands367";
            }
        }

        addImgToList();
    })
}

function changeOverlay(lyr_name, date) {
    "use strict";
    map.setStyle(getStyle(date, lyr_name));
}

function updateOverlay(lyr_name) {
    "use strict";
    scope.overlay = lyr_name;
    map.setStyle(getStyle(scope.date, lyr_name));
}

function back() {
    $( ".tab-selector-1" ).prop( "checked", true );
}
function reset() {
    $('.list-img').empty();
    scope.selected_img = [];
    $(".tab-selector-2").attr('disabled', 'disabled');
    $("#sort-btn").addClass("display-none");
    $("#reset-btn").addClass("display-none");
}

function sortImagesDown(a, b) {
    'use strict';
    return moment(b.getAttribute('data-date')) - moment(a.getAttribute('data-date'));
}

function sortImagesUp(a, b) {
    'use strict';
    return moment(a.getAttribute('data-date')) - moment(b.getAttribute('data-date'));
}

function sort() {
    var ims = $('.list-img').children();
    $('.list-img').empty();

    if ($("#sort-arrow").hasClass('fa-long-arrow-up')){
        $("#sort-arrow").removeClass('fa-long-arrow-up');
        $("#sort-arrow").addClass('fa-long-arrow-down');
        (ims).sort(sortImagesUp);
    }else{
        $("#sort-arrow").removeClass('fa-long-arrow-down');
        $("#sort-arrow").addClass('fa-long-arrow-up');
        (ims).sort(sortImagesDown);
    };
    $('.list-img').append(ims);
}

function showImg(elem) {
    var parent = elem.parentNode;
    scope.overlay = parent.getAttribute("data-layer");
    $(".date-button").datepicker('setDate', parent.getAttribute("data-date"));
}

function removeImg(elem) {
    $(elem).parent().remove();

    if ($('.list-img').children().length > 1) {
        $(".tab-selector-2").prop('disabled', false);
        $("#sort-btn").removeClass("display-none");
    } else {
        $(".tab-selector-2").attr('disabled', 'disabled');
        $("#sort-btn").addClass("display-none");
    }

    if ($('.list-img').children().length > 0) {
        $("#reset-btn").removeClass("display-none");

    } else {
        $("#reset-btn").addClass("display-none");
    }

}

function addImgToList(){

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
        '<div class="list-element" data-date="'+ scope.date +'" data-layer="'+ scope.overlay+'"> ' +
            sat +
            '<span class="center-block">'+ scope.date + '</span>' +
            '<button onclick="showImg(this)" class="rm-btn right-block"><i class="fa fa-eye"></i></button>' +
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
        $(".tab-selector-2").prop('disabled', false);
        $("#sort-btn").removeClass("display-none");
    } else {
        $(".tab-selector-2").attr('disabled', 'disabled');
        $("#sort-btn").addClass("display-none");
    }

    if ($('.list-img').children().length > 0) {
        $("#reset-btn").removeClass("display-none");
    } else {
        $("#reset-btn").addClass("display-none");
    }
}

////////////////////////////////////////////////////////////////////////////////
$("#coastline-checkbox").change(function () {
    "use strict";
    if (this.checked) {
        $("#coastline-checkbox").parent().addClass('slider-white');
    } else {
        $("#coastline-checkbox").parent().removeClass('slider-white');
    }

    changeOverlay(scope.overlay, scope.date);
});

$("#place-checkbox").change(function () {
    "use strict";
    if (this.checked) {
        $("#place-checkbox").parent().addClass('slider-white');
    } else {
        $("#place-checkbox").parent().removeClass('slider-white');
    }
    changeOverlay(scope.overlay, scope.date);
});

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
        $("#sendGIFrequest").removeClass('disabled');
    })
    .on('invalid.bs.validator', function () {
        'use strict';
        $("#sendGIFrequest").addClass('disabled');
    });

$('#sendGIFrequest').on('click', function (e) {
    'use strict';

    if (!$('#sendGIFrequest').hasClass('disabled')) {

        var bounds = map.getBounds(),
            aoi = bounds._sw.lng.toString() + "," +
                    bounds._sw.lat.toString() + "," +
                    bounds._ne.lng.toString() + "," +
                    bounds._ne.lat.toString();

        var req = {
            uuid: scope.uuid,
            size: scope.size,
            aoi : aoi,
            dates: [],
            overlays: [],
            mailto: $('#EmailRequest').val(),
            rot: map.getBearing(),
            places: document.getElementById("place-checkbox").checked.toString(),
            borders: document.getElementById("coastline-checkbox").checked.toString(),
        };

        var ims = document.getElementsByClassName('list-img')[0].children,
            i;
        for (i = 0; i <	ims.length; i++) {
            req.dates.push(ims[i].getAttribute('data-date'));
            req.overlays.push(ims[i].getAttribute('data-layer'));
        };

       var postReq = $.post("{{ RPIX_API }}/modisgif", JSON.stringify({info: req}))

        $('.form-rq').addClass("display-none");
        $('.form-rq-resp').removeClass("display-none");
        $(".form-rq").find('form')[0].reset();
    }
});

$(document).ready(function () {
    'use strict';

    $(".date-button").datepicker({
        format : 'yyyy-mm-dd',
        autoclose : true,
        todayHighlight : true,
        startDate : '2012-05-08',
        endDate : moment.utc().format('YYYY-MM-DD')
    }).on('changeDate', function (e) {
        scope.date = moment(e.date).format('YYYY-MM-DD');
        $(".date-button").text(scope.date);

        if (moment(scope.date).isBefore('2015-11-24')) {
            if (scope.overlay == 'VIIRS_SNPP_CorrectedReflectance_TrueColor'){
                scope.overlay = "MODIS_Terra_CorrectedReflectance_TrueColor";
            }
            if (scope.overlay == 'VIIRS_SNPP_CorrectedReflectance_BandsM11-I2-I1'){
                scope.overlay = "MODIS_Terra_CorrectedReflectance_Bands721";
            }
            if (scope.overlay == 'VIIRS_SNPP_CorrectedReflectance_BandsM3-I3-M11'){
                scope.overlay = "MODIS_Terra_CorrectedReflectance_Bands367";
            }
            $(".dropdown-menu .viirs").addClass('not-active');
        } else {
            $(".dropdown-menu .viirs").removeClass('not-active');
        }
        changeOverlay(scope.overlay, scope.date);
    });

    $(".date-button").datepicker('setDate', moment.utc().subtract(1, 'days').format('YYYY-MM-DD'));

    var share_url =  window.location.href;
    $("#twitter").attr('href',
            'https://twitter.com/share?url=' + encodeURIComponent(share_url) +
            '&via=RemotePixel' +
            '&hashtags=MODIS' +
            '&related=NASAEarthData' +
            '&text=MODIS-VIIRS GIF Creation');

    $("#linkedin").attr('href',
            'https://www.linkedin.com/shareArticle?mini=true&url=' + encodeURIComponent(share_url) +
            '&title=MODIS-VIIRS GIF Creation' +
            '&source=https://remotepixel.ca');

    $("#facebook").attr('href',
            'https://www.facebook.com/sharer/sharer.php?u=' + encodeURIComponent(share_url));


    //$('#modalAbout').modal();
    mapResize();
});
