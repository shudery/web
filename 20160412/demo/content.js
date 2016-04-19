/**
 * Created by IBM on 2016/3/15.
 */

var people ={
    pname:'li',
    skills:function(){
        console.log(this) //this ==a  指向调用所在函数的对象
    }
}
a.func();

function pet(x){
    this.word = x;
    console.log(this === global); //true
}
b("heihei");

//function demo(){
//    this.word="s";
//    console.log(this===global);
//    this.s = function(){
//        console.log(this);
//    }
//}
//demo();//global
//var newo = new demo;  //new一个新对象后，函数C里的this由global指向ne!
//newo.s()

function demo(){
    this.word="s";//this指全局变量global
    this.s = function(){
        console.log(this);
    }
}
c();
s();//global