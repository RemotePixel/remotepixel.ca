/*jslint browser: true*/
/*global $, jQuery, alert*/
/*global mapboxgl, mapboxgl, alert*/
/*global moment, moment, alert*/
/*global console, console, alert*/

////////////////////////////////////////////////////////////////////////
//function

$('#modalGL').on('shown.bs.modal', function () {
    "use strict";
    setTimeout(function(){
        window.location = "https://remotepixel.ca/projects/viirsmodis_compare-nogl.html";
    }, 3000);
});

$('#modalOverlay').on('show.bs.modal', function () {
    'use strict';
    $('#BasemapsCtrl-left').addClass('on');
    $('#BasemapsCtrl-right').addClass('on');
});

$('#modalOverlay').on('hide.bs.modal', function () {
    'use strict';
    $("#BasemapsCtrl-left [class^='side-view-content']").scrollTop(0);
    $('#BasemapsCtrl-left').removeClass('on');
    $("#BasemapsCtrl-right [class^='side-view-content']").scrollTop(0);
    $('#BasemapsCtrl-right').removeClass('on');
});

$('#modalShare').on('show.bs.modal', function () {
    'use strict';
    var share_url = "https://remotepixel.ca/projects/viirsmodis_compare.html?"
            + "leftmap=" + scope.left_data
            + "&rightmap=" + scope.right_data
            + "&leftdate=" + scope.left_date
            + "&rightdate=" + scope.right_date
            + "&latlngZ=[" + before.getCenter().lat + "," + before.getCenter().lng + "," + before.getZoom() + "]"
            + "&angle=" + before.getBearing();

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

    var share_url = "https://remotepixel.ca/projects/viirsmodis_compare_emb.html?"
        + "leftmap=" + scope.left_data
        + "&rightmap=" + scope.right_data
        + "&leftdate=" + scope.left_date
        + "&rightdate=" + scope.right_date
        + "&latlngZ=[" + before.getCenter().lat + "," + before.getCenter().lng + "," + before.getZoom() + "]"
        + "&angle=" + before.getBearing(),
        url = '&lt;iframe frameborder="0" width="100%" height="360" src="' + share_url + '"&gt&lt;/iframe&gt';

    $("#modalEmbedded .code2copy code").html(url);
});


