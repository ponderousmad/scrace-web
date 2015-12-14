"use strict";

var Thrusters = {
    None : 0,
    RotateLeft : 1,
    RotateRight : 2,
    Accelerate : 4,
    Break : 8
}

var PlayerState = {
    Alive : 0,
    Dying : 1,
    Dead : 2,
    Reset : 3,
    Finished : 4
}

function getDirection(angle) {
    return new Vector(Math.cos(angle), Math.sin(angle));
}

function distanceSquared(a, b) {
    var xDiff = b.x - a.x;
    var yDiff = b.y - a.y;
    return xDiff * xDiff + yDiff * yDiff;
}

function determineThrust(keyboardState) {
    var thrust = 0;
    if (keyboardState.IsKeyDown(Keys.Up)) {
        thrust |= Thrusters.Accelerate;
    }
    if (keyboardState.IsKeyDown(Keys.Down)) {
        thrust |= Thrusters.Break;
    }
    if (keyboardState.IsKeyDown(Keys.Left)) {
        thrust |= Thrusters.RotateLeft;
    }
    if (keyboardState.IsKeyDown(Keys.Right)) {
        thrust |= Thrusters.RotateRight;
    }
    return thrust;
}

var Player = function() {
    this.sprite = null;
    this.thrust = null;
    this.leftThruster = null;
    this.rightThruster = null;
    this.leftRearThruster = null;
    this.rightRearThruster = null;
    this.explosion = [];
    this.explodeSound = null;
    this._loaded = false;

    this.location = new Vector(0, 0);
    this.velocity = new Vector(0, 0);
    this.angle = 0.0;
    this.thrusting = false;
    this.leftRetro = false;
    this.rightRetro = false;
    this.leftRearRetro = false;
    this.rightRearRetro = false;
    this.state = PlayerState.Alive;
    this.sinceDied = 0.0;
    this.bits = null;

    this.kManouverPower = 0.005;
    this.kMaxAcceleration = 0.0006;
    this.kMaxBreak = 0.0005;
    this.kMaxSpeed = 0.5;
    this.kExplosionFrameMilliseconds = 80;
    this.kPlayerSize = 4;

    this.kMaxPlanetDistance = 500.0;
    this.kMaxPlanetDistanceSq = this.kMaxPlanetDistance * this.kMaxPlanetDistance;
    
    var self = this;

    this._loadContent = function() {
        var batch = new ImageBatch(function(){ self._loaded = true; });
        var path = "/scrace/images/ship/"
        self.sprite = batch.load(path + "Player.png");
        self.thrust = batch.load(path + "Thrust.png");
        self.leftThruster = batch.load(path + "RetroLeft.png");
        self.rightThruster = batch.load(path + "RetroRight.png");
        self.leftRearThruster = batch.load(path + "RetroRearLeft.png");
        self.rightRearThruster = batch.load(path + "RetroRearRight.png");
        //self.explodeSound = content.Load<SoundEffect>("Sounds/Splat.png");

        var path = "/scrace/images/explode/"
        self.explosion = [
            batch.load(path + "Explode01.png"),
            batch.load(path + "Explode02.png"),
            batch.load(path + "Explode03.png"),
            batch.load(path + "Explode04.png"),
            batch.load(path + "Explode05.png"),
            batch.load(path + "Explode06.png"),
            batch.load(path + "Explode07.png"),
            batch.load(path + "Explode08.png"),
            batch.load(path + "Explode09.png")
        ];
        batch.commit();
    }

    this.reset = function(location) {
        self.location = location;
        self.velocity = new Vector(0, 0);
        self.angle = -Math.PI / 2;
        self.thrusting = false;
        self.rightRetro = false;
        self.rightRearRetro = false;
        self.leftRetro = false;
        self.leftRearRetro = false;
        self.state = PlayerState.Alive;
    }

    this.update = function(elapsed, planets, debris, gates, keyboardState) {
        var before = self.location;
        if (self.state === PlayerState.Dead || self.state === PlayerState.Finished) {
            if (keyboard.isKeyDown(Keys.Space)) {
                self.state = PlayerState.Reset;
            }
            return;
        } else if (self.state === PlayerState.Dying) {
            self.location = addVectors(self.location, scaleVector(self.velocity, elapsed));
            self.velocity = scaleVector(self.velocity, 0.3);
            self.sinceDied += elapsed;
            if (self.sinceDied > self.explosion.Length * self.kExplosionFrameMilliseconds) {
                self.state = PlayerState.Dead;
            }
            return;
        }
        var direction = getDirection(self.angle);

        self.location = addVectors(self.location, scaleVector(self.velocity, elapsed));

        self.thrusting = false;
        self.leftRetro = false;
        self.rightRetro = false;
        self.leftRearRetro = false;
        self.rightRearRetro = false;
        var thrust = determineThrust(keyboardState);
        if ((thrust & Thrusters.RotateLeft) === Thrusters.RotateLeft) {
            self.angle -= self.kManouverPower * elapsed;
            self.rightRetro = true;
            self.leftRearRetro = true;
        }
        else if ((thrust & Thrusters.RotateRight) === Thrusters.RotateRight) {
            self.angle += self.kManouverPower * elapsed;
            self.leftRetro = true;
            self.rightRearRetro = true;
        }
        self._clampAngle();

        var gravity = new Vector(0, 0);
        for (var i = 0; i < planets.length; ++i) {
            var planet = planets[i];
            var gravity = planet.determineForce(self.location, self.kMaxPlanetDistanceSq);
            if (gravity) {
                self.velocity = addVectors(self.velocity, scaleVector(gravity, elapsed));
            }
            if (distanceSquared(planet.location, self.location) < (planet.size * planet.size)) {
                self.crash();
            }
        }

        for (i = 0; i < debris.length; ++i) {
            var d = debris[i];
            var size = d.Size + kPlayerSize;
            if (distanceSquared(self.location, d.location) < (size * size))
            {
                self.crash();
            }
        }

        var last = null;
        for (i = 0; i < gates.length; ++i) {
            var g = gates[i];
            g.UpdatePassed(before, self.location);
            g.UpdatePassed(self.location, self.location + (getDirection(self.angle) * self.sprite.Width / 2.0));
            last = g;
        }

        if(last && last.hasPassed) {
            self.state = PlayerState.Finished;
            return;
        }

        if ((thrust & Thrusters.Accelerate) == Thrusters.Accelerate) {
            self.velocity = addVectors(self.velocity, scaleVector(direction, self.kMaxAcceleration * elapsed));
            self.thrusting = true;
        } else if ((thrust & Thrusters.Break) == Thrusters.Break) {
            var mag = self._speedSquared();
            if (mag > 0) {
                self.rightRetro = true;
                self.leftRetro = true;
                self.rightRearRetro = true;
                self.leftRearRetro = true;

                if (mag < (self.kMaxBreak * self.kMaxBreak * elapsed * elapsed)) {
                    self.velocity = Vector(0, 0);
                } else {
                    self.velocity = addVectors(self.velocity, scaleVector(vectorNormalize(self.velocity), self.kMaxBreak * elapsed));
                }
            }
        }
        if (self._SpeedSquared() > self.kMaxSpeed * self.kMaxSpeed) {
            self.velocity = vectorNormalize(self.velocity) * self.kMaxSpeed;
        }
    }

    this._clampAngle = function() {
        while (self.angle < -Math.PI) {
            self.angle += 2 * Math.PI;
        }

        while (self.angle > Math.PI) {
            self.angle -= 2 * Math.PI;
        }
    }

    this.crash = function() {
        if (self.state != PlayerState.Dying) {
            self.state = PlayerState.Dying;
            self.explodeSound.Play();
            self.sinceDied = 0;

            self.bits = [];
            var chunk = new Debris(DebrisType.PlayerCockpit, self.location);
            chunk.SetStartVelocity(addVectors(self.velocity, getDirection(self.angle)));
            chunk.SetSpin(Math.PI * 0.01);
            self.bits.push(chunk);
            chunk = new Debris(DebrisType.PlayerLeft, mLocation);
            chunk.SetStartVelocity(addVectors(self.velocity, getDirection(self.angle + Math.PI * 0.5)));
            chunk.SetSpin(-Math.PI * 0.02);
            self.bits.push(chunk);
            chunk = new Debris(DebrisType.PlayerRight, mLocation);
            chunk.SetStartVelocity(addVectors(self.velocity, getDirection(self.angle - Math.PI * 0.5)));
            chunk.SetSpin(Math.PI * 0.03);
            self.bits.push(chunk);
        }
    }

    this._speedSquared = function() {
        return self.velocity.x * self.velocity.x + self.velocity.y * self.velocity.y;
    }

    this.draw = function(context, offset) {
        if (!self._loaded) {
            console.log("Not loaded");
            return;
        }
        if (self.state === PlayerState.Dying) {
            var frame = Math.Floor(self.sinceDied / kExplosionFrameMilliseconds);
            if (frame >= self.explosion.length) {
                frame = self.explosion.length - 1;
            }
            var position = addVectors(self.location, self.offset);
            var size = new Vector(self.explosion[frame].width, self.explosion[frame].height);
            context.drawImage(
                self.explosion[frame],
                position.x - (size.width * 0.5), position.y - (size.height * 0.5),
                size.width, size.height
            );
            return;
        } else if (self.state != PlayerState.Alive && self.state != PlayerState.Finished) {
            return;
        }
        var width = self.sprite.width;
        var height = self.sprite.height;
        var xSpriteOffset = width / 4.0;
        var ySpriteOffset = height / 2.0;
        var xLoc = self.location.x + offset.x;
        var yLoc = self.location.y + offset.y;

        context.save();
        //context.translate(-xLoc, -yLoc);
        //context.rotate(self.angle);
        //context.translate(xLoc - xSpriteOffset, yLoc - ySpriteOffset);

        var location = addVectors(self.location, offset);
        if (self.thrusting) {
            context.drawImage(self.thrust, location.x, location.y, width, height);
        }
        if (self.leftRetro) {
            context.drawImage(self.leftThruster, location.x, location.y, width, height);
        }
        if (self.rightRetro) {
            context.drawImage(self.rightThruster, location.x, location.y, width, height);
        }
        if (self.leftRearRetro) {
            context.drawImage(self.leftRearThruster, location.x, location.y, width, height);
        }
        if (self.rightRearRetro) {
            context.drawImage(self.rightRearThruster, location.x, location.y, width, height);
        }
        console.log("Drawing ship");
        context.drawImage(self.sprite, location.x, location.y, width, height);
        context.restore();
    }
    
    this._loadContent();
}
