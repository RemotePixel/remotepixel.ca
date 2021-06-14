/*jslint browser: true*/
/*global $, jQuery, alert*/
/*global L, lealfet, alert*/
/*global moment, moment, alert*/
/*global console, console, alert*/
'use strict';

////////////////////////////////////////////////////////////////////////
//Tools
const timestamp = (str) => {
  return new Date(str).getTime();
};

//From Libra by developmentseed (https://github.com/developmentseed/libra)
const mod = (number, dividend) => {
  return ((number % dividend) + dividend) % dividend;
};

const sortNumber = (a, b) => {
    return a - b;
};

const sortScenesDate = (a, b) => {
    return Date.parse(b.acquisitionDate) - Date.parse(a.acquisitionDate);
};

const isInArray = (array, search) =>{
    return (array.indexOf(search) >= 0) ? true : false;
};

// //from http://jsfiddle.net/briguy37/2MVFd/
// function generateUUID() {
//     var d = new Date().getTime();
//     var uuid = 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
//         var r = (d + Math.random()*16)%16 | 0;
//         d = Math.floor(d/16);
//         return (c=='x' ? r : (r&0x3|0x8)).toString(16);
//     });
//     return uuid;
// };

////////////////////////////////////////////////////////////////////////
$('#submit-request').validator()
  .on('valid.bs.validator', () => {
      $("#sendMosaicrequest").removeClass('disabled');
  })
  .on('invalid.bs.validator', () => {
      $("#sendMosaicrequest").addClass('disabled');
  });

// $('#sendMosaicrequest').on('click', function (e) {
//     'use strict';
//
//     if (!$('#sendMosaicrequest').hasClass('disabled')) {
//
//         var ids = [];
//         imOverlayGr.eachLayer(function (layer) {
//             ids.push(layer.options.id);
//         });
//
//         const req = {
//             uuid: scope._uuid,
//             bands: $("#band-combination input[name='combination']:checked").attr('data'),
//             mailto : $('#EmailRequest').val(),
//             image_list: '[' + ids   + ']'
//         };
//
//         const text = $.post("{{ RPIX_API }}/landsat/mosaic", JSON.stringify({info: req}));
//
//         $('#myModal').modal('hide');
//         $('#myModal').on('hidden.bs.modal', function(){
//           $(this).find('form')[0].reset();
//         });
//         $('#titleAPI').text('Success');
//         $('#modalAPI').modal();
//     };
// });

////////////////////////////////////////////////////////////////////////
//Filters
const initFilters = () => {
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
        'min': timestamp(scope.filters.date.start),
        'max': timestamp(scope.filters.date.end)
      },
      //behaviour: 'drag',
      connect: true,
      step: 1 * 24 * 60 * 60 * 1000, //one day
      format: wNumb({decimals: 0}),
      start: [timestamp(scope.filters.date.start), timestamp(scope.filters.date.end)]
    });

    const dateRange = Date.parse(scope.filters.date.end) - Date.parse(scope.filters.date.start);
    const range = [Date.parse(scope.filters.date.start) ,
      Date.parse(scope.filters.date.start) + dateRange / 4.,
      Date.parse(scope.filters.date.start) + 2 * dateRange / 4.,
      Date.parse(scope.filters.date.start) + 3 * dateRange / 4., Date.parse(scope.filters.date.end)];

    $("#dateSlider").noUiSlider_pips({
      mode: 'values',
      values: range,
      density: 4,
      stepped: true
    });

    //From Libra by developmentseed (https://github.com/developmentseed/libra)
    $('#dateSlider > .noUi-pips > .noUi-value').each(function () {
      $(this).html(new Date(Number($(this).html())).toISOString().slice(0, 7));
    });

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
    $('#seasonSlider > .noUi-pips > .noUi-value').each(function () {
        const seas = ['spring', 'summer', 'autumn', 'winter'];
        $(this).html(seas[$(this).html()-1])
    });

    $('#seasonSlider').on('set', updateSeason);
    $('#cloud-filter').html('<i class="fa fa-cloud fa-2x"><hbut> : ' + scope.filters.cloud.min + '% - ' + scope.filters.cloud.max + '%</hbut></i>');
    $('#date-filter').html('<i class="fa fa-calendar-o fa-2x"><hbut> : ' + scope.filters.date.start + ' - ' + scope.filters.date.end + '</hbut></i>');
};

