export type EmailValidationResult =
  | { ok: true; normalizedEmail: string }
  | { ok: false; kind: "invalid" | "blocked"; message: string }
  | {
      ok: false;
      kind: "typo";
      message: string;
      suggestedEmail: string;
    };

const BLOCKED_DOMAINS = new Set([
  "example.com",
  "example.org",
  "example.net",
  "test.com",
  "test.org",
  "mailinator.com",
  "tempmail.com",
  "guerrillamail.com",
  "yopmail.com",
  "10minutemail.com",
]);

const BLOCKED_LOCAL_PARTS = new Set([
  "exapmle",
  "example",
  "test",
  "fake",
  "asdf",
  "qwerty",
  "aaa",
  "aaaa",
  "1234",
  "123456",
  "dummy",
  "noreply",
  "no-reply",
]);

const DOMAIN_TYPO_MAP: Record<string, string> = {
  "gmial.com": "gmail.com",
  "gmal.com": "gmail.com",
  "gamil.com": "gmail.com",
  "gnail.com": "gmail.com",
  "gmaill.com": "gmail.com",
  "gmail.co": "gmail.com",
  "yaho.com": "yahoo.com",
  "yahooo.com": "yahoo.com",
  "hotmal.com": "hotmail.com",
  "hotmial.com": "hotmail.com",
  "outlok.com": "outlook.com",
  "outllok.com": "outlook.com",
  "iclod.com": "icloud.com",
};

const BASIC_EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

function isBlockedDomain(domain: string): boolean {
  if (BLOCKED_DOMAINS.has(domain)) return true;
  for (const blocked of BLOCKED_DOMAINS) {
    if (domain.endsWith(`.${blocked}`)) return true;
  }
  return false;
}

/**
 * Validates an email address before calling Supabase Auth (signUp / magic link / signIn)
 * to prevent wasting Supabase email quota on fake, disposable, or mistyped addresses.
 */
export function validateAuthEmail(rawEmail: string): EmailValidationResult {
  const normalized = rawEmail.trim().toLowerCase();

  if (!normalized || !BASIC_EMAIL_RE.test(normalized)) {
    return {
      ok: false,
      kind: "invalid",
      message: "Please enter a valid work email address.",
    };
  }

  const atIdx = normalized.lastIndexOf("@");
  const localPart = normalized.slice(0, atIdx);
  const domain = normalized.slice(atIdx + 1);

  // Strip optional +tag when checking obvious dummy local parts (e.g. test+1@...)
  const baseLocal = localPart.split("+")[0].replace(/[^a-z0-9-]/g, "");

  if (isBlockedDomain(domain) || BLOCKED_LOCAL_PARTS.has(baseLocal)) {
    return {
      ok: false,
      kind: "blocked",
      message: "Please enter a real work email address.",
    };
  }

  const fixedDomain = DOMAIN_TYPO_MAP[domain];
  if (fixedDomain) {
    const suggestedEmail = `${localPart}@${fixedDomain}`;
    return {
      ok: false,
      kind: "typo",
      suggestedEmail,
      message: `Did you mean ${suggestedEmail}?`,
    };
  }

  return { ok: true, normalizedEmail: normalized };
}
