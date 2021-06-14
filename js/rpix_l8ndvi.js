"use strict";

const search_api = 'https://api.developmentseed.org/satellites/';
const landsat_services = 'https://landsat.services.remotepixel.ca';

mapboxgl.accessToken = '{MAPBOX TOKEN}';

var map = new mapboxgl.Map({
  container: 'map',
  style: 'mapbox://styles/mapbox/satellite-streets-v9',
  center: [-70.50, 40],
  zoom: 3,
  attributionControl: true,
  hash: true,
  minZoom: 3,
  maxZoom: 15
});

map.addControl(new mapboxgl.NavigationControl(), 'top-right');

var draw = new MapboxDraw({
    displayControlsDefault: false,
    controls: {
        point: true,
        polygon: false,
        trash: true
    }
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

const updateNdvi = () => {
    const features = draw.getAll();
    if (features.features.length > 0) task(features.features[0]);
};

map.on('draw.create', (e) => {
  draw.deleteAll();
  draw.add(e.features[0]);
  updateNdvi();
});

map.on('draw.update', updateNdvi);

map.on('draw.delete', () => {
  draw.deleteAll();
  closechart();
});


//********************************************************************//
//From Libra by developmentseed (https://github.com/developmentseed/libra)
const mod = (number, dividend) => {
    return ((number % dividend) + dividend) % dividend;
};

//From Libra by developmentseed (https://github.com/developmentseed/libra)
const zeroPad = (n, c) => {
  let s = String(n);
  if (s.length < c) s = zeroPad('0' + n, c);
  return s;
}

const sortDate = (a, b) => {
  return moment(b.date, 'YYYY-MM-DD') - moment(a.date, 'YYYY-MM-DD');
};

const sortCloud = (a, b) => {
    return a.cloud - b.cloud;
};

//********************************************************************//
const closechart = () => {
    draw.deleteAll();
    $(".chart").removeClass('in');
    $(".info-process").addClass('display-none');
    $(".latlong").addClass('display-none');
    $('#btn-save').addClass('display-none');
    map.resize();
};

const infomodal = () => {$('#modalAbout').modal();};

const save = () => {
  saveSvgAsPng(document.getElementsByTagName("svg")[0], "plot.png");
};

//********************************************************************//
const get_ndvi = (scene, coordinates) =>{
  const lon = coordinates[0];
  const lat = coordinates[1];
  const query = `${landsat_services}/ndvi?scene=${scene}&lat=${lat}&lon=${lon}`;
  return $.getJSON(query).done()
    .then(data => {
      if (data.hasOwnProperty('errorMessage')) throw new Error('API Error');
      return data;
    })
    .catch(err => {
      console.warn(err);
      return {};
    });
};


const get_scenes = (feature) => {

  const lon = feature.geometry.coordinates[0];
  const lat = feature.geometry.coordinates[1];
  const point = turf.point([mod(lon + 180, 360) - 180, lat]);

  const params = {
      contains: `${lon},${lat}`,
      date_from: '2013-04-01',
      date_to: moment().utc().format('YYYY-MM-DD'),
      cloud_from: 0,
      satellite_name: 'landsat-8',
      cloud_to: 20,
      limit: 2000};

  const url_params = Object.keys(params).map(i => `${i}=${params[i]}`).join('&');

  const results = [];

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
          'sceneID': data.results[i].scene_id,
          'productID': data.results[i].LANDSAT_PRODUCT_ID,
          'geom': data.results[i].data_geometry};

        if (moment(scene.date) < moment('2017-05-01')){
          scene.scene_id = scene.sceneID.replace('LGN01', 'LGN00');
        } else {
          scene.scene_id = scene.productID;
        }
        if (turf.inside(point, {'geometry': scene.geom})) results.push(scene);
      };

      const date_scene = results.map(e => {return e.date;});
      const uniquedate = date_scene.filter((itm, i, date_scene) => {
          return i === date_scene.indexOf(itm);
      });

      const landsat_to_process = uniquedate.map((d) => {
        let dd = results.filter((e) => {return e.date === d});
        if (dd.length > 1) dd.sort(sortCloud);
        return dd[0];
      });

      landsat_to_process.sort(sortDate);

      return landsat_to_process;
    })
    .catch(err => {
      console.warn(err);
      return [];
    });
}


const task = (feature) => {
  $(".handle_spin").removeClass('opa');
  $(".info-process").removeClass('display-none');
  $(".info-process span").text("Retrieving Landsat 8 data for the selected point");

  const lon = feature.geometry.coordinates[0].toString().slice(0, 10);
  const lat = feature.geometry.coordinates[1].toString().slice(0, 10);
  $(".latlong span").text(`lat: ${lat} | lon: ${lon}`);
  $(".latlong").removeClass('display-none');

  get_scenes(feature)
    .then(scenes => {
      $(".info-process span").text(`Processing Landsat images (${scenes.length})`);
      return Promise.all(scenes.map(e => {
        return get_ndvi(e.scene_id, feature.geometry.coordinates);
      }))
    })
    .then(data => {
      // sort ndvi date
      data = data.filter(e => {return e.hasOwnProperty('date');});
      if (data.length !== 0) {
        data.sort(sortDate)

        $(".chart").addClass('in');
        $('#btn-save').removeClass('display-none');
        map.resize();

        const ndvi = data.map(function (a) {return a.ndvi; });
        const date_ndvi = data.map(function (a) {return a.date; });
        const cloud = data.map(function (a) {return a.cloud; });

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
                return `${v} (cloud: ${cloud[index]}%)`;
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
