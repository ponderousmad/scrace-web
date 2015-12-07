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
using RGG2010.Utils;

namespace RGG2010
{
    public enum DebrisType
    {
        SmallAsteroid,
        LargeAsteroid,
        PlayerCockpit,
        PlayerLeft,
        PlayerRight
    }

    class Debris
    {
        private static Texture2D[] sImages;

        public static void LoadImages(ContentManager content)
        {
            List<Texture2D> images = new List<Texture2D>();
            images.Add(content.Load<Texture2D>("Debris/SmallAsteroid"));
            images.Add(content.Load<Texture2D>("Debris/LargeAsteroid"));
            images.Add(content.Load<Texture2D>("Debris/PlayerCockpit"));
            images.Add(content.Load<Texture2D>("Debris/PlayerLeft"));
            images.Add(content.Load<Texture2D>("Debris/PlayerRight"));
            sImages = images.ToArray();
        }

        private float mAngle = 0;
        private float mSpin = 0;
        private Vector2 mLocation;
        private Vector2 mStartLocation;
        private Vector2 mVelocity = new Vector2(0, 0);
        private Vector2? mStartVelocity = null;
        private DebrisType mType;
        private Texture2D mImage;
        private bool mDestroyed = false;

        private static Random sRand = new Random();
        private const float kMaxSpin = 0.01f;
        private const float kMaxPlanetDistance = 200;
        private const float kMaxPlanetDistanceSq = kMaxPlanetDistance * kMaxPlanetDistance;

        public Debris(DebrisType type, Vector2 location)
        {
            Type = type;
            mStartLocation = location;
            mLocation = location;

            mAngle = (float)sRand.NextDouble() * 2 * MathHelper.Pi;
            mSpin = (float)sRand.NextDouble() * kMaxSpin;
        }

        public void SetStartVelocity(Vector2 velocity)
        {
            mStartVelocity = velocity;
            mVelocity = velocity;
        }

        public void Reset()
        {
            mLocation = mStartLocation;
            mVelocity = mStartVelocity ?? new Vector2(0, 0);
            mDestroyed = false;
        }

        public void Store(IWriter doc)
        {
            if (IsPlayerDebris())
            {
                // Don't store exploding player.
                return;
            }
            using (IDataWriter element = doc["Debris"])
            {
                element.Attribute("type", mType.ToString());
                DocumentWriter.WriteVector(element, mStartLocation);
                if (mStartVelocity != null)
                {
                    using (IDataWriter velocity = element["Velocity"])
                    {
                        DocumentWriter.WriteVector(velocity, mStartVelocity.Value);
                    }
                }
            }
        }

        public bool IsPlayerDebris()
        {
            return mType == DebrisType.PlayerCockpit || mType == DebrisType.PlayerLeft || mType == DebrisType.PlayerRight;
        }

        public float Size
        {
            get
            {
                return mImage.Width / 2;
            }
        }

        public Vector2 Location
        {
            get { return mLocation; }
            set { mLocation = value; mStartLocation = value; }
        }

        public bool Contains(Vector2 point)
        {
            return Vector2.Distance(Location, point) < Size * 1.25;
        }

        public DebrisType Type
        {
            get { return mType; }
            set
            {
                mType = value;
                mImage = sImages[(int)value];
            }
        }

        public void Draw(SpriteBatch batch, Vector2 offset)
        {
            if (mDestroyed)
            {
                return;
            }
            float xLoc = mLocation.X + offset.X;
            float yLoc = mLocation.Y + offset.Y;

            Matrix rot, center, uncenter;
            Matrix.CreateRotationZ(mAngle, out rot);
            Matrix.CreateTranslation(xLoc, yLoc, 0, out center);
            Matrix.CreateTranslation(-xLoc, -yLoc, 0, out uncenter);
            rot = uncenter * rot * center;
            batch.Begin(SpriteBlendMode.AlphaBlend, SpriteSortMode.Deferred, SaveStateMode.None, rot);
            batch.Draw(mImage, mLocation + offset - new Vector2(Size, Size), Color.White);
            batch.End();
        }

        public void Update(GameTime time, IEnumerable<Planet> planets)
        {
            if (mDestroyed)
            {
                return;
            }
            mLocation += mVelocity;
            mAngle += mSpin;
            ClampAngle();

            Vector2 gravity = new Vector2(0, 0);
            foreach (Planet p in planets)
            {
                if (p.DetermineForce(mLocation, kMaxPlanetDistanceSq, ref gravity))
                {
                    mVelocity += gravity * (float)time.ElapsedGameTime.TotalMilliseconds;
                }
                if (Vector2.DistanceSquared(p.Location, Location) < (p.Size * p.Size))
                {
                    mDestroyed = true;
                }
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

        internal void SetSpin(float spin)
        {
            mSpin = spin;
        }
    }
}
