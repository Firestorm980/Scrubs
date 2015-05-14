/**
 * jQuery Scrubs Plugin
 * @author: Jon Christensen (Firestorm980)
 * @github: https://github.com/Firestorm980/Scrubs
 * @version: 0.5
 *
 * Licensed under the MIT License.
 */

/*
    The semi-colon before the function invocation is a safety net against
    concatenated scripts and/or other plugins which may not be closed properly.

    "undefined" is used because the undefined global variable in ECMAScript 3
    is mutable (ie. it can be changed by someone else). Because we don't pass a
    value to undefined when the anonymyous function is invoked, we ensure that
    undefined is truly undefined. Note, in ECMAScript 5 undefined can no
    longer be modified.

    "window" and "document" are passed as local variables rather than global.
    This (slightly) quickens the resolution process.
*/
;(function ( $, window, document, undefined ) {
    
    'use strict';

    /*
        Store the name of the plugin in the "pluginName" variable. This
        variable is used in the "Plugin" constructor below, as well as the
        plugin wrapper to construct the key for the "$.data" method.

        More: http://api.jquery.com/jquery.data/
    */
    var pluginName = 'Scrubs';

    /**
     * Additional plugin variables. 
     * These are not dependant on the particular element.
     */
    var transform = '';
    var supports2dTransforms = false;
    var supports3dTransforms = false;
    var scheduledAnimationFrame = false;

    // Create the plugin constructor
    function Plugin ( element, options ) {
        /*
            Provide local access to the DOM node(s) that called the plugin,
            as well local access to the plugin name and default options.
        */
        this.element = element;
        this._name = pluginName;
        this._defaults = $.fn[ pluginName ].defaults;

        this.options = $.extend( {}, this._defaults, options );

        this._init();
    }

    // Avoid Plugin.prototype conflicts
    $.extend(Plugin.prototype, {

        // Initialization logic
        _init: function () {
            var plugin = this;
           
            // Check for transform support and if it is 2D or 3D
            plugin._checkTransformSupport();

            // Normalize our transform property
            plugin._setTransformProperty();

            // Set our universal requestAnimationFrame shim
            plugin._setRAF();

            // Set some vars
            plugin._buildCache();

            // Build the DOM elements
            plugin._scrubsConstruct();

            // Bind the events for controlling it
            plugin._bindEvents();

            // Reset
            plugin.reset();

            // Call the init callback, if any
            if ( plugin._isFunction( plugin.options.onInit) ) {
                plugin.options.onInit.call(plugin);
            }
        },

        // Remove plugin instance completely
        _destroy: function() {
            /*
                The destroy method unbinds all events for the specific instance
                of the plugin, then removes all plugin data that was stored in
                the plugin instance using jQuery's .removeData method.

                Since we store data for each instance of the plugin in its
                instantiating element using the $.data method (as explained
                in the plugin wrapper below), we can call methods directly on
                the instance outside of the plugin initalization, ie:
                $('selector').data('plugin_myPluginName').someOtherFunction();

                Consequently, the destroy method can be called using:
                $('selector').data('plugin_myPluginName').destroy();
            */
            this._unbindEvents();
            this.$element.removeData();
        },

        // Cache DOM nodes for performance
        _buildCache: function () {
            /*
                Create variable(s) that can be accessed by other plugin
                functions. For example, "this.$element = $(this.element);"
                will cache a jQuery reference to the elementthat initialized
                the plugin. Cached variables can then be used in other methods. 
            */
            this.$element = $(this.element); // Store the element

            // Inertia Object
            // Just so all the related vars are stored nicely for each plugin instance
            var momentum = {
                velocity: 0,
                amplitude: 0,
                current: { x: 0, y: 0, time: 0 },
                last: { x: 0, y: 0, time: 0 },
                delta: { x: 0, y: 0, time: 0 },
                timestamp: 0,
                percent: 0,
                frame: null,
            };

            this.momentum = momentum; // Store the momentum vars
        },

        // Bind events that trigger methods
        _bindEvents: function() {
            var 
                plugin = this,
                options = plugin.options,
                $el = plugin.$element;
            
            // If we're using the bulit in input handlers
            if ( options.input ){
                // Mouse handlers
                $el.on('mousedown'+'.'+plugin._name, function( event ){ 
                    plugin._transitionToggle.call(plugin, event); 
                    plugin._changeBinding.call(plugin, event);
                    plugin._calculatePercent.call(plugin, event);
                });
                $el.on('mouseup'+'.'+plugin._name, function( event ){ 
                    plugin._transitionToggle.call(plugin, event);
                    plugin._changeBinding.call(plugin, event);
                });

                // Touch handlers
                $el.on('touchstart'+'.'+plugin._name, function( event ){ 
                    plugin._transitionToggle.call(plugin, event); 
                    plugin._changeBinding.call(plugin, event);
                    plugin._calculatePercent.call(plugin, event);
                });
                $el.on('touchend'+'.'+plugin._name, function( event ){ 
                    plugin._transitionToggle.call(plugin, event);
                    plugin._changeBinding.call(plugin, event);
                });
                $el.on('touchcancel'+'.'+plugin._name, function( event ){ 
                    plugin._changeBinding.call(plugin, event);
                });
            }
        },

        // Unbind events that trigger methods
        _unbindEvents: function() {
            /*
                Unbind all events in our plugin's namespace that are attached
                to "this.$element".
            */
            this.$element.off('.'+this._name);
        },

        /**
         * Comes from the input down and input move events. 
         * Takes the event information and determines the percent we will scroll to and passes it to the _scrubTo method.
         */
        _calculatePercent: function(event){
            var
                plugin = this,
                options = plugin.options,
                momentum = plugin.momentum,
                $el = $(plugin.element),
                eventType = event.type,
                inputX = ( eventType === 'mousedown' || eventType === 'mousemove' ) ? event.pageX : event.originalEvent.touches[0].pageX,
                inputY = ( eventType === 'mousedown' || eventType === 'mousemove' ) ? event.pageY : event.originalEvent.touches[0].pageY,
                offsetX = $el.offset().left,
                offsetY = $el.offset().top,
                totalWidth = $el.width(),
                totalHeight = $el.height(),
                positionX = inputX - offsetX,
                positionY = inputY - offsetY,
                percentX = parseInt( (positionX/totalWidth)*100 ),
                percentY = parseInt( (positionY/totalHeight)*100 ),

                // Momentum calcuations and variables
                current = { x: percentX, y: percentY, time: Date.now() },
                last = momentum.last,
                delta = { x: current.x-last.x, y: current.y-last.y, time: current.time-last.time };

            // Cache our delta and current percentages
            momentum.delta = delta;
            momentum.last = current;

            event.preventDefault(); // Stop from doing the default action.

            // Check if we're vertical. Send the appropriate calculation.
            if (options.vertical){
                momentum.velocity = 0.8 * ( 1000 * delta.y / ( 1 + delta.time ) ) + 0.2 * momentum.velocity; // Get our velocity for momentum
                plugin._setPercent.call(plugin, percentY); // Set the percentage of the scrubber
                plugin._scrubTo.call(plugin, percentY); // Scrub this to the percent the user is on
            }
            else {
                momentum.velocity = 0.8 * ( 1000 * delta.x / ( 1 + delta.time ) ) + 0.2 * momentum.velocity; // Get our velocity for momentum
                plugin._setPercent.call(plugin, percentX); // Set the percentage of the scrubber
                plugin._scrubTo.call(plugin, percentX); // Scrub this to the percent the user is on
            }
        },

        /**
         * Changes / sets the various binding of the scrubber element as it's being used.
         */
        _changeBinding: function(event){
            var
                plugin = this,
                options = plugin.options,
                $el = plugin.$element,
                eventType = event.type;

            switch ( eventType ){
                // Start
                case 'mousedown':
                case 'touchstart':
                    $el.on('mousemove'+'.'+plugin._name, function( event ){
                        // Wait for the next available frame
                        if ( !scheduledAnimationFrame ){
                            scheduledAnimationFrame = true;
                            requestAnimFrame( function(){
                                plugin._calculatePercent.call(plugin, event);
                            } );
                        }
                    });
                    // This pretty much serves the same purpose as a 'touchcanel', but for a mouse
                    $el.one('mouseleave'+'.'+plugin._name, function( event ){
                        plugin._changeBinding.call(plugin, event);
                    });
                    $el.on('touchmove'+'.'+plugin._name, function( event ){
                        // Wait for the next available frame
                        if ( !scheduledAnimationFrame ){
                            scheduledAnimationFrame = true;
                            requestAnimFrame( function(){
                                plugin._calculatePercent.call(plugin, event);
                            } );
                        }
                    });

                    break;
                // End
                case 'mouseup':
                case 'touchend':
                case 'touchcancel':
                    // Unbind the move handlers
                    $el.off('mousemove'+'.'+plugin._name);
                    $el.off('touchmove'+'.'+plugin._name);
                        // Are we doing momentum scrubbing?
                        if ( !options.momentum ){ 
                            // Don't forget to do our final scrub (if needed)
                            plugin._scrubTo.call(plugin); 
                        }
                        else {
                            // This calls _scrubTo just a little differently.
                            plugin._momentumUp.call(plugin);
                        }
                    break;
            }
        },

        /*
         * Replacement for Modernizr checks. 
         * Checks to see if there is any transform support in the current browser and sets some vars for us.
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
            // Don't need it anymore for checks. Get rid of it.
            document.body.removeChild(el);
            // If you support 3D transforms...
            if (elMatrix3d !== undefined && elMatrix3d.length > 0 && elMatrix3d !== "none" && elMatrix3d === matrix3d){
                supports3dTransforms = true; // Set 3D true
            }
            // If you only support 2D transforms
            if (elMatrix2d !== undefined && elMatrix2d.length > 0 && elMatrix2d !== "none" && elMatrix2d === matrix2d){
                supports2dTransforms = true; // Set 2D true
            }
        },

        /**
         * Sets up which transform property we would use and if it should be prefixed.
         * Saves it in a var for later use.
         */
        _setTransformProperty: function(){
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
                    transform = transforms[t]; // Set our transform variable to the appropriate string
                }
            }
        },

        /**
         * Check to see if the object passed is a function.
         * @param  {object}  possibleFunction The object to test
         * @return {Boolean}                  
         */
        _isFunction: function(possibleFunction){
            return (typeof(possibleFunction) === typeof(Function));
        },


        _momentumUp: function(){
            var
                plugin = this,
                momentum = plugin.momentum,
                percent = plugin.$element.data('plugin_' + pluginName + '.percent'); // Grab the current percent so we can calculate the end percent

            // Do do this if we didn't move that far
            if ( momentum.velocity > 10 || momentum.velocity < -10 ){
                momentum.amplitude = plugin.options.friction * momentum.velocity; // Get our amplitude and set it.
                momentum.timestamp = Date.now(); // Track when we let go
                momentum.percent = Math.round( percent + momentum.amplitude); // Our end percent
                requestAnimFrame( function(){ plugin._momentumScrub.call(plugin); } ); // Do the first momentum frame
            }
        },

        _momentumScrub: function(){
            var
                plugin = this,
                momentum = plugin.momentum,
                deltaTime = Date.now() - momentum.timestamp,
                deltaPercent = -momentum.amplitude * Math.exp( -deltaTime / 325 ),
                isInputActive = plugin.$element.data('plugin_' + pluginName + '.isInputActive');

            if ( !isInputActive ){
                // Only move if the amplitude is bigger than 0 and if the delta warrants the change
                if ( momentum.amplitude && ( deltaPercent > 1 || deltaPercent < -1 ) ){
                    // Go to the next frame
                    // The percentage will eventually get closer to the target percent
                    plugin._scrubTo.call(plugin, ( momentum.percent + deltaPercent ), false, true );

                    // Wait for the next available frame.
                    if ( !scheduledAnimationFrame ){
                        scheduledAnimationFrame = true;
                        momentum.frame = requestAnimFrame( function(){ plugin._momentumScrub.call( plugin ); } ); // Repeat this function as needed until we're close enough to the target
                    }
                }
                else {
                    // Wait for the next available frame.
                    if ( !scheduledAnimationFrame ){
                        scheduledAnimationFrame = true;
                        momentum.frame = requestAnimFrame( function(){
                            plugin._scrubTo.call( plugin, momentum.percent, false, true ); // Go to our final destination.
                            plugin.$element.attr('data-transition', true); // We should be at our final destination. We can turn transitions back on.
                        });
                    }
                }
            }
            else {
                return;
            }
        },

        _momentumReset: function(event){
            var
                plugin = this,
                options = plugin.options,
                momentum = plugin.momentum,
                $el = $(plugin.element),
                eventType = event.type,
                inputX = ( eventType === 'mousedown' || eventType === 'mousemove' ) ? event.pageX : event.originalEvent.touches[0].pageX,
                inputY = ( eventType === 'mousedown' || eventType === 'mousemove' ) ? event.pageY : event.originalEvent.touches[0].pageY,
                offsetX = $el.offset().left,
                offsetY = $el.offset().top,
                totalWidth = $el.width(),
                totalHeight = $el.height(),
                positionX = inputX - offsetX,
                positionY = inputY - offsetY,
                percentX = parseInt( (positionX/totalWidth)*100 ),
                percentY = parseInt( (positionY/totalHeight)*100 ),

                // Momentum calcuations and variables
                current = { x: percentX, y: percentY, time: Date.now() },
                last = current,
                delta = { x: 0, y: 0, time: 0 };
            
            console.log( 'reset' );
            // Cache our delta and percents
            momentum.delta = delta;
            momentum.current = current;
            momentum.last = last;

            cancelRequestAnimFrame( momentum.frame );
        },

        /**
         * Makes the DOM structure that will surround this instance of the scrubber. Gets passed images from initiation.
         * @param  element beforeImage
         * @param  element afterImage
         */
        _scrubsConstruct: function(){
            var
                plugin = this,
                options = plugin.options,
                $element = plugin.$element,
                imagesArray = $element.find('img').toArray(),
                beforeImage = imagesArray[0],
                afterImage = imagesArray[1],
                $beforeImage = $(beforeImage),
                $afterImage = $(afterImage),
                $imagePlaceholder = $beforeImage.clone(),
                maxWidth = $beforeImage.width();

            // Add scrubs class so that we can add our style hooks
            $element.addClass('scrubs-scrubber').css({ maxWidth: maxWidth });

            // Check vertical option. Add appropriate styling.
            // Style changes direction of controls.
            if ( options.vertical ){
                $element.addClass('scrubs-vertical');
            }

            // Go to fallback if transforms unsupported.
            if ( !supports2dTransforms ){
                $element.addClass('scrubs-fallback');
            }

            // Add our data attributes
            $element.attr('data-transition',true);

            // DOM changes
            // Scrubs images container
            $element.append('<div class="scrubs-images"></div>');

            // Make the contol bar, if we wanted one.
            if (options.controls){
                $element.append('<div class="scrubs-controls scrubs-trans"><span id="scrubsControlsBar" class="scrubs-controls-bar"></span><span id="scrubsControlsHandle" class="scrubs-controls-handle"></span></div>');
            }
            
            // Add classes & IDs
            $imagePlaceholder.addClass('scrubs-image-placeholder');
            $beforeImage.addClass('scrubs-image');
            $afterImage.addClass('scrubs-overlay-image scrubs-image scrubs-trans');

            // Append elements
            $element.find('.scrubs-images').append($imagePlaceholder).append($beforeImage).append($afterImage);

            // Wrap images
            $beforeImage.wrap('<div class="scrubs-image-container scrubs-image-container-before"></div>');
            $afterImage.wrap('<div class="scrubs-overlay scrubs-image-container scrubs-image-container-after scrubs-trans"></div>');
        },

        /**
         * Our workhorse function. 
         * Sets the scrubber to various percents of value and moves the elements accordingly.
         * 
         * @param  {element}    el                          Element that we're working with
         * @param  {object}     options                     Passing options object from / to functions
         * @param  {number}     scrollPercent               Percent we will scroll to from 0-100.
         * @param  {Boolean}    isStartingNumberBoolean     Used as a flag for the intial startup and reset functions
         * @param  {Boolean}    isStickyBoolean             Used as a flag for the public 'scrollTo' function. Lets us set 1-time sticky scrubbing.
         */
        _scrubTo: function(scrollPercent, isStartingNumberBoolean, isStickyBoolean){
            var
                plugin = this,
                options = plugin.options,
                $el = plugin.$element,
                $overlay = $el.find('.scrubs-overlay'),
                $image = $el.find('.scrubs-overlay-image'),
                $controls = $el.find('.scrubs-controls'),

                isInputActive = $el.data('plugin_' + pluginName + '.isInputActive'),
                isStartingNumber = isStartingNumberBoolean || false,
                isSticky = isStickyBoolean || false,
                isVertical = ( options.vertical ),
                
                percent = ( !isNaN(scrollPercent) ) ? (100 - scrollPercent) : (100 - $el.data('plugin_' + pluginName + '.percent')),

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
            plugin._setPercent.call(plugin, -(percent-100) );

            // Move that scrubber
            // But first, check for 3D transform support 
            if ( supports3dTransforms ){
                // Check if vertical and if not, translate on X
                if (!isVertical){
                    $overlay.css(transform, 'translate3d(-'+percent+'%,0,0)');
                    $image.css(transform, 'translate3d('+percent+'%,0,0)');
                    $controls.css(transform, 'translate3d(-'+percent+'%,0,0)');
                }
                else {
                    $overlay.css(transform, 'translate3d(0,-'+percent+'%,0)');
                    $image.css(transform, 'translate3d(0,'+percent+'%,0)');
                    $controls.css(transform, 'translate3d(0,-'+percent+'%,0)');
                }
            }
            // Check for 2D transform support
            else if ( supports2dTransforms ) {
                // Check if vertical and if not, translate on X
                if (!isVertical){
                    $overlay.css(transform, 'translateX(-'+percent+'%)');
                    $image.css(transform, 'translateX('+percent+'%)');
                    $controls.css(transform, 'translateX(-'+percent+'%)');
                }
                else {
                    $overlay.css(transform, 'translateY(-'+percent+'%)');
                    $image.css(transform, 'translateY('+percent+'%)');
                    $controls.css(transform, 'translateY(-'+percent+'%)');
                }
            }
            // No transforms? Lame.
            // Do some fallback work.
            else {
                if (!isVertical){
                    $overlay.css({ right: percent+'%' });
                    $image.css({ left: percent+'%' });
                    $controls.css({ right: percent+'%' });
                }
                else {
                    $overlay.css({ bottom: percent+'%' });
                    $image.css({ top: percent+'%' });
                    $controls.css({ bottom: percent+'%' });
                }
            }

            // Call the callbacks, if any
            // This one should only run when we're actually moving the scrubber
            if ( plugin._isFunction(options.onScrub) && !isStartingNumber && isInputActive ){
                options.onScrub.call(plugin, -(percent-100));
            }
            // This one should only run when we're done scrubbing
            else if ( plugin._isFunction(options.onComplete) && !isStartingNumber && !isInputActive ){
                options.onComplete.call(plugin, -(percent-100));
            }
            
            // We're done doing any of our manipulation. We're ready to get another frame going.
            scheduledAnimationFrame = false;
        },

        /**
         * Remebers percents so you don't have to!
         * 
         * @param {object} el      jQuery object
         * @param {number} percent Percent to set our data to.
         */
        _setPercent: function(percent){
            this.$element.data('plugin_' + pluginName + '.percent', percent); // remember the percent so I don't have to!
        },

        /**
         * Polyfill function so that the requestAnimationFrame function is normalized between browsers.
         */
        _setRAF: function(){
            var windowElement = window;
            windowElement.requestAnimFrame = (function(callback) {
            return  windowElement.requestAnimationFrame || 
                    windowElement.webkitRequestAnimationFrame || 
                    windowElement.mozRequestAnimationFrame || 
                    windowElement.oRequestAnimationFrame || 
                    windowElement.msRequestAnimationFrame ||
                    // Fallback to a timeout in older browsers
                    function(callback) {
                        windowElement.setTimeout(callback, 1000 / 60);
                    };
            })();
            windowElement.cancelRequestAnimFrame = ( function() {
            return  windowElement.cancelAnimationFrame ||
                    windowElement.webkitCancelRequestAnimationFrame ||
                    windowElement.mozCancelRequestAnimationFrame ||
                    windowElement.oCancelRequestAnimationFrame ||
                    windowElement.msCancelRequestAnimationFrame ||
                    clearTimeout;
            })();
        },

        /**
         * Sets the data attribute of the element to true or false in order to run CSS transitions when needed.
         * Also sets the data of the element so that we know when it's being interacted with.
         */
        _transitionToggle: function(event){
            var
                plugin = this,
                options = plugin.options,
                $el = $(plugin.element),
                percent = $el.data('plugin_' + pluginName + '.percent'),
                eventType = event.type;

            if (eventType === 'mousedown' || eventType === 'touchstart'){
                $el.attr('data-transition', false); // Change our transition state for CSS.
                $el.data('plugin_' + pluginName + '.isInputActive', true); // Change our flag for the _scrubTo function.

                // Call the onStart callback, if any
                if ( plugin._isFunction(options.onStart) ){
                    options.onStart.call(plugin, percent );
                }

                if ( options.momentum ){
                    plugin._momentumReset.call(plugin, event);
                }
            }
            else if (eventType === 'mouseup' || eventType === 'touchend'){
                if ( !options.momentum ){ $el.attr('data-transition', true); } // Change our transition state for CSS. Only do this now if we're not using momentum.
                $el.data('plugin_' + pluginName + '.isInputActive', false); // Change our flag for the _scrubTo function.
            }
        },

        /**
         * Sets the scrubber back to the "start" at the "startAt" option (default 50).
         */
        reset: function(){
            var plugin = this;
            plugin._scrubTo.call(plugin, plugin.options.startAt, true);
        },

        /**
         * Sets the scrubber to 100.
         */
        end: function(){
            var plugin = this;
            plugin._scrubTo.call(plugin, 100, false);
        },

        /**
         * Sets the scrubber to 0.
         */
        start: function(){
            var plugin = this;
            plugin._scrubTo.call(plugin, 0, false);
        },

        /**
         * Programically set the scrubber to a certain percentage and whether it should 'stick' when completed.
         * 
         * @param  {Number}     number  User should input the number of percent they want to scrub to
         * @param  {Boolean}    sticky  Specifies if this particular scrub should 'stick' or snap. False or undefined to snap.
         */
        scrub: function(number, sticky){
            var plugin = this;
            if ( !isNaN(number) ){
                plugin._scrubTo.call(plugin, number, false, sticky);
            }
        }

    });

    /*
        Create a lightweight plugin wrapper around the "Plugin" constructor,
        preventing against multiple instantiations.

        More: http://learn.jquery.com/plugins/basic-plugin-creation/
    */
    $.fn[ pluginName ] = function ( options ) {

        var args = Array.prototype.slice.call( arguments, 1);

        this.each(function() {
            // Cache the instance of the plugin on this element
            var instance = $.data( this, "plugin_" + pluginName );

            // Does the plugin already exist on this element?
            if ( !instance ) {
                /*
                    Use "$.data" to save each instance of the plugin in case
                    the user wants to modify it. Using "$.data" in this way
                    ensures the data is removed when the DOM element(s) are
                    removed via jQuery methods, as well as when the userleaves
                    the page. It's a smart way to prevent memory leaks.

                    More: http://api.jquery.com/jquery.data/
                */
                $.data( this, "plugin_" + pluginName, new Plugin( this, options ) );
            }
            // If the plugin already exists on this element, check the string because someone is probably trying to get a public method going.
            else if ( typeof options === 'string' && options.charAt(0) !== '_'){
                instance[options].apply(instance, args);
            }
        });
        /*
            "return this;" returns the original jQuery object. This allows
            additional jQuery methods to be chained.
        */
        return this;
    };

    /*
        Attach the default plugin options directly to the plugin object. This
        allows users to override default plugin options globally, instead of
        passing the same option(s) every time the plugin is initialized.

        For example, the user could set the "property" value once for all
        instances of the plugin with
        "$.fn.pluginName.defaults.property = 'myValue';". Then, every time
        plugin is initialized, "property" will be set to "myValue".

        More: http://learn.jquery.com/plugins/advanced-plugin-concepts/
    */
    $.fn[ pluginName ].defaults = {
        // Options
        controls: true, // Output the default controls. Useful for making custom / alternative controls.
        input: true, // Set if manual user controls are active. Useful for making custom / alternative controls. 
        startAt: 50, // Number to start the scrubber on. Will also "reset" to this number.  
        sticky: false, // Keeps the scrubber at a position instead of snapping to an end
        vertical: false, // Sets whether the scrubber should work in Y axis


        // Momentum
        momentum: false, // Activate momentum / interia scrubbing. Allows you to 'flick' the scrubber instead of dragging.
        friction: 0.4, // Amount of resistance during momentum. A smaller number gives more resistance.

        // Callbacks
        onInit: function(){}, // Callback when the scrubber is ready
        onStart: function(){}, // Callback when a person begins scrubbing (only applies when input is true)
        onScrub: function(){}, // Callback when a person is scrubbing (only applies when input is true)
        onComplete: function(){}, // Callback when a person stops scrubbing (happens immediately after scrub input up, or upon calling scrubTo)
    };

})( jQuery, window, document );