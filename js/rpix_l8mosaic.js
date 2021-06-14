/*jslint browser: true*/
/*global $, jQuery, alert*/
/*global L, lealfet, alert*/
/*global moment, moment, alert*/
/*global console, console, alert*/

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

function sortNumber(a, b) {
    'use strict';
    return a - b;
}

function sortScenesDate(a, b) {
    'use strict';
    return Date.parse(b.acquisitionDate) - Date.parse(a.acquisitionDate);
}

function isInArray(array, search) {
    'use strict';
    return (array.indexOf(search) >= 0) ? true : false;
}

//from http://jsfiddle.net/briguy37/2MVFd/
function generateUUID() {
    var d = new Date().getTime();
    var uuid = 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
        var r = (d + Math.random()*16)%16 | 0;
        d = Math.floor(d/16);
        return (c=='x' ? r : (r&0x3|0x8)).toString(16);
    });
    return uuid;
};

////////////////////////////////////////////////////////////////////////
//Modals
$('#submit-request').validator()
    .on('valid.bs.validator', function () {
        'use strict';
        $("#sendMosaicrequest").removeClass('disabled');
    })
    .on('invalid.bs.validator', function () {
        'use strict';
        $("#sendMosaicrequest").addClass('disabled');
    });

$('#sendMosaicrequest').on('click', function (e) {
    'use strict';

    if (!$('#sendMosaicrequest').hasClass('disabled')) {

        var ids = [];
        imOverlayGr.eachLayer(function (layer) {
            ids.push(layer.options.id);
        });

        var req = {
            uuid: scope._uuid,
            bands: $("#band-combination input[name='combination']:checked").attr('data'),
            mailto : $('#EmailRequest').val(),
            image_list: '[' + ids   + ']'
        };

        var text = $.post("{{ RPIX_API }}/landsat/mosaic", JSON.stringify({info: req}));

        $('#myModal').modal('hide');
        $('#myModal').on('hidden.bs.modal', function(){
            $(this).find('form')[0].reset();
        });
        $('#titleAPI').text('Success');
        $('#modalAPI').modal();
    };
});

