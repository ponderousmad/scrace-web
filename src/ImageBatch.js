"use strict";

function ImageBatch(basePath, onComplete) {
    this._toLoad = 0;
    this._commited = false;
    this._basePath = basePath;
    this._onComplete = onComplete;
    this.loaded = false;

    var self = this;
    
    this.setPath = function(path) {
        self._basePath = path;
    }
    
    this._checkComplete = function() {
        if (self._commited) {
            if (self._toLoad === 0) {
                self.loaded = true;
                if (self._onComplete) {
                    self._onComplete();
                }
            }
        }
    }
    
    this.load = function(resource, onLoad) {
        self._toLoad += 1;
        var image = new Image();
        image.onload = function() {
            if (onLoad) {
                onLoad(image);
            }
            self._toLoad -= 1;
            self._checkComplete();
        }

        image.src = (self._basePath || "") + resource;
        return image;
    }
    
    this.commit = function() {
        self._commited = true;
        self._checkComplete();
    }
}
