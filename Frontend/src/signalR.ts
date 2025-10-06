import * as signalR from "@microsoft/signalr"


export const hub = new signalR.HubConnectionBuilder()
.withUrl("/chathub")
.withAutomaticReconnect()
.configureLogging(signalR.LogLevel.Trace)
.build();

export let starting = false;

export async function ensureHubStarted() {
    if(hub.state === signalR.HubConnectionState.Connected) return;
    if(starting) return;
    starting = true
    try{
        await hub.start();
    } finally {
        starting = false;
    }
    
}