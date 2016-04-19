/**
 * Created by IBM on 2016/3/17.
 */
var EventEmitter = require('events').EventEmitter;
var life = new EventEmitter()

var test = function(who){
    console.log(who);}

life.on('firstEvent',test)
life.removeListener('firstEvent',test);
life.emit('firstEvent','shudery');
var num = EventEmitter.listenerCount(life,"first")