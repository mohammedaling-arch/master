const crypto = require('crypto');

function generateToken04(appId, userId, secret, effectiveTimeInSeconds, payload) {
    if (!appId || !userId || !secret) {
        throw new Error('invalid param');
    }

    const createTime = Math.floor(Date.now() / 1000);
    const tokenInfo = {
        app_id: appId,
        user_id: userId,
        ctl_type: 1,
        nonce: Math.floor(Math.random() * 2147483647),
        ctime: createTime,
        expire: createTime + effectiveTimeInSeconds,
        payload: payload || ''
    };

    const plainText = JSON.stringify(tokenInfo);

    // IV: 16 random bytes
    const iv = crypto.randomBytes(16);

    // Key: 32 byte string usually implies AES-256? Or 16 byte?
    // Zego docs say "Server Secret" is 32 chars.
    // If it is 32 chars, we treat it as the key.
    // Length 32 => AES-256-CBC
    // Length 16 => AES-128-CBC
    // If length is anything else, we might need to adjust or error.
    let key = Buffer.from(secret);
    let algorithm = 'aes-128-cbc';

    if (key.length === 32) {
        algorithm = 'aes-256-cbc';
    } else if (key.length !== 16) {
        // Fallback: If secret is hex, convert to bytes?
        // But for safety, if 32 chars and not hex, assume aes-256.
        // If the user pasted a 32-char string, it's 32 bytes (ascii/utf8).
        if (key.length !== 16 && key.length !== 24 && key.length !== 32) {
            console.warn(`[Zego] Warning: Secret length is ${key.length}. Encrypting might fail.`);
        }
    }

    const cipher = crypto.createCipheriv(algorithm, key, iv);
    let encrypted = cipher.update(plainText, 'utf8');
    encrypted = Buffer.concat([encrypted, cipher.final()]);

    // Format:
    // 8 bytes: expire (BigInt64BE)
    // 2 bytes: iv length (UInt16BE)
    // iv
    // 2 bytes: content length (UInt16BE)
    // content

    const b1 = Buffer.alloc(8);
    b1.writeBigInt64BE(BigInt(tokenInfo.expire), 0);

    const b2 = Buffer.alloc(2);
    b2.writeUInt16BE(iv.length, 0);

    const b3 = Buffer.alloc(2);
    b3.writeUInt16BE(encrypted.length, 0);

    const binData = Buffer.concat([b1, b2, iv, b3, encrypted]);

    return '04' + binData.toString('base64');
}

module.exports = { generateToken04 };
