"use strict";

const sat_api_url = 'https://api.developmentseed.org/satellites/?';
const rpix_api_us = '{{ RPIX_API }}';

const random_date = () => {

    $('#list-img').animate({ scrollTop:  0}, 500);

    $("#metaloader").removeClass('off');
    $("#errorMessage").addClass('none');

    let start = moment.utc("2013-04-01");
    const d = start.unix() + Math.random() * (moment.utc().unix() - start.unix());

    const input_date = moment.unix(d).format('YYYY-MM-DD');

    $('#scene-date').text(`Date: ${input_date}`);

    getImages(input_date)
      .then((sceneid) => {
          $('#sceneid').text(`Scene: ${sceneid}`);
          $('#link').attr('href',`https://viewer.remotepixel.ca/?sceneid=${sceneid}`);
          return update_preview(sceneid);
      })
      .catch(err => {
        console.warn(err);
        $("#errorMessage").removeClass('none');
      })
      .then(() => {
        $("#metaloader").addClass('off');
      });
};

document.getElementById("btn-reload").onclick = random_date;

const randomIntFromInterval = (min,max) => {
    return Math.floor(Math.random()*(max-min+1)+min);
};

////////////////////////////////////////////////////////////////////////////////
const parseParams = (w_loc) => {
    const param_list = w_loc.replace('?', '').split('&')
    const out_params = {}
    for (let i = 0; i < param_list.length; i++) {
        let tPar = param_list[i].split('=');
        out_params[tPar[0]] = tPar[1]
    }
    return out_params;
};

const update_preview = (sceneid) => {
  $('#list-img').empty();

  const rgb_comb = [
    '4,3,2',
    '7,6,4',
    '5,4,3',
    '6,5,2',
    '7,6,5',
    '5,6,2',
    '7,5,2',
    '5,6,4',
    '7,5,3',
    '7,5,4',
    '5,7,1',
    '6,5,4']

  return Promise.all(rgb_comb.map((e) => {
    $('#list-img').append(
        `<div data-bands="${e}" class="preview col--4 col--3-ml">` +
          '<img>' +
          '<div id="loader" class="middle-center loading"></div>' +
          `<span class="absolute left top w-full bg-darken5 color-white txt-m">${e}</span>` +
        '</div>')
    return get_preview(sceneid, e);
  }));
};

const get_preview = (sceneid, bands) => {

  const params = {
    scene: sceneid,
    bands: bands
  };

  return $.get(`${rpix_api_us}l8_overview`, params ).done()
    .then(data => {
      $(`[data-bands="${bands}"] img`).attr('src', `data:image/png;base64,${data}`);
      $(`[data-bands="${bands}"] #loader`).addClass('none');
      return true;
    })
    .catch((err) => {
      console.warn(err);
      $(`#${id}`).html('<span>Preview Unavailable</span>');
      return true;
    });
};

const getImages = (date_image) => {

  const query = `${sat_api_url}satellite_name=landsat-8&date=${date_image}&cloud_to=20&limit=2000`;
  const results = [];

  return $.getJSON(query).done()
    .then(data => {
      if (data.meta.found === 0) throw new Error('No data found');

      for (let i = 0; i < data.results.length; i += 1) {
          let awsID = (Date.parse(data.results[i].date) < Date.parse('2017-05-01')) ? data.results[i].scene_id.replace(/LGN0[0-9]/, 'LGN00'): data.results[i].LANDSAT_PRODUCT_ID;
          results.push(awsID);
      }

      const index = randomIntFromInterval(0, results.length - 1)
      return results[index];
    });
};

const params = parseParams(window.location.search)
if (params.sceneid) {
  $("#metaloader").removeClass('off');
  $("#errorMessage").addClass('none');
  update_preview(params.sceneid)
    .catch(err => {
      console.warn(err);
      $("#errorMessage").addClass('none');
    })
    .then(() => {
      $("#metaloader").addClass('off');
    });
} else {
  random_date();
}

console.log("You think you can find something here ?");
