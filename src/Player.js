/* ---------------------------------------------------------------
 * Copyright © Adrian Smith.
 * Licensed under the MIT license. See license.txt at project root.
 * --------------------------------------------------------------- */
using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using Microsoft.Xna.Framework;
using Microsoft.Xna.Framework.Audio;
using Microsoft.Xna.Framework.Content;
using Microsoft.Xna.Framework.GamerServices;
using Microsoft.Xna.Framework.Graphics;
using Microsoft.Xna.Framework.Input;
using Microsoft.Xna.Framework.Media;
using Microsoft.Xna.Framework.Net;
using Microsoft.Xna.Framework.Storage;

namespace RGG2010
{
    [Flags]
    enum Thrusters
    {
        None = 0,
        RotateLeft = 1,
        RotateRight = 2,
        Accelerate = 4,
        Break = 8
    }

    enum PlayerState
    {
        Alive,
        Dying,
        Dead,
        Reset,
        Finished
    }

    class Player
    {
        private Texture2D mSprite = null;
        private Texture2D mThrust = null;
        private Texture2D mLeftThruster = null;
        private Texture2D mRightThruster = null;
        private Texture2D mLeftRearThruster = null;
        private Texture2D mRightRearThruster = null;
        private Texture2D[] mExplosion = null;
        private SoundEffect mExplodeSound = null;

        private Vector2 mLocation = new Vector2(0, 0);
        private Vector2 mVelocity = new Vector2(0, 0);
        private float mAngle = 0;
        private bool mThrusting = false;
        private bool mLeftRetro = false;
        private bool mRightRetro = false;
        private bool mLeftRearRetro = false;
        private bool mRightRearRetro = false;
        private PlayerState mState = PlayerState.Alive;
        private float mSinceDied = 0;
        private Debris[] mBits = null;

        private const float kManouverPower = 0.005f;
        private const float kMaxAcceleration = 0.0006f;
        private const float kMaxBreak = 0.0005f;
        private const float kMaxSpeed = 0.5f;
        private const float kTimePerFrame = 80;
        private const float kPlayerSize = 4;

        private const float kMaxPlanetDistance = 500;
        private const float kMaxPlanetDistanceSq = kMaxPlanetDistance * kMaxPlanetDistance;

        public Vector2 Location
        {
            get { return mLocation; }
        }

        public PlayerState State
        {
            get
            {
                return mState;
            }
        }

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

        public void Reset(Vector2 location)
        {
            mLocation = location;
            mVelocity = new Vector2(0, 0);
            mAngle = -MathHelper.PiOver2;
            mThrusting = false;
            mRightRetro = false;
            mRightRearRetro = false;
            mLeftRetro = false;
            mLeftRearRetro = false;
            mState = PlayerState.Alive;
        }

        public void Update(GameTime time, IEnumerable<Planet> planets, IEnumerable<Debris> debris, IEnumerable<Gate> gates, KeyboardState keyboard)
        {
            Vector2 before = mLocation;
            float elapsed = (float)time.ElapsedGameTime.TotalMilliseconds;
            if (mState == PlayerState.Dead || mState == PlayerState.Finished)
            {
                if (keyboard.IsKeyDown(Keys.Space))
                {
                    mState = PlayerState.Reset;
                }
                return;
            }
            else if (mState == PlayerState.Dying)
            {
                mLocation += mVelocity * elapsed;
                mVelocity *= 0.3f;
                mSinceDied += elapsed;
                if (mSinceDied > mExplosion.Length * kTimePerFrame)
                {
                    mState = PlayerState.Dead;
                }
                return;
            }
            Vector2 direction = GetDirection(mAngle);

            mLocation += mVelocity * elapsed;

            mThrusting = false;
            mLeftRetro = false;
            mRightRetro = false;
            mLeftRearRetro = false;
            mRightRearRetro = false;
            Thrusters thrust = DetermineThrust(keyboard);
            if ((thrust & Thrusters.RotateLeft) == Thrusters.RotateLeft)
            {
                mAngle -= kManouverPower * elapsed;
                mRightRetro = true;
                mLeftRearRetro = true;
            }
            else if ((thrust & Thrusters.RotateRight) == Thrusters.RotateRight)
            {
                mAngle += kManouverPower * elapsed;
                mLeftRetro = true;
                mRightRearRetro = true;
            }
            ClampAngle();

            Vector2 gravity = new Vector2(0, 0);
            foreach (Planet planet in planets)
            {
                if (planet.DetermineForce(mLocation, kMaxPlanetDistanceSq, ref gravity))
                {
                    mVelocity += gravity * elapsed;
                }
                if (Vector2.DistanceSquared(planet.Location, mLocation) < (planet.Size * planet.Size))
                {
                    Crash();
                }
            }

            foreach (Debris d in debris)
            {
                float size = d.Size + kPlayerSize;
                if (Vector2.DistanceSquared(mLocation, d.Location) < (size * size))
                {
                    Crash();
                }
            }

            Gate last = null;
            foreach (Gate g in gates)
            {
                g.UpdatePassed(before, mLocation);
                g.UpdatePassed(mLocation, mLocation + (GetDirection(mAngle) * mSprite.Width / 2.0f));
                last = g;
            }

            if(last != null && last.HasPassed)
            {
                mState = PlayerState.Finished;
                return;
            }

            if ((thrust & Thrusters.Accelerate) == Thrusters.Accelerate)
            {
                mVelocity += direction * kMaxAcceleration * elapsed;
                mThrusting = true;
            }
            else if ((thrust & Thrusters.Break) == Thrusters.Break)
            {
                float mag = SpeedSquared();
                if (mag > 0)
                {
                    mRightRetro = true;
                    mLeftRetro = true;
                    mRightRearRetro = true;
                    mLeftRearRetro = true;

                    if (mag < (kMaxBreak * kMaxBreak * elapsed * elapsed))
                    {
                        mVelocity = new Vector2(0, 0);
                    }
                    else
                    {
                        mVelocity -= Vector2.Normalize(mVelocity) * kMaxBreak * elapsed;
                    }
                }
            }
            if (SpeedSquared() > kMaxSpeed * kMaxSpeed)
            {
                mVelocity = Vector2.Normalize(mVelocity) * kMaxSpeed;
            }
        }

