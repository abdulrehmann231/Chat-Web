const crypto = require('crypto');

const ENCRYPTION_KEY = process.env.ENCRYPTION_KEY || crypto.randomBytes(32); // 256 bit key
const ALGORITHM = 'aes-256-cbc';

const encrypt = (text) => {
  const iv = crypto.randomBytes(16); // Initialization vector
  const cipher = crypto.createCipheriv(ALGORITHM, Buffer.from(ENCRYPTION_KEY), iv);
  let encrypted = cipher.update(text);
  encrypted = Buffer.concat([encrypted, cipher.final()]);
  return {
    iv: iv.toString('hex'),
    encryptedContent: encrypted.toString('hex')
  };
};

const decrypt = (encryptedContent, iv) => {
  const decipher = crypto.createDecipheriv(
    ALGORITHM, 
    Buffer.from(ENCRYPTION_KEY),
    Buffer.from(iv, 'hex')
  );
  let decrypted = decipher.update(Buffer.from(encryptedContent, 'hex'));
  decrypted = Buffer.concat([decrypted, decipher.final()]);
  return decrypted.toString();
};

module.exports = {
  encrypt,
  decrypt
}; 