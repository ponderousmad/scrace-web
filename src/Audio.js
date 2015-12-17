"use strict";

var gAudioContext = null;
try {
    gAudioContext = new (window.AudioContext || window.webkitAudioContext)();
} catch(error) {
    console.log("Error initializing audio:");
    console.log(error);
}

var SoundEffect = function(resource) {
    this.resource = resource;
    this._source = null;
    this._buffer = null;
    
    var self = this;
    
    if (gAudioContext != null) {
        var request = new XMLHttpRequest();
        request.open("GET", resource, true);
        request.responseType = "arraybuffer";
        request.onload = function() {
            var audioData = request.response;
            gAudioContext.decodeAudioData(audioData,
                function(buffer) {
                    self._buffer = buffer;
                },
                function(e) {
                    "Error with decoding audio data" + e.err
                }
            );
        }
        request.send();
    }
    
    this.isLoaded = function() {
        return gAudioContext == null || self._buffer != null;
    }
    
    this.play = function() {
        if (gAudioContext == null || self._buffer == null) {
            return;
        }
        if (self._source) {
            self._source.disconnect(gAudioContext.destination);
        }
        self._source = gAudioContext.createBufferSource();
        self._source.buffer = self._buffer;
        self._source.connect(gAudioContext.destination);
        self._source.start();
    }
};
