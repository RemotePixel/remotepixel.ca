/*!
 * Start Bootstrap - Grayscale Bootstrap Theme (http://startbootstrap.com)
 * Code licensed under the Apache License v2.0.
 * For details, see http://www.apache.org/licenses/LICENSE-2.0.
 */

var map = L.map('map', {
    center: [40, -20],
    zoom: 2,
    dragging: false,
    touchZoom: false,
    scrollWheelZoom: false,
    doubleClickZoom: false,
    boxZoom: false,
    tap: false,
    zoomControl: false
});   


//var osmUrl='http://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png';
//var osmAttrib='Map data <a href="http://openstreetmap.org">OpenStreetMap</a> contributors';
//var OpenStreetMap = new L.TileLayer(osmUrl, {attribution: osmAttrib}).addTo(map);

//https: also suppported.
var Esri_WorldGrayCanvas = L.tileLayer('http://server.arcgisonline.com/ArcGIS/rest/services/Canvas/World_Light_Gray_Base/MapServer/tile/{z}/{y}/{x}', {
	attribution: 'Tiles &copy; Esri &mdash; Esri, DeLorme, NAVTEQ',
	maxZoom: 16
}).addTo(map);

var url = 'https://dl.dropboxusercontent.com/u/29643591/localisation.geojson';  
var geojsonLayer = L.geoJson.ajax(url, {onEachFeature: function (feature, layer) {
	var html = '<div id="leaflet_pop">'+
    	feature.properties.localisation +'<br>'+
    	'</div>';
	layer.bindPopup(html);
}}).addTo(map);