/*
 * jQuery beforeafter-map plugin
 * @author @grahamimac - http://www.twitter.com/grahamimac
 * @version 0.11
 * @date December 17, 2013
 * @category jQuery plugin
 * @license CC Attribution-NonCommercial-ShareAlike 3.0 Unported (CC BY-NC-SA 3.0) - http://creativecommons.org/licenses/by-nc-sa/3.0/
 Original code altered from:
 * jQuery beforeafter plugin
 * @author admin@catchmyfame.com - http://www.catchmyfame.com
 * @version 1.4
 * @date September 19, 2011
 * @category jQuery plugin
 * @copyright (c) 2009 admin@catchmyfame.com (www.catchmyfame.com)
 * @license CC Attribution-NonCommercial-ShareAlike 3.0 Unported (CC BY-NC-SA 3.0) - http://creativecommons.org/licenses/by-nc-sa/3.0/
 *
 *
 * ADAPTED by Vincent Sarago to be responsive
 * 23 June 2015
 *
 * Corrected v1.01
 * 3 July 2015
 *
 * Modification du CSS v2.00
 * 1 Octobre 2015
 *
 * Modification du CSS et ajout fleches v2.01
 * 19 Decembre 2015
 */

(function ($) {
    $.fn.extend({
        beforeAfter: function (_before_, _after_, in_options) {
            var defaults = {
                introDelay : 100,
                introDuration : 1000,
                introPosition : 0.5,
                animateIntro : true,
                pos: 0.5,
                sliderwidth : 4,
				cursor: 'pointer',
				clickSpeed: 600,
				linkDisplaySpeed: 200,
				dividerColor: 'rgba(255, 255, 255, 1)',
			    keypressAmount: 20,
			    onReady: function () {},
			    changeOnResize: true,
			    textOffset: 25
            };

			var options = $.extend(defaults, in_options);

			var randID =  Math.round(Math.random() * 100000000);

			return this.each(function () {
			    var o = options;
			    var obj = $(this);

			    var mapWidth = $('div:first', obj).width();
				var mapHeight = $('div:first', obj).height();

				var _bSelect_ = $('div:first', obj), _aSelect_ = $('div:last', obj),
					_bID_ = $(_before_._container).attr('id'), _aID_ = $(_after_._container).attr('id');

				_before_.options.inertia = false;
				_after_.options.inertia = false;

				// Create an inner div wrapper (dragwrapper) to hold the images.
				$(obj).prepend(
                    '<div id="dragwrapper' + randID + '">' +
                        '<div id="drag' + randID + '">' +
                            '<i class="fa fa-arrows-h "></i>' +
                        '</div>' +
                    '</div>'
                ); // Create drag handle

                $('#dragwrapper'+randID).css({
                    'opacity': 0.25,
                    'position': 'absolute',
                    'right' : '0px',
                    'height': '100%',
                    'width' : o.sliderwidth + 'px',
                    'z-index': 20}
                );

                $('#dragwrapper'+randID + ' .fa').css({
                    'opacity': 0,
                    'position': 'absolute' ,
                    'top': '50%',
                    'left': '-24px',
                    'padding' : '4px',
                    'font-size': '40px',
                    'color' : '#FFF',
                    'border' : '2px solid #FFF',
                    'border-radius' : '50px',
                    'z-index': 21}
                );

				$(_before_._container).css({
                    'position': 'absolute',
                    'overflow': 'hidden',
                    'left': '0px',
                    'z-index': '10',
                    'height' : '100%',
                    'width' : '100%'
                }); // Set CSS properties of the before map div

				$(_after_._container).css({
                    'position':'absolute',
                    'overflow':'hidden',
                    'right':'0px',
                    'height' : '100%',
                    'width' : '100%'
                }); // Set CSS properties of the after map div

                $('#drag'+randID).css({
                    'background': o.dividerColor,
                    'position': 'absolute',
                    'left': '0px',
                    'height': '100%',
                    'width': '100%'
                }); // Set drag handle CSS properties

                $(_before_._container).css({
                    'position': 'absolute',
                    'top': '0px',
                    'left': '0px',
                    'width': '100%',
                    'height': '100%'
                });

				$(_after_._container).css({
                    'position': 'absolute',
                    'top': '0px',
                    'right': '0px',
                    'width': '100%',
                    'height': '100%'
                });

                //$(obj).append('<img src="'+o.imagePath+'lt-small.png" id="lt-arrow'+randID+'"><img src="'+o.imagePath+'rt-small.png" id="rt-arrow'+randID+'">');
		        $(obj).append('<span id="lt-text"></span>');
		        $(obj).append('<span id="rt-text"></span>');

		        var w = $(obj).width();

		        $('#lt-text').css({
                    'position': 'absolute',
                    'z-index': '20',
                    'top': '10px',
                    'right': parseInt( w - $('#dragwrapper'+randID).offset().left + o.textOffset) + 'px'
                });

                $('#rt-text').css({
                    'position': 'absolute',
                    'z-index': '20',
                    'top': '10px',
                    'left': parseInt( $('#dragwrapper'+randID).offset().left + o.textOffset) + 'px'
                });

				// Custom for Our Changing Cities
				if (o.changeOnResize){

				    var cInt;

				    $(window).on('orientationchange pageshow resize', function () {
				        var w = $(obj).width();
				        var h = $(obj).height();

                        $(_before_._container).width(w).height(h);
				        $(_after_._container).width(w).height(h);

                        _before_.invalidateSize();
				        _after_.invalidateSize();
				        clearInterval(cInt);

				        $('#dragwrapper'+randID).css({
                            'left': o.pos * 100 + '%'
                        });

                        $('#lt-text').css({
                            'right': parseInt( w - $('#dragwrapper'+randID).offset().left + o.textOffset) + 'px'
                        });

                        $('#rt-text').css({
                            'left': parseInt( $('#dragwrapper'+randID).offset().left + o.textOffset) + 'px'
                        });

				        cInt = setInterval(function(){
				            $(_before_._container).width(parseInt( $('#dragwrapper'+randID).css('left') ) + 4 );
				            if ($(_before_._container).width() != w){ clearInterval(cInt); }
				        }, 100);
				    });
				}

				$('#dragwrapper'+randID).draggable( { containment:obj, drag:drag, stop:drag }).css('-ms-touch-action', 'none');

				function drag() {
				    $('div:eq(2)', obj).width( parseInt( $(this).css('left') ) + 4 );
				    o.pos = parseInt( $(this).css('left') ) / $(obj).width();

				    var w = $(obj).width();
                    $('#lt-text').css({
                        'right': parseInt( w - $('#dragwrapper'+randID).offset().left + o.textOffset) + 'px'
                    });

                    $('#rt-text').css({
                        'left': parseInt( $('#dragwrapper'+randID).offset().left + o.textOffset) + 'px'
                    });
                    $('#dragwrapper'+randID + ' .fa').css({'opacity' : '1'});
				}

				if (o.animateIntro) {
				    $('div:eq(2)', obj).width(mapWidth);

                    $('#dragwrapper'+randID).css({
                        'right': '0px',
                        'opacity': 1
                    });

				    setTimeout(function(){
				    	$('#dragwrapper'+randID).animate({
                            'right': (mapWidth * o.introPosition) - ($('#dragwrapper'+randID).width()/2)+'px'
                        }, o.introDuration, function(){
                            $('#dragwrapper'+randID).animate(1000);
                        });
                    }, o.introDelay);
				} else {
                    $('#dragwrapper'+randID).animate({'opacity': 1},200);
                }

                $('#dragwrapper'+randID).hover(function(){
                    $('#dragwrapper'+randID + ' .fa').css({'opacity' : '1'},500);
                }, function() {
                    $('#dragwrapper'+randID + ' .fa').css({'opacity' : '0'},500);
                });
			});
        }
    });
})(jQuery);
