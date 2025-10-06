using System;
using System.Collections.Concurrent;
using System.Collections.Generic;
using System.Linq;
using System.Runtime.CompilerServices;
using System.Security.Cryptography;
using System.Text;
using System.Text.Encodings.Web;
using System.Text.RegularExpressions;
using System.Threading.Tasks;
using Microsoft.AspNetCore.SignalR;
using Server.Cryptography;

namespace SignalRChat.Hubs
{
    public class Chathub : Hub
    {

        private const string UsernameKey = "username";
        private readonly byte[] _aesKey = Convert.FromBase64String("97ZBxEEvCz4ernqTAAmXAgtbERQu8N7RU+08XvR4Xe0=");
        //private static readonly HtmlEncoder Html = HtmlEncoder.Default;
        private readonly HtmlEncoder _encoder;

        private static readonly Regex usernameFormat = new(@"^[\p{L}\p{N}\s._-]{1,32}$");
        public Chathub(byte[] aesKey, HtmlEncoder encoder)
        {
            _aesKey = aesKey;
            _encoder = encoder;
        }


        public async Task Register(string username)
        {
            username = (username ?? string.Empty).Trim();
            if (string.IsNullOrWhiteSpace(username) || !usernameFormat.IsMatch(username))
            {
                throw new HubException("You have to enter a valid username ");
            }


            var safeName = _encoder.Encode(username);

            Context.Items[UsernameKey] = safeName;

            await Clients.Caller.SendAsync("Register", safeName);

            await Clients.Others.SendAsync("UserJoined", safeName, Context.ConnectionId);

        }
        /*
        public async Task SendMessage(string message)
        {
            if (!Context.Items.TryGetValue(UsernameKey, out var userObj) || userObj is not string user)
            {
                throw new HubException("You have to enter a valid username if you want to send a message");
            }
            //maybe add "" ? 
            var safe = _encoder.Encode(message);
            var (ivB64, payloadB64) = CryptoAes.Encrypt(safe, _aesKey);


            await Clients.All.SendAsync("MessageReceived", user, ivB64, payloadB64, DateTimeOffset.UtcNow);

        }
        */
        public async Task SendMessageEncrypted(string ivB64, string payloadB64)
        {
            if (!Context.Items.TryGetValue(UsernameKey, out var userObj) || userObj is not string user)
                throw new HubException("You have to enter a valid username if you want to send a message");

            string plaintext;
            try
            {
                plaintext = CryptoAes.Decrypt(ivB64, payloadB64, _aesKey);
            }
            catch (CryptographicException)
            {
                throw new HubException("Invalid ciphertext or key.");
            }

            // Sanitize on the server (never trust client input)
            var safe = _encoder.Encode(plaintext);

            // Re-encrypt with a fresh IV before broadcasting
            var (outIvB64, outPayloadB64) = CryptoAes.Encrypt(safe, _aesKey);

            await Clients.All.SendAsync("MessageReceived", user, outIvB64, outPayloadB64, DateTimeOffset.UtcNow);
        }


        public override async Task OnConnectedAsync()
        {
            await Clients.Caller.SendAsync("Connected", Context.ConnectionId);

            var (ivB64, payloadB64) = CryptoAes.Encrypt("__AES_GCM_SELFTEST__", _aesKey);
            await Clients.Caller.SendAsync("MessageReceived",
            "server", ivB64, payloadB64, DateTimeOffset.UtcNow);
            await base.OnConnectedAsync();
        }


        public override async Task OnDisconnectedAsync(Exception? exception)
        {
            if (Context.Items.TryGetValue(UsernameKey, out var userObj) && userObj is string username)
            {
                await Clients.Others.SendAsync("UserLeft", username, Context.ConnectionId);
            }
            await base.OnDisconnectedAsync(exception);
        }
    }
}