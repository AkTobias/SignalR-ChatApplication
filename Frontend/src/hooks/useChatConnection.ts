import { useCallback, useEffect, useRef, useState } from "react";
//import { ChatMessage } from "../types/chatMessageType";
import type {Message} from "../types/chatMessageType";
import type { ConnectionStatus } from "../types/connectionStatusType";
import { decryptAesGcmFromBase64, encryptAesGcm, initAesKeyFromBase64 } from "../crytoAes";
import { ensureHubStarted, hub } from "../signalR";
import * as signalR from "@microsoft/signalr";


interface UseChatConnectionOptions {
    aesKeyB64 : string
};


export function useChatConnection({aesKeyB64} : UseChatConnectionOptions) {
    const [status, setStatus] = useState<ConnectionStatus>("connecting");
    const [registeredAs, setRegisteredAs] = useState<string | null>();
    const [log, setLog] = useState<Message[]>([]);

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

        //Activate handlers
        hub.on("Connected", onConnected);
        hub.on("Register", onRegister);
        hub.on("UserJoined", onJoined);
        hub.on("userLeft", onLeft);
        hub.on("MessageReceived", onMessage);

        hub.onreconnecting(() => setStatus("connecting"));
        hub.onreconnected(() => setStatus("connected"));
        hub.onclose(() => setStatus("disconnected"));


        //Start connection + re-init AES key
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

        return () => {
            mounted.current = false;
           hub.off("Connected", onConnected);
            hub.off("Register", onRegister);
            hub.off("UserJoined", onJoined);
            hub.off("UserLeft", onLeft);
            hub.off("MessageReceived", onMessage);
        };
    }, [aesKeyB64, appendMessage, appendSystem]);

    //expose action that mirror original funcs
    const register = useCallback(async (name: string) => {
        const n = name.trim();
        if(!n) throw new Error("Enter a username first");
        await hub.invoke("Register", n);
    }, [])

    const send = useCallback(async (text: string) => {
        const t = text.trim();
        if(!t) return;
        if(!registeredAs){
            alert("you have to login to send a message");
            return;
        }
        const {ivB64, payloadB64} = await encryptAesGcm(t);
        await hub.invoke("SendMessageEncrypted", ivB64, payloadB64);
    }, [registeredAs]);


    //double check.
    return {
        status,
        connected: status === "connected",
        registeredAs,
        log,
        register,
        send,
    } as const
}