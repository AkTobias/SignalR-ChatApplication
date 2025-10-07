using System.Security.Cryptography;
using System.Text;


namespace Server.Cryptography
{

    /// <summary>
    /// Helpers for sysematic encryption/decryption using AES-GCM
    /// - Uses a 12-byte IV per NIST (National Institute of Standards and Technology) recommendations.
    /// - Uses a 16-byte authentication tag (128-bit)
    /// </summary>
    public sealed class CryptoAesGcm
    {
        private const int IvSize = 12;
        private const int TagSize = 16;

        public static (string ivB64, string payloadB64) Encrypt(string plaintext, byte[] key)
        {
            // 1) Generate a unique random IV/nonce 12-bytes per encryption.
            var iv = RandomNumberGenerator.GetBytes(IvSize);
            // 2) Convert the plain text message into bytes.
            var plain = Encoding.UTF8.GetBytes(plaintext);
            // 3) Prepare buffers for ciphertext and GCM tag.
            var cipher = new byte[plain.Length];
            var tag = new byte[TagSize];
            // 4) Encrypt: AES-GCM produces both cipher and tag.
            using var aes = new AesGcm(key, TagSize);
            aes.Encrypt(iv, plain, cipher, tag);
            // 5) Creates a byte array with both the cipher and the tag so the caller can send a single payload.
            var payload = new byte[cipher.Length + tag.Length];
            Buffer.BlockCopy(cipher, 0, payload, 0, cipher.Length);
            Buffer.BlockCopy(tag, 0, payload, cipher.Length, tag.Length);
            // 6 Returns the IV and payload as Base64 string.
            return (Convert.ToBase64String(iv), Convert.ToBase64String(payload));
        }

        public static string Decrypt(string ivB64, string payloadB64, byte[] key)
        {
            // 1 Base64 decode
            byte[] iv, payload;
            // 2 check so the Base64 is valid
            try
            {
                iv = Convert.FromBase64String(ivB64);
                payload = Convert.FromBase64String(payloadB64);
            }
            catch (FormatException ex)
            {
                throw new CryptographicException("Invalid Base64", ex);
            }

            // 3 check the so VI is the right size
            if (iv.Length != IvSize)
            {
                throw new CryptographicException("Invalid IV size");
            }

            // 4 check the payload size is smaller than the tag size 
            if (payload.Length < TagSize)
            {
                throw new CryptographicException("Invalid payload size");
            }

            // 5 Splits the payload into ciphertext and tag.
            var tag = new byte[TagSize];
            var cipher = new byte[payload.Length - tag.Length];
            Buffer.BlockCopy(payload, 0, cipher, 0, cipher.Length);
            Buffer.BlockCopy(payload, cipher.Length, tag, 0, tag.Length);

            // 6 Decrypt and authenticates the data via the tag.
            var plain = new byte[cipher.Length];
            using var aes = new AesGcm(key, TagSize);
            aes.Decrypt(iv, cipher, tag, plain);

            // 7 Convert the message from bytes back into UTF-8 string.
            return Encoding.UTF8.GetString(plain);

        }

    }
}
