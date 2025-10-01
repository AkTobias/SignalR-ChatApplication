using System.Text.Encodings.Web;
using SignalRChat.Hubs;

var builder = WebApplication.CreateBuilder(args);


//
builder.WebHost.ConfigureKestrel(o =>
{
    o.ListenLocalhost(5172);
    o.ListenLocalhost(5001, o => o.UseHttps());
});


builder.Services.AddCors(options =>
{
    options.AddPolicy("dev", p => p
        .WithOrigins("https://localhost:5173", "https://127.0.0.1:5173")
        .AllowAnyHeader()
        .AllowAnyMethod()
        .AllowCredentials()
    );
});


// 
builder.Services.AddSignalR();
builder.Services.AddSingleton(HtmlEncoder.Default);

var app = builder.Build();

app.UseHttpsRedirection();
app.UseCors("dev");

app.UseDefaultFiles();
app.UseStaticFiles();

app.MapHub<Chathub>("/chathub");
app.MapGet("/health", () => "OK");

app.Run();
