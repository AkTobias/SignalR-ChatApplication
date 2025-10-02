using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using System.Security.Cryptography;
using System.Text;


namespace Server.Cryptography
{
    public interface ICryptoAes
    {
        string Encrypt(string plaintext);
        string Decrypt(string base64);

    }
    public sealed class CryptoAes : ICryptoAes
    {
        private readonly byte[] _key = Convert.FromBase64String("B7xw1o2a3k9M9D0n6y9jJQhL9oqeQ0U6hV7e3J9T1Qw");


        private const int ivSize = 12;
        private const int tagSize = 16;
        public string Encrypt(string plaintext)
        {
            var iv = RandomNumberGenerator.GetBytes(ivSize);
            var plain = Encoding.UTF8.GetBytes(plaintext);
            var cipher = new byte[plain.Length];
            var tag = new byte[tagSize];
            using var aes = new AesGcm(_key, tagSize);
            aes.Encrypt(iv, plain, cipher, tag);

            var payload = new byte[iv.Length + cipher.Length + tag.Length];
            Buffer.BlockCopy(iv, 0, payload, 0, iv.Length);
            Buffer.BlockCopy(cipher, 0, payload, 0, cipher.Length);
            Buffer.BlockCopy(tag, 0, payload, cipher.Length, tag.Length);

            return Convert.ToBase64String(payload);

        }
        public string Decrypt(string base64)
        {
            var all = Convert.FromBase64String(base64);
            if (all.Length < 12 + 16) throw new CryptographicException("Invalid payload");
            var iv = new ReadOnlySpan<byte>(all, 0, 12);
            var body = new ReadOnlySpan<byte>(all, 12, all.Length - 12);
            var tag = body.Slice(body.Length - 16, 16);
            var ciphertext = body.Slice(0, body.Length - 16);
            var plain = new byte[ciphertext.Length];
            using var aes = new AesGcm(_key, tagSize);
            aes.Decrypt(iv, ciphertext, tag, plain);
            return Encoding.UTF8.GetString(plain);
        }


    }
}