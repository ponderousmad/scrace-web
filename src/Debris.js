
var DebrisType = {
    SmallAsteroid : 0,
    LargeAsteroid : 1,
    PlayerCockpit : 2,
    PlayerLeft : 3,
    PlayerRight : 4
}

var debrisBatch = new ImageBatch("/scrace/images/");
var debrisImages = [
    debrisBatch.load("asteroids/SmallAsteroid.png"),
    debrisBatch.load("asteroids/LargeAsteroid.png"),
    debrisBatch.load("ship/PlayerCockpit.png"),
    debrisBatch.load("ship/PlayerLeft.png"),
    debrisBatch.load("ship/PlayerRight.png")
];
debrisBatch.commit();

var Debris = function(type, location, velocity) {
    this.kMaxSpin = 0.01;
    this.kMaxPlanetDistance = 200;
    this.kMaxPlanetDistanceSq = this.kMaxPlanetDistance * this.kMaxPlanetDistance;

    this.angle = Math.random() * 2 * Math.PI;
    this.spin = Math.random() * this.kMaxSpin;
    this.location = location;
    this.startLocation = location;
    this.velocity = velocity || new Vector(0,0);
    this.startVelocity = velocity;
    this.type = type;
    this.destroyed = false;
    this.image = debrisImages[type];
    
    var self = this;

    this.setStartVelocity = function(velocity)
    {
        self.startVelocity = velocity;
        self.velocity = velocity;
    }

    this.reset = function()
    {
        self.location = self.startLocation;
        self.velocity = self.startVelocity || new Vector(0, 0);
        self.destroyed = false;
    }

    this.store = function() {
        if (self.isPlayerDebris())
        {
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
    }

    this.isPlayerDebris = function() {
        return self.type === DebrisType.PlayerCockpit || self.type === DebrisType.PlayerLeft || self.type === DebrisType.PlayerRight;
    }

    this.size = function() {
        return self.image.width * 0.5;
    }

    this.setLocation = function(vector) {
        self.location = vector;
        self.startLocation = vector;
    }

    this.contains = function(point)
    {
        return vectorLength(subVectors(self.location, point)) < self.size() * 1.25;
    }

    this.setDebrisType = function(type) {
        self.type = type;
        self.image = debrisImages[type];
    }

    this.draw = function(context, offset) {
        if (self.destroyed) {
            return;
        }
        var xLoc = self.location.x + offset.x;
        var yLoc = self.location.y + offset.y;
        var halfSize = self.size();
        
        context.save();        
        context.translate(xLoc, yLoc);
        context.rotate(self.angle);
        context.drawImage(self.image, -halfSize, -halfSize, self.image.width, self.image.height);        
        context.restore();
    }

    this.update = function(elapsed, planets) {
        if (self.destroyed)
        {
            return;
        }
        self.location = addVectors(self.location, self.velocity);
        self.angle = clampAngle(self.angle + self.spin);

        for (var i = 0; i < planets.length; ++i)
        {
            var p = planets[i];
            var force = p.determineForce(self.location, self.kMaxPlanetDistanceSq)
            if (force) {
                if (force === "crash") {
                    self.destroyed = true;
                } else {
                    self.velocity = addVectors(self.velocity, scaleVector(force, elapsed));
                }
            }
        }
    }

    this.setSpin = function(spin)
    {
        self.spin = spin;
    }
}
