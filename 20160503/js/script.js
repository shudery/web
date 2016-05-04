$(document).ready(function() {
	var count = 0;
	$('*').on('mousemove', function() {
		if (!count) {
			count = 1;
			var i = setTimeout(function() {
				$('#header-nav').fadeIn('slow');
				count = 0;
			}, 200)
		}
	})
	var key = 0
	$('*').on('mousemove', function() {
		if (!key) {
			key =1;
			var i = setTimeout(function() {
				$('#header-nav').fadeOut('slow');
				key =0;
			}, 1500);
		}
	})
})