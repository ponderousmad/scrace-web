"use strict";

function Vector(x, y) {
    this.x = x;
    this.y = y;
}

function scaleVector(p, s) {
    return new Vector(p.x * s, p.y * s);
}

function addVectors(a, b) {
    return new Vector(a.x + b.x, a.y + b.y);
}

function vectorLength(v) {
    return Math.sqrt(v.x * v.x + v.y * v.y);
}

function vectorNormalize(v) {
    var length = vectorLength(v);
    return new Vector(v.x / length, v.y / length);
}
