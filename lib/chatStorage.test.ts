import { describe, it, expect, beforeEach } from 'vitest';
import {
  getMatchMessages,
  addMatchMessage,
  purgeMatchChat,
  recordViewerPresence,
  getViewerCount,
  isMatchFinished,
} from './chatStorage';

describe('Live Match Chat Storage & FT Rules', () => {
  const matchId1 = 'arsenal-vs-chelsea-123';
  const matchId2 = 'real-madrid-vs-barca-456';

  beforeEach(() => {
    purgeMatchChat(matchId1);
    purgeMatchChat(matchId2);
  });

  it('should identify when a match is finished (FT)', () => {
    expect(isMatchFinished('finished')).toBe(true);
    expect(isMatchFinished('FT')).toBe(true);
    expect(isMatchFinished('live', 'FT')).toBe(true);
    expect(isMatchFinished('live', 'Final')).toBe(true);
    expect(isMatchFinished('live', 'Full Time')).toBe(true);
    expect(isMatchFinished('live', '65\'')).toBe(false);
    expect(isMatchFinished('upcoming')).toBe(false);
  });

  it('should store and retrieve messages for a match room', () => {
    const msg = addMatchMessage(matchId1, {
      userId: 'user_1',
      username: 'GoonerFan',
      text: 'What a strike from Saka! 🔥',
      team: 'home',
    });

    expect(msg.id).toBeDefined();
    expect(msg.text).toBe('What a strike from Saka! 🔥');

    const messages = getMatchMessages(matchId1);
    expect(messages.length).toBe(1);
    expect(messages[0].username).toBe('GoonerFan');
  });

  it('should isolate chat messages by match ID', () => {
    addMatchMessage(matchId1, {
      userId: 'u1',
      username: 'Fan1',
      text: 'Arsenal vs Chelsea message',
    });

    addMatchMessage(matchId2, {
      userId: 'u2',
      username: 'Fan2',
      text: 'El Clasico message',
    });

    const m1Messages = getMatchMessages(matchId1);
    const m2Messages = getMatchMessages(matchId2);

    expect(m1Messages.length).toBe(1);
    expect(m1Messages[0].text).toContain('Arsenal');

    expect(m2Messages.length).toBe(1);
    expect(m2Messages[0].text).toContain('El Clasico');
  });

  it('should purge and delete all messages when match reaches FT', () => {
    addMatchMessage(matchId1, {
      userId: 'u1',
      username: 'Fan1',
      text: 'Final whistle about to blow!',
    });

    expect(getMatchMessages(matchId1).length).toBe(1);

    // Match reaches FT -> purge
    purgeMatchChat(matchId1);

    expect(getMatchMessages(matchId1)).toEqual([]);
  });

  it('should track viewer presence in match room', () => {
    const count1 = recordViewerPresence(matchId1, 'viewer_a');
    expect(count1).toBe(1);

    const count2 = recordViewerPresence(matchId1, 'viewer_b');
    expect(count2).toBe(2);

    expect(getViewerCount(matchId1)).toBe(2);
  });

  it('should reject invalid or oversized messages', () => {
    expect(() => {
      addMatchMessage(matchId1, {
        userId: 'u1',
        username: 'Fan',
        text: '   ',
      });
    }).toThrow('Message cannot be empty');

    expect(() => {
      addMatchMessage(matchId1, {
        userId: 'u1',
        username: 'Fan',
        text: 'a'.repeat(300),
      });
    }).toThrow('Message exceeds 280 character limit');
  });
});
