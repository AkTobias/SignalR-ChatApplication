using System;
using System.Collections.Concurrent;
using System.Collections.Generic;
using System.Linq;
using System.Runtime.CompilerServices;
using System.Text.Encodings.Web;
using System.Text.RegularExpressions;
using System.Threading.Tasks;
using Microsoft.AspNetCore.SignalR;
using Server.Cryptography;

namespace SignalRChat.Hubs
{
    public class Chathub : Hub
    {
        private readonly ICryptoAes _cryptoAes;
        private const string UsernameKey = "username";
        private static readonly HtmlEncoder Html = HtmlEncoder.Default;
        private static readonly Regex usernameFormat = new(@"^[\p{L}\p{N}\s._-]{1,32}$^");

        public Chathub(ICryptoAes cryptoAes) => _cryptoAes = cryptoAes;

        public async Task Register(string username)
        {



            username = (username ?? string.Empty).Trim();
            if (string.IsNullOrWhiteSpace(username) || !usernameFormat.IsMatch(username))
            {
                throw new HubException("You have to enter a valid username ");
            }

            var safeName = Html.Encode(username);

            Context.Items[UsernameKey] = safeName;

            await Clients.Caller.SendAsync("Register", safeName);

            await Clients.Others.SendAsync("UserJoined", safeName, Context.ConnectionId);

        }

        public async Task SendMessage(string messageCipherB64)
        {


            // maybe add max lenght of plainmessage later.
            if (!Context.Items.TryGetValue(UsernameKey, out var userObj) || userObj is not string userRaw)
            {
                throw new HubException("You have to enter a username if you want to write.");
            }
            string plainMessage;
            try { plainMessage = _cryptoAes.Decrypt(messageCipherB64 ?? ""); }
            catch { throw new HubException("Invalid encrypted message"); }

            var safeUser = Html.Encode(userRaw ?? string.Empty);
            var safeMessage = Html.Encode(plainMessage ?? string.Empty);

            await Clients.All.SendAsync("MessageReceived", safeUser, safeMessage, DateTimeOffset.UtcNow);

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
                await Clients.Others.SendAsync("UserLeft", username, Context.ConnectionId);
            }
            await base.OnDisconnectedAsync(exception);
        }
    }
}