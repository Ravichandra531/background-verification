import crypto from 'crypto';
const ALG = 'aes-256-gcm';
if (!process.env.ENCRYPTION_KEY) {
    throw new Error('ENCRYPTION_KEY must be defined in the environment variables');
}
const KEY_ENV = process.env.ENCRYPTION_KEY;
const getKey = () => {
    const key = Buffer.from(KEY_ENV.slice(0, 64), 'hex');
    if (key.length !== 32) {
        throw new Error('Key must be 32 bytes');
    }
    return key;
};
export const encrypt = (text) => {
    try {
        const iv = crypto.randomBytes(16);
        const cipher = crypto.createCipheriv(ALG, getKey(), iv);
        let enc = cipher.update(text, 'utf8', 'hex');
        enc += cipher.final('hex');
        const tag = cipher.getAuthTag();
        return `${iv.toString('hex')}:${tag.toString('hex')}:${enc}`;
    }
    catch (err) {
        console.error('Encryption error:', err instanceof Error ? err.message : err);
        throw new Error('Failed to encrypt');
    }
};
export const decrypt = (text) => {
    if (!text)
        return null;
    try {
        const parts = text.split(':');
        if (parts.length !== 3) {
            throw new Error('Invalid format');
        }
        const iv = Buffer.from(parts[0], 'hex');
        const tag = Buffer.from(parts[1], 'hex');
        const enc = parts[2];
        const decipher = crypto.createDecipheriv(ALG, getKey(), iv);
        decipher.setAuthTag(tag);
        let dec = decipher.update(enc, 'hex', 'utf8');
        dec += decipher.final('utf8');
        return dec;
    }
    catch (err) {
        console.error('Decryption error:', err instanceof Error ? err.message : err);
        throw new Error('Failed to decrypt');
    }
};
//# sourceMappingURL=encryption.js.map