function resetFilters(){
    scope.filters.cloud.min = 0;
    scope.filters.cloud.max = 20;
    scope.filters.date.start = new Date('2013-04-01').toISOString().slice(0, 10);
    scope.filters.date.end = new Date().toISOString().slice(0, 10);
    scope.filters.date.seasons = ['spring', 'summer', 'autumn', 'winter'];

    $("#cloudCoverSlider").val([scope.filters.cloud.min, scope.filters.cloud.max]);

    const dateRange = Date.parse(scope.filters.date.end) - Date.parse(scope.filters.date.start);
    $("#dateSlider").val([Date.parse(scope.filters.date.start), Date.parse(scope.filters.date.end)]);
    $("#seasonSlider").val([0, 4]);
    $('#cloud-filter').html('<i class="fa fa-cloud fa-2x"><hbut> : ' + scope.filtervalues.cloudmin + '% - ' + scope.filtervalues.cloudmax + '%</hbut></i>');
    $('#date-filter').html('<i class="fa fa-calendar-o fa-2x"><hbut> : ' + scope.filtervalues.datestart + ' - ' + scope.filtervalues.dateend + '</hbut></i>');
};

const setCloud = () => {
    scope.filters.cloud.min = parseInt($('#cloudCoverSlider').val()[0]);
    scope.filters.cloud.max = parseInt($('#cloudCoverSlider').val()[1]);
    $('#cloud-filter').html('<i class="fa fa-cloud fa-2x"><hbut> : ' + scope.filters.cloud.min + '% - ' + scope.filters.cloud.max + '%</hbut></i>');
};

const updateCloud = () => {
    scope.filters.cloud.min = parseInt($('#cloudCoverSlider').val()[0]);
    scope.filters.cloud.max = parseInt($('#cloudCoverSlider').val()[1]);
    $('#cloud-filter').html('<i class="fa fa-cloud fa-2x"><hbut> : ' + scope.filters.cloud.min + '% - ' + scope.filters.cloud.max + '%</hbut></i>');
    getDataAndUpdate();
};

const setDate = () => {
    scope.filters.date.start = new Date(Number($('#dateSlider').val()[0])).toISOString().slice(0, 10);
    scope.filters.date.end = new Date(Number($('#dateSlider').val()[1])).toISOString().slice(0, 10);
    $('#date-filter').html('<i class="fa fa-calendar-o fa-2x"><hbut> : ' + scope.filters.date.start + ' - ' + scope.filters.date.end + '</hbut></i>');
};

const updateDate = () => {
    scope.filters.date.start = new Date(Number($('#dateSlider').val()[0])).toISOString().slice(0, 10);
    scope.filters.date.end = new Date(Number($('#dateSlider').val()[1])).toISOString().slice(0, 10);
    $('#date-filter').html('<i class="fa fa-calendar-o fa-2x"><hbut> : ' + scope.filters.date.start + ' - ' + scope.filters.date.end + '</hbut></i>');
    getDataAndUpdate();
};

const updateSeason = () => {
    const season = ['spring', 'summer', 'autumn', 'winter'];
    scope.filters.seasons = season.slice($('#seasonSlider').val()[0] , $('#seasonSlider').val()[1]);
    getDataAndUpdate();
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
  }
};

////////////////////////////////////////////////////////////////////////
const closeleftpane = () =>{
  $("#left-pane").addClass("display-none");
  $('#landsat-wall').empty();
  $('#landsat-wall').scrollTop(0);
  map.invalidateSize();
};

const clearall = () => {
  imOverlayGr.clearLayers();
  $("#show-all").removeClass("display-none");
  $("#clear-all").addClass("display-none");
  $("#complete-all").addClass("display-none");

  $("#left-pane").addClass("display-none");
  $('#landsat-wall').empty();
  $('#landsat-wall').scrollTop(0);
  map.invalidateSize();
};

