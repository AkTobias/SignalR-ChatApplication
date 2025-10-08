
let cachedKey : CryptoKey | null = null;


// Imports and caches an AES-GCM key from base64-encoded raw bytes
// Accepts lengts 16/24/32 bytes (AES-128/192/256)
export async function initAesKeyFromBase64(b64: string): Promise<void>{
    //Decodes base64 => raw bytes
    const raw = Uint8Array.from(atob(b64), c => c.charCodeAt(0));
    //Validates the lenght to avoid suble errors during import
    if(![16, 24, 32].includes(raw.length))
    {
        throw new Error(`Invalid AES key lenght: ${raw.length} bytes`);
    }
    //imports a non-extractable key for AES_GCM encryption/decrytion
    cachedKey = await crypto.subtle.importKey(
        "raw",
        raw,
        {name: "AES-GCM"},
        false,
        ["encrypt", "decrypt"]
    );
}
/**
 * Decrypts 
 * @param ivB64 Based64-encoded 12 byte IV/nonce
 * @param payloadB64  Based64-encoded ciphteetext and auth tag from crypto.suble.encrypt
 * @returns UTF-8 decoded plaintext string
 */
export async function decryptAesGcmFromBase64(ivB64: string, payloadB64: string): Promise<string>{
    if(!cachedKey) throw new Error("Aes key is not initialized, call initAesKeyFromBase64 first");
    const iv = Uint8Array.from(atob(ivB64), c => c.charCodeAt(0));
    const paylaod = Uint8Array.from(atob(payloadB64), c => c.charCodeAt(0));

    const ptBuf = await crypto.subtle.decrypt({name: "AES-GCM", iv}, cachedKey, paylaod);
    return new TextDecoder().decode(new Uint8Array(ptBuf));
}
/**
 * Encrypts a plain string with AES-GCM
 * Generates a new 12 byte IV for each message
 * Returns base64 IV and base64 (ciphertext and tag)
 * 
 */
export async function encryptAesGcm(plaintext: string){
    const iv = crypto.getRandomValues(new Uint8Array(12));
    const pt = new TextEncoder().encode(plaintext);
    const ctAndtag = new Uint8Array(await crypto.subtle.encrypt({name: "AES-GCM", iv}, cachedKey!, pt));
    const ivB64 = btoa(String.fromCharCode(...iv));
    const payloadB64 = btoa(String.fromCharCode(...ctAndtag));
    return {ivB64, payloadB64};
}