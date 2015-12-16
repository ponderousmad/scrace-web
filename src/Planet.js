"use strict"

var PlanetType = {
    Ringed : 0,
    Planetoid : 1,
    BrownRocky : 2,
    GreenGasGiant : 3,
    RockyForest : 4,
    PurpleGiant : 5
};

var planetsBatch = new ImageBatch("/scrace/images/planets/");
var planetImages = [
    planetsBatch.load("RingedPlanet.png"),
    planetsBatch.load("SmallPlanetoid.png"),
    planetsBatch.load("BrownRocky.png"),
    planetsBatch.load("GreenGasGiant.png"),
    planetsBatch.load("RockyForest.png"),
    planetsBatch.load("PurpleGiant.png")
];
planetsBatch.commit();

var Planet = function(type, location, gravity) {
    this.type = type;
    this.image = planetImages[type];
    this.location = location;
    this.gravity = gravity;
    
    var self = this;
    
    this.store = function() {
        /*
        using (IDataWriter element = doc["Planet"])
        {
            element.Attribute("type", mType.ToString());
            element.Attribute("gravity", DocumentWriter.AsString(mGravity));
            DocumentWriter.WriteVector(element, mLocation);
        }
        */
    }
    
    this.size = function() {
        if(self.type === PlanetType.Ringed || !planetsBatch.loaded) {
            return 30.0;
        } else {
            return self.image.width / 2.0;
        }
    }

    this.contains = function(point) {
        return vectorLength(subVectors(self.location, point)) < self.size();
    }

    this.draw = function(context, offset) {
        if (!planetsBatch.loaded) {
            return;
        }
        var drawPosition = addVectors(self.location, offset);
        var width = self.image.width;
        var height = self.image.height;
        context.drawImage(self.image, drawPosition.x - width * .5, drawPosition.y - height * .5, width, height);
    }

    this.determineForce = function(location, maxDistSq) {
        var fromPlanet = subVectors(self.location, location);
        var distanceSq = vectorLengthSq(fromPlanet);
        if (distanceSq > maxDistSq)
        {
            return null;
        }
        var distance = Math.sqrt(distanceSq)
        if (distance < self.size()) {
            return "crash";
        }
        var force = self.gravity / distanceSq;
        return scaleVector(fromPlanet, force / distance);
    }
}
