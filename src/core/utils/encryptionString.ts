import * as crypto from 'crypto';

const algorithm = 'aes-256-cbc';
const iv = crypto.randomBytes(16);

export function encrypt(text: string): string {
    try {
        const secretKey = process.env.SECRET_KEY;
        if (!secretKey) throw new Error('SECRET_KEY is undefined');

        const key = Buffer.from(secretKey, 'hex');
        if (key.length !== 32) {
            throw new Error(`SECRET_KEY must be 32 bytes (hex). Currently: ${key.length} bytes`);
        }

        const cipher = crypto.createCipheriv(algorithm, key, iv);

        let encrypted = cipher.update(text, 'utf8', 'hex');
        encrypted += cipher.final('hex');

        const result = iv.toString('hex') + ':' + encrypted;

        return result;
    } catch (error) {
        console.error("Encryption failed:", error);
        throw error;
    }
}

export function decrypt(encryptedText: string): string {
    try {
        const secretKey = process.env.SECRET_KEY;
        if (!secretKey) throw new Error('SECRET_KEY is undefined');

        const [ivHex, encrypted] = encryptedText.split(':');
        const ivBuffer = Buffer.from(ivHex, 'hex');
        const decipher = crypto.createDecipheriv(algorithm, process.env.SECRET_KEY!, ivBuffer);
        let decrypted = decipher.update(encrypted, 'hex', 'utf8');
        decrypted += decipher.final('utf8');
        return decrypted;
    } catch (error) {
        console.error("Decryption failed:", error);
        throw error;
    }
}