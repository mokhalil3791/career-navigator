// @ts-check
/** One format for content validation, public copying and app prompts. */
export const PARTS = ['Goal', 'Instruction', 'Context', 'Guardrails', 'Evaluation'];

/** @param {string} body @returns {Record<string, string>} */
export function parsePromptParts(body) {
  const headings = [...body.matchAll(/^## (.+)$/gm)];
  if (headings.length !== 5 || headings.some((h, i) => h[1] !== PARTS[i]) || body.slice(0, headings[0]?.index).trim()) {
    throw new Error('Prompt must contain Goal, Instruction, Context, Guardrails, Evaluation in order');
  }
  return Object.fromEntries(headings.map((h, i) => {
    const value = body.slice((h.index || 0) + h[0].length, headings[i + 1]?.index).trim();
    if (!value) throw new Error('Empty prompt section: ' + h[1]);
    return [h[1], value];
  }));
}

/** @param {Record<string, string>} parts */
export function formatPromptParts(parts) {
  return PARTS.map((part) => part.toUpperCase() + (part === 'Guardrails' && parts[part].startsWith('(keep these for the whole chat)') ? ' ' : '\n') + parts[part]).join('\n\n');
}
