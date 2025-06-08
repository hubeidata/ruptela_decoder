import dotenv from 'dotenv';
import crypto from 'crypto';

dotenv.config();
const SECRET = process.env.ENCRPT_KEY;
const IV_LENGTH = 16;  // AES block size

// Deriva una clave de 32 bytes desde la cadena de entorno
function getKey() {
  return crypto.createHash('sha256').update(SECRET, 'utf8').digest();
}

// Función para cifrar
export function encrypt(text) {
  const iv = crypto.randomBytes(IV_LENGTH);
  const key = getKey();
  const cipher = crypto.createCipheriv('aes-256-cbc', key, iv);
  let encrypted = cipher.update(text, 'utf8', 'hex');
  encrypted += cipher.final('hex');
  return `${iv.toString('hex')}:${encrypted}`;
}

// Función para descifrar
export function decrypt(text) {
  const [ivHex, encryptedText] = text.split(':');
  if (!ivHex || !encryptedText) {
    throw new Error('Texto cifrado mal formado');
  }

  const iv = Buffer.from(ivHex, 'hex');
  const key = getKey();
  const decipher = crypto.createDecipheriv('aes-256-cbc', key, iv);
  let decrypted = decipher.update(encryptedText, 'hex', 'utf8');
  decrypted += decipher.final('utf8');
  return decrypted;
}
