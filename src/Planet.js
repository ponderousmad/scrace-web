"use strict";

var PlanetType = {
    Ringed : 0,
    Planetoid : 1,
    BrownRocky : 2,
    GreenGasGiant : 3,
    RockyForest : 4,
    PurpleGiant : 5,
    COUNT : 6
};

var PlanetNames = {
    "Ringed" : PlanetType.Ringed,
    "Planetoid" : PlanetType.Planetoid,
    "BrownRocky" : PlanetType.BrownRocky,
    "GreenGasGiant" : PlanetType.GreenGasGiant,
    "RockyForest" : PlanetType.RockyForest,
    "PurpleGiant" : PlanetType.PurpleGiant
};

var planetsBatch = new ImageBatch("images/planets/");
var planetImages = [
    planetsBatch.load("RingedPlanet.png"),
    planetsBatch.load("SmallPlanetoid.png"),
    planetsBatch.load("BrownRocky.png"),
    planetsBatch.load("GreenGasGiant.png"),
    planetsBatch.load("RockyForest.png"),
    planetsBatch.load("PurpleGiant.png")
];
planetsBatch.commit();

var Planet = function (type, location, gravity) {
    this.type = type;
    this.image = planetImages[type];
    this.location = location;
    this.gravity = parseFloat(gravity);

    this._size = null;
    this._halfSize = null;
    this._drawLocation = location.clone();
};

Planet.prototype.setType = function(type) {
    type = type % PlanetType.COUNT;
    this.type = type;
    this.image = planetImages[type];

    this._size = null;
    this._halfSize = null;
}

Planet.prototype.typeName = function () {
    for (var typeName in PlanetNames) {
        if (PlanetNames[typeName] === this.type) {
            return typeName;
        }
    }
    return null;
}
    
Planet.prototype.store = function (dest) {
    dest.push({
        type: this.typeName(),
        gravity: this.gravity,
        x: this.location.x,
        y: this.location.y
    });
};

Planet.prototype.size = function () {
    if (this._size === null) {
        if (!planetsBatch.loaded) {
            return 1;
        } else if (this.type === PlanetType.Ringed) {
            this._size = 30.0;
        } else {
            this._size = this.image.width / 2.0;
        }
    }
    return this._size;
};

Planet.prototype.contains = function (point) {
    return pointDistance(this.location, point) < this.size();
};

Planet.prototype.draw = function (context, offset) {
    if (!planetsBatch.loaded) {
        return;
    } else if (this._halfSize == null) {
        this._halfSize = new Vector(this.image.width * 0.5, this.image.height * 0.5);
    }
    var drawAt = this._drawLocation;
    drawAt.copy(this.location);
    drawAt.add(offset);
    drawAt.sub(this._halfSize);
    context.drawImage(this.image, drawAt.x, drawAt.y);
};

Planet.prototype.determineAcceleration = function (location, maxDistSq, elapsed) {
    var fromPlanet = subVectors(this.location, location);
    var distanceSq = fromPlanet.lengthSq();
    if (distanceSq > maxDistSq) {
        return null;
    }
    var distance = Math.sqrt(distanceSq);
    if (distance < this.size()) {
        return "crash";
    }
    var force = this.gravity / distanceSq;
    fromPlanet.scale(elapsed * force / distance);
    return fromPlanet;
};
