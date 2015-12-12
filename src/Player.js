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

    this.location = new Vector(0, 0);
    this.velocity = new Vector2(0, 0);
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
    this.kMaxPlanetDistanceSq = kMaxPlanetDistance * kMaxPlanetDistance;
    
    var self = this;

    /*
    public void LoadContent(ContentManager content)
    {
        mSprite = content.Load<Texture2D>("Ships/Player");
        mThrust = content.Load<Texture2D>("Ships/Thrust");
        mLeftThruster = content.Load<Texture2D>("Ships/RetroLeft");
        mRightThruster = content.Load<Texture2D>("Ships/RetroRight");
        mLeftRearThruster = content.Load<Texture2D>("Ships/RetroRearLeft");
        mRightRearThruster = content.Load<Texture2D>("Ships/RetroRearRight");
        mExplodeSound = content.Load<SoundEffect>("Sounds/Splat");

        mExplosion = new Texture2D[]
        {
            content.Load<Texture2D>("Ships/Explode01"),
            content.Load<Texture2D>("Ships/Explode02"),
            content.Load<Texture2D>("Ships/Explode03"),
            content.Load<Texture2D>("Ships/Explode04"),
            content.Load<Texture2D>("Ships/Explode05"),
            content.Load<Texture2D>("Ships/Explode06"),
            content.Load<Texture2D>("Ships/Explode07"),
            content.Load<Texture2D>("Ships/Explode08"),
            content.Load<Texture2D>("Ships/Explode09")
        };
    }
    */

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
        if (self.state === PlayerState.Dying) {
            var frame = Math.Floor(self.sinceDied / kExplosionFrameMilliseconds);
            if (frame >= self.explosion.length) {
                frame = self.explosion.length - 1;
            }
            var position = addVectors(self.location, self.offset);
            var size = new Vector(self.explosion[frame].width, self.explosion[frame].height);
            context.Draw(
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
        context.translate(-xLoc, -yLoc);
        context.rotate(self.angle);
        context.translate(xLoc - xSpriteOffset, yLoc - ySpriteOffset);

        var location = addVectors(location, offset);
        if (self.thrusting) {
            context.Draw(self.thrust, location.x, location.y, width, height);
        }
        if (self.leftRetro) {
            context.Draw(self.leftThruster, location.x, location.y, width, height);
        }
        if (self.rightRetro) {
            context.Draw(self.rightThruster, location.x, location.y, width, height);
        }
        if (self.leftRearRetro) {
            context.Draw(self.leftRearThruster, location.x, location.y, width, height);
        }
        if (self.rightRearRetro) {
            context.Draw(self.rightRearThruster, location.x, location.y, width, height);
        }
        context.Draw(self.sprite, location.x, location.y, width, height);
        context.restore();
    }
}
