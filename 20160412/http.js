var http = require('http');

var request = new XMLHttpRequest();
request.open('GET','test.php',true);
request.send();
request.onre