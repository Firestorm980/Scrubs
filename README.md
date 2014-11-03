Scrubs
======

Creates a before and after scrubber for two images. Currently dependent on jQuery.


### Installation ###

Grab the Scrubs CSS and JS files and put them in your head and after you load jQuery on your page (header or footer).

```HTML
<link rel="stylesheet" type="text/css" href="scrubs.css" />
<script src="//ajax.googleapis.com/ajax/libs/jquery/1.11.1/jquery.min.js"></script>
<script src="scrubs.js"></script>
```

### Compatibility ###

Currently, any modern browser that supports CSS transforms *should* work. Go to [caniuse.com](http://caniuse.com/#feat=transforms2d) to learn more. The plugin will automatically use 2D/3D transforms if available, preferring 3D (for hardware acceleration).

In addition, there is also a fallback for older browsers where transforms are not detected, where it will use CSS position properties instead (top, bottom, left, right). 

Transitions / animations are all CSS based, so refer to [caniuse.com](http://caniuse.com/#feat=css-transitions) for support.

##### Tested On #####

- Windows (IE8+, Firefox, Chrome)
- OSX (Chrome, Safari, Firefox)
- iOS (Safari)
- Android 4 (Stock browser, Chrome, Firefox)
- Windows Phone (IE)

Note: Both iOS and Windows Phone were tested in simulators.

### Roadmap ###
This is a list of possible improvements or features to include in future versions.
- Multiple image scrubbing (more than 2)
- Additional public methods
- Clean up code


#### Version History ####

##### 0.4.1 #####

Removed 'width' option as well as max-width styling in constructor. May revisit in the future.

##### 0.4 #####

Added deeper browser support. Scrubber now works with browsers that do not support CSS transforms, specifically IE8.

##### 0.3.1 #####

- Fixed a minor issue with numbers being passed to the scrubbing function.
- Renamed public function 'beginning' to 'start'

##### 0.3 #####

Added lots of extra functionality to the code.
- New "scrollTo" method.

###### New options ######
- width | Let's people specify a width to use with the scrubber. Defaults to a 'responsive' max-width if none is specified.
- controls | Option to build out controls or not. Useful if someone wants to rock their own.
- input | Let's people turn off any manual input to the scrubber. Should be useful for people to make their own controls.
- sticky | Causes the scrubber to stay 'stuck' at the point where the input stopped.
- onStart | For callback functions when the user starts scrubbing.

All callbacks now get percent data as part of their arguments. Example:
```JAVASCRIPT
onComplete: function(percent){
	console.log(percent); // Outputs scrubber percent number	
}
```

Also renamed a few functions and reorganized a little bit internally, as well as slimmed down the SVG icons in the controls. 


##### 0.2 #####

Did some things from the roadmap, including:
- Removed Modernizr dependency
- Added additional public methods (end, beginning)
- Added callbacks (onInit, onScrub, onComplete)
- Added vertical scrubbing

Also:
- Cleaned up / fixed a style error
- Fixed a multiple instances error

##### 0.1 #####

Initial commit. Added the plugin in its first iteration, which should work on modern browsers as well as touch devices. Only includes 1 public method (reset) and no other options / defaults. 


