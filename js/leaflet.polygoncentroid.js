/*
 * L.Polygon implements polygon vector layer (closed polyline with a fill inside).
 */

L.Polygon = L.Polygon.extend({
	getLatLng: function () {		

		//console.log(this);
		
		var layer = this._layer,
		latlngs = layer._latlngs,
		length = latlngs.length,
		contour = [],
		latlng,
		i = 0,
		swctx,
		center;

		for (; i < length; i++) {
			latlng = latlngs[i];
			contour.push(new poly2tri.Point(latlng.lat, latlng.lng));
		}
		swctx = new poly2tri.SweepContext(contour);
		swctx.triangulate();
		this.triangles = swctx.getTriangles();
		this.triangle = this._largestTriangle();
		center = this._centerOfTriangle();
		return L.LatLng(center.x, center.y)
		this._latlng = new L.LatLng(center.x, center.y);
	}
});