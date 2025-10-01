import { useState } from "react";
import reactLogo from "./assets/react.svg";
import viteLogo from "/vite.svg";
import "./App.css";

type ChatMessage = { user: string; message: string; ts: string };

function App() {
   const [input, setInput] = useState("");
   const [log, setLog] = useState<ChatMessage[]>([]);

   const sendMessage = () => {
      if (!input.trim()) return;
      const msg: ChatMessage = {
         user: "Me",
         message: input,
         ts: new Date().toISOString(),
      };
      setLog([...log, msg]);
      setInput("");
   };

   return (
      <div className="chat-container">
         <h1>SiglarR Chat</h1>

         <div>
            <input placeholder="Username" />
            <input placeholder="Password" />
            <button>Login</button>
            <div className="chat-log">
               {log.length === 0 && (
                  <p className="chat-empty">No messages yet..</p>
               )}
               {log.map((m, i) => (
                  <div key={i} className="chat-message">
                     <span className="chat-timestamp">
                        [{new Date(m.ts).toLocaleTimeString()}]
                     </span>
                     <strong>{m.user}:</strong>
                     {m.message}
                  </div>
               ))}
            </div>
         </div>

         <div className="chat-input-row">
            <input
               className="chat-input"
               value={input}
               onChange={(e) => setInput(e.target.value)}
               onKeyDown={(e) => e.key == "Enter" && sendMessage()}
               placeholder="Type a message..."
            />
            <button className="chat-send" onClick={sendMessage}>
               Send
            </button>
         </div>
      </div>
   );
}

export default App;
