/**
 * Created by IBM on 2016/3/15.
 */
 function pet(words){
    this.word = words;
    this.speak = function(){
        console.log(this.word);
    }
}
function Dog(word){
    pet.call(this,word)//强制Pet里头指向global的this指向dog，这样dog就可以使用speak函数了
    //pet.apply(speak,arguments)
}
var dog = new Dog("Wow");
dog.speak();