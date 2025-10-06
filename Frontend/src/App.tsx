//import { useCallback, useEffect, useState } from "react";
import "./App.css";
//import * as signalR from "@microsoft/signalr";
//import { ensureHubStarted, hub } from "./signalR";
//import { decryptAesGcmFromBase64, initAesKeyFromBase64 } from "./crytoAes";
import { useChatConnection } from "./hooks/useChatConnection";
import StatusBar from "./components/StatusBar";
import MessageList from "./components/MessageList";
import RegisterForm from "./components/registerForm";
import ChatInputRow from "./components/chatInputRow";

function App() {
   const { status, connected, registeredAs, log, register, send } =
      useChatConnection({
         aesKeyB64: "97ZBxEEvCz4ernqTAAmXAgtbERQu8N7RU+08XvR4Xe0=",
      });
   // check {registeredAs || null}
   return (
      <div className="chat-container">
         <h1>SignalR chat</h1>

         <div className="chat-row">
            <RegisterForm onRegister={register} connected={connected} />
            <StatusBar status={status} registeredAs={registeredAs ?? null} />
         </div>

         <MessageList log={log} />
         <ChatInputRow onSend={send} disabled={!connected} />
      </div>
   );
}

export default App;
