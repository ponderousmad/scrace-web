"use strict";

/*
namespace RGG2010
{
    /// <summary>
    /// This is the main type for your game
    /// </summary>
    public class Scrace : Microsoft.Xna.Framework.Game
    {
        private bool mAllowEdits = false;
        private Planet mEditPlanet = null;
        private Debris mEditDebris = null;
        private float mLastGateAngle = 0;
        private Gate mEditGate = null;

        /// <summary>
        /// Allows the game to run logic such as updating the world,
        /// checking for collisions, gathering input, and playing audio.
        /// </summary>
        /// <param name="gameTime">Provides a snapshot of timing values.</param>
        protected override void Update(GameTime gameTime)
        {
            if (mAllowEdits)
            {
                Edit(Mouse.GetState(), Keyboard.GetState());
            }
        }

        private class EditInteraction
        {
            public delegate void EditEvent(MouseState mouse, KeyboardState keyboard);

            private EditEvent mUpdate;
            private EditEvent mFinalize;

            public EditInteraction(EditEvent update)
                : this(update, null)
            {
            }

            public EditInteraction(EditEvent update, EditEvent finalize)
            {
                mUpdate = update;
                mFinalize = finalize;
            }

            public void Finalize(MouseState mouse, KeyboardState keyboard)
            {
                if (mFinalize != null)
                {
                    mFinalize(mouse, keyboard);
                }
            }

            public void Update(MouseState mouse, KeyboardState keyboard)
            {
                if (mUpdate != null)
                {
                    mUpdate(mouse, keyboard);
                }
            }
        }

        private EditInteraction mCurrentEdit = null;
        bool mKeysActive = true;

        private void Edit(MouseState mouse, KeyboardState keyboard)
        {
            if (keyboard.GetPressedKeys().Length == 0)
            {
                mKeysActive = true;
            }
            if (mCurrentEdit == null)
            {
                if (mouse.LeftButton == ButtonState.Pressed)
                {
                    if (keyboard.IsKeyDown(Keys.C))
                    {
                        mCurrentEdit = PlanetCreator(mouse);
                    }
                    else if (keyboard.IsKeyDown(Keys.D))
                    {
                        mCurrentEdit = DebrisCreator(mouse);
                    }
                    else if (keyboard.IsKeyDown(Keys.V))
                    {
                        mCurrentEdit = DebrisVelocity(mouse);
                    }
                    else if (keyboard.IsKeyDown(Keys.G))
                    {
                        mCurrentEdit = GateCreator(mouse);
                    }
                    else if (keyboard.IsKeyDown(Keys.H))
                    {
                        mCurrentEdit = GateDirection(mouse);
                    }
                    else
                    {
                        mEditPlanet = FindClickedPlanet(mouse);
                        mEditDebris = FindClickedDebris(mouse);
                        mEditGate = FindClickedGate(mouse);
                    }
                }
                else if (mAllowEdits && mKeysActive)
                {
                    if (keyboard.IsKeyDown(Keys.S) && IsControl(keyboard))
                    {
                        StoreLevel();
                        mKeysActive = false;
                    }
                    else if (keyboard.IsKeyDown(Keys.R))
                    {
                        ResetDebris();
                    }

                    if (mEditPlanet != null)
                    {
                        if (keyboard.IsKeyDown(Keys.T))
                        {
                            mEditPlanet.Type = (PlanetType)(((int)mEditPlanet.Type + 1) % Enum.GetValues(typeof(PlanetType)).Length);
                            mKeysActive = false;
                        }
                        else if (keyboard.IsKeyDown(Keys.OemOpenBrackets))
                        {
                            mEditPlanet.Gravity += 0.5f;
                            mKeysActive = false;
                        }
                        else if (keyboard.IsKeyDown(Keys.OemCloseBrackets))
                        {
                            mEditPlanet.Gravity = Math.Max(0.5f, mEditPlanet.Gravity - 0.5f);
                            mKeysActive = false;
                        }
                    }
                    else if (mEditDebris != null)
                    {
                        if (keyboard.IsKeyDown(Keys.T))
                        {
                            mEditDebris.Type = (DebrisType)(((int)mEditDebris.Type + 1) % Enum.GetValues(typeof(DebrisType)).Length);
                            mKeysActive = false;
                        }
                    }
                }
            }
            else
            {
                if (mouse.LeftButton == ButtonState.Released)
                {
                    mCurrentEdit.Finalize(mouse, keyboard);
                    mCurrentEdit = null;
                }
                else
                {
                    mCurrentEdit.Update(mouse, keyboard);
                }
            }
        }

        private EditInteraction PlanetCreator(MouseState mouseStart)
        {
            mEditPlanet = FindClickedPlanet(mouseStart);
            if (mEditPlanet == null)
            {
                mEditDebris = null;
                mEditPlanet = new Planet(PlanetType.Planetoid, ToSpace(mouseStart), 1);
                mPlanets.Add(mEditPlanet);
            }
            return new EditInteraction(delegate(MouseState mouse, KeyboardState keyboard)
            {
                if (mEditPlanet != null)
                {
                    mEditPlanet.Location = ToSpace(mouse);
                }
            });
        }

        private EditInteraction DebrisCreator(MouseState mouseStart)
        {
            mEditDebris = FindClickedDebris(mouseStart);
            if (mEditDebris == null)
            {
                mEditPlanet = null;
                mEditDebris = new Debris(DebrisType.SmallAsteroid, ToSpace(mouseStart));
                mDebris.Add(mEditDebris);
            }
            return new EditInteraction(delegate(MouseState mouse, KeyboardState keyboard)
            {
                if (mEditDebris != null)
                {
                    mEditDebris.Location = ToSpace(mouse);
                }
            });
        }

        private EditInteraction DebrisVelocity(MouseState mouseStart)
        {
            mEditDebris = FindClickedDebris(mouseStart);
            if (mEditDebris == null)
            {
                return null;
            }
            return new EditInteraction(null, delegate(MouseState mouse, KeyboardState keyboard)
            {
                if (mEditDebris != null)
                {
                    mEditDebris.SetStartVelocity((ToSpace(mouse) - ToSpace(mouseStart)) * 0.01f);
                }
            });
        }

        private EditInteraction GateCreator(MouseState mouseStart)
        {
            mEditGate = FindClickedGate(mouseStart);
            if (mEditGate == null)
            {
                mEditGate = new Gate(ToSpace(mouseStart), 0);
                mEditGate.SetAngle(mLastGateAngle);
                mGates.Add(mEditGate);
            }
            return new EditInteraction(delegate(MouseState mouse, KeyboardState keyboard)
            {
                if (mEditGate != null)
                {
                    mEditGate.Location = ToSpace(mouse);
                }
            });
        }

        private EditInteraction GateDirection(MouseState mouseStart)
        {
            mEditGate = FindClickedGate(mouseStart);
            if (mEditGate == null)
            {
                return null;
            }
            return new EditInteraction(delegate(MouseState mouse, KeyboardState keyboard)
            {
                if (mEditGate != null)
                {
                    Vector2 direction = ToSpace(mouse) - ToSpace(mouseStart);
                    mLastGateAngle = (float)Math.Atan2(direction.Y, direction.X);
                    mEditGate.SetAngle(mLastGateAngle);
                }
            });
        }

        private Vector2 ToSpace(MouseState mouse)
        {
            return new Vector2(mouse.X, mouse.Y) - mScroll;
        }
    }
}
*/

