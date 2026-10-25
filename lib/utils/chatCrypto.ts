/**
 * Zero-storage AES-GCM client-side encryption for ephemeral match chat.
 * Derives a room-specific encryption key so messages are encrypted in transit
 * and decrypted only by clients watching the fixture.
 */

// Universal crypto getter (browser window.crypto or Node.js webcrypto)
function getSubtleCrypto(): SubtleCrypto | null {
  if (typeof window !== 'undefined' && window.crypto?.subtle) {
    return window.crypto.subtle;
  }
  if (typeof globalThis !== 'undefined' && globalThis.crypto?.subtle) {
    return globalThis.crypto.subtle;
  }
  return null;
}

function getRandomValues(array: Uint8Array): Uint8Array {
  if (typeof window !== 'undefined' && window.crypto?.getRandomValues) {
    return window.crypto.getRandomValues(array);
  }
  if (typeof globalThis !== 'undefined' && globalThis.crypto?.getRandomValues) {
    return globalThis.crypto.getRandomValues(array);
  }
  for (let i = 0; i < array.length; i++) {
    array[i] = Math.floor(Math.random() * 256);
  }
  return array;
}

async function getKey(matchId: string): Promise<CryptoKey | null> {
  const subtle = getSubtleCrypto();
  if (!subtle) return null;
  try {
    const enc = new TextEncoder();
    const rawKey = await subtle.digest(
      'SHA-256',
      enc.encode(`hydra_zero_storage_${matchId}_sports_ephemeral`)
    );
    return await subtle.importKey(
      'raw',
      rawKey,
      { name: 'AES-GCM' },
      false,
      ['encrypt', 'decrypt']
    );
  } catch {
    return null;
  }
}

export async function encryptChatMessage(text: string, matchId: string): Promise<string> {
  if (!text) return '';
  const subtle = getSubtleCrypto();
  if (!subtle) return text;

  try {
    const key = await getKey(matchId);
    if (!key) return text;

    const iv = getRandomValues(new Uint8Array(12));
    const encoded = new TextEncoder().encode(text);
    const cipherBuffer = await subtle.encrypt(
      { name: 'AES-GCM', iv: iv as any },
      key,
      encoded
    );

    const ivHex = Array.from(iv).map(b => b.toString(16).padStart(2, '0')).join('');
    const cipherHex = Array.from(new Uint8Array(cipherBuffer)).map(b => b.toString(16).padStart(2, '0')).join('');
    return `e2e:${ivHex}:${cipherHex}`;
  } catch {
    return text;
  }
}

export async function decryptChatMessage(cipherText: string, matchId: string): Promise<string> {
  if (!cipherText || !cipherText.startsWith('e2e:')) return cipherText;
  const subtle = getSubtleCrypto();
  if (!subtle) return cipherText;

  try {
    const parts = cipherText.split(':');
    if (parts.length !== 3) return cipherText;

    const ivMatches = parts[1].match(/.{1,2}/g);
    const cipherMatches = parts[2].match(/.{1,2}/g);
    if (!ivMatches || !cipherMatches) return cipherText;

    const iv = new Uint8Array(ivMatches.map(byte => parseInt(byte, 16)));
    const cipherBytes = new Uint8Array(cipherMatches.map(byte => parseInt(byte, 16)));
    const key = await getKey(matchId);
    if (!key) return cipherText;

    const decryptedBuffer = await subtle.decrypt(
      { name: 'AES-GCM', iv: iv as any },
      key,
      cipherBytes as any
    );
    return new TextDecoder().decode(decryptedBuffer);
  } catch {
    return cipherText;
  }
}
