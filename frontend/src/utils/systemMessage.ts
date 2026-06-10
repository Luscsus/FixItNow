import type { TFunction } from 'i18next';

/**
 * Wire shape the backend uses for translatable SYSTEM chat messages: an i18next
 * key plus interpolation params. The content column carries this as a JSON
 * string so older plain-text system rows keep rendering as-is.
 */
type SystemMessageToken = { i18nKey: string; params?: Record<string, unknown> };

function parseToken(content: string): SystemMessageToken | null {
  if (!content || content[0] !== '{') return null;
  try {
    const parsed = JSON.parse(content) as unknown;
    if (
      parsed &&
      typeof parsed === 'object' &&
      typeof (parsed as SystemMessageToken).i18nKey === 'string'
    ) {
      const token = parsed as SystemMessageToken;
      return { i18nKey: token.i18nKey, params: token.params ?? {} };
    }
  } catch {
    // Not a structured token — fall through to the raw-text fallback.
  }
  return null;
}

/**
 * Renders a SYSTEM message's content in the reader's language. Structured tokens
 * are translated via the carried key + params; legacy plain-text content (and
 * anything unparsable) is returned verbatim.
 */
export function renderSystemMessage(content: string, t: TFunction): string {
  const token = parseToken(content);
  if (!token) return content;
  return t(token.i18nKey, token.params ?? {});
}
