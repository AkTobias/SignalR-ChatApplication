import { useCallback, useEffect, useRef, useState } from "react";
import type {Message} from "../types/chatMessageType";
import type { ConnectionStatus } from "../types/connectionStatusType";
import { decryptAesGcmFromBase64, encryptAesGcm, initAesKeyFromBase64 } from "../cryptoAesGcm";
import { ensureHubstarted, hub } from "../signalR";
import * as signalR from "@microsoft/signalr";

interface UseChatConnectionOptions {
    aesKeyB64 : string
};

const USERNAME_REGEX = /^[\p{L}\p{N} _\.\-]{2,20}$/u;

/**
 * Custom React Hook to manage encrypted SignalR chat.
 * Handels:
 *  - Connection lifecycle.
 *  - User Registration.
 *  - Encrypted messages.
 *  - System and user messages.
 */

export function useChatConnection({aesKeyB64} : UseChatConnectionOptions) {
    //Connection lifecyle status for UI.
    const [status, setStatus] = useState<ConnectionStatus>("connecting");
    //The username assigned by the server after registration.
    const [registeredAs, setRegisteredAs] = useState<string | null>(null);

    //Chat log: system messages and user messages.
    const [chatLog, setChatLog] = useState<Message[]>([]);

    //Guard setState after unmount
    const mounted = useRef(true);

    const appendMessage = useCallback((m: Message) => {
        setChatLog((prev) => [...prev, m]);
    }, []);

    const appendSystem = useCallback(
        (text: string) => 
            appendMessage({kind: "system", message: text, timestamp: new Date().toISOString() }),
        [appendMessage]
    );
    
    //SignalR setup and system lifecycle
    useEffect(() => {
        mounted.current = true;
    /**
    * Handlers for
    *   - On successful SignalR connection
    *   - After user registration
    *   - another user joins
    *   - another user left
    *   - encrypted message received
    *  
    */
        const onConnected = async () => {
            setStatus("connected");
            try{
                await initAesKeyFromBase64(aesKeyB64);
            } catch (e: any ) {
                appendSystem(` Failed to init ase key: ${e.message ?? e}`);
            }
        }

        const onRegister = (safeName: string) => {
            setRegisteredAs(safeName);
            appendSystem(` Logged in as ${safeName}`);
        }

        const onJoined = (safeName: string) => {
            appendSystem(` ${safeName} has joined the chat.`);
        }
        const onLeft = (safeName: string) => {
            appendSystem(` ${safeName} has left the chat.`)
        }
        
        const onMessage = async (
            user: string,
            ivB64: string,
            payloadB64: string,
            at: string | number | Date
        ) => {
            try {
                const plaintext = await decryptAesGcmFromBase64(ivB64, payloadB64);
                const timestamp = typeof at === "string" || typeof at === "number" ? new Date(at).toISOString() : at.toISOString();
                appendMessage({kind: "chat", user, message: plaintext, timestamp})
            } catch (e: any)
            {
                appendSystem(`Decrypt failed: ${e?.message ?? e}`);
            }
        };
        
        //Attach event all listners to to its counterpart in the SignalR chathub 
        
        hub.on("Connected", onConnected);
        hub.on("Register", onRegister);
        hub.on("UserJoined", onJoined);
        hub.on("UserLeft", onLeft);
        hub.on("MessageReceived", onMessage);

        //SignalR connection state changes
        hub.onreconnecting(() => setStatus("connecting"));
        hub.onreconnected(() => setStatus("connected"));
        hub.onclose(() => setStatus("disconnected"));


        //Start connection and initialize encryption
        (async () => {
            setStatus("connecting");
            try{
                await initAesKeyFromBase64(aesKeyB64);
                await ensureHubstarted();
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

        // Cleanup on unmount: remove listners and stop state updates
        return () => {
            mounted.current = false;
            hub.off("Connected", onConnected);
            hub.off("Register", onRegister);
            hub.off("UserJoined", onJoined);
            hub.off("UserLeft", onLeft);
            hub.off("MessageReceived", onMessage);
        };
    }, [aesKeyB64, appendMessage, appendSystem]);
    
    /**
     * Register a username with the hub server.
     * Validation for the username.
     */
    const register = useCallback(async (name: string) => {
        const n = name.trim();
        if(!n){
            appendSystem(" Enter a username first");
            return;
        };
        if(!USERNAME_REGEX.test(n)){
            appendSystem(" Username must be between 2 and 20 chars and only use letters, numbers, _ , . , _ or -");
            return;
        
        }
        try{
            await hub.invoke("Register", n);
            } catch (e: any){
                const msg = e?.message ?? " Registration  failed";
                throw new Error(msg);
            }

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
            appendSystem(" You have to login to send a message");
            return;
        }
        const {ivB64, payloadB64} = await encryptAesGcm(t);
        await hub.invoke("SendMessageEncrypted", ivB64, payloadB64);
    }, [registeredAs]);


    // Public API of the hook for componets to consume
    return {
        status,
        connected: status === "connected",
        registeredAs,
        chatLog,
        register,
        send,
    } as const
}