using System;

namespace RGG2010
{
    static class Program
    {
        /// <summary>
        /// The main entry point for the application.
        /// </summary>
        static void Main(string[] args)
        {
            using (Scrace game = new Scrace())
            {
                game.Run();
            }
        }
    }
}

