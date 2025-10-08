import { useCallback, useEffect, useRef, useState } from "react";
//import { ChatMessage } from "../types/chatMessageType";
import type {Message} from "../types/chatMessageType";
import type { ConnectionStatus } from "../types/connectionStatusType";
import { decryptAesGcmFromBase64, encryptAesGcm, initAesKeyFromBase64 } from "../cryptoAesGcm";
import { ensureHubStarted, hub } from "../signalR";
import * as signalR from "@microsoft/signalr";

//test


interface UseChatConnectionOptions {
    aesKeyB64 : string
};

/**
 * A Custom made react hook that:
 * 1. Establishes a SignlarR connection
 * 2. Register event handlers (connected, users, join/leave, ecrypted message)
 * 3. Manages local UI state (system status, checks who you're registered and chat-log )
 * 4. Encrypts outgoing messages / decrypts incoming messages via AES-GCM
 */


export function useChatConnection({aesKeyB64} : UseChatConnectionOptions) {
    //Connection lifecyle status for UI
    const [status, setStatus] = useState<ConnectionStatus>("connecting");
    //Username the server accepted for this client
    const [registeredAs, setRegisteredAs] = useState<string | null>();
    //append only chat log (system and chat message)
    const [log, setLog] = useState<Message[]>([]);

    //Guard setState after unmount
    const mounted = useRef(true);

    const appendMessage = useCallback((m: Message) => {
        setLog((prev) => [...prev, m]);
    }, []);

    const appendSystem = useCallback(
        (text: string) => 
            appendMessage({kind: "system", message: text, ts: new Date().toISOString() }),
        [appendMessage]
    );

    useEffect(() => {
        mounted.current = true;

        const onConnected = async () => {
            setStatus("connected");
            try{
                await initAesKeyFromBase64(aesKeyB64);
            } catch (e: any ) {
                appendSystem(`Failed to init ase key: ${e.message ?? e}`);
            }
        }

        const onRegister = (safeName: string) => {
            setRegisteredAs(safeName);
            appendSystem(`Logged in as ${safeName}`);
        }

        const onJoined = (safeName: string) => {
            appendSystem(`${safeName} has joined the chat.`);
        }
        const onLeft = (safeName: string) => {
            appendSystem(`${safeName} has left the chat.`)
        }
        
        const onMessage = async (
            user: string,
            ivB64: string,
            payloadB64: string,
            at: string | number | Date
        ) => {
            try {
                const plaintext = await decryptAesGcmFromBase64(ivB64, payloadB64);
                const ts = typeof at === "string" || typeof at === "number" ? new Date(at).toISOString() : at.toISOString();
                appendMessage({kind: "chat", user, message: plaintext, ts})
            } catch (e: any)
            {
                appendSystem(`Decrypt failed: ${e?.message ?? e}`);
            }
        };

        //Wire up hub event handlers
        hub.on("Connected", onConnected);
        hub.on("Register", onRegister);
        hub.on("UserJoined", onJoined);
        hub.on("UserLeft", onLeft);
        hub.on("MessageReceived", onMessage);

        //SignalR connection state changes
        hub.onreconnecting(() => setStatus("connecting"));
        hub.onreconnected(() => setStatus("connected"));
        hub.onclose(() => setStatus("disconnected"));


        //Start connection + re-init AES key before the message is sent
        (async () => {
            setStatus("connecting");
            try{
                await initAesKeyFromBase64(aesKeyB64);
                await ensureHubStarted();
                if(mounted.current && hub.state === signalR.HubConnectionState.Connected) {
                    setStatus("connected")
                }
            } catch (e: any){
                if(mounted.current){
                    appendSystem(e?.message ?? "Failed to connect");
                    setStatus("disconnected");
                }
            }
        })();
        // Cleanup: remove listners to prevent dupes and avoid setState after unmount
        return () => {
            mounted.current = false;
           hub.off("Connected", onConnected);
            hub.off("Register", onRegister);
            hub.off("UserJoined", onJoined);
            hub.off("UserLeft", onLeft);
            hub.off("MessageReceived", onMessage);
        };
    }, [aesKeyB64, appendMessage, appendSystem]);

    //Registers the current client with a username.
    const register = useCallback(async (name: string) => {
        const n = name.trim();
        if(!n) throw new Error("Enter a username first");
        await hub.invoke("Register", n);
    }, [])

    /**
     * Sends a chat message:
     * - Before sending a message checks that you are registerd
     * - Encrypts text with AES-GCM and sends IV + payload to the server.
     */
    const send = useCallback(async (text: string) => {
        const t = text.trim();
        if(!t) return;
        if(!registeredAs){
            alert("you have to login to send a message");
            return;
        }
        //encrypts the message before its sent to the server
        const {ivB64, payloadB64} = await encryptAesGcm(t);
        await hub.invoke("SendMessageEncrypted", ivB64, payloadB64);
    }, [registeredAs]);


    // Public API of the hook for componets to consume
    return {
        status,
        connected: status === "connected",
        registeredAs,
        log,
        register,
        send,
    } as const
}