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

        this.tiledLocation = function(offset, tileSize)
        {
            var size = new Vector(image.width, image.height)
            var scaleFactor = 1.0 - this.distance;
            var offsetLocation = addVectors(this.location, addVectors(scaleVector(offset, scaleFactor), size));
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
            return new Vector(tiledX - size.x, tiledY - size.y);
        }
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
        batch.load("/scrace/images/starfield/" + name + ".png", function(image) {
            console.log("Loaded ", name);
            self.maxImageSize.x = Math.max(self.maxImageSize.x, image.width);
            self.maxImageSize.y = Math.max(self.maxImageSize.y, image.height);
            
            for (var i = 0; i < frequency; ++i)
            {
                self.images.push(image);
            }
        });
    }

    this.draw = function(canvas, offset, width, height)
    {
        var context = canvas.getContext("2d");
        context.fillStyle = "black";
        context.fillRect(0, 0, width, height);

        for (var i = 0; i < self.visuals.length; ++i)
        {
            var v = self.visuals[i];
            var location = v.tiledLocation(offset, self.size);
            if (location.x < -self.maxImageSize.x || width < location.x)
                continue;
            if (location.y < -self.maxImageSize.y || height < location.y)
                continue;
            context.drawImage(v.image, location.x, location.y);
        }
    }
    
    var batch = new ImageBatch(self.populate);
    for (var imageName in self.frequency) {
        console.log("Queueing ", imageName);
        self.addImage(batch, imageName, self.frequency[imageName]);
    }
    batch.commit();
}
