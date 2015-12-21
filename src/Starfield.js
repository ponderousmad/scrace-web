"use strict";

function getRandomInt(min, max) {
  return Math.floor(Math.random() * (max - min)) + min;
}

function Starfield(width, height, density, maxDepth, infrequentAreFar) {
    this.visuals = [];
    this.images = [];
    this.maxImageSize = new Vector(0,0);
    this.size = new Vector(width, height);
    this.density = density;
    this.maxDepth = maxDepth;
    this.infrequentAreFar = infrequentAreFar;
    
    this.frequency = {
        "Galaxy": 1,
        "Nebula": 1,
        "Nebula2": 1,
        "StarBlueGiant": 15,
        "StarRedGiant": 20,
        "StarRedDwarf": 50,
        "StarSmallBlue": 100,
        "StarYellow": 1000,
    }
    
    var self = this;

    function Visual(image, location, distance) {
        this.location = location;
        this.distance = distance;
        this.image = image;
        this.size = new Vector(image.width, image.height);
        this.drawLocation = new Vector(0,0);
    }
    
    Visual.prototype.updateLocation = function(offset, tileSize)
    {
        var scaleFactor = 1.0 - this.distance;
        var offsetLocation = addVectors(this.location, addVectors(scaleVector(offset, scaleFactor), this.size));
        var distanceSize = scaleVector(tileSize, 1 /  scaleFactor);
        var tiledX = offsetLocation.x % distanceSize.x;
        if(tiledX < 0)
        {
            tiledX += distanceSize.x;
        }
        var tiledY = offsetLocation.y % distanceSize.y;
        if(tiledY < 0)
        {
            tiledY += distanceSize.y;
        }
        this.drawLocation.set(tiledX - this.size.x, tiledY - this.size.y);
    }
  
    this.populate = function() {
        var count = Math.floor(self.size.x * self.size.y * density);
        console.log("Populating starfield with ", count, " entities");
        var imageCount = self.images.length;
        for (var i = 0; i < count; ++i)
        {
            var x = Math.random() * width;
            var y = Math.random() * height;
            var distance = Math.random() * self.maxDepth;
            if(self.infrequentAreFar) {
                distance = (distance * (imageCount - index)) / imageCount;
            }
            var scale = 1.0 / (1.0 - distance);
            var index = getRandomInt(0, imageCount);
            var image = self.images[index];
            self.visuals.push(new Visual(image, new Vector(x * scale, y * scale), distance));
        }
        self.visuals.sort(function(a, b) {
            return a.distance - b.distance;
        });
    }

    this.addImage = function(batch, name, frequency) {
        batch.load(name + ".png", function(image) {
            self.maxImageSize.x = Math.max(self.maxImageSize.x, image.width);
            self.maxImageSize.y = Math.max(self.maxImageSize.y, image.height);
            
            for (var i = 0; i < frequency; ++i)
            {
                self.images.push(image);
            }
        });
    }

    this.draw = function(context, offset, width, height)
    {
        context.fillStyle = "black";
        context.fillRect(0, 0, width, height);

        for (var i = 0; i < self.visuals.length; ++i)
        {
            var v = self.visuals[i];
            v.updateLocation(offset, self.size);
            if (v.drawLocation.x < -self.maxImageSize.x || width < v.drawLocation.x)
                continue;
            if (v.drawLocation.y < -self.maxImageSize.y || height < v.drawLocation.y)
                continue;
            context.drawImage(v.image, v.drawLocation.x, v.drawLocation.y);
        }
    }
    
    var batch = new ImageBatch("images/starfield/", self.populate);
    for (var imageName in self.frequency) {
        self.addImage(batch, imageName, self.frequency[imageName]);
    }
    batch.commit();
}
