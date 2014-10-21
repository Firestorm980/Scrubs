Scrubs
======

Creates a before and after scrubber for two images. Currently dependent on Modernizr and jQuery.


### Installation ###

Grab the Scrubs CSS and JS files and put them in your head and after you load jQuery on your page (header or footer).

```HTML
<link rel="stylesheet" type="text/css" href="scrubs.css" />
<script src="//ajax.googleapis.com/ajax/libs/jquery/1.11.1/jquery.min.js"></script>
<script src="scrubs.js"></script>
```

### Compatibility ###

Currently, any modern browser that supports CSS transforms. Go to [caniuse.com](http://caniuse.com/#search=transforms) to learn more.

Tested on:

- Chrome (OSX, Android, Stock)
- Firefox (OSX, Android)
- Safari (iOS, OSX)


### Roadmap ###
This is a list of possible improvements or features to include in future versions.
- ~~Vertical scrubbing~~
- Multiple image scrubbing (more than 2)
- More modular controls
- ~~Callbacks for advanced functions~~
- Additional public methods (scroll, destory, ~~start~~, ~~end~~)
- Clean up code
- ~~Remove modernizr dependency~~


#### Version History ####

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


