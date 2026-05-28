export const BIT_DOMAIN = 'bitmesra.ac.in';

export const normalizeEmail = (email) => String(email || '').trim().toLowerCase();

export const isBitEmail = (email) =>
  normalizeEmail(email).endsWith(`@${BIT_DOMAIN}`);

// Super-admin overrides — these emails bypass the @bitmesra.ac.in lock
// in Register and any client-side domain check. Keep tiny.
export const WHITELISTED_EMAILS = new Set([
  'amananshu2004@gmail.com',
]);

export const isWhitelisted = (email) =>
  WHITELISTED_EMAILS.has(normalizeEmail(email));
