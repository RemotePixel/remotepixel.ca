L.Control.SliderControl = L.Control.extend({
    options: {
        position: 'topright',
        layers: null,
        timeAttribute: 'time',
        isEpoch: false,     // whether the time attribute is seconds elapsed from epoch
        startTimeIdx: 0,    // where to start looking for a timestring
        timeStrLength: 10,  // the size of  yyyy-mm-dd hh:mm:ss - if millis are present this will be larger
        maxValue: -1,
        minValue: 0,
        showAllOnStart: true,
        markers: null,
        range: false,
        follow: false,
        alwaysShowDate : true,
        rezoom: null
    },

    initialize: function (options) {
        L.Util.setOptions(this, options);
        this._layer = this.options.layer;

    },

    extractTimestamp: function(time, options) {
        if (options.isEpoch) {
            time = (new Date(parseInt(time))).toString(); // this is local time
        }
        return time.substr(options.startTimeIdx, options.startTimeIdx + options.timeStrLength);
    },

    setPosition: function (position) {
        var map = this._map;

        if (map) {
            map.removeControl(this);
        }

        this.options.position = position;

        if (map) {
            map.addControl(this);
        }
        this.startSlider();
        return this;
    },

    onAdd: function (map) {
        this.options.map = map;

        // Create a control sliderContainer with a jquery noui slider
        var sliderContainer = L.DomUtil.create('div', 'slider', this._container);        
        $(sliderContainer).append(
        		'<div class="leaflet-slider" id="leaflet-slider">\
    			    <hbut id="slider-timestamp" style="width:100%; color:#FFF; text-align:center;"></hbut>\
        			<div id="slider"></div>\
        		</div>'
        );
        
        //Prevent map panning/zooming while using the slider
        $(sliderContainer).mousedown(function () {
            map.dragging.disable();
        });
        $(document).mouseup(function () {
            map.dragging.enable();
            //Hide the slider timestamp if not range and option alwaysShowDate is set on false
            if (options.range || !options.alwaysShowDate) {
                $('#slider-timestamp').html('');
            }
        });

        var options = this.options;
        this.options.markers = [];

        //If a layer has been provided: calculate the min and max values for the slider
        if (this._layer) {
            var index_temp = 0;
            this._layer.eachLayer(function (layer) {
                options.markers[index_temp] = layer;
                ++index_temp;
            });
            options.maxValue = index_temp - 1;
            this.options = options;
        } else {
            console.log("Error: You have to specify a layer via new SliderControl({layer: your_layer});");
        }
        return sliderContainer;
    },

    onRemove: function (map) {
        //Delete all markers which where added via the slider and remove the slider div
        for (i = this.options.minValue; i < this.options.maxValue; i++) {
        	map.removeLayer(this.options.markers[i]);
        }
        $('#leaflet-slider').remove();
    },

    startSlider: function () {
        _options = this.options;
        _extractTimestamp = this.extractTimestamp
        var index_start = _options.minValue;
        if(_options.showAllOnStart){
            index_start = _options.maxValue;
            if(_options.range) _options.values = [_options.minValue,_options.maxValue];
            else _options.value = _options.maxValue;
        }
        
        
        //$('#leaflet-slider').Link('lower').to($('#slider-timestamp'));
        $("#slider").noUiSlider({
        	
            step: 1,
            start: index_start,
            format: wNumb({ decimals: 0 }),
            range: {
                'min': _options.minValue,
                'max': _options.maxValue
            },     
            step: 1,
        });
        
        $('#slider').on('slide', function () {
        	
        	var ui = Number($("#slider").val())

        	var map = _options.map;
            var fg = L.featureGroup();
            if(!!_options.markers[ui]) {
                // If there is no time property, this line has to be removed (or exchanged with a different property)
                if(_options.markers[ui].feature !== undefined) {
                    if(_options.markers[ui].feature.properties[_options.timeAttribute]){
                        if(_options.markers[ui]) $('#slider-timestamp').html(
                            _extractTimestamp(_options.markers[ui].feature.properties[_options.timeAttribute], _options));
                    }else {
                        console.error("Time property "+ _options.timeAttribute +" not found in data");
                    }
                }else {
                    // set by leaflet Vector Layers
                    if(_options.markers [ui].options[_options.timeAttribute]){
                        if(_options.markers[ui]) $('#slider-timestamp').html(
                            _extractTimestamp(_options.markers[ui].options[_options.timeAttribute], _options));
                    }else {
                        console.error("Time property "+ _options.timeAttribute +" not found in data");
                    }
                }
                
                var i;
                
                // clear markers
                for (i = _options.minValue; i <= _options.maxValue; i++) {
                    if(_options.markers[i]) map.removeLayer(_options.markers[i]);
                }
                if(_options.range){
                    // jquery ui using range
                    for (i = ui[0]; i <= ui[1]; i++){
                       if(_options.markers[i]) {
                    	   map.addLayer(_options.markers[i]);
                           fg.addLayer(_options.markers[i]);
                       }
                    }
                }else if(_options.follow){
                    for (i = ui - _options.follow + 1; i <= ui ; i++) {
                        if(_options.markers[i]) {
                            map.addLayer(_options.markers[i]);
                            fg.addLayer(_options.markers[i]);
                        }
                    }
                }else{
                    for (i = _options.minValue; i <= ui ; i++) {
                        if(_options.markers[i]) {
                            map.addLayer(_options.markers[i]);
                            fg.addLayer(_options.markers[i]);
                        }
                    }
                }
            };
            if(_options.rezoom) {
                map.fitBounds(fg.getBounds(), {
                    maxZoom: _options.rezoom
                });
            }
        });
        
        if (!_options.range && _options.alwaysShowDate) {
            $('#slider-timestamp').html(_extractTimestamp(_options.markers[index_start].options[_options.timeAttribute], _options));
        }
        for (i = _options.minValue; i <= index_start; i++) {
            _options.map.addLayer(_options.markers[i]);
        }
        
        
    }
});

L.control.sliderControl = function (options) {
    return new L.Control.SliderControl(options);
};
