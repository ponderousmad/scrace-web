"use strict";

/*
namespace RGG2010
{
    /// <summary>
    /// This is the main type for your game
    /// </summary>
    public class Scrace : Microsoft.Xna.Framework.Game
    {
        private static readonly Vector2 kInitialScroll = new Vector2(400, 100);

        private Starfield mStarfield = new Starfield();
        private Vector2 mScroll = kInitialScroll; 

        private bool mAllowEdits = false;
        private Planet mEditPlanet = null;
        private Debris mEditDebris = null;
        private float mLastGateAngle = 0;
        private Gate mEditGate = null;

        private bool mPausedDown = false;
        private bool mPaused = false;

        private int mLevel = 0;

        private const int kLevels = 5;

        private float mRaceTime = 0;

        Dictionary<int,List<Stats>> mStats = new Dictionary<int,List<Stats>>();

        /// <summary>
        /// Allows the game to perform any initialization it needs to before starting to run.
        /// This is where it can query for any required services and load any non-graphic
        /// related content.  Calling base.Initialize will enumerate through any components
        /// and initialize them as well.
        /// </summary>
        protected override void Initialize()
        {
            for (int i = 1; i <= kLevels; ++i)
            {
                mStats[i] = new List<Stats>();
            }
        }

        private void StoreLevel()
        {
            string path = System.IO.Path.Combine(ContentBuildPath, @"Levels\\Level" + mLevel.ToString() + ".xml");
            using (Utils.DocumentWriter writer = new RGG2010.Utils.DocumentWriter(path))
            using (Utils.IDataWriter root = writer["Level"])
            {
                foreach (Planet planet in mPlanets)
                {
                    planet.Store(root);
                }
                foreach (Debris debris in mDebris)
                {
                    debris.Store(root);
                }
                foreach (Gate gate in mGates)
                {
                    gate.Store(root);
                }
            }
        }


        /// <summary>
        /// Allows the game to run logic such as updating the world,
        /// checking for collisions, gathering input, and playing audio.
        /// </summary>
        /// <param name="gameTime">Provides a snapshot of timing values.</param>
        protected override void Update(GameTime gameTime)
        {
            KeyboardState keyboard = Keyboard.GetState();

            if(keyboard.IsKeyDown(Keys.Escape))
            {
                mStarter = null;
            }

            if (RaceStarted() && !mPaused)
            {
                mPlayer.Update(gameTime, mPlanets, mDebris, mGates, keyboard);

                Debris[] newDebris = mPlayer.NewDebris();
                if (newDebris != null)
                {
                    mDebris.AddRange(newDebris);
                }

                foreach (Debris d in mDebris)
                {
                    d.Update(gameTime, mPlanets);
                }
            }

            if (mStarter != null && !mPaused)
            {
                float elapsed = (float)gameTime.ElapsedGameTime.TotalMilliseconds;
                if (mStarter.Value < kWarmupDelay && mStarter.Value + elapsed > kWarmupDelay)
                {
                    mStarterDong.Play();
                }
                else if (mStarter.Value < kWarmupDelay + kLightLength && mStarter.Value + elapsed > kWarmupDelay + kLightLength)
                {
                    mStarterDong.Play();
                }
                else if ((!RaceStarted()) && (mStarter.Value + elapsed) > kTotalStartDelay)
                {
                    mStarterDing.Play();
                    mPaused = false;
                }
                mStarter = mStarter.Value + elapsed;
            }

            if (mStarter == null)
            {
                CheckLoadLevel(keyboard);
            }
            if (mPlayer.State == PlayerState.Reset || (mStarter == null && keyboard.IsKeyDown(Keys.Space)))
            {
                mScroll = kInitialScroll;
                mPlayer.Reset(new Vector2(0, 0));
                ResetDebris();
                ResetGates();
                mStarter = 0;
                mPaused = false;
                mAllowEdits = false;
            }
            else if (mPlayer.State == PlayerState.Dead || mPlayer.State == PlayerState.Finished)
            {
                CheckLoadLevel(keyboard);

                if (mStarter != null)
                {
                    mRaceTime = mStarter.Value;
                    if (mPlayer.State == PlayerState.Finished)
                    {
                        mStats[mLevel].Add(new Stats(mRaceTime, mGates.Where(x => !x.HasPassed).Count()));
                    }
                }
                mStarter = null;
            }

            if (mAllowEdits)
            {
                const int kScrollStep = 5;
                if (keyboard.IsKeyDown(Keys.Left))
                {
                    mScroll.X += kScrollStep;
                }
                else if (keyboard.IsKeyDown(Keys.Right))
                {
                    mScroll.X -= kScrollStep;
                }
                if (keyboard.IsKeyDown(Keys.Up))
                {
                    mScroll.Y += kScrollStep;
                }
                else if (keyboard.IsKeyDown(Keys.Down))
                {
                    mScroll.Y -= kScrollStep;
                }

                Edit(Mouse.GetState(), Keyboard.GetState());
            }

            if (keyboard.IsKeyDown(Keys.P))
            {
                if (!mPausedDown)
                {
                    mPaused = !mPaused;
                }
                mPausedDown = true;
            }
            else
            {
                mPausedDown = false;
            }

            UpdateOffset(mPlayer);
            base.Update(gameTime);
        }

        private void CheckLoadLevel(KeyboardState keyboard)
        {
            if (keyboard.IsKeyDown(Keys.D1))
            {
                LoadLevel(1);
            }
            else if (keyboard.IsKeyDown(Keys.D2))
            {
                LoadLevel(2);
            }
            else if (keyboard.IsKeyDown(Keys.D3))
            {
                LoadLevel(3);
            }
            else if (keyboard.IsKeyDown(Keys.D4))
            {
                LoadLevel(4);
            }
            else if (keyboard.IsKeyDown(Keys.D5))
            {
                LoadLevel(5);
            }
            else if (keyboard.IsKeyDown(Keys.D6))
            {
                LoadLevel(6);
            }
            else if (keyboard.IsKeyDown(Keys.D7))
            {
                LoadLevel(7);
            }
            else if (keyboard.IsKeyDown(Keys.D8))
            {
                LoadLevel(8);
            }
            else if (keyboard.IsKeyDown(Keys.D9))
            {
                LoadLevel(9);
            }
#if DEBUG
            else if(keyboard.IsKeyDown(Keys.E))
            {
                mAllowEdits = true;
            }
#endif
        }

        private void ResetDebris()
        {
            mDebris.RemoveAll(x => x.IsPlayerDebris());
            mDebris.ForEach(x => x.Reset());
        }

        private void ResetGates()
        {
            mGates.ForEach(x => x.Reset());
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

        private Planet FindClickedPlanet(MouseState mouse)
        {
            foreach (Planet p in mPlanets)
            {
                if (p.Contains(ToSpace(mouse)))
                {
                    return p;
                }
            }
            return null;
        }

        private Debris FindClickedDebris(MouseState mouse)
        {
            foreach (Debris d in mDebris)
            {
                if (d.Contains(ToSpace(mouse)))
                {
                    return d;
                }
            }
            return null;
        }

        private Gate FindClickedGate(MouseState mouse)
        {
            foreach (Gate g in mGates)
            {
                if (g.Contains(ToSpace(mouse)))
                {
                    return g;
                }
            }
            return null;
        }

        private bool IsShift(KeyboardState keyboard)
        {
            return keyboard.IsKeyDown(Keys.LeftShift) || keyboard.IsKeyDown(Keys.RightShift);
        }

        private bool IsControl(KeyboardState keyboard)
        {
            return keyboard.IsKeyDown(Keys.LeftControl) || keyboard.IsKeyDown(Keys.RightControl);
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

        private void UpdateOffset(Player player)
        {
            if (mAllowEdits || player.State != PlayerState.Alive)
            {
                return;
            }
            float left = -mScroll.X;
            float width = Window.ClientBounds.Width;
            float top = -mScroll.Y;
            float height = Window.ClientBounds.Height;
            float bottom = top + height;
            const float kPad = 300;

            if (player.Location.X - kPad < left)
            {
                left = player.Location.X - kPad;
            }
            else if (player.Location.X + kPad > left + width)
            {
                left = player.Location.X - width + kPad;
            }
            if (player.Location.Y - kPad < top)
            {
                top = player.Location.Y - kPad;
            }
            else if (player.Location.Y + kPad > top + height)
            {
                top = player.Location.Y - height + kPad;
            }
            mScroll = new Vector2(-left, -top);
        }

        /// <summary>
        /// This is called when the game should draw itself.
        /// </summary>
        /// <param name="gameTime">Provides a snapshot of timing values.</param>
        protected override void Draw(GameTime gameTime)
        {
            GraphicsDevice.Clear(new Color(0, 0, 10));

            // TODO: Add your drawing code here

            base.Draw(gameTime);
            mStarfield.Draw(mSpriteBatch, mScroll, Window.ClientBounds.Width, Window.ClientBounds.Height);

            mSpriteBatch.Begin();
            foreach (Planet planet in mPlanets)
            {
                planet.Draw(mSpriteBatch, mScroll);
            }
            mSpriteBatch.End();

            foreach (Gate g in mGates)
            {
                g.Draw(mSpriteBatch, mScroll, g == mGates.Last());
            }

            foreach (Debris d in mDebris)
            {
                d.Draw(mSpriteBatch, mScroll);
            }

            mPlayer.Draw(mSpriteBatch, mScroll);

            DrawHud(gameTime);
        }

        private void DrawStat(SpriteFont font, string line, ref Vector2 statsLocation)
        {
            const float kPad = 10;
            mSpriteBatch.DrawString(font, line, statsLocation, Color.SteelBlue);
            statsLocation += new Vector2(0, mHudFont.MeasureString(line).Y + kPad);
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
    var showTime = Math.abs(totalMilliseconds);
    var minutes = Math.floor(showTime / 60000.0);
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
    this.resetting = false;
    this.lastTime = getTimestamp();
    
    this.starter = null;
    this.allowEdits = false;
    
    this.highscores = {};
    this.raceTime = null;
    
    this.canvas = document.getElementById("canvas");
    this.context = canvas.getContext("2d");
    this.context.font = "15px monospace"
    this.keyboardState = new KeyboardState(window);
   
    var self = this;

    this.loadLevel = function(resource) {
        var request = new XMLHttpRequest();
        request.open("GET", resource, true);
        request.responseType = "json";
        request.onload = function() {
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
                var velocity = d.velocity ? parseVector(d.velocity) : null;
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
        };
        request.send();
    }
    
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
            self.player.reset(new Vector(0,0));
            self.lastTime = getTimestamp();
            self.starter = 0;
            self.raceTime = null;
            self.paused = true;
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
        if (!self.paused) {
            for (i = 0; i < self.debris.length; ++i) {
                self.debris[i].update(delta, self.planets);
            }
        }
        var player = self.player;

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
                self.paused = false;
            }
            self.starter += delta;
        }
        
        player.update(self.paused ? 0 : delta, self.planets, self.debris, self.gates, self.keyboardState);
        
        if (player.state == PlayerState.Reset || player.state == PlayerState.Dead || player.state == PlayerState.Finished) {
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
                
                if(!self.resetting && player.state == PlayerState.Reset) {
                    self.resetting = true;
                    self.resetLevel();
                }
            }
        }
        
        self.lastTime = now;
    }
    
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
        }
    }
    
    this.draw = function() {
        requestAnimationFrame(self.draw);
        var offset = addVectors(new Vector(self.canvas.width / 2, self.canvas.height /2), scaleVector(self.player.location,-1));
        self.starfield.draw(self.context, offset, self.canvas.width, self.canvas.height);
        for (var i = 0; i < self.planets.length; ++i) {
            self.planets[i].draw(self.context, offset);
        }
        for (i = 0; i < self.debris.length; ++i) {
            self.debris[i].draw(self.context, offset);
        }
        for (i = 0; i < self.gates.length; ++i) {
            self.gates[i].draw(self.context, offset, i == self.gates.length - 1);
        }
        self.player.draw(self.context, offset);
        
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