const imOverlayBuilt = (scene) => {

    var polygon = turf.polygon([[
     [scene.upperLeftCornerLongitude, scene.upperLeftCornerLatitude],
     [scene.upperRightCornerLongitude, scene.upperRightCornerLatitude],
     [scene.lowerRightCornerLongitude, scene.lowerRightCornerLatitude],
     [scene.lowerLeftCornerLongitude, scene.lowerLeftCornerLatitude],
     [scene.upperLeftCornerLongitude, scene.upperLeftCornerLatitude]]]);

    var bbox = turf.extent(polygon);
    var anchors = [
     [bbox[3], bbox[0]],
     [bbox[3], bbox[2]],
     [bbox[1], bbox[2]],
     [bbox[1], bbox[0]]];

    var clipCoords = [
      [scene.upperLeftCornerLatitude, scene.upperLeftCornerLongitude],
      [scene.upperRightCornerLatitude, scene.upperRightCornerLongitude],
      [scene.lowerRightCornerLatitude, scene.lowerRightCornerLongitude],
      [scene.lowerLeftCornerLatitude, scene.lowerLeftCornerLongitude],
      [scene.upperLeftCornerLatitude, scene.upperLeftCornerLongitude]];

    var options = {
        attribution: "&copy Landsat imagery courtesy of NASA and USGS",
        id: scene.sceneID,
        rp: scene.rowpath,
        info: {date: scene.date, cloud: scene.cloud},
        clip: clipCoords
    };

    return new L.ImageTransform(scene.browseURL, anchors, options); //https://github.com/ScanEx/Leaflet.imageTransform
};

const complete = () => {
  const rp = [];
  imOverlayGr.eachLayer((layer) => {
    rp.push(layer.options.rp);
  });

  map.spin(true);

  const RowPathKey = Object.keys(footprintGr._layers);
  for (let i = 0; i < RowPathKey.length; i += 1) {
    let layers = footprintGr._layers[RowPathKey[i]];
    if (isInArray(rp, layers.id)) continue;
    scope.scenes = layers.scenes;
    scope.scenes.sort(sortScenesDate);
    imOverlayGr.addLayer(imOverlayBuilt(scope.allscenes[0]));
  }

  imOverlayGr.eachLayer((layer) => {
    layer._image.onclick = () => {
      if (map.dragging.moved()) return;
      imChange(layer);
    }
  });

  $("#show-all").addClass("display-none");
  $("#clear-all").removeClass("display-none");
  map.spin(false);
};

const showall = () => {
  map.spin(true);
  imOverlayGr.clearLayers()
  const RowPathKey = Object.keys(footprintGr._layers);

  for (let i = 0; i < RowPathKey.length; i += 1) {
    let layers = footprintGr._layers[RowPathKey[i]];
    scope.scene = layers.scenes;
    scope.scene.sort(sortScenesDate);
    imOverlayGr.addLayer(imOverlayBuilt(scope.scene[0]));
  };

  imOverlayGr.eachLayer((layer) => {
    layer._image.onclick = () => {
      if (map.dragging.moved()) return;
      imChange(layer);
    }
  });

  $("#show-all").addClass("display-none");
  $("#clear-all").removeClass("display-none");
  map.spin(false);
};

const imgclick = (input) => {

  imOverlayGr.eachLayer((layer) => {
    if (layer.options.rp == scope.scene[input].rowpath) imOverlayGr.removeLayer(layer);
  });

  imOverlayGr.addLayer(imOverlayBuilt(scope.scene[input]));

  $("#complete-all").removeClass("display-none");

  imOverlayGr.eachLayer((layer) => {
    layer._image.onclick = () => {
      if (map.dragging.moved()) return;
      imChange(layer);
    }
  });

};

