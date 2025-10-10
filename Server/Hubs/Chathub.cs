using System.Collections.Concurrent;
using System.Security.Cryptography;
using System.Text.RegularExpressions;
using Microsoft.AspNetCore.SignalR;
using Server.Cryptography;
//using Server.Cryptography;

namespace SignalRChat.Hubs
{
    public class Chathub : Hub
    {

        // 
        private readonly byte[] _aesKey;

        private static readonly Regex usernameFormat =
            new(@"^[\p{L}\p{N}_\.\-]{2,25}$", RegexOptions.CultureInvariant);

        //track usernames globally on the server (case-insensitive)
        private static readonly ConcurrentDictionary<string, byte> Username =
        new(StringComparer.OrdinalIgnoreCase);

        private const string UsernameKey = "username";

        public Chathub(byte[] aesKey)
        {
            _aesKey = aesKey;

        }


        public async Task Register(string username)
        {
            username = (username ?? string.Empty).Trim();

            if (string.IsNullOrWhiteSpace(username) || !usernameFormat.IsMatch(username))
            {
                throw new HubException("You have to enter a valid username.");
            }

            if (Context.Items.ContainsKey(UsernameKey))
            {
                throw new HubException("Already registered");
            }

            if (!Username.TryAdd(username, 0))
            {
                throw new HubException("Username already taken");
            }

            Context.Items[UsernameKey] = username;

            await Clients.Caller.SendAsync("Register", username);

            await Clients.Others.SendAsync("UserJoined", username, Context.ConnectionId);

        }

        public async Task SendMessageEncrypted(string ivB64, string payloadB64)
        {
            if (!Context.Items.TryGetValue(UsernameKey, out var userObj) || userObj is not string user)
                throw new HubException("You have to enter a valid username if you want to send a message");

            string plaintext;
            try
            {
                plaintext = CryptoAesGcm.Decrypt(ivB64, payloadB64, _aesKey);
            }
            catch (FormatException)
            {
                throw new HubException("Invalid base64.");

            }
            catch (CryptographicException)
            {
                throw new HubException("Invalid ciphertext or key.");
            }

            var (outIvB64, outPayloadB64) = CryptoAesGcm.Encrypt(plaintext, _aesKey);

            await Clients.All.SendAsync("MessageReceived", user, outIvB64, outPayloadB64, DateTimeOffset.UtcNow);
        }


        public override async Task OnConnectedAsync()
        {
            await Clients.Caller.SendAsync("Connected", Context.ConnectionId);

            await base.OnConnectedAsync();
        }

        public override async Task OnDisconnectedAsync(Exception? exception)
        {
            if (Context.Items.TryGetValue(UsernameKey, out var userObj) && userObj is string username)
            {
                Context.Items.Remove(UsernameKey);
                Username.TryRemove(username, out _);

                await Clients.Others.SendAsync("UserLeft", username, Context.ConnectionId);
            }
            await base.OnDisconnectedAsync(exception);
        }

        public async Task Logout()
        {
            if (Context.Items.TryGetValue(UsernameKey, out var userObj) && userObj is string username)
            {
                Context.Items.Remove(UsernameKey);
                Username.TryRemove(username, out _);

                await Clients.Caller.SendAsync("Register", null);
                await Clients.Others.SendAsync("UserLeft", username, Context.ConnectionId);
            }


        }

    }
}