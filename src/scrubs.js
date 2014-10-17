/**
 * jQuery Scrubs Plugin
 * @author: Jon Christensen (Firestorm980)
 * @github: https://github.com/Firestorm980/Scrubs
 *
 * Licensed under the MIT License.
 */

// the semi-colon before the function invocation is a safety
// net against concatenated scripts and/or other plugins
// that are not closed properly.
;(function ( $, window, document, undefined ) {


	// Create the defaults once
	var pluginName = "Scrubs",
		defaults = {
			vertical: false
		};

	// The actual plugin constructor
	function Plugin( element, options ) {
		this.element = element;

		this.options = $.extend( {}, defaults, options) ;

		this._defaults = defaults;
		this._name = pluginName;

		this._init();
	}

	$.extend(Plugin.prototype, {
		

		_vars: {
			prefix: '',
			transforms: false,
			transforms3d: false,
		},

		_init: function() {

			var
				$this = $(this.element),
				imagesArray = $this.find('img').toArray(),
				beforeImage = imagesArray[0],
				afterImage = imagesArray[1];

			this._vars.options = this.options;

			
			this._vars.prefix = this._checkWhichTransform();

			// Set our transform supports
			this._checkTransformSupport();

			// Create all the DOM around the initial images
			this._createStructure(this.element, beforeImage, afterImage);

			// Bind all of our handlers
			this._bind(this.element);

			// Reset
			this.reset();
		},

		/**
		 * _bind (PRIVATE)
		 *
		 * Initial binding of events on the element at the start of initiation.
		 */
		_bind: function(el){
			var
				$this = $(el),
				options = this.options;
			console.log(options);

			$this.on('mousedown mouseup touchstart touchend', {options: options}, this._transToggle);
			$this.on('mousedown mouseup touchstart touchend touchcancel', {options: options}, this._changeBinding);
			$this.on('mousedown touchstart', {options: options}, this._calcPercent);
		},

		/**
		 * _createStructure (PRIVATE)
		 * 
		 * Makes the DOM structure that will surround this instance of the scrubber. Gets passed images from initiation.
		 * @param  element beforeImage
		 * @param  element afterImage
		 */
		_createStructure: function(el, beforeImage, afterImage){
			var
				$this = $(el),
				$beforeImage = $(beforeImage),
				$afterImage = $(afterImage),
				$imagePlaceholder = $beforeImage.clone();

			// Add scrubs class so that we can add our style hooks
			$this.addClass('scrubs-scrubber');

			if (this.options.vertical) {
				$this.addClass('scrubs-vertical');
			}

			// Add our data attributes
			$this.attr('data-transition',true).data('plugin_Scrubs.percent',50);

			// DOM changes
			// Scrubs images container
			$this.append('<div class="scrubs-images"></div>');
			// Make the contol bar
			$this.append('<div class="scrubs-controls trans"><span id="scrubsControlsBar" class="scrubs-controls-bar"></span><span id="scrubsControlsHandle" class="scrubs-controls-handle"></span></div>');
			
			// Add classes & IDs
			$imagePlaceholder.addClass('scrubs-image-placeholder');
			$beforeImage.addClass('scrubs-image');
			$afterImage.addClass('scrubs-overlay-image scrubs-image trans');

			// Append elements
			$this.find('.scrubs-images').append($imagePlaceholder).append($beforeImage).append($afterImage);

			// Wrap images
			$beforeImage.wrap('<div class="scrubs-image-container scrubs-image-container-before"></div>');
			$afterImage.wrap('<div class="scrubs-overlay scrubs-image-container scrubs-image-container-after trans"></div>');
		},

		/**
		 * _calcPercent (PRIVATE)
		 *
		 * Comes from the input down and input move events. 
		 * Takes the event information and determines the percent we will scroll to and passes it to the _scrubTo method.
		 */
		_calcPercent: function(event){
			var
				$this = $(this),
				options = event.data.options,
				inputX = ( event.type === 'mousedown' || event.type === 'mousemove' ) ? event.pageX : event.originalEvent.touches[0].pageX,
				inputY = ( event.type === 'mousedown' || event.type === 'mousemove' ) ? event.pageY : event.originalEvent.touches[0].pageY,
				offsetX = $this.offset().left,
				offsetY = $this.offset().top,
				totalWidth = $this.width(),
				totalHeight = $this.height(),
				positionX = inputX - offsetX,
				positionY = inputY - offsetY,
				percentX = parseInt( (positionX/totalWidth)*100 ),
				percentY = parseInt( (positionY/totalHeight)*100 );

			event.preventDefault();


			if (options.vertical){
				$this.data('plugin_Scrubs.percent', percentY);
				Plugin.prototype._scrubTo($this[0], percentY);
			}
			else {
				$this.data('plugin_Scrubs.percent', percentX);
				Plugin.prototype._scrubTo($this[0], percentX);
			}
		},

		/**
		 * _changeBinding (PRIVATE)
		 *
		 * Changes / sets the various binding of the scrubber element as it's being used.
		 */
		_changeBinding: function(event){
			var
				$this = $(this),
				eventType = event.type;

			if (eventType === 'mousedown' || eventType === 'touchstart'){
				$this.on('mousemove touchmove', Plugin.prototype._calcPercent);
				$this.one('mouseleave', Plugin.prototype._changeBinding);
			}
			else if (eventType === 'mouseup' || eventType === 'touchend' || eventType === 'touchcancel') {
				$this.off('mousemove touchmove', Plugin.prototype._calcPercent);
				Plugin.prototype._scrubTo($this[0]);
			}
		},
		/**
		 * _checkTransformSupport (PRIVATE)
		 *
		 * Replacement for Modernizr checks. Checks to see if there is any transform support in the current browser and sets some vars for us.
		 */
		_checkTransformSupport: function(){
			var
				el = document.createElement('div'),
				matrix2d = 'matrix(1, 0, 0, 1, 1, 1)', // proper matrix response
				matrix3d = 'matrix3d(1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1, 0, 1, 1, 1, 1)', // proper matrix3d response
				elMatrix2d,
				elMatrix3d,
				transforms = {
			        'webkitTransform':'-webkit-transform',
			        'OTransform':'-o-transform',
			        'msTransform':'-ms-transform',
			        'MozTransform':'-moz-transform',
			        'transform':'transform'
				};

			// Add it to the body to get the computed style
    		document.body.insertBefore(el, null);

		    for(var t in transforms){
		        if( el.style[t] !== undefined ){

		        	// Check transforms support
		            el.style[t] = 'translate(1px,1px)';
		            elMatrix2d = window.getComputedStyle(el).getPropertyValue(transforms[t]);

		            // Check transforms3d support
		            el.style[t] = 'translate3d(1px,1px, 1px)';
		            elMatrix3d = window.getComputedStyle(el).getPropertyValue(transforms[t]);
		        }
		    }
		 
		    document.body.removeChild(el);

		    if (elMatrix3d !== undefined && elMatrix3d.length > 0 && elMatrix3d !== "none" && elMatrix3d === matrix3d){
		    	this._vars.transforms = true;
		    	this._vars.transforms3d = true;
		    }
		    else if (elMatrix2d !== undefined && elMatrix2d.length > 0 && elMatrix2d !== "none" && elMatrix2d === matrix2d){
		    	this._vars.transforms = true;
		    }
		},

		/**
		 * _checkWhichTransform (PRIVATE)
		 *
		 * Checks which transform property we should be using and returns the proper one.
		 * 
		 * @return string Transform with prefix to use
		 */
		_checkWhichTransform: function(){
			var
				el = document.createElement('fakeelement'),
				transforms = {
			        'webkitTransform':'-webkit-transform',
			        'OTransform':'-o-transform',
			        'msTransform':'-ms-transform',
			        'MozTransform':'-moz-transform',
			        'transform':'transform'
				};

			for(var t in transforms){
				if( el.style[t] !== undefined ){
					return transforms[t];
				}
			}
		},

		/**
		 * _scrubTo (PRIVATE)
		 *
		 * Our workhorse function. Sets the scrubber to various percents of value and moves the elements accordingly.
		 * 
		 * @param  {element}  el
		 * @param  {number}  scrollPercent Percent we will scroll to from 0-100.
		 * @param  {Boolean} isStartReset  Used as a flag for the intial startup and reset functions
		 */
		_scrubTo: function(el, scrollPercent, isStartReset){
			var
				$this = $(el),
				$overlay = $this.find('.scrubs-overlay'),
				$image = $this.find('.scrubs-overlay-image'),
				$controls = $this.find('.scrubs-controls'),
				isInputActive = $this.data('plugin_Scrubs.isInputActive'),
				percent = (100 - scrollPercent) || (100 - $this.data('plugin_Scrubs.percent')),
				isStart = isStartReset || false,
				prefix = this._vars.prefix,
				isVertical = ( this.options.vertical );

			// We've stopped scrubbing.
			if (!isInputActive){
				if (isStart === true){
					percent = 50;
				}
				else if (percent > 50){
					percent = 100;
				}
				else if (percent <= 50){
					percent = 0;
				}
			}

			// Out of bounds
			if ( percent < 0 ) { percent = 0; }
			else if ( percent > 100 ) { percent = 100; }

			// Add percent to data
			$this.data('plugin_Scrubs.percent', -(percent-100) );

			// Move that scrubber
			if (this._vars.transforms3d){
				if (!isVertical){
					$overlay.css(prefix, 'translate3d(-'+percent+'%,0,0)');
					$image.css(prefix, 'translate3d('+percent+'%,0,0)');
					$controls.css(prefix, 'translate3d(-'+percent+'%,0,0)');
				}
				else {
					$overlay.css(prefix, 'translate3d(0,-'+percent+'%,0)');
					$image.css(prefix, 'translate3d(0,'+percent+'%,0)');
					$controls.css(prefix, 'translate3d(0,-'+percent+'%,0)');
				}
			}
			else if (this._vars.transforms) {
				if (!isVertical){
					$overlay.css(prefix, 'translateX(-'+percent+'%)');
					$image.css(prefix, 'translateX('+percent+'%)');
					$controls.css(prefix, 'translateX(-'+percent+'%)');
				}
				else {
					$overlay.css(prefix, 'translateY(-'+percent+'%)');
					$image.css(prefix, 'translateY('+percent+'%)');
					$controls.css(prefix, 'translateY(-'+percent+'%)');
				}
			}
		},

		/**
		 * _transToggle (PRIVATE)
		 * 
		 * Sets the data attribute of the element to true or false in order to run CSS transitions when needed.
		 * Also sets the data of the element so that we know when it's being interacted with.
		 */
		_transToggle: function(event){
			var
				$this = $(this),
				eventType = event.type;

			if (eventType === 'mousedown' || eventType === 'touchstart'){
				$this.attr('data-transition', false);
				$this.data('plugin_Scrubs.isInputActive', true);
			}
			else if (eventType === 'mouseup' || eventType === 'touchend'){
				$this.attr('data-transition', true);
				$this.data('plugin_Scrubs.isInputActive', false);
			}
		},

		/**
		 * Reset (PUBLIC)
		 * 
		 * Sets the scrubber back to the "start" at 50.
		 */
		reset: function(){
			this._scrubTo(this.element, 50, true);
		}
	});

	// A really lightweight plugin wrapper around the constructor,
	// preventing against multiple instantiations
	$.fn[ pluginName ] = function ( options ) {
		var args = Array.prototype.slice.call(arguments, 1);
		this.each(function() {
			var instance = $.data( this, "plugin_" + pluginName );
			if ( !instance ) {
				$.data( this, "plugin_" + pluginName, new Plugin( this, options ) );
			} else {
				// Make sure its an actual method and that it isn't "private"
				if (typeof options === 'string' && options.charAt(0) !== '_'){
					instance[options].apply(instance, args);
				}
			}
		});

		// chain jQuery functions
		return this;
	};

})( jQuery, window, document );