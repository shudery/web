function myObj(name){
	return {
		name:name,
		method:function(){
			console.log('tucao')
		}
	}
}
       
var obj_1 = myObj('shudery');
var obj_2 = new myObj('shudery');