"use strict";

function ImageBatch(onComplete) {
    this._toLoad = 0;
    this._commited = false;
    this._onComplete = onComplete;
    var self = this;
    
    this._checkComplete = function() {
        if(self._commited) {
            if(self._toLoad === 0) {
                if(this._onComplete) {
                    this._onComplete();
                }
            }
        }
    }
    
    this.load = function(resource, onLoad) {
        self._toLoad += 1;
        var image = new Image();
        image.onload = function() {
            onLoad(image);
            self._toLoad -= 1;
            self._checkComplete();
        }
        image.src = resource;
        return image;
    }
    
    this.commit = function() {
        self._commited = true;
        self._checkComplete();
    }
}