var getTimestamp = null;
if (window.performance.now) {
    console.log("Using high performance timer");
    getTimestamp = function () { return window.performance.now(); };
} else {
    if (window.performance.webkitNow) {
        console.log("Using webkit high performance timer");
        getTimestamp = function () { return window.performance.webkitNow(); };
    } else {
        console.log("Using low performance timer");
        getTimestamp = function () { return new Date().getTime(); };
    }
}

var kGatePenalty = 1000;

function formatTime(totalMilliseconds) {
    var showTime = Math.abs(totalMilliseconds),
        minutes = Math.floor(showTime / 60000.0);
    if (minutes < 10) {
        minutes = "0" + minutes;
    }
    showTime -= minutes * 60000;
    var seconds = Math.floor(showTime / 1000);
    if (seconds < 10) {
        seconds = "0" + seconds;
    }
    var milliseconds = Math.floor(showTime - (seconds * 1000));
    if (milliseconds < 100) {
        if (milliseconds < 10) {
            milliseconds = "00" + milliseconds;
        } else {
            milliseconds = "0" + milliseconds;
        }
    }
    return (totalMilliseconds < 0 ? "-" : " ") + minutes + ":" + seconds + "." + milliseconds;
}

function formatRaceStats(time, gatesMissed) {
    var rating = time + gatesMissed * kGatePenalty;
    if (gatesMissed < 10) {
        gatesMissed = " " + gatesMissed;
    }
    return {
        score: rating,
        display: formatTime(time) + " + " + gatesMissed + " Gates Missed =" + formatTime(rating)
    };
}

