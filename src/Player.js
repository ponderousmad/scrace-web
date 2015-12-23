"use strict";

var Thrusters = {
    None : 0,
    RotateLeft : 1,
    RotateRight : 2,
    Accelerate : 4,
    Break : 8
};

var PlayerState = {
    Alive : 0,
    Dying : 1,
    Dead : 2,
    Reset : 3,
    Finished : 4
};

var Keys = {
    Up : 38,
    Down : 40,
    Left : 37,
    Right : 39,
    Reset : 32,
    Abort : 27
};

function getDirection(angle) {
    return new Vector(Math.cos(angle), Math.sin(angle));
}

function determineThrust(keyboardState) {
    var thrust = 0;
    if (keyboardState.isKeyDown(Keys.Up)) {
        thrust |= Thrusters.Accelerate;
    }
    if (keyboardState.isKeyDown(Keys.Down)) {
        thrust |= Thrusters.Break;
    }
    if (keyboardState.isKeyDown(Keys.Left)) {
        thrust |= Thrusters.RotateLeft;
    }
    if (keyboardState.isKeyDown(Keys.Right)) {
        thrust |= Thrusters.RotateRight;
    }
    return thrust;
}

var Player = function () {
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
    this.state = PlayerState.Dead;
    this.sinceDied = 0.0;
    this.bits = null;

    var kManouverPower = 0.005,
        kMaxAcceleration = 0.0006,
        kMaxBreak = 0.0005,
        kMaxSpeed = 0.5,
        kExplosionFrameMilliseconds = 80,
        kPlayerSize = 4,

        kMaxPlanetDistance = 500.0,
        kMaxPlanetDistanceSq = kMaxPlanetDistance * kMaxPlanetDistance;
    
    var self = this;

    this._loadContent = function () {
        var batch = new ImageBatch("images/ship/", function () { self._loaded = true; });
        self.sprite = batch.load("Player.png");
        self.thrust = batch.load("Thrust.png");
        self.leftThruster = batch.load("RetroLeft.png");
        self.rightThruster = batch.load("RetroRight.png");
        self.leftRearThruster = batch.load("RetroRearLeft.png");
        self.rightRearThruster = batch.load("RetroRearRight.png");

        batch.setPath("images/explode/");
        self.explosion = [
            batch.load("Explode01.png"),
            batch.load("Explode02.png"),
            batch.load("Explode03.png"),
            batch.load("Explode04.png"),
            batch.load("Explode05.png"),
            batch.load("Explode06.png"),
            batch.load("Explode07.png"),
            batch.load("Explode08.png"),
            batch.load("Explode09.png")
        ];
        batch.commit();

        self.explodeSound = new SoundEffect("audio/Splat.wav");
    };

    this.reset = function (location) {
        self.location = location;
        self.velocity = new Vector(0, 0);
        self.angle = -Math.PI / 2;
        self.thrusting = false;
        self.rightRetro = false;
        self.rightRearRetro = false;
        self.leftRetro = false;
        self.leftRearRetro = false;
        self.state = PlayerState.Alive;
    };

    this.update = function (elapsed, planets, debris, gates, keyboardState) {
        var before = self.location.clone(),
            i = 0;
        if (self.state === PlayerState.Dead || self.state === PlayerState.Finished) {
            if (keyboardState.isKeyDown(Keys.Reset)) {
                console.log("Reset requested");
                self.state = PlayerState.Reset;
            }
            return;
        } else if (self.state === PlayerState.Dying) {
            self.location.addScaled(self.velocity, elapsed);
            self.velocity.scale(0.3);
            self.sinceDied += elapsed;
            if (self.sinceDied > self.explosion.length * kExplosionFrameMilliseconds) {
                self.state = PlayerState.Dead;
            }
            return;
        }
        if (elapsed === 0) {
            return;
        }
        var direction = getDirection(self.angle);

        self.location.addScaled(self.velocity, elapsed);

        self.thrusting = false;
        self.leftRetro = false;
        self.rightRetro = false;
        self.leftRearRetro = false;
        self.rightRearRetro = false;
        var thrust = determineThrust(keyboardState);
        if ((thrust & Thrusters.RotateLeft) === Thrusters.RotateLeft) {
            self.angle -= kManouverPower * elapsed;
            self.rightRetro = true;
            self.leftRearRetro = true;
        } else if ((thrust & Thrusters.RotateRight) === Thrusters.RotateRight) {
            self.angle += kManouverPower * elapsed;
            self.leftRetro = true;
            self.rightRearRetro = true;
        }
        self.angle = clampAngle(self.angle);

        for (i = 0; i < planets.length; ++i) {
            var planet = planets[i];
            var accel = planet.determineAcceleration(self.location, kMaxPlanetDistanceSq, elapsed);
            if (accel) {
                if (accel === "crash") {
                    self.crash(debris);
                } else {
                    self.velocity.add(accel);
                }
            }
        }

        for (i = 0; i < debris.length; ++i) {
            var d = debris[i];
            var size = d.size() + kPlayerSize;
            if (pointDistanceSq(self.location, d.location) < (size * size)) {
                self.crash(debris);
            }
        }

        var last = null;
        for (i = 0; i < gates.length; ++i) {
            var g = gates[i];
            g.checkPassed(before, self.location);
            g.checkPassed(self.location, addVectors(self.location, scaleVector(getDirection(self.angle), self.sprite.width * 0.5)));
            last = g;
        }

        if (last && last.passed) {
            self.state = PlayerState.Finished;
            return;
        }
        
        if (keyboardState.isKeyDown(Keys.Abort)) {
            self.crash();
        }

        if ((thrust & Thrusters.Accelerate) === Thrusters.Accelerate) {
            self.velocity.addScaled(direction, kMaxAcceleration * elapsed);
            self.thrusting = true;
        } else if ((thrust & Thrusters.Break) === Thrusters.Break) {
            var speedSq = self.velocity.lengthSq();
            if (speedSq > 0) {
                self.rightRetro = true;
                self.leftRetro = true;
                self.rightRearRetro = true;
                self.leftRearRetro = true;

                if (speedSq < (kMaxBreak * kMaxBreak * elapsed * elapsed)) {
                    self.velocity.set(0, 0);
                } else {
                    self.velocity.addScaled(self.velocity, -kMaxBreak * elapsed / Math.sqrt(speedSq));
                }
            }
        }
        if (self.velocity.lengthSq() > kMaxSpeed * kMaxSpeed) {
            self.velocity.normalize();
            self.velocity.scale(kMaxSpeed);
        }
    };

    this.crash = function (debris) {
        if (self.state !== PlayerState.Dying) {
            self.state = PlayerState.Dying;
            self.explodeSound.play();
            self.sinceDied = 0;
            var chunk = new Debris(DebrisType.PlayerCockpit, self.location.clone());
            chunk.setStartVelocity(addVectors(self.velocity, scaleVector(getDirection(self.angle), 0.02)));
            chunk.setSpin(Math.PI * 0.01);
            debris.push(chunk);
            chunk = new Debris(DebrisType.PlayerLeft, self.location.clone());
            chunk.setStartVelocity(addVectors(self.velocity, scaleVector(getDirection(self.angle + Math.PI * 0.5), 0.02)));
            chunk.setSpin(-Math.PI * 0.02);
            debris.push(chunk);
            chunk = new Debris(DebrisType.PlayerRight, self.location.clone());
            chunk.setStartVelocity(addVectors(self.velocity, scaleVector(getDirection(self.angle - Math.PI * 0.5), 0.02)));
            chunk.setSpin(Math.PI * 0.03);
            debris.push(chunk);
        }
    };

    this.draw = function (context, offset) {
        if (!self._loaded) {
            return;
        }
        if (self.state === PlayerState.Dying) {
            var frame = Math.floor(self.sinceDied / kExplosionFrameMilliseconds);
            if (frame >= self.explosion.length) {
                frame = self.explosion.length - 1;
            }
            var position = addVectors(self.location, offset);
            var size = new Vector(self.explosion[frame].width, self.explosion[frame].height);
            context.drawImage(
                self.explosion[frame],
                position.x - (size.x * 0.5), position.y - (size.y * 0.5),
                size.x, size.y
            );
            return;
        } else if (self.state !== PlayerState.Alive && self.state !== PlayerState.Finished) {
            return;
        }
        var width = self.sprite.width,
            height = self.sprite.height,
            xSpriteOffset = width / 4.0,
            ySpriteOffset = height / 2.0,
            xLoc = self.location.x + offset.x,
            yLoc = self.location.y + offset.y;

        context.save();       
        context.translate(xLoc, yLoc);
        context.rotate(self.angle);
        context.translate(-xLoc - xSpriteOffset, -yLoc - ySpriteOffset);
        
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
        context.drawImage(self.sprite, location.x, location.y, width, height);
        context.restore();
    };
    
    this._loadContent();
}
