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
 */

(function($){
    $.fn.extend({ 
        beforeAfter: function(_before_,_after_,options){
            var defaults = {
                animateIntro : true,
                introDelay : 10,
                introDuration : 100,
                introPosition : 0.5,
                pos: 0.5,
                beforeLinkText: 'Show only before',
				afterLinkText: 'Show only after',
				imagePath : '/images/',
				cursor: 'pointer',
				clickSpeed: 600,
				linkDisplaySpeed: 200,
				dividerColor: 'rgba(0,0,0,0.7)',
			    keypressAmount: 20,
			    onReady: function(){},
			    changeOnResize: true,
			    permArrows: false,
			    textOffset: 25,
			    arrowTop: 0.5,
			    arrowLeftOffset: 0,
			    arrowRightOffset: 0
            };

			var options = $.extend(defaults, options);
			
			var randID =  Math.round(Math.random()*100000000);
			
			return this.each(function(){
			    var o=options;
			    var obj = $(this);
			
			    var mapWidth = $('div:first', obj).width();
				var mapHeight = $('div:first', obj).height();
				var lArrOffsetStatic = -24;
				var rArrOffsetStatic = 24;
			            
				//$(obj)
				//.width(mapWidth)
				//.height(mapHeight)
				//.css({'overflow':'hidden','position':'relative','padding':'0','width':'100%','height':'100%'});
				        
				var _bSelect_ = $('div:first', obj), _aSelect_ = $('div:last', obj),
					_bID_ = $(_before_._container).attr('id'), _aID_ = $(_after_._container).attr('id');
				            
				_before_.options.inertia = false;
				_after_.options.inertia = false;
				            
				// Create an inner div wrapper (dragwrapper) to hold the images.
				$(obj).prepend('<div id="dragwrapper' + randID + '"><div id="drag' + randID + '"><img width="8" height="56" alt="handle" src="'+o.imagePath+'handle.gif" id="handle'+randID+'" /></div></div>'); // Create drag handle
				$('#dragwrapper'+randID).css({'opacity':.25,'position':'absolute','left':'50%','z-index':'20'}).width($('#handle'+randID).width()).css({'height':'100%'}).css('left', '-=' + ($('#handle'+randID).width()/2)+'px');
				
				$(_before_._container).height(mapHeight).width(mapWidth*o.introPosition).css({'position':'absolute','overflow':'hidden','left':'0px','z-index':'10'}); // Set CSS properties of the before map div
				$(_after_._container).height(mapHeight).width(mapWidth).css({'position':'absolute','overflow':'hidden','right':'0px'}); // Set CSS properties of the after map div
				$('#drag'+randID).width(2).height(mapHeight).css({'background':o.dividerColor,'position':'absolute','left':'3px','height':'100%'}); // Set drag handle CSS properties
				$(_before_._container).css({'position':'absolute','top':'0px','left':'0px','width':'100%','height':'100%'});
				$(_after_._container).css({'position':'absolute','top':'0px','right':'0px','width':'100%','height':'100%'});
				$('#handle'+randID).css({'z-index':'100','position':'relative', 'cursor':o.cursor, 'top':'50%','left':'-3px'}).css('top', '-=' + ($('#handle'+randID).height()/2)+'px');
				$(obj).append('<img src="'+o.imagePath+'lt-small.png" id="lt-arrow'+randID+'"><img src="'+o.imagePath+'rt-small.png" id="rt-arrow'+randID+'">');

		        $(obj).append('<h4 id="lt-text"></h4>');
		        $(obj).append('<h4 id="rt-text"></h4>');
		        
		        w = $(obj).width();
		        $('#lt-text').css({'z-index':'20','position':'absolute','top':'10px','right': w - parseInt( $('#dragwrapper'+randID).css('left'))}).css('right', '+=' + o.textOffset + 'px');
		        $('#rt-text').css({'z-index':'20','position':'absolute','top':'10px','left': parseInt( $('#dragwrapper'+randID).css('left'))}).css('left', '+=' + o.textOffset + 'px');
		        
				// Custom for Our Changing Cities
				if (o.changeOnResize){
				    var cInt;
				    $(window).on('orientationchange pageshow resize', function () {				    	
				        w = $(obj).width();
				        h = $(obj).height();				        
				        $(_before_._container).width(w).height(h);
				        $(_after_._container).width(w).height(h);
				        _before_.invalidateSize();
				        _after_.invalidateSize();
				        clearInterval(cInt);
				        
				        $('#dragwrapper'+randID).css({'left': o.pos*100 + '%', 'height': '100%'})				        
				        $('#handle'+randID).css({'position':'relative', 'cursor':o.cursor, 'top':'50%','left':'-3px'}).css('top', '-=' + ($('#handle'+randID).height()/2)+'px');
				        $('#lt-arrow'+randID).css({'top':'50%', 'left':parseInt($('#dragwrapper'+randID).css('left'))+o.arrowLeftOffset+lArrOffsetStatic+'px'}).css('top', '-='+$('#lt-arrow'+randID).height()/2+'px');
				        $('#rt-arrow'+randID).css({'top':'50%', 'left':parseInt($('#dragwrapper'+randID).css('left'))+o.arrowRightOffset+rArrOffsetStatic+'px'}).css('top', '-='+$('#rt-arrow'+randID).height()/2+'px');
				        
				        $('#lt-text').css({'right': w - parseInt( $('#dragwrapper'+randID).css('left'))}).css('right', '+=' + o.textOffset + 'px');
				        $('#rt-text').css({'left': parseInt( $('#dragwrapper'+randID).css('left'))}).css('left', '+=' + o.textOffset + 'px');
					    				        
				        cInt = setInterval(function(){
				            $(_before_._container).width(parseInt( $('#dragwrapper'+randID).css('left') ) + 4 );
				            if ($(_before_._container).width() != w){ clearInterval(cInt); }
				        }, 100);
				    });
				}
				
				$('#dragwrapper'+randID).draggable( { containment:obj, drag:drag, stop:drag }).css('-ms-touch-action', 'none');
				
				function drag() {
					
				    if (!o.permArrows){
				        $('#lt-arrow'+randID+', #rt-arrow'+randID).stop().css('opacity',0);
				    }
				    
				    $('div:eq(2)', obj).width( parseInt( $(this).css('left') ) + 4 );
				    
				    if (o.permArrows){
				        $('#lt-arrow'+randID).css({'z-index':'20','position':'absolute','top':'50%','left':parseInt($('#dragwrapper'+randID).css('left'))+o.arrowLeftOffset+lArrOffsetStatic+'px'}).css('top', '-='+$('#lt-arrow'+randID).height()/2+'px');
				        $('#rt-arrow'+randID).css({'z-index':'20','position':'absolute','top':'50%','left':parseInt($('#dragwrapper'+randID).css('left'))+o.arrowRightOffset+rArrOffsetStatic+'px'}).css('top', '-='+$('#rt-arrow'+randID).height()/2+'px');
				    }
				    
				    o.pos = parseInt( $(this).css('left') ) / $(obj).width();
				    
				    w = $(obj).width();
			        $('#lt-text').css({'right':  w - parseInt($('#dragwrapper'+randID).css('left'))}).css('right', '+=' + o.textOffset + 'px');
			        $('#rt-text').css({'left': parseInt( $('#dragwrapper'+randID).css('left'))}).css('left', '+=' + o.textOffset + 'px');
				}
		
				if(o.animateIntro) {
				    $('div:eq(2)', obj).width(mapWidth);
				    $('#dragwrapper'+randID).css('left',mapWidth-($('#dragwrapper'+randID).width()/2)+'px');
				    
				    setTimeout(function(){
				    	$('#dragwrapper'+randID).css({'opacity':1}).animate({'left':(mapWidth*o.introPosition)-($('#dragwrapper'+randID).width()/2)+'px'},o.introDuration,function(){$('#dragwrapper'+randID).animate({'opacity':.25},1000)});
				    	$('div:eq(2)', obj).width(mapWidth).animate({'width':mapWidth*o.introPosition+'px'},o.introDuration,function(){clickit();o.onReady.call(this);});
				    },o.introDelay);

				} else {
				    clickit();
				    o.onReady.call(this);
				}
		
				function clickit(){
				    if (o.permArrows){
				    	$('#lt-arrow'+randID).css({'z-index':'20','position':'absolute','top':'50%','left':parseInt($('#dragwrapper'+randID).css('left'))+o.arrowLeftOffset+lArrOffsetStatic+'px'}).css('top', '-='+$('#lt-arrow'+randID).height()/2+'px');
				        $('#rt-arrow'+randID).css({'z-index':'20','position':'absolute','top':'50%','left':parseInt($('#dragwrapper'+randID).css('left'))+o.arrowRightOffset+rArrOffsetStatic+'px'}).css('top', '-='+$('#rt-arrow'+randID).height()/2+'px');
				    }

				    $(obj).hover(function(){
				    	if (!o.permArrows){
			    	    	$('#lt-arrow'+randID).stop().css({'z-index':'20','position':'absolute','top':'50%','left':parseInt($('#dragwrapper'+randID).css('left'))+o.arrowLeftOffset+lArrOffsetStatic+6+'px'}).animate({opacity:1,left:parseInt($('#lt-arrow'+randID).css('left'))-6+'px'},200).css('top', '-='+$('#lt-arrow'+randID).height()/2+'px');
			                $('#rt-arrow'+randID).stop().css({'position':'absolute','top':'50%','left':parseInt($('#dragwrapper'+randID).css('left'))+o.arrowRightOffset+rArrOffsetStatic-6+'px'}).animate({opacity:1,left:parseInt($('#rt-arrow'+randID).css('left'))+6+'px'},200).css('top', '-='+$('#rt-arrow'+randID).height()/2+'px');
			            }
				        
			            $('#dragwrapper'+randID).animate({'opacity':1},200);
				        
				        },function(){
				        	if (!o.permArrows){
				        		$('#lt-arrow'+randID).animate({opacity:0, left:parseInt($('#lt-arrow'+randID).css('left')) + o.arrowLeftOffset-6+'px'}, 350).css({'top':'50%'}).css('top', '-='+$('#lt-arrow'+randID).height()/2+'px');
				                $('#rt-arrow'+randID).animate({opacity:0, left:parseInt($('#rt-arrow'+randID).css('left')) + o.arrowRightOffset+6+'px'}, 350).css({'top':'50%'}).css('top', '-='+$('#rt-arrow'+randID).height()/2+'px');
				            }
				            $('#dragwrapper'+randID).animate({'opacity':.25},350);
				        }
				    );
				    $(obj).one('mousemove', function(){$('#dragwrapper'+randID).stop().animate({'opacity':1},500);}); // If the mouse is over the container and we animate the intro, we run this to change the opacity when the mouse moves since the hover event doesnt get triggered yet
				}
		
			});
        }
    });
})(jQuery);   