////////////////////////////////////////////////////////////////////////
//Filters
function initFilters(){
    'use strict';

    //Cloud Cover Slider
    $("#cloudCoverSlider").noUiSlider({
        start: [ 0, 20 ],
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
        values: [0, 25, 50, 75, 100],
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
        step: 1 * 24 * 60 * 60 * 1000, //one day
        format: wNumb({ decimals: 0 }),
        start: [timestamp(scope.filtervalues.datestart),timestamp(scope.filtervalues.dateend)]
    });

    var dateRange = Date.parse(scope.filtervalues.dateend) - Date.parse(scope.filtervalues.datestart),
        range = [Date.parse(scope.filtervalues.datestart) ,
        Date.parse(scope.filtervalues.datestart) + dateRange/4,
        Date.parse(scope.filtervalues.datestart) + 2*dateRange/4,
        Date.parse(scope.filtervalues.datestart) + 3*dateRange/4, Date.parse(scope.filtervalues.dateend)];

    $("#dateSlider").noUiSlider_pips({
        mode: 'values',
        values: range,
        density: 4,
        stepped: true
    });

    //From Libra by developmentseed (https://github.com/developmentseed/libra)
    $('#dateSlider > .noUi-pips > .noUi-value').each(
            function(){
                $(this).html(new Date(Number($(this).html())).toISOString().slice(0, 7))
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
            function(){
                var seas = ['spring', 'summer', 'autumn', 'winter'];
                $(this).html(seas[$(this).html()-1])
            }
    );

    $('#seasonSlider').on('set', updateSeason);

    $('#cloud-filter').html('<i class="fa fa-cloud fa-2x"><hbut> : ' + scope.filtervalues.cloudmin + '% - ' + scope.filtervalues.cloudmax + '%</hbut></i>');
    $('#date-filter').html('<i class="fa fa-calendar-o fa-2x"><hbut> : ' + scope.filtervalues.datestart + ' - ' + scope.filtervalues.dateend + '</hbut></i>');
};

function resetFilters(){
    'use strict';
    scope.filtervalues.cloudmin = 0;
    scope.filtervalues.cloudmax = 20;
    scope.filtervalues.datestart = new Date('2013-04-01').toISOString().slice(0, 10);
    scope.filtervalues.dateend = new Date().toISOString().slice(0, 10);
    scope.filtervalues.seasons = ['spring', 'summer', 'autumn', 'winter'];

    $("#cloudCoverSlider").val([scope.filtervalues.cloudmin, scope.filtervalues.cloudmax]);

    var dateRange = Date.parse(scope.filtervalues.dateend) - Date.parse(scope.filtervalues.datestart);
    $("#dateSlider").val([Date.parse(scope.filtervalues.datestart), Date.parse(scope.filtervalues.dateend)]);
    $("#seasonSlider").val([0, 4]);
    $('#cloud-filter').html('<i class="fa fa-cloud fa-2x"><hbut> : ' + scope.filtervalues.cloudmin + '% - ' + scope.filtervalues.cloudmax + '%</hbut></i>');
    $('#date-filter').html('<i class="fa fa-calendar-o fa-2x"><hbut> : ' + scope.filtervalues.datestart + ' - ' + scope.filtervalues.dateend + '</hbut></i>');
};

function setCloud(){
    'use strict';
    scope.filtervalues.cloudmin = parseInt($('#cloudCoverSlider').val()[0]);
    scope.filtervalues.cloudmax = parseInt($('#cloudCoverSlider').val()[1]);
    $('#cloud-filter').html('<i class="fa fa-cloud fa-2x"><hbut> : ' + scope.filtervalues.cloudmin + '% - ' + scope.filtervalues.cloudmax + '%</hbut></i>');
};

function updateCloud(){
    'use strict';
    scope.filtervalues.cloudmin = parseInt($('#cloudCoverSlider').val()[0]);
    scope.filtervalues.cloudmax = parseInt($('#cloudCoverSlider').val()[1]);
    $('#cloud-filter').html('<i class="fa fa-cloud fa-2x"><hbut> : ' + scope.filtervalues.cloudmin + '% - ' + scope.filtervalues.cloudmax + '%</hbut></i>');
    landsatQuery(scope.aoiBounds);
};

function setDate(){
    'use strict';
    scope.filtervalues.datestart = new Date(Number($('#dateSlider').val()[0])).toISOString().slice(0, 10);
    scope.filtervalues.dateend = new Date(Number($('#dateSlider').val()[1])).toISOString().slice(0, 10);
    $('#date-filter').html('<i class="fa fa-calendar-o fa-2x"><hbut> : ' + scope.filtervalues.datestart + ' - ' + scope.filtervalues.dateend + '</hbut></i>');
};

function updateDate(){
    'use strict';
    scope.filtervalues.datestart = new Date(Number($('#dateSlider').val()[0])).toISOString().slice(0, 10);
    scope.filtervalues.dateend = new Date(Number($('#dateSlider').val()[1])).toISOString().slice(0, 10);
    $('#date-filter').html('<i class="fa fa-calendar-o fa-2x"><hbut> : ' + scope.filtervalues.datestart + ' - ' + scope.filtervalues.dateend + '</hbut></i>');
    landsatQuery(scope.aoiBounds);
};

function updateSeason(){
    'use strict';
    var season = ['spring', 'summer', 'autumn', 'winter'];
    scope.filtervalues.seasons = season.slice( $('#seasonSlider').val()[0] , $('#seasonSlider').val()[1] );
    landsatQuery(scope.aoiBounds);
};

function toggleOpenFilter(filter){
    'use strict';
    switch (filter){
        case 'date':
            $("div.date-filter").toggleClass("display-none");
            $("div.cloud-filter").addClass("display-none");
            $("div.season-filter").addClass("display-none");
            break;
        case 'cloud':
            $("div.cloud-filter").toggleClass("display-none");
            $("div.date-filter").addClass("display-none");
            $("div.season-filter").addClass("display-none");
            break;
        case 'season':
            $("div.season-filter").toggleClass("display-none");
            $("div.cloud-filter").addClass("display-none");
            $("div.date-filter").addClass("display-none");
            break;
        case null:
            break;
    };
};

////////////////////////////////////////////////////////////////////////
//
function closeleftpane(){
    $("#left-pane").addClass("display-none");
    $('#landsat-wall').empty();
    $('#landsat-wall').scrollTop(0);
    map.invalidateSize();
};

function clearall(){
    imOverlayGr.clearLayers();
    $("#show-all").removeClass("display-none");
    $("#clear-all").addClass("display-none");
    $("#complete-all").addClass("display-none");

    $("#left-pane").addClass("display-none");
    $('#landsat-wall').empty();
    $('#landsat-wall').scrollTop(0);
    map.invalidateSize();
};

function imOverlayBuilt(scene){

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
            rp: scene.rowpath,
            info: {date: scene.date, cloud: scene.cloud},
            clip: clipCoords
    };

    return new L.ImageTransform(scene.browseURL, anchors, options); //https://github.com/ScanEx/Leaflet.imageTransform
}

