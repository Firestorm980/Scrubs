$(document).ready(function(){

	$('#scrubber').Scrubs({
		startAt: 75,
		width: 500,
		onComplete: function(percent){
			console.log('Scrub complete '+ percent);
		},
		onScrub: function(percent){
			console.log('Scrubbing '+ percent);
		},
		onStart: function(percent){
			console.log('Scrub started '+ percent);
		},
		onInit: function(){
			console.log('Plugin ready');
		}
	});

	$('#vscrubber').Scrubs({
		vertical: true,
		//sticky: true,
		//controls: false,
		//input: false,
		onComplete: function(percent){
			console.log('Scrub complete '+ percent);
		},
		onScrub: function(percent){
			console.log('Scrubbing '+ percent);
		},
		onStart: function(percent){
			console.log('Scrub started '+ percent);
		},
		onInit: function(){
			console.log('Plugin ready');
		},
		width: 500
	});

});