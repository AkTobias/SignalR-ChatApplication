using System.Text.Encodings.Web;
using System.Text.Unicode;
using Microsoft.AspNetCore.Http.Connections;
using Microsoft.Extensions.DependencyInjection;
using Server.Cryptography;
using SignalRChat.Hubs;

var builder = WebApplication.CreateBuilder(args);

//Binds Kestrel to localhost:5001 over HTTPS
builder.WebHost.ConfigureKestrel(o =>
{
    o.ListenLocalhost(5001, o => o.UseHttps());
});


builder.Services.AddCors(options =>
{
    options.AddPolicy("dev", p => p
        .WithOrigins("https://localhost:5173")
        .AllowAnyHeader()
        .AllowAnyMethod()
        .AllowCredentials()
    );
});


builder.Services.AddSignalR();

//32 the key is 32 bytes, => a 256 bit-key
//Register my AES-key so it can be constructor-injected.
builder.Services.AddSingleton(sp =>
    Convert.FromBase64String("97ZBxEEvCz4ernqTAAmXAgtbERQu8N7RU+08XvR4Xe0=")
);


var app = builder.Build();

app.UseHttpsRedirection();
app.UseCors("dev");

app.UseDefaultFiles();
app.UseStaticFiles();

app.MapHub<Chathub>("/chathub");
//app.MapGet("/health", () => "OK");

app.Run();
