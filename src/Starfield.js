function Point(x, y) {
    this.x = x;
    this.y = y;
}

function scalePoint(p, s) {
    return new Point(p.x * s, p.y + s);
}

function addPoints(a, b) {
    return new Point(a.x + b.x, a.y + b.y);
}

function getRandomInt(min, max) {
  return Math.floor(Math.random() * (max - min)) + min;
}

function Starfield(width, height, density) {
    this.visuals = [];
    this.images = [];
    this.maxSize = new Point(0,0);
    this.size = new Point(width, height);
    
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
    this.toLoad = Object.keys(frequency).length;
    for (var imageName in this.frequency) {
        addImage(imageName, this.frequency[imageName]);
    }

    function Visual(image, location, distance) {
        this.location = location;
        this.distance = distance;
        this.image = image;

        function tiledLocation(offset, tileSize)
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
                tiledY += distanceSize.Y;
            }
            return new Point(tiledX - size.x, tiledY - size.y);
        }
    }
  
    function populate() {
        var count = (int)(this.width * this.height * density);
        var imageCount = this.images.length;
        for (var i = 0; i < count; ++i)
        {
            var x = getRandomInt(0, width);
            var y = getRandomInt(0, height);
            var distance = Math.random()
            var index = getRandomInt(0, imageCount);
            var image = this.images[index];
            this.visuals.push(new Visual(image, new Point(x, y), (distance * (imageCount - index)) / imageCount));
        }
    }

    function addImage(name, frequency) {
        var image = new Image();
        var starfield = this;
        image.onload = function() {
            starfield.maxSize.x = Math.max(starfield.maxSize.x, image.width);
            starfield.maxSize.y = Math.max(starfield.maxSize.y, image.height);
            
            for (var i = 0; i < frequency; ++i)
            {
                starfield.images.Add(image);
            }
            starfield.toLoad -= 1;
            if(starfield.toLoad == 0) {
                starfield.populate();
            }
        };
        image.src = "/scrace/images/starfield/" + name + ".png";
    }

    function draw(canvas, offset, width, height)
    {
        for (var i = 0; i < this.visuals.length; ++i)
        {
            var v = visuals[i];
            var location = v.TiledLocation(offset, this.size);
            if (location.x < -this.maxSize.x || width < location.x)
                continue;
            if (location.Y < -this.maxSize.Y || height < location.y)
                continue;
            canvas.drawImage(v.image, location.x, location.y);
        }
    }
}
