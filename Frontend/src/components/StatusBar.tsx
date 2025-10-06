import type { ConnectionStatus } from "../types/connectionStatusType";
import "../App.css";

export default function StatusBar({ status }: { status: ConnectionStatus }) {
   const label =
      status === "connected"
         ? "Connected"
         : status === "connecting"
         ? "Connecting..."
         : "Disconnected";

   return (
      <div className={`status-pill is-${status}`}>
         <span>{label}</span>
      </div>
   );
}
