import { describe, it, expect } from 'vitest';
import { encryptChatMessage, decryptChatMessage } from './chatCrypto';

describe('Zero-Storage Chat Encryption (AES-GCM)', () => {
  const matchId = 'arsenal-vs-liverpool-2026';

  it('should encrypt and decrypt a message for the same match', async () => {
    const originalText = 'What a screamer from Saka! 🔥 1-0';
    const encrypted = await encryptChatMessage(originalText, matchId);

    expect(encrypted).not.toBe(originalText);
    expect(encrypted.startsWith('e2e:')).toBe(true);

    const decrypted = await decryptChatMessage(encrypted, matchId);
    expect(decrypted).toBe(originalText);
  });

  it('should fail to decrypt or yield wrong output if matchId does not match', async () => {
    const originalText = 'Tactical masterclass';
    const encrypted = await encryptChatMessage(originalText, matchId);

    // Attempt decrypting with a different match room key
    const attempt = await decryptChatMessage(encrypted, 'other-match-999');
    expect(attempt).not.toBe(originalText);
  });

  it('should return plain text as-is if not an e2e encrypted string', async () => {
    const plain = 'Regular unencrypted message';
    const result = await decryptChatMessage(plain, matchId);
    expect(result).toBe(plain);
  });
});
