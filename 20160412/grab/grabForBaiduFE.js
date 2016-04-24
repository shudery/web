// * Created by IBM on 2016/3/17.*/
//imooc爬虫
var Grab = require('./grab/grab');
var fs = require('fs')
var grab = new Grab();

var maxTaskNum = 100;
var domain = "http://ife.baidu.com/task/detail?taskId=";
for (var i = 1; i <= maxTaskNum; i++) {
	//if (i === 9) {continue};
	(function(i) {
		var url = domain + i;
		grab.get(url)
		grab.set({
				'title': '.nav-title span',
				'content': '.task-detail>div',
				'url[]': '.task-detail li a@href'
			})
			.data(function(data) {
				if (!data.title || !data.content) {
					maxTaskNum = 0;
				} else {
					var key = data.title.split('：')[1];
					var allUrl = '\n\n' + data.url.join('\n').replace(/\.jpg/, '.jpg' + '\n');
					if (i === 9) {
						//不能打开相关的文件目录
						fs.writeFile('FEtask/task_' + i + '.txt', data.title + data.content + allUrl)
						console.log(i + 'Write Fail:' + data.title)
					} else {
						fs.writeFile('FEtask/task_' + i + key + '.txt', data.title + data.content + allUrl);
						console.log(i + 'Pull Succ:' + data.title);
					}
				}
			})
			.error(function(err) {
				console.log(i + 'Pull Fail:' + err);
			})
	})(i)
}
grab.done();