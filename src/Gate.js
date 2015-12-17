"use strict";

var GateState = {
    Normal : 0,
    Passed : 1,
    Finish : 2
}

var gatesBatch = new ImageBatch("/scrace/images/gates/");
var gateImages = [
    gatesBatch.load("Gate.png"),
    gatesBatch.load("GatePassed.png"),
    gatesBatch.load("Finish.png")
]
gatesBatch.commit();
var passGateSound = new SoundEffect("/scrace/audio/Pass.wav");

var Gate = function(location, angle) {
    this.location = location;
    this.angle = clampAngle(angle);
    this.passed = false;
    
    var self = this;

    this.store = function() {
        /*
        using (IDataWriter element = doc["Gate"])
        {
            DocumentWriter.WriteVector(element, mLocation);
            element.Attribute("angle", mAngle.ToString());
        }
        */
    }

    this.setAngle = function(angle) {
        self.angle = clampAngle(angle);
    }

    this.endPosition = function(side) {
        return addVectors(self.location, scaleVector(angleToVector(self.angle + (Math.PI * 0.5 * side)), gateImages[0].height * 0.5));
    }

    this.contains = function(point) {
        var kCheckSize = 10;
        return pointDistance(self.endPosition(-1), point) < kCheckSize ||
               pointDistance(self.location, point) < kCheckSize ||
               pointDistance(self.endPosition(1), point) < kCheckSize;
    }

    this.checkPassed = function(start, end) {
        if (!self.passed && self._checkCrosses(start, end)) {
            self.passed = true;
            passGateSound.play();
        }
    }

    // Lifted straight from http://stackoverflow.com/questions/563198/how-do-you-detect-where-two-line-segments-intersect/1968345#1968345
    this._checkCrosses = function(start, end) {
        var left = self.endPosition(-1);
        var s1 = subVectors(end, start);
        var s2 = subVectors(self.endPosition(1), left);

        var h = (-s1.y * (start.x - left.x) + s1.x * (start.y - left.y)) / (-s2.x * s1.y + s1.x * s2.y);
        var g = (s2.x * (start.y - left.y) - s2.y * (start.x - left.x)) / (-s2.x * s1.y + s1.x * s2.y);

        return (0 <= h && h <= 1.0) && (0 <= g && g <= 1.0);
    }

    this.draw = function(context, offset, isFinish) {
        var xLoc = self.location.x + offset.x;
        var yLoc = self.location.y + offset.y;

        context.save();        
        context.translate(xLoc, yLoc);
        context.rotate(self.angle);
        var image = gateImages[self.passed ? GateState.Passed : isFinish ? GateState.Finish : GateState.Normal];
        context.drawImage(image, -image.width * 0.5, -image.height * 0.5, image.width, image.height);
        context.restore();
    }

    this.reset = function() {
        self.passed = false;
    }
}
