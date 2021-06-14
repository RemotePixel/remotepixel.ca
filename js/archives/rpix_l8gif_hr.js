/*jslint browser: true*/
/*global $, jQuery, alert*/
/*global L, lealfet, alert*/
/*global moment, moment, alert*/
/*global console, console, alert*/


// Create a basemap
var map = L.map('map', {
    zoomControl: false,
    attributionControl: false,
    scrollWheelZoom: true,
    inertia: false,
    minZoom: 2,
    maxZoom: 17
});


L.control.attribution({prefix: "<a href='https://remotepixel.ca/' target='_blank'>&copy; RemotePixel", position: 'bottomright'}).addTo(map);
L.control.zoom({position: 'bottomright'}).addTo(map);

L.tileLayer('https://api.tiles.mapbox.com/v4/{id}/{z}/{x}/{y}.png?access_token={accessToken}', {
    attribution: "Map Data: <a href='http://www.mapbox.com/about/maps/' target='_blank'>&copy; Mapbox &copy; OpenStreetMap</a>",
    id: 'vincentsarago.3a6fdab2',
    accessToken: '{MAPBOX TOKEN}'
}).addTo(map);


map.fitWorld();
// random volcanoes locations


$(document).ready(function () {
    $(".handle_spin").addClass('opa');
    //$('#modalUnderConstruction').modal();
});
