/*
namespace RGG2010
{
    /// <summary>
    /// This is the main type for your game
    /// </summary>
    public class Scrace : Microsoft.Xna.Framework.Game
    {
        private static readonly Vector2 kInitialScroll = new Vector2(400, 100);

        private GraphicsDeviceManager mGraphics;
        private SpriteBatch mSpriteBatch;

        private Starfield mStarfield = new Starfield();
        private Vector2 mScroll = kInitialScroll; 
        private Player mPlayer = new Player();
        private List<Planet> mPlanets = new List<Planet>();
        private List<Debris> mDebris = new List<Debris>();
        private List<Gate> mGates = new List<Gate>();

        private Texture2D mStarterAmberOff = null;
        private Texture2D mStarterAmberOn = null;
        private Texture2D mStarterGreenOff = null;
        private Texture2D mStarterGreenOn = null;
        private SoundEffect mStarterDong = null;
        private SoundEffect mStarterDing = null;

        private Texture2D mIntroOverlay = null;

        private SpriteFont mHudFont = null;
        private SpriteFont mStatsHeaderFont = null;

        private bool mAllowEdits = false;
        private Planet mEditPlanet = null;
        private Debris mEditDebris = null;
        private float mLastGateAngle = 0;
        private Gate mEditGate = null;

        private bool mPausedDown = false;
        private bool mPaused = false;

        private int mLevel = 0;

        private const float kWarmupDelay = 1000;
        private const float kLightLength = 1000;
        private const float kTotalStartDelay = kWarmupDelay + 2 * kLightLength;

        private const int kLevels = 5;

        private float? mStarter = null;
        private float mRaceTime = 0;

        class Stats
        {
            public readonly float Time;
            public readonly int GatesMissed;

            public Stats(float time, int missed)
            {
                Time = time;
                GatesMissed = missed;
            }

            const float kGatePenalty = 1000;

            public float Rating
            {
                get { return Time + GatesMissed * kGatePenalty; }
            }

            internal string Formatted()
            {
                TimeSpan raceTime = TimeSpan.FromMilliseconds(Time);
                TimeSpan rating = TimeSpan.FromMilliseconds(Rating);

                return string.Format("{0:00}:{1:00}:{2:000} + {3} Gates Missed: {4:00}:{5:00}:{6:000}",
                    raceTime.Minutes, raceTime.Seconds, raceTime.Milliseconds,
                    GatesMissed,
                    rating.Minutes, rating.Seconds, rating.Milliseconds
                );
            }
        }

        Dictionary<int,List<Stats>> mStats = new Dictionary<int,List<Stats>>();

        private static string ContentBuildPath
        {
            get
            {
                string assemblyPath = System.IO.Path.GetDirectoryName(typeof(Scrace).Assembly.Location);
                System.IO.DirectoryInfo path = new System.IO.DirectoryInfo(assemblyPath);
                return System.IO.Path.Combine(path.Parent.Parent.Parent.FullName, "Content");
            }
        }

        private System.IO.Stream Load(string resource)
        {
            return GetType().Assembly.GetManifestResourceStream(resource);
        }

        public Scrace()
        {
            mGraphics = new GraphicsDeviceManager(this);
            Content.RootDirectory = "Content";
        }

        /// <summary>
        /// Allows the game to perform any initialization it needs to before starting to run.
        /// This is where it can query for any required services and load any non-graphic
        /// related content.  Calling base.Initialize will enumerate through any components
        /// and initialize them as well.
        /// </summary>
        protected override void Initialize()
        {
            base.Initialize();
            IsMouseVisible = true;
            mPlayer.Reset(new Vector2(0, 0));
            for (int i = 1; i <= kLevels; ++i)
            {
                mStats[i] = new List<Stats>();
            }
        }

        /// <summary>
        /// LoadContent will be called once per game and is the place to load
        /// all of your content.
        /// </summary>
        protected override void LoadContent()
        {
            // Create a new SpriteBatch, which can be used to draw textures.
            mSpriteBatch = new SpriteBatch(GraphicsDevice);

            mHudFont = Content.Load<SpriteFont>("Fonts/HudFont");
            mStatsHeaderFont = Content.Load<SpriteFont>("Fonts/StatsHeaderFont");
            mIntroOverlay = Content.Load<Texture2D>("Fonts/IntroOverlay");

            mStarterAmberOff = Content.Load<Texture2D>("Gates/AmberLightOff");
            mStarterAmberOn = Content.Load<Texture2D>("Gates/AmberLightOn");
            mStarterGreenOff = Content.Load<Texture2D>("Gates/GreenLightOff");
            mStarterGreenOn = Content.Load<Texture2D>("Gates/GreenLightOn");
            mStarterDong = Content.Load<SoundEffect>("Sounds/Dong");
            mStarterDing = Content.Load<SoundEffect>("Sounds/Ding");

            mPlayer.LoadContent(Content);
            Planet.LoadImages(Content);
            Debris.LoadImages(Content);
            Gate.LoadContent(Content);
            mStarfield.LoadImages(Content);
            mStarfield.Populate(5000, 5000, 0.0005f);

            LoadLevel(1);

            MediaPlayer.IsRepeating = true;
            MediaPlayer.Volume *= 0.6f;
            //MediaPlayer.Play(Content.Load<Song>("Sounds/Music"));
        }

        private void LoadLevel(int number)
        {
            if (number <= 0 || mLevel == number || kLevels < number)
            {
                return;
            }
            mScroll = kInitialScroll;
            mLevel = number;

            mPlanets.Clear();
            mDebris.Clear();
            mGates.Clear();

            using (System.IO.Stream stream = Load("RGG2010.Content.Levels.Level" + number.ToString() + ".xml"))
            using (System.IO.TextReader reader = new System.IO.StreamReader(stream))
            {
                XDocument doc = System.Xml.Linq.XDocument.Load(reader);
                XElement root = doc.Elements("Level").First();
                foreach (XElement e in root.Elements("Planet"))
                {
                    mPlanets.Add(new Planet(e.Read<PlanetType>("type"), e.ReadVector2(), e.ReadFloat("gravity")));
                }
                foreach (XElement e in root.Elements("Debris"))
                {
                    mDebris.Add(new Debris(e.Read<DebrisType>("type"), e.ReadVector2()));
                }
                foreach (XElement e in root.Elements("Gate"))
                {
                    mGates.Add(new Gate(e.ReadVector2(), e.ReadFloat("angle")));
                }
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
        /// UnloadContent will be called once per game and is the place to unload
        /// all content.
        /// </summary>
        protected override void UnloadContent()
        {
            // TODO: Unload any non ContentManager content here
        }

        /// <summary>
        /// Allows the game to run logic such as updating the world,
        /// checking for collisions, gathering input, and playing audio.
        /// </summary>
        /// <param name="gameTime">Provides a snapshot of timing values.</param>
        protected override void Update(GameTime gameTime)
        {
            // Allows the game to exit
            if (GamePad.GetState(PlayerIndex.One).Buttons.Back == ButtonState.Pressed)
                this.Exit();

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

        private bool RaceStarted()
        {
            return mStarter != null && mStarter.Value >= kTotalStartDelay;
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

        private void DrawHud(GameTime gameTime)
        {
            Rectangle titleSafeArea = GraphicsDevice.Viewport.TitleSafeArea;
            Vector2 hudLocation = new Vector2(titleSafeArea.X, titleSafeArea.Y);

            mSpriteBatch.Begin();

            Vector2 center = hudLocation + new Vector2(titleSafeArea.Width / 2.0f, titleSafeArea.Height / 2.0f);

            if (mStarter != null)
            {
                bool lightOneOn = mStarter.Value > kWarmupDelay;
                bool lightTwoOn = mStarter.Value > kWarmupDelay + kLightLength;
                bool lightThreeOn = mStarter.Value > kTotalStartDelay;
                if (mStarter.Value < kTotalStartDelay + kLightLength)
                {
                    mSpriteBatch.Draw(lightOneOn ? mStarterAmberOn : mStarterAmberOff, center - new Vector2(160, 250), Color.White);
                    mSpriteBatch.Draw(lightTwoOn ? mStarterAmberOn : mStarterAmberOff, center - new Vector2(50, 250), Color.White);
                    mSpriteBatch.Draw(lightThreeOn ? mStarterGreenOn : mStarterGreenOff, center - new Vector2(-60, 250), Color.White);
                }

                float time = mStarter.Value - kTotalStartDelay;
                TimeSpan raceTime = TimeSpan.FromMilliseconds(Math.Abs(time));

                mSpriteBatch.DrawString(mHudFont, string.Format("Race Time: {3}{0:00}:{1:00}:{2:000}", raceTime.Minutes, raceTime.Seconds, raceTime.Milliseconds, (time < 0 ? "-" : " ")), hudLocation, Color.LimeGreen);
            }
            else if(!mAllowEdits)
            {
                mSpriteBatch.Draw(mIntroOverlay, center + new Vector2(-mIntroOverlay.Width / 2.0f, 20), Color.White);
                if (mRaceTime > 0 && gameTime.TotalGameTime.Seconds % 2 == 0)
                {
                    Color color = mPlayer.State == PlayerState.Finished ? Color.LimeGreen : Color.Red;
                    TimeSpan raceTime = TimeSpan.FromMilliseconds(mRaceTime);
                    mSpriteBatch.DrawString(mHudFont, string.Format("Race Time: {0:00}:{1:00}:{2:000} + {3} Gates Missed", raceTime.Minutes, raceTime.Seconds, raceTime.Milliseconds, mGates.Where(x => !x.HasPassed).Count()), hudLocation, color);
                }

                if (mStats[mLevel].Count > 0)
                {
                    Vector2 statsLocation = center - new Vector2(160, 200);

                    string line = "          Best Times";
                    DrawStat(mStatsHeaderFont, line, ref statsLocation);

                    foreach (string timeLine in mStats[mLevel].OrderBy(x => x.Rating).Take(5).Select(x => x.Formatted()))
                    {
                        DrawStat(mHudFont, timeLine, ref statsLocation);
                    }
                }
            }
            mSpriteBatch.End();
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

var KeyboardState = function(element) {
    this.pressed = {};
    var self = this;
    
    element.onkeydown = function(e){
        e = e || window.event;
        self.pressed[e.keyCode] = true;
    }

    element.onkeyup = function(e){
        e = e || window.event;
        delete self.pressed[e.keyCode];
    }
    
    this.isKeyDown = function(keyCode) {
        return self.pressed[keyCode] ? true : false;
    }
}

window.onload = function(e) {
    console.log("window.onload", e, Date.now())
    var canvas = document.getElementById("canvas");
    var starfield = new Starfield(5000, 5000, 0.002, 0.95, true);
    var player = new Player();
    var context = canvas.getContext("2d");
    var keyboardState = new KeyboardState(window);
    var timeStep = 16;
    var planets = [
        new Planet(PlanetType.Ringed, new Vector(1000,1250), 1),
        new Planet(PlanetType.GreenGasGiant, new Vector(-200,700), 3),
        new Planet(PlanetType.Planetoid, new Vector(11,624), .2),
        new Planet(PlanetType.PurpleGiant, new Vector(436,-567), 2.5),
    ];
    var debris = [];
    var gates = [];
    window.setInterval(function() {
        player.update(timeStep, planets, debris, gates, keyboardState);
    }, timeStep);
    
    function draw() {
        var offset = addVectors(new Vector(canvas.width / 2, canvas.height /2), scaleVector(player.location,-1));
        requestAnimationFrame(draw);
        starfield.draw(context, offset, canvas.width, canvas.height);
        for(var i = 0; i < planets.length; ++i) {
            planets[i].draw(context, offset);
        }
        player.draw(context, offset);
    }
    draw();
};
