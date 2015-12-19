"use strict";

var KeyboardState = function(element) {
    this.pressed = {};
    var self = this;
    
    element.onkeydown = function(e){
        e = e || window.event;
        self.pressed[e.keyCode] = true;
    }

    element.onkeyup = function(e){
        e = e || window.event;
        delete self.pressed[e.keyCode];
    }
    
    this.isKeyDown = function(keyCode) {
        return self.pressed[keyCode] ? true : false;
    }
}
