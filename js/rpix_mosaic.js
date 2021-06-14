'use strict';

const search_api = 'https://api.developmentseed.org/satellites/';
const landsat_services = 'https://landsat.services.remotepixel.ca';
const sentinel_services = 'https://sentinel.services.remotepixel.ca';

////////////////////////////////////////////////////////////////////////
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

var map = new mapboxgl.Map({
  container: 'map',
  style: { version: 8, sources: {}, layers: [] },
  center: [-70.50, 40],
  zoom: 3,
  attributionControl: true,
  hash: true,
  minZoom: 3,
  maxZoom: 13
});

map.addControl(new mapboxgl.NavigationControl(), 'top-right');
map.addControl(new mapboxgl.ScaleControl({maxWidth: 100,   unit: 'metric'}), 'bottom-right');

var draw = new MapboxDraw({
    displayControlsDefault: false,
    controls: {
        point: true,
        polygon: true,
        trash: false
    }
});

map.on('load', function() {

  map.addLayer({
      'id': 'wms-layer',
      'type': 'raster',
      'source': {
          'type': 'raster',
          'tiles': [
              'https://tiles.maps.eox.at/wmts/1.0.0/s2cloudless_3857/default/GoogleMapsCompatible/{z}/{y}/{x}.jpg'
          ],
          'attribution': 'Sentinel-2 cloudless - <a href="https://s2maps.eu">https://s2maps.eu</a> by EOX IT Services GmbH (Contains modified Copernicus Sentinel data 2016 & 2017)',
          'tileSize': 256
      },
      'paint': {}
  });
  map.addControl(draw, 'top-right');

  // const btnsave = document.createElement('button');
  // btnsave.className = 'mapboxgl-ctrl-icon';
  // btnsave.setAttribute('onclick', 'save()');
  // let icn = document.createElement('i');
  // icn.className = 'fa fa-save ';
  // btnsave.appendChild(icn);
  // let grp = document.createElement('div');
  // grp.id = 'btn-save';
  // grp.className = 'mapboxgl-ctrl-group mapboxgl-ctrl display-none';
  // grp.appendChild(btnsave);
  // let control = document.getElementsByClassName('mapboxgl-ctrl-top-right');
  // control[0].appendChild(grp.cloneNode(true));
  //
  // const btnclear = document.createElement('button');
  // btnclear.className = 'mapbox-gl-draw_ctrl-draw-btn mapbox-gl-draw_trash';
  // btnclear.setAttribute('onclick', 'clearDraw()');
  // grp = document.createElement('div');
  // grp.className = 'mapboxgl-ctrl-group mapboxgl-ctrl';
  // grp.appendChild(btnclear);
  // control = document.getElementsByClassName('mapboxgl-ctrl-top-right');
  // control[0].appendChild(grp.cloneNode(true));
  //
  // const btninfo = document.createElement('button');
  // btninfo.className = 'mapboxgl-ctrl-icon';
  // btninfo.setAttribute('onclick', 'infomodal()');
  // icn = document.createElement('i');
  // icn.className = 'fa fa-info ';
  // btninfo.appendChild(icn);
  // grp = document.createElement('div');
  // grp.className = 'mapboxgl-ctrl-group mapboxgl-ctrl';
  // grp.appendChild(btninfo);
  // control = document.getElementsByClassName('mapboxgl-ctrl-top-right');
  // control[0].appendChild(grp.cloneNode(true));
});



