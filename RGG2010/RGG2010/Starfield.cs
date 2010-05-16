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
    class Starfield
    {
        private class Visual
        {
            public Vector2 Location;
            public float Distance;
            public Texture2D Image;

            public Visual(Texture2D image, Vector2 location, float distance)
            {
                Image = image;
                Location = location;
                Distance = distance;
            }

            internal Vector2 ScaleOffset(Vector2 offset)
            {
                return offset * (1 - Distance);
            }

            private Vector2 GetSize()
            {
                return new Vector2(Image.Width, Image.Height);
            }

            internal Vector2 TiledLocation(Vector2 offset, Vector2 tileSize)
            {
                Vector2 location = Location + offset * (1 - Distance) + GetSize();
                Vector2 distanceSize = tileSize / (1 - Distance);
                float tiledX = location.X % distanceSize.X;
                if(tiledX < 0)
                {
                    tiledX += distanceSize.X;
                }
                float tiledY = location.Y % distanceSize.Y;
                if(tiledY < 0)
                {
                    tiledY += distanceSize.Y;
                }
                return new Vector2(tiledX, tiledY) - GetSize();
            }
        }

        private List<Visual> mVisuals = new List<Visual>();
        private List<Texture2D> mImages = new List<Texture2D>();
        private Vector2 mMaxImageSize = new Vector2(0, 0);
        private Vector2 mSize;

        public Starfield()
        {
        }

        public void Populate(int width, int height, float density)
        {
            mSize = new Vector2(width, height);
            Random rand = new Random();
            int size = width * height;
            int count = (int)(size * density);
            for (int i = 0; i < count; ++i)
            {
                int x = rand.Next(width);
                int y = rand.Next(height);
                float distance = (float)rand.NextDouble();
                int index = rand.Next(mImages.Count);
                Texture2D image = mImages[index];
                mVisuals.Add(new Visual(image, new Vector2(x, y), distance * (mImages.Count - index) / (float)(mImages.Count)));
            }
        }

        public void LoadImages(ContentManager content)
        {
            AddImage(content, "Starfield/Galaxy", 1);
            AddImage(content, "Starfield/Nebula", 1);
            AddImage(content, "Starfield/Nebula2", 1);
            AddImage(content, "Starfield/StarBlueGiant", 15);
            AddImage(content, "Starfield/StarRedGiant", 20);
            AddImage(content, "Starfield/StarRedDwarf", 50);
            AddImage(content, "Starfield/StarSmallBlue", 100);
            AddImage(content, "Starfield/StarYellow", 1000);
        }

        private void AddImage(ContentManager content, string resource, int frequency)
        {
            Texture2D image = content.Load<Texture2D>(resource);
            mMaxImageSize = new Vector2(Math.Max(mMaxImageSize.X, image.Width), Math.Max(mMaxImageSize.Y, image.Height));
            for (int i = 0; i < frequency; ++i)
            {
                mImages.Add(image);
            }
        }

        public void Draw(SpriteBatch batch, Vector2 offset, int width, int height)
        {
            batch.Begin();
            foreach (Visual v in mVisuals)
            {
                Vector2 location = v.TiledLocation(offset, mSize);
                if (location.X < -mMaxImageSize.X || width < location.X)
                    continue;
                if (location.Y < -mMaxImageSize.Y || height < location.Y)
                    continue;
                batch.Draw(v.Image, location, Color.White);
            }
            batch.End();
        }
    }
}
