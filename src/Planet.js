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
    enum PlanetType
    {
        Ringed,
        Planetoid,
        BrownRocky,
        GreenGasGiant,
        RockyForest,
        PurpleGiant
    }

    class Planet
    {
        private static Texture2D[] sPlanetImages;

        public static void LoadImages(ContentManager content)
        {
            List<Texture2D> images = new List<Texture2D>();
            images.Add(content.Load<Texture2D>("Planets/RingedPlanet"));
            images.Add(content.Load<Texture2D>("Planets/SmallPlanetoid"));
            images.Add(content.Load<Texture2D>("Planets/BrownRocky"));
            images.Add(content.Load<Texture2D>("Planets/GreenGasGiant"));
            images.Add(content.Load<Texture2D>("Planets/RockyForest"));
            images.Add(content.Load<Texture2D>("Planets/PurpleGiant"));
            sPlanetImages = images.ToArray();
        }

        private PlanetType mType;
        private Texture2D mImage;
        private Vector2 mLocation;
        private float mGravity;

        public Planet(PlanetType type, Vector2 location, float gravity)
        {
            Type = type;
            mLocation = location;
            mGravity = gravity;
        }

        public void Store(IWriter doc)
        {
            using (IDataWriter element = doc["Planet"])
            {
                element.Attribute("type", mType.ToString());
                element.Attribute("gravity", DocumentWriter.AsString(mGravity));
                DocumentWriter.WriteVector(element, mLocation);
            }
        }

        public float Size
        {
            get
            {
                if (mType == PlanetType.Ringed)
                {
                    return 30;
                }
                else
                {
                    return mImage.Width / 2;
                }
            }
        }

        public Vector2 Location
        {
            get { return mLocation; }
            set { mLocation = value; }
        }

        public bool Contains(Vector2 point)
        {
            return Vector2.Distance(Location, point) < Size;
        }

        public float Gravity
        {
            get { return mGravity; }
            set { mGravity = value; }
        }

        public PlanetType Type
        {
            get { return mType; }
            set
            {
                mType = value;
                mImage = sPlanetImages[(int)value];
            }
        }

        public void Draw(SpriteBatch batch, Vector2 offset)
        {
            batch.Draw(mImage, mLocation + offset - new Vector2(mImage.Width / 2, mImage.Height / 2), Color.White);
        }

        internal bool DetermineForce(Vector2 location, float maxDistSq, ref Vector2 gravity)
        {
            Vector2 fromPlanet = mLocation - location;
            float distanceSq;
            Vector2.DistanceSquared(ref mLocation, ref location, out distanceSq);
            if (distanceSq > maxDistSq)
            {
                return false;
            }
            double distance = Math.Sqrt(distanceSq);
            gravity = Vector2.Normalize(fromPlanet) * mGravity / (float)Math.Pow(distance, 2);
            return true;
        }
    }
}
