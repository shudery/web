window.onload = function(){

    Demo();
    //模拟JSON字符串
    var imgData = {
        "data":[
            {"src":"0.jpg"},{"src":"1.jpg"},{"src":"2.jpg"},{"src":"3.jpg"},{"src":"4.jpg"},{"src":"5.jpg"},{"src":"6.jpg"},{"src":"4.jpg"},{"src":"1.jpg"},{"src":"8.jpg"}]
    }
    window.onscroll=function(){
        if(check()){
            for(var i =0;i<imgData.data.length;i++){
                var newdiv = document.createElement("div");
                newdiv.className = "box";
                parent.appendChild(newdiv);
                var newimg = document.createElement('img');
                newimg.src = "img/"+imgData.data[i].src;
                newdiv.appendChild(newimg)
            }
        Demo();
        }
    }
}

function check(){
    var lastHeight = content[content.length-1].offsetTop;
    var scrollTop =  document.documentElement.scrollTop || document.body.scrollTop;
    var pageHeight = document.documentElement.clientHeight || document.body.clientHeight
    if(lastHeight<scrollTop+pageHeight)
       return true;

}
var parent = document.getElementById('container');
var content = parent.getElementsByClassName('box');
//拿到外面可以减少DOM请求，但是Script得放底部，DOM树没构成无法搜索
function Demo(){

    var num = Math.floor(parent.offsetWidth/content[0].offsetWidth);
    var BoxHeightAll = [];
    for(var i=  0;i<content.length;i++){
        if(num>i){
            BoxHeightAll[i] = content[i].offsetHeight;
        }else{
            var minHeight = Math.min.apply(null,BoxHeightAll);
            //找到第一排中最矮的图片的高度,min比较参数，apply传入数组
            var minIndex = getminHeight(BoxHeightAll,minHeight);
            content[i].style.position = 'absolute';
            //前一排的定位不能为absolute所以不再CSS中设置
            content[i].style.top = minHeight+5+ 'px';
            content[i].style.left = content[minIndex].offsetLeft-5 + 'px';
            BoxHeightAll[minIndex] = BoxHeightAll[minIndex]+content[i].offsetHeight+5;
        }
    }
}
//获取一排中最矮的图片
function getminHeight(BoxHeightAll,minHeight){
    for(var i in BoxHeightAll){
        if(BoxHeightAll[i] == minHeight){
            return i;
        }
    }
}