///////////////////////////////////////////////////////////////////////////////
if (!mapboxgl.supported()) {
    $("#modalGL").modal();
} else {

    var scope = {
        left_date : moment.utc().subtract(1, 'days').format('YYYY-MM-DD'),
        right_date: moment.utc().subtract(1, 'days').format('YYYY-MM-DD'),
        left_data: 'VIIRS_SNPP_CorrectedReflectance_TrueColor',
        right_data: 'MODIS_Terra_CorrectedReflectance_TrueColor'
    },
        descr_basemap = {
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
        before = new mapboxgl.Map({
            container: 'before',
            center: [0, 0],
            attributionControl: true,
            zoom: 1,
            minZoom: 0,
            maxZoom: 8
        }),
        after = new mapboxgl.Map({
            container: 'after',
            center: [0, 0],
            attributionControl: true,
            zoom: 1,
            minZoom: 0,
            maxZoom: 8
        });

    after.addControl(new mapboxgl.Navigation());
    before.addControl(new mapboxgl.Navigation());
    var mbc = new mapboxgl.Compare(before, after);

    //Compare Style
    var compare = document.getElementsByClassName("mapboxgl-compare")[0]
    var ltext = document.createElement('span');
    ltext.id = 'compare-left-text';
    ltext.className = 'compare-left-text';
    compare.appendChild(ltext);

    var rtext = document.createElement('span');
    rtext.id = 'compare-right-text';
    rtext.className = 'compare-right-text';
    compare.appendChild(rtext);

    //Add Custom buttons
    var btnsettings = document.createElement('button');
    btnsettings.className = 'mapboxgl-ctrl-icon';
    btnsettings.setAttribute("data-toggle", "modal");
    btnsettings.setAttribute("data-target", "#modalOverlay");
    var icnsettings = document.createElement('i');
    icnsettings.className = 'fa fa-sliders';
    btnsettings.appendChild(icnsettings);

    var btnshare = document.createElement('button');
    btnshare.className = 'mapboxgl-ctrl-icon';
    btnshare.setAttribute("data-toggle", "modal");
    btnshare.setAttribute("data-target", "#modalShare");
    var icnshare = document.createElement('i');
    icnshare.className = 'fa fa-share';
    btnshare.appendChild(icnshare);

    var btninfo = document.createElement('button');
    btninfo.className = 'mapboxgl-ctrl-icon';
    btninfo.setAttribute("data-toggle", "modal");
    btninfo.setAttribute("data-target", "#modalAbout");
    var icninfo = document.createElement('i');
    icninfo.className = 'fa fa-info';
    btninfo.appendChild(icninfo);

    var grp = document.createElement('div');
    grp.className = 'mapboxgl-ctrl-group mapboxgl-ctrl';
    grp.appendChild(btnsettings);
    grp.appendChild(btnshare);
    grp.appendChild(btninfo);

    var control = document.getElementsByClassName("mapboxgl-ctrl-top-right");
    for (var i = 0; i < control.length; ++i) {
      var item = control[i];
      item.appendChild(grp.cloneNode(true));
    }

    grp = null;

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
                    },
                    "coast": {
                        "type": "raster",
                        "tiles": [
                            "https://map1.vis.earthdata.nasa.gov/wmts-webmerc/Reference_Features/default/0/GoogleMapsCompatible_Level9/{z}/{y}/{x}.png",
                        ],
                        "tileSize": 256
                    },
                    "places": {
                        "type": "raster",
                        "tiles": [
                            "https://map1.vis.earthdata.nasa.gov/wmts-webmerc/Reference_Labels/default/0/GoogleMapsCompatible_Level9/{z}/{y}/{x}.png"
                        ],
                        "tileSize": 256
                    }
                },
                "layers": [
                    {"id": "gibs-tiles",
                    "type": "raster",
                    "source": 'gibs-tiles',
                    "minZoom": 1,
                    "maxZoom": 8},
                    {"id": "coast",
                        "type": "raster",
                        "source": 'coast',
                        "minZoom": 1,
                        "maxZoom": 8},
                    {"id": "places",
                        "type": "raster",
                        "source": 'places',
                        "minZoom": 1,
                        "maxZoom": 8},
                ]
            };
        return style;
    }

    function changeOverlay(side, lyr_name) {
        "use strict";
        $("#BasemapsCtrl-" + side + " .side-view-content .side-element .link-on").each(function (index, element) {
            $(element).removeClass('on');
        });
        $("#BasemapsCtrl-" + side + " #" + lyr_name + " .link-on").addClass('on');

        if (side === 'left') {
            scope.left_data = lyr_name;
            $("#left-id").text("Left: " + descr_basemap[scope.left_data]);
            before.setStyle(getStyle(scope.left_date, scope.left_data));
        } else {
            scope.right_data = lyr_name;
            $("#right-id").text("Right: " + descr_basemap[scope.right_data]);
            after.setStyle(getStyle(scope.right_date, scope.right_data));
        }
    }

    function getUrlVars() {
        "use strict";
        var vars = {},
            parts = window.location.href.replace(/[?&]+([^=&]+)=([^&]*)/gi, function(m,key,value) {
                vars[key] = value;
            });
        return vars;
    }

    $(document).ready(function () {
        'use strict';

        $(".mapboxgl-compare .compare-left-text").datepicker({
            format : 'yyyy-mm-dd',
            autoclose: true,
            todayHighlight: true,
            startDate : '2012-05-08',
            endDate : moment.utc().format('YYYY-MM-DD')
        }).on('changeDate', function (e) {
            scope.left_date = moment(e.date).format('YYYY-MM-DD');
            $(".mapboxgl-compare .compare-left-text").text(scope.left_date);

            if (moment(scope.left_date).isBefore('2015-11-24')) {
                var sat = scope.left_data.slice(0, 5);
                if (sat === 'VIIRS') {
                    scope.left_data = 'MODIS_Terra_CorrectedReflectance_TrueColor';
                }
            }
            changeOverlay('left', scope.left_data);
        });

        $(".mapboxgl-compare .compare-right-text").datepicker({
            format : 'yyyy-mm-dd',
            autoclose: true,
            todayHighlight: true,
            startDate : '2012-05-08',
            endDate : moment.utc().format('YYYY-MM-DD')
        }).on('changeDate', function (e) {
            scope.right_date = moment(e.date).format('YYYY-MM-DD');
            $(".mapboxgl-compare .compare-right-text").text(scope.right_date);

            if (moment(scope.right_date).isBefore('2015-11-24')) {
                var sat = scope.right_data.slice(0, 5);
                if (sat === 'VIIRS') {
                    scope.right_data = 'MODIS_Terra_CorrectedReflectance_TrueColor';
                }
            }
            changeOverlay('right', scope.right_data);
        });

        var keys = getUrlVars();

        if (keys.hasOwnProperty('leftmap')) scope.left_data = keys.leftmap;
        if (keys.hasOwnProperty('rightmap')) scope.right_data = keys.rightmap;
        if (keys.hasOwnProperty('leftdate')) scope.left_date = keys.leftdate;
        if (keys.hasOwnProperty('rightdate')) scope.right_date = keys.rightdate;

        $(".mapboxgl-compare .compare-left-text").datepicker('setDate', scope.left_date);
        $(".mapboxgl-compare .compare-right-text").datepicker('setDate', scope.right_date);

        if (keys.hasOwnProperty('latlngZ')) {
            if (keys.hasOwnProperty('angle')) {
                var angle = keys.angle;
            } else {
                var angle = 0;
            }
            before.easeTo({center:[eval(keys.latlngZ)[1], eval(keys.latlngZ)[0]], zoom:eval(keys.latlngZ)[2], bearing: angle});
        } else {
            $('#modalAbout').modal();
        }

    });
}
