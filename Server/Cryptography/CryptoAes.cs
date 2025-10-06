using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using System.Security.Cryptography;
using System.Text;


namespace Server.Cryptography
{

    public sealed class CryptoAes
    {
        private const int IvSize = 12;
        private const int TagSize = 16;

        public static (string ivB64, string payloadB64) Encrypt(string plaintext, byte[] key)
        {
            var iv = RandomNumberGenerator.GetBytes(IvSize);
            var plain = Encoding.UTF8.GetBytes(plaintext);
            var cipher = new byte[plain.Length];
            var tag = new byte[TagSize];

            using var aes = new AesGcm(key, TagSize);
            aes.Encrypt(iv, plain, cipher, tag);

            var paylaod = new byte[cipher.Length + tag.Length];
            Buffer.BlockCopy(cipher, 0, paylaod, 0, cipher.Length);
            Buffer.BlockCopy(tag, 0, paylaod, cipher.Length, tag.Length);

            return (Convert.ToBase64String(iv), Convert.ToBase64String(paylaod));
        }

        public static string Decrypt(string ivB64, string payloadB64, byte[] key)
        {
            var iv = Convert.FromBase64String(ivB64);
            var paylaod = Convert.FromBase64String(payloadB64);

            var tag = new byte[TagSize];
            var cipher = new byte[paylaod.Length - tag.Length];
            Buffer.BlockCopy(paylaod, 0, cipher, 0, cipher.Length);
            Buffer.BlockCopy(paylaod, cipher.Length, tag, 0, tag.Length);

            var plain = new byte[cipher.Length];
            using var aes = new AesGcm(key, TagSize);
            aes.Decrypt(iv, cipher, tag, plain);
            return Encoding.UTF8.GetString(plain);

        }

    }
}
