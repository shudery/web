/**
 * Created by IBM on 2016/3/17.
 */

 var http = require('http');

    var querystring = require('querystring')
    var postData = querystring.stringify({
    'content':"haha",
    'cid':8837
})

    var option = {
    hostname:'www.imooc.com',
        port:80,
        path:'/course/docomment',
        method:'POST',
        headers:{
             'Accept':'application/json, text/javascript, */*; q=0.01',
             'Accept-Encoding':'gzip, deflate',
             'Accept-Language':'zh-CN,zh;q=0.8',
             'Connection':'keep-alive',
             'Content-Length':postData.length,
             'Content-Type':'application/x-www-form-urlencoded; charset=UTF-8',
             'Cookie':'imooc_uuid=6a20669e-33ca-4626-873b-6883b820e4a9; imooc_isnew=1; imooc_isnew_ct=1458197069; IMCDNS=0; PHPSESSID=j8i4ui187pa2f5qpdbuh5o9nd4; loginstate=1; apsid=hkZDZlMDI5MGYwYzI4M2ZjNWI2MWM2MzYxZWJiNDkAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAMTA3MjU4NwAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAxMjUxNTM0NTBAcXEuY29tAAAAAAAAAAAAAAAAAAAAADJiNGFjNTk2OWI4NmVkN2U1ZDY4MDZmOGU2ZWEwNzgwblLqVm5S6lY%3DYz; last_login_username=125153450%40qq.com; jwplayer.volume=81; Hm_lvt_f0cfcccd7b1393990c78efdeebff3968=1458197068; Hm_lpvt_f0cfcccd7b1393990c78efdeebff3968=1458226910; cvde=56ea524d0c1ab-64',
             'Host':'www.imooc.com',
             'Origin':'http://www.imooc.com',
             'Referer':'http://www.imooc.com/video/8837',
             'User-Agent':'Mozilla/5.0 (Windows NT 6.2; WOW64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/42.0.2311.154 Safari/537.36 LBBROWSER',
             'X-Requested-With':'XMLHttpRequest'
        }
}
var req =http.request(option,function(res){
    console.log('Status'+res.statusCode)
    console.log('headers'+JSON.stringify(res.headers))
    res.on('data',function(chunk){
        console.log(typeof chunk)
    });
    res.on('end',function(){
        console.log('OK')
    });

});
req.on('error',function(e){
    console.log('error:'+ e.message)
})
req.write(postData);
req.end();