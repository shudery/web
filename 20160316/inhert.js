/**
 * Created by IBM on 2016/3/21.
 */

//JavaScript的原型继承实现方式就是：
//
//定义新的构造函数，并在内部用call()调用希望“继承”的构造函数，并绑定this；
//
//借助中间函数F实现原型链继承，最好通过封装的inherits函数完成；
//
//继续在新的构造函数的原型上定义新方法。

function Student(props) {
    this.name = props.name || 'Unnamed';
}

Student.prototype.hello = function () {
    alert('Hello, ' + this.name + '!');
}

function PrimaryStudent(props) {
    Student.call(this, props);
    this.grade = props.grade || 1;
}

// 实现原型继承链:
inherits(PrimaryStudent, Student);

// 绑定其他方法到PrimaryStudent原型:
PrimaryStudent.prototype.getGrade = function () {
    return this.grade;
};

function inherits(Child, Parent) {
    var F = function () {};
    F.prototype = Parent.prototype;
    Child.prototype = new F();
    Child.prototype.constructor = Child;
    //原本的constructor指向的是F
}