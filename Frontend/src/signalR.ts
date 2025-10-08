import * as signalR from "@microsoft/signalr"

// A single shared SignalR connection that any component can import and reuse.
export const hub = new signalR.HubConnectionBuilder()
/* 
    Points the client to my server chathub endpoint.
    Using a relative path since I have a Vite proxy.
*/
.withUrl("/chathub")
.withAutomaticReconnect()
.configureLogging(signalR.LogLevel.Information)
.build();

/**
 * Use a shared promise so concurrent callers wait for the same start attempt.
 * This prevents multipy overlapping hub.Start() calls.
 */

let startPromise : Promise<void> | null = null;

/**
 * Ensure the shared SignalR connection is started.
 * - Returns if already connected
 * - If a start is in progress, wait for it to finish.
 * - Only calls hub.start() when the hub is disconnected.
 */
export async function ensureHubstarted() : Promise<void> {
    if(hub.state === signalR.HubConnectionState.Connected) return;
    if(startPromise)
    {
        await startPromise;
        return;
    } 
    if(hub.state === signalR.HubConnectionState.Disconnected)
    {
        startPromise = hub.start();
        try{
            await startPromise;
        }
        catch(err: unknown)
        {
            console.error("Failed to start signalR hub", err);
        }
        finally {
            //resets when done or on error. 
            startPromise = null;
        }
    }
 
}