////////////////////////////////////////////////////////////////////////
//Filters
const initFilters = () => {
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

const resetFilters = () => {
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

const setCloud = () => {
    scope.filtervalues.cloudmin = parseInt($('#cloudCoverSlider').val()[0]);
    scope.filtervalues.cloudmax = parseInt($('#cloudCoverSlider').val()[1]);
    $('#cloud-filter').html('<i class="fa fa-cloud fa-2x"><hbut> : ' + scope.filtervalues.cloudmin + '% - ' + scope.filtervalues.cloudmax + '%</hbut></i>');
};

const updateCloud = () => {
    scope.filtervalues.cloudmin = parseInt($('#cloudCoverSlider').val()[0]);
    scope.filtervalues.cloudmax = parseInt($('#cloudCoverSlider').val()[1]);
    $('#cloud-filter').html('<i class="fa fa-cloud fa-2x"><hbut> : ' + scope.filtervalues.cloudmin + '% - ' + scope.filtervalues.cloudmax + '%</hbut></i>');
    landsatQuery(scope.aoiBounds);
};

const setDate = () => {
    scope.filtervalues.datestart = new Date(Number($('#dateSlider').val()[0])).toISOString().slice(0, 10);
    scope.filtervalues.dateend = new Date(Number($('#dateSlider').val()[1])).toISOString().slice(0, 10);
    $('#date-filter').html('<i class="fa fa-calendar-o fa-2x"><hbut> : ' + scope.filtervalues.datestart + ' - ' + scope.filtervalues.dateend + '</hbut></i>');
};

const updateDate = () => {
    scope.filtervalues.datestart = new Date(Number($('#dateSlider').val()[0])).toISOString().slice(0, 10);
    scope.filtervalues.dateend = new Date(Number($('#dateSlider').val()[1])).toISOString().slice(0, 10);
    $('#date-filter').html('<i class="fa fa-calendar-o fa-2x"><hbut> : ' + scope.filtervalues.datestart + ' - ' + scope.filtervalues.dateend + '</hbut></i>');
    landsatQuery(scope.aoiBounds);
};

const updateSeason = () => {
    const season = ['spring', 'summer', 'autumn', 'winter'];
    scope.filtervalues.seasons = season.slice( $('#seasonSlider').val()[0] , $('#seasonSlider').val()[1] );
    landsatQuery(scope.aoiBounds);
};

const toggleOpenFilter = (filter) => {
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
// const closeleftpane = () => {
//     $("#left-pane").addClass("display-none");
//     $('#landsat-wall').empty();
//     $('#landsat-wall').scrollTop(0);
//     map.resize();
// };
//
// const clearall = () => {
//     imOverlayGr.clearLayers();
//     $("#show-all").removeClass("display-none");
//     $("#clear-all").addClass("display-none");
//     $("#complete-all").addClass("display-none");
//
//     $("#left-pane").addClass("display-none");
//     $('#landsat-wall').empty();
//     $('#landsat-wall').scrollTop(0);
//     map.resize();
// };

// function imOverlayBuilt(scene){
//
//     var polygon = turf.polygon([[
//                                  [scene.upperLeftCornerLongitude, scene.upperLeftCornerLatitude],
//                                  [scene.upperRightCornerLongitude, scene.upperRightCornerLatitude],
//                                  [scene.lowerRightCornerLongitude, scene.lowerRightCornerLatitude],
//                                  [scene.lowerLeftCornerLongitude, scene.lowerLeftCornerLatitude],
//                                  [scene.upperLeftCornerLongitude, scene.upperLeftCornerLatitude]
//                                 ]]);
//
//     var bbox = turf.extent(polygon);
//
//     var anchors = [
//                    [bbox[3], bbox[0]],
//                    [bbox[3], bbox[2]],
//                    [bbox[1], bbox[2]],
//                    [bbox[1], bbox[0]]
//     ];
//
//     var clipCoords = [
//                       [scene.upperLeftCornerLatitude, scene.upperLeftCornerLongitude],
//                       [scene.upperRightCornerLatitude, scene.upperRightCornerLongitude],
//                       [scene.lowerRightCornerLatitude, scene.lowerRightCornerLongitude],
//                       [scene.lowerLeftCornerLatitude, scene.lowerLeftCornerLongitude],
//                       [scene.upperLeftCornerLatitude, scene.upperLeftCornerLongitude]
//     ];
//
//     var options = {
//             attribution: "&copy Landsat imagery courtesy of NASA and USGS",
//             id: scene.sceneID,
//             rp: scene.rowpath,
//             info: {date: scene.date, cloud: scene.cloud},
//             clip: clipCoords
//     };
//
//     return new L.ImageTransform(scene.browseURL, anchors, options); //https://github.com/ScanEx/Leaflet.imageTransform
// }

// function complete(){
//     var rp = [];
//
//     imOverlayGr.eachLayer(function (layer) {
//         rp.push(layer.options.rp)
//     });
//
//     map.spin(true);
//
//     var RowPathKey = Object.keys(footprintGr._layers);
//
//     for (var i=0; i < RowPathKey.length; i++){
//         var layers = footprintGr._layers[RowPathKey[i]];
//
//         if (isInArray(rp, layers.id)) continue
//
//         scope.allscenes = layers.scenes;
//         scope.allscenes.sort(sortScenesDate);
//
//         imOverlayGr.addLayer(imOverlayBuilt(scope.allscenes[0]));
//     };
//
//     imOverlayGr.eachLayer(function (layer) {
//         layer._image.onclick = function () {
//             if (map.dragging.moved()) return
//             imChange(layer);
//         }
//     });
//
//     $("#show-all").addClass("display-none");
//     $("#clear-all").removeClass("display-none");
//     map.spin(false);
// }

// function showall (){
//     map.spin(true);
//
//     imOverlayGr.clearLayers()
//
//     var RowPathKey = Object.keys(footprintGr._layers);
//
//     for (var i=0; i < RowPathKey.length; i++){
//         var layers = footprintGr._layers[RowPathKey[i]];
//
//         scope.allscenes = layers.scenes;
//         scope.allscenes.sort(sortScenesDate);
//
//         imOverlayGr.addLayer(imOverlayBuilt(scope.allscenes[0]));
//     };
//
//     imOverlayGr.eachLayer(function (layer) {
//         layer._image.onclick = function () {
//             if (map.dragging.moved()) return
//             imChange(layer);
//         }
//     });
//
//     $("#show-all").addClass("display-none");
//     $("#clear-all").removeClass("display-none");
//     map.spin(false);
// };

// function imgclick(input){
//
//     imOverlayGr.eachLayer(function (layer) {
//         if (layer.options.rp == scope.allscenes[input].rowpath) imOverlayGr.removeLayer(layer);
//     });
//
//     imOverlayGr.addLayer(imOverlayBuilt(scope.allscenes[input]));
//
//     $("#complete-all").removeClass("display-none");
//
//     imOverlayGr.eachLayer(function (layer) {
//         layer._image.onclick = function () {
//             if (map.dragging.moved()) return
//             imChange(layer);
//         }
//     });
//
// };

// function imChange(im){
//     imOverlayGr.removeLayer(im)
//
//     $("#left-pane").removeClass("display-none");
//     $('#landsat-wall').empty();
//     $('#landsat-wall').scrollTop(0);
//
//     map.invalidateSize();
//     map.spin(true);
//
//     var rp = im.options.rp;
//     var lookup = {};
//     footprintGr.eachLayer(function (layer) {
//         lookup[layer.id] = layer;
//     });
//
//     scope.allscenes = lookup[rp].scenes;
//     scope.allscenes.sort(sortScenesDate);
//     browse = [];
//
//     for (var i=0; i < scope.allscenes.length; i++){
//         browse.push(
//             '<div class="result-content">' +
//                 '<img id="' + scope.allscenes[i].sceneID +  '" ' +
//                 'class="img-thumb"' +
//                 'data-sizes="auto" src="' + scope.allscenes[i].browseURL + '" ' +
//                 'onclick="imgclick(' + i + ')">' +
//                 '<div class="result-overlay">' +
//                     '<div>' +
//                         '<i class="fa fa-calendar-o"></i>' +
//                         '<span>  ' + scope.allscenes[i].acquisitionDate + '</span>' +
//                     '</div>' +
//                     '<div>' +
//                         '<i class="fa fa-cloud"></i>' +
//                         '<span>  ' + scope.allscenes[i].cloudCoverFull + ' %</span>' +
//                     '</div>' +
//                 '</div>' +
//             '</div>');
//     };
//
//     $('#landsat-wall').append(browse);
//     map.spin(false);
//
//     $("#show-all").addClass("display-none");
//     $("#clear-all").removeClass("display-none");
//     $("#complete-all").removeClass("display-none");
// };

// function resetmap(){
//     editableLayers.clearLayers();
//     footprintGr.clearLayers();
//     imOverlayGr.clearLayers();
//
//     scope.aoiBounds = undefined;
//
//     $("#left-pane").addClass("display-none");
//     $('#landsat-wall').empty();
//     $('#landsat-wall').scrollTop(0);
//     map.invalidateSize();
//
//     $("#show-all").addClass("display-none");
//     $("#clear-all").addClass("display-none");
//     $("#complete-all").addClass("display-none");
// };

// function cleanmap(){
//     footprintGr.clearLayers();
//     imOverlayGr.clearLayers();
//
//     $("#left-pane").addClass("display-none");
//     $('#landsat-wall').empty();
//     $('#landsat-wall').scrollTop(0);
//     map.invalidateSize();
//
//     $("#show-all").addClass("display-none");
//     $("#clear-all").addClass("display-none");
//     $("#complete-all").addClass("display-none");
// };
//
// function onClickRowPath(){
//     $("#left-pane").removeClass("display-none");
//     $('#landsat-wall').empty();
//     $('#landsat-wall').scrollTop(0);
//
//     this.bringToBack();
//
//     map.invalidateSize();
//     map.spin(true);
//
//     scope.allscenes = this.scenes;
//     scope.allscenes.sort(sortScenesDate);
//     browse = [];
//
//     for (var i=0; i < scope.allscenes.length; i++){
//         browse.push(
//             '<div class="result-content">' +
//                 '<img id="' + scope.allscenes[i].sceneID +  '" ' +
//                 'class="img-thumb"' +
//                 'data-sizes="auto" src="' + scope.allscenes[i].browseURL + '" ' +
//                 'onclick="imgclick(' + i + ')">' +
//                 '<div class="result-overlay">' +
//                     '<div>' +
//                         '<i class="fa fa-calendar-o"></i>' +
//                         '<span>  ' + scope.allscenes[i].acquisitionDate + '</span>' +
//                     '</div>' +
//                     '<div>' +
//                         '<i class="fa fa-cloud"></i>' +
//                         '<span>  ' + scope.allscenes[i].cloudCoverFull + ' %</span>' +
//                     '</div>' +
//                 '</div>' +
//             '</div>');
//     };
//
//     $('#landsat-wall').append(browse);
//     map.spin(false);
//
//     $("#show-all").addClass("display-none");
//     $("#clear-all").removeClass("display-none");
//     $("#complete-all").removeClass("display-none");
// };


// const getSeason = (dateIn, lat) => {
//     var mDate =  moment(dateIn, "YYYY-MM-DD"),
//         doy = mDate.dayOfYear(),
//         year = mDate.year(),
//         spring = moment({ year :year, month :2, day :21}).dayOfYear(),
//         summer = moment({ year :year, month :5, day :21}).dayOfYear(),
//         autumn = moment({ year :year, month :8, day :22}).dayOfYear(),
//         winter = moment({ year :year, month :11, day :21}).dayOfYear(),
//         seas = ['spring', 'summer', 'autumn', 'winter'];
//
//     if (lat < 0) seas.reverse();
//
//     var season = ''
//     if (doy < spring || doy >= winter) season = seas[3];
//     if (doy >= spring && doy < summer) season = seas[0];
//     if (doy >= summer && doy < autumn) season = seas[1];
//     if (doy >= autumn && doy < winter) season = seas[2];
//
//     return season;
// };


const sortScenes = (a, b) => {
  return moment(b.date, 'YYYYMMDD') - moment(a.date, 'YYYYMMDD');
};

const getDataAndUpdate = (feature) => {


    geom = turf.bbox(feature).toString();

    const params = {
      contains: geom,
      date_from: scope.filtervalues.datestart,
      date_to: scope.filtervalues.dateend,
      cloud_from: scope.filtervalues.cloudmin,
      cloud_to: scope.filtervalues.cloudmax,
      satellite: 'landsat',
      limit: 2000};

    const url_params = Object.keys(params).map(i => `${i}=${params[i]}`).join('&');

    let res = {};

    const query = `${search_api}?${url_params}`;
    return $.getJSON(query).done()
      .then(data => {
        if (data.hasOwnProperty('errorMessage')) return [];
        if (data.meta.found === 0) return [];
        for (let i = 0; i < data.results.length; i += 1) {
          let scene = {
            'date': data.results[i].date,
            'cloud': data.results[i].cloud_coverage,
            'sat': data.results[i].satellite_name,
            'geom': data.results[i].data_geometry};

          if (!turf.booleanContains({'geometry': scene.geom}, feature)) continue;

          if (scene.sat === 'landsat-8') {
            scene.sceneID = data.results[i].scene_id;
            scene.productID =  data.results[i].LANDSAT_PRODUCT_ID;
            if (moment(scene.date) < moment('2017-05-01')){
              scene.scene_id = scene.sceneID.replace('LGN01', 'LGN00');
            } else {
              scene.scene_id = scene.productID;
            }
          } else {
            scene.scene_id = data.results[i].scene_id;
          }
          results.push(scene);
        };

        let ids = Object.keys(res);
        for (let i = 0; i < ids.length; i += 1) {
          if (/^L[COTEM]08_.+RT$/.exec(ids[i])) {
            let id = ids[i].split('_').slice(0,4).join('_')
            let pattern = new RegExp(`^${id}`);
            let same = ids.filter(e => {return pattern.test(e);});
            if (same.length > 1) delete res[ids[i]];
          }
        }

        const results = []
        for (let key in res) {
          results.push(res[key]);
        }
        results.sort(sortScenes);

        return results;
      })
      .catch(err => {
        console.warn(err);
        return [];
      });


    //
    // map.spin(true);
    // cleanmap();
    //
    // var keys = Object.keys(editableLayers._layers),
    //     bounds = editableLayers._layers[keys[0]].getBounds();
    //
    // var results = {};
    // $.getJSON(adress, function(data) {
    //     var total = data.info.results.total;
    //     if (total < 2000){
    //         for (var i=0; i < data.results.length; i++){
    //             var scene = {};
    //             scene.rowpath = data.results[i].row + '-' + data.results[i].path;
    //             scene.sceneStartTime = moment(data.results[i].sceneStartTime, ["YYYY-MM-DD HH:mm:ss.S", "YYYY:DDD:HH:mm:ss"]).toDate();
    //             scene.sceneStopTime = moment(data.results[i].sceneStopTime, ["YYYY-MM-DD HH:mm:ss.S", "YYYY:DDD:HH:mm:ss"]).toDate();
    //             scene.acquisitionDate = data.results[i].acquisitionDate;
    //             scene.browseAvailable = data.results[i].browseAvailable;
    //             scene.lat = data.results[i].sceneCenterLatitude;
    //             scene.lon = data.results[i].sceneCenterLongitude;
    //
    //             if (scene.lon > 0) {
    //                 scene.lon = scene.lon + Math.floor((bounds._southWest.lng + 180) / 360) * 360;
    //             } else {
    //                 scene.lon = scene.lon + Math.floor((bounds._northEast.lng + 180) / 360) * 360;
    //             }
    //
    //             scene.browseURL = data.results[i].browseURL;
    //             scene.cloudCover = data.results[i].cloudCover;
    //             scene.cloudCoverFull = data.results[i].cloudCoverFull;
    //             scene.dayOrNight = data.results[i].dayOrNight;
    //             scene.path = data.results[i].path;
    //             scene.row = data.results[i].row;
    //             scene.sceneID = data.results[i].sceneID;
    //             scene.lowerLeftCornerLatitude = data.results[i].lowerLeftCornerLatitude;
    //             scene.lowerRightCornerLatitude = data.results[i].lowerRightCornerLatitude;
    //             scene.upperLeftCornerLatitude = data.results[i].upperLeftCornerLatitude;
    //             scene.upperRightCornerLatitude = data.results[i].upperRightCornerLatitude;
    //             scene.lowerLeftCornerLongitude = data.results[i].lowerLeftCornerLongitude;
    //             scene.lowerRightCornerLongitude = data.results[i].lowerRightCornerLongitude;
    //             scene.upperLeftCornerLongitude = data.results[i].upperLeftCornerLongitude;
    //             scene.upperRightCornerLongitude = data.results[i].upperRightCornerLongitude;
    //             scene.S3 = (data.results[i].hasOwnProperty('S3')) ? true : false;
    //
    //             var diff_L = Math.abs(scene.lowerLeftCornerLongitude - scene.lowerRightCornerLongitude),
    //                 diff_U = Math.abs(scene.upperLeftCornerLongitude - scene.upperRightCornerLongitude);
    //             if ((diff_L > 180) || (diff_U > 180)){
    //                 if (scene.lowerLeftCornerLongitude < 0) scene.lowerLeftCornerLongitude += 360;
    //                 if (scene.upperLeftCornerLongitude < 0) scene.upperLeftCornerLongitude += 360;
    //                 if (scene.lowerRightCornerLongitude < 0) scene.lowerRightCornerLongitude += 360;
    //                 if (scene.upperRightCornerLongitude < 0) scene.upperRightCornerLongitude += 360;
    //             }
    //
    //             //From Libra by developmentseed (https://github.com/developmentseed/libra)
    //             var lonCorners = ['upperLeftCornerLongitude','upperRightCornerLongitude','lowerRightCornerLongitude','lowerLeftCornerLongitude'];
    //             for (var jj=0; jj < lonCorners.length; jj++){
    //                 adjustBound = (scene[lonCorners[jj]] > 0) ? '_southWest' : '_northEast';
    //                 scene[lonCorners[jj]] += Math.floor((bounds[adjustBound].lng + 180) / 360) * 360;
    //             };
    //
    //             scene.season = getSeason(scene.acquisitionDate, scene.lat);
    //
    //             if ((scene.S3 == true) && (scene.browseAvailable == "Y") && (scene.dayOrNight == "DAY") && isInArray(scope.filtervalues.seasons, scene.season)){
    //                 var rp = scene.rowpath;
    //                 if(results.hasOwnProperty(rp)){
    //                     results[rp].push(scene);
    //                 }else{
    //                     results[rp] = [];
    //                     results[rp].push(scene);
    //                 }
    //             };
    //         };
    //     };
    //
    //     var defaultStyle = {
    //             color: "#000",
    //             weight: 1.2,
    //             fill: true,
    //             fillOpacity: 0,
    //             opacity: 1
    //     };
    //
    //     var highlightStyle = {
    //             color: '#2262CC',
    //             weight: 3,
    //             opacity: 0.6,
    //             fill: true,
    //             fillOpacity: 0.65,
    //             fillColor: '#2262CC'
    //     };
    //
    //     var RowPath = Object.keys(results);
    //
    //     for (var i=0; i < RowPath.length; i++){
    //
    //         var fp = results[RowPath[i]][0],
    //             LL = L.latLng(fp.lowerLeftCornerLatitude, fp.lowerLeftCornerLongitude ),
    //             LR = L.latLng(fp.lowerRightCornerLatitude, fp.lowerRightCornerLongitude ),
    //             UL = L.latLng(fp.upperLeftCornerLatitude, fp.upperLeftCornerLongitude ),
    //             UR = L.latLng(fp.upperRightCornerLatitude, fp.upperRightCornerLongitude );
    //
    //         var poly = L.polygon([LL, LR, UR, UL], defaultStyle)
    //             .on('mouseover', function () {this.setStyle(highlightStyle);})
    //             .on('mouseout', function () {this.setStyle(defaultStyle);})
    //             .on('click', onClickRowPath);
    //
    //         poly.scenes = results[RowPath[i]]; //add all scenes information to polygon
    //         poly.id = RowPath[i];
    //
    //         footprintGr.addLayer(poly);
    //     };
    //
    //     if (RowPath.length === 0){
    //         $("div.h4noim").removeClass("display-none");
    //         $("#show-all").addClass("display-none");
    //     }else{
    //         map.fitBounds(footprintGr.getBounds());
    //         $("div.h4noim").addClass("display-none");
    //         $("#show-all").removeClass("display-none");
    //     }
    //     map.spin(false);
    // }).fail(function() {
    //     $("div.h4noim").removeClass("display-none");
    //     map.spin(false);
    // });

 };




$(document).ready(function() {
    initFilters();
});
