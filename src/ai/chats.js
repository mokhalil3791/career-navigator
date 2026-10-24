// @ts-check
/** Workspace handoffs use homepages only. This module never accepts prompt text. */
export const CHATS = [
  { id: 'chatgpt', label: 'ChatGPT', url: 'https://chatgpt.com/' },
  { id: 'gemini', label: 'Gemini', url: 'https://gemini.google.com/' },
  { id: 'claude', label: 'Claude', url: 'https://claude.ai/' },
  { id: 'copilot', label: 'Microsoft Copilot', url: 'https://copilot.microsoft.com/' },
  { id: 'lechat', label: 'Le Chat', url: 'https://chat.mistral.ai/' },
  { id: 'other', label: 'Another one', url: '' },
];

/** A custom chat is a homepage, never a query, path or credential-bearing URL.
 * @param {string} value
 */
export function chatHomepage(value) {
  try { const url = new URL(value); return url.protocol === 'https:' && !url.username && !url.password ? url.origin + '/' : ''; }
  catch { return ''; }
}

/** @param {{ aiChat?: string, aiChatUrl?: string }} settings */
export function chosenChat(settings) {
  const chat = CHATS.find(c => c.id === settings.aiChat) || CHATS[0];
  return { ...chat, url: chat.id === 'other' ? chatHomepage(settings.aiChatUrl || '') : chat.url };
}
