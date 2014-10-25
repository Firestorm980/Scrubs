/**
 * jQuery Scrubs Plugin
 * @author: Jon Christensen (Firestorm980)
 * @github: https://github.com/Firestorm980/Scrubs
 * @version: 0.3.1
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
			// Options
			controls: true, // Output the default controls. Useful for making custom / alternative controls.
			input: true, // Set if manual user controls are active. Useful for making custom / alternative controls. 
			startAt: 50, // Number to start the scrubber on. Will also "reset" to this number.	
			sticky: false, // Keeps the scrubber at a position instead of snapping to an end
			vertical: false, // Sets whether the scrubber should work in Y axis
			width: 'auto', // Sets the maximum width of the scrubber. If left to 'auto', will be responsive as big as the image. Number can't be bigger than the images being scrubbed.

			// Callbacks
			onInit: function(){}, // Callback when the scrubber is ready
			onStart: function(){}, // Callback when a person begins scrubbing (only applies when input is true)
			onScrub: function(){}, // Callback when a person is scrubbing (only applies when input is true)
			onComplete: function(){}, // Callback when a person stops scrubbing (happens immediately after scrub input up, or upon calling scrubTo)
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
			prefix: '', // Store the browser prefix for CSS transforms
			transforms: false, // Does this browser support 2D CSS Transforms?
			transforms3d: false, // Does this browser support 3D CSS Transforms?
		},

		/**
		 * _init (PRIVATE)
		 * 
		 * Start me up!
		 */
		_init: function() {
			var
				$this = $(this.element),
				imagesArray = $this.find('img').toArray(),
				beforeImage = imagesArray[0],
				afterImage = imagesArray[1];

			// Set our transform supports
			this._checkTransformSupport();

			// Check our prefix for this browser
			this._vars.prefix = this._checkWhichTransform();

			// Create all the DOM around the initial images
			this._constructor(this.element, beforeImage, afterImage);

			// Bind all of our handlers
			this._bind(this.element);

			// Reset
			this.reset();

			// Call the init callback, if any
			if ( this._isFunction(this.options.onInit) ) {
				this.options.onInit.call(this);
			}
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

			if (options.input){
				$this.on('mousedown mouseup touchstart touchend', {options: options}, this._transToggle);
				$this.on('mousedown mouseup touchstart touchend touchcancel', {options: options}, this._changeBinding);
				$this.on('mousedown touchstart', {options: options}, this._calcPercent);
			}
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

			event.preventDefault(); // Stop from doing the default action.

			// Check if we're vertical. Send the appropriate calculation.
			if (options.vertical){
				Plugin.prototype._setPercent($this, percentY);
				Plugin.prototype._scrubTo($this[0], options, percentY); // Scrub this to the percent the user is on
			}
			else {
				Plugin.prototype._setPercent($this, percentX);
				Plugin.prototype._scrubTo($this[0], options, percentX); // Scrub this to the percent the user is on
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
				eventType = event.type,
				options = event.data.options;

			if (eventType === 'mousedown' || eventType === 'touchstart'){
				$this.on('mousemove touchmove', {options: options}, Plugin.prototype._calcPercent);
				$this.one('mouseleave', {options: options}, Plugin.prototype._changeBinding);
			}
			else if (eventType === 'mouseup' || eventType === 'touchend' || eventType === 'touchcancel') {
				$this.off('mousemove touchmove', Plugin.prototype._calcPercent);
				Plugin.prototype._scrubTo($this[0], options);
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
		 * _constructor (PRIVATE)
		 * 
		 * Makes the DOM structure that will surround this instance of the scrubber. Gets passed images from initiation.
		 * @param  element beforeImage
		 * @param  element afterImage
		 */
		_constructor: function(el, beforeImage, afterImage){
			var
				$this = $(el),
				$beforeImage = $(beforeImage),
				$afterImage = $(afterImage),
				$imagePlaceholder = $beforeImage.clone(),
				maxWidth = $beforeImage.width(),
				optWidth = this.options.width;

			// Add scrubs class so that we can add our style hooks
			$this.addClass('scrubs-scrubber');

			// Check vertical option. Add appropriate styling.
			// Style changes direction of controls.
			if (this.options.vertical) {
				$this.addClass('scrubs-vertical');
			}

			// Check responsive option. Add appropriate styling.
			if (optWidth !== 'auto' && !isNaN(optWidth) && optWidth <= maxWidth){
				$this.css({ width: optWidth });
			}
			else {
				$this.css({ maxWidth: maxWidth });
			}

			// Add our data attributes
			$this.attr('data-transition',true);
			this._setPercent($this, 50);

			// DOM changes
			// Scrubs images container
			$this.append('<div class="scrubs-images"></div>');

			// Make the contol bar, if we wanted one.
			if (this.options.controls){
				$this.append('<div class="scrubs-controls scrubs-trans"><span id="scrubsControlsBar" class="scrubs-controls-bar"></span><span id="scrubsControlsHandle" class="scrubs-controls-handle"></span></div>');
			}
			
			// Add classes & IDs
			$imagePlaceholder.addClass('scrubs-image-placeholder');
			$beforeImage.addClass('scrubs-image');
			$afterImage.addClass('scrubs-overlay-image scrubs-image scrubs-trans');

			// Append elements
			$this.find('.scrubs-images').append($imagePlaceholder).append($beforeImage).append($afterImage);

			// Wrap images
			$beforeImage.wrap('<div class="scrubs-image-container scrubs-image-container-before"></div>');
			$afterImage.wrap('<div class="scrubs-overlay scrubs-image-container scrubs-image-container-after scrubs-trans"></div>');
		},
		/**
		 * _isFunction
		 *
		 * Check to see if the object passed is a function.
		 * @param  {object}  possibleFunction The object to test
		 * @return {Boolean}                  
		 */
		_isFunction: function(possibleFunction){
			return (typeof(possibleFunction) === typeof(Function));
		},

		/**
		 * _scrubTo (PRIVATE)
		 *
		 * Our workhorse function. Sets the scrubber to various percents of value and moves the elements accordingly.
		 * 
		 * @param  {element}  	el 							Element that we're working with
		 * @param  {object} 	options						Passing options object from / to functions
		 * @param  {number}  	scrollPercent 				Percent we will scroll to from 0-100.
		 * @param  {Boolean} 	isStartingNumberBoolean		Used as a flag for the intial startup and reset functions
		 * @param  {Boolean}	isStickyBoolean				Used as a flag for the public 'scrollTo' function. Lets us set 1-time sticky scrubbing.
		 */
		_scrubTo: function(el, options, scrollPercent, isStartingNumberBoolean, isStickyBoolean){
			var
				$this = $(el),
				$overlay = $this.find('.scrubs-overlay'),
				$image = $this.find('.scrubs-overlay-image'),
				$controls = $this.find('.scrubs-controls'),

				isInputActive = $this.data('plugin_Scrubs.isInputActive'),
				isStartingNumber = isStartingNumberBoolean || false,
				isSticky = isStickyBoolean || false,
				isVertical = ( options.vertical ),
				
				percent = ( !isNaN(scrollPercent) ) ? (100 - scrollPercent) : (100 - $this.data('plugin_Scrubs.percent')),

				prefix = this._vars.prefix,
				startingNumber = ( options.startAt > 100 || options.startAt < 0 ) ? 50 : options.startAt;

			// We've stopped scrubbing.
			if (!isInputActive){
				// If this is the starting number (used for 'reset' function)
				if (isStartingNumber === true){
					percent = -(startingNumber-100); // Go to the startAt number
				}
				// Check if the scrubber is sticky or if we specified we want this scrub to be sticky
				else if (!options.sticky && !isSticky) {
					// Its not. Snap to edges.
					if (percent > 50){
						percent = 100;
					}
					else if (percent <= 50){
						percent = 0;
					}
				}
			}

			// Out of bounds
			if ( percent < 0 ) { percent = 0; }
			else if ( percent > 100 ) { percent = 100; }

			// Add percent to data
			this._setPercent($this, -(percent-100));

			// Move that scrubber
			// But first, check for 3D transform support 
			if (this._vars.transforms3d){
				// Check if vertical and if not, translate on X
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
			// Check for 2D transform support
			else if (this._vars.transforms) {
				// Check if vertical and if not, translate on X
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

			// Call the callbacks, if any
			if ( this._isFunction(options.onScrub) && !isStartingNumber && isInputActive ){
				options.onScrub.call(this, -(percent-100));
			}
			else if ( this._isFunction(options.onComplete) && !isStartingNumber && !isInputActive ){
				options.onComplete.call(this, -(percent-100));
			}
		},

		/**
		 * _setPercent (PRIVATE)
		 *
		 * Remebers percents so you don't have to!
		 * 
		 * @param {object} el      jQuery object
		 * @param {number} percent Percent to set our data to.
		 */
		_setPercent: function(el, percent){
			this.percent = percent;
			el.data('plugin_Scrubs.percent', percent);
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
				eventType = event.type,
				options = event.data.options;

			if (eventType === 'mousedown' || eventType === 'touchstart'){
				$this.attr('data-transition', false); // Change our transition state for CSS.
				$this.data('plugin_Scrubs.isInputActive', true); // Change our flag for the _scrubTo function.

				// Call the onStart callback, if any
				if ( Plugin.prototype._isFunction(options.onStart) ){
					options.onStart.call(this, this.percent);
				}
			}
			else if (eventType === 'mouseup' || eventType === 'touchend'){
				$this.attr('data-transition', true); // Change our transition state for CSS.
				$this.data('plugin_Scrubs.isInputActive', false); // Change our flag for the _scrubTo function.
			}
		},

		/**
		 * reset (PUBLIC)
		 * 
		 * Sets the scrubber back to the "start" at the "startAt" option (default 50).
		 */
		reset: function(){
			this._scrubTo(this.element, this.options, this.options.startAt, true);
		},

		/**
		 * end (PUBLIC)
		 * 
		 * Sets the scrubber to 100.
		 */
		end: function(){
			this._scrubTo(this.element, this.options, 100, false);
		},

		/**
		 * start (PUBLIC)
		 * 
		 * Sets the scrubber to 0.
		 */
		start: function(){
			this._scrubTo(this.element, this.options, 0, false);
		},

		/**
		 * scrubTo (PUBLIC)
		 *
		 * Programically set the scrubber to a certain percentage and whether it should 'stick' when completed.
		 * 
		 * @param  {Number} 	number 	User should input the number of percent they want to scrub to
		 * @param  {Boolean} 	sticky 	Specifies if this particular scrub should 'stick' or snap. False or undefined to snap.
		 */
		scrub: function(number, sticky){
			if ( !isNaN(number) ){
				this._scrubTo(this.element, this.options, number, false, sticky);
			}
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