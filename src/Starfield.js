"use strict";

function Point(x, y) {
    this.x = x;
    this.y = y;
}

function scalePoint(p, s) {
    return new Point(p.x * s, p.y * s);
}

function addPoints(a, b) {
    return new Point(a.x + b.x, a.y + b.y);
}

function getRandomInt(min, max) {
  return Math.floor(Math.random() * (max - min)) + min;
}

function Starfield(width, height, density, maxDepth, infrequentAreFar) {
    this.visuals = [];
    this.images = [];
    this.maxImageSize = new Point(0,0);
    this.size = new Point(width, height);
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
    
    this.toLoad = Object.keys(this.frequency).length;

    function Visual(image, location, distance) {
        this.location = location;
        this.distance = distance;
        this.image = image;

        this.tiledLocation = function(offset, tileSize)
        {
            var size = new Point(image.width, image.height)
            var scaleFactor = 1.0 - this.distance;
            var offsetLocation = addPoints(this.location, addPoints(scalePoint(offset, scaleFactor), size));
            var distanceSize = scalePoint(tileSize, 1 /  scaleFactor);
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
            return new Point(tiledX - size.x, tiledY - size.y);
        }
    }
  
    this.populate = function() {
        var count = Math.floor(this.size.x * this.size.y * density);
        console.log("Populating starfield with ", count, " entities");
        var imageCount = this.images.length;
        for (var i = 0; i < count; ++i)
        {
            var x = Math.random() * width;
            var y = Math.random() * height;
            var distance = Math.random() * this.maxDepth;
            if(this.infrequentAreFar) {
                distance = (distance * (imageCount - index)) / imageCount;
            }
            var scale = 1.0 / (1.0 - distance);
            var index = getRandomInt(0, imageCount);
            var image = this.images[index];
            this.visuals.push(new Visual(image, new Point(x * scale, y * scale), distance));
        }
    }

    this.addImage = function(name, frequency) {
        var image = new Image();
        var starfield = this;
        image.onload = function() {
            console.log("Loaded ", name);
            starfield.maxImageSize.x = Math.max(starfield.maxImageSize.x, image.width);
            starfield.maxImageSize.y = Math.max(starfield.maxImageSize.y, image.height);
            
            for (var i = 0; i < frequency; ++i)
            {
                starfield.images.push(image);
            }
            starfield.toLoad -= 1;
            if(starfield.toLoad == 0) {
                starfield.populate();
            }
        };
        image.src = "/scrace/images/starfield/" + name + ".png";
    }

    this.draw = function(canvas, offset, width, height)
    {
        var context = canvas.getContext("2d");
        context.fillStyle = "black";
        context.fillRect(0, 0, width, height);

        for (var i = 0; i < this.visuals.length; ++i)
        {
            var v = this.visuals[i];
            var location = v.tiledLocation(offset, this.size);
            if (location.x < -this.maxImageSize.x || width < location.x)
                continue;
            if (location.y < -this.maxImageSize.y || height < location.y)
                continue;
            context.drawImage(v.image, location.x, location.y);
        }
    }
    
    for (var imageName in this.frequency) {
        console.log("Queueing ", imageName);
        this.addImage(imageName, this.frequency[imageName]);
    }
}

window.onload = function(e) {
    console.log("window.onload", e, Date.now())
    var canvas = document.getElementById("canvas");
    var starfield = new Starfield(5000, 5000, 0.002, 0.95, true);
    var offset = new Point(0,0);
    window.setInterval(function() {
        starfield.draw(canvas, offset, canvas.width, canvas.height)
        offset.x += 1;
        offset.y += 1;
    }, 16);
};
