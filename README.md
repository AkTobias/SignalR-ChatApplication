# SignalR Chat (server + React-client)

## Before you can use this application you need 
 * .Net SKD 9.0+
 * Node 18+ and npm
 * Trusted HTTPS dev certificate (for secure WebSockets)

## Step 1 Set ut HTTPS (once)
from  SignalR-ChatApplication or SignalR-ChatApplication/Server 
run "dotnet dev-certs https --trust"

## Step 2 => run the server
    1. Check the dev-certs run => "dotnet dev-certs https --check"
    2. run => "dotnet restore"

  From the Server run => "dotnet run"
  From the repo root folder run => "dotnet run --Server"

## Step 3 => run the react-client
  1. from root folder run => cd Frontend
  2. run => "npm i" or "npm install"
  3. run => "npm run dev"
  4. Open or copy the url it should be "https://localhost:5173/"
