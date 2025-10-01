using System;
using System.Collections.Concurrent;
using System.Collections.Generic;
using System.Linq;
using System.Text.Encodings.Web;
using System.Threading.Tasks;
using Microsoft.AspNetCore.SignalR;

namespace SignalRChat.Hubs
{
    public class Chathub : Hub
    {
        private const string UsernameKey = "username";
        private static readonly HtmlEncoder Html = HtmlEncoder.Default;

        public async Task Register(string username)
        {
            username = (username ?? string.Empty).Trim();


            if (string.IsNullOrWhiteSpace(username))
            {
                throw new HubException("You have to enter username");
            }

            var safeName = Html.Encode(username);

            Context.Items[UsernameKey] = safeName;

            await Clients.Caller.SendAsync("Register", safeName);

            await Clients.Others.SendAsync("UserJoined", safeName, Context.ConnectionId);

        }

        public async Task SendMessage(string message)
        {
            if (!Context.Items.TryGetValue(UsernameKey, out var userObj) || userObj is not string username)
            {
                throw new HubException("You have to enter a username if you want to write.");
            }

            var safeMessage = Html.Encode(message ?? string.Empty);

            await Clients.All.SendAsync("MessageReceived", username, safeMessage, DateTimeOffset.UtcNow);

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