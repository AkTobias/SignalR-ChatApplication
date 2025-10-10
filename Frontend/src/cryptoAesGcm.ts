let cachedKey : CryptoKey | null = null;

const IV_SIZE = 12 as const;
const TAG_SIZE = 16 as const;
//

/**
 * b64ToU8 decodes any Base64 into bytes
 * u8ToB64 encodes any byte array into Base64
 */
const b64ToU8 = (b64: string) => Uint8Array.from(atob(b64), c => c.charCodeAt(0));
const u8ToB64 = (u8: Uint8Array) => btoa(String.fromCharCode(...u8));

/**
 * Import and cache a non-extractable AES-GCM key from Base64 (enforces AES-256 = 32 bytes)
 */
export async function initAesKeyFromBase64(b64: string): Promise<void>{

    const raw = b64ToU8(b64);

    if(raw.length !== 32){
        throw new Error(`Invalid AES key lenght: ${raw.length} bytes`);
    }

    cachedKey = await crypto.subtle.importKey(
        "raw",
        raw,
        {name: "AES-GCM"},
        false,
        ["encrypt", "decrypt"]
    );
}
/**
 * Decrypt AES-GCM.
 * @param ivB64 Based64-encoded 12 byte IV/nonce
 * @param payloadB64  Based64-encoded (ciphertext and tag), tag = 16 bytes at the end
 * @returns UTF-8 decoded plaintext string
 */
export async function decryptAesGcmFromBase64(ivB64: string, payloadB64: string): Promise<string>{
    if(!cachedKey) throw new Error("Aes key is not initialized, call initAesKeyFromBase64 first");
    
    // 1) Decode 
    const iv = b64ToU8(ivB64);
    const paylaod = b64ToU8(payloadB64);

    // 2) Validate sizes
    if(iv.length !== IV_SIZE){
        throw new Error(`Invalid IV lenght: ${iv.length}`);
    }
    if(paylaod.length < TAG_SIZE){
        throw new Error(`Invalid payload lenght (must be atleast 16 bytes for the tag).`);
    }

    //
    const ptBuf = await crypto.subtle.decrypt({name: "AES-GCM", iv}, cachedKey, paylaod);
    return new TextDecoder().decode(new Uint8Array(ptBuf));
}
/**
 *  Encrypt AES-GCM.
 *  - Generates a fresh 12 byte IV for each message
 *  - Returns base64 IV and base64 (ciphertext and tag)
 * 
 */
export async function encryptAesGcm(plaintext: string){
    if(!cachedKey) throw new Error("Aes key is not initialized, call initAesKeyFromBase64 first");

    const iv = crypto.getRandomValues(new Uint8Array(IV_SIZE));
    const pt = new TextEncoder().encode(plaintext);

    const ctAndtag = new Uint8Array(await crypto.subtle.encrypt({name: "AES-GCM", iv}, cachedKey, pt));

    return {ivB64: u8ToB64(iv), payloadB64: u8ToB64(ctAndtag)}


}