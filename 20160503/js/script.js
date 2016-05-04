$(document).ready(function() {
	$('*').on('mousemove', function() {

		$('#header-nav').fadeIn('slow');

	});
	


	//立刻执行一次获取时间
	(function mygetTime() {
		var time = new Date().toString().match(/.{8}\sGMT/)[0].split(' GMT')[0];
		if (+time.split(':')[0] > 11) {
			var halfDay = "Good afternoon";
		} else {
			var halfDay = "Good morning";
		}
		$('.time').text(time);
		$('.word').text(halfDay);
		setInterval(mygetTime, 490)
	})()
	
})