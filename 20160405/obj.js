
//Object.create
//需要使用一模一样的对象时可以用原型模式克隆对象
var Obj = function(name){
	this.name = name;
}
Obj.prototype.say = function(){return this.name;}
var obja = new Obj('linxiuda');
//new操作先克隆一个Object.prototype，然后Obj.prototype会指向它构成原型链
//对象(obja)会把请求委托给构造器(Obj)的原型(Obj.prototype)
var objb = Object.create(obja);
//clone一个用Obj构造的实例obja


//this指向
var obj = {
	a:'shudery',
	demo :function(){
		var a = 'Sunparker';
		console.log(this.a);
		//obj调用demo这个方法时this绑定了obj
		var test = function(){
			console.log(this.a)
		}
		test();
		//demo这个局部函数里test不存在调用它的对象，故this=undefined/window
	}

}