        private void ClampAngle()
        {
            while (mAngle < -MathHelper.Pi)
            {
                mAngle += 2 * MathHelper.Pi;
            }

            while (mAngle > MathHelper.Pi)
            {
                mAngle -= 2 * MathHelper.Pi;
            }
        }

        private static Vector2 GetDirection(float angle)
        {
            return new Vector2((float)Math.Cos(angle), (float)Math.Sin(angle));
        }

        private void Crash()
        {
            if (mState != PlayerState.Dying)
            {
                mState = PlayerState.Dying;
                mExplodeSound.Play();
                mSinceDied = 0;

                List<Debris> debris = new List<Debris>();
                Debris chunk = new Debris(DebrisType.PlayerCockpit, mLocation);
                chunk.SetStartVelocity(mVelocity + GetDirection(mAngle));
                chunk.SetSpin(MathHelper.Pi * 0.01f);
                debris.Add(chunk);
                chunk = new Debris(DebrisType.PlayerLeft, mLocation);
                chunk.SetStartVelocity(mVelocity + GetDirection(mAngle + MathHelper.PiOver2));
                chunk.SetSpin(-MathHelper.Pi * 0.02f);
                debris.Add(chunk);
                chunk = new Debris(DebrisType.PlayerRight, mLocation);
                chunk.SetStartVelocity(mVelocity + GetDirection(mAngle - MathHelper.PiOver2));
                chunk.SetSpin(MathHelper.Pi * 0.03f);
                debris.Add(chunk);
                mBits = debris.ToArray();
            }
        }

        internal Debris[] NewDebris()
        {
            try
            {
                return mBits;
            }
            finally
            {
                mBits = null;
            }
        }

        private float SpeedSquared()
        {
            return mVelocity.X * mVelocity.X + mVelocity.Y * mVelocity.Y;
        }

        public void Draw(SpriteBatch batch, Vector2 offset)
        {
            if (State == PlayerState.Dying)
            {
                int frame = (int)Math.Floor(mSinceDied / kTimePerFrame);
                if (frame >= mExplosion.Length)
                {
                    frame = mExplosion.Length - 1;
                }
                batch.Begin();
                batch.Draw(mExplosion[frame], mLocation + offset - new Vector2(mExplosion[frame].Width / 2, mExplosion[frame].Height / 2), Color.White);
                batch.End();
                return;
            }
            else if (State != PlayerState.Alive && State != PlayerState.Finished)
            {
                return;
            }
            float xSpriteOffset = mSprite.Width / 4.0f;
            float ySpriteOffset = mSprite.Height / 2.0f;
            float xLoc = mLocation.X + offset.X;
            float yLoc = mLocation.Y + offset.Y;

            Matrix spriteTranslate, rot, center, uncenter;
            Matrix.CreateTranslation(-xSpriteOffset, -ySpriteOffset, 0, out spriteTranslate);
            Matrix.CreateRotationZ(mAngle, out rot);
            Matrix.CreateTranslation(xLoc, yLoc, 0, out center);
            Matrix.CreateTranslation(-xLoc, -yLoc, 0, out uncenter);
            rot = spriteTranslate * uncenter * rot * center;
            batch.Begin(SpriteBlendMode.AlphaBlend, SpriteSortMode.Deferred, SaveStateMode.None, rot);

            Vector2 location = mLocation + offset;
            if (mThrusting)
            {
                batch.Draw(mThrust, location, Color.White);
            }
            if (mLeftRetro)
            {
                batch.Draw(mLeftThruster, location, Color.White);
            }
            if (mRightRetro)
            {
                batch.Draw(mRightThruster, location, Color.White);
            }
            if (mLeftRearRetro)
            {
                batch.Draw(mLeftRearThruster, location, Color.White);
            }
            if (mRightRearRetro)
            {
                batch.Draw(mRightRearThruster, location, Color.White);
            }
            batch.Draw(mSprite, location, Color.White);
            batch.End();
        }

        internal Thrusters DetermineThrust(KeyboardState keyboardState)
        {
            Thrusters thrust = 0;
            if (keyboardState.IsKeyDown(Keys.Up))
            {
                thrust |= Thrusters.Accelerate;
            }
            if (keyboardState.IsKeyDown(Keys.Down))
            {
                thrust |= Thrusters.Break;
            }
            if (keyboardState.IsKeyDown(Keys.Left))
            {
                thrust |= Thrusters.RotateLeft;
            }
            if (keyboardState.IsKeyDown(Keys.Right))
            {
                thrust |= Thrusters.RotateRight;
            }
            return thrust;
        }
    }
}
