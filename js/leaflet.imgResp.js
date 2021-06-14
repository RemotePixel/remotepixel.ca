L.ImageOverlayResp = L.ImageOverlay.extend({

    options: {
      clickable: true // Add option clickable befault true
    },

    onAdd: function(map){
      L.ImageOverlay.prototype.onAdd.call(this, map);
      this._initInteraction();
    },

    _initInteraction: function () {

        if (!this.options.clickable) { return this; }

        L.DomUtil.addClass(this._image, 'leaflet-clickable');

        L.DomEvent.on(this._image, 
'click dblclick mousedown mouseup mouseover mouseout contextmenu keypress',
                this._fireMouseEvent, this);

        if (L.Handler.MarkerDrag) {
            this.dragging = new L.Handler.MarkerDrag(this);

            if (this.options.draggable) {
                this.dragging.enable();
            }
        }

        return this;
    },

    _fireMouseEvent: function (e, type) {
        // to prevent outline when clicking on keyboard-focusable marker
        if (e.type === 'mousedown') {
            L.DomEvent.preventDefault(e);
        }

        if (e.type === 'click' && this.dragging && this.dragging.moved()) { return; }

        if (e.type === 'keypress' && e.keyCode === 13) {
            type = 'click';
        }

        if (this._map) {
            this._map._fireMouseEvent(this, e, type, true, this._latlng);
        }
    },

    _initImage: function () {
        var img = this._image = L.DomUtil.create('img',
                'leaflet-image-layer ' + (this._zoomAnimated ? 'leaflet-zoom-animated' : ''));

        img.onselectstart = L.Util.falseFn;
        img.onmousemove = L.Util.falseFn;

        img.onload = L.bind(this.fire, this, 'load');
        img.src = this._url;

        // Urban extension
        img.alt=this.options.alt;
        img.title=this.options.title;
    }

});

/*
 * Popup extension to L.ImageOverlayResp, adding popup-related methods.
 */
L.ImageOverlayResp.include({

    // Location relative to the center of the overlay
    bindPopup: function (content, options) {
        var anchor = L.point(this.options.popupAnchor || [0, 0])
            .add(L.Popup.prototype.options.offset);

        options = L.extend({offset: anchor}, options);
        var c = this._bounds.getCenter();

        return L.Layer.prototype.bindPopup.call(this, content, options);
    },

    _openPopup: L.Layer.prototype.togglePopup,

    // Called from popup...
    getCenter: function(){
      return this._bounds.getCenter();
    }
});