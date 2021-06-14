"use strict";

const search_api = 'https://api.developmentseed.org/satellites/';
const landsat_services = 'https://landsat.services.remotepixel.ca';
const sentinel_services = 'https://sentinel.services.remotepixel.ca';

let list_ndvi_layers = [],
    timer;

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


  const btnsave = document.createElement('button');
  btnsave.className = 'mapboxgl-ctrl-icon';
  btnsave.setAttribute('onclick', 'save()');
  let icn = document.createElement('i');
  icn.className = 'fa fa-save ';
  btnsave.appendChild(icn);
  let grp = document.createElement('div');
  grp.id = 'btn-save';
  grp.className = 'mapboxgl-ctrl-group mapboxgl-ctrl display-none';
  grp.appendChild(btnsave);
  let control = document.getElementsByClassName('mapboxgl-ctrl-top-right');
  control[0].appendChild(grp.cloneNode(true));

  const btnclear = document.createElement('button');
  btnclear.className = 'mapbox-gl-draw_ctrl-draw-btn mapbox-gl-draw_trash';
  btnclear.setAttribute('onclick', 'clearDraw()');
  grp = document.createElement('div');
  grp.className = 'mapboxgl-ctrl-group mapboxgl-ctrl';
  grp.appendChild(btnclear);
  control = document.getElementsByClassName('mapboxgl-ctrl-top-right');
  control[0].appendChild(grp.cloneNode(true));

  const btninfo = document.createElement('button');
  btninfo.className = 'mapboxgl-ctrl-icon';
  btninfo.setAttribute('onclick', 'infomodal()');
  icn = document.createElement('i');
  icn.className = 'fa fa-info ';
  btninfo.appendChild(icn);
  grp = document.createElement('div');
  grp.className = 'mapboxgl-ctrl-group mapboxgl-ctrl';
  grp.appendChild(btninfo);
  control = document.getElementsByClassName('mapboxgl-ctrl-top-right');
  control[0].appendChild(grp.cloneNode(true));

});



const updateNdvi = (feature) => {
  if (feature.geometry.type === 'Polygon') task_polygon(feature);
  if (feature.geometry.type === 'Point') task_point(feature);
};

map.on('draw.create', (e) => {
  $(".chart").removeClass('in');
  $(".date-slider").removeClass('in');
  $('#btn-save').addClass('display-none');
  $(".latlong span").text('');
  $(".latlong").removeClass('display-none');
  map.resize();
  cleanLayer();
  clearPlay();

  draw.deleteAll();
  draw.add(e.features[0]);
  if (e.features[0].geometry.type === 'Polygon') {
    const bbox = turf.bbox(e.features[0]);
    const poly = turf.bboxPolygon(bbox);
    const area = Math.round(turf.area(poly) / 1000000);
    if (area >= 1000) {
      $(".latlong span").text(`Polygon must be < to 1000 km² (currently ${area} km²)`);
      return;
    } else {
      $(".latlong span").text(`Area: ${area} km²`);
    }
  } else {
    const lon = e.features[0].geometry.coordinates[0].toString().slice(0, 10);
    const lat = e.features[0].geometry.coordinates[1].toString().slice(0, 10);
    $(".latlong span").text(`lat: ${lat} | lon: ${lon}`);
  }

  updateNdvi(e.features[0]);
});

map.on('draw.update', (e) => {
  $(".chart").removeClass('in');
  $(".date-slider").removeClass('in');
  $('#btn-save').addClass('display-none');
  $(".latlong span").text('');
  $(".latlong").removeClass('display-none');

  map.resize();
  cleanLayer();
  clearPlay();

  if (e.features[0].geometry.type === 'Polygon') {
    const bbox = turf.bbox(e.features[0]);
    const poly = turf.bboxPolygon(bbox);
    const area = Math.round(turf.area(poly) / 1000000);
    if (area >= 1000) {
      $(".latlong span").text(`Polygon must be < to 1000 km² (currently ${area} km²)`);
      return;
    } else {
      $(".latlong span").text(`Area: ${area} km²`);
    }
  } else {
    const lon = e.features[0].geometry.coordinates[0].toString().slice(0, 10);
    const lat = e.features[0].geometry.coordinates[1].toString().slice(0, 10);
    $(".latlong span").text(`lat: ${lat} | lon: ${lon}`);
  }

  updateNdvi(e.features[0]);
});

//********************************************************************//
const clearDraw = () => {
  $(".chart").removeClass('in');
  $(".date-slider").removeClass('in');
  $(".latlong").addClass('display-none');
  $("#btn-save").addClass('display-none');


  draw.deleteAll();
  cleanLayer();
  clearPlay();
  closechart();
};

const closechart = () => {
    $(".chart").removeClass('in');
    $(".info-process").addClass('display-none');
    $(".latlong").addClass('display-none');
    $("#btn-save").addClass('display-none');
    map.resize();
};

