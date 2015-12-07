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
    class Gate
    {
        private static Texture2D sGateImage = null;
        private static Texture2D sGatePassed = null;
        private static Texture2D sGateFinish = null;
        private static Texture2D sArrow = null;
        private static SoundEffect sBing = null;

        public static void LoadContent(ContentManager content)
        {
            sGateImage = content.Load<Texture2D>("Gates/Gate");
            sGatePassed = content.Load<Texture2D>("Gates/GatePassed");
            sGateFinish = content.Load<Texture2D>("Gates/Finish");
            sArrow = content.Load<Texture2D>("Gates/Arrow");
            sBing = content.Load<SoundEffect>("Sounds/Pass");
        }

        private Vector2 mLocation;
        private float mAngle = 0;
        private bool mPassed = false;

        public Gate(Vector2 location, float angle)
        {
            mLocation = location;
            SetAngle(angle);
        }

        public void Store(IWriter doc)
        {
            using (IDataWriter element = doc["Gate"])
            {
                DocumentWriter.WriteVector(element, mLocation);
                element.Attribute("angle", mAngle.ToString());
            }
        }

        public Vector2 Location
        {
            get { return mLocation; }
            set { mLocation = value; }
        }

        public bool HasPassed
        {
            get { return mPassed; }
        }

        public void SetAngle(float angle)
        {
            mAngle = angle;
            ClampAngle();
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

        public Vector2 LeftEnd
        {
            get
            {
                return mLocation + GetDirection(mAngle - MathHelper.PiOver2) * sGateImage.Height / 2;
            }
        }

        public Vector2 RightEnd
        {
            get
            {
                return mLocation + GetDirection(mAngle + MathHelper.PiOver2) * sGateImage.Height / 2;
            }
        }

        internal bool Contains(Vector2 point)
        {
            const float kCheckSize = 10;
            return Vector2.Distance(LeftEnd, point) < kCheckSize ||
                   Vector2.Distance(Location, point) < kCheckSize ||
                   Vector2.Distance(RightEnd, point) < kCheckSize;
        }

        internal void UpdatePassed(Vector2 start, Vector2 end)
        {
            if (!mPassed && CheckCrosses(start, end))
            {
                mPassed = true;
                sBing.Play();
            }
        }

        // Lifted straight from http://stackoverflow.com/questions/563198/how-do-you-detect-where-two-line-segments-intersect/1968345#1968345
        internal bool CheckCrosses(Vector2 start, Vector2 end)
        {
            Vector2 left = LeftEnd;
            Vector2 s1 = end - start;
            Vector2 s2 = RightEnd - left;

            float h = (-s1.Y * (start.X - left.X) + s1.X * (start.Y - left.Y)) / (-s2.X * s1.Y + s1.X * s2.Y);
            float g = (s2.X * (start.Y - left.Y) - s2.Y * (start.X - left.X)) / (-s2.X * s1.Y + s1.X * s2.Y);

            return (0 <= h && h <= 1.0) && (0 <= g && g <= 1.0);
        }

        public void Draw(SpriteBatch batch, Vector2 offset, bool isFinish)
        {
            float xLoc = mLocation.X + offset.X;
            float yLoc = mLocation.Y + offset.Y;

            Matrix rot, center, uncenter;
            Matrix.CreateRotationZ(mAngle, out rot);
            Matrix.CreateTranslation(xLoc, yLoc, 0, out center);
            Matrix.CreateTranslation(-xLoc, -yLoc, 0, out uncenter);
            rot = uncenter * rot * center;
            batch.Begin(SpriteBlendMode.AlphaBlend, SpriteSortMode.Deferred, SaveStateMode.None, rot);
            Texture2D image = mPassed ? sGatePassed : isFinish ? sGateFinish : sGateImage;
            batch.Draw(image, mLocation + offset - new Vector2(sGateImage.Width / 2.0f, sGateImage.Height / 2.0f), Color.White);
            batch.End();
        }

        internal void Reset()
        {
            mPassed = false;
        }
    }
}
