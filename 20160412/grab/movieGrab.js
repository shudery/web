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
var fs = require('fs')
var grab = new Grab();
var stream = require('stream')

var movieClassName = [];
var domain = "https://movie.douban.com";
var url = 'https://movie.douban.com/chart';
grab.get(url)
grab.set({
		'movieClass[]': '.aside .types span a@href',
		'movieName[]': '.aside .types span a'
	})
	.data(function(data) {
		var movieClass = data.movieClass;
		var movieName = data.movieName;

		for (var i = 0; i < movieClass.length; i++) {
				fs.writeFile('movie/allClass.txt', movieName[i]+':'+movieClass[i]);
				console.log(i + ':' + movieName[i])
		}
		//var all = fs.createWriteStream('movie/fileAll.txt');
		//console.log(all);
	})
	.error(function(err) {
		console.log('Pull Fail:' + err);
	})
	.done()