const cleanLayer = () => {
  if (list_ndvi_layers.length === 0) return;
  list_ndvi_layers.map(e => {
    if (map.getLayer(e.scene)) map.removeLayer(e.scene);
    if (map.getSource(e.scene)) map.removeSource(e.scene);
  });
  list_ndvi_layers = [];
};

const clearPlay = () => {
  clearInterval(timer);
  document.getElementById('play-pause').value = 'pause';
  $('#play-pause i').removeClass('fa-stop');
  $('#play-pause i').addClass('fa-play');
};

const infomodal = () => {$('#modalAbout').modal();};

const save = () => {
  saveSvgAsPng(document.getElementsByTagName("svg")[0], "plot.png");
};

const setSlider = () => {
  document.getElementById('dateSlider').min = 0;
  document.getElementById('dateSlider').max = list_ndvi_layers.length - 1;
  document.getElementById('dateSlider').value = 0;
  document.getElementById('dateValue').innerText = list_ndvi_layers[0].date;
  document.getElementById('satValue').innerText = list_ndvi_layers[0].sat;
};

const updateNdviImage = () => {
  const value = document.getElementById('dateSlider').value;
  document.getElementById('dateValue').innerText = list_ndvi_layers[value].date;
  document.getElementById('satValue').innerText = list_ndvi_layers[value].sat;
  list_ndvi_layers.map(e => {
   map.setPaintProperty(e.scene, 'raster-opacity', 0);
  });
  map.setPaintProperty(list_ndvi_layers[value].scene, 'raster-opacity', 1);
};

document.getElementById('dateSlider').addEventListener("change", updateNdviImage);
document.getElementById('dateSlider').addEventListener("input", updateNdviImage);

const step = () => {
  const current = parseInt(document.getElementById('dateSlider').value);
  const next = (current + 1) % list_ndvi_layers.length;
  document.getElementById('dateSlider').value = next;
  document.getElementById('dateSlider').dispatchEvent(new Event('change'));
};

document.getElementById('play-pause').addEventListener("click", () => {
  if (document.getElementById('play-pause').value === 'pause') {
    timer = setInterval(step, 200);
    document.getElementById('play-pause').value = 'play';
    $('#play-pause i').removeClass('fa-play');
    $('#play-pause i').addClass('fa-stop');
  } else {
    clearInterval(timer);
    document.getElementById('play-pause').value = 'pause';
    $('#play-pause i').removeClass('fa-stop');
    $('#play-pause i').addClass('fa-play');
  }
});

//********************************************************************//
//From Libra by developmentseed (https://github.com/developmentseed/libra)
const mod = (number, dividend) => {return ((number % dividend) + dividend) % dividend;};

//From Libra by developmentseed (https://github.com/developmentseed/libra)
const zeroPad = (n, c) => {
  let s = String(n);
  if (s.length < c) s = zeroPad('0' + n, c);
  return s;
}

const sortDate = (a, b) => {
  return moment(a.date, 'YYYY-MM-DD') - moment(b.date, 'YYYY-MM-DD');
};

const sortCloud = (a, b) => {return a.cloud - b.cloud;};

//********************************************************************//
const get_ndvi_point = (scene, feature) =>{
  const lon = feature.geometry.coordinates[0];
  const lat = feature.geometry.coordinates[1];
  const service_url = (scene.sat === 'landsat-8')? landsat_services : sentinel_services;
  const query = `${service_url}/ndvi?scene=${scene.scene_id}&lat=${lat}&lon=${lon}`;
  return $.getJSON(query).done()
    .then(data => {
      if (data.hasOwnProperty('errorMessage')) throw new Error('API Error');
      data.sat = scene.sat;
      return data;
    })
    .catch(err => {
      console.warn(err);
      return {};
    });
};


const get_ndvi_area = (scene, feature) =>{
  const geom = turf.bbox(feature).toString();
  const service_url = (scene.sat === 'landsat-8')? landsat_services : sentinel_services;
  const query = `${service_url}/ndvi_area?scene=${scene.scene_id}&bbox=${geom}`;
  return $.getJSON(query).done()
    .then(data => {
      if (data.hasOwnProperty('errorMessage')) throw new Error('API Error');
      data.sat = scene.sat;
      data.scene = scene.scene_id;
      return data;
    })
    .catch(err => {
      console.warn(err);
      return {};
    });
};


