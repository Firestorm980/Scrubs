/*
// http://paulirish.com/2011/requestanimationframe-for-smart-animating/
// http://my.opera.com/emoller/blog/2011/12/20/requestanimationframe-for-smart-er-animating
// requestAnimationFrame polyfill by Erik Möller. fixes from Paul Irish and Tino Zijdel
// MIT license
(function(){var b=0;var c=["ms","moz","webkit","o"];for(var a=0;a<c.length&&!window.requestAnimationFrame;++a){window.requestAnimationFrame=window[c[a]+"RequestAnimationFrame"];window.cancelAnimationFrame=window[c[a]+"CancelAnimationFrame"]||window[c[a]+"CancelRequestAnimationFrame"];}if(!window.requestAnimationFrame){window.requestAnimationFrame=function(h,e){var d=new Date().getTime();var f=Math.max(0,16-(d-b));var g=window.setTimeout(function(){h(d+f);},f);b=d+f;return g;};}if(!window.cancelAnimationFrame){window.cancelAnimationFrame=function(d){clearTimeout(d);};}}());
*/
$(document).ready(function(){
/*
	$('#scrubber').on('pointerdown pointerup', scrubber.transToggle);
	$('#scrubber').on('pointerdown pointerup pointercancel', scrubber.binding);
	$('#scrubber').on('pointerdown', scrubber.calcPercent);

	scrubber.init();
*/
	$('#scrubber').Scrubs();

});
/*
var scrubber = {

	isPointerDown: false,
	rAF: 0,
	percent: 0,

	init: function(){
		scrubber.percent = 50;
		scrubber.scrubTo();
	},

	transToggle: function(event){
		var
			$scrubber = $('#scrubber');

		if (event.type === 'pointerdown') {
			$scrubber.attr('data-transition', 'false');
			scrubber.isPointerDown = true;
		}
		else if (event.type === 'pointerup'){
			$scrubber.attr('data-transition', 'true');
			scrubber.isPointerDown = false;
		}
	},

	binding: function(event){
		var
			$scrubber = $('#scrubber');
		if (event.type === 'pointerdown') {
			$scrubber.on('pointermove', scrubber.calcPercent);
			$scrubber.one('pointerleave', scrubber.binding);

			cancelAnimationFrame(scrubber.rAF);
			scrubber.rAF = requestAnimationFrame(scrubber.scrubTo);
		}
		else if (event.type === 'pointerup' || event.type === 'pointercancel' || event.type === 'pointerleave'){
			$scrubber.off('pointermove', scrubber.calcPercent);
		}
	},

	calcPercent: function(event){
		var 
			$scrubber = $('#scrubber'),
			pointerX = event.originalEvent.clientX,
			offsetX = $scrubber.offset().left,
			totalWidth = $scrubber.width(),
			positionX = pointerX - offsetX,
			percentX = parseInt((positionX/totalWidth)*100);

		event.preventDefault(); // Fixes chrome android issue
		scrubber.percent = percentX;
	},

	scrubTo: function(){
		if (scrubber.isPointerDown) {
			scrubber.rAF = requestAnimationFrame(scrubber.scrubTo);
		}
			var 
				$scrubber = $('#scrubber'),
				$overlay = $('#scrubberOverlay'),
				$image = $('#scrubberOverlayImage'),
				$controls = $('#scrubberControls'),
				rawValue = scrubber.percent,
				value = (100 - rawValue);

			// We've stopped. Go to the close end.
			if (!scrubber.isPointerDown) {
				if (value > 50){
					value = 100;
				}
				else if (value <= 50){
					value = 0;
				}
			}

			// Out of bounds
			if (value < 0) { value = 0;}
			else if (value > 100) { value = 100;}

			// Add percent to data
			$scrubber.attr('data-percent', -(value-100));

			if (Modernizr.csstransforms3d){
				$overlay.css({ transform: 'translate3d(-'+value+'%, 0, 0)', webkitTransform: 'translate3d(-'+value+'%, 0, 0)' });
				$image.css({ transform: 'translate3d('+value+'%, 0, 0)', webkitTransform: 'translate3d('+value+'%, 0, 0)'});
				$controls.css({ transform: 'translate3d(-'+value+'%, 0, 0)', webkitTransform: 'translate3d(-'+value+'%, 0, 0)'});
			}
			else {
				$overlay.css({ transform: 'translateX(-'+value+'%)', webkitTransform: 'translateX(-'+value+'%)' });
				$image.css({ transform: 'translateX('+value+'%)', webkitTransform: 'translateX('+value+'%)'});
				$controls.css({ transform: 'translateX(-'+value+'%)', webkitTransform: 'translateX(-'+value+'%)'});
			}
	}
};
*/


