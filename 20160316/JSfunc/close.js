/**
 * Created by IBM on 2016/3/20.
 */
function fun(n,o) {
    console.log(o)
    return {
        fun:function(m){
            return fun(m,n);
            //fun查找本身函数作用域没有找到后往上层找，不能找到对象内部的内容，所以第三个fan和第一个fan是一样的
            
        }
    };
}
//一个变量在其作用域之外被使用了，闭包
var a = fun(0);  a.fun(1);  a.fun(2);  a.fun(3);//undefined,0,0,0
var b = fun(0).fun(1).fun(2).fun(3);//undefined,0,1,2
var c = fun(0).fun(1);  c.fun(2);  c.fun(3);//undefined,0,1,1