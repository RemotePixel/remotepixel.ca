/*jslint browser: true*/
/*global $, jQuery, alert*/
/*global mapboxgl, mapboxgl, alert*/
/*global moment, moment, alert*/
/*global console, console, alert*/

////////////////////////////////////////////////////////////////////////
//function

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
        'MODIS_Aqua_Land_Surface_Temp_Night': 'Aqua Surface T° (Night)'
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

    var keys = getUrlVars();
    if (keys.hasOwnProperty('latlngZ')) {
        if (keys.hasOwnProperty('angle')) {
            var angle = keys.angle;
        } else {
            var angle = 0;
        }
        before.easeTo({center:[eval(keys.latlngZ)[1], eval(keys.latlngZ)[0]], zoom:eval(keys.latlngZ)[2], bearing: angle});
    }

    if (keys.hasOwnProperty('leftmap')) scope.left_data = keys.leftmap;
    if (keys.hasOwnProperty('rightmap')) scope.right_data = keys.rightmap;
    if (keys.hasOwnProperty('leftdate')) scope.left_date = keys.leftdate;
    if (keys.hasOwnProperty('rightdate')) scope.right_date = keys.rightdate;

    changeOverlay('left', scope.left_data);
    changeOverlay('right', scope.right_data);
    $(".mapboxgl-compare .compare-left-text").text(scope.left_date);
    $(".mapboxgl-compare .compare-right-text").text(scope.right_date);
    $(".handle_spin").addClass('opa');
});
