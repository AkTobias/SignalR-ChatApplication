import * as signalR from "@microsoft/signalr"

// One SignalR connection that can be imported and reused.

export const hub = new signalR.HubConnectionBuilder()

.withUrl("/chathub")
.withAutomaticReconnect()
.configureLogging(signalR.LogLevel.Trace)
.build();

export let starting = false;
// ensures the SignalR connection is ready before sending or subscribing to events 
export async function ensureHubStarted() : Promise<void> {
    if(hub.state === signalR.HubConnectionState.Connected) return;
    if(starting) return;
    starting = true
    try{
        await hub.start();
    } finally {
        starting = false;
    }
    
}