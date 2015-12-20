"use strict";

function Vector(x, y) {
    this.x = x;
    this.y = y;   
}

Vector.prototype.set = function(x, y) {
    this.x = x;
    this.y = y;
}

Vector.prototype.add = function(v) {
    this.x += v.x;
    this.y += v.y;
}

Vector.prototype.sub = function(v) {
    this.x -= v.x;
    this.y -= v.y;
}

Vector.prototype.scale = function(s) {
    this.x *= s;
    this.y *= s;
}

function scaleVector(p, s) {
    return new Vector(p.x * s, p.y * s);
}

function addVectors(a, b) {
    return new Vector(a.x + b.x, a.y + b.y);
}

function subVectors(a, b) {
    return new Vector(a.x - b.x, a.y - b.y);
}

function vectorLengthSq(v) {
    return v.x * v.x + v.y * v.y;
}

function vectorLength(v) {
    return Math.sqrt(vectorLengthSq(v));
}

function pointDistance(a, b) {
    var xDiff = a.x - b.x;
    var yDiff = a.y - b.y;
    return Math.sqrt(xDiff * xDiff + yDiff * yDiff);
}

function vectorNormalize(v) {
    var length = vectorLength(v);
    return new Vector(v.x / length, v.y / length);
}

function angleToVector(angle) {
    return new Vector(Math.cos(angle), Math.sin(angle));
}

function parseVector(data) {
    return new Vector(parseFloat(data.x), parseFloat(data.y));
}

function clampAngle(angle) {
    while (angle < -Math.PI) {
        angle += 2 * Math.PI;
    }

    while (angle > Math.PI) {
        angle -= 2 * Math.PI;
    }
    return angle;
}
