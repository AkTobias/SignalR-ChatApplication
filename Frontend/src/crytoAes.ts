
let cachedKey : CryptoKey | null = null;


export async function initAesKeyFromBase64(b64: string): Promise<void>{
    const raw = Uint8Array.from(atob(b64), c => c.charCodeAt(0));
    if(![16, 24, 32].includes(raw.length))
    {
        throw new Error(`Invalid AES key lenght: ${raw.length} bytes`);
    }
    cachedKey = await crypto.subtle.importKey(
        "raw",
        raw,
        {name: "AES-GCM"},
        false,
        ["decrypt"]
    );
}

export async function decryptAesGcmFromBase64(ivB64: string, payloadB64: string): Promise<string>{
    if(!cachedKey) throw new Error("Aes key is not initialized, call initAesKeyFromBase64 first");
    const iv = Uint8Array.from(atob(ivB64), c => c.charCodeAt(0));
    const paylaod = Uint8Array.from(atob(payloadB64), c => c.charCodeAt(0));

    const ptBuf = await crypto.subtle.decrypt({name: "AES-GCM", iv}, cachedKey, paylaod);
    return new TextDecoder().decode(new Uint8Array(ptBuf));
}