//********************************************************************//
const get_scenes = (feature) => {
  let geom,
      cloud_max;

  if (feature.geometry.type === 'Point') {
    const lon = feature.geometry.coordinates[0];
    const lat = feature.geometry.coordinates[1];
    geom = `${lon},${lat}`
    cloud_max = 20;
  } else {
    geom = turf.bbox(feature).toString();
    cloud_max = 5;
  }

  const params = {
    contains: geom,
    date_from: '2013-04-01',
    date_to: moment().utc().format('YYYY-MM-DD'),
    cloud_from: 0,
    cloud_to: cloud_max,
    limit: 2000};

  const url_params = Object.keys(params).map(i => `${i}=${params[i]}`).join('&');

  const results = {
    'landsat': [],
    'sentinel': []
  };

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
          results['landsat'].push(scene);
        } else {
          scene.scene_id = data.results[i].scene_id;
          results['sentinel'].push(scene);
        }
      };

      //Only get one date per satellite
      const scene_to_process = [].concat.apply([], ['landsat', 'sentinel'].map(e => {
        const date_scene = results[e].map(e => {return e.date;});
        const uniquedate = date_scene.filter((itm, i, date_scene) => {
            return i === date_scene.indexOf(itm);
        });
        return uniquedate.map((d) => {
          let dd = results[e].filter(f => {return f.date === d});
          if (dd.length > 1) dd.sort(sortCloud);
          return dd[0];
        });
      }));

      return scene_to_process;
    })
    .catch(err => {
      console.warn(err);
      return [];
    });
}

const task_polygon = (feature) => {
  $(".handle_spin").removeClass('opa');
  $(".info-process").removeClass('display-none');
  $(".info-process span").text("Retrieving data for the selected point");

  get_scenes(feature)
    .then(scenes => {
      $(".info-process span").text(`Processing ${scenes.length} scenes`);
      return Promise.all(scenes.map(e => {
        return get_ndvi_area(e, feature);
      }))
    })
    .then(data => {
      data = data.filter(e => {return e.hasOwnProperty('date');});
      if (data.length !== 0) {
        data = data.filter(e => {return (e.ndvi !== 0);});
        data.sort(sortDate)

        const bbox = turf.bbox(feature);
        const poly = turf.bboxPolygon(bbox);
        const coor = poly.geometry.coordinates[0].slice(0,4);
        coor.reverse();
        data.map(e => {
          map.addLayer({
            "id": e.scene,
            'type': 'raster',
            "source": {
              'type': 'image',
              'coordinates': coor,
              'url': `data:image/png;base64,${e.ndvi}`
            },
            'paint': {
                 'raster-opacity': 0,
                 'raster-opacity-transition': {duration: 0}
             }
          }, 'gl-draw-polygon-fill-inactive.cold');
          list_ndvi_layers.push({scene: e.scene, date: e.date, sat: e.sat});
        });
        setSlider();
        updateNdviImage();
        $(".date-slider").addClass('in');
      } else {
          $("#noNDVI").removeClass('display-none');
      }
    })
    .catch(err => {
      $("#noNDVI").removeClass('display-none');
      console.warn(err);
    })
    .then(() => {
      $(".info-process").addClass('display-none');
      $(".handle_spin").addClass('opa');
    });

};


const task_point = (feature) => {
  $(".handle_spin").removeClass('opa');
  $(".info-process").removeClass('display-none');
  $(".info-process span").text("Retrieving data for the selected point");

  get_scenes(feature)
    .then(scenes => {
      $(".info-process span").text(`Processing ${scenes.length} scenes`);
      return Promise.all(scenes.map(e => {
        return get_ndvi_point(e, feature);
      }))
    })
    .then(data => {
      data = data.filter(e => {return e.hasOwnProperty('date');});
      if (data.length !== 0) {
        data = data.filter(e => {return (e.ndvi !== 0);});
        data.sort(sortDate)

        $(".chart").addClass('in');
        $('#btn-save').removeClass('display-none');
        map.resize();

        const ndvi = data.map(function (a) {return a.ndvi;});
        const date_ndvi = data.map(function (a) {return a.date;});
        const cloud = data.map(function (a) {return a.cloud;});
        const sat = data.map(function (a) {return a.sat;});

        const chart = c3.generate({
          bindto: '#chart',
          padding: {top: 0, right: 40, bottom: 0, left: 40},
          legend: {hide: true},
          data: {
            x: 'x',
            columns: [['x'].concat(date_ndvi), ['ndvi'].concat(ndvi)]
          },
          axis: {
            x: {
              type: 'timeseries',
              tick: {rotate: 20, format: '%Y-%m-%d', fit: true}
            },
            y: {max: 1, min: -0.2}
          },
          tooltip: {
            format: {
              value: (value, ratio, id, index) => {
                let v = value.toString().slice(0, 5);
                let s = sat[index];
                return `${v} (cloud: ${cloud[index]}% | sat: ${s})`;
              }
            }
          }
        });
      } else {
          $("#noNDVI").removeClass('display-none');
      }
    })
    .catch(err => {
      $("#noNDVI").removeClass('display-none');
      console.warn(err);
    })
    .then(() => {
      $(".info-process").addClass('display-none');
      $(".handle_spin").addClass('opa');
    });

};

$(document).ready(function () {
    $(".handle_spin").addClass('opa');
    $('#modalAbout').modal();
});
