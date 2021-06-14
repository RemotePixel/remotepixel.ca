/*jslint browser: true*/
/*global $, jQuery, alert*/
/*global L, lealfet, alert*/
/*global moment, moment, alert*/
/*global console, console, alert*/


$('#submit-request').validator()
    .on('valid.bs.validator', function () {
        $("#sendGIFrequest").removeClass('disabled');
    })
    .on('invalid.bs.validator', function () {
        $("#sendGIFrequest").addClass('disabled');
    });

$('#sendGIFrequest').on('click', function (e) {
    if(!$('#sendGIFrequest').hasClass('disabled')) {

        ids = [];
        imOverlayGr.eachLayer(function (layer) {
            ids.push(layer.options.id);
        });

        var req = {
            uuid: scope.uuid,
            bands: $("#band-combination input[name='combination']:checked").attr('data'),
            mailto : $('#EmailRequest').val(),
            image_list: '[' + ids   + ']'
        };

        var text = $.post("{{ RPIX_API }}", JSON.stringify({info: req}));
        $('#myModal').modal('hide');
        $('#modalAPI').modal();
    };
});

$('#myModal').on('hidden.bs.modal', function(){
    $(this).find('form')[0].reset();
    scope.uuid = undefined;
});

function initFilters(){
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

    var dateRange = Date.parse(scope.filtervalues.dateend) - Date.parse(scope.filtervalues.datestart);

    var range = [Date.parse(scope.filtervalues.datestart) ,
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

function setCloud(){
    scope.filtervalues.cloudmin = parseInt($('#cloudCoverSlider').val()[0]);
    scope.filtervalues.cloudmax = parseInt($('#cloudCoverSlider').val()[1]);
    $('#cloud-filter').html('<i class="fa fa-cloud fa-2x"><hbut> : ' + scope.filtervalues.cloudmin + '% - ' + scope.filtervalues.cloudmax + '%</hbut></i>');
};

function updateCloud(){
    scope.filtervalues.cloudmin = parseInt($('#cloudCoverSlider').val()[0]);
    scope.filtervalues.cloudmax = parseInt($('#cloudCoverSlider').val()[1]);
    $('#cloud-filter').html('<i class="fa fa-cloud fa-2x"><hbut> : ' + scope.filtervalues.cloudmin + '% - ' + scope.filtervalues.cloudmax + '%</hbut></i>');
    updateMap(scope.center);
};

function setDate(){
    scope.filtervalues.datestart = new Date(Number($('#dateSlider').val()[0])).toISOString().slice(0, 10);
    scope.filtervalues.dateend = new Date(Number($('#dateSlider').val()[1])).toISOString().slice(0, 10);
    $('#date-filter').html('<i class="fa fa-calendar-o fa-2x"><hbut> : ' + scope.filtervalues.datestart + ' - ' + scope.filtervalues.dateend + '</hbut></i>');
};

function updateDate(){
    scope.filtervalues.datestart = new Date(Number($('#dateSlider').val()[0])).toISOString().slice(0, 10);
    scope.filtervalues.dateend = new Date(Number($('#dateSlider').val()[1])).toISOString().slice(0, 10);
    $('#date-filter').html('<i class="fa fa-calendar-o fa-2x"><hbut> : ' + scope.filtervalues.datestart + ' - ' + scope.filtervalues.dateend + '</hbut></i>');
    updateMap(scope.center);
};

function updateSeason(){
    var season = ['spring', 'summer', 'autumn', 'winter'];
    scope.filtervalues.seasons = season.slice( $('#seasonSlider').val()[0] , $('#seasonSlider').val()[1] );
    updateMap(scope.center);
};

function resetFilters(){

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

function toggleOpenFilter(filter){
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

function timestamp(str){
    return new Date(str).getTime();
};

function isInArray(array, search) {
    return (array.indexOf(search) >= 0) ? true : false;
};

function sortScenes(a, b){
    return Date.parse(a.acquisitionDate) - Date.parse(b.acquisitionDate);
};

//From Libra by developmentseed (https://github.com/developmentseed/libra)
function mod(number, dividend) {
    return ((number % dividend) + dividend) % dividend;
};

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

function getSeason(dateIn, lat){
    var mDate =  moment(dateIn, "YYYY-MM-DD");

    var doy = mDate.dayOfYear();
    var year = mDate.year();

    var spring = moment({ year :year, month :2, day :21}).dayOfYear(),
        summer = moment({ year :year, month :5, day :21}).dayOfYear(),
        autumn = moment({ year :year, month :8, day :22}).dayOfYear(),
        winter = moment({ year :year, month :11, day :21}).dayOfYear();

    var seas = ['spring', 'summer', 'autumn', 'winter'];
    if (lat < 0) seas.reverse();

    var season = ''
    if (doy < spring || doy >= winter) season = seas[3];
    if (doy >= spring && doy < summer) season = seas[0];
    if (doy >= summer && doy < autumn) season = seas[1];
    if (doy >= autumn && doy < winter) season = seas[2];

    return season;
};

function cleanoverlays(){
    for (var key in map._layers){
        if(map._layers[key].hasOwnProperty('type')){
            if (map._layers[key].type === 'l8overlay'){
                map.removeLayer(map._layers[key]);
            };
        };
    };
};

function resetmap(){
    footprintGr.clearLayers()
    markerGr.clearLayers()
    imOverlayGr.clearLayers()

    if (typeof(sliderControl) != 'undefined'){
        sliderControl.removeFrom(map);
        sliderControl = undefined;
    };

    cleanoverlays();
    scope.center = undefined;
};

function cleanmap(){
    footprintGr.clearLayers()
    markerGr.clearLayers()
    imOverlayGr.clearLayers()
    scope.uuid = undefined;

    if (typeof(sliderControl) != 'undefined'){
        sliderControl.removeFrom(map);
        sliderControl = undefined;
    };
    cleanoverlays();
};


function getDataAndUpdate(adress) {

    map.spin(true);
    cleanmap();

    var adjust = Math.floor((map.getCenter().lng + 180) / 360) * 360;

    var results = {};
    $.getJSON(adress, function(data) {
        var total = data.info.results.total;
        if (total < 2000){
            for (var i=0; i < data.results.length; i++){
                var scene = {};
                scene.rowpath = data.results[i].row + '-' + data.results[i].path;
                scene.className = data.results[i].sceneID + '-' + data.results[i].row + '-' + data.results[i].path;

                scene.acquisitionDate = data.results[i].acquisitionDate;
                scene.browseAvailable = data.results[i].browseAvailable;
                scene.browseURL = data.results[i].browseURL;
                scene.cloudCover = data.results[i].cloudCover;
                scene.cloudCoverFull = data.results[i].cloudCoverFull;
                scene.dayOrNight = data.results[i].dayOrNight;
                scene.noData = false;

                scene.lat = data.results[i].sceneCenterLatitude;
                scene.lon = data.results[i].sceneCenterLongitude;
                scene.lon = scene.lon + adjust;

                scene.season = getSeason(scene.acquisitionDate, scene.lat);

                scene.path = data.results[i].path;
                scene.row = data.results[i].row;
                scene.sceneID = data.results[i].sceneID;
                scene.sensor = data.results[i].sensor;

                scene.lowerLeftCornerLatitude = data.results[i].lowerLeftCornerLatitude;
                scene.lowerRightCornerLatitude = data.results[i].lowerRightCornerLatitude;
                scene.upperLeftCornerLatitude = data.results[i].upperLeftCornerLatitude;
                scene.upperRightCornerLatitude = data.results[i].upperRightCornerLatitude;

                scene.lowerLeftCornerLongitude = data.results[i].lowerLeftCornerLongitude;
                scene.lowerRightCornerLongitude = data.results[i].lowerRightCornerLongitude;
                scene.upperLeftCornerLongitude = data.results[i].upperLeftCornerLongitude;
                scene.upperRightCornerLongitude = data.results[i].upperRightCornerLongitude;
                scene.S3 = (data.results[i].hasOwnProperty('S3')) ? true : false;

                var diff_L = Math.abs(scene.lowerLeftCornerLongitude - scene.lowerRightCornerLongitude);
                var diff_U = Math.abs(scene.upperLeftCornerLongitude - scene.upperRightCornerLongitude);
                if ((diff_L > 180) || (diff_U > 180)){
                    if (scene.lowerLeftCornerLongitude < 0) scene.lowerLeftCornerLongitude += 360;
                    if (scene.upperLeftCornerLongitude < 0) scene.upperLeftCornerLongitude += 360;
                    if (scene.lowerRightCornerLongitude < 0) scene.lowerRightCornerLongitude += 360;
                    if (scene.upperRightCornerLongitude < 0) scene.upperRightCornerLongitude += 360;
                }

                //From Libra by developmentseed (https://github.com/developmentseed/libra)
                var lonCorners = ['upperLeftCornerLongitude','upperRightCornerLongitude','lowerRightCornerLongitude','lowerLeftCornerLongitude'];
                for (var jj=0; jj < lonCorners.length; jj++){
                    scene[lonCorners[jj]] += adjust;
                };

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
                weight: 2.,
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

            var fp = results[RowPath[i]][0];
            var LL = L.latLng(fp.lowerLeftCornerLatitude, fp.lowerLeftCornerLongitude ),
                LR = L.latLng(fp.lowerRightCornerLatitude, fp.lowerRightCornerLongitude ),
                UL = L.latLng(fp.upperLeftCornerLatitude, fp.upperLeftCornerLongitude ),
                UR = L.latLng(fp.upperRightCornerLatitude, fp.upperRightCornerLongitude );

            var poly = L.polygon([LL, LR, UR, UL], defaultStyle)
                .on('mouseover', function () {this.setStyle(highlightStyle);})
                .on('mouseout', function () {this.setStyle(defaultStyle);})
                .on('click', onClickRowPath);

            poly.scenes = results[RowPath[i]]; //add all scenes information to polygon
            poly.id = RowPath[i];

            var icon = new L.DivIcon({ html: '<div><span>' + poly.scenes.length + '</span></div>', className: 'marker-circle text-center', iconSize: new L.Point(30, 30) });

            poly.marker = new L.marker(poly.getBounds().getCenter(), {icon: icon, clickable: false, zIndexOffset: 100, keyboard: false, opacity: 0.5}).addTo(map);

            footprintGr.addLayer(poly);
            markerGr.addLayer(poly.marker);
        };

        if (RowPath.length === 0){
            $("div.h4noim").removeClass("display-none");
        }else{
            $("div.h4noim").addClass("display-none");
        }

        map.spin(false);

    }).fail(function() {
        $("div.h4noim").removeClass("display-none");
        map.spin(false);
    });
};

function onClickRowPath(){
    map.spin(true);

    imOverlayGr.clearLayers()

    if (typeof(sliderControl) != 'undefined'){
        sliderControl.removeFrom(map);
        sliderControl = undefined;
    };

    cleanoverlays();

    this.bringToBack();

    markerGr.eachLayer(function (mark) {
        mark.setOpacity(0.5);
    });

    this.marker.setOpacity(0);

    //From Libra by developmentseed (https://github.com/developmentseed/libra)
    var adjust = Math.floor((map.getCenter().lng + 180) / 360) * 360;

    var scenes = this.scenes;
    scenes.sort(sortScenes);

    for (var i=0; i < scenes.length; i++){
        var scene = scenes[i];

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
                time: scene.acquisitionDate,
                info: {date: scene.acquisitionDate, cloud: scene.cloudCover, sun: scene.sunAzimuth},
                clip: clipCoords
        };

        var imOverlay = new L.ImageTransform(scene.browseURL, anchors, options); //https://github.com/ScanEx/Leaflet.imageTransform
            imOverlay.type = "l8overlay";

        imOverlayGr.addLayer(imOverlay);
    };

    sliderControl = L.control.sliderControl({
        position: "bottomleft",
        layer: imOverlayGr,
        follow: true,
        showAllOnStart: true,
        alwaysShowDate: true,
        rowpath: this.id,
        timeStrLength: 10
    });

    map.addControl(sliderControl);
    sliderControl.startSlider();
    map.fitBounds(this.getBounds());
    map.spin(false);
};

function updateMap(LatLng){

    if (typeof LatLng === 'undefined') {
        return;
    };

    var lat = (LatLng.lat).toString(),
        lon = (mod(LatLng.lng + 180, 360) - 180).toString(),
        str1 = "upperLeftCornerLatitude:[" + lat + "+TO+1000]+AND+lowerRightCornerLatitude:[-1000+TO+" + lat + "]",
        str2 = "+AND+lowerLeftCornerLongitude:[-1000+TO+" + lon + "]+AND+upperRightCornerLongitude:[" + lon + "+TO+1000]",
        cloudfilter = "+AND+cloudCoverFull:[" + scope.filtervalues.cloudmin + "+TO+" + scope.filtervalues.cloudmax + "]",
        datefilter = "+AND+acquisitionDate:[" + scope.filtervalues.datestart + "+TO+" + scope.filtervalues.dateend + "]",
        query = scope.api_url + str1 + str2 + datefilter + cloudfilter + "&limit=2000";

        getDataAndUpdate(query);
};

function update_map_uuid(uuid) {

    map.spin(true);

    scope.uuid = uuid;

    var url = 'https://data.remotepixel.ca/gif/',
        json_file = url + uuid + ".json",
        gif_file = url + uuid + ".gif";

    $.getJSON(json_file, function(data) {
        var scene = {};
        scene.coordinates = data.coordinates;
        scene.id = data.id;

        var southWest = L.latLng(scene.coordinates.south, scene.coordinates.west),
            northEast = L.latLng(scene.coordinates.north, scene.coordinates.east),
            lon = (((scene.coordinates.east + 180) + (scene.coordinates.west + 180)) / 2) - 180,
            lat = (((scene.coordinates.north + 90) + (scene.coordinates.south + 90)) / 2) - 90,
            attrib = '&copy Landsat imagery courtesy of NASA and USGS; <a href="https://remotepixel.ca/">RemotePixel</a>';

        var imOver = L.imageOverlay(gif_file, L.latLngBounds(southWest, northEast), {attribution: attrib})
            .on('load', function(){ map.spin(false);})
            .addTo(map);
        imOver.type = "l8overlay";

        map.fitBounds(imOver._bounds);

        var defaultStyle = {
                color: "#000",
                weight: 2.,
                fill: true,
                fillOpacity: 0,
                opacity: 1
        };

        var bounds = L.latLngBounds(southWest, northEast),
            poly = L.polygon([bounds.getNorthEast(), bounds.getNorthWest(), bounds.getSouthWest() ,bounds.getSouthEast()], defaultStyle);
        footprintGr.addLayer(poly);

    }).fail(function() {
        map.spin(false);
    });
}

function update_map_ids(ids) {
    ids = ids.replace('[', '');
    ids = ids.replace(']', '');
    ids = ids.replace(',', ' ');

    var query = "https://api.remotepixel.ca/landsat?search=sceneID(" + ids +")&limit=2000"

    map.spin(true);
    cleanmap();

    var results = [];
    $.getJSON(query, function(data) {
        var total = data.info.results.total;
        if (total < 2000){
            for (var i=0; i < data.results.length; i++){
                var scene = {};
                scene.rowpath = data.results[i].row + '-' + data.results[i].path;
                scene.acquisitionDate = data.results[i].acquisitionDate;
                scene.browseAvailable = data.results[i].browseAvailable;
                scene.lat = data.results[i].sceneCenterLatitude;
                scene.lon = data.results[i].sceneCenterLongitude;
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

                var diff_L = Math.abs(scene.lowerLeftCornerLongitude - scene.lowerRightCornerLongitude);
                var diff_U = Math.abs(scene.upperLeftCornerLongitude - scene.upperRightCornerLongitude);
                if ((diff_L > 180) || (diff_U > 180)){
                    if (scene.lowerLeftCornerLongitude < 0) scene.lowerLeftCornerLongitude += 360;
                    if (scene.upperLeftCornerLongitude < 0) scene.upperLeftCornerLongitude += 360;
                    if (scene.lowerRightCornerLongitude < 0) scene.lowerRightCornerLongitude += 360;
                    if (scene.upperRightCornerLongitude < 0) scene.upperRightCornerLongitude += 360;
                }
                results.push(scene);
            };
        };

        results.sort(sortScenes);

        for (var i=0; i < results.length; i++){

            var scene = results[i],
                polygon = turf.polygon([[
                    [scene.upperLeftCornerLongitude, scene.upperLeftCornerLatitude],
                    [scene.upperRightCornerLongitude, scene.upperRightCornerLatitude],
                    [scene.lowerRightCornerLongitude, scene.lowerRightCornerLatitude],
                    [scene.lowerLeftCornerLongitude, scene.lowerLeftCornerLatitude],
                    [scene.upperLeftCornerLongitude, scene.upperLeftCornerLatitude]
                ]]),

                bbox = turf.extent(polygon),
                anchors = [
                    [bbox[3], bbox[0]],
                    [bbox[3], bbox[2]],
                    [bbox[1], bbox[2]],
                    [bbox[1], bbox[0]]
                ],
                clipCoords = [
                    [scene.upperLeftCornerLatitude, scene.upperLeftCornerLongitude],
                    [scene.upperRightCornerLatitude, scene.upperRightCornerLongitude],
                    [scene.lowerRightCornerLatitude, scene.lowerRightCornerLongitude],
                    [scene.lowerLeftCornerLatitude, scene.lowerLeftCornerLongitude],
                    [scene.upperLeftCornerLatitude, scene.upperLeftCornerLongitude]
                ],
                options = {
                    id: scene.sceneID,
                    time: scene.acquisitionDate,
                    attribution: "&copy Landsat imagery courtesy of NASA and USGS",
                    info: {date: scene.date, cloud: scene.cloud},
                    clip: clipCoords
                },
                imOverlay = new L.ImageTransform(scene.browseURL, anchors, options);
                imOverlay.type = "l8overlay";
                imOverlayGr.addLayer(imOverlay);
        };

        sliderControl = L.control.sliderControl({
            position: "bottomleft",
            layer: imOverlayGr,
            follow: true,
            showAllOnStart: true,
            alwaysShowDate: true,
            rowpath: this.id,
            timeStrLength: 10
        });

        map.addControl(sliderControl);
        sliderControl.startSlider();
        map.fitBounds(imOverlayGr.getLayers()[0]._bounds);
        map.spin(false);
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
        uuid: '',
        api_url: "https://api.remotepixel.ca/landsat?search=",
        center: undefined,
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
    touchZoom: false,
    inertia: false,
    zoomControl: false,
    doubleClickZoom: 'center',
    scrollWheelZoom: 'center',
    minZoom: 1,
    zoom: 2,
    maxZoom: 11
});

var osm_url = 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png';
var attribution = '&copy; <a href="http://www.openstreetmap.org/copyright">OpenStreetMap</a>';
var OpenStreetMap = L.tileLayer(osm_url, {id: 'MapID', attribution: attribution})
        .addTo(map);

var mapLink ='<a href="http://www.esri.com/">Esri</a>';
var wholink = 'i-cubed, USDA, USGS, AEX, GeoEye, Getmapping, Aerogrid, IGN, IGP, UPR-EGP, and the GIS User Community';
var esriWorld = L.tileLayer('https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}', {
    attribution: '&copy; '+mapLink+', '+wholink,
    maxZoom: 18});

var baseMaps = {
    "OpenStreetMap": OpenStreetMap,
    "ESRI-Satellite" : esriWorld
};

L.control.zoom({position:'topright'}).addTo(map);
L.control.layers(baseMaps, '', {position:'bottomright'}).addTo(map);

var imOverlayGr = new L.layerGroup();
var footprintGr = new L.featureGroup().addTo(map);
var markerGr = new L.featureGroup().addTo(map);

map.on('dragend', function (e){
    if (footprintGr.getLayers().length != 0){
        if (footprintGr.getBounds().contains(map.getCenter())){
            return
        } else {
            updateMap(map.getCenter());
        }
    }else{
        updateMap(map.getCenter());
    };

    scope.center = map.getCenter();
});

L.easyButton('fa-home',
    function (){
        resetmap();
        resetFilters();
        map.fitWorld();
    },
    'Reset');

L.easyButton('fa-film',
    function (){

        if (imOverlayGr.getLayers().length != 0 && (typeof scope.uuid === 'undefined')) {
            scope.uuid = generateUUID();

            // urls = [];
            // imOverlayGr.eachLayer(function (layer) {
            //     urls.push(layer.url);
            // });

            $('#myModalLabel').text("GIF Creation for Row-Path: " + imOverlayGr.getLayers()[0].options.rp);
            $('#uuid-text').text("Task ID: " + scope.uuid);

            $('#myModal').modal();
        };
    },
    'Gif Creation');

L.easyButton('fa-share',
        function (){

            ids = [];
            imOverlayGr.eachLayer(function (layer) {
                ids.push(layer.options.id);
            });

            if (ids.length !== 0){
                var share_url = "https://remotepixel.ca/projects/landsat8evolution.html?ids=[" + ids +"]";
            } else if (typeof scope.uuid !== 'undefined'){
                var share_url =  window.location.href;
            } else {
                var share_url = "https://remotepixel.ca/projects/landsat8evolution.html";
            }

            $("#twitter").attr('href',
                    'https://twitter.com/share?url=' + encodeURIComponent(share_url) +
                    '&via=RemotePixel' +
                    '&hashtags=Landsat' +
                    '&related=NASA_Landsat' +
                    '&text=Landsat 8 - See how the world is changing');

            $("#linkedin").attr('href',
                    'https://www.linkedin.com/shareArticle?mini=true&url=' + encodeURIComponent(share_url) +
                    '&title=Landsat 8 - See how the world is changing' +
                    '&source=https://remotepixel.ca');

            $("#facebook").attr('href',
                    'https://www.facebook.com/sharer/sharer.php?u=' + encodeURIComponent(share_url));

            $('#modalShare').modal();
        },
        'Share it');

L.easyButton('fa-info',
    function (){
       $('#modalAbout').modal();
    },
    'About');

$( document ).ready(function() {
    initFilters();

    var keys = getUrlVars();
    if (keys.hasOwnProperty('uuid')) {
        update_map_uuid(keys.uuid);
    } else if (keys.hasOwnProperty('ids')) {
        update_map_ids(keys.ids);
    } else {
        $('#modalAbout').modal();
    }

});
