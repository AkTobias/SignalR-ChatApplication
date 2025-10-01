import { useCallback, useEffect, useRef, useState } from "react";
import "./App.css";
import * as signalR from "@microsoft/signalr";
import { ensureHubStarted, hub } from "./signalR";

//import { hub, ensureHubStarted } from "./signalr";

type ChatMessage = { kind: "chat"; user: string; message: string; ts: string };
type SystemMessage = {
   kind: "system";
   message: string;
   ts: string;
};

type Message = ChatMessage | SystemMessage;

function App() {
   const [status, setStatus] = useState<
      "disconnected" | "connecting" | "connected"
   >("connecting");

   const [nameInput, setNameInput] = useState("");
   const [registeredAs, setregisteredAs] = useState<string | null>(null);
   const [text, setText] = useState("");
   const [log, setLog] = useState<Message[]>([]);
   const EndRef = useRef<HTMLDivElement | null>(null);

   //const [connectionId, setConnectionId] = useState<string | null>(null);

   //-- helpers
   const appendMessage = useCallback((m: Message) => {
      setLog((prev) => [...prev, m]);
   }, []);

   const appendSystem = useCallback(
      (text: string) =>
         appendMessage({
            kind: "system",
            message: text,
            ts: new Date().toISOString(),
         }),
      [appendMessage]
   );

   // attack signalR handlers and start connection

   //test
   useEffect(() => {
      EndRef.current?.scrollIntoView({ behavior: "smooth" });
   }, [log]);

   useEffect(() => {
      let alive = true;

      const onConnected = () => {
         setStatus("connected");
      };

      const onRegister = (safeName: string) => {
         setregisteredAs(safeName);
         appendSystem(`logged in as ${safeName}`);
      };
      const onJoined = (safeName: string) =>
         appendSystem(`${safeName} joined the chat`);
      const onLeft = (safeName: string) =>
         appendSystem(`${safeName} left the chat`);

      const onMessage = (
         user: string,
         safeMessage: string,
         at: string | number | Date
      ) => {
         const ts =
            typeof at === "string" || typeof at === "number"
               ? new Date(at).toISOString()
               : at.toISOString();
         appendMessage({ kind: "chat", user, message: safeMessage, ts });
      };

      hub.on("Connected", onConnected);
      hub.on("Register", onRegister);
      hub.on("UserJoined", onJoined);
      hub.on("UserLeft", onLeft);
      hub.on("MessageReceived", onMessage);

      hub.onreconnecting(() => setStatus("connecting"));
      hub.onreconnected(() => setStatus("connected"));
      hub.onclose(() => setStatus("disconnected"));

      (async () => {
         setStatus("connecting");
         try {
            await ensureHubStarted();
            if (alive && hub.state === signalR.HubConnectionState.Connected) {
               setStatus("connected");
            }
         } catch (err: any) {
            if (alive) {
               appendSystem(err?.message ?? "Failed to connect");
               setStatus("disconnected");
            }
         }
      })();

      return () => {
         alive = false;
         hub.off("Connected", onConnected);
         hub.off("Register", onRegister);
         hub.off("UserJoined", onJoined);
         hub.off("UserLeft", onLeft);
         hub.off("MessageReceived", onMessage);
      };
   }, [appendMessage, appendSystem]);

   // ACTIONS
   async function register() {
      const name = nameInput.trim();
      if (!name) {
         alert("Enter a username first");
         return;
      }
      try {
         await hub.invoke("Register", name);
      } catch (e: any) {
         alert(e?.message || String(e)); // dubblekolla
      }
   }

   async function send() {
      const t = text.trim();
      if (!t || !registeredAs) return;
      try {
         await hub.invoke("SendMessage", t);
         setText("");
      } catch (e: any) {
         alert(e?.message || String(e));
      }
   }

   const connected = status === "connected";

   // ---------------------- UI ----------

   return (
      <div className="chat-container">
         <h1>SignalR chat</h1>

         <div className="chat-row">
            <input
               placeholder="Username"
               value={nameInput}
               onChange={(e) => setNameInput(e.target.value)}
               disabled={!connected}
            />
            <button className="btn" onClick={register} disabled={!connected}>
               register
            </button>
            <span className="chat-status">
               {connected
                  ? registeredAs
                     ? `Logged in as ${registeredAs}`
                     : "Connected"
                  : status === "connecting"
                  ? "Connecting..."
                  : "Disconnected"}
            </span>
         </div>

         {/* log*/}
         <div className="chat-log">
            {log.length === 0 && (
               <p className="chat-empty">No messages yet...</p>
            )}

            {log.map((m, i) =>
               m.kind === "system" ? (
                  <div key={i} className="chat-sys">
                     <span className="chat-timestamp">
                        [{new Date(m.ts).toLocaleTimeString()}]
                     </span>{" "}
                     <span>{m.message}</span>
                  </div>
               ) : (
                  <div key={i} className="chat-message">
                     <span className="chat-timestamp">
                        [{new Date(m.ts).toLocaleTimeString()}]
                     </span>
                     <strong>{m.user}: </strong>
                     <span>{m.message}</span>
                  </div>
               )
            )}
            <div ref={EndRef} />
         </div>

         <div className="chat-input-row">
            <input
               className="chat-input"
               value={text}
               onChange={(e) => setText(e.target.value)}
               onKeyDown={(e) => e.key === "Enter" && send()}
               placeholder="Type a message"
               disabled={!connected}
            />
            <button
               className="btn"
               onClick={send}
               disabled={!connected || !text.trim()}
            >
               Send
            </button>
         </div>
      </div>
   );
}

export default App;
