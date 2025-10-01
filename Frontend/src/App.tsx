// App.tsx — minimal SignalR connection test
import { useEffect, useState } from "react";
import * as signalR from "@microsoft/signalr";
import { hub, ensureHubStarted } from "./signalR";

export default function App() {
   const [status, setStatus] = useState<
      "connecting" | "connected" | "disconnected"
   >("connecting");
   const [connectionId, setConnectionId] = useState<string | null>(null);
   const [error, setError] = useState<string | null>(null);

   useEffect(() => {
      let alive = true;

      const onConnected = (cid: string) => {
         if (!alive) return;
         setStatus("connected");
         setConnectionId(cid);
      };

      hub.on("Connected", onConnected);

      hub.onreconnecting(() => alive && setStatus("connecting"));
      hub.onreconnected(() => alive && setStatus("connected"));
      hub.onclose((e) => {
         if (!alive) return;
         setStatus("disconnected");
         setError(e?.message ?? null);
      });

      (async () => {
         setStatus("connecting");
         setError(null);
         try {
            await ensureHubStarted();
            if (alive && hub.state === signalR.HubConnectionState.Connected) {
               setStatus("connected");
            }
         } catch (e: any) {
            if (alive) {
               setStatus("disconnected");
               setError(e?.message || String(e));
            }
         }
      })();

      return () => {
         alive = false;
         hub.off("Connected", onConnected);
      };
   }, []);

   return (
      <div style={{ fontFamily: "system-ui, sans-serif", padding: 24 }}>
         <h1>SignalR connection test</h1>
         <p>
            Status: <strong>{status}</strong>
         </p>
         {connectionId && (
            <p>
               ConnectionId: <code>{connectionId}</code>
            </p>
         )}
         {error && (
            <p style={{ color: "crimson" }}>
               Error: <code>{error}</code>
            </p>
         )}
      </div>
   );
}
