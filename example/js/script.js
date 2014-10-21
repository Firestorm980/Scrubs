$(document).ready(function(){

	$('#scrubber').Scrubs({
		onInit: function(){
			console.log('init callback called');
		},
		onScrub: function(){
			console.log('scrubbed');
		},
		onComplete: function(){
			console.log('complete callback');
		},
		startAt: 75
	});

	$('#vscrubber').Scrubs({
		vertical: true
	});

});