jQuery(document).ready(function($){

	$('#scrubber').Scrubs({
		startAt: 75,
		momentum: true,
		friction: 0.5
	});

	$('#vscrubber').Scrubs({
		vertical: true,
		sticky: true,
	});

});