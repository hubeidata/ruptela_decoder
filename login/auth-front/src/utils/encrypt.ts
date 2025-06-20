const IV_LENGTH = 16; // AES block size

// Deriva una clave de 32 bytes desde la cadena de entorno
async function getKey(secret: string): Promise<CryptoKey> {
  const encoder = new TextEncoder();
  const keyMaterial = await window.crypto.subtle.digest('SHA-256', encoder.encode(secret));
  return await window.crypto.subtle.importKey(
    'raw',
    keyMaterial,
    { name: 'AES-CBC' },
    false,
    ['encrypt', 'decrypt']
  );
}

// Función para cifrar (compatible con el backend)
export async function encrypt(text: string): Promise<string> {
  const secret = import.meta.env.VITE_ENCRPT_KEY;
  if (!secret) {
    throw new Error('VITE_ENCRPT_KEY no está definida');
  }

  const encoder = new TextEncoder();
  const iv = window.crypto.getRandomValues(new Uint8Array(IV_LENGTH));
  const key = await getKey(secret);
  
  const encodedText = encoder.encode(text);
  const encrypted = await window.crypto.subtle.encrypt(
    { name: 'AES-CBC', iv },
    key,
    encodedText
  );

  // Convertir a hex para compatibilidad con el backend
  const encryptedArray = new Uint8Array(encrypted);
  const ivHex = Array.from(iv).map(b => b.toString(16).padStart(2, '0')).join('');
  const encryptedHex = Array.from(encryptedArray).map(b => b.toString(16).padStart(2, '0')).join('');
  
  return `${ivHex}:${encryptedHex}`;
}

// Función para descifrar (compatible con el backend)
export async function decrypt(text: string): Promise<string> {
  const secret = import.meta.env.VITE_ENCRPT_KEY;
  if (!secret) {
    throw new Error('VITE_ENCRPT_KEY no está definida');
  }

  const [ivHex, encryptedHex] = text.split(':');
  if (!ivHex || !encryptedHex) {
    throw new Error('Texto cifrado mal formado');
  }

  // Convertir hex a bytes
  const iv = new Uint8Array(ivHex.match(/.{2}/g)!.map(byte => parseInt(byte, 16)));
  const encryptedData = new Uint8Array(encryptedHex.match(/.{2}/g)!.map(byte => parseInt(byte, 16)));

  const key = await getKey(secret);
  
  const decrypted = await window.crypto.subtle.decrypt(
    { name: 'AES-CBC', iv },
    key,
    encryptedData
  );

  const decoder = new TextDecoder();
  return decoder.decode(decrypted);
}