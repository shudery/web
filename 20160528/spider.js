var superagent = require('superagent');
var promises = [];
for (var i = 0; i < 1; i++) {
	promises.push(doreq(i))
}
console.log(promises)
function doreq(i) {
	superagent.get('http://www.uestc.edu.cn')
		.end(function(err, res) {
			console.log(i + ':' + res.statusCode)
		});
};