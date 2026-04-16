/**
 * Text-to-Speech utility for EduNexus (FR20).
 *
 * Uses the browser's built-in SpeechSynthesis API to read lesson content aloud.
 * Falls back gracefully if the API is unavailable.
 */

/**
 * Check if the browser supports the SpeechSynthesis API.
 */
export function isTTSSupported() {
  return typeof window !== "undefined" && "speechSynthesis" in window;
}

/**
 * Strip markdown formatting from text to produce clean speech.
 */
function stripMarkdown(text) {
  return text
    .replace(/#{1,6}\s+/g, "") // headings
    .replace(/\*\*(.+?)\*\*/g, "$1") // bold
    .replace(/\*(.+?)\*/g, "$1") // italic
    .replace(/`(.+?)`/g, "$1") // inline code
    .replace(/```[\s\S]*?```/g, "") // code blocks
    .replace(/\[(.+?)\]\(.+?\)/g, "$1") // links
    .replace(/!\[.*?\]\(.+?\)/g, "") // images
    .replace(/>\s+/g, "") // blockquotes
    .replace(/[-*+]\s+/g, "") // list markers
    .replace(/\d+\.\s+/g, "") // numbered lists
    .replace(/---+/g, "") // horizontal rules
    .replace(/\n{2,}/g, ". ") // paragraph breaks → pauses
    .replace(/\n/g, " ")
    .trim();
}

/**
 * Speak text using SpeechSynthesis.
 * Returns the SpeechSynthesisUtterance for cancellation.
 */
export function speak(text, { lang = "en-GB", rate = 1.0 } = {}) {
  if (!isTTSSupported()) return null;

  window.speechSynthesis.cancel(); // stop any ongoing speech

  const clean = stripMarkdown(text);
  if (!clean) return null;

  const utterance = new SpeechSynthesisUtterance(clean);
  utterance.lang = lang;
  utterance.rate = rate;
  window.speechSynthesis.speak(utterance);
  return utterance;
}

/**
 * Stop any ongoing speech.
 */
export function stopSpeaking() {
  if (!isTTSSupported()) return;
  window.speechSynthesis.cancel();
}

/**
 * Check if speech is currently in progress.
 */
export function isSpeaking() {
  if (!isTTSSupported()) return false;
  return window.speechSynthesis.speaking;
}
