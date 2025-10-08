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
   const { status, connected, log, register, send } = useChatConnection({
      aesKeyB64: "97ZBxEEvCz4ernqTAAmXAgtbERQu8N7RU+08XvR4Xe0=",
   });
   return (
      <div className="chat-container">
         <div className="chat-header">
            {" "}
            <h1>SignalR chat</h1>
            <StatusBar status={status} />
         </div>

         <div className="chat-row">
            <RegisterForm onRegister={register} connected={connected} />
         </div>

         <MessageList log={log} />
         <ChatInputRow onSend={send} disabled={!connected} />
      </div>
   );
}

export default App;
