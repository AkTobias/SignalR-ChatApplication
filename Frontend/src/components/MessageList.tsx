import { useEffect, useRef } from "react";
import type { Message } from "../types/chatMessageType";
import "../App.css";

export default function MessageList({ log }: { log: Message[] }) {
   const endRef = useRef<HTMLDivElement | null>(null);

   useEffect(() => {
      endRef.current?.scrollIntoView({ behavior: "smooth" });
   }, [log]);

   return (
      <div className="chat-log">
         {log.length === 0 && <p className="chat-empty">No Messages</p>}
         {log.map((m, i) =>
            m.kind === "system" ? (
               <div key={i} className="chat-sys">
                  <span className="chat-timespan">
                     [{new Date(m.ts).toLocaleTimeString()}]
                  </span>
                  <span>{m.message}</span>
               </div>
            ) : (
               <div key={i} className="chat-message">
                  <span className="chat-timespan">
                     [{new Date(m.ts).toLocaleTimeString()}]
                  </span>
                  <strong>{m.user}:</strong>
                  <span>{m.message}</span>
               </div>
            )
         )}
         <div ref={endRef} />
      </div>
   );
}
