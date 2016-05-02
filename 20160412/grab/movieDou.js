var Grab = require('./grab/grab.js');
var fs = require('fs')
var grab = new Grab();
var domain = 'https://movie.douban.com';
var urlClass;
var classNa;
var url = 'https://movie.douban.com/chart';

grab.get(url)
	.set({
		'urlClass[]': '.aside .types span a@href'
	})
	.data(function(data) {
		if (data.urlClass) {
			for (var i = 0; i < data.urlClass.length; i++) {

					urlClass[i] = domain +data.urlClass[i];
					classNa[i] = data.urlClass[i].split('type_name=')[1].split('&type=')[0];
					console.log(i +':'+classNa[i]+':'+urlClass[i]);
			}

		}
	})
	.done()