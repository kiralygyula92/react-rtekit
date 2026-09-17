/**
 * The built-in emoji set.
 *
 * A curated list rather than the full Unicode table: the whole set is ~1,900 entries
 * and several hundred kilobytes, which no editor should pay for by default. These are
 * the ones people actually reach for in a message, and `emojis` replaces the list
 * entirely for anyone who wants more.
 *
 * Characters only — never images — so an emoji survives copy, plain-text export and
 * every e-mail client.
 *
 * @module
 */

/** One entry in the emoji picker. */
export interface EmojiEntry {
  /** The character itself, which is what gets inserted. */
  char: string;
  /** Shortcode without colons, e.g. `thumbsup`. */
  name: string;
  /** Extra search words. */
  keywords: string[];
  group: string;
}

export const DEFAULT_EMOJI: EmojiEntry[] = [
  { char: '😀', name: 'grinning', keywords: ['smile', 'happy'], group: 'Smileys' },
  { char: '😃', name: 'smiley', keywords: ['happy', 'joy'], group: 'Smileys' },
  { char: '😄', name: 'smile', keywords: ['happy', 'laugh'], group: 'Smileys' },
  { char: '😁', name: 'grin', keywords: ['happy'], group: 'Smileys' },
  { char: '😂', name: 'joy', keywords: ['laugh', 'tears'], group: 'Smileys' },
  { char: '🙂', name: 'slightly_smiling_face', keywords: ['smile'], group: 'Smileys' },
  { char: '😉', name: 'wink', keywords: ['flirt'], group: 'Smileys' },
  { char: '😊', name: 'blush', keywords: ['smile', 'happy'], group: 'Smileys' },
  { char: '😍', name: 'heart_eyes', keywords: ['love'], group: 'Smileys' },
  { char: '😘', name: 'kissing_heart', keywords: ['love', 'kiss'], group: 'Smileys' },
  { char: '🤔', name: 'thinking', keywords: ['hmm', 'consider'], group: 'Smileys' },
  { char: '😐', name: 'neutral_face', keywords: ['meh'], group: 'Smileys' },
  { char: '😴', name: 'sleeping', keywords: ['tired', 'zzz'], group: 'Smileys' },
  { char: '😢', name: 'cry', keywords: ['sad', 'tear'], group: 'Smileys' },
  { char: '😭', name: 'sob', keywords: ['sad', 'cry'], group: 'Smileys' },
  { char: '😡', name: 'rage', keywords: ['angry', 'mad'], group: 'Smileys' },
  { char: '😱', name: 'scream', keywords: ['shock', 'fear'], group: 'Smileys' },
  { char: '🤯', name: 'exploding_head', keywords: ['mind', 'blown'], group: 'Smileys' },
  { char: '🥳', name: 'partying_face', keywords: ['party', 'celebrate'], group: 'Smileys' },
  { char: '😎', name: 'sunglasses', keywords: ['cool'], group: 'Smileys' },

  { char: '👍', name: 'thumbsup', keywords: ['yes', 'approve', 'like'], group: 'People' },
  { char: '👎', name: 'thumbsdown', keywords: ['no', 'disapprove'], group: 'People' },
  { char: '👏', name: 'clap', keywords: ['applause', 'praise'], group: 'People' },
  { char: '🙏', name: 'pray', keywords: ['thanks', 'please'], group: 'People' },
  { char: '🤝', name: 'handshake', keywords: ['deal', 'agree'], group: 'People' },
  { char: '👋', name: 'wave', keywords: ['hello', 'goodbye'], group: 'People' },
  { char: '💪', name: 'muscle', keywords: ['strong', 'flex'], group: 'People' },
  { char: '🫶', name: 'heart_hands', keywords: ['love', 'thanks'], group: 'People' },
  { char: '👀', name: 'eyes', keywords: ['look', 'watch'], group: 'People' },

  { char: '❤️', name: 'heart', keywords: ['love', 'red'], group: 'Symbols' },
  { char: '🧡', name: 'orange_heart', keywords: ['love'], group: 'Symbols' },
  { char: '💚', name: 'green_heart', keywords: ['love'], group: 'Symbols' },
  { char: '💙', name: 'blue_heart', keywords: ['love'], group: 'Symbols' },
  { char: '💜', name: 'purple_heart', keywords: ['love'], group: 'Symbols' },
  { char: '✅', name: 'white_check_mark', keywords: ['done', 'yes', 'ok'], group: 'Symbols' },
  { char: '❌', name: 'x', keywords: ['no', 'cancel', 'wrong'], group: 'Symbols' },
  { char: '⚠️', name: 'warning', keywords: ['caution', 'alert'], group: 'Symbols' },
  { char: '❓', name: 'question', keywords: ['help', 'ask'], group: 'Symbols' },
  { char: '❗', name: 'exclamation', keywords: ['important'], group: 'Symbols' },
  { char: '⭐', name: 'star', keywords: ['favourite', 'favorite'], group: 'Symbols' },
  { char: '🔥', name: 'fire', keywords: ['hot', 'lit'], group: 'Symbols' },
  { char: '💯', name: 'hundred', keywords: ['perfect', 'score'], group: 'Symbols' },
  { char: '🎉', name: 'tada', keywords: ['party', 'celebrate', 'launch'], group: 'Symbols' },
  { char: '🚀', name: 'rocket', keywords: ['launch', 'ship', 'fast'], group: 'Symbols' },
  { char: '💡', name: 'bulb', keywords: ['idea', 'light'], group: 'Symbols' },
  { char: '📌', name: 'pushpin', keywords: ['pin', 'important'], group: 'Symbols' },
  { char: '📎', name: 'paperclip', keywords: ['attach', 'file'], group: 'Symbols' },
  { char: '🔗', name: 'link', keywords: ['url', 'chain'], group: 'Symbols' },
  { char: '📅', name: 'calendar', keywords: ['date', 'schedule'], group: 'Symbols' },
  { char: '⏰', name: 'alarm_clock', keywords: ['time', 'reminder'], group: 'Symbols' },
  { char: '💧', name: 'droplet', keywords: ['water', 'drop'], group: 'Symbols' },
  { char: '🧪', name: 'test_tube', keywords: ['science', 'test', 'lab'], group: 'Symbols' },
];

/** Looks up an emoji by shortcode, with or without the colons. */
export function findEmoji(name: string): EmojiEntry | undefined {
  const needle = name.replace(/^:|:$/g, '').toLowerCase();
  return DEFAULT_EMOJI.find((entry) => entry.name === needle);
}
