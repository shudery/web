// var Grab = require('./grab/grab.js');
// var grab = Grab();
// var fs = require('fs');
// var domain = 'https://movie.douban.com/';
// var url = 'https://movie.douban.com/chart';
// var movieClassName = [];

// grab.get(url)
// 	.set({
// 		'movieClass[]': '.aside .type span a@href'
// 	})
// 	.data(function(data) {
// 		for (var i = 0; i < data.movieClass.length; i++) {
// 			movieClassName[i] = data.movieClass[i].split('type_name=')[1].split('&type')[0];

// 		}
// 		console.log(i + ':' + movieClassName);
// 	})
// 	.done();

// * Created by IBM on 2016/3/17.*/
//imooc爬虫
var Grab = require('./grab/grab');
var fs = require('fs');
var grab = new Grab();

var movieClassName = [];
var domain = "https://movie.douban.com";
var url = 'https://movie.douban.com/chart';

var movieName = '剧情片'
var urlAll = 'https://movie.douban.com/typerank?type_name=%E5%89%A7%E6%83%85&type=11&interval_id=100:90&action='
grab.get(urlAll)
	.set({
		'theHead': '.movie-name span',
		'name': '.movie-name-text', //name + playable + rank
		'url': '.movie-name-text a@href', //detail
		'actor': '.movie-crew',
		'classNa': '.movie-misc',
		'grade': '.rating_num',
		'comment': '.comment-num'
	})
	.data(function(data) {
		var dataString = '';
		// for (var n = 0; n < data.head.length; n++) {
		// 	dataString = dataString + data.name[n] + '\n' + data.url[n] + '\n' + data.actor[n] + '\n' +
		// 		data.classNa[n] + '\n' + data.grade[n] + '\n' + data.comment + '\n\n';
		// }
		console.log(data.grade)
	})
	.error(function(err) {
		console.log('Fail:' + err)
	})
	.done()