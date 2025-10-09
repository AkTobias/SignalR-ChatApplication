using System.Security.Cryptography;
using System.Text;


namespace Server.Cryptography
{

    /// <summary>
    /// Using AES-256-GCM (a 32 byte key) 
    /// I choose GCM (Galois/Counter Mode) because it can process data blocks simultaneously, 
    /// which makes it very fast. 
    /// </summary>

    public sealed class CryptoAesGcm
    {   // Uses a 12-byte IV per (National Institute of Standards and Technology) recommendations.
        private const int IvSize = 12;
        //Uses a 16-byte authentication tag (128-bit)
        private const int TagSize = 16;

        public static (string ivB64, string payloadB64) Encrypt(string plaintext, byte[] key)
        {
            // 1) Generate a unique random IV/nonce 12-bytes per encryption.
            var iv = RandomNumberGenerator.GetBytes(IvSize);

            // 2) Convert the plain text message into bytes.
            var plain = Encoding.UTF8.GetBytes(plaintext);

            // 3) Allocate space for the buffers for the cipher and the tag.
            var cipher = new byte[plain.Length];
            var tag = new byte[TagSize];

            // 4) Initialize the AES-GCM engine with the 
            // provided key.
            using var aes = new AesGcm(key, TagSize);

            // 5) Encrypts: writes ciphertext  into 'cipher' and 
            // computes the authentication tag  into 'tag' by using GHASH.
            aes.Encrypt(iv, plain, cipher, tag);

            // 6) Combinds the ciphertext and tag into a single payload for transport.
            var payload = new byte[cipher.Length + tag.Length];
            Buffer.BlockCopy(cipher, 0, payload, 0, cipher.Length);
            Buffer.BlockCopy(tag, 0, payload, cipher.Length, tag.Length);

            // 7) Returns the IV and payload as Base64 strings since it's safe for JSON/Websockets.
            return (Convert.ToBase64String(iv), Convert.ToBase64String(payload));
        }

        public static string Decrypt(string ivB64, string payloadB64, byte[] key)
        {
            // 1) the Base64-decode inputs
            byte[] iv, payload;
            // 2 Validate so the Base64 is valid
            try
            {
                iv = Convert.FromBase64String(ivB64);
                payload = Convert.FromBase64String(payloadB64);
            }
            catch (FormatException ex)
            {
                throw new CryptographicException("Invalid Base64", ex);
            }

            // 3 Validate IV lenght (must be 12 bytes)
            if (iv.Length != IvSize)
            {
                throw new CryptographicException("Invalid IV size");
            }

            // 4 Validate so the payload is atleast TagSize)
            if (payload.Length < TagSize)
            {
                throw new CryptographicException("Invalid payload size");
            }

            // 5) Split payload into ciphertext and tag
            var tag = new byte[TagSize];
            var cipher = new byte[payload.Length - tag.Length];
            Buffer.BlockCopy(payload, 0, cipher, 0, cipher.Length);
            Buffer.BlockCopy(payload, cipher.Length, tag, 0, tag.Length);

            // 6 Decrypt and authenticates the data via the tag.
            var plain = new byte[cipher.Length];
            using var aes = new AesGcm(key, TagSize);
            aes.Decrypt(iv, cipher, tag, plain);

            // 7 Convert plaintext bytes back into UTF-8 and returns.
            return Encoding.UTF8.GetString(plain);

        }

    }
}
