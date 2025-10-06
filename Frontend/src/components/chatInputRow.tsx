import { useState } from "react";
import "../App.css";

export default function ChatInputRow({
   onSend,
   disabled,
}: {
   onSend: (text: string) => Promise<void> | void;
   disabled: boolean;
}) {
   const [text, setText] = useState("");

   const send = async () => {
      try {
         const t = text;
         if (!t) return;
         await onSend(t);
         setText("");
      } catch (e: any) {
         alert(e?.message || String(e));
      }
   };

   return (
      <div className="chat-input-row">
         <input
            className="chat-input"
            value={text}
            onChange={(e) => setText(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && send()}
            placeholder="Send a message"
            disabled={disabled}
         />
         <button className="btn" onClick={send} disabled={disabled}>
            Send
         </button>
      </div>
   );
}