var Scrace = function () {
    var kWarmupDelay = 1000,
        kLightLength = 1000,
        kTotalStartDelay = kWarmupDelay + 2 * kLightLength,
        uiBatch = new ImageBatch("images/ui/");
    
    this.starterAmberOff = uiBatch.load("AmberLightOff.png");
    this.starterAmberOn =  uiBatch.load("AmberLightOn.png");
    this.starterGreenOff = uiBatch.load("GreenLightOff.png");
    this.starterGreenOn =  uiBatch.load("GreenLightOn.png");
    this.introOverlay =    uiBatch.load("IntroOverlay.png");
    
    uiBatch.commit();

    this.starterDong = new SoundEffect("audio/Dong.wav");
    this.starterDing = new SoundEffect("audio/Ding.wav");
    
    this.starfield = new Starfield(5000, 5000, 0.001, 0.95, true);
    this.planets = [];
    this.debris = [];
    this.gates = [];
    this.player = new Player();
    this.level = 1;
    
    this.paused = true;
    this.pauseDown = false;
    this.resetting = false;
    this.lastTime = getTimestamp();
    
    this.starter = null;
    this.allowEdits = false;
    
    this.highscores = {};
    this.raceTime = null;
    
    this.canvas = document.getElementById("canvas");
    this.context = this.canvas.getContext("2d");
    this.context.font = "15px monospace";
    this.keyboardState = new KeyboardState(window);
    this.mouseState = new MouseState(this.canvas);
    this.scroll = new Vector(this.canvas.width * 0.5, this.canvas.height * 0.5);
   
    var self = this;

    this.loadLevel = function (resource) {
        var request = new XMLHttpRequest();
        request.open("GET", resource, true);
        request.responseType = "json";
        request.onload = function () {
            console.log("Loading " + resource);
            var planetData = request.response["Planets"];
            self.planets.length = 0;
            for (var i = 0; i < planetData.length; ++i) {
                var planet = planetData[i];
                var location = parseVector(planet);
                var type = PlanetNames[planet.type];
                self.planets.push(new Planet(type, location, planet.gravity));
            }
            
            var debrisData = request.response["Debris"];
            self.debris.length = 0;
            for (i = 0; i < debrisData.length; ++i) {
                var d = debrisData[i];
                var location = parseVector(d);
                var velocity = d["Velocity"] ? parseVector(d["Velocity"]) : null;
                var type = DebrisNames[d.type];
                self.debris.push(new Debris(type, location, velocity));
            }
            
            var gatesData = request.response["Gates"];
            self.gates.length = 0;
            for (var i = 0; i < gatesData.length; ++i) {
                var gate = gatesData[i];
                var location = parseVector(gate);
                var angle = parseFloat(gate.angle);
                self.gates.push(new Gate(location, angle));
            }
            
            self.setupStart();
            
            var saveDiv = document.getElementById("save");
            
            saveDiv.innerHTML = JSON.stringify(self.storeLevel(), null, 4);
        };
        request.send();
    }
    
    this.storeLevel = function () {
        var planets = [];
        var debris = [];
        var gates = [];
        
        for (var i = 0; i < self.planets.length; ++i) {
            self.planets[i].store(planets);
        }
        
        for (i = 0; i < self.debris.length; ++i) {
            self.debris[i].store(debris);
        }
        
        for (i = 0; i < self.gates.length; ++i) {
            self.gates[i].store(gates);
        }
        
        return {
            Planets: planets,
            Debris: debris,
            Gates: gates
        };
    };
    
    this.loadCurrentLevel = function() {
        self.loadLevel("tracks/level" + self.level + ".json");
    }
    
    this.resetLevel = function() {
        var filteredDebris = []
        for (var i = self.debris.length - 1; i >= 0; --i) {
            if (self.debris[i].isPlayerDebris()) {
                self.debris.splice(i, 1)
            } else {
                self.debris[i].reset();
            }
        }
        for (i = 0; i < self.gates.length; ++i) {
            self.gates[i].reset();
        }
        self.setupStart();
    }
    
    this.setupStart = function() {
        if (self.resetting) {
            self.scroll.set(self.canvas.width * 0.5, self.canvas.height * 0.5);
            self.player.reset(new Vector(0,0));
            self.lastTime = getTimestamp();
            self.starter = 0;
            self.raceTime = null;
            self.allowEdits = false;
            self.paused = false;
            self.resetting = false;
        }
    }
    
    this.raceStarted = function() {
        return self.starter != null && self.starter >= kTotalStartDelay;
    }
   
    this.update = function() {
        var i = 0;
        var now = getTimestamp();
        var delta = now - self.lastTime;
        var trueDelta = delta;
        var player = self.player;
        
        if(self.paused) {
            delta = 0;
        }
        
        if (!self.paused && (self.starter != null || self.player.state === PlayerState.Dead)) {
            for (i = 0; i < self.debris.length; ++i) {
                self.debris[i].update(delta, self.planets);
            }
        }

        if (self.starter != null) {
            
            if (self.starter < kWarmupDelay && self.starter + delta > kWarmupDelay)
            {
                self.starterDong.play();
            }
            else if (self.starter < kWarmupDelay + kLightLength && self.starter + delta > kWarmupDelay + kLightLength)
            {
                self.starterDong.play();
            }
            else if ((!self.raceStarted()) && (self.starter + delta) > kTotalStartDelay)
            {
                self.starterDing.play();
            }
            self.starter += delta;
        }
        
        player.update((self.paused || !self.raceStarted()) ? 0 : delta, self.planets, self.debris, self.gates, self.keyboardState);
        
                
        var raceOver = player.state == PlayerState.Reset ||
                       player.state == PlayerState.Dead ||
                       player.state == PlayerState.Finished;
        
        var pauseDown = self.keyboardState.isAsciiDown("P");        
        if (self.allowEdits || !raceOver) {
            if (self.pauseDown != pauseDown && pauseDown && (self.starter != null || self.allowEdits)) {
                self.paused = ! self.paused;
                console.log("Toggled pause");
            }
        }
        self.pauseDown = pauseDown;
        
        if (raceOver) {
            if (self.raceTime == null && self.starter != null) {
                var missCount = 0;
                for (i = 0; i < self.gates.length; ++i) {
                    if (!self.gates[i].passed) {
                        ++missCount;
                    }
                }
                self.raceTime = formatRaceStats(self.starter, missCount);
                if (player.state == PlayerState.Finished) {
                    self.checkHighscore(self.raceTime);
                }
            }
            self.starter = null;
            if (!self.resetting) {              
                for (var k = "1".charCodeAt(); k <= "5".charCodeAt(); ++k) {
                    if (self.keyboardState.isKeyDown(k)) {
                        self.resetting = true;
                        self.level = String.fromCharCode(k);
                        self.loadCurrentLevel();
                    }
                }
                
                if (!self.resetting) {
                    if (player.state == PlayerState.Reset) {
                        self.resetting = true;
                        self.resetLevel();
                    } else if (self.keyboardState.isAsciiDown("E")) {
                        self.allowEdits = true;
                        self.paused = true;
                        self.resetLevel();
                   }
                }
            }
        }
        
        if (player.state === PlayerState.Dead) {
            var kScrollStep = 1;
            if (self.keyboardState.isKeyDown(Keys.Left)) {
                self.scroll.x += kScrollStep * trueDelta;
            } else if (self.keyboardState.isKeyDown(Keys.Right)) {
                self.scroll.x -= kScrollStep * trueDelta;
            }
            
            if (self.keyboardState.isKeyDown(Keys.Up)) {
                self.scroll.y += kScrollStep * trueDelta;
            } else if (self.keyboardState.isKeyDown(Keys.Down)) {
                self.scroll.y -= kScrollStep * trueDelta;
            }
        } else {
            self.scroll.set(
                self.canvas.width * 0.5 - self.player.location.x,
                self.canvas.height * 0.5 - self.player.location.y
            );
        }
        
        self.lastTime = now;
    }
    
    // Alternate scrolling behaviour.
    this.updateScroll = function(player) {
        if (self.allowEdits || player.state != PlayerState.Alive) {
            return;
        }
        var left = -self.scroll.x,
            width = self.canvas.width,
            top = -self.scroll.y,
            height = self.canvas.height,
            bottom = top + height,
            hPad = self.canvas.width * 0.25,
            vPad = self.canvas.width * 0.25;

        if (player.location.x - hPad < left) {
            left = player.location.x - hPad;
        } else if (player.location.x + hPad > left + width) {
            left = player.location.x - width + hPad;
        }
        if (player.location.y - vPad < top) {
            top = player.location.y - vPad;
        } else if (player.location.y + vPad > top + height) {
            top = player.location.y - height + vPad;
        }
        self.scroll.set(-left, -top);
    }
    
    this.spaceLocation = function(mouseState) {
        return addVectors(self.scroll, mouseState.location);
    }
    
    this.findClickedPlanet = function (mouseState) {
        for (var i = 0; i < self.planets.length; ++i) {
            if (self.planets[i].contains(self.spaceLocation(mouseState))) {
                return self.planets[i];
            }
        }
        return null;
    };
    
    this.findClickedDebris = function (mouseState) {
        for (var i = 0; i < self.debris.length; ++i) {
            if (self.debris[i].contains(self.spaceLocation(mouseState))) {
                return self.debris[i];
            }
        }
        return null;
    };
    
    this.findClickedGate = function (mouseState) {
        for (var i = 0; i < self.gates.length; ++i) {
            if (self.gates[i].contains(self.spaceLocation(mouseState))) {
                return self.gates[i];
            }
        }
        return null;
    };
    
    this.checkHighscore = function(raceStats) {
        var kMaxStats = 5;
        if (!self.highscores[self.level]) {
            self.highscores[self.level] = [raceStats];
        } else {
            var levelScores = self.highscores[self.level];
            
            for (var i = 0; i < levelScores.length; ++i) {
                if (raceStats.score < levelScores[i].score) {
                    levelScores.splice(i, 0, raceStats);
                    raceStats = null;
                    break;
                }
            }
            
            if(raceStats != null) {
                levelScores.push(raceStats);
            }
            
            if (levelScores.length > kMaxStats) {
                levelScores.pop();
            }
        }
    }
   
    this.drawHud = function() {
        var center = self.canvas.width * .5;
        var hudOffset = 20;

        if (self.starter != null) {
            var lightOneOn = self.starter > kWarmupDelay;
            var lightTwoOn = self.starter > kWarmupDelay + kLightLength;
            var lightThreeOn = self.starter > kTotalStartDelay;
            var lightSize = self.starterAmberOn.width;
            if (self.starter < kTotalStartDelay + kLightLength) {
                self.context.drawImage(lightOneOn   ? self.starterAmberOn : self.starterAmberOff, center - (lightSize * 2), 40);
                self.context.drawImage(lightTwoOn   ? self.starterAmberOn : self.starterAmberOff, center - (lightSize * 0.5), 40);
                self.context.drawImage(lightThreeOn ? self.starterGreenOn : self.starterGreenOff, center + lightSize, 40);
            }

            var time = self.starter - kTotalStartDelay;

            self.context.fillStyle = "rgb(0,255,0)";
            self.context.textAlign = "start";
            self.context.fillText("Race Time: " + formatTime(time), hudOffset, hudOffset);
        } else if(!self.allowEdits) {
            self.context.drawImage(self.introOverlay, center - self.introOverlay.width *.5, 80);

            if(!self.resetting) {
                if (self.raceTime != null && (new Date().getSeconds()) % 2 == 0)
                {
                    self.context.fillStyle = self.player.state == PlayerState.Finished ? "rgb(0,255,0)" : "rgb(255,0,0)";
                    self.context.textAlign = "start";
                    self.context.fillText("Race Time: " + self.raceTime.display, hudOffset, hudOffset);
                }
                var levelStats = self.highscores[self.level];
                if (levelStats)
                {
                    self.context.fillStyle = "rgb(0,255,255)";
                    self.context.textAlign = "center";
                    
                    var offset = 350;
                    self.context.fillText("Best Times", center, offset);

                    for (var i = 0; i < levelStats.length; ++i)
                    {
                        offset += 25;
                        self.context.fillText(levelStats[i].display, center, offset);
                    }
                }
            }
        } else {
            self.context.fillStyle = "rgb(0,255,255)";
            self.context.textAlign = "start";
            self.context.fillText("Editing: " + self.mouseState.location.x + ", " + self.mouseState.location.y, hudOffset, hudOffset);
        }
    }
    
    this.draw = function() {
        requestAnimationFrame(self.draw);
        self.starfield.draw(self.context, self.scroll, self.canvas.width, self.canvas.height);
        for (var i = 0; i < self.planets.length; ++i) {
            self.planets[i].draw(self.context, self.scroll);
        }
        for (i = 0; i < self.debris.length; ++i) {
            self.debris[i].draw(self.context, self.scroll);
        }
        for (i = 0; i < self.gates.length; ++i) {
            self.gates[i].draw(self.context, self.scroll, i == self.gates.length - 1);
        }
        self.player.draw(self.context, self.scroll);
        
        self.drawHud();
    }
};

window.onload = function(e) {
    console.log("window.onload", e, Date.now())    
    var scrace = new Scrace();
    scrace.loadCurrentLevel();
    window.setInterval(scrace.update, 16);
    scrace.draw();
};
