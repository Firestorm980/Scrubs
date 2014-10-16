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
			propertyName: "percent"
		};

	// The actual plugin constructor
	function Plugin( element, options ) {
		this.element = element;

		this.options = $.extend( {}, defaults, options) ;

		this._defaults = defaults;
		this._name = pluginName;

		this.init();
	}

	$.extend(Plugin.prototype, {

		init: function() {

			var
				$this = $(this.element),
				imagesArray = $this.find('img').toArray(),
				beforeImage = imagesArray[0],
				afterImage = imagesArray[1];

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
				$this = $(el);

			$this.on('mousedown mouseup touchstart touchend', this._transToggle);
			$this.on('mousedown mouseup touchstart touchend touchcancel', this._changeBinding);
			$this.on('mousedown touchstart', this._calcPercent);
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
				inputX = ( event.type === 'mousedown' || event.type === 'mousemove' ) ? event.pageX : event.originalEvent.touches[0].pageX,
				offsetX = $this.offset().left,
				totalWidth = $this.width(),
				positionX = inputX - offsetX,
				percentX = parseInt( (positionX/totalWidth)*100 );

			event.preventDefault();
			$this.data('plugin_Scrubs.percent', percentX);
			Plugin.prototype._scrubTo($this[0], percentX);
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
				isStart = isStartReset || false;

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
			if (Modernizr.csstransforms3d){
				$overlay.css({ transform: 'translate3d(-'+percent+'%, 0, 0)', webkitTransform: 'translate3d(-'+percent+'%, 0, 0)' });
				$image.css({ transform: 'translate3d('+percent+'%, 0, 0)', webkitTransform: 'translate3d('+percent+'%, 0, 0)'});
				$controls.css({ transform: 'translate3d(-'+percent+'%, 0, 0)', webkitTransform: 'translate3d(-'+percent+'%, 0, 0)'});
			}
			else {
				$overlay.css({ transform: 'translateX(-'+percent+'%)', webkitTransform: 'translateX(-'+percent+'%)' });
				$image.css({ transform: 'translateX('+percent+'%)', webkitTransform: 'translateX('+percent+'%)'});
				$controls.css({ transform: 'translateX(-'+percent+'%)', webkitTransform: 'translateX(-'+percent+'%)'});
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