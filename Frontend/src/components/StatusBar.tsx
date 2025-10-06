import type { ConnectionStatus } from "../types/connectionStatusType";
import "../App.css";

export default function StatusBar({
   status,
   registeredAs,
}: {
   status: ConnectionStatus;
   registeredAs: string | null;
}) {
   const connected = status === "connected";
   return (
      <span className="chat-status">
         {connected
            ? registeredAs
               ? `Logged in as ${registeredAs}`
               : "Connected"
            : status === "connecting"
            ? "Connecting..."
            : "Disconnected"}
      </span>
   );
}