function complete(){
    var rp = [];

    imOverlayGr.eachLayer(function (layer) {
        rp.push(layer.options.rp)
    });

    map.spin(true);

    var RowPathKey = Object.keys(footprintGr._layers);

    for (var i=0; i < RowPathKey.length; i++){
        var layers = footprintGr._layers[RowPathKey[i]];

        if (isInArray(rp, layers.id)) continue

        scope.allscenes = layers.scenes;
        scope.allscenes.sort(sortScenesDate);

        imOverlayGr.addLayer(imOverlayBuilt(scope.allscenes[0]));
    };

    imOverlayGr.eachLayer(function (layer) {
        layer._image.onclick = function () {
            if (map.dragging.moved()) return
            imChange(layer);
        }
    });

    $("#show-all").addClass("display-none");
    $("#clear-all").removeClass("display-none");
    map.spin(false);
}

function showall(){
    map.spin(true);

    imOverlayGr.clearLayers()

    var RowPathKey = Object.keys(footprintGr._layers);

    for (var i=0; i < RowPathKey.length; i++){
        var layers = footprintGr._layers[RowPathKey[i]];

        scope.allscenes = layers.scenes;
        scope.allscenes.sort(sortScenesDate);

        imOverlayGr.addLayer(imOverlayBuilt(scope.allscenes[0]));
    };

    imOverlayGr.eachLayer(function (layer) {
        layer._image.onclick = function () {
            if (map.dragging.moved()) return
            imChange(layer);
        }
    });

    $("#show-all").addClass("display-none");
    $("#clear-all").removeClass("display-none");
    map.spin(false);
};

function imgclick(input){

    imOverlayGr.eachLayer(function (layer) {
        if (layer.options.rp == scope.allscenes[input].rowpath) imOverlayGr.removeLayer(layer);
    });

    imOverlayGr.addLayer(imOverlayBuilt(scope.allscenes[input]));

    $("#complete-all").removeClass("display-none");

    imOverlayGr.eachLayer(function (layer) {
        layer._image.onclick = function () {
            if (map.dragging.moved()) return
            imChange(layer);
        }
    });

};

function imChange(im){
    imOverlayGr.removeLayer(im)

    $("#left-pane").removeClass("display-none");
    $('#landsat-wall').empty();
    $('#landsat-wall').scrollTop(0);

    map.invalidateSize();
    map.spin(true);

    var rp = im.options.rp;
    var lookup = {};
    footprintGr.eachLayer(function (layer) {
        lookup[layer.id] = layer;
    });

    scope.allscenes = lookup[rp].scenes;
    scope.allscenes.sort(sortScenesDate);
    browse = [];

    for (var i=0; i < scope.allscenes.length; i++){
        browse.push(
            '<div class="result-content">' +
                '<img id="' + scope.allscenes[i].sceneID +  '" ' +
                'class="img-thumb"' +
                'data-sizes="auto" src="' + scope.allscenes[i].browseURL + '" ' +
                'onclick="imgclick(' + i + ')">' +
                '<div class="result-overlay">' +
                    '<div>' +
                        '<i class="fa fa-calendar-o"></i>' +
                        '<span>  ' + scope.allscenes[i].acquisitionDate + '</span>' +
                    '</div>' +
                    '<div>' +
                        '<i class="fa fa-cloud"></i>' +
                        '<span>  ' + scope.allscenes[i].cloudCoverFull + ' %</span>' +
                    '</div>' +
                '</div>' +
            '</div>');
    };

    $('#landsat-wall').append(browse);
    map.spin(false);

    $("#show-all").addClass("display-none");
    $("#clear-all").removeClass("display-none");
    $("#complete-all").removeClass("display-none");
};