const imChange = (im) => {
  imOverlayGr.removeLayer(im)
  $("#left-pane").removeClass("display-none");
  $('#landsat-wall').empty();
  $('#landsat-wall').scrollTop(0);

  map.invalidateSize();
  map.spin(true);

  const rp = im.options.rp;
  const lookup = {};
  footprintGr.eachLayer((layer) => {
    lookup[layer.id] = layer;
  });

  scope.scenes = lookup[rp].scenes;
  scope.scenes.sort(sortScenesDate);
  let browse = [];

  for (let i = 0; i < scope.scenes.length; i += 1) {
    browse.push(
      '<div class="result-content">' +
        '<img id="' + scope.scenes[i].sceneID +  '" ' +
        'class="img-thumb"' +
        'data-sizes="auto" src="' + scope.scenes[i].browseURL + '" ' +
        'onclick="imgclick(' + i + ')">' +
        '<div class="result-overlay">' +
          '<div>' +
            '<i class="fa fa-calendar-o"></i>' +
            '<span>  ' + scope.scenes[i].date + '</span>' +
          '</div>' +
          '<div>' +
            '<i class="fa fa-cloud"></i>' +
            '<span>  ' + scope.scenes[i].cloud + ' %</span>' +
          '</div>' +
        '</div>' +
      '</div>');
  }

  $('#landsat-wall').append(browse);
  map.spin(false);

  $("#show-all").addClass("display-none");
  $("#clear-all").removeClass("display-none");
  $("#complete-all").removeClass("display-none");
};

const resetmap = () => {
  editableLayers.clearLayers();
  footprintGr.clearLayers();
  imOverlayGr.clearLayers();

  scope.bounds = undefined;

  $("#left-pane").addClass("display-none");
  $('#landsat-wall').empty();
  $('#landsat-wall').scrollTop(0);
  map.invalidateSize();

  $("#show-all").addClass("display-none");
  $("#clear-all").addClass("display-none");
  $("#complete-all").addClass("display-none");
};

const cleanmap = () => {
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

const onClickRowPath = () => {
  $("#left-pane").removeClass("display-none");
  $('#landsat-wall').empty();
  $('#landsat-wall').scrollTop(0);

  this.bringToBack();
  map.invalidateSize();
  map.spin(true);

  scope.scenes = this.scenes;
  scope.scenes.sort(sortScenesDate);
  let browse = [];

  for (let i = 0; i < scope.scenes.length; i += 1) {
    browse.push(
      '<div class="result-content">' +
        '<img id="' + scope.scenes[i].sceneID +  '" ' +
        'class="img-thumb"' +
        'data-sizes="auto" src="' + scope.scenes[i].browseURL + '" ' +
        'onclick="imgclick(' + i + ')">' +
        '<div class="result-overlay">' +
          '<div>' +
            '<i class="fa fa-calendar-o"></i>' +
            '<span>  ' + scope.scenes[i].date + '</span>' +
          '</div>' +
          '<div>' +
            '<i class="fa fa-cloud"></i>' +
            '<span>  ' + scope.scenes[i].cloud + ' %</span>' +
          '</div>' +
        '</div>' +
      '</div>');
  }

  $('#landsat-wall').append(browse);
  map.spin(false);

  $("#show-all").addClass("display-none");
  $("#clear-all").removeClass("display-none");
  $("#complete-all").removeClass("display-none");
};


const getSeason = (dateIn, lat) => {
  let mDate =  moment(dateIn, "YYYY-MM-DD");
  let doy = mDate.dayOfYear();
  let year = mDate.year();
  let spring = moment({ year :year, month :2, day :21}).dayOfYear();
  let summer = moment({ year :year, month :5, day :21}).dayOfYear();
  let autumn = moment({ year :year, month :8, day :22}).dayOfYear();
  let winter = moment({ year :year, month :11, day :21}).dayOfYear();
  let seas = ['spring', 'summer', 'autumn', 'winter'];
  if (lat < 0) seas.reverse();

  let season = '';
  if (doy < spring || doy >= winter) season = seas[3];
  if (doy >= spring && doy < summer) season = seas[0];
  if (doy >= summer && doy < autumn) season = seas[1];
  if (doy >= autumn && doy < winter) season = seas[2];

  return season;
};

const getDataAndUpdate = () => {

  map.spin(true);
  cleanmap();

  const keys = Object.keys(editableLayers._layers);
  const bounds = editableLayers._layers[keys[0]].getBounds();
  console.log(bounds)
  const feature = {
    'type': 'Feature',
    'geometry': {
      'type': 'Polygon',
      'coordinates': [[
        [bounds[0][0], bounds[0][1]],
        [bounds[1][0], bounds[0][1]],
        [bounds[1][0], bounds[1][1]],
        [bounds[0][0], bounds[1][1]],
        [bounds[0][0], bounds[0][1]]
      ]]
    },
    'properties': {}
  };

  getLandsat(feature)
  // Promise.all(tiles_features.map(getLandsat))
    .then(data => {
      console.log(data);
      const defaultStyle = {
        color: "#000",
        weight: 1.2,
        fill: true,
        fillOpacity: 0,
        opacity: 1
      };

      const highlightStyle = {
        color: '#2262CC',
        weight: 3,
        opacity: 0.6,
        fill: true,
        fillOpacity: 0.65,
        fillColor: '#2262CC'
      };
      const RowPath = Object.keys(date);
      // for (let i = 0; i < RowPath.length; i += 1) {
      //
      //     // create geom with turf union
      //     let fp = results[RowPath[i]][0];
      //     let LL = L.latLng(fp.lowerLeftCornerLatitude, fp.lowerLeftCornerLongitude);
      //     let LR = L.latLng(fp.lowerRightCornerLatitude, fp.lowerRightCornerLongitude);
      //     let UL = L.latLng(fp.upperLeftCornerLatitude, fp.upperLeftCornerLongitude);
      //     let UR = L.latLng(fp.upperRightCornerLatitude, fp.upperRightCornerLongitude );
      //
      //     let poly = L.polygon([LL, LR, UR, UL], defaultStyle)
      //         .on('mouseover', () => {this.setStyle(highlightStyle);})
      //         .on('mouseout', () => {this.setStyle(defaultStyle);})
      //         .on('click', onClickRowPath);
      //
      //     poly.scenes = results[RowPath[i]]; //add all scenes information to polygon
      //     poly.id = RowPath[i];
      //
      //     footprintGr.addLayer(poly);
      // };

      if (RowPath.length === 0) {
        $("div.h4noim").removeClass("display-none");
        $("#show-all").addClass("display-none");
      } else {
        map.fitBounds(footprintGr.getBounds());
        $("div.h4noim").addClass("display-none");
        $("#show-all").removeClass("display-none");
      }
    })
    .catch((err) => {
      console.warn(err);
      $("div.h4noim").removeClass("display-none");
      return false;
    })
    .then(() => {
      map.spin(false);
    });
 };


const getLandsat = (feature) => {

  const sat_api = 'https://api.developmentseed.org/satellites/?search=';

  const jsonRequest = {
    satellite_name:'landsat-8',
    intersects: feature,
    cloud_from: scope.filters.cloud.min,
    cloud_to: scope.filters.cloud.max,
    date_from: scope.filters.date.start,
    date_to: scope.filters.date.end,
    limit: 2000
  };

  return $.ajax({
      url: sat_api,
      type: 'POST',
      data: JSON.stringify(jsonRequest),
      dataType: 'json',
      contentType: 'application/json'
  })
    .then(data => {

      const results = [];

      if (data.hasOwnProperty('errorMessage')) {
        console.warn(data.errorMessage);
        return [];
      }

      if (data.meta.found !== 0) {
          for (let i = 0; i < data.results.length; i += 1) {

              let month = parseInt(data.results[i].date.split('-')[1]);

              let awsID = (Date.parse(data.results[i].date) < Date.parse('2017-05-01')) ? data.results[i].scene_id.replace(/LGN0[0-9]/, 'LGN00'): data.results[i].LANDSAT_PRODUCT_ID;
              if (!/T1$/.exec(data.results[i].LANDSAT_PRODUCT_ID)) continue;

              // for (var i=0; i < data.results.length; i++){
              //     var scene = {};
              //     scene.rowpath = data.results[i].row + '-' + data.results[i].path;
              //     scene.sceneStartTime = moment(data.results[i].sceneStartTime, ["YYYY-MM-DD HH:mm:ss.S", "YYYY:DDD:HH:mm:ss"]).toDate();
              //     scene.sceneStopTime = moment(data.results[i].sceneStopTime, ["YYYY-MM-DD HH:mm:ss.S", "YYYY:DDD:HH:mm:ss"]).toDate();
              //     scene.acquisitionDate = data.results[i].acquisitionDate;
              //     scene.browseAvailable = data.results[i].browseAvailable;
              //     scene.lat = data.results[i].sceneCenterLatitude;
              //     scene.lon = data.results[i].sceneCenterLongitude;
              //
              //     if (scene.lon > 0) {
              //         scene.lon = scene.lon + Math.floor((bounds._southWest.lng + 180) / 360) * 360;
              //     } else {
              //         scene.lon = scene.lon + Math.floor((bounds._northEast.lng + 180) / 360) * 360;
              //     }
              //
              //     scene.browseURL = data.results[i].browseURL;
              //     scene.cloudCover = data.results[i].cloudCover;
              //     scene.cloudCoverFull = data.results[i].cloudCoverFull;
              //     scene.dayOrNight = data.results[i].dayOrNight;
              //     scene.path = data.results[i].path;
              //     scene.row = data.results[i].row;
              //     scene.sceneID = data.results[i].sceneID;
              //     scene.lowerLeftCornerLatitude = data.results[i].lowerLeftCornerLatitude;
              //     scene.lowerRightCornerLatitude = data.results[i].lowerRightCornerLatitude;
              //     scene.upperLeftCornerLatitude = data.results[i].upperLeftCornerLatitude;
              //     scene.upperRightCornerLatitude = data.results[i].upperRightCornerLatitude;
              //     scene.lowerLeftCornerLongitude = data.results[i].lowerLeftCornerLongitude;
              //     scene.lowerRightCornerLongitude = data.results[i].lowerRightCornerLongitude;
              //     scene.upperLeftCornerLongitude = data.results[i].upperLeftCornerLongitude;
              //     scene.upperRightCornerLongitude = data.results[i].upperRightCornerLongitude;
              //     scene.S3 = (data.results[i].hasOwnProperty('S3')) ? true : false;
              //
              //     var diff_L = Math.abs(scene.lowerLeftCornerLongitude - scene.lowerRightCornerLongitude),
              //         diff_U = Math.abs(scene.upperLeftCornerLongitude - scene.upperRightCornerLongitude);
              //     if ((diff_L > 180) || (diff_U > 180)){
              //         if (scene.lowerLeftCornerLongitude < 0) scene.lowerLeftCornerLongitude += 360;
              //         if (scene.upperLeftCornerLongitude < 0) scene.upperLeftCornerLongitude += 360;
              //         if (scene.lowerRightCornerLongitude < 0) scene.lowerRightCornerLongitude += 360;
              //         if (scene.upperRightCornerLongitude < 0) scene.upperRightCornerLongitude += 360;
              //     }
              //
              //     //From Libra by developmentseed (https://github.com/developmentseed/libra)
              //     var lonCorners = ['upperLeftCornerLongitude','upperRightCornerLongitude','lowerRightCornerLongitude','lowerLeftCornerLongitude'];
              //     for (var jj=0; jj < lonCorners.length; jj++){
              //         adjustBound = (scene[lonCorners[jj]] > 0) ? '_southWest' : '_northEast';
              //         scene[lonCorners[jj]] += Math.floor((bounds[adjustBound].lng + 180) / 360) * 360;
              //     };
              //
              //     scene.season = getSeason(scene.acquisitionDate, scene.lat);
              //
              //     if ((scene.S3 == true) && (scene.browseAvailable == "Y") && (scene.dayOrNight == "DAY") && isInArray(scope.filtervalues.seasons, scene.season)){
              //         var rp = scene.rowpath;
              //         if(results.hasOwnProperty(rp)){
              //             results[rp].push(scene);
              //         }else{
              //             results[rp] = [];
              //             results[rp].push(scene);
              //         }
              //     };
              // };

              results.push(awsID);
          }
      }

      results.sort(sortScenes);
      return results;
      // return {'tile': feature.properties.tile, 'landsat': results};

    })
    .catch(err => {
      console.warn(err);
      return [];
      // return {'tile': feature.properties.tile, 'landsat': []};
    });
};

const parseParams = (w_loc) => {
  const param_list = w_loc.replace('?', '').split('&')
  const out_params = {}
  for (let i = 0; i < param_list.length; i++) {
    let tPar = param_list[i].split('=');
    out_params[tPar[0]] = tPar[1]
  }
  return out_params;
};

////////////////////////////////////////////////////////////////////////
//Global Variables
const scope = {
  bounds: undefined,
  scenes: [],
  filters: {
    cloud: {min: 0, max: 20},
    date: {
      start: new Date('2013-04-01').toISOString().slice(0, 10),
      end: new Date().toISOString().slice(0, 10)
    },
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

const osm_url = 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png';
const attribution = '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>';
L.tileLayer(osm_url, {id: 'MapID', attribution: attribution}).addTo(map);

L.control.zoom({position: 'topright'}).addTo(map);

const imOverlayGr = new L.layerGroup().addTo(map);
const footprintGr = new L.featureGroup().addTo(map);

L.easyButton('fa-info', () => {
  $('#modalAbout').modal();
}, 'About');

// L.easyButton('fa-share',
//         function (){
//             var shareurl = "https://remotepixel.ca/projects/landsat8mosaic.html";
//             $("#twitter").attr('href','https://twitter.com/share?text=Create Your Own Landsat 8 Mosaic&url=' + shareurl + '&via=RemotePixel&hashtags=Landsat&via=RemotePixel');
//             $("#linkedin").attr('href','https://www.linkedin.com/shareArticle?mini=true&url=' + shareurl + '&title='+ document.title + '&source=https://remotepixel.ca');
//             $("#facebook").attr('href','https://www.facebook.com/sharer/sharer.php?u=' + shareurl);
//             $('#modalShare-bottom').modal();
//         },
//         'Share it');

L.easyButton('fa-file-text-o', () => {
  const _ids = [];
  imOverlayGr.eachLayer((layer) => {
      _ids.push(layer.options.id);
  });

  if (_ids.length != 0) {
      $('#title-ids').text('Landsat IDs');
      $('#corps-ids').html('<pre style="word-wrap: break-word; white-space: pre-wrap;">' + JSON.stringify(_ids, null, 4) + '</pre>');
      $('#modalIDs').modal();
  }
}, 'Get Landsat IDs');

// L.easyButton('fa-file-image-o', () => {
//   const layers = imOverlayGr.getLayers();
//   if (layers.length != 0) {
//       scope._uuid = generateUUID();
//       $('#myModalLabel').text("Mosaic Creation (RemotePixel API)");
//       $('#uuid-text').text("Task ID: " + scope._uuid);
//       $('#myModal').modal();
//   }
// }, 'mosaic Creation');

L.easyButton('fa-home', () => {
  resetmap();
  resetFilters();
  map.fitWorld();
}, 'Reset');

// Initialise the FeatureGroup to store editable layers
const editableLayers = new L.FeatureGroup();
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

const drawControl = new L.Control.Draw(options);
map.addControl(drawControl);

map.on('draw:created', (e) => {
  const type = e.layerType;
  const layer = e.layer;

  editableLayers.clearLayers();
  editableLayers.addLayer(layer);
  scope.bounds = layer.getBounds();
  getDataAndUpdate();
});

map.on('draw:edited', (e) => {
    const keys = Object.keys( e.layers._layers );
    const layer = e.layers._layers[keys[0]];
    scope.aoiBounds = layer.getBounds();
    landsatQuery(scope.aoiBounds);
});

$(document).ready(() =>  initFilters());
