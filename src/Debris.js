"use strict";

var DebrisType = {
    SmallAsteroid : 0,
    LargeAsteroid : 1,
    PlayerCockpit : 2,
    PlayerLeft : 3,
    PlayerRight : 4
};

var DebrisNames = {
    "SmallAsteroid" : DebrisType.SmallAsteroid,
    "LargeAsteroid" : DebrisType.LargeAsteroid,
    "PlayerCockpit" : DebrisType.PlayerCockpit,
    "PlayerLeft" : DebrisType.PlayerLeft,
    "PlayerRight" : DebrisType.PlayerRight
};

var debrisBatch = new ImageBatch("images/");
var debrisImages = [
    debrisBatch.load("asteroids/SmallAsteroid.png"),
    debrisBatch.load("asteroids/LargeAsteroid.png"),
    debrisBatch.load("ship/PlayerCockpit.png"),
    debrisBatch.load("ship/PlayerLeft.png"),
    debrisBatch.load("ship/PlayerRight.png")
];
debrisBatch.commit();

var Debris = function (type, location, velocity) {
    this.kMaxSpin = 0.01;
    this.kMaxPlanetDistance = 200;
    this.kMaxPlanetDistanceSq = this.kMaxPlanetDistance * this.kMaxPlanetDistance;

    this.angle = Math.random() * 2 * Math.PI;
    this.spin = Math.random() * this.kMaxSpin;
    this.location = location;
    this.startLocation = location.clone();
    this.velocity = velocity || new Vector(0, 0);
    this.startVelocity = velocity;
    this.type = type;
    this.destroyed = false;
    this.image = debrisImages[type];
};

Debris.prototype.setStartVelocity = function (velocity) {
    this.startVelocity = velocity;
    this.velocity = velocity;
};

Debris.prototype.reset = function () {
    this.location = this.startLocation.clone();
    this.velocity = this.startVelocity ? this.startVelocity.clone() : new Vector(0, 0);
    this.destroyed = false;
};

Debris.prototype.store = function () {
    if (this.isPlayerDebris()) {
        // Don't store exploding player.
        return;
    }
    /*
    using (IDataWriter element = doc["Debris"])
    {
        element.Attribute("type", mType.ToString());
        DocumentWriter.WriteVector(element, mStartLocation);
        if (mStartVelocity != null)
        {
            using (IDataWriter velocity = element["Velocity"])
            {
                DocumentWriter.WriteVector(velocity, mStartVelocity.Value);
            }
        }
    }
    */
};

Debris.prototype.isPlayerDebris = function () {
    return this.type === DebrisType.PlayerCockpit || this.type === DebrisType.PlayerLeft || this.type === DebrisType.PlayerRight;
};

Debris.prototype.size = function () {
    return this.image.width * 0.5;
};

Debris.prototype.setLocation = function (vector) {
    this.location = vector;
    this.startLocation = vector;
};

Debris.prototype.contains = function (point) {
    return pointDistance(this.location, point) < this.size() * 1.25;
};

Debris.prototype.setDebrisType = function (type) {
    this.type = type;
    this.image = debrisImages[type];
};

Debris.prototype.draw = function (context, offset) {
    if (this.destroyed) {
        return;
    }
    var xLoc = this.location.x + offset.x,
        yLoc = this.location.y + offset.y,
        halfSize = this.size();
    
    context.save();
    context.translate(xLoc, yLoc);
    context.rotate(this.angle);
    context.drawImage(this.image, -halfSize, -halfSize, this.image.width, this.image.height);
    context.restore();
};

Debris.prototype.update = function (elapsed, planets) {
    if (this.destroyed) {
        return;
    }
    this.location.addScaled(this.velocity, elapsed);
    this.angle = clampAngle(this.angle + this.spin);

    for (var i = 0; i < planets.length; ++i) {
        var p = planets[i];
        var accel = p.determineAcceleration(this.location, this.kMaxPlanetDistanceSq, elapsed);
        if (accel) {
            if (accel === "crash") {
                this.destroyed = true;
            } else {
                this.velocity.add(accel);
            }
        }
    }
};

Debris.prototype.setSpin = function (spin) {
    this.spin = spin;
};
