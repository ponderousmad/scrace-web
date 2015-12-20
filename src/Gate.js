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

function calcEndPosition(location, angle, side) {
    return addVectors(location, scaleVector(angleToVector(angle + (Math.PI * 0.5 * side)), gateImages[0].height * 0.5));
}

var Gate = function(location, angle) {
    this.location = location;
    this.angle = clampAngle(angle);
    this.passed = false;
    this.leftEnd = calcEndPosition(location, angle, -1);
    this.rightEnd = calcEndPosition(location, angle, 1);
    this.span = subVectors(this.rightEnd, this.leftEnd);
}

Gate.prototype.store = function() {
    /*
    using (IDataWriter element = doc["Gate"])
    {
        DocumentWriter.WriteVector(element, mLocation);
        element.Attribute("angle", mAngle.ToString());
    }
    */
}

Gate.prototype.setAngle = function(angle) {
    this.angle = clampAngle(angle);
}

Gate.prototype.contains = function(point) {
    var kCheckSize = 10;
    return pointDistance(this.leftEnd, point) < kCheckSize ||
           pointDistance(this.location, point) < kCheckSize ||
           pointDistance(this.rightEnd, point) < kCheckSize;
}

Gate.prototype.checkPassed = function(start, end) {
    if (!this.passed && this._checkCrosses(start, end)) {
        this.passed = true;
        passGateSound.play();
    }
}

// Lifted straight from http://stackoverflow.com/questions/563198/how-do-you-detect-where-two-line-segments-intersect/1968345#1968345
Gate.prototype._checkCrosses = function(start, end) {
    var dx = end.x - start.x;
    var dy = end.y - start.y;

    var h = (-dy * (start.x - this.leftEnd.x) + dx * (start.y - this.leftEnd.y)) / (-this.span.x * dy + dx * this.span.y);
    var g = (this.span.x * (start.y - this.leftEnd.y) - this.span.y * (start.x - this.leftEnd.x)) / (-this.span.x * dy + dx * this.span.y);

    return (0 <= h && h <= 1.0) && (0 <= g && g <= 1.0);
}

Gate.prototype.draw = function(context, offset, isFinish) {
    var xLoc = this.location.x + offset.x;
    var yLoc = this.location.y + offset.y;

    context.save();        
    context.translate(xLoc, yLoc);
    context.rotate(this.angle);
    var image = gateImages[this.passed ? GateState.Passed : isFinish ? GateState.Finish : GateState.Normal];
    context.drawImage(image, -image.width * 0.5, -image.height * 0.5, image.width, image.height);
    context.restore();
}

Gate.prototype.reset = function() {
    this.passed = false;
}
