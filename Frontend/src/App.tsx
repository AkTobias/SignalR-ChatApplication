import "./App.css";
import { useChatConnection } from "./hooks/useChatConnection";
import StatusBar from "./components/StatusBar";
import MessageList from "./components/MessageList";
import RegisterForm from "./components/registerForm";
import ChatInputRow from "./components/chatInputRow";

function App() {
   const { status, connected, chatLog, register, send, logout } =
      useChatConnection({
         aesKeyB64: "97ZBxEEvCz4ernqTAAmXAgtbERQu8N7RU+08XvR4Xe0=",
      });
   return (
      <div className="chat-container">
         <div className="chat-header">
            {" "}
            <h1>SignalR Chat</h1>
            <StatusBar status={status} />
         </div>

         <div className="chat-row">
            <RegisterForm
               onRegister={register}
               connected={connected}
               onLogout={logout}
            />
         </div>

         <MessageList log={chatLog} />
         <ChatInputRow onSend={send} disabled={!connected} />
      </div>
   );
}

export default App;