function resetmap(){
    editableLayers.clearLayers();
    footprintGr.clearLayers();
    imOverlayGr.clearLayers();

    scope.aoiBounds = undefined;

    $("#left-pane").addClass("display-none");
    $('#landsat-wall').empty();
    $('#landsat-wall').scrollTop(0);
    map.invalidateSize();

    $("#show-all").addClass("display-none");
    $("#clear-all").addClass("display-none");
    $("#complete-all").addClass("display-none");
};

function cleanmap(){
    footprintGr.clearLayers();
    imOverlayGr.clearLayers();

    $("#left-pane").addClass("display-none");
    $('#landsat-wall').empty();
    $('#landsat-wall').scrollTop(0);
    map.invalidateSize();

    $("#show-all").addClass("display-none");
    $("#clear-all").addClass("display-none");
    $("#complete-all").addClass("display-none");
};

function onClickRowPath(){
    $("#left-pane").removeClass("display-none");
    $('#landsat-wall').empty();
    $('#landsat-wall').scrollTop(0);

    this.bringToBack();

    map.invalidateSize();
    map.spin(true);

    scope.allscenes = this.scenes;
    scope.allscenes.sort(sortScenesDate);
    browse = [];

    for (var i=0; i < scope.allscenes.length; i++){
        browse.push(
            '<div class="result-content">' +
                '<img id="' + scope.allscenes[i].sceneID +  '" ' +
                'class="img-thumb"' +
                'data-sizes="auto" src="' + scope.allscenes[i].browseURL + '" ' +
                'onclick="imgclick(' + i + ')">' +
                '<div class="result-overlay">' +
                    '<div>' +
                        '<i class="fa fa-calendar-o"></i>' +
                        '<span>  ' + scope.allscenes[i].acquisitionDate + '</span>' +
                    '</div>' +
                    '<div>' +
                        '<i class="fa fa-cloud"></i>' +
                        '<span>  ' + scope.allscenes[i].cloudCoverFull + ' %</span>' +
                    '</div>' +
                '</div>' +
            '</div>');
    };

    $('#landsat-wall').append(browse);
    map.spin(false);

    $("#show-all").addClass("display-none");
    $("#clear-all").removeClass("display-none");
    $("#complete-all").removeClass("display-none");
};


function getSeason(dateIn, lat){
    var mDate =  moment(dateIn, "YYYY-MM-DD"),
        doy = mDate.dayOfYear(),
        year = mDate.year(),
        spring = moment({ year :year, month :2, day :21}).dayOfYear(),
        summer = moment({ year :year, month :5, day :21}).dayOfYear(),
        autumn = moment({ year :year, month :8, day :22}).dayOfYear(),
        winter = moment({ year :year, month :11, day :21}).dayOfYear(),
        seas = ['spring', 'summer', 'autumn', 'winter'];

    if (lat < 0) seas.reverse();

    var season = ''
    if (doy < spring || doy >= winter) season = seas[3];
    if (doy >= spring && doy < summer) season = seas[0];
    if (doy >= summer && doy < autumn) season = seas[1];
    if (doy >= autumn && doy < winter) season = seas[2];

    return season;
};

