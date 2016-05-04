$(document).ready(function() {
	// $('*').on('mousemove', function() {

	// 	$('#header-nav').fadeIn(2000);
	// 	$('footer').fadeIn(2000)
	// });



	//立刻执行一次获取时间
	(function mygetTime() {
		var time = new Date().toString().match(/.{8}\sGMT/)[0].split(' GMT')[0];
		if (+time.split(':')[0] > 11) {
			var halfDay = "Good afternoon!";
		} else {
			var halfDay = "Good morning!";
		}
		$('.time').text(time);
		$('.word').text(halfDay);
		setInterval(mygetTime, 490)
	})()

	// var ypos = 0
	// var oldPos = +$('#box2').css('background-position').split('px ')[1].split('px')[0];

	//背景图动画
	//导致其他动画非常卡

	// function anima1() {
	// 	if (ypos > -50) {
	// 		var newPos = oldPos + ypos
	// 		$('#box1').css('background-position', '0 ' + ypos + 'px')
	// 		$('#box2').css('background-position', '0 ' + newPos + 'px')
	// 		console.log(newPos)

	// 		ypos--;
	// 	}else{
	// 		clearInterval(i);
	// 		$('#button').fadeIn('slow')
	// 	}


	// }
	// var i = setInterval(anima1, 100)

	$('#button').on('click',function(){
		// $('#box1').fadeOut(2000);
		// $('#box2').fadeOut(2000);
		$('#button').fadeOut(2000);
		$('#center').fadeOut(3000);
		$('#content').fadeIn(4000);
		mygetTime=null;
		
	})

})