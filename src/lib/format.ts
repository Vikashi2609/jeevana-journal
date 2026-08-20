const LABEL_RE =
  /^(\s*)((?:ACTIVITY|DAY|SESSION|EVENT|POINT|STEP|NOTE)\s*\d*\s*:|(?:LEARNING OUTCOME|OBJECTIVE|OBJECTIVES|CONCLUSION|INTRODUCTION|SUMMARY|HIGHLIGHTS|OUTCOME|AIM|THEME|REPORT|VENUE|DATE|CHIEF GUEST|ORGANISED BY|ORGANIZED BY|PARTICIPANTS|RESOURCE PERSON)\s*:)/i;

/**
 * Bolds leading labels such as "ACTIVITY 1:" without altering the user's text.
 * Applied at render time only — stored content stays untouched.
 */
export function autoBoldLabels(html: string): string {
  return html.replace(/(<(p|li|div)[^>]*>)([\s\S]*?)(<\/\2>)/gi, (full, open, _tag, inner, close) => {
    if (/^\s*<(strong|b)\b/i.test(inner)) return full;
    const m = inner.match(LABEL_RE);
    if (!m) return full;
    const rest = inner.slice(m[0].length);
    return `${open}${m[1]}<strong>${m[2]}</strong>${rest}${close}`;
  });
}

export function formatDate(ts: number): string {
  return new Date(ts).toLocaleString(undefined, {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export function plainText(html: string): string {
  return html
    .replace(/<[^>]+>/g, " ")
    .replace(/&nbsp;/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}