function getDataAndUpdate(adress) {

    map.spin(true);
    cleanmap();

    var keys = Object.keys(editableLayers._layers),
        bounds = editableLayers._layers[keys[0]].getBounds();

    var results = {};
    $.getJSON(adress, function(data) {
        var total = data.info.results.total;
        if (total < 2000){
            for (var i=0; i < data.results.length; i++){
                var scene = {};
                scene.rowpath = data.results[i].row + '-' + data.results[i].path;
                scene.sceneStartTime = moment(data.results[i].sceneStartTime, ["YYYY-MM-DD HH:mm:ss.S", "YYYY:DDD:HH:mm:ss"]).toDate();
                scene.sceneStopTime = moment(data.results[i].sceneStopTime, ["YYYY-MM-DD HH:mm:ss.S", "YYYY:DDD:HH:mm:ss"]).toDate();
                scene.acquisitionDate = data.results[i].acquisitionDate;
                scene.browseAvailable = data.results[i].browseAvailable;
                scene.lat = data.results[i].sceneCenterLatitude;
                scene.lon = data.results[i].sceneCenterLongitude;

                if (scene.lon > 0) {
                    scene.lon = scene.lon + Math.floor((bounds._southWest.lng + 180) / 360) * 360;
                } else {
                    scene.lon = scene.lon + Math.floor((bounds._northEast.lng + 180) / 360) * 360;
                }

                scene.browseURL = data.results[i].browseURL;
                scene.cloudCover = data.results[i].cloudCover;
                scene.cloudCoverFull = data.results[i].cloudCoverFull;
                scene.dayOrNight = data.results[i].dayOrNight;
                scene.path = data.results[i].path;
                scene.row = data.results[i].row;
                scene.sceneID = data.results[i].sceneID;
                scene.lowerLeftCornerLatitude = data.results[i].lowerLeftCornerLatitude;
                scene.lowerRightCornerLatitude = data.results[i].lowerRightCornerLatitude;
                scene.upperLeftCornerLatitude = data.results[i].upperLeftCornerLatitude;
                scene.upperRightCornerLatitude = data.results[i].upperRightCornerLatitude;
                scene.lowerLeftCornerLongitude = data.results[i].lowerLeftCornerLongitude;
                scene.lowerRightCornerLongitude = data.results[i].lowerRightCornerLongitude;
                scene.upperLeftCornerLongitude = data.results[i].upperLeftCornerLongitude;
                scene.upperRightCornerLongitude = data.results[i].upperRightCornerLongitude;
                scene.S3 = (data.results[i].hasOwnProperty('S3')) ? true : false;

                var diff_L = Math.abs(scene.lowerLeftCornerLongitude - scene.lowerRightCornerLongitude),
                    diff_U = Math.abs(scene.upperLeftCornerLongitude - scene.upperRightCornerLongitude);
                if ((diff_L > 180) || (diff_U > 180)){
                    if (scene.lowerLeftCornerLongitude < 0) scene.lowerLeftCornerLongitude += 360;
                    if (scene.upperLeftCornerLongitude < 0) scene.upperLeftCornerLongitude += 360;
                    if (scene.lowerRightCornerLongitude < 0) scene.lowerRightCornerLongitude += 360;
                    if (scene.upperRightCornerLongitude < 0) scene.upperRightCornerLongitude += 360;
                }

                //From Libra by developmentseed (https://github.com/developmentseed/libra)
                var lonCorners = ['upperLeftCornerLongitude','upperRightCornerLongitude','lowerRightCornerLongitude','lowerLeftCornerLongitude'];
                for (var jj=0; jj < lonCorners.length; jj++){
                    adjustBound = (scene[lonCorners[jj]] > 0) ? '_southWest' : '_northEast';
                    scene[lonCorners[jj]] += Math.floor((bounds[adjustBound].lng + 180) / 360) * 360;
                };

                scene.season = getSeason(scene.acquisitionDate, scene.lat);

                if ((scene.S3 == true) && (scene.browseAvailable == "Y") && (scene.dayOrNight == "DAY") && isInArray(scope.filtervalues.seasons, scene.season)){
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
                weight: 1.2,
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

            var fp = results[RowPath[i]][0],
                LL = L.latLng(fp.lowerLeftCornerLatitude, fp.lowerLeftCornerLongitude ),
                LR = L.latLng(fp.lowerRightCornerLatitude, fp.lowerRightCornerLongitude ),
                UL = L.latLng(fp.upperLeftCornerLatitude, fp.upperLeftCornerLongitude ),
                UR = L.latLng(fp.upperRightCornerLatitude, fp.upperRightCornerLongitude );

            var poly = L.polygon([LL, LR, UR, UL], defaultStyle)
                .on('mouseover', function () {this.setStyle(highlightStyle);})
                .on('mouseout', function () {this.setStyle(defaultStyle);})
                .on('click', onClickRowPath);

            poly.scenes = results[RowPath[i]]; //add all scenes information to polygon
            poly.id = RowPath[i];

            footprintGr.addLayer(poly);
        };

        if (RowPath.length === 0){
            $("div.h4noim").removeClass("display-none");
            $("#show-all").addClass("display-none");
        }else{
            map.fitBounds(footprintGr.getBounds());
            $("div.h4noim").addClass("display-none");
            $("#show-all").removeClass("display-none");
        }
        map.spin(false);
    }).fail(function() {
        $("div.h4noim").removeClass("display-none");
        map.spin(false);
    });

 };

//From Libra by developmentseed (https://github.com/developmentseed/libra)
function landsatQuery(bounds) {

    if (typeof bounds === 'undefined') {
        return;
    };

    // check continuity of longitude range (bool)
    var continuous =  Math.floor((bounds._northEast.lng + 180) / 360) === Math.floor((bounds._southWest.lng + 180) / 360),
        sceneCenterLatRange = [bounds._northEast.lat, bounds._southWest.lat],
        sceneCenterLonRange = [mod(bounds._northEast.lng + 180, 360) - 180, mod(bounds._southWest.lng + 180, 360) - 180],
        // LatRange -- array of floats specifying the scene centroid latitude. e.g. [4.3, 78.9]
        LatRange = sceneCenterLatRange.sort(sortNumber) || ['-90', '90'],
        strLat = "sceneCenterLatitude:[" + LatRange[0] + "+TO+" + LatRange[1] + "]";

    // LonRange -- array of floats specifying the scene centroid longitude. e.g. [4.3, 78.9]
    // also uses options.continuous to decide if we need two separate ranges to wrap around the 180th meridian
    if (continuous){
        var LonRange = sceneCenterLonRange.sort(sortNumber) || ['-180', '180'],
            strLon = "+AND+sceneCenterLongitude:[" + LonRange[0] + "+TO+" + LonRange[1] + "]";
    }
    else {
        var range1 = [-180,sceneCenterLonRange.sort(sortNumber)[0]],
            range2 = [sceneCenterLonRange.sort(sortNumber)[1],180],
            strLon = "+AND+(sceneCenterLongitude:[" + range1[0] + "+TO+" + range1[1] + "]+OR+sceneCenterLongitude:[" + range2[0] + "+TO+" + range2[1] + "])";
    }

    var cloudfilter = "+AND+cloudCoverFull:[" + scope.filtervalues.cloudmin + "+TO+" + scope.filtervalues.cloudmax + "]",
        datefilter = "+AND+acquisitionDate:[" + scope.filtervalues.datestart + "+TO+" + scope.filtervalues.dateend + "]",
        query = scope.api_url + strLat + strLon + datefilter + cloudfilter + "&limit=2000";

    getDataAndUpdate(query);

};

function update_map_uuid(uuid) {

    map.spin(true);

    var url = 'https://data.remotepixel.ca/mosaic/',
        json_file = url + uuid + ".json",
        mos_file = url + uuid + "_mosaic.tif";

    $.getJSON(json_file, function(data) {
        var scene = {};
        scene.coordinates = data.coordinates;
        scene.id = data.id;

        var southWest = L.latLng(scene.coordinates.south, scene.coordinates.west),
            northEast = L.latLng(scene.coordinates.north, scene.coordinates.east),
            lon = (((scene.coordinates.east + 180) + (scene.coordinates.west + 180)) / 2) - 180,
            lat = (((scene.coordinates.north + 90) + (scene.coordinates.south + 90)) / 2) - 90,
            attrib = '&copy Landsat imagery courtesy of NASA and USGS; <a href="https://remotepixel.ca/">RemotePixel</a>';

        var imOver = L.imageOverlay(mos_file, L.latLngBounds(southWest, northEast), {attribution: attrib})
            .on('load', function(){ map.spin(false);})
            .addTo(map);

        imOverlayGr.addLayer(imOver);
        map.fitBounds(imOver._bounds);
    }).fail(function() {
        map.spin(false);
    });
}

function getUrlVars() {
    "use strict";
    var vars = {},
        parts = window.location.href.replace(/[?&]+([^=&]+)=([^&]*)/gi, function(m,key,value) {
            vars[key] = value;
        });
    return vars;
}

////////////////////////////////////////////////////////////////////////
//Global Variables
var scope = {
        aoiBounds: undefined,
        allscenes: [],
        api_url: "https://api.remotepixel.ca/landsat?search=",
        _uuid: '',
        filtervalues: {
                cloudmin: 0,
                cloudmax: 20,
                datestart: new Date('2013-04-01').toISOString().slice(0, 10),
                dateend: new Date().toISOString().slice(0, 10),
                seasons: ['spring', 'summer', 'autumn', 'winter']
        }
};

var map = L.map('map', {
    center: [0, 0],
    bounceAtZoomLimits: false,
    worldCopyJump: false,
    zoomControl: false,
    minZoom: 1,
    maxZoom: 11
});

map.fitWorld();

var osm_url = 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png',
    attribution = '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
    OpenStreetMap = L.tileLayer(osm_url, {id: 'MapID', attribution: attribution}).addTo(map);

L.control.zoom({position:'topright'}).addTo(map);

var imOverlayGr = new L.layerGroup().addTo(map),
    footprintGr = new L.featureGroup().addTo(map);

L.easyButton('fa-info',
    function (){
       $('#modalAbout').modal();
    },
    'About');

L.easyButton('fa-share',
        function (){
            var shareurl = "https://remotepixel.ca/projects/landsat8mosaic.html";
            $("#twitter").attr('href','https://twitter.com/share?text=Create Your Own Landsat 8 Mosaic&url=' + shareurl + '&via=RemotePixel&hashtags=Landsat&via=RemotePixel');
            $("#linkedin").attr('href','https://www.linkedin.com/shareArticle?mini=true&url=' + shareurl + '&title='+ document.title + '&source=https://remotepixel.ca');
            $("#facebook").attr('href','https://www.facebook.com/sharer/sharer.php?u=' + shareurl);
            $('#modalShare-bottom').modal();
        },
        'Share it');

L.easyButton('fa-file-text-o',
        function (){

            _ids = [];
            imOverlayGr.eachLayer(function (layer) {
                _ids.push(layer.options.id);
            });

            if (_ids.length != 0){
                $('#title-ids').text('Landsat IDs');
                $('#corps-ids').html('<pre style="word-wrap: break-word; white-space: pre-wrap;">' + JSON.stringify(_ids, null, 4) + '</pre>');
                $('#modalIDs').modal();
            }
        },
        'Get Landsat IDs');

L.easyButton('fa-file-image-o',
        function (){
            var layers = imOverlayGr.getLayers();
            if (layers.length != 0){
                scope._uuid = generateUUID();
                $('#myModalLabel').text("Mosaic Creation (RemotePixel API)");
                $('#uuid-text').text("Task ID: " + scope._uuid);
                $('#myModal').modal();
            };
        },
        'mosaic Creation');

L.easyButton('fa-home',
        function (){
            resetmap();
            resetFilters();
            map.fitWorld();
        },
        'Reset');

// Initialise the FeatureGroup to store editable layers
var editableLayers = new L.FeatureGroup();
map.addLayer(editableLayers);

var options = {
        position: 'topright',
        draw: {
            polyline:  false,
            polygon: false,
            circle: false,
            rectangle: {
                shapeOptions: {
                    clickable: false,
                    color: "#000",
                    weight: 1,
                    fill: false,
                    dashArray: [5,5],
                    opacity: 1
                }
            },
            marker: false
        },
        edit: {
            featureGroup: editableLayers,
            remove: false
        }
    };

var drawControl = new L.Control.Draw(options);
map.addControl(drawControl);

map.on('draw:created', function (e) {
    var type = e.layerType,
        layer = e.layer;

    editableLayers.clearLayers();
    editableLayers.addLayer(layer);
    scope.aoiBounds = layer.getBounds();
    landsatQuery(scope.aoiBounds);
});

map.on('draw:edited', function (e) {
    var keys = Object.keys( e.layers._layers )
    var layer = e.layers._layers[keys[0]]
    scope.aoiBounds = layer.getBounds();
    landsatQuery(scope.aoiBounds);
});

$( document ).ready(function() {
    